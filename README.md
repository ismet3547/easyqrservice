# easyqr

Restoran ve kafelerin mevcut PDF veya görsel menülerini yapay zekâ ile okuyup, düzenlenebilir ve telefona uygun QR menülere dönüştüren MVP.

## Neler hazır?

- JPG, PNG, WEBP ve PDF menü yükleme
- E-posta ve şifreyle kullanıcı kaydı/girişi
- Dashboard ayarlarından ad, e-posta ve şifre güncelleme
- `bcrypt` parola hash’i ve veritabanında tutulan güvenli oturumlar
- HTTP-only, SameSite oturum çerezi ve giriş denemesi sınırı
- OpenAI Responses API ile kategori, ürün, açıklama ve fiyat çıkarımı
- Aynı menü analizi ve çeviriyi tekrar AI'a göndermeyen kalıcı SQLite önbelleği
- Otomatik ürün görsellerinde önbellek; kullanıcı tarafından yapılan “yenile” işleminde yeni üretim
- API anahtarı olmadan deneyimlenebilen, açıkça etiketlenmiş demo modu
- Kategori ve ürün ekleme, düzenleme, silme
- Ürün bazında eski fiyat ve kampanyalı fiyat gösterimi
- Ürünleri Satışta, Tükendi veya Gizli olarak yönetme
- Vegan, vejetaryen, glutensiz ve acılı ürün etiketleri
- Yaygın alerjen bilgileri ve müşteri menüsünde güvenlik uyarısı
- Ürün görseli yükleme, tarayıcıda otomatik boyutlandırma ve sıkıştırma
- Görseli olmayan ürünleri OpenAI ile tek tuşta ve toplu tamamlama
- Menü başlığı, kategori, ürün, açıklama ve etiketler için tek tuşla İngilizce çeviri
- QR menüde tarayıcı diline göre otomatik Türkçe/İngilizce açılış ve kalıcı TR/EN seçimi
- Türkçe içerik değiştiğinde eski çeviriyi işaretleyen çeviri güncellik kontrolü
- Ürün, açıklama, kategori, fiyat, etiket ve alerjenlerde Türkçe karakter duyarsız menü araması
- Vegan, vejetaryen, glutensiz ve acılı filtreleri ile çoklu alerjen dışlama
- İşletme logosu, adres, telefon, WhatsApp, Instagram ve Google Maps bağlantıları
- Saat dilimine göre canlı açık/kapalı durumu, haftalık çalışma saatleri ve gece yarısını aşan servis desteği
- Minimal, Modern Bistro, Botanik, Editoryal, Dark Luxe ve Enerjik hazır tasarım stilleri
- Renk, tipografi ve dört farklı ürün düzeninin yanında kart, köşe, yoğunluk, görsel oranı, fiyat, kategori ve kapak stili ayarları
- Hesap, menü oluşturma, yayınlama ve ilk QR taramasını gerçek veriden izleyen başlangıç rehberi
- Yeni ve mevcut hesaplara tek seferlik 20 başlangıç kredisi tanımlayan AI kredi cüzdanı
- Atomik harcama, güvenli iade ve yinelenen istekte ikinci kez ücret kesmeyen kredi işlem defteri
- Menü bağlamı ve kullanıcının tarifinden erişilebilir Theme Engine tokenları üreten, 4 kredilik AI tasarım asistanı
- İçerik ve tasarım bölümlerine hızlı geçiş sunan, klavye erişimli ve okunabilir responsive Studio çalışma alanı
- Anlık telefon önizlemesi
- Tarayıcıda otomatik taslak kaydı
- Kullanıcı hesabına göre ayrılmış yerel taslaklar
- Korumalı dashboard, ayrı menü yönetim sayfası ve gerçek zamanlı özet metrikler
- Giriş sonrasında landing page'den tamamen ayrılan korumalı menü oluşturma alanı
- Menülerin SQLite veritabanına otomatik kaydı
- Dashboard’dan menü açma, bağlantı kopyalama ve silme
- Günlük QR menü açılışlarını gösteren 7, 14 ve 30 günlük analitik ekranı
- QR kod, doğrudan bağlantı ve sosyal yönlendirmeleri ayıran trafik kaynağı analizi
- Mobil, tablet ve masaüstü cihazlarla Türkçe/İngilizce menü kullanım dağılımları
- Ham IP veya tarayıcı bilgisi saklamayan ve bilinen botları saymayan gizlilik odaklı ölçüm
- Menü bazlı görüntülenme sıralaması ve mobil dashboard navigasyonu
- QR kod, bağlantı kopyalama, paylaşma ve SVG indirme
- Yayınlanan menüler için masa kartı, sticker ve poster şablonlu QR Baskı Merkezi
- Yüksek çözünürlüklü PNG, vektörel SVG ve tarayıcıdan A4/PDF çıktısı
- Kısa ve kalıcı `/m/{slug}` müşteri menüsü
- Yayındaki menüler için görüntülenme sayacı

