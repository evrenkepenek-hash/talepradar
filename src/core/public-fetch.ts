import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import type { LookupFunction } from 'node:net';
import { Readable } from 'node:stream';
import { publicUrl } from './validation.ts';

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || (b === 0 && [0, 2].includes(c)) || (b === 88 && c === 99))) || (a === 198 && ([18, 19].includes(b) || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (family === 6) {
    const canonical = new URL(`https://[${address}]/`).hostname.slice(1, -1);
    return /^[23][0-9a-f]{3}:/i.test(canonical) && !/^2001:(?:0*:|db8:|2:|10:|20:)/i.test(canonical) && !/^2002:|^3fff:/i.test(canonical);
  }
  return false;
}

export async function publicAddresses(hostname: string, resolver: (hostname: string, options: { all: true; verbatim: true }) => Promise<{ address: string; family: number }[]> = lookup) {
  const records = await resolver(hostname, { all: true, verbatim: true });
  if (!records.length || records.some(record => !isPublicAddress(record.address))) throw new Error('Kaynak yerel, özel veya ayrılmış bir ağ adresine yönleniyor; taranmadı.');
  return records;
}

export function pinnedLookup(address: { address: string; family: number }): LookupFunction {
  return (_hostname, options, callback) => options.all ? callback(null, [address]) : callback(null, address.address, address.family);
}

// Pin each connection to a freshly checked public DNS address. TLS still checks
// the original hostname. Redirect targets go through the same checks.
export const publicFetch: typeof fetch = async (input, init = {}) => {
  init.signal?.throwIfAborted();
  const url = publicUrl(input instanceof Request ? input.url : String(input));
  const addresses = await publicAddresses(url.hostname);
  init.signal?.throwIfAborted();
  const address = addresses.find(a => a.family === 4) ?? addresses[0];
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  return new Promise<Response>((resolve, reject) => {
    const req = request(url, { method: 'GET', headers, signal: init.signal ?? undefined, lookup: pinnedLookup(address) }, response => {
      const resultHeaders = new Headers();
      for (let i = 0; i < response.rawHeaders.length; i += 2) resultHeaders.append(response.rawHeaders[i], response.rawHeaders[i + 1]);
      const status = response.statusCode ?? 502;
      const empty = [204, 205, 304].includes(status);
      if (empty) response.resume();
      resolve(new Response(empty ? null : Readable.toWeb(response) as ReadableStream<Uint8Array>, { status, headers: resultHeaders }));
    });
    req.on('error', reject);
    req.end();
  });
};
