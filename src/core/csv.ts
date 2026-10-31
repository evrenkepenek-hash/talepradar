import type { Lead } from '../shared/types.ts';
import { QUALIFICATION_LABELS, STATUS_LABELS, SOURCES } from '../shared/constants.ts';

// Export-only display protection. Raw values in SQLite remain unchanged.
export function csvCell(value: unknown): string {
  let text = String(value ?? '').replace(/\u0000/g, '');
  if (/^[\s\uFEFF]*[=+\-@＝＋－＠]/u.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(leads: Lead[], delimiter: ',' | ';' = ';'): string {
  const headers = ['İşletme', 'Ad soyad', 'Kullanıcı adı', 'Şehir', 'Telefon', 'E-posta', 'Paylaşılan web sitesi', 'Talep', 'Kategori', 'Açıklama', 'Bütçe', 'Teslim', 'Kaynak', 'İlan bağlantısı', 'Yayın tarihi', 'Bulunma tarihi', 'Son kontrol', 'Doğrulama', 'Öncelik', 'Öncelik gerekçesi', 'İhtiyaç kanıtı', 'İletişim kaynağı', 'İletişim açıklaması', 'Uyarılar', 'Takip durumu', 'Notlar'];
  const rows = leads.map(l => [l.company, l.fullName, l.author, l.city, l.phone, l.email, l.website, l.title, l.category, l.summary, l.budget, l.deadline, l.sourceName ?? SOURCES.find(s => s.id === l.sourceId)?.name ?? l.sourceId, l.url, l.publishedAt, l.discoveredAt, l.checkedAt, QUALIFICATION_LABELS[l.qualification], l.priority, l.reasons.join(' | '), l.evidence, l.phone || l.email ? l.url : '', l.contactEvidence, l.warnings.join(' | '), STATUS_LABELS[l.status], l.notes]);
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(delimiter)).join('\r\n') + '\r\n';
}
