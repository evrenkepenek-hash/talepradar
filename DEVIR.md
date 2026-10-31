# TalepRadar marka güncellemesi — 31 Ekim 2026

Güncel uygulama adı TalepRadar. Arayüz logosu, pencere başlığı, favicon, Windows pencere simgesi ve paket simgesi aynı radar/arama tasarımını kullanıyor. public/brand altında SVG, PNG ve çok boyutlu ICO dosyaları var. Windows paketinin adı TalepRadar-0.2.1-Windows.exe olarak yapılandırıldı.

SON KULLANICI TALİMATI: İş bitince EXE oluşturulmasına açıkça izin verildi. Önceki EXE bekletme talimatı bu son izinle kaldırıldı. GitHub adımında kullanıcı yönlendirecek; henüz GitHub işlemi yapılmadı.

Nihai TalepRadar EXE oluşturuldu ve gerçek pencerede doğrulandı. Üç mevcut aday açılıyor; önceki arayüz kaldırmaları korunuyor. Paket: release\TalepRadar-0.2.1-Windows.exe. SHA-256: C5ADB8F818894EDADA240DFB717659645A039D9CF5763BDF4D5C0CFCC7C2632B. Uygulama açık bırakıldı. GitHub işlemi kullanıcı yönlendirmesini bekliyor.
Ad değişikliğinde kayıt kaybolmaması için normal kullanıcı verisi hâlâ %APPDATA%\Izlek\izlek.sqlite konumunda açılır. Uygulama kimliği, iç IPC/protokol adları ve veri dosyası adları uyumluluk için korundu. Kullanıcıya görünen ad TalepRadar. Önceki arayüz kaldırmaları kaynak kodda korunuyor.

---
# Arayüz düzenlemesi — 31 Ekim 2026

Kullanıcının istediği kaldırmalar kaynak kodda tamamlandı: sol menüdeki kişisel çalışma alanı kartı, üst çubuktaki K profil simgesi, sol menüdeki yıldız simgesi, sol alt ve sayfa altındaki iki Ücretsiz başlangıç etiketi.

KULLANICI TALİMATI: Kullanıcı açıkça söyleyene kadar EXE oluşturma. Son yıldız ve etiket kaldırmaları henüz EXE olarak paketlenmedi. Önceden üretilen 0.2.1 EXE yalnız çalışma alanı kartı ve K profil simgesi kaldırmalarını içerir. Kaynak kod bu EXE’den ileridedir. Sonraki düzenlemeleri kaynak kodda sürdür; paketleme için kullanıcının açık talimatını bekle.

---
# İzlek 0.2.0 — URL kaynakları güncellemesi

31 Ekim 2026. Kullanıcı, farklı URL adreslerinden tarama ve kaynak ekleme istedi; ilk örnek olarak Bionluk’u belirtti.

- Dinamik kaynak modeli, SQLite sources tablosu ve v1 → v2 eklemeli şema geçişi eklendi. Eski adaylar, notlar, geçmiş ve ayarlar korunur.
- Veri kaynakları ekranında ad/HTTPS URL/liste veya tek sayfa/yol filtresi/otomatik tarama tercihi; düzenleme, kaldırma ve kaynağı tek başına tarama var. Kaldırma adayları silmez.
- Bağlantı ekle farklı HTTPS sitelerini de kabul eder; yeni site tek sayfa kaynağı olarak, otomatik taramaya kapalı kaydedilir.
- Yeni tarama diyaloğu, filtreler, kaynak adları, detaylar, geçmiş, CSV ve otomatik zamanlayıcı kayıtlı kaynakları kullanır. Kaynak kaldırıldıktan sonra da kayıt/rapordaki adı korunur.
- R10/WM ek URL’leri kendi okuyucularını kullanır. Diğer siteler genel okuyucuyla taranır; adaylar incelemeye ayrılır. Mesaj sahipliği doğrulanamıyorsa iletişim bilgisi alınmaz.
- Liste taraması aynı siteyle, 3 liste sayfası ve 60 ilanla sınırlı; isteğe bağlı URL yolu filtresi, döngü ve farklı site yönlendirmesi denetimi var.
- Arbitrary URL desteğiyle yerel/özel ağ erişimini önlemek için DNS adresleri her istek/yönlendirmede denetlenip bağlantı doğrulanan IP’ye sabitlenir; HTTPS sertifikası asıl alan adına göre doğrulanır. robots ve yanıt sınırları devam eder.
- Bionluk açık katalogları hizmet satışı olduğundan müşteri olarak alınmaz. Alıcı istekleri için aktif freelancer ilanı gerektiği Bionluk resmî destek sayfasından doğrulandı; robots.txt /panel yollarını kapatıyor. Bionluk kısayolu otomatik taramaya kapalı kaynak oluşturur; sınır UI ve kaynak raporunda görünür. Giriş/kısıt aşımı yok.
- Sürüm 0.2.0; eski 0.1.0 EXE korunur. Yeni çıktı release\Izlek-0.2.0-Windows.exe.
- Ayrıntılar README.md ve TEST_RAPORU.md dosyalarında.

