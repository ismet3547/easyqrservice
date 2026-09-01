# easyqr

Restoran ve kafelerin mevcut PDF veya görsel menülerini yapay zekâ ile okuyup, düzenlenebilir ve telefona uygun QR menülere dönüştüren MVP.

## Neler hazır?

- JPG, PNG, WEBP ve PDF menü yükleme
- OpenAI Responses API ile kategori, ürün, açıklama ve fiyat çıkarımı
- API anahtarı olmadan deneyimlenebilen, açıkça etiketlenmiş demo modu
- Kategori ve ürün ekleme, düzenleme, silme
- Renk, tipografi, kart/kompakt düzen ve açıklama görünürlüğü ayarları
- Anlık telefon önizlemesi
- Tarayıcıda otomatik taslak kaydı
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
- `lib/menu.ts`: veri modeli, demo içerik ve paylaşım bağlantısı kodlama/çözme
- `app/globals.css`: responsive tasarım sistemi

## MVP notu

Bu sürümde yayınlanan menü sıkıştırılarak URL parçasının içinde taşınır; sunucuya veya veritabanına kaydedilmez. Bu yaklaşım kurulumsuz demo ve küçük menüler için çalışır. Üretime geçerken önerilen sonraki adımlar:

1. Supabase/PostgreSQL ile işletme, menü, kategori ve ürün tabloları
2. Kullanıcı hesabı ve çoklu işletme desteği
3. Kısa, kalıcı menü adresleri (`/m/{slug}`) ve gerçek yayınlama akışı
4. Ürün görseli, alerjen, çoklu dil ve stokta yok işaretleme
5. QR tarama ve ürün görüntülenme analitiği

## Güvenlik

- Yüklemeler 12 MB ile ve desteklenen MIME türleriyle sınırlandırılır.
- API anahtarı yalnızca sunucu route’unda kullanılır.
- AI çıktısı, yayınlamadan önce kullanıcı tarafından düzenlenebilir ve kontrol edilebilir.
- Üretimde rate limiting, kimlik doğrulama, kalıcı dosya politikası ve kötü amaçlı dosya taraması eklenmelidir.
