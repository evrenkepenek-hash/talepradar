import { createHash } from 'node:crypto';
import type { Category, Lead, SourceId } from '../shared/types.ts';

export function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

export function parseDate(value: string | null | undefined, now = new Date()): string | null {
  if (!value) return null;
  const text = value.trim().replace(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/, '$1T$2+03:00');
  const calendar = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (calendar) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = calendar;
    const check = new Date(Date.UTC(+year, +month - 1, +day));
    if (check.getUTCFullYear() !== +year || check.getUTCMonth() + 1 !== +month || check.getUTCDate() !== +day || +hour > 23 || +minute > 59 || +second > 59) return null;
  }
  let date: Date;
  if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(text)) {
    date = new Date(text.length === 10 ? `${text}T00:00:00+03:00` : text);
  } else {
    const local = text.match(/(?:^|\s)(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (local) {
      const [, day, month, year, hour = '0', minute = '0', second = '0'] = local;
      const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}+03:00`;
      date = new Date(iso);
      const check = new Date(date.getTime() + 3 * 3600_000);
      if (check.getUTCDate() !== +day || check.getUTCMonth() + 1 !== +month) return null;
    } else {
      const relative = normalize(text).match(/\b(bugun|dun)[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (!relative) return null;
      const istanbul = new Date(now.getTime() + 3 * 3600_000);
      if (relative[1] === 'dun') istanbul.setUTCDate(istanbul.getUTCDate() - 1);
      date = new Date(`${istanbul.toISOString().slice(0, 10)}T${relative[2].padStart(2, '0')}:${relative[3]}:${relative[4] ?? '00'}+03:00`);
    }
  }
  if (!Number.isFinite(date.getTime()) || date.getTime() > now.getTime() + 5 * 60_000) return null;
  return date.toISOString();
}

export interface ParsedPost {
  sourceId: SourceId;
  url: string;
  title: string;
  author: string;
  body: string;
  links: string[];
  publishedAt: string | null;
  authorUpdates: string[];
  structurallyVerified: boolean;
  manualReview?: boolean;
}

const closedPattern = /\b(is (verildi|alinmistir|tamamlandi)|anlasma saglandi|anlasildi|konu (kilit|kapan)|cozuldu|talep iptal|ihtiyac (kalmadi|kalmamistir))\b/;
const servicePattern = /\b(web\s*(site|tasarim)|site(si|mi|mizi|miz|ye|nin)?\b|yazilim|yazilimci|otomasyon|entegrasyon|e[ -]?ticaret|uygulama|wordpress|php|python|api\b|panel|frontend|backend|gelistirici|program)/;
const intentPattern = /\b(yaptir\w*|yazdir\w*|gelistir\w* ist\w*|(?:firma|yazilimci|gelistirici|uzman|freelance|freelancer|birini|birisi|arkadas) ar(?:iyorum|iyoruz|an(?:iyor|maktadir))|ihtiyac(?:im|imiz|imizdir|i)? (?:var|olan)|teklif(?:lerinizi|lerinizi de|leri|lerinizi ve| almak) bekli|yapabilecek|kurabilecek|entegre edecek|duzenleyecek|duzelt(?:ebilecek|ecek)|kurulacak|alinacak)\b/;
const hiringPattern = /\b(maas|maasli|sigortali|sgk|tam zamanli|full[ -]?time|personel|eleman|is basvurusu|cv(?:nizi)?|ekip arkadas(?:i|lari)|stajyer)\b/;
const sellerPattern = /\b(hizmet(?:i|lerimizi|lerimiz)? (?:sunuyor|veriyor)|site(?:si|leri)? (?:yapiyorum|yapiyoruz)|satilik|referanslarim(?:iz)?|musteri ariyorum|uygun fiyat(?:a|li) .*yap(?:iyorum|iyoruz))\b/;

export function isClosed(post: ParsedPost): boolean {
  return closedPattern.test(normalize(`${post.title} ${post.body}`)) || post.authorUpdates.some(t => closedPattern.test(normalize(t))) || /^kilit(?:t+)?[.!\s]*$/.test(normalize(post.body));
}

export function refreshLead(previous: Lead, post: ParsedPost, days: number, now = new Date()): Lead {
  const current = analyze(post, days, now);
  if (current) return current;
  const closed = isClosed(post);
  return { ...previous, title: post.title, summary: post.body.slice(0, 1200), evidence: post.body.slice(0, 600), checkedAt: now.toISOString(), qualification: closed ? 'closed' : 'review', priority: 0, phone: '', email: '', contactEvidence: '', reasons: [], warnings: [closed ? 'İlan sahibi talebin kapandığını belirtiyor.' : 'Önceki açık talep artık doğrulanamıyor; yeniden inceleyin.'] };
}

export function categorize(text: string): Category {
  const t = normalize(text);
  if (/entegrasyon|entegre|\bapi\b/.test(t)) return 'Entegrasyon';
  if (/mobil|android|ios|flutter/.test(t)) return 'Mobil uygulama';
  if (/e[ -]?ticaret|eticaret|woocommerce|shopify/.test(t)) return 'E-ticaret';
  if (/web|site|wordpress|landing/.test(t)) return 'Web sitesi';
  return 'Özel yazılım';
}

export function extractContacts(body: string, links: string[]): { phone: string; email: string; evidence: string } {
  const email = body.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? '';
  const phoneCandidates = [...body.matchAll(/(?<!\d)(?:\+?90[\s().-]*)?0?[2-5]\d{2}[\s().-]*\d{3}[\s().-]*\d{2}[\s().-]*\d{2}(?!\d)/g)].map(m => m[0]);
  for (const link of links) {
    try {
      const u = new URL(link);
      if (u.hostname === 'wa.me') phoneCandidates.push(u.pathname.slice(1));
      if (['api.whatsapp.com', 'wa.me'].includes(u.hostname) && u.searchParams.get('phone')) phoneCandidates.push(u.searchParams.get('phone')!);
      if (u.protocol === 'tel:') phoneCandidates.push(u.pathname);
    } catch { /* Invalid links are not contacts. */ }
  }
  const normalized = phoneCandidates.map(p => {
    let digits = p.replace(/\D/g, '');
    if (digits.startsWith('90') && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
    return /^[2-5]\d{9}$/.test(digits) ? `+90${digits}` : '';
  }).filter(Boolean);
  const mailLink = links.find(l => /^mailto:[^?]+@[^?]+\.[^?]+/i.test(l));
  const foundEmail = email || (mailLink ? mailLink.slice(7).split('?')[0] : '');
  const phone = normalized[0] ?? '';
  return { phone, email: foundEmail, evidence: phone || foundEmail ? 'İlan sahibinin kendi mesajında paylaşıldı. Numaranın aktifliği ve e-posta teslim edilebilirliği test edilmedi.' : '' };
}

export function analyze(post: ParsedPost, days: number, now = new Date()): Lead | null {
  const title = normalize(post.title);
  const content = normalize(`${post.title} ${post.body}`);
  if (!servicePattern.test(content)) return null;
  // A contact from a reply must never qualify the original author.
  if (!intentPattern.test(content) || hiringPattern.test(content) || sellerPattern.test(title)) return null;
  const closed = isClosed(post);
  const publishedAt = parseDate(post.publishedAt, now);
  const age = publishedAt ? (now.getTime() - new Date(publishedAt).getTime()) / 86400_000 : null;
  const stale = age !== null && age > days;
  const contacts = post.structurallyVerified ? extractContacts(post.body, post.links) : { phone: '', email: '', evidence: '' };
  const warnings: string[] = [];
  if (post.manualReview) warnings.push('Eklediğiniz site genel okuyucuyla incelendi. Talebin bağlamını ve ilan sahibini kaynak üzerinden kontrol edin.');
  if (!publishedAt) warnings.push('İlanın yayın tarihi doğrulanamadı.');
  if (!post.structurallyVerified) warnings.push('İlan sahibi ve mesaj yapısı doğrulanamadı; iletişim bilgileri alınmadı.');
  if (!contacts.phone && !contacts.email) warnings.push('İlan sahibine ait açık telefon veya e-posta bulunamadı. Kaynak üzerinden iletişim kurulabilir.');
  if (closed) warnings.push('İlan sahibi talebin kapandığını belirtiyor.');
  if (stale) warnings.push('İlan, seçilen tarih aralığının dışında.');
  const qualification = closed ? 'closed' : stale ? 'stale' : !publishedAt || !post.structurallyVerified || post.manualReview ? 'review' : 'qualified';
  const evidence = post.body.split(/(?<=[.!?])\s+|\n+/).find(s => intentPattern.test(normalize(s))) ?? post.title;
  const budget = post.body.match(/(?:bütçe(?:m|miz)?|bütçe\s*aralığı)\s*[:=]?\s*([\d.,]+(?:\s*[-–]\s*[\d.,]+)?\s*(?:TL|₺|TRY|USD|EUR|dolar|euro))/i)?.[1] ?? '';
  const deadline = post.body.match(/(?:teslim(?:\s*tarihi|\s*süresi)?|son\s*tarih)\s*[:=]\s*([^\n.!?]{3,70})/i)?.[1]?.trim() ?? '';
  const fullName = post.body.match(/(?:ad\s*soyad|adım\s*soyadım)\s*:\s*([^\n,;.!?]{3,60})/i)?.[1]?.trim() ?? '';
  const company = post.body.match(/(?:firma\s*adı|şirket\s*adı)\s*:\s*([^\n,;.!?]{2,100})/i)?.[1]?.trim() ?? '';
  const city = post.body.match(/(?:şehir|il)\s*:\s*([^\n,;.!?]{2,30})/i)?.[1]?.trim() ?? '';
  let website = '';
  for (const link of post.links) {
    try {
      const u = new URL(link);
      if (u.protocol === 'https:' && !/(?:^|\.)(r10\.net|wmaraci\.com|wa\.me|whatsapp\.com)$/.test(u.hostname)) { website = u.href; break; }
    } catch { /* Not a website. */ }
  }
  const reasons = ['Açık yazılım veya web hizmeti talebi bulundu.'];
  if (publishedAt) reasons.push(age! <= 1 ? 'Son 24 saat içinde yayınlandı.' : `Yaklaşık ${Math.floor(age!)} gün önce yayınlandı.`);
  if (contacts.phone || contacts.email) reasons.push('İlan sahibinin mesajında iletişim kanalı var.');
  if (budget) reasons.push('Müşteri bütçesini belirtmiş.');
  const priority = qualification === 'qualified' ? Math.min(100, 50 + (age! <= 1 ? 25 : age! <= 7 ? 15 : 5) + (contacts.phone || contacts.email ? 15 : 0) + (budget ? 10 : 0)) : 0;
  return {
    id: createHash('sha256').update(post.url).digest('hex').slice(0, 24),
    sourceId: post.sourceId, url: post.url, title: post.title.slice(0, 300), author: post.author.slice(0, 120), company, fullName,
    phone: contacts.phone, email: contacts.email, website, city, category: categorize(content), summary: post.body.slice(0, 1200), evidence: evidence.slice(0, 600), contactEvidence: contacts.evidence,
    budget, deadline, publishedAt, discoveredAt: now.toISOString(), checkedAt: now.toISOString(), qualification, priority, reasons, warnings, status: 'new', notes: '',
  };
}
