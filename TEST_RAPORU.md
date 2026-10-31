# TalepRadar 0.2.1 — marka ve simge doğrulaması

31 Ekim 2026. Görünen ürün adı TalepRadar olarak güncellendi. Logo ve simge, düzenlenebilir SVG olarak çizildi; PNG ve 16/24/32/48/64/128/256 piksel ICO çıktıları aynı tasarımla üretildi.

- Tür kontrolü, Vite/Electron kod derlemesi ve portable Windows paketleme başarılı.
- Windows simge dosyası yerel Icon okuyucusuyla açıldı; ICO içindeki yedi PNG karesinin boyutları ve dosya sınırları doğrulandı.
- Paketlenmiş TalepRadar.exe içinden Windows simgesi çıkarılıp yeni tasarımla görsel olarak karşılaştırıldı.
- Paket arşivinde ürün adı TalepRadar; logo, PNG ve ICO dosyaları mevcut. SQLite, geliştirme verisi veya test CSV dosyası pakette yok.
- Nihai EXE açıldı: pencere adı ve simgesi, sol menü logosu ve sürüm yazısı TalepRadar olarak görünüyor. Önceki kart/K/yıldız/Ücretsiz başlangıç kaldırmaları korunuyor.
- Eski veri klasörü kullanılarak üç mevcut aday açıldı. Ad değişikliği için veri taşınmadı.
- EXE: release\TalepRadar-0.2.1-Windows.exe — 112.180.687 bayt.
- SHA-256: C5ADB8F818894EDADA240DFB717659645A039D9CF5763BDF4D5C0CFCC7C2632B.

Logo: public/brand/talepradar-logo.svg ve talepradar-logo.png. Uygulama işareti: talepradar-mark.svg. Windows simgesi: talepradar.ico; yüksek çözünürlüklü PNG: talepradar-icon.png.

---

Aşağıdaki raporlar önceki sürümlerin test ve paket tarihçesidir.
# İzlek 0.2.0 — URL kaynakları doğrulaması

31 Ekim 2026, Europe/Istanbul.

- Tür kontrolü ve üretim derlemesi başarılı.
- Çekirdek/ağ/kaynak testleri: **38 geçti**. Adapter testleri: **12 geçti**. Toplam **50 geçti**, sıfır başarısız veya atlanan.
- Windows x64 taşınabilir paket: release\Izlek-0.2.0-Windows.exe; 111.949.565 bayt.
- SHA-256: 15E597DB1061CD8278C4E33A6B444F90C0A11DD737AAA5D4B9B0EF19BCD049D4.
- Kaynak CRUD, yeniden açılış kalıcılığı, eski SQLite şemasından geçişte aday/not/ayar koruması, kaynak kaldırırken adayları koruma, sorgu parametreli URL kimlikleri, yol filtresi, sınırlı liste sayfalama, tek sayfa taraması, iptal, kaynak adının CSV’de korunması ve kaynaklar arası yönlendirme sınırı test edildi.
- Genel okuyucuda yazarı doğrulanmayan iletişim verileri alınmaz; doğrulanabilen yapıdaki talepler bile incelemeye ayrılır. Alıntı, yorum, imza ve altbilgi ayrımı örneklerle sınandı.
- Yerel/özel/ayrılmış IPv4 ve IPv6 adresleri, karma DNS yanıtları ve HTTPS bağlantısının doğrulanan adrese sabitlenmesi sınandı. Node’un çoklu adres seçimiyle uyum ayrıca test edildi.
- Gerçek R10 ilan URL’si özel kaynak olarak tarandı: 1 ilan, 1 işlenen talep; kaynak kimliği ve yayın tarihi doğru. Bu deneme doğrudan çekirdekten yapıldı, yeni sahte kayıt oluşturulmadı.
- Bionluk robots.txt HTTP 200 ile okundu; /panel ve hesap yolları kapalı. Bionluk’un resmî destek sayfasında açık hizmet ilanları ile alıcı istekleri ayrımı ve aktif ilan gerekliliği doğrulandı. Bionluk başlangıç URL’si taramasında açıklayıcı kaynak hatası verildi; satıcı ilanları müşteri diye kaydedilmedi.
- Basit açık HTML, bilinmeyen sahiplik, JavaScript ile yüklenen boş sayfa ve genel okuyucunun talep içermeyen metni elemesi sentetik örneklerle doğrulandı.
- Paket arşivinde müşteri SQLite dosyaları, geliştirme verisi veya test CSV’si bulunmuyor.
- Gerçek kullanıcı veritabanı açılışında şema 2’ye yükseldi ve mevcut üç aday korundu.

Arayüzden Bionluk kısayolu doldurulup kaydedildi; kaynak otomatik taramaya kapalı tutuldu. Kaynağı tek başına tarama raporunda alıcı isteği erişim sınırı doğru gösterildi. Takip parametreli URL kapanış güncellemesi ve URL düzenlendikten sonra eski adresin yeniden eklenmesi de regresyon testleriyle doğrulandı.

Genel okuyucu tüm site yapılarına veya oturum gerektiren içeriklere erişim garantisi vermez. Konu içeriğinin sonraki sayfalarındaki kapanışlar önceki sürümdeki sınırla aynıdır.

---

Aşağıdaki rapor 0.1.0 sürümünün doğrulama tarihçesidir.

# İzlek doğrulama raporu

Tarih: 31 Ekim 2026 (Europe/Istanbul).

## Otomatik kontroller

