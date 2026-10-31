import test from 'node:test';
import assert from 'node:assert/strict';
import { PublicReader } from '../src/core/network.ts';

const fetcher = (fn: (url: string) => Response): typeof fetch => (async (url: string | URL | Request) => fn(String(url))) as typeof fetch;

test('blocked robots prevents reading the target page', async () => {
  const requested: string[] = [];
  const reader = new PublicReader(new AbortController().signal, fetcher(url => { requested.push(url); return new Response('User-agent: *\nDisallow: /'); }));
  await assert.rejects(reader.read('https://www.r10.net/yazilim-kodlama-is-verenler/'), /robots/);
  assert.equal(requested.length, 1);
  assert.ok(requested[0].endsWith('/robots.txt'));
});
test('inaccessible robots does not silently authorize collection', async () => {
  const reader = new PublicReader(new AbortController().signal, fetcher(() => new Response('', { status: 403 })));
  await assert.rejects(reader.read('https://www.r10.net/test'), /kuralları okunamadı/);
});
test('redirect to local or unknown origins is rejected', async () => {
  const reader = new PublicReader(new AbortController().signal, fetcher(() => new Response('', { status: 302, headers: { location: 'https://127.0.0.1/private' } })));
  await assert.rejects(reader.raw('https://www.r10.net/test'), /yerel ağ/);
});
test('rate-limit and human verification are explicit failures', async () => {
  const limited = new PublicReader(new AbortController().signal, fetcher(url => url.endsWith('robots.txt') ? new Response('') : new Response('', { status: 429 })));
  await assert.rejects(limited.read('https://wmaraci.com/forum'), /istek sınırına/);
  const challenge = new PublicReader(new AbortController().signal, fetcher(() => new Response('<html>Just a moment... challenge-platform</html>')));
  await assert.rejects(challenge.raw('https://wmaraci.com/forum'), /doğrulaması/);
});
test('HTML response is bounded and non-HTML payloads are rejected', async () => {
  const huge = new PublicReader(new AbortController().signal, fetcher(() => new Response('x', { headers: { 'content-length': '4000000', 'content-type': 'text/html' } })));
  await assert.rejects(huge.raw('https://wmaraci.com/forum'), /boyut sınırını/);
  const binary = new PublicReader(new AbortController().signal, fetcher(() => new Response('binary', { headers: { 'content-type': 'application/octet-stream' } })));
  await assert.rejects(binary.raw('https://wmaraci.com/forum'), /okunabilir/);
});


test('passive Cloudflare scripts do not block an ordinary HTML page', async () => {
  const page = '<html><title>İş talepleri</title><h1>Talepler</h1><script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script></html>';
  const reader = new PublicReader(new AbortController().signal, async input => new Response(String(input).endsWith('/robots.txt') ? 'User-agent: *\nAllow: /' : page, { headers: { 'content-type': 'text/html' } }));
  assert.equal(await reader.read('https://www.r10.net/yazilim-kodlama-is-verenler/'), page);
});
