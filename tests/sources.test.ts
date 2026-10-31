import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Store } from '../src/core/database.ts';
import { publicUrl, validateSource, canonicalThreadUrl, validateOptions } from '../src/core/validation.ts';
import { isPublicAddress, publicAddresses, pinnedLookup } from '../src/core/public-fetch.ts';
import { PublicReader } from '../src/core/network.ts';
import { scan } from '../src/core/scanner.ts';
import { analyze } from '../src/core/analysis.ts';
import { toCsv } from '../src/core/csv.ts';
import type { Lead } from '../src/shared/types.ts';

const source = validateSource({ name: 'Örnek talepler', url: 'https://clients.example.org/ilanlar/', mode: 'listing', linkPath: '/ilanlar/', enabled: true });
const now = new Date('2026-10-31T12:00:00Z');
const options = { sources: [source.id], days: 7 as const, categories: [], maxPages: 3 };
const article = '<article><h1>Web sitesi yaptırmak istiyorum</h1><a itemprop="author">Örnek müşteri</a><time itemprop="datePublished" datetime="2026-10-30T12:00:00+03:00"></time><div itemprop="articleBody">Firmamıza web sitesi yaptırmak istiyoruz. Bütçe: 20.000 TL. musteri@example.org</div><div class="comments">Satıcı: 0532 000 00 00 satici@example.org</div></article>';

test('custom URL configuration validates names, modes and public HTTPS origins', () => {
  assert.ok(source.id.startsWith('custom-'));
  assert.equal(source.linkPath, '/ilanlar/');
  assert.deepEqual(validateOptions(options, [source]).sources, [source.id]);
  assert.throws(() => validateOptions(options));
  for (const url of ['file:///C:/Windows', 'http://example.org', 'https://127.1', 'https://0x7f000001', 'https://[::1]', 'https://printer.local', 'https://user:secret@example.org', 'https://example.org:8443']) assert.throws(() => publicUrl(url));
  assert.throws(() => validateSource({ name: '', url: source.listingUrl, mode: 'listing' }));
  assert.throws(() => validateSource({ name: 'a', url: source.listingUrl, mode: 'listing', linkPath: '//evil.org' }));
  assert.throws(() => validateSource({ name: 'a', url: source.listingUrl, mode: 'listing', id: 'r10' }));
});

test('generic canonical URLs preserve functional parameters and remove tracking', () => {
  assert.equal(canonicalThreadUrl('https://clients.example.org/ilanlar/?id=42&utm_source=x#comments', source), 'https://clients.example.org/ilanlar/?id=42');
  assert.notEqual(canonicalThreadUrl('https://clients.example.org/ilanlar/?id=42', source), canonicalThreadUrl('https://clients.example.org/ilanlar/?id=43', source));
});

test('DNS checks reject private and reserved IPv4 and IPv6 including mixed DNS answers', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '198.18.0.1', '192.0.2.5', '203.0.113.3', '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', '2001:0db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ['1.1.1.1', '8.8.8.8', '203.0.114.5', '198.51.101.8', '2606:4700:4700::1111']) assert.equal(isPublicAddress(ip), true, ip);
  const resolver = (async () => [{ address: '1.1.1.1', family: 4 }, { address: '127.0.0.1', family: 4 }]) as Parameters<typeof publicAddresses>[1];
  await assert.rejects(publicAddresses('clients.example.org', resolver), /özel veya ayrılmış/);
});

test('pinned HTTPS lookup supports Node automatic address selection as well as single-address mode', () => {
  const address = { address: '1.1.1.1', family: 4 };
  const lookup = pinnedLookup(address);
  lookup('clients.example.org', { all: true }, (error, result) => { assert.equal(error, null); assert.deepEqual(result, [address]); });
  lookup('clients.example.org', {}, (error, result, family) => { assert.equal(error, null); assert.equal(result, address.address); assert.equal(family, 4); });
});

