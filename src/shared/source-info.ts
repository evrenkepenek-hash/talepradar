import type { Source } from './types.ts';

export function readerKind(source: Source): 'r10' | 'wmaraci' | 'generic' {
  if (['r10.net', 'www.r10.net'].includes(source.host)) return 'r10';
  if (['wmaraci.com', 'www.wmaraci.com'].includes(source.host)) return 'wmaraci';
  return 'generic';
}

export function isBionluk(source: Pick<Source, 'host'>): boolean {
  return source.host === 'bionluk.com' || source.host.endsWith('.bionluk.com');
}

export const BIONLUK_NOTE = 'Bionluk’un açık iş ilanları freelancerların hizmet satışlarıdır. Alıcı isteklerini görüntülemek için hesapta aktif bir freelancer ilanı gerekir. Bu uygulama hesaba giriş yapmaz; açık hizmet ilanlarını müşteri olarak toplamaz.';
