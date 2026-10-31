import { load } from 'cheerio';
import { canonicalThreadUrl, sourceForUrl } from './validation.ts';
import { parseDate } from './analysis.ts';
import type { ParsedPost } from './analysis.ts';
import type { Source } from '../shared/types.ts';
import { readerKind } from '../shared/source-info.ts';

export function listingUrl(source: Source, page: number): string {
  if (page === 1) return source.listingUrl;
  return readerKind(source) === 'r10' ? `${source.listingUrl}index${page}.html` : source.listingUrl.replace('.html', `-${page}.html`);
}

export function discover(html: string, base: string, source?: Source): string[] {
  const $ = load(html);
  const urls = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')!;
    try {
      const url = canonicalThreadUrl(new URL(href, base).href, source);
      if (new URL(url).origin === sourceForUrl(base, source ? [source] : undefined).url.origin) urls.add(url);
    } catch { /* Navigation, profiles, advertisements and external URLs are ignored. */ }
  });
  return [...urls].slice(0, 60);
}

export function parseThread(html: string, inputUrl: string, now = new Date(), configuredSource?: Source): ParsedPost {
  const url = canonicalThreadUrl(inputUrl, configuredSource);
  const source = configuredSource ?? sourceForUrl(url).source;
  const $ = load(html);
  $('script:not([type="application/ld+json"]),style,noscript').remove();
  const title = $('h1').first().text().trim() || $('title').first().text().replace(/\s*[-|]\s*(R10.net|WM Aracı).*$/i, '').trim();
  if (!title) throw new Error('Kaynakta ilan başlığı bulunamadı.');

  // Fail closed on unknown markup; never scan the entire page for contacts.
  const selectors = readerKind(source) === 'r10'
    ? ['.post .postContent', '[id^="post_message_"]', '.postbit-content .content', '[itemprop="articleBody"]', '.message-body .bbWrapper']
    : ['.post-card .post-content', '[id^="post_message_"]', '.post-content .post-message', '.postbit-content .content', '[itemprop="articleBody"]', '.message-body .bbWrapper'];
  const selector = selectors.find(s => $(s).length);
  if (!selector) throw new Error('İlan sahibinin mesaj alanı tanınamadı. Kaynak okuyucusu güncellenmeli.');
  const bodies = $(selector);
  const first = bodies.first();
  let wrapper: typeof first = first.parents('[id^="post_"]').filter((_, el) => !/^post_message_/.test($(el).attr('id') ?? '')).first();
  if (!wrapper.length) wrapper = first.closest('.post-card, .postbit, .post, .message, article, [itemtype*="DiscussionForumPosting"]').first();
  // Metadata is read only inside the first post, never from a later reply.
  const authorSelector = '.postUser .name a.uToggle, .userInfoBox a.name, .bigusername, .username, [itemprop="author"] [itemprop="name"], [itemprop="author"], .post-user-name';
  const author = wrapper.find(authorSelector).first().text().trim();
  let dateRaw = wrapper.find('time[datetime]').first().attr('datetime') ?? '';
  if (!dateRaw) dateRaw = wrapper.find('.post-date, .postdate, .date, .posthead, .post-header, .thead, [itemprop="datePublished"]').first().attr('content') ?? '';
  if (!dateRaw) dateRaw = wrapper.find('.head .left, .post-date, .postdate, .date, .posthead, .post-header, .thead').first().text().trim();

  const clean = (element: typeof first) => {
    const copy = element.clone();
    copy.find('blockquote,.quote,.bbcode_quote,.signature,.post-signature,.postbit-signature,script,style,noscript,[data-nosnippet]').remove();
    copy.find('br').replaceWith('\n');
    copy.find('p,div,li').append('\n');
    return copy;
  };
  const bodyNode = clean(first);
  const body = bodyNode.text().replace(/[\t ]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
  if (!body || body.length < 3) throw new Error('İlan metni boş veya erişime kapalı.');
  const links: string[] = [];
  bodyNode.find('a[href]').each((_, a) => {
    try { links.push(new URL($(a).attr('href')!, url).href); } catch { /* Ignore malformed links. */ }
  });
  const updates: string[] = [];
  bodies.slice(1).each((_, el) => {
    const node = $(el);
    let parent: typeof first = node.parents('[id^="post_"]').filter((_, p) => !/^post_message_/.test($(p).attr('id') ?? '')).first();
    if (!parent.length) parent = node.closest('.post-card, .postbit, .post, .message, article');
    const name = parent.find(authorSelector).first().text().trim();
    if (author && name === author) updates.push(clean(node).text().trim());
  });
  return { sourceId: source.id, url, title, author, body, links, publishedAt: parseDate(dateRaw, now), authorUpdates: updates, structurallyVerified: !!wrapper.length && !!author };
}
