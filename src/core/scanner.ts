import { PublicReader } from './network.ts';
import { discover, listingUrl, parseThread } from './adapters.ts';
import { discoverGeneric, nextGenericPage, parseGeneric, sourceContentNotice } from './generic-adapter.ts';
import { analyze, refreshLead } from './analysis.ts';
import { readerKind } from '../shared/source-info.ts';
import type { Lead, ScanOptions, Source, SourceResult } from '../shared/types.ts';

export interface ScanInput { options: ScanOptions; sources: Source[]; url?: string; existing?: Lead[] }
type Message = { type: 'lead'; lead: Lead } | { type: 'progress'; checked: number; found: number; message: string; sourceId?: string };

export async function scan(input: ScanInput, signal: AbortSignal, emit: (message: Message) => void, suppliedReader?: Pick<PublicReader, 'read'>, now = new Date()) {
  let checked = 0;
  let found = 0;
  const results: SourceResult[] = [];
  const reader = suppliedReader ?? new PublicReader(signal, undefined, input.sources);
  const existing = new Map((input.existing ?? []).map(l => [l.url, l]));
  const progress = (message: string, sourceId?: string) => emit({ type: 'progress', checked, found, message, sourceId });
  for (const source of input.sources.filter(s => input.options.sources.includes(s.id))) {
    signal.throwIfAborted();
    let sourceChecked = 0;
    let sourceMatched = 0;
    let errors = 0;
    let lastError = '';
    const fail = (error: unknown) => { errors++; lastError = error instanceof Error ? error.message : 'Kaynak okunamadı.'; };
    const generic = readerKind(source) === 'generic';
    try {
      const notice = sourceContentNotice(source, input.url ?? source.listingUrl);
      if (notice) throw new Error(notice);
      const urls = new Set<string>();
      if (input.url) urls.add(input.url);
      else if (source.mode === 'page') urls.add(source.listingUrl);
      else {
        for (const old of [...existing.values()].filter(l => l.sourceId === source.id).slice(0, 20)) urls.add(old.url);
        let address: string | null = source.listingUrl;
        const visited = new Set<string>();
        for (let page = 1; page <= input.options.maxPages && address && !visited.has(address); page++) {
          signal.throwIfAborted();
          visited.add(address);
          progress(`${source.name}: ${page}. liste sayfası okunuyor…`, source.id);
          try {
            const html = await reader.read(address);
            const discovered = generic ? discoverGeneric(html, address, source) : discover(html, address, source);
            if (!discovered.length) throw new Error('Liste sayfasında ilan bağlantısı bulunamadı. URL veya bağlantı yolu filtresini kontrol edin.');
            for (const url of discovered) urls.add(url);
            address = generic ? nextGenericPage(html, address, source) : listingUrl(source, page + 1);
          } catch (error) { fail(error); break; }
        }
      }
      for (const url of [...urls].slice(0, 60)) {
        signal.throwIfAborted();
        try {
          progress(`${source.name}: ilan ve yayın tarihi kontrol ediliyor…`, source.id);
          const html = await reader.read(url);
          const post = generic ? parseGeneric(html, url, source, now) : parseThread(html, url, now, source);
          checked++; sourceChecked++;
          const old = existing.get(post.url);
          const lead = old ? refreshLead(old, post, input.options.days, now) : analyze(post, input.options.days, now);
          if (lead && (old || !input.options.categories.length || input.options.categories.includes(lead.category)) && (['qualified', 'review'].includes(lead.qualification) || old)) {
            found++; sourceMatched++;
            emit({ type: 'lead', lead: { ...lead, sourceName: source.name } });
          }
        } catch (error) {
          fail(error);
          if (/erişim|robots|HTTP 429|istek sınır|doğrulaması|özel veya ayrılmış/.test(lastError) || errors >= 5) break;
        }
      }
    } catch (error) { fail(error); }
    signal.throwIfAborted();
    results.push({ sourceId: source.id, sourceName: source.name, status: errors ? (sourceChecked ? 'partial' : 'error') : 'ok', checked: sourceChecked, matched: sourceMatched, message: errors ? `${errors} sayfa okunamadı. ${lastError}` : `${sourceChecked} ilan incelendi; ${sourceMatched} kayıt işlendi.${generic ? ' Genel okuyucu sonuçları incelemeye ayrıldı.' : ''}` });
  }
  progress('Kaynak kontrolleri tamamlandı.');
  return { checked, found, sources: results };
}
