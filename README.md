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
- QR kod, bağlantı kopyalama, paylaşma ve SVG indirme
- Bağlantı içinden açılan mobil müşteri menüsü

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

- `app/page.tsx`: uygulama girişi
- `components/MenuStudio.tsx`: yükleme, editör, önizleme ve QR akışları
- `app/api/extract-menu/route.ts`: dosya doğrulama ve AI tabanlı menü çıkarımı
- `app/api/auth/*`: kayıt, giriş, çıkış ve aktif kullanıcı endpoint’leri
- `app/giris` ve `app/kayit`: kullanıcı erişim ekranları
- `lib/auth.ts` ve `lib/db.ts`: oturum ve SQLite altyapısı
- `lib/menu.ts`: veri modeli, demo içerik ve paylaşım bağlantısı kodlama/çözme
- `app/globals.css`: responsive tasarım sistemi

## MVP notu

Bu sürümde yayınlanan menü sıkıştırılarak URL parçasının içinde taşınır; sunucuya veya veritabanına kaydedilmez. Bu yaklaşım kurulumsuz demo ve küçük menüler için çalışır. Üretime geçerken önerilen sonraki adımlar:

1. Üretim ortamı için PostgreSQL ile işletme, menü, kategori ve ürün tabloları
2. E-posta doğrulama, şifre sıfırlama ve çoklu işletme desteği
3. Kısa, kalıcı menü adresleri (`/m/{slug}`) ve gerçek yayınlama akışı
4. Ürün görseli, alerjen, çoklu dil ve stokta yok işaretleme
5. QR tarama ve ürün görüntülenme analitiği

## Güvenlik

- Yüklemeler 12 MB ile ve desteklenen MIME türleriyle sınırlandırılır.
- API anahtarı yalnızca sunucu route’unda kullanılır.
- Parolalar 12 maliyet faktörlü `bcrypt` hash’i olarak saklanır.
- Oturum anahtarının yalnızca SHA-256 özeti veritabanında tutulur; ham anahtar HTTP-only çerezdedir.
- Kayıt ve giriş endpoint’lerinde aynı-origin kontrolü ve temel deneme sınırı uygulanır.
- AI çıktısı, yayınlamadan önce kullanıcı tarafından düzenlenebilir ve kontrol edilebilir.
- Üretimde dağıtık rate limiting, PostgreSQL, e-posta doğrulama, kalıcı dosya politikası ve kötü amaçlı dosya taraması eklenmelidir.
