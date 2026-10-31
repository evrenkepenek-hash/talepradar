import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { analyze, extractContacts, parseDate, refreshLead } from '../src/core/analysis.ts';
import type { ParsedPost } from '../src/core/analysis.ts';
import { csvCell, toCsv } from '../src/core/csv.ts';
import { Store } from '../src/core/database.ts';
import { canonicalThreadUrl, sourceForUrl, validateOptions } from '../src/core/validation.ts';
import { robotsPolicy } from '../src/core/robots.ts';
import { nextScanAt, scanIsDue, updatePreferences } from '../src/core/schedule.ts';
import type { Lead, ScanRun } from '../src/shared/types.ts';

const now = new Date('2026-10-30T12:00:00Z');
const post = (patch: Partial<ParsedPost> = {}): ParsedPost => ({
  sourceId: 'r10', url: 'https://www.r10.net/yazilim-kodlama-is-verenler/1234567-kurumsal-site.html',
  title: 'Kurumsal web sitesi yaptırılacak', author: 'ornek_musteri', body: 'Firmamıza web sitesi yaptırmak istiyoruz. Bütçe: 20.000 TL. İletişim: teklif@example.test',
  links: [], publishedAt: '2026-10-29T10:00:00+03:00', authorUpdates: [], structurallyVerified: true, ...patch,
});
const lead = (): Lead => analyze(post(), 7, now)!;
function removeTestDirectory(dir: string) {
  const resolved = path.resolve(dir);
  assert.ok(resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('izlek-test-'));
  rmSync(resolved, { recursive: true, force: true });
}