Son doğrulama: 38 çekirdek/ağ/kaynak + 12 adapter = 50 test geçti; tür kontrolü, build ve portable paket başarılı. Nihai EXE yeniden açıldı; üç gerçek aday ve Bionluk özel kaynağı korundu. Bionluk otomatik taramaya kapalı. Form ve kaynak bazında tarama gerçek arayüzde doğrulandı. Önceki kod yedeği: C:\Users\PC\AppData\Local\Temp\izlek-before-url-20261031-033548. Nihai EXE SHA-256: 15E597DB1061CD8278C4E33A6B444F90C0A11DD737AAA5D4B9B0EF19BCD049D4.
Aşağıdaki 0.1.0 notu önceki kapsam ve doğrulamanın tarihçesidir; iki sabit kaynak sınırı artık geçerli değil.

---

# İzlek — geliştirme devir notu

Son güncelleme: 31 Ekim 2026. Bu dosya, sohbet değiştiğinde çalışmaya devam etmek içindir.

## Kullanıcının onayladığı kapsam

- Türkiye'de yazılım veya web sitesi ihtiyacını açıkça paylaşmış müşteri adaylarını bulma.
- Tek kullanıcılı Windows masaüstü uygulaması: Electron, React, TypeScript, Node.js, SQLite.
- Ücretli API, abonelik veya AI anahtarı gerektirmeyen başlangıç.
- İlan sahibinin kendi mesajında paylaştığı açık telefon/e-posta; varsa gerçek ad, şirket ve satış araştırmasına yarayan bilgiler. Eksikler tahmin edilmez; yanıt veren satıcının iletişimi müşteriye atfedilmez.
- Açıklama, talep kanıtı, kategori, belirtilmiş bütçe ve teslim bilgisi hem detayda hem CSV'de bulunur.
- Son 24 saat / 7 gün / 30 gün, tarama zamanına göre kayan aralıklardır. Kapanmış, eski, hizmet satan ve personel arayan ilanlar güncel müşteri sayılmaz.
- Kullanıcı kod yazılmasına ve faydalı küçük eklemelere izin verdi.
- Tercihe bağlı altı saatlik otomatik tarama yalnız uygulama açıkken çalışır.
- Mesaj/e-posta gönderimi istenmedi; böyle bir otomasyon eklenmedi.

## Güncel ortam

