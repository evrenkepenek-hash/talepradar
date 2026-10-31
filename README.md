# TalepRadar

Türkiye'de web sitesi veya yazılım hizmeti talebini açıkça paylaşan müşteri adaylarını araştıran, tek kullanıcılı Windows masaüstü uygulaması. R10 ve WM Aracı hazır kaynaklardır; kendi HTTPS URL’lerinizi de kaydedip tarayabilirsiniz. Ücretli servis, AI API anahtarı veya abonelik gerekmez.

## Açılış

Uygulamanın adı **TalepRadar**. Windows x64 taşınabilir paket: `release\TalepRadar-0.2.1-Windows.exe`. Paket kod imzalama sertifikasıyla imzalanmamıştır.

Kaynak koddan geliştirme için Node.js 24 veya üstü gerekir:

```powershell
npm.cmd ci --cache .npm-cache
npm.cmd run dev
```

Bağımlılıklar zaten kuruluysa `Baslat.cmd` de geliştirme uygulamasını açar. PowerShell yürütme politikasını değiştirmeye gerek yoktur; `npm.cmd` kullanılır. Geliştirme başlatıcısı, Electron'u Node kipine zorlayabilen `ELECTRON_RUN_AS_NODE` değişkenini alt süreçten kaldırır.

## Kullanım

1. **Yeni tarama** ile kaynakları, son 24 saat / 7 gün / 30 gün aralığını ve 1–3 liste sayfasını seçin.
2. Adayın detayında talep açıklamasını, kaynak kanıtını, ilk yayın tarihini, açık iletişim bilgilerini, belirtilen bütçeyi ve teslim bilgisini inceleyin. Bilinmeyen alanlar doldurulmaz.
3. Durum ve not ekleyerek takip edin. **Kaynağı aç** ile güncel durumu kontrol edin.
4. Dışa aktarılacak kayıtların kutularını işaretleyip **CSV dışa aktar** seçin. Yalnız seçili kayıtlar yazılır.
5. İsterseniz **Ayarlar** bölümünden 6 saatte bir otomatik taramayı açın. Başlangıçta kapalıdır.

Otomatik tarama yalnız uygulama açıkken çalışır. Kapanıştan sonra arka plan hizmeti çalışmaz. Zamanı geçen bir tarama, uygulama yeniden açıldıktan sonra en geç yaklaşık 30 saniyede tek tarama olarak başlar; kaçırılan her dönem için ayrı iş oluşturulmaz. Çalışan tarama varken ikinci tarama başlatılmaz. Sonraki tarama zamanı ve tercihler SQLite'ta saklanır.

Otomatik tarama otomatik taramaya dahil ettiğiniz kaynakların başlangıç sayfalarını ve kaynak başına önceki adaylardan en fazla 20 tanesini sırayla yeniden kontrol eder. Manuel tarama sırasında da önceki adayların bir bölümü yeniden kontrol edilir. İlan sahibi talebin kapandığını belirtirse, okunan sayfadaki bu bilgi mevcut kayda işlenir; satış notları korunur.

## Kendi URL kaynaklarınız

**Veri kaynakları → URL kaynağı ekle** bölümünde bir ad ve tam HTTPS adresi girin.

- **İlan listesi**: Başlangıç sayfasındaki aynı siteye ait bağlantıları ve varsa en fazla 3 sonraki liste sayfasını inceler. İsteğe bağlı **bağlantı yolu** ile /ilanlar/ gibi bir bölüme sınırlandırabilirsiniz. Kaynak başına en fazla 60 ilan okunur.
- **Tek sayfa**: Yalnız kaydettiğiniz adresi inceler.
- **Otomatik taramaya dahil et**: Altı saatlik tarama açık olduğunda bu kaynağın da taranmasını sağlar. Kapalı kaynaklar elle taranabilir.
- **Bu kaynağı tara**: Seçili güncellik aralığıyla yalnız o kaynağı tarar; sonuç tarama geçmişinde görünür.
- **Düzenle / Kaynağı kaldır**: Kaynak ayarlarını değiştirir; kaldırmak daha önce bulunan adayları ve notları silmez.

Ana ekrandaki **Bağlantı ekle** artık farklı sitelerden tekil HTTPS adreslerini de kabul eder. Yeni site otomatik taramaya kapalı bir tek sayfa kaynağı olarak kaydedilir. Eklediğiniz kaynaklar uygulama yeniden açıldığında korunur.

