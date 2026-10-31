import type { Preferences } from '../shared/types.ts';
import { Icon } from './Icon.tsx';

export function AutoScanSettings({ preferences, disabled, onChange }: { preferences: Preferences; disabled: boolean; onChange: (patch: { autoScan?: boolean; autoDays?: 1 | 7 | 30 }) => void }) {
  const next = preferences.nextAutoScanAt ? new Date(preferences.nextAutoScanAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return <>
    <div className="settings-card"><div><span className="setting-icon"><Icon name="refresh"/></span><div><h3>6 saatte bir otomatik tarama</h3><p>Uygulama açıkken yeni talepleri arar. Önceki adaylardan kaynak başına en fazla 20 tanesi sırayla yeniden kontrol edilir. Kaçırılan taramalar yeniden açılışta tek tarama olarak yürütülür.</p>{preferences.autoScan && next && <p>Sonraki tarama: {next}</p>}</div></div><label className="switch"><input type="checkbox" aria-label="Otomatik taramayı aç" checked={preferences.autoScan} disabled={disabled} onChange={e => onChange({ autoScan: e.target.checked })}/><span/></label></div>
    <div className="settings-card"><div><span className="setting-icon"><Icon name="clock"/></span><div><h3>Otomatik tarama tarih aralığı</h3><p>Her taramada o günün tarihinden geriye doğru hesaplanır. Otomatik taramaya dahil ettiğiniz kaynakların başlangıç sayfaları okunur.</p></div></div><select aria-label="Otomatik tarama tarih aralığı" value={preferences.autoDays} disabled={disabled} onChange={e => onChange({ autoDays: Number(e.target.value) as 1 | 7 | 30 })}><option value={1}>Son 24 saat</option><option value={7}>Son 7 gün</option><option value={30}>Son 30 gün</option></select></div>
  </>;
}