- Proje: `C:\Users\PC\yeniwebprojesi`. Başlangıçta görünen diğer web sitesi çalışma alanında değişiklik yapılmadı.
- Bu oturumda proje klasörü yazma kapsamı dışında olduğundan değişiklik/kurulum/derleme işlemleri terminalin `require_escalated` incelemesiyle yapıldı. Normal terminal ağı EACCES verirken yükseltilmiş işlemlerde erişim çalıştı. Önceki nottaki “ağ tamamen kapalı” engeli artık geçerli değil.
- PowerShell politikası değiştirilmedi. `npm.ps1` yerine `npm.cmd` kullanılıyor.
- Node.js 24.22.1; Electron 45.2.0. Electron'un içindeki Node da 24.22.1 ve `node:sqlite` çalışıyor.
- `node_modules` ve `package-lock.json` artık mevcut. Vite 8.3.5 ile çakışan esbuild 0.25 yerine uyumlu 0.28.2 yüklendi. Kurulumda npm audit 0 açık bildirdi.
- Electron binary ilk kurulumda atlandığı için `ELECTRON_CACHE` proje içindeki `.electron-cache` yapılarak `node node_modules/electron/install.js` ayrıca çalıştırıldı.
- Bu terminal ortamında `ELECTRON_RUN_AS_NODE=1` var. `scripts/dev.mjs` bunu alt süreçten kaldırıyor. EXE'yi terminalden test ederken yalnız o komutun ortamından bu değişkeni kaldırın; aksi halde pencere açılmaz. Normal Explorer açılışı ayrı ortam kullanır.
- Git deposu oluşturulmadı.

## Tamamlananlar

- Önceki DEVIR.md güncel değildi: stil dosyaları, otomatik tarama ve ilk testler dosya sisteminde zaten vardı. Mevcut kod korundu, eksikler gerçek testlerle giderildi.
- UI, SQLite, not/durum koruyan upsert, silinen URL engeli, tarama geçmişi ve CSV mevcut.
- TypeScript'te worker portu ve Cheerio tip hataları düzeltildi.
- R10'un güncel `.post .postContent`, `.postUser .name a.uToggle`, `.head .left` yapısı desteklendi.
- WM Aracı'nın `.post-card .post-content`, `.userInfoBox a.name`, SQL biçimli yerel tarih yapısı desteklendi.
- İlk mesaj wrapper'ı gerçek ancestor'dan seçiliyor. Alıntı/imza ve diğer yazarların yanıtları iletişim kaynağına karışmıyor.
- R10 `profil/` bağlantıları konu keşfinden çıkarıldı.
- Normal sayfadaki pasif Cloudflare challenge-platform betiğinin yanlışlıkla engel sayılması düzeltildi. Görünür doğrulama engelleri atlanmaya devam ediyor; hiçbir engel aşılmıyor.
- Geçersiz ISO takvim tarihleri reddediliyor; saat dilimsiz WM tarihleri İstanbul saati sayılıyor.
- Mevcut ilanın içeriği sonradan sadece “iş verildi” olduğunda refresh yolu kaydı kapatıyor. Yeniden tarama satış notlarını koruyor. Kategori filtresi mevcut kaydın kapanış güncellemesini engellemiyor.
- Altı saatlik otomatik tarama tercihi ve sonraki zaman SQLite'ta kalıcı. Çalışan iş varken ikinci iş yok. Kapalıyken tarama yok; geçen zaman yeniden açılışta tek işe dönüşüyor.
- CSV ayıracı ayarının yalnız UI'da kalması düzeltildi; backend'e kaydediliyor.
- Vite izleyicisi yerel Electron veri/cache klasörlerini izlemiyor; kilitli Cookies dosyası hataları giderildi.
- Geliştirme başlatıcısında Electron GUI sürecini gizleyen `windowsHide` seçeneği kapatıldı. Yükleme/renderer hata kayıtları eklendi. Gerçek pencere açıldı.
- Detail JSX kapanışı normal; kaynak kod tür kontrolünden geçti.
- README ve test raporu oluşturuldu.

## Doğrulama ve çıktı