test('custom sources persist across restart and version-one databases migrate without losing leads', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'izlek-test-sources-'));
  const filename = path.join(dir, 'db.sqlite');
  const legacy = analyze({ sourceId: 'r10', url: 'https://www.r10.net/yazilim-kodlama-is-verenler/1234567-ornek.html', title: 'Web sitesi yaptırmak istiyorum', body: 'Web sitesi yaptırmak istiyoruz.', author: 'Örnek', links: [], authorUpdates: [], publishedAt: '2026-10-30T12:00:00Z', structurallyVerified: true }, 7, now)!;
  legacy.notes = 'Eski sürümdeki not';
  const old = new DatabaseSync(filename);
  old.exec('CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE leads(id TEXT PRIMARY KEY,url TEXT UNIQUE NOT NULL,data TEXT NOT NULL,discovered_at TEXT NOT NULL); PRAGMA user_version=1;');
  old.prepare('INSERT INTO leads VALUES(?,?,?,?)').run(legacy.id, legacy.url, JSON.stringify(legacy), legacy.discoveredAt);
  old.prepare('INSERT INTO settings VALUES(?,?)').run('preferences', JSON.stringify({ autoScan: false, autoDays: 30, delimiter: ',', nextAutoScanAt: null }));
  old.close();
  let db = new Store(filename);
  try {
    assert.equal(db.get(legacy.id)?.notes, 'Eski sürümdeki not');
    const saved = db.saveSource({ name: source.name, url: source.listingUrl, mode: 'listing', linkPath: '/ilanlar/' });
    const lead = analyze({ sourceId: saved.id, url: 'https://clients.example.org/ilanlar/42', title: 'Web sitesi yaptırmak istiyorum', body: 'Web sitesi yaptırmak istiyoruz.', author: 'Örnek', links: [], authorUpdates: [], publishedAt: '2026-10-30T12:00:00Z', structurallyVerified: true }, 7, now)!;
    db.upsert({ ...lead, sourceName: saved.name }); db.update(lead.id, { notes: 'Korunacak not' });
    assert.throws(() => db.saveSource({ name: 'Tekrar', url: source.listingUrl, mode: 'page' }), /zaten/);
    const edited = db.saveSource({ id: saved.id, name: 'Yeni ad', url: source.listingUrl, mode: 'page', enabled: false });
    assert.equal(edited.id, saved.id);
    db.close(); db = new Store(filename);
    assert.equal(db.get(legacy.id)?.notes, 'Eski sürümdeki not');
    assert.equal(db.sources().find(s => s.id === saved.id)?.enabled, false);
    assert.equal(db.preferences().autoDays, 30);
    assert.equal(db.get(lead.id)?.notes, 'Korunacak not');
    assert.throws(() => db.deleteSource('r10'));
    db.deleteSource(saved.id);
    assert.equal(db.sources().length, 2);
    assert.equal(db.get(lead.id)?.sourceName, source.name);
    assert.ok(toCsv(db.list()).includes(source.name));
  } finally {
    db.close();
    assert.ok(path.resolve(dir).startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(dir).startsWith('izlek-test-'));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('end-to-end custom list follows bounded same-site pagination, filters links and stores review leads', async () => {
  const requested: string[] = [];
  const listing = '<main><a href="/ilanlar/42">Talep</a><a href="/ilanlar/42?utm_source=x">Tekrar</a><a href="/profil/musteri">Profil</a><a href="https://other.example.org/ilanlar/43">Harici</a><a rel="next" href="/ilanlar/?page=2">Sonraki</a></main>';
  const pages = new Map([[source.listingUrl, listing], ['https://clients.example.org/ilanlar/?page=2', '<main><a href="/ilanlar/43">Diğer talep</a></main>'], ['https://clients.example.org/ilanlar/42', article], ['https://clients.example.org/ilanlar/43', article.replace('musteri@example.org', 'ikinci@example.org')]]);
  const leads: Lead[] = [];
  const result = await scan({ options, sources: [source] }, new AbortController().signal, m => { if (m.type === 'lead') leads.push(m.lead); }, { read: async url => { requested.push(url); const page = pages.get(url); assert.ok(page, url); return page; } }, now);
  assert.equal(result.checked, 2);
  assert.equal(result.sources[0].status, 'ok');
  assert.equal(leads.length, 2);
  assert.ok(leads.every(l => l.qualification === 'review' && l.sourceName === source.name));
  assert.equal(leads[0].email, 'musteri@example.org');
  assert.equal(leads[0].phone, '');
  assert.ok(!requested.some(u => /profil|other\.example/.test(u)));
});

test('single-page sources are read once and aborts stop before requests', async () => {
  let reads = 0;
  const input = { options, sources: [{ ...source, mode: 'page' as const }] };
  const reader = { read: async () => { reads++; return article; } };
  await scan(input, new AbortController().signal, () => {}, reader, now);
  assert.equal(reads, 1);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(scan(input, controller.signal, () => {}, reader, now));
  assert.equal(reads, 1);
});

test('Bionluk public seller catalogue is reported as unavailable for buyer-demand collection', async () => {
  const bionluk = validateSource({ name: 'Bionluk', url: 'https://bionluk.com/', mode: 'page' });
  let reads = 0;
  const result = await scan({ sources: [bionluk], options: { ...options, sources: [bionluk.id] } }, new AbortController().signal, () => {}, { read: async () => { reads++; return '<main>Ben web sitesi yapabilirim</main>'; } });
  assert.equal(result.found, 0);
  assert.equal(result.sources[0].status, 'error');
  assert.match(result.sources[0].message, /Alıcı isteklerini/);
  assert.equal(reads, 0);
});

test('custom reader refuses redirects to unregistered origins and honours robots', async () => {
  const requests: string[] = [];
  const reader = new PublicReader(new AbortController().signal, async input => { requests.push(String(input)); return new Response('', { status: 302, headers: { location: 'https://other.example.org/private' } }); }, [source]);
  await assert.rejects(reader.raw(source.listingUrl), /kayıtlı/);
  assert.equal(requests.length, 1);
  const blocked = new PublicReader(new AbortController().signal, async () => new Response('User-agent: *\nDisallow: /'), [source]);
  await assert.rejects(blocked.read(source.listingUrl), /robots/);
});

test('tracked single-page URLs still close existing canonical leads outside a category filter', async () => {
  const tracked = validateSource({ name: 'Tek ilan', url: 'https://clients.example.org/ilanlar/?id=42&utm_source=list', mode: 'page' });
  const previous = analyze({ sourceId: tracked.id, url: 'https://clients.example.org/ilanlar/?id=42', title: 'Web sitesi yaptırmak istiyorum', body: 'Web sitesi yaptırmak istiyorum.', author: 'Örnek', links: [], authorUpdates: [], publishedAt: '2026-10-30T12:00:00Z', structurallyVerified: true }, 7, now)!;
  const updated: Lead[] = [];
  const result = await scan({ sources: [tracked], existing: [previous], options: { sources: [tracked.id], days: 7, categories: ['Mobil uygulama'], maxPages: 1 } }, new AbortController().signal, m => { if (m.type === 'lead') updated.push(m.lead); }, { read: async () => '<article><h1>Düzenlendi</h1><p>İş verildi. Talebimiz tamamlandı.</p></article>' }, now);
  assert.equal(result.sources[0].status, 'ok');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, previous.id);
  assert.equal(updated[0].qualification, 'closed');
});

test('editing a source URL does not prevent adding its former URL again', () => {
  const store = new Store(':memory:');
  try {
    const first = store.saveSource({ name: 'İlk', url: 'https://clients.example.org/ilk/', mode: 'listing' });
    store.saveSource({ id: first.id, name: 'Taşınan', url: 'https://clients.example.org/yeni/', mode: 'listing' });
    const second = store.saveSource({ name: 'Eski adres', url: 'https://clients.example.org/ilk/', mode: 'listing' });
    assert.notEqual(first.id, second.id);
    assert.equal(store.sources().length, 4);
    assert.throws(() => store.saveSource({ name: 'Tekrar', url: 'https://clients.example.org/ilk/', mode: 'page' }), /zaten/);
  } finally { store.close(); }
});
