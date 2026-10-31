import type { Category, Source } from './types.ts';

export const SOURCES: Source[] = [
  { id: 'r10', name: 'R10', host: 'www.r10.net', listingUrl: 'https://www.r10.net/yazilim-kodlama-is-verenler/', description: 'Yazılım & Kodlama İş Verenler' },
  { id: 'wmaraci', name: 'WM Aracı', host: 'wmaraci.com', listingUrl: 'https://wmaraci.com/forum/is-verenler.html', description: 'İş Verenler' },
];
export const CATEGORIES: Category[] = ['Web sitesi', 'E-ticaret', 'Özel yazılım', 'Mobil uygulama', 'Entegrasyon'];
export const STATUS_LABELS = { new: 'Yeni', contacted: 'İletişime geçildi', won: 'İş alındı', dismissed: 'Uygun değil' } as const;
export const QUALIFICATION_LABELS = { qualified: 'Talep doğrulandı', review: 'İnceleme gerekli', closed: 'Talep kapandı', stale: 'Güncelliğini yitirdi' } as const;
