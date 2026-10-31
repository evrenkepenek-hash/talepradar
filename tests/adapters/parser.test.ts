import test from 'node:test';
import assert from 'node:assert/strict';
import { parseThread, discover } from '../../src/core/adapters.ts';
import { analyze } from '../../src/core/analysis.ts';

// Synthetic fixture: deliberately NOT a copy of a live customer's personal data.
const url = 'https://www.r10.net/yazilim-kodlama-is-verenler/1234567-web-sitesi.html';
const now = new Date('2026-10-30T12:00:00Z');
const html = `<html><h1>Web sitesi yaptırılacak</h1>
<article id="post_1"><header class="posthead">29-10-2026, 12:00:00</header><a class="bigusername">musteri_ornek</a>
<div id="post_message_1">Web sitesi yaptırmak istiyorum. İletişim: musteri@example.test
<blockquote>Eski bir mesaj: alinti@example.test</blockquote></div>
<div class="signature">imza@example.test</div></article>
<article id="post_2"><a class="bigusername">hizmet_saticisi</a><time datetime="2026-10-30T10:00:00+03:00"></time>
<div id="post_message_2">Ben yapabilirim. 0532 000 00 00 satici@example.test</div></article></html>`;

test('only original author content supplies contacts and publication date', () => {
  const parsed = parseThread(html, url, now);
  const lead = analyze(parsed, 7, now)!;
  assert.equal(parsed.author, 'musteri_ornek');
  assert.equal(lead.email, 'musteri@example.test');
  assert.equal(lead.phone, '');
  assert.equal(lead.publishedAt, '2026-10-29T09:00:00.000Z');
  assert.ok(!parsed.body.includes('alinti@example.test'));
  assert.ok(!parsed.body.includes('imza@example.test'));
  assert.ok(!parsed.body.includes('satici@example.test'));
});
test('original author updates close a request, other authors cannot', () => {
  const withSellerClosure = html.replace('Ben yapabilirim.', 'İş verildi. Konu kilit.');
  assert.equal(analyze(parseThread(withSellerClosure, url, now), 7, now)?.qualification, 'qualified');
  const withAuthorClosure = withSellerClosure.replace('hizmet_saticisi', 'musteri_ornek');
  assert.equal(analyze(parseThread(withAuthorClosure, url, now), 7, now)?.qualification, 'closed');
});
test('unknown markup fails instead of extracting the whole page', () => {
  assert.throws(() => parseThread('<h1>Web sitesi yaptırılacak</h1><p>telefon ve satıcı yanıtları</p>', url, now), /tanınamadı/);
});
test('listing discovery deduplicates threads and rejects non-thread links', () => {
  const listing = `<a href="${url}">Talep</a><a href="${url.replace('.html', '-2.html')}">2</a><a href="https://evil.test/a">Reklam</a><a href="/members/test.html">Üye</a>`;
  assert.deepEqual(discover(listing, 'https://www.r10.net/yazilim-kodlama-is-verenler/'), [url]);
});


// Markup observed on WM Aracı, with all text and identities replaced by synthetic values.
test('WM Aracı post-card markup uses first author/date and excludes later seller contacts', () => {
  const wmUrl = 'https://wmaraci.com/forum/is-verenler/web-sitesi-yaptirilacak-700885.html';
  const wmHtml = '<h1>Web sitesi yaptırılacak</h1><div class="content post-card" id="post3754517"><div class="top"><time datetime="2023-07-03 15:14:55">03.07.2023 15:14</time></div><div class="subjectDetail"><div class="userInfoBox"><a class="name">ornek_musteri</a></div><div class="c post-content">Web sitesi yaptırmak istiyorum. musteri@example.test</div></div></div><div class="content post-card" id="post3779613"><time datetime="2026-10-30 15:00:00">Bugün</time><div class="userInfoBox"><a class="name">ornek_satici</a></div><div class="c post-content">Yapabilirim satici@example.test</div></div>';
  const parsed = parseThread(wmHtml, wmUrl, now);
  assert.equal(parsed.author, 'ornek_musteri');
  assert.equal(parsed.publishedAt, '2023-07-03T12:14:55.000Z');
  assert.equal(parsed.structurallyVerified, true);
  assert.deepEqual(parsed.authorUpdates, []);
  assert.equal(analyze(parsed, 30, now)?.qualification, 'stale');
  assert.equal(analyze(parsed, 30, now)?.email, 'musteri@example.test');
  assert.ok(!parsed.body.includes('satici@example.test'));
});


// R10's current class names, with synthetic content and identities.
test('current R10 markup reads only the first post and original publication time', () => {
  const html = '<h1>Web sitesi yaptırılacak</h1><li class="post" id="edit1"><div id="post1"><div class="head"><div class="left">29-10-2026, 12:00:00</div></div><div class="postUser"><div class="name"><a class="uToggle">ornek_musteri</a></div></div><div class="postContent userMessageSize">Web sitesi yaptırmak istiyorum.</div></div></li><li class="post" id="edit2"><div class="head"><div class="left">30-10-2026, 11:00:00</div></div><div class="postUser"><div class="name"><a class="uToggle">ornek_satici</a></div></div><div class="postContent">Ben yapabilirim. 0532 000 00 00 satici@example.test</div></li>';
  const parsed = parseThread(html, url, now);
  assert.equal(parsed.author, 'ornek_musteri');
  assert.equal(parsed.publishedAt, '2026-10-29T09:00:00.000Z');
  assert.equal(parsed.structurallyVerified, true);
  assert.equal(analyze(parsed, 7, now)?.phone, '');
  assert.equal(analyze(parsed, 7, now)?.email, '');
});
test('real R10 profile links are not discovered as threads', () => {
  assert.deepEqual(discover('<a href="/profil/17871-ornek.html">Üye</a><a href="'+url+'">Talep</a>', 'https://www.r10.net/yazilim-kodlama-is-verenler/'), [url]);
});
