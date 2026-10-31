import { load } from 'cheerio';
import { parseDate } from './analysis.ts';
import type { ParsedPost } from './analysis.ts';
import { canonicalThreadUrl, sourceForUrl } from './validation.ts';
import { BIONLUK_NOTE, isBionluk } from '../shared/source-info.ts';
import type { Source } from '../shared/types.ts';

const remove = 'script,style,noscript,nav,footer,aside,form,blockquote,.quote,.signature,.post-signature,.comments,.comment,[itemprop="comment"],[id^="comment"],.reviews,.review,.related,.sidebar,[role="dialog"]';

export function sourceContentNotice(source: Source, raw = source.listingUrl): string | null {
  const path = new URL(raw).pathname;
  if (isBionluk(source) && /^(?:\/|\/search\/?|\/freelancer-bul(?:\/.*)?|\/destek(?:\/.*)?|\/freelancer-olmak\/?)$/.test(path)) return BIONLUK_NOTE;
  return null;
}

export function discoverGeneric(html: string, base: string, source: Source): string[] {
  const $ = load(html);
  $(remove + ',header').remove();
  const main = $('main,[role="main"],#content').first();
  const scope = main.length ? main : $('body');
  const urls = new Set<string>();
  scope.find('a[href]').each((_, element) => {
    const node = $(element);
    if (/next|prev|last|first/.test(node.attr('rel') ?? '') || node.closest('.pagination,.pager').length) return;
    try {
      const raw = new URL(node.attr('href')!, base);
      if (/\.(?:pdf|zip|exe|png|jpg|jpeg|gif|svg|css|js|mp4)$/i.test(raw.pathname)) return;
      if (/\/(?:login|signin|giris|giris-yap|register|kayit|profil|profile|members|uye|privacy|gizlilik|iletisim|contact)(?:\/|$)/i.test(raw.pathname)) return;
      if (source.linkPath && !raw.pathname.startsWith(source.linkPath)) return;
      const url = canonicalThreadUrl(raw.href, source);
      if (url !== canonicalThreadUrl(base, source)) urls.add(url);
    } catch { /* Only links on the registered HTTPS origin are eligible. */ }
  });
  return [...urls].slice(0, 60);
}

export function nextGenericPage(html: string, current: string, source: Source): string | null {
  const $ = load(html);
  const next = $('a[rel="next"],link[rel="next"],a.next,.pagination a,.pager a').filter((_, el) => {
    const node = $(el);
    return node.attr('rel') === 'next' || node.hasClass('next') || /^(?:sonraki(?: sayfa)?|ileri|next|[›»→])$/i.test(node.text().trim());
  }).first().attr('href');
  if (!next) return null;
  try {
    const { url } = sourceForUrl(new URL(next, current).href, [source]);
    const initial = new URL(source.listingUrl);
    const prefix = initial.pathname.endsWith('/') ? initial.pathname : initial.pathname.slice(0, initial.pathname.lastIndexOf('/') + 1);
    if (url.pathname !== initial.pathname && !url.pathname.startsWith(prefix)) return null;
    return url.href === current ? null : url.href;
  } catch { return null; }
}

export function parseGeneric(html: string, input: string, source: Source, now = new Date()): ParsedPost {
  const notice = sourceContentNotice(source, input);
  if (notice) throw new Error(notice);
  const url = canonicalThreadUrl(input, source);
  const $ = load(html);
  $(remove).remove();
  let root = $('article,[itemtype*="DiscussionForumPosting"],[itemtype$="/Article"]').first();
  if (!root.length) root = $('main,[role="main"],#content').first();
  if (!root.length && $('h1,h2').length <= 1 && $('title').text().trim() && $('body').text().trim().length >= 80) root = $('body');
  if (!root.length) throw new Error('Tekil ilan metni bulunamadı. Sayfa giriş veya JavaScript gerektiriyor olabilir; başka bir ilan bağlantısı deneyin.');
  const title = root.find('h1,h2').first().text().trim() || $('h1').first().text().trim() || $('title').first().text().trim();
  const ownedBody = root.find('[itemprop="articleBody"],[data-post-body]').first();
  const content = ownedBody.length ? ownedBody : root.find('.entry-content,.post-content,.message-body').first();
  const node = (content.length ? content : root).clone();
  node.find('header,h1,h2,[itemprop="author"],.author,[rel="author"],time').remove();
  node.find('br').replaceWith('\n');
  node.find('p,div,li').append('\n');
  const body = node.text().replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').trim().slice(0, 30000);
  if (!title || body.length < 10) throw new Error('Başlık veya okunabilir ilan metni bulunamadı.');
  const author = root.find('[itemprop="author"] [itemprop="name"],[itemprop="author"],a[rel="author"],.author').first().text().trim().slice(0, 120);
  const published = root.find('[itemprop="datePublished"],time:not([itemprop="dateModified"]):not(.updated)').first();
  const rawDate = published.attr('datetime') || published.attr('content') || published.text();
  const links: string[] = [];
  node.find('a[href]').each((_, link) => { try { links.push(new URL($(link).attr('href')!, url).href); } catch { /* Malformed contact links are ignored. */ } });
  return { sourceId: source.id, url, title, author, body, links, publishedAt: parseDate(rawDate, now), authorUpdates: [], structurallyVerified: root.is('article,[itemtype*="DiscussionForumPosting"],[itemtype$="/Article"]') && !!ownedBody.length && !!author, manualReview: true };
}
