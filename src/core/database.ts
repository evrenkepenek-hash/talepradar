import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes } from 'node:crypto';
import type { Lead, LeadStatus, Preferences, ScanRun, Source } from '../shared/types.ts';
import { SOURCES } from '../shared/constants.ts';
import { validateSource } from './validation.ts';

export class Store {
  db: DatabaseSync;
  constructor(filename: string) {
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;
      CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, url TEXT UNIQUE NOT NULL, data TEXT NOT NULL, discovered_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, data TEXT NOT NULL, started_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS exclusions (hash TEXT PRIMARY KEY, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sources (id TEXT PRIMARY KEY, url TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
      PRAGMA user_version=2;`);
    // A killed application cannot leave a permanently running job.
    for (const run of this.runs()) if (run.status === 'running') this.saveRun({ ...run, status: 'failed', finishedAt: new Date().toISOString() });
  }
  list(): Lead[] { return (this.db.prepare('SELECT data FROM leads ORDER BY discovered_at DESC').all() as { data: string }[]).map(r => JSON.parse(r.data)); }
  get(id: string): Lead | null {
    const row = this.db.prepare('SELECT data FROM leads WHERE id=?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  }
  upsert(lead: Lead): boolean {
    if (this.isExcluded(lead.url)) return false;
    const previous = this.get(lead.id);
    const merged = previous ? { ...lead, discoveredAt: previous.discoveredAt, status: previous.status, notes: previous.notes } : lead;
    this.db.prepare('INSERT INTO leads(id,url,data,discovered_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(merged.id, merged.url, JSON.stringify(merged), merged.discoveredAt);
    return !previous;
  }
  update(id: string, patch: { status?: LeadStatus; notes?: string }) {
    const lead = this.get(id);
    if (!lead) throw new Error('Kayıt bulunamadı.');
    this.db.prepare('UPDATE leads SET data=? WHERE id=?').run(JSON.stringify({ ...lead, ...patch }), id);
  }
  delete(id: string) {
    const lead = this.get(id);
    if (!lead) return;
    this.db.exec('BEGIN');
    try {
      this.db.prepare('INSERT OR IGNORE INTO exclusions(hash,created_at) VALUES(?,?)').run(this.hash(lead.url), new Date().toISOString());
      this.db.prepare('DELETE FROM leads WHERE id=?').run(id);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  hash(url: string) { return createHash('sha256').update(url).digest('hex'); }
  isExcluded(url: string) { return !!this.db.prepare('SELECT 1 FROM exclusions WHERE hash=?').get(this.hash(url)); }
  exclusionCount(): number { return Number((this.db.prepare('SELECT count(*) AS n FROM exclusions').get() as { n: number }).n); }
  clearExclusions() { this.db.exec('DELETE FROM exclusions'); }
  sources(): Source[] {
    const custom = (this.db.prepare('SELECT data FROM sources ORDER BY rowid').all() as { data: string }[]).map(row => JSON.parse(row.data) as Source);
    return [...SOURCES, ...custom];
  }
  saveSource(input: unknown): Source {
    const source = validateSource(input);
    const all = this.sources();
    const hasId = typeof input === 'object' && input !== null && 'id' in input && input.id !== undefined;
    if (!hasId) source.id = `custom-${randomBytes(12).toString('hex')}`;
    const existing = all.find(s => s.id === source.id);
    if (hasId && !existing?.custom) throw new Error('Düzenlenecek özel kaynak bulunamadı.');
    if (!hasId && existing) throw new Error('Bu URL zaten kayıtlı. Mevcut kaynağı düzenleyebilirsiniz.');
    if (all.some(s => s.listingUrl === source.listingUrl && s.id !== source.id)) throw new Error('Bu URL zaten kayıtlı.');
    if (!existing && all.length >= 30) throw new Error('En fazla 28 özel kaynak eklenebilir.');
    this.db.prepare('INSERT INTO sources(id,url,data) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET url=excluded.url,data=excluded.data').run(source.id, source.listingUrl, JSON.stringify(source));
    return source;
  }
  deleteSource(id: unknown) {
    if (typeof id !== 'string' || !this.sources().some(s => s.id === id && s.custom)) throw new Error('Yalnız kendi eklediğiniz kaynakları kaldırabilirsiniz.');
    this.db.prepare('DELETE FROM sources WHERE id=?').run(id);
  }
  preferences(): Preferences {
    const row = this.db.prepare('SELECT value FROM settings WHERE key=?').get('preferences') as { value: string } | undefined;
    return row ? JSON.parse(row.value) : { autoScan: false, autoDays: 7, delimiter: ';', nextAutoScanAt: null };
  }
  savePreferences(value: Preferences) { this.db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('preferences', JSON.stringify(value)); }
  saveRun(run: ScanRun) { this.db.prepare('INSERT INTO runs(id,data,started_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(run.id, JSON.stringify(run), run.startedAt); }
  runs(): ScanRun[] { return (this.db.prepare('SELECT data FROM runs ORDER BY started_at DESC LIMIT 100').all() as { data: string }[]).map(r => JSON.parse(r.data)); }
  close() { this.db.close(); }
}