## Yerelde çalıştırma

Gereksinimler: Node.js 20.9 veya üzeri.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Ardından [http://localhost:3000](http://localhost:3000) adresini açın.

Gerçek menü analizi için `.env.local` içine sunucu tarafı API anahtarını ekleyin:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
OPENAI_THEME_MODEL=gpt-4.1-mini
OPENAI_IMAGE_MODEL=gpt-image-1
```

Kullanıcılar ve oturumlar varsayılan olarak `.data/easyqr.db` SQLite veritabanında saklanır. Farklı bir konum kullanmak isterseniz:

```bash
DATABASE_PATH=/tam/yol/easyqr.db
```

`OPENAI_API_KEY` hiçbir zaman `NEXT_PUBLIC_` önekiyle tanımlanmamalıdır. AI görsel asistanı isteğe bağlı çalışır ve OpenAI Images API kullanım kotasını kullanır.

AI sonuçları aynı SQLite veritabanında, model ve işlem sürümünü de içeren SHA-256 anahtarlarla saklanır. Menü analizi, çeviri ve idempotent tema tasarımı kayıtları 30 gün; otomatik ürün görselleri 14 gün geçerlidir. Girdi dosyalarının kendisi saklanmaz; yalnızca içerik özeti ve doğrulanmış AI sonucu tutulur. Süresi dolan veya kapasite sınırını aşan kayıtlar otomatik temizlenir.

## Komutlar

```bash
npm run dev        # geliştirme sunucusu
npm run typecheck  # TypeScript kontrolü
npm run build      # üretim derlemesi
npm start          # üretim sunucusu
```

## Mimari

- `app/page.tsx`: ziyaretçilere açık landing page; giriş yapan kullanıcıyı dashboard'a yönlendirir
- `app/studio` ve `components/MenuStudio.tsx`: korumalı yükleme, editör, önizleme ve QR akışları
- `components/studio/StudioChrome.tsx`: Studio üst çubuğu, erişilebilir sekmeler, bölüm navigasyonu ve telefon önizleme kabuğu
- `app/dashboard` ve `components/Dashboard.tsx`: korumalı işletme paneli
- `app/dashboard/menus` ve `components/MenusDashboard.tsx`: menü arama, filtreleme ve yönetim sayfası
- `app/dashboard/menus/[id]/qr` ve `components/QrCenter.tsx`: QR indirme, paylaşma ve baskı şablonları
- `app/dashboard/analytics`, `components/AnalyticsDashboard.tsx` ve `lib/analytics.ts`: günlük açılış trendi, trafik kaynağı, cihaz, dil ve menü performansı
- `app/dashboard/settings` ve `components/SettingsDashboard.tsx`: profil ve hesap güvenliği ayarları
- `app/api/menus/*`: menü oluşturma, okuma, güncelleme, yayınlama ve silme
- `app/m/[slug]`: herkese açık, kalıcı müşteri menüsü
- `app/api/extract-menu/route.ts`: dosya doğrulama ve AI tabanlı menü çıkarımı
- `app/api/generate-product-image/route.ts`: kimlik doğrulamalı ve hız sınırlı ürün görseli üretimi
- `app/api/generate-menu-theme/route.ts`: kredi kullanan, sahiplik kontrollü ve şema doğrulamalı özel tema üretimi
- `app/api/translate-menu/route.ts`: metin alanlarını toplu ve doğrulanmış biçimde İngilizceye çevirme
- `app/api/ai-credits/route.ts`: oturum sahibine ait AI bakiyesi, maliyet bilgisi ve son hareketler
- `app/api/auth/*`: kayıt, giriş, çıkış ve aktif kullanıcı endpoint’leri
- `app/giris` ve `app/kayit`: kullanıcı erişim ekranları
- `lib/auth.ts` ve `lib/db.ts`: oturum ve SQLite altyapısı
- `lib/ai-cache.ts`: süreli, boyut kontrollü ve sürümlü AI sonuç önbelleği
- `lib/ai-credit-config.ts` ve `lib/ai-credits.ts`: kredi maliyetleri, başlangıç bakiyesi, atomik harcama/iade ve idempotent işlem defteri
- `lib/theme-design.ts`: AI tema şeması, izinli token doğrulaması ve renk kontrastı denetimi
- `lib/menu-tracking.ts`: kişisel veri saklamadan kaynak, cihaz, dil ve bot sınıflandırması
- `lib/onboarding.ts`: hesap, ilk menü, yayın ve QR taramasından türetilen başlangıç ilerlemesi
- `lib/menu.ts` ve `lib/menus.ts`: menü veri modeli, geriye dönük uyumlu Theme Engine 2.0 ve kalıcı menü işlemleri
- `components/MenuPreview.tsx`: iki dilli müşteri menüsü, güvenli iletişim bağlantıları ve canlı çalışma saati hesabı
- `app/globals.css`: responsive tasarım sistemi

## MVP notu

Kullanıcılar, oturumlar, taslaklar ve yayınlanan menüler yerel SQLite veritabanında saklanır. Yayınlanan her menü aynı QR kodla güncellenebilen kalıcı bir `/m/{slug}` adresi alır. Üretime geçerken önerilen sonraki adımlar:

1. Üretim ortamı için PostgreSQL ile işletme, menü, kategori ve ürün tabloları
2. E-posta doğrulama, şifre sıfırlama ve çoklu işletme desteği
3. İngilizce dışındaki ek hedef diller ve işletmeye özel dil seçimi
4. Anonim tekil ziyaretçi ve kampanya dönüşüm analitiği
5. AI kredi paketleri, ekip rolleri, çoklu şube ve abonelik planları

## Güvenlik

- Yüklemeler 12 MB ile ve desteklenen MIME türleriyle sınırlandırılır.
- Menü analizi oturum ve same-origin kontrolü gerektirir; dosya yalnızca işlem veya içerik özeti üretimi sırasında bellekte tutulur.
- Ürün fotoğrafları en fazla 8 MB olarak alınır, en çok 900 px’e küçültülür ve menüye kaydedilmeden önce sıkıştırılır.
- API anahtarı yalnızca sunucu route’unda kullanılır.
- Ürün görseli üretimi oturum ve same-origin kontrolü gerektirir; kullanıcı/IP başına saatte 12 istekle sınırlandırılır.
- Menü çevirisi oturum ve same-origin kontrolü gerektirir; yalnızca metin alanları AI servisine gönderilir ve kullanıcı/IP başına saatte 8 istekle sınırlandırılır.
- AI kredi bakiyesi yalnızca sunucudaki atomik işlemlerle değişir; kullanıcıya açık API salt okunurdur ve aynı işlem referansı iki kez ücretlendirilemez.
- AI tema üretimi oturum, same-origin, menü sahipliği, istek boyutu ve kullanıcı/IP hız sınırı kontrollerinden geçer; yalnızca izinli Theme Engine alanları kabul edilir, renk kontrastı doğrulanır ve başarısız üretimde kredi iade edilir.
- Önbellek anahtarları ham içerik yerine SHA-256 özetidir; model veya prompt sürümü değiştiğinde eski sonuç kullanılmaz.
- Parolalar 12 maliyet faktörlü `bcrypt` hash’i olarak saklanır.
- Oturum anahtarının yalnızca SHA-256 özeti veritabanında tutulur; ham anahtar HTTP-only çerezdedir.
- Kayıt ve giriş endpoint’lerinde aynı-origin kontrolü ve temel deneme sınırı uygulanır.
- E-posta değişikliği mevcut şifre doğrulaması gerektirir; şifre değişikliğinde diğer cihazlardaki oturumlar kapatılır ve hassas denemeler sınırlandırılır.
- AI çıktısı, yayınlamadan önce kullanıcı tarafından düzenlenebilir ve kontrol edilebilir.
- Gizli ürünler herkese açık müşteri bileşenine gönderilmeden önce sunucuda filtrelenir.
- Alerjenler AI tarafından tahmin edilmez; işletme tarafından doğrulanarak girilir ve müşteri menüsünde çapraz bulaşma uyarısı gösterilir.
- Menü araması ve filtreler tamamen tarayıcıda çalışır; arama metni sunucuya gönderilmez. Alerjen filtresi yalnızca işletmenin beyan ettiği verileri esas alır.
- Analitik kayıtlarında yalnızca sınıflandırılmış kaynak, cihaz türü ve gösterilen dil tutulur; ham IP, user-agent ve yönlendiren adres saklanmaz. Bilinen bot istekleri görüntülenmeye eklenmez.
- Müşteri menüsündeki harita, WhatsApp ve Instagram bağlantıları yalnızca izin verilen HTTPS alan adlarına yönlendirilir; çalışma saatleri seçilen saat diliminde tarayıcıda hesaplanır.
- Üretimde dağıtık rate limiting, PostgreSQL, e-posta doğrulama, kalıcı dosya politikası ve kötü amaçlı dosya taraması eklenmelidir.
