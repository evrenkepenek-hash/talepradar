import { createHash } from 'node:crypto';
import { CATEGORIES, SOURCES } from '../shared/constants.ts';
import { readerKind } from '../shared/source-info.ts';
import type { ScanOptions, Source, SourceId } from '../shared/types.ts';

export function validateOptions(input: unknown, sources: Source[] = SOURCES): ScanOptions {
  if (!input || typeof input !== 'object') throw new Error('Tarama seçenekleri eksik.');
  const o = input as Record<string, unknown>;
  if (!Array.isArray(o.sources) || !o.sources.length || o.sources.length > 30 || o.sources.some(s => !sources.some(x => x.id === s))) throw new Error('En az bir geçerli kaynak seçin (en fazla 30).');
  if (![1, 7, 30].includes(o.days as number)) throw new Error('Geçersiz tarih aralığı.');
  if (!Array.isArray(o.categories) || o.categories.some(c => !CATEGORIES.includes(c))) throw new Error('Geçersiz kategori.');
  if (typeof o.maxPages !== 'number' || !Number.isInteger(o.maxPages) || o.maxPages < 1 || o.maxPages > 3) throw new Error('Kaynak başına 1–3 liste sayfası taranabilir.');
  return { sources: [...new Set(o.sources)] as SourceId[], days: o.days as ScanOptions['days'], categories: o.categories as ScanOptions['categories'], maxPages: o.maxPages };
}

export function publicUrl(raw: unknown): URL {
  if (typeof raw !== 'string' || raw.length > 2000) throw new Error('Geçersiz bağlantı.');
  let u: URL;
  try { u = new URL(raw.trim()); } catch { throw new Error('https:// ile başlayan tam bir bağlantı girin.'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) throw new Error('Yalnızca standart HTTPS kaynak bağlantıları kullanılabilir.');
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') || /[\[\]:]/.test(host) || /^(?:localhost|.*\.(?:localhost|local|internal|lan|home|test|invalid))$/.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) throw new Error('Yalnızca herkese açık alan adları destekleniyor; yerel ağ ve IP adresleri kullanılamaz.');
  u.hostname = host;
  u.hash = '';
  return u;
}

export function sourceForUrl(raw: string, sources: Source[] = SOURCES) {
  const u = publicUrl(raw);
  const host = u.hostname === 'r10.net' ? 'www.r10.net' : u.hostname === 'www.wmaraci.com' ? 'wmaraci.com' : u.hostname;
  const source = sources.find(s => s.host === host || (s.host === 'r10.net' && host === 'www.r10.net') || (s.host === 'www.wmaraci.com' && host === 'wmaraci.com'));
  if (!source) throw new Error('Bu adres kayıtlı kaynaklar arasında değil. Önce Veri kaynakları bölümünden ekleyin.');
  u.hostname = host;
  return { source, url: u };
}

export function canonicalThreadUrl(raw: string, source?: Source): string {
  const resolved = sourceForUrl(raw, source ? [source] : SOURCES);
  const { url } = resolved;
  const kind = readerKind(source ?? resolved.source);
  if (kind === 'r10') {
    if (/^\/(?:profil|members|uyeler|uye|login|register|search)\//i.test(url.pathname)) throw new Error('Üye profili yerine bir konu bağlantısı girin.');
    if (!/^\/[a-z0-9-]+\/\d+-[^/]+\.html$/i.test(url.pathname)) throw new Error('Bir R10 konu bağlantısı girin.');
    url.pathname = url.pathname.replace(/-\d+\.html$/, '.html');
    url.search = '';
  } else if (kind === 'wmaraci') {
    if (!/^\/forum\/[a-z0-9-]+\/[^/]+-\d+\.html$/i.test(url.pathname)) throw new Error('Bir WM Aracı konu bağlantısı girin.');
    url.search = '';
  } else {
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(?:fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    url.searchParams.sort();
  }
  return url.href;
}

export function validateSource(input: unknown): Source {
  if (!input || typeof input !== 'object') throw new Error('Kaynak bilgileri eksik.');
  const value = input as Record<string, unknown>;
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 80) throw new Error('Kaynak adı 1–80 karakter olmalı.');
  const url = publicUrl(value.url);
  if (url.hostname === 'r10.net') url.hostname = 'www.r10.net';
  if (url.hostname === 'www.wmaraci.com') url.hostname = 'wmaraci.com';
  if (value.mode !== 'listing' && value.mode !== 'page') throw new Error('Liste veya tek sayfa türünü seçin.');
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') throw new Error('Geçersiz otomatik tarama tercihi.');
  if (value.id !== undefined && (typeof value.id !== 'string' || !/^custom-[a-f0-9]{24}$/.test(value.id))) throw new Error('Yalnız kendi eklediğiniz kaynakları düzenleyebilirsiniz.');
  const linkPath = typeof value.linkPath === 'string' ? value.linkPath.trim() : '';
  if (linkPath.length > 200 || (linkPath && (!linkPath.startsWith('/') || linkPath.startsWith('//') || /[?#\\\s]/.test(linkPath) || linkPath.split('/').includes('..')))) throw new Error('Bağlantı filtresi /ilanlar/ gibi bir site yolu olmalı.');
  return { id: (value.id as SourceId | undefined) ?? `custom-${createHash('sha256').update(url.href).digest('hex').slice(0, 24)}`, name: value.name.trim(), host: url.hostname, listingUrl: url.href, description: value.mode === 'page' ? 'Eklediğiniz tek sayfa' : 'Eklediğiniz ilan listesi', custom: true, mode: value.mode, linkPath, enabled: value.enabled !== false };
}

export function validId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9-]{16,64}$/.test(value)) throw new Error('Geçersiz kayıt.');
  return value;
}