R10/WM Aracı üzerindeki ek URL’ler aynı kaynağa özel okuyucuyu kullanır. Diğer siteler genel okuyucuyla incelenir; bulunan talepler **İncelenecekler** bölümüne ayrılır. İlan sahibine ait mesaj yapısı doğrulanamazsa telefon/e-posta alınmaz. Genel okuyucu her sitenin yapısını veya JavaScript ile sonradan yüklenen içeriğini okuyamaz; bu durum hata olarak görünür.

### Bionluk

Formda **Bionluk adresini doldur** kısayolu vardır. Bionluk’un herkese açık iş ilanları freelancerların hizmet satışlarıdır. Alıcı isteklerini görüntülemek için hesapta aktif freelancer ilanı gerekir; panel yolları robots.txt tarafından da kapalıdır. Uygulama hesaba giriş yapmaz ve hizmet satışlarını müşteri talebi diye kaydetmez. Bionluk başlangıç adresi taranırsa bu sınır kaynak raporunda gösterilir.

Resmî açıklama: https://bionluk.com/destek/satis-yapmaya-baslamak-10?category=baslangic-31

## Marka dosyaları

- Uygulama işareti: `public/brand/talepradar-mark.svg`
- Logo: `public/brand/talepradar-logo.svg` ve `talepradar-logo.png`
- Simge: `public/brand/talepradar-icon.png` ve çok boyutlu `talepradar.ico` (16–256 px)

Logo vektör olarak çizildi; PNG ve ICO aynı tasarımdan üretildi. Pencere simgesi ve gelecekteki Windows EXE simgesi yapılandırıldı.

## Veriler ve CSV

- Geliştirme veritabanı: `.local-data\izlek.sqlite`.
- TalepRadar, ad değişikliğinde mevcut kayıtları korumak için önceki veri klasörünü kullanır. Normal veritabanı: Windows kullanıcı uygulama verisi altında `Izlek\izlek.sqlite`. Geliştirme ve hazır EXE verileri ayrıdır.
- CSV UTF-8 BOM ile yazılır. Excel Türkiye için varsayılan ayıraç noktalı virgüldür; virgül de seçilebilir.
- Formül başlatabilecek metinlere tek tırnak eklenir. Bu nedenle ham bir CSV okuyucusunda telefonun başında tek tırnak görünebilir. Excel'e içe aktarırken Telefon sütununu **Metin** seçin. Başka bir programda yeniden kaydetmek bu korumayı değiştirebilir.
- Silinen ilanın URL özeti, aynı ilanın tekrar eklenmesini önlemek için saklanır. **Engel listesini sıfırla** bu engeli kaldırır; silinmiş notları geri getirmez.
- Yerel veritabanı ve CSV şifreli değildir. Otomatik mesaj/e-posta gönderimi veya buluta veri aktarımı yoktur.

## Kaynak kapsamı

İstekler robots.txt kurallarıyla kontrol edilir, aralıklarla gönderilir ve boyut/zaman sınırına tabidir. Giriş yapılmaz; CAPTCHA veya erişim engeli aşılmaz. Kaynak reddi, tanınmayan HTML ve okunamayan sayfalar tarama geçmişinde hata ya da kısmi sonuç olarak görünür.

Bir taramada kaynak başına en fazla 60 konu incelenir. Liste sırası son yanıta göre değişebilir; güncellik ilk mesajın yayın tarihiyle hesaplanır. İlan sahibinin ilk mesajı iletişim kaynağıdır; yanıt veren satıcıların bilgileri müşteriye atfedilmez. Alıntılar ve imzalar temizlenir. Tarihi veya mesaj sahipliği doğrulanamayan kayıtlar incelemeye ayrılır; eski ve kapanmış talepler yeni güncel aday olarak eklenmez.

Bu sürüm konu bağlantısının ilk sayfasını okur. Konunun sonraki sayfalarındaki kapanış açıklamaları görülmeyebilir. Sınıflandırma Türkçe kurallara dayanır; bazı dolaylı talepler kaçabilir. Kaynak üzerinden son kontrol yapın. İki forumun taranması tüm internetin ya da tüm yeni taleplerin tarandığı anlamına gelmez.

## Kontroller ve paketleme

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:adapters
npm.cmd run build
npm.cmd run package
```

`package-lock.json` kurulan sürümleri sabitler; yeniden kurulumda `npm.cmd ci` kullanın. Electron'un ilk indirmesi atlanmışsa proje içinde `ELECTRON_CACHE` ayarlayarak `node node_modules/electron/install.js` çalıştırılabilir.

Son doğrulama ve bilinen sınırlar: [TEST_RAPORU.md](TEST_RAPORU.md). Devam notu: [DEVIR.md](DEVIR.md).