| Kontrol | Sonuç |
| --- | --- |
| `npm.cmd run check` | Başarılı |
| `npm.cmd test` | 27 test geçti; 0 başarısız, 0 atlanan |
| `npm.cmd run test:adapters` | 7 test geçti; 0 başarısız, 0 atlanan |
| `npm.cmd run build` | Başarılı |
| `npm.cmd run package` | Başarılı; Windows x64 taşınabilir EXE üretildi |
| Electron içindeki `node:sqlite` | Electron 45.2.0 / Node 24.22.1 ile bellek veritabanında yazma ve okuma başarılı |
| Bağımlılık denetimi | Kurulumda npm audit 0 bilinen açık bildirdi |

Toplam **34 test** çalıştırıldı. Sıfır testlik bir çalıştırma başarı olarak sayılmadı.

Testler; alıcı/satıcı/personel ilanlarının ayrımını, kayan tarih sınırlarını, belirsiz ve geçersiz tarihleri, ilk yazarın kapanış açıklamasını, sonradan değişmiş ilanı, iletişim sahipliğini, URL/IPC doğrulamasını, CSV kaçışlarını ve formül korumasını, SQLite'ta not/durum kalıcılığını, silinen URL'nin tekrar alınmamasını, kesilmiş taramanın toparlanmasını, robots kurallarını, yönlendirme ve yanıt sınırlarını, gerçek doğrulama engellerini ve otomatik zamanlamayı kapsar.

Güncel R10 ve WM Aracı HTML sınıfları, kişisel verileri içermeyen sentetik regresyon örneklerine işlendi. Normal sayfadaki pasif Cloudflare betiğinin hata sayılmaması ayrıca test edildi; görünür doğrulama engelleri hâlâ reddedilir.

## Gerçek kaynak doğrulaması

31 Ekim 2026, 03:00–03:02 İstanbul saatinde uygulama içinden yapılan ilk tam tarama:

| Kaynak | İncelenen konu | Yeni kayıt | Durum |
| --- | ---: | ---: | --- |
| R10 | 29 | 3 | Başarılı |
| WM Aracı | 32 | 0 | Başarılı |
| Toplam | 61 | 3 | Tamamlandı |

Seçenekler: son 7 gün, kaynak başına ilk liste sayfası, tüm kategoriler. Bu sayılar o anki içeriktir; sonraki taramada değişebilir. Kaynakların robots.txt dosyaları gerçekten okundu.

- R10'daki `profil/` bağlantılarının konu listesine girmediği doğrulandı.
- R10'da son yanıtı yeni olan 22 Eylül tarihli bir talep, ilk yayın tarihine göre eski sayıldı.
- WM Aracı'nda son yanıtı 2026 olan 3 Temmuz 2023 tarihli konu, ilk mesaj tarihiyle ayrıştırıldı.
- Telefon bulunan gerçek adayda yazar ve telefon ilk mesajla ayrıca karşılaştırıldı. Ürünün örnek abonelik fiyatı, müşterinin proje bütçesi olarak kaydedilmedi.
- Gerçek müşterilere mesaj veya e-posta gönderilmedi.

## Arayüz ve çıktı

Geliştirme uygulaması gerçek Electron penceresinde açıldı. Ana ekran, yeni tarama diyaloğu, ilerleme, üç kaydın listeye gelmesi, bir adayın detayı ve ayarlar görsel olarak kontrol edildi.

Otomatik tarama anahtarı açılınca SQLite'a `autoScan: true` ve altı saat sonraki zaman yazıldığı; kapatılınca `false` ve `null` olarak temizlendiği doğrulandı. Testten sonra otomatik tarama kapalı bırakıldı.

CSV seçiminde tek adayın dışa aktarma diyaloğuna taşındığı ve Windows kaydetme penceresinin açıldığı görüldü; diyalog iptal edildi. Aynı CSV üreticisiyle `CSV-dogrulama.csv` oluşturuldu; bağımsız PowerShell CSV okuyucusu ile 1 veri satırı, 26 sütun ve telefon metin koruması doğrulandı. Excel/Sheets arayüzünde içe aktarma bu oturumda yapılmadı.

## Bilinen sınırlar

- Konuların ilk sayfası okunur; sonraki sayfalardaki kapanış mesajları henüz taranmıyor.
- Sınıflandırma kural tabanlıdır; dolaylı taleplerin tamamını yakalama garantisi yoktur.
- Altı saat gerçek zaman beklenmedi; zamanın gelmesi/çakışma/kapama mantığı sabit saatli testlerle ve UI ayar kaydıyla sınandı.
- Paket imzasızdır ve varsayılan Electron simgesini kullanır.
- Gerçek kaynak değişiklikleri ve erişim engelleri ileride okuyucuların güncellenmesini gerektirebilir.

## Hazır EXE ile son kontrol

Taşınabilir EXE normal kullanıcı verisiyle açıldı; arayüz `izlek://app/index.html` üzerinden yüklendi. 31 Ekim 2026, 03:10–03:12 İstanbul saatindeki paket taraması da **61 konu / 3 yeni kayıt** ile tamamlandı: R10 29/3, WM Aracı 32/0; iki kaynak da başarılıydı. Normal veritabanı `%APPDATA%\Izlek\izlek.sqlite` içinde oluştu. EXE kapatılıp yeniden açılarak kalıcılık kontrolü yapıldı.

ASAR arşivinde main, preload, worker ve renderer girişleri mevcut; gerçek müşteri veritabanı, test CSV'si ve geliştirme verisi pakete dahil değil.

EXE SHA-256: `E570C3DBA1396B6D746E98F7D415A2F57817384B6C501ACBE614E903F0B302E6`.

## 0.2.0 nihai EXE yeniden açılış kontrolü

Nihai portable EXE normal kullanıcı verisiyle yeniden açıldı. Arayüz 0.2.0 sürümünü gösteriyor; mevcut üç aday ve kaydedilen Bionluk URL kaynağı korunuyor. Bionluk otomatik taramaya dahil değil. Güncel raporun başındaki SHA-256 nihai EXE dosyasına aittir.