test('explicit buyer request is qualified with evidence, budget and contact', () => {
  const l = lead();
  assert.equal(l.qualification, 'qualified');
  assert.equal(l.email, 'teklif@example.test');
  assert.equal(l.budget, '20.000 TL');
  assert.match(l.evidence, /yaptırmak/);
  assert.equal(l.fullName, '');
  assert.equal(l.phone, '');
});
test('seller advertisements are not customers', () => {
  assert.equal(analyze(post({ title: 'Satılık kurumsal web sitesi', body: 'İhtiyacı olan müşteriler arıyorum.' }), 7, now), null);
  assert.equal(analyze(post({ title: 'Web sitesi yapıyoruz', body: 'Uygun fiyata web tasarım hizmeti veriyoruz.' }), 7, now), null);
});
test('staff recruitment is not a service request', () => {
  assert.equal(analyze(post({ title: 'Yazılımcı arıyoruz', body: 'Tam zamanlı maaşlı ekip arkadaşı arıyoruz. CV gönderin.' }), 7, now), null);
});
test('an unrelated purchase is not a software lead', () => {
  assert.equal(analyze(post({ title: 'Ofis için masa yaptırılacak', body: 'Bir marangoz arıyorum.' }), 7, now), null);
});
test('unknown or future publication dates require review', () => {
  assert.equal(analyze(post({ publishedAt: null }), 7, now)?.qualification, 'review');
  assert.equal(analyze(post({ publishedAt: '2026-12-01T00:00:00Z' }), 7, now)?.qualification, 'review');
});
test('rolling date range uses publication date, not discovery date', () => {
  assert.equal(analyze(post({ publishedAt: '2026-10-01T12:00:00Z' }), 30, now)?.qualification, 'qualified');
  assert.equal(analyze(post({ publishedAt: '2026-10-01T12:00:00Z' }), 7, now)?.qualification, 'stale');
  const later = new Date('2026-11-05T12:00:00Z');
  assert.equal(analyze(post({ publishedAt: '2026-10-01T12:00:00Z' }), 30, later)?.qualification, 'stale');
});
test('closing messages by the original author close the lead', () => {
  assert.equal(analyze(post({ authorUpdates: ['İş verildi. Konu kilit.'] }), 7, now)?.qualification, 'closed');
});
test('a replaced title/body still invalidates a previously found lead', () => {
  const old = lead();
  const closed = refreshLead(old, post({ title: 'Konu kilit', body: 'İş verildi.' }), 7, now);
  assert.equal(closed.qualification, 'closed');
  assert.equal(closed.email, '');
  const changed = refreshLead(old, post({ title: 'Düzenlendi', body: 'Mesaj kaldırıldı.' }), 7, now);
  assert.equal(changed.qualification, 'review');
});
test('unverified ownership cannot produce customer contact fields', () => {
  const l = analyze(post({ structurallyVerified: false }), 7, now)!;
  assert.equal(l.email, ''); assert.equal(l.phone, ''); assert.equal(l.qualification, 'review');
});
test('Turkish dates use Istanbul timezone and reject invalid calendar dates', () => {
  assert.equal(parseDate('29-10-2026, 17:45:00', now), '2026-10-29T14:45:00.000Z');
  assert.equal(parseDate('Bugün 13:00:00', now), '2026-10-30T10:00:00.000Z');
  assert.equal(parseDate('Dün 23:30', now), '2026-10-29T20:30:00.000Z');
  assert.equal(parseDate('31.02.2026', now), null);
});
test('contact normalization preserves international prefix', () => {
  assert.equal(extractContacts('İletişim 0532 000 00 00', []).phone, '+905320000000');
  assert.equal(extractContacts('', ['https://wa.me/905330000000']).phone, '+905330000000');
  assert.equal(extractContacts('', ['mailto:hello@example.test?subject=Teklif']).email, 'hello@example.test');
  assert.equal(extractContacts('Bütçe: 20000 TL', []).phone, '');
});
test('source URLs are limited to known HTTPS origins', () => {
  for (const url of ['http://www.r10.net/a', 'https://127.0.0.1/a', 'https://wmaraci.com.evil.test/a', 'https://user:secret@wmaraci.com/a', 'https://wmaraci.com:444/a', 'file:///C:/Windows']) assert.throws(() => sourceForUrl(url));
  assert.equal(sourceForUrl('https://r10.net/test').url.hostname, 'www.r10.net');
});
test('canonical links deduplicate page and tracking variants', () => {
  assert.equal(canonicalThreadUrl('https://www.r10.net/yazilim-kodlama-is-verenler/1234567-ornek-2.html?x=1#post1'), 'https://www.r10.net/yazilim-kodlama-is-verenler/1234567-ornek.html');
  assert.throws(() => canonicalThreadUrl('https://www.r10.net/members/123-test.html'));
});
test('scan options cap scope and reject malformed IPC input', () => {
  assert.throws(() => validateOptions({ sources: [], days: 7, categories: [], maxPages: 1 }));
  assert.throws(() => validateOptions({ sources: ['r10'], days: 365, categories: [], maxPages: 1 }));
  assert.throws(() => validateOptions({ sources: ['r10'], days: 7, categories: [], maxPages: 100 }));
  const options = validateOptions({ sources: ['r10', 'r10'], days: 7, categories: [], maxPages: 1 });
  assert.deepEqual(options.sources, ['r10']);
});
test('CSV escapes delimiters, quotes, newlines and formula prefixes', () => {
  assert.equal(csvCell('Merhaba; "dünya"\nYeni'), '"Merhaba; ""dünya""\nYeni"');
  for (const value of ['=SUM(1,2)', '+905320000000', '-1+2', '@SUM(A1)', '  =1', '\t=1', '＝1']) assert.ok(csvCell(value).startsWith('"\''));
  const l = lead();
  const csv = toCsv([l]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /"Talep";"Kategori";"Açıklama"/);
  assert.ok(csv.includes(l.evidence));
  assert.equal(l.email, 'teklif@example.test');
});
test('SQLite preserves notes/status on refresh, persists, excludes deleted URLs', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'izlek-test-'));
  const filename = path.join(dir, 'db.sqlite');
  let db = new Store(filename);
  try {
    const l = lead();
    assert.equal(db.upsert(l), true);
    db.update(l.id, { notes: 'Teklif gönderilecek', status: 'contacted' });
    assert.equal(db.upsert({ ...l, email: 'yenisi@example.test' }), false);
    assert.equal(db.get(l.id)?.notes, 'Teklif gönderilecek');
    assert.equal(db.get(l.id)?.status, 'contacted');
    db.close(); db = new Store(filename);
    assert.equal(db.get(l.id)?.email, 'yenisi@example.test');
    db.delete(l.id);
    assert.equal(db.exclusionCount(), 1);
    assert.equal(db.upsert(l), false);
    assert.equal(db.get(l.id), null);
    db.clearExclusions();
    assert.equal(db.upsert(l), true);
  } finally { db.close(); removeTestDirectory(dir); }
});
test('interrupted scan records recover as failed after restart', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'izlek-test-'));
  let db = new Store(path.join(dir, 'db.sqlite'));
  try {
    const run: ScanRun = { id: 'test-run', startedAt: now.toISOString(), finishedAt: null, status: 'running', checked: 4, found: 1, options: { sources: ['r10'], days: 7, categories: [], maxPages: 1 }, sources: [] };
    db.saveRun(run); db.close(); db = new Store(path.join(dir, 'db.sqlite'));
    assert.equal(db.runs()[0].status, 'failed');
    assert.equal(db.runs()[0].checked, 4);
  } finally { db.close(); removeTestDirectory(dir); }
});
test('robots disallow and longest allow rules are respected', () => {
  const robots = 'User-agent: *\nDisallow: /forum/\nAllow: /forum/public/\nCrawl-delay: 4';
  assert.equal(robotsPolicy(robots, 'https://wmaraci.com/forum/private/').allowed, false);
  assert.equal(robotsPolicy(robots, 'https://wmaraci.com/forum/public/thread').allowed, true);
  assert.equal(robotsPolicy(robots, 'https://wmaraci.com/forum/public/thread').delayMs, 4000);
  assert.equal(robotsPolicy('User-agent: *\nDisallow: /*.php$', 'https://www.r10.net/test.php').allowed, false);
});
test('specific robots agent group wins over wildcard', () => {
  const robots = 'User-agent: *\nAllow: /\nUser-agent: IzlekBot\nDisallow: /';
  assert.equal(robotsPolicy(robots, 'https://wmaraci.com/forum').allowed, false);
});
test('auto scan defaults off and only runs when due without another active scan', () => {
  const db = new Store(':memory:');
  try {
    const defaults = db.preferences();
    assert.equal(defaults.autoScan, false);
    const enabled = updatePreferences(defaults, { autoScan: true, autoDays: 30 }, now);
    assert.equal(enabled.nextAutoScanAt, '2026-10-30T18:00:00.000Z');
    assert.equal(scanIsDue(enabled, false, now), false);
    assert.equal(scanIsDue(enabled, false, new Date(nextScanAt(now))), true);
    assert.equal(scanIsDue(enabled, true, new Date(nextScanAt(now))), false);
    db.savePreferences(enabled);
    assert.equal(db.preferences().autoDays, 30);
    assert.equal(updatePreferences(enabled, { autoScan: false }).nextAutoScanAt, null);
    assert.throws(() => updatePreferences(enabled, { autoDays: 500 }));
  } finally { db.close(); }
});


test('SQL-style WM Aracı dates are Istanbul local time and ISO calendar dates must exist', () => {
  const now = new Date('2026-10-31T12:00:00Z');
  assert.equal(parseDate('2023-07-03 15:14:55', now), '2023-07-03T12:14:55.000Z');
  assert.equal(parseDate('2026-02-30T12:00:00Z', now), null);
  assert.equal(parseDate('2026-10-31 24:10:00', now), null);
});
