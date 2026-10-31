import { useState } from 'react';
import type { Source, SourceInput, SourceResult, SourceId } from '../shared/types.ts';
import { BIONLUK_NOTE, isBionluk, readerKind } from '../shared/source-info.ts';
import { Icon } from './Icon.tsx';

const initial: SourceInput = { name: '', url: '', mode: 'listing', linkPath: '', enabled: true };
export function SourceManager({ sources, results, disabled, onSave, onDelete, onScan, onOpen }: {
  sources: Source[]; results: SourceResult[]; disabled: boolean;
  onSave: (input: SourceInput) => Promise<boolean>; onDelete: (id: SourceId) => Promise<boolean>;
  onScan: (source: Source) => void; onOpen: (url: string) => void;
}) {
  const [form, setForm] = useState<SourceInput>(initial);
  const [editing, setEditing] = useState(false);
  const [removeId, setRemoveId] = useState<SourceId | null>(null);
  const bionluk = /(?:^|\/|\.)bionluk\.com(?:\/|$)/i.test(form.url);
  return <>
    <div className="page-heading"><div><div className="eyebrow">KEŞİF AĞINIZ</div><h1>Veri kaynakları</h1><p>Kendi URL’lerinizi ekleyin, kaynaklarınızı yönetin ve tek tek tarayın.</p></div><button className="button primary" disabled={disabled} onClick={() => { setForm(initial); setEditing(true); }}><Icon name="plus" size={17}/>URL kaynağı ekle</button></div>
    {editing && <section className="source-editor" aria-label="URL kaynağı formu"><div className="card-title"><h2>{form.id ? 'Kaynağı düzenle' : 'Yeni URL kaynağı'}</h2><button className="icon-button" aria-label="Kaynak formunu kapat" onClick={() => setEditing(false)}><Icon name="x"/></button></div>
      <form onSubmit={async event => { event.preventDefault(); if (await onSave(form)) { setEditing(false); setForm(initial); } }}>
        <div className="form-row"><label><span className="field-label">Kaynak adı</span><input className="text-input" required maxLength={80} value={form.name} placeholder="Örn. Müşteri talepleri" onChange={e => setForm({ ...form, name: e.target.value })}/></label><label><span className="field-label">Sayfa türü</span><select className="full" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value as 'listing' | 'page' })}><option value="listing">İlan listesi ve içindeki bağlantılar</option><option value="page">Tek bir ilan / sayfa</option></select></label></div>
        <label><span className="field-label">Başlangıç URL’si</span><input className="text-input" required type="url" maxLength={2000} value={form.url} placeholder="https://site.com/ilanlar/" onChange={e => setForm({ ...form, url: e.target.value })}/></label>
        {form.mode === 'listing' && <label><span className="field-label">İlan bağlantılarının yolu <span>İsteğe bağlı</span></span><input className="text-input" maxLength={200} value={form.linkPath} placeholder="/ilanlar/" onChange={e => setForm({ ...form, linkPath: e.target.value })}/><span className="field-help">Doldurursanız yalnız bu yolla başlayan aynı sitedeki bağlantılar incelenir.</span></label>}
        <label className="auto-source-option"><input type="checkbox" checked={form.enabled !== false} onChange={e => setForm({ ...form, enabled: e.target.checked })}/>6 saatlik otomatik taramaya dahil et</label>
        {bionluk && <div className="notice warning"><Icon name="alert" size={18}/><span>{BIONLUK_NOTE}</span></div>}
        <p className="field-help">Eklediğiniz siteler genel okuyucuyla incelenir. Kaynak yapısı doğrulanamayan talepler incelemeye ayrılır. Giriş isteyen veya yalnız JavaScript ile yüklenen içerikler okunamayabilir.</p>
        <div className="source-editor-actions"><button type="button" className="text-button" onClick={() => setForm({ ...form, name: 'Bionluk', url: 'https://bionluk.com/', mode: 'page', enabled: false, linkPath: '' })}>Bionluk adresini doldur</button><div><button type="button" className="button" onClick={() => setEditing(false)}>Vazgeç</button><button type="submit" className="button primary" disabled={disabled}>Kaynağı kaydet</button></div></div>
      </form>
    </section>}
    <div className="source-cards">{sources.map(source => {
      const result = results.find(r => r.sourceId === source.id);
      return <article className="source-detail-card" key={source.id}>
        <div className="source-card-top"><span className={`source-mark ${source.custom ? 'custom' : source.id}`}>{source.custom ? <Icon name="link"/> : source.id === 'r10' ? 'r10' : 'wm'}</span><span className={`badge ${result?.status === 'ok' ? 'mint' : result ? 'amber' : ''}`}>{result ? result.status === 'ok' ? 'Son tarama başarılı' : 'Kontrol gerekli' : 'Henüz taranmadı'}</span></div>
        <h2>{source.name}</h2><p className="source-address">{source.listingUrl}</p><div className="source-spec"><span>Tarama biçimi</span><strong>{source.mode === 'page' ? 'Tek sayfa' : 'İlan listesi'}</strong><span>Okuma yöntemi</span><strong>{readerKind(source) === 'generic' ? 'Genel okuyucu · İnceleme gerekli' : 'Kaynağa özel okuyucu'}</strong>{source.linkPath && <><span>Bağlantı yolu</span><strong>{source.linkPath}</strong></>}<span>Otomatik tarama</span><strong>{source.enabled === false ? 'Dahil değil' : 'Dahil'}</strong></div>
        {isBionluk(source) && <div className="notice warning"><span>{BIONLUK_NOTE}</span></div>}
        {result && <div className={`notice ${result.status === 'ok' ? '' : 'warning'}`}>{result.message}</div>}
        <div className="source-card-actions"><button className="button primary small" disabled={disabled} onClick={() => onScan(source)}><Icon name="radar" size={16}/>Bu kaynağı tara</button><button className="button small" disabled={disabled} onClick={() => onOpen(source.listingUrl)}>Siteyi aç<Icon name="external" size={14}/></button></div>
        {source.custom && <div className="source-edit-actions"><button className="text-button" disabled={disabled} onClick={() => { setForm({ id: source.id, name: source.name, url: source.listingUrl, mode: source.mode ?? 'listing', linkPath: source.linkPath ?? '', enabled: source.enabled !== false }); setEditing(true); }}>Düzenle</button><button className="text-button danger-text" disabled={disabled} onClick={() => setRemoveId(source.id)}>Kaynağı kaldır</button></div>}
        {removeId === source.id && <div className="delete-confirm"><p>Kaynak kaldırılacak. Daha önce bulunan adaylar ve notlarınız korunur.</p><div><button className="button small" onClick={() => setRemoveId(null)}>Vazgeç</button><button className="button danger small" disabled={disabled} onClick={async () => { if (await onDelete(source.id)) setRemoveId(null); }}>Kaynağı kaldır</button></div></div>}
      </article>;
    })}</div>
    <div className="explanation"><Icon name="globe"/><div><h3>Eklenen URL’ler nasıl taranır?</h3><p>Liste taramasında aynı sitedeki en fazla 60 ilan ve varsa en fazla 3 sonraki liste sayfası incelenir. Tek sayfa türünde yalnız eklediğiniz adres okunur. robots.txt kuralları ve erişim sınırları uygulanır.</p><p>Genel okuyucu ile bulunan talepler “İncelenecekler” bölümüne ayrılır. Mesaj sahipliği doğrulanamazsa iletişim bilgileri alınmaz. Kaynak hataları tarama geçmişinde görünür.</p></div></div>
  </>;
}
