import { setTimeout as sleep } from 'node:timers/promises';
import { sourceForUrl } from './validation.ts';
import { robotsPolicy } from './robots.ts';
import { publicFetch } from './public-fetch.ts';
import { SOURCES } from '../shared/constants.ts';
import type { Source } from '../shared/types.ts';

export class PublicReader {
  robots = new Map<string, string>();
  lastRequest = new Map<string, number>();
  readonly signal: AbortSignal;
  readonly fetcher: typeof fetch;
  readonly sources: Source[];
  constructor(signal: AbortSignal, fetcher: typeof fetch = publicFetch, sources: Source[] = SOURCES) { this.signal = signal; this.fetcher = fetcher; this.sources = sources; }

  async raw(raw: string, redirects = 0): Promise<{ status: number; text: string }> {
    const { url } = sourceForUrl(raw, this.sources);
    const response = await this.fetcher(url.href, {
      redirect: 'manual',
      signal: AbortSignal.any([this.signal, AbortSignal.timeout(15000)]),
      headers: { 'User-Agent': 'IzlekBot/0.1 (local customer-request research)', Accept: 'text/html,text/plain;q=0.9' },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      if (redirects >= 3) throw new Error('Kaynak çok fazla yönlendirme yaptı.');
      const location = response.headers.get('location');
      if (!location) throw new Error('Geçersiz kaynak yönlendirmesi.');
      const next = sourceForUrl(new URL(location, url).href, this.sources);
      if (next.url.origin !== url.origin) throw new Error('Kaynak dışına yönlendirme reddedildi.');
      const rules = this.robots.get(next.url.origin);
      if (rules !== undefined && !robotsPolicy(rules, next.url.href).allowed) throw new Error('Yönlendirme hedefi robots.txt tarafından engelleniyor.');
      return this.raw(next.url.href, redirects + 1);
    }
    if (response.status !== 200) { await response.body?.cancel(); return { status: response.status, text: '' }; }
    const kind = response.headers.get('content-type') ?? '';
    if (kind && !/text\/(html|plain)|application\/xhtml\+xml/i.test(kind)) { await response.body?.cancel(); throw new Error('Kaynak okunabilir bir sayfa döndürmedi.'); }
    if (Number(response.headers.get('content-length')) > 3_000_000) { await response.body?.cancel(); throw new Error('Kaynak sayfası boyut sınırını aşıyor.'); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Kaynak boş yanıt verdi.');
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 3_000_000) { await reader.cancel(); throw new Error('Kaynak sayfası boyut sınırını aşıyor.'); }
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);
    const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(kind)?.[1] ?? 'utf-8';
    let text: string;
    try { text = new TextDecoder(charset).decode(buffer); } catch { text = buffer.toString('utf8'); }
    // Normal pages can include Cloudflare's passive JS detection script.
    // Only visible challenge markup/text blocks collection. No challenge is solved or bypassed.
    const visible = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    if (/cf-chl-|just a moment\.\.\.|verify you are human|captcha-container|challenge-platform/i.test(visible)) throw new Error('Kaynak otomatik erişim doğrulaması istiyor. Tarama atlandı.');
    return { status: response.status, text };
  }

  async read(raw: string): Promise<string> {
    const { url } = sourceForUrl(raw, this.sources);
    if (!this.robots.has(url.origin)) {
      const result = await this.raw(new URL('/robots.txt', url).href);
      if (result.status !== 200 && result.status !== 404) throw new Error(`Kaynak erişim kuralları okunamadı (HTTP ${result.status}).`);
      this.robots.set(url.origin, result.text);
    }
    const policy = robotsPolicy(this.robots.get(url.origin)!, url.href);
    if (!policy.allowed) throw new Error('Kaynağın robots.txt kuralları bu sayfanın otomatik okunmasına izin vermiyor.');
    if (policy.delayMs > 60_000) throw new Error('Kaynak çok uzun bir tarama aralığı istiyor; bu oturumda atlandı.');
    const wait = policy.delayMs - (Date.now() - (this.lastRequest.get(url.origin) ?? 0));
    if (wait > 0) await sleep(wait, undefined, { signal: this.signal });
    this.lastRequest.set(url.origin, Date.now());
    const result = await this.raw(url.href);
    if (result.status === 429) throw new Error('Kaynak istek sınırına ulaşıldı. Daha sonra tekrar deneyin.');
    if ([401, 403].includes(result.status)) throw new Error('Kaynak otomatik erişimi reddetti.');
    if (result.status !== 200) throw new Error(`Kaynak yanıt vermedi (HTTP ${result.status}).`);
    return result.text;
  }
}