- `npm.cmd run check`: geçti.
- `npm.cmd test`: 27 test geçti.
- `npm.cmd run test:adapters`: 7 test geçti. Toplam **34 test**, sıfır başarısız/atlanan.
- `npm.cmd run build`: geçti.
- `npm.cmd run package`: geçti.
- Hazır dosya: `release\Izlek-0.1.0-Windows.exe` (Windows x64, yaklaşık 112 MB). Kod imzası yok; varsayılan Electron simgesi kullanılıyor.
- Gerçek ilk tam tarama (31 Ekim 03:00–03:02 İstanbul): R10 29 konu / 3 yeni kayıt; WM Aracı 32 konu / 0 yeni kayıt. İki kaynak da başarılı, toplam 61 konu. Bir adayda ilk mesaja ait açık telefon doğrulandı. Gerçek müşteriyle iletişime geçilmedi.
- Geliştirme verisi `.local-data\izlek.sqlite` içinde üç gerçek kayıt ve tamamlanan tarama geçmişiyle korunuyor.
- Hazır EXE'nin normal verisi `%APPDATA%\Izlek\izlek.sqlite` içinde; geliştirme verisinden ayrıdır.
- Ana ekran, tarama diyaloğu, ilerleme, aday detayı, ayarlar gerçek Electron penceresinde incelendi. Otomatik tarama açma/sonraki zaman/kapama UI ve SQLite üzerinden doğrulandı; kapalı bırakıldı.
- Tek seçili kayıt CSV diyaloğunda görüldü, Windows kaydetme diyaloğu açıldı ve iptal edildi. Aynı üreticiyle oluşturulan `CSV-dogrulama.csv`, PowerShell'in bağımsız CSV okuyucusunda 1 satır / 26 sütun / telefon metin korumasıyla doğrulandı. Excel/Sheets arayüzünde içe aktarma henüz yapılmadı.

## Bilinen sınırlar ve sonraki işler

1. Konuların ilk sayfası okunuyor; sonraki sayfalardaki ilan sahibi kapanış mesajları görülmeyebilir. Bunu README ve test raporunda açıkça belirttik. Son sayfa/ek sayfa güncellemesi için sınırlı ve kurallara uygun bir okuyucu eklemek yararlı sonraki geliştirmedir.
2. Türkçe sınıflandırma kural tabanlı; “yardımcı olabilecek ulaşsın” gibi dolaylı talepler kaçabilir. Daha geniş bir sentetik örnek kümesiyle iyileştirilebilir; ücretli AI eklemeyin.
3. İki forum tüm interneti kapsamaz; kaynak başına en fazla 60 konu ve 1–3 liste sayfası var. Liste tarihini ilk yayın tarihi sanmayın.
4. Altı saat gerçek zaman beklenmedi; zamanlayıcı sabit saatli testlerle ve tercih kaydıyla doğrulandı.
5. CSV'yi Excel/Sheets arayüzünde Telefon sütununu metin seçerek ayrıca içe aktarma kontrolü yapılabilir. Ham CSV telefonunda baştaki tek tırnak koruma amaçlıdır.
6. Tarama iptali ve kayıt silmenin veri katmanı testleri mevcut; paketlenmiş UI'da uçtan uca daha geniş senaryolar eklenebilir.
7. Paket imzalama ve özel uygulama simgesi sonraki dağıtım iyileştirmeleridir.

## Devam komutları

```powershell
npm.cmd ci --cache .npm-cache
npm.cmd run check
npm.cmd test
npm.cmd run test:adapters
npm.cmd run dev
npm.cmd run package
```

Ayrıntı için `README.md` ve `TEST_RAPORU.md` dosyalarını okuyun. Kaynak erişim engelini aşmayın; boş/başarısız taramayı başarılı müşteri bulma olarak göstermeyin. Değişiklikten sonra bu notu gerçek durumla güncelleyin.

## Son paket kontrolü

Hazır EXE normal `%APPDATA%\Izlek` veri klasörüyle gerçek taramayı da tamamladı: 31 Ekim 03:10–03:12 İstanbul, 61 konu ve 3 kayıt; iki kaynak başarılı. EXE kapatılıp yeniden açılarak kayıtların kalıcılığı kontrol edildi. Normal uygulama verisinde üç gerçek aday var; geliştirme verisindeki üç kayıtla ayrı tutulur. Otomatik tarama başlangıç tercihi kapalı. Paket kişisel veritabanı veya CSV içermiyor. SHA-256 test raporunda.
