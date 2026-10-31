import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGeneric, nextGenericPage, discoverGeneric } from '../../src/core/generic-adapter.ts';
import { validateSource } from '../../src/core/validation.ts';
import { analyze } from '../../src/core/analysis.ts';
import { parseThread } from '../../src/core/adapters.ts';

const source = validateSource({ name: 'Örnek', url: 'https://clients.example.org/ilanlar/', mode: 'listing' });
const now = new Date('2026-10-31T12:00:00Z');

test('unknown ownership never assigns page/footer/comment contact details to a customer', () => {
  const parsed = parseGeneric('<main><h1>Web sitesi yaptırmak istiyorum</h1><p>Web sitesi yaptırmak istiyoruz. Sayfadaki adres: belirsiz@example.org</p><div class="comments">Satıcı: 0532 000 00 00</div><footer>iletisim@example.org</footer></main>', 'https://clients.example.org/ilanlar/42', source, now);
  const lead = analyze(parsed, 7, now)!;
  assert.equal(lead.qualification, 'review');
  assert.equal(lead.email, '');
  assert.equal(lead.phone, '');
  assert.equal(lead.publishedAt, null);
  assert.ok(!parsed.body.includes('iletisim@example.org'));
});

test('generic discovery keeps URL query identities and pagination stays on the source site', () => {
  assert.deepEqual(discoverGeneric('<main><a href="/ilanlar/?id=1">1</a><a href="/ilanlar/?id=2">2</a><a href="/ilanlar/?id=1&utm_source=x">1</a></main>', source.listingUrl, source), ['https://clients.example.org/ilanlar/?id=1', 'https://clients.example.org/ilanlar/?id=2']);
  assert.equal(nextGenericPage('<a rel="next" href="https://evil.example.org/?page=2">Next</a>', source.listingUrl, source), null);
});

test('custom R10 category URLs retain the source-specific first-author reader', () => {
  const custom = validateSource({ name: 'R10 farklı bölüm', url: 'https://www.r10.net/web-tasarim-is-verenler/', mode: 'listing' });
  const post = parseThread('<h1>Web sitesi yaptırılacak</h1><article id="post_1"><a class="bigusername">musteri</a><time datetime="2026-10-30T12:00:00Z"></time><div id="post_message_1">Web sitesi yaptırmak istiyorum. musteri@example.org</div></article>', 'https://www.r10.net/web-tasarim-is-verenler/1234567-ornek.html', now, custom);
  assert.equal(post.sourceId, custom.id);
  assert.equal(analyze(post, 7, now)?.qualification, 'qualified');
});

test('script-only pages fail explicitly rather than returning fake candidates', () => {
  assert.throws(() => parseGeneric('<title>Uygulama</title><script>load()</script><div id="root"></div>', source.listingUrl, source, now), /Tekil ilan/);
});

test('simple static pages with a single h2 can be read without inventing a customer demand', () => {
  const parsed = parseGeneric('<html><title>Example</title><body><div><h2>Example Domain</h2><p>This domain is for use in documentation examples without needing permission. Avoid use in operations. Learn more about example domains.</p></div></body></html>', source.listingUrl, source, now);
  assert.equal(parsed.title, 'Example Domain');
  assert.equal(parsed.structurallyVerified, false);
  assert.equal(analyze(parsed, 7, now), null);
  const plain = parseGeneric('<html><title>Example Domain</title><body><p>This domain is for use in documentation examples without needing permission. Avoid relying on it for application operations.</p></body></html>', source.listingUrl, source, now);
  assert.equal(plain.title, 'Example Domain');
  assert.equal(analyze(plain, 7, now), null);
});
