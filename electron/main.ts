import { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, session, shell, utilityProcess } from 'electron';
import type { IpcMainInvokeEvent, UtilityProcess } from 'electron';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Store } from '../src/core/database.ts';
import { toCsv } from '../src/core/csv.ts';
import { canonicalThreadUrl, publicUrl, sourceForUrl, validId, validateOptions } from '../src/core/validation.ts';
import { publicAddresses } from '../src/core/public-fetch.ts';
import { nextScanAt, scanIsDue, updatePreferences } from '../src/core/schedule.ts';
import type { Lead, LeadStatus, Progress, ScanOptions, ScanRun, SourceResult } from '../src/shared/types.ts';

protocol.registerSchemesAsPrivileged([{ scheme: 'izlek', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
// Keep the existing data location when changing the visible product name.
app.setPath('userData', process.env.IZLEK_DATA_DIR ? path.resolve(process.env.IZLEK_DATA_DIR) : path.join(app.getPath('appData'), 'Izlek'));
if (!app.requestSingleInstanceLock()) app.quit();

let win: BrowserWindow | null = null;
let store: Store;
let worker: UtilityProcess | null = null;
let active: ScanRun | null = null;
let progress: Progress | null = null;
let scheduleTimer: ReturnType<typeof setInterval> | null = null;
const devUrl = !app.isPackaged && process.env.IZLEK_DEV_URL === 'http://127.0.0.1:5173' ? process.env.IZLEK_DEV_URL : null;

function push(message: string, checked = active?.checked ?? 0, found = active?.found ?? 0) {
  progress = { runId: active?.id ?? progress?.runId ?? '', running: !!active, checked, found, message };
  if (win && !win.isDestroyed()) win.webContents.send('izlek:progress', progress);
}

function finish(status: ScanRun['status'], message: string, sources: SourceResult[] = []) {
  if (!active) return;
  active.status = status;
  active.finishedAt = new Date().toISOString();
  active.sources = sources;
  store.saveRun(active);
  const { checked, found } = active;
  const endingWorker = worker;
  worker = null;
  active = null;
  push(message, checked, found);
  endingWorker?.kill();
}

function start(options: ScanOptions, url?: string): string {
  if (active) throw new Error('Bir tarama zaten çalışıyor. Önce tamamlanmasını bekleyin veya durdurun.');
  const run: ScanRun = { id: randomUUID(), startedAt: new Date().toISOString(), finishedAt: null, status: 'running', checked: 0, found: 0, options, sources: [] };
  active = run;
  store.saveRun(run);
  push('Kaynaklara bağlanılıyor…');
  try {
    const child = utilityProcess.fork(path.join(__dirname, 'worker.cjs'), [], { serviceName: 'TalepRadar kaynak tarayıcısı', stdio: 'pipe' });
    worker = child;
    child.on('message', (message: { type: string; lead?: Lead; checked?: number; message?: string; sources?: SourceResult[] }) => {
      if (worker !== child || !active) return;
      if (message.type === 'lead' && message.lead) {
        if (store.upsert(message.lead)) active.found++;
        store.saveRun(active);
      } else if (message.type === 'progress') {
        active.checked = message.checked ?? active.checked;
        push(message.message ?? 'İlanlar kontrol ediliyor…');
      } else if (message.type === 'done') {
        active.checked = message.checked ?? active.checked;
        const sources = message.sources ?? [];
        const success = sources.filter(s => s.status === 'ok').length;
        const status = success === sources.length && sources.length ? 'completed' : sources.every(s => s.status === 'error') ? 'failed' : 'partial';
        finish(status, status === 'completed' ? 'Tarama tamamlandı.' : 'Tarama bitti. Kaynak durumlarını kontrol edin.', sources);
      } else if (message.type === 'fatal') finish('failed', message.message ?? 'Tarama tamamlanamadı.');
    });
    child.on('exit', code => { if (worker === child && active) finish('failed', `Tarama işlemi beklenmedik şekilde kapandı (${code}).`); });
    child.postMessage({ options, url, sources: store.sources().filter(s => options.sources.includes(s.id)), existing: store.list().filter(l => l.status !== 'dismissed' && !['closed', 'stale'].includes(l.qualification)).sort((a, b) => a.checkedAt.localeCompare(b.checkedAt)) });
    return run.id;
  } catch (error) { finish('failed', 'Tarayıcı başlatılamadı.'); throw error; }
}

function trusted(event: IpcMainInvokeEvent) {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame) throw new Error('Geçersiz uygulama isteği.');
  const url = event.senderFrame.url;
  if (!(url.startsWith('izlek://app/') || (devUrl && new URL(url).origin === devUrl))) throw new Error('Geçersiz uygulama kaynağı.');
}

function handle(channel: string, handler: (...args: any[]) => unknown) {
  ipcMain.handle(channel, (event, ...args) => { trusted(event); return handler(...args); });
}

function setupHandlers() {
  handle('izlek:snapshot', () => ({ version: app.getVersion(), leads: store.list(), runs: store.runs(), sources: store.sources(), progress, excludedCount: store.exclusionCount(), preferences: store.preferences() }));
  handle('izlek:start', (input: unknown) => start(validateOptions(input, store.sources())));
  handle('izlek:save-source', (input: unknown) => {
    if (active) throw new Error('Kaynakları değiştirmeden önce taramanın bitmesini bekleyin.');
    return store.saveSource(input);
  });
  handle('izlek:delete-source', (id: unknown) => {
    if (active) throw new Error('Kaynağı kaldırmadan önce taramanın bitmesini bekleyin.');
    store.deleteSource(id);
  });
  handle('izlek:cancel', () => finish('cancelled', 'Tarama durduruldu. Bulunan kayıtlar korundu.'));
  handle('izlek:update', (id: unknown, input: unknown) => {
    const key = validId(id);
    if (!input || typeof input !== 'object') throw new Error('Geçersiz güncelleme.');
    const patch = input as Record<string, unknown>;
    const safe: { notes?: string; status?: LeadStatus } = {};
    if (patch.notes !== undefined) { if (typeof patch.notes !== 'string' || patch.notes.length > 5000) throw new Error('Not en fazla 5.000 karakter olabilir.'); safe.notes = patch.notes; }
    if (patch.status !== undefined) { if (!['new', 'contacted', 'won', 'dismissed'].includes(String(patch.status))) throw new Error('Geçersiz durum.'); safe.status = patch.status as LeadStatus; }
    store.update(key, safe);
  });
  handle('izlek:delete', (id: unknown) => store.delete(validId(id)));
  handle('izlek:clear-exclusions', () => store.clearExclusions());
  handle('izlek:preferences', (input: unknown) => store.savePreferences(updatePreferences(store.preferences(), input)));
  handle('izlek:import', (url: string, days: unknown) => {
    if (active) throw new Error('Bir tarama zaten çalışıyor.');
    if (![1, 7, 30].includes(days as number)) throw new Error('Geçersiz tarih aralığı.');
    const safe = publicUrl(url);
    let source;
    try { source = sourceForUrl(safe.href, store.sources()).source; }
    catch { source = store.saveSource({ name: safe.hostname, url: safe.href, mode: 'page', enabled: false }); }
    const canonical = canonicalThreadUrl(safe.href, source);
    return start(validateOptions({ sources: [source.id], days, categories: [], maxPages: 1 }, store.sources()), canonical);
  });
  handle('izlek:open', async (url: string) => {
    const safe = publicUrl(url);
    await publicAddresses(safe.hostname);
    await shell.openExternal(safe.href);
  });
  handle('izlek:export', async (ids: unknown, delimiter: unknown) => {
    if (!Array.isArray(ids) || ids.length > 10000 || !ids.length) throw new Error('Dışa aktarılacak kayıtları seçin.');
    if (delimiter !== ',' && delimiter !== ';') throw new Error('Geçersiz CSV ayıracı.');
    const keys = [...new Set(ids.map(validId))];
    const leads = keys.map(id => store.get(id)).filter((l): l is Lead => !!l);
    if (!leads.length) throw new Error('Seçilen kayıtlar bulunamadı.');
    const result = await dialog.showSaveDialog(win!, { title: 'Müşteri adaylarını dışa aktar', defaultPath: `talepradar-adaylar-${new Date().toISOString().slice(0, 10)}.csv`, filters: [{ name: 'CSV tablosu', extensions: ['csv'] }] });
    if (result.canceled || !result.filePath) return { cancelled: true, count: 0 };
    await writeFile(result.filePath, toCsv(leads, delimiter), 'utf8');
    return { cancelled: false, count: leads.length, path: result.filePath };
  });
}

async function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 960, minWidth: 1050, minHeight: 720, title: 'TalepRadar', icon: path.join(__dirname, app.isPackaged ? '../dist/brand/talepradar.ico' : '../public/brand/talepradar.ico'), backgroundColor: '#f5f7f9', show: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, spellcheck: false } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.on('closed', () => { win = null; });
  win.webContents.on('did-fail-load', (_event, code, description) => console.error('TalepRadar arayüzü yüklenemedi:', code, description));
  win.webContents.on('render-process-gone', (_event, details) => console.error('TalepRadar arayüzü kapandı:', details.reason));
  if (devUrl) await win.loadURL(devUrl); else await win.loadURL('izlek://app/index.html');
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  await mkdir(app.getPath('userData'), { recursive: true });
  store = new Store(path.join(app.getPath('userData'), 'izlek.sqlite'));
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  const root = path.resolve(__dirname, '../dist');
  protocol.handle('izlek', request => {
    const url = new URL(request.url);
    const target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
    if (url.host !== 'app' || (target !== root && !target.startsWith(root + path.sep))) return new Response('Forbidden', { status: 403 });
    return net.fetch(pathToFileURL(target).href);
  });
  setupHandlers();
  scheduleTimer = setInterval(() => {
    const preferences = store.preferences();
    if (!scanIsDue(preferences, !!active)) return;
    store.savePreferences({ ...preferences, nextAutoScanAt: nextScanAt() });
    try { start({ sources: store.sources().filter(s => s.enabled !== false).map(s => s.id), categories: [], days: preferences.autoDays, maxPages: 1 }); }
    catch { push('Otomatik tarama başlatılamadı. Tarama geçmişini kontrol edin.'); }
  }, 30_000);
  await createWindow();
}).catch(error => { dialog.showErrorBox('TalepRadar başlatılamadı', error instanceof Error ? error.message : String(error)); app.quit(); });

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => { if (active && store) finish('cancelled', 'Uygulama kapatıldı.'); });
app.on('will-quit', () => { if (scheduleTimer) clearInterval(scheduleTimer); store?.close(); });
