# easyqr

Restoran ve kafelerin mevcut PDF veya görsel menülerini yapay zekâ ile okuyup, düzenlenebilir ve telefona uygun QR menülere dönüştüren MVP.

## Neler hazır?

- JPG, PNG, WEBP ve PDF menü yükleme
- E-posta ve şifreyle kullanıcı kaydı/girişi
- `bcrypt` parola hash’i ve veritabanında tutulan güvenli oturumlar
- HTTP-only, SameSite oturum çerezi ve giriş denemesi sınırı
- OpenAI Responses API ile kategori, ürün, açıklama ve fiyat çıkarımı
- API anahtarı olmadan deneyimlenebilen, açıkça etiketlenmiş demo modu
- Kategori ve ürün ekleme, düzenleme, silme
- Renk, tipografi, kart/kompakt düzen ve açıklama görünürlüğü ayarları
- Anlık telefon önizlemesi
- Tarayıcıda otomatik taslak kaydı
- Kullanıcı hesabına göre ayrılmış yerel taslaklar
- Korumalı dashboard, ayrı menü yönetim sayfası ve gerçek zamanlı özet metrikler
- Giriş sonrasında landing page'den tamamen ayrılan korumalı menü oluşturma alanı
- Menülerin SQLite veritabanına otomatik kaydı
- Dashboard’dan menü açma, bağlantı kopyalama ve silme
- Günlük QR menü açılışlarını gösteren 7, 14 ve 30 günlük analitik ekranı
- Menü bazlı görüntülenme sıralaması ve mobil dashboard navigasyonu
- QR kod, bağlantı kopyalama, paylaşma ve SVG indirme
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
```

Kullanıcılar ve oturumlar varsayılan olarak `.data/easyqr.db` SQLite veritabanında saklanır. Farklı bir konum kullanmak isterseniz:

```bash
DATABASE_PATH=/tam/yol/easyqr.db
```

`OPENAI_API_KEY` hiçbir zaman `NEXT_PUBLIC_` önekiyle tanımlanmamalıdır.

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
- `app/dashboard` ve `components/Dashboard.tsx`: korumalı işletme paneli
- `app/dashboard/menus` ve `components/MenusDashboard.tsx`: menü arama, filtreleme ve yönetim sayfası
- `app/dashboard/analytics`, `components/AnalyticsDashboard.tsx` ve `lib/analytics.ts`: günlük açılış trendi ve menü performansı
- `app/api/menus/*`: menü oluşturma, okuma, güncelleme, yayınlama ve silme
- `app/m/[slug]`: herkese açık, kalıcı müşteri menüsü
- `app/api/extract-menu/route.ts`: dosya doğrulama ve AI tabanlı menü çıkarımı
- `app/api/auth/*`: kayıt, giriş, çıkış ve aktif kullanıcı endpoint’leri
- `app/giris` ve `app/kayit`: kullanıcı erişim ekranları
- `lib/auth.ts` ve `lib/db.ts`: oturum ve SQLite altyapısı
- `lib/menu.ts` ve `lib/menus.ts`: menü veri modeli ve kalıcı menü işlemleri
- `app/globals.css`: responsive tasarım sistemi

## MVP notu

Kullanıcılar, oturumlar, taslaklar ve yayınlanan menüler yerel SQLite veritabanında saklanır. Yayınlanan her menü aynı QR kodla güncellenebilen kalıcı bir `/m/{slug}` adresi alır. Üretime geçerken önerilen sonraki adımlar:

1. Üretim ortamı için PostgreSQL ile işletme, menü, kategori ve ürün tabloları
2. E-posta doğrulama, şifre sıfırlama ve çoklu işletme desteği
3. Ürün görseli, alerjen, çoklu dil ve stokta yok işaretleme
4. Trafik kaynağı, cihaz türü ve anonim tekil ziyaretçi analitiği
5. İşletme profili, ekip rolleri ve abonelik planları

## Güvenlik

- Yüklemeler 12 MB ile ve desteklenen MIME türleriyle sınırlandırılır.
- API anahtarı yalnızca sunucu route’unda kullanılır.
- Parolalar 12 maliyet faktörlü `bcrypt` hash’i olarak saklanır.
- Oturum anahtarının yalnızca SHA-256 özeti veritabanında tutulur; ham anahtar HTTP-only çerezdedir.
- Kayıt ve giriş endpoint’lerinde aynı-origin kontrolü ve temel deneme sınırı uygulanır.
- AI çıktısı, yayınlamadan önce kullanıcı tarafından düzenlenebilir ve kontrol edilebilir.
- Üretimde dağıtık rate limiting, PostgreSQL, e-posta doğrulama, kalıcı dosya politikası ve kötü amaçlı dosya taraması eklenmelidir.
