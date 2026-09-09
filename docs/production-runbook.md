# EasyQR pilot production runbook

Bu runbook, ilk pilot müşteriler için EasyQR'ı tek Node.js sunucusu ve kalıcı
SQLite volume ile çalıştırır. Uygulama ile yedekleme çalışanı aynı volume'ü
paylaşır. SQLite'ın çevrimiçi backup API'si kullanıldığı için çalışan veritabanı
dosyası doğrudan kopyalanmaz.

## 1. Gereksinimler

- Docker Engine ve Docker Compose v2
- HTTPS sağlayan bir domain veya reverse proxy
- Kalıcı Docker volume desteği
- Gerçek AI özellikleri için sunucu tarafı `OPENAI_API_KEY`
- Şifre kurtarma e-postaları için Resend API anahtarı ve doğrulanmış gönderici adresi

Bu kurulum tek uygulama instance'ı içindir. Aynı SQLite dosyasına birden fazla
uygulama instance'ı bağlanmamalıdır.

## 2. Ortam dosyası

Repo kökünde Git tarafından izlenmeyen `.env` dosyasını oluştur:

```dotenv
APP_URL=https://easyqrservice.com
OPENAI_API_KEY=sk-...
ALLOW_DEMO_MODE=false
EMAIL_DELIVERY_MODE=resend
RESEND_API_KEY=re_...
EMAIL_FROM="easyqr <no-reply@easyqrservice.com>"

BACKUP_RETENTION_DAYS=14
BACKUP_MAX_FILES=30
BACKUP_INTERVAL_HOURS=24
HOST_PORT=3000
```

`APP_URL` yalnızca public origin içermelidir; sonrasında yol veya sorgu olmamalıdır.
Canlı ortamda HTTPS zorunludur. `OPENAI_API_KEY` hiçbir zaman `NEXT_PUBLIC_`
önekli bir değişkende tutulmamalıdır.

`EMAIL_FROM` alanındaki domain [Resend](https://resend.com/docs/api-reference/emails/send-email)
üzerinde doğrulanmış olmalıdır. E-posta API
anahtarı yalnızca sunucuda tutulmalı ve `NEXT_PUBLIC_` önekiyle tanımlanmamalıdır.
Canlı uygulama, e-posta teslim ayarları eksikse başlamayı reddeder.

Demo/staging ortamında gerçek AI kasıtlı olarak kapalıysa `OPENAI_API_KEY` boş
bırakılıp `ALLOW_DEMO_MODE=true` yazılabilir. Aynı kontrollü ortamda e-postaları
terminalde görmek için `EMAIL_DELIVERY_MODE=log` seçilebilir. Müşteri ortamında
bu seçenekler kullanılmamalıdır.

## 3. Başlatma

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app
```

Uygulama konteyneri root olmayan kullanıcıyla çalışır. Veritabanı varsayılan
olarak `/data/easyqr.db`, yedekler `/data/backups` altında saklanır. `easyqr-data`
volume'ü silinmediği sürece yeniden başlatma ve yeni image dağıtımı veriyi silmez.

Sağlık kontrolü hem HTTP sunucusunu hem de veritabanı sorgusunu sınar:

```bash
curl --fail https://easyqrservice.com/api/health
```

Beklenen yanıt:

```json
{"status":"ok"}
```

## 4. Güncelleme

Güncellemeden önce isteğe bağlı manuel yedek al, ardından yeni image'ı kur:

```bash
docker compose exec backup node scripts/backup-database.cjs
docker compose up -d --build
docker compose ps
```

Dağıtım sonrasında kayıt, giriş, şifre yenileme e-postası, mevcut bir menünün
açılması ve `/api/health` kontrol edilmelidir.

## 5. Pilot Pro erişimi

Yeni hesaplar 7 günlük ve 1 menü sınırına sahip denemeyle açılır. Pilot ödeme
alındıktan sonra Pro erişimini yönetici komutuyla etkinleştir:

```bash
docker compose exec app node scripts/activate-account.cjs \
  --email musteri@example.com --days 30
```

Pro planı 5 menüye izin verir. Süresi devam eden bir Pro hesaba yeniden gün
eklendiğinde süre mevcut bitiş tarihinden uzatılır. Komuttan sonra kullanıcı
sayfayı yenilediğinde yeni durum görünür.

## 6. Yedekler

`backup` servisi başladığında ilk yedeği alır ve varsayılan olarak 24 saatte bir
tekrarlar. Her yedekte:

- SQLite online backup oluşturulur,
- `PRAGMA integrity_check` çalıştırılır,
- SHA-256 checksum dosyası yazılır,
- süre ve maksimum dosya sınırını aşan eski EasyQR yedekleri temizlenir,
- en yeni iki yedek her durumda korunur.

Manuel yedek:

```bash
docker compose exec backup node scripts/backup-database.cjs
```

Yedekleri listeleme:

```bash
docker compose exec backup sh -lc 'ls -lah /data/backups'
```

Seçilen yedeği doğrulama:

```bash
docker compose exec backup node scripts/verify-database-backup.cjs \
  --source /data/backups/easyqr-YYYYMMDDTHHMMSSmmmZ-id.sqlite3
```

Volume kaybına karşı yedekler ayrıca sağlayıcının şifreli harici depolamasına
aktarılmalıdır. Aynı volume üzerindeki yedek, sunucu veya volume tamamen
kaybolduğunda tek başına yeterli değildir.

## 7. Güvenli geri yükleme

Geri yükleme komutu mevcut veritabanının üzerine yazmaz. Önce yeni bir dosyaya
geri yükler; checksum ve SQLite bütünlüğü doğrulanmadan tamamlanmaz.

1. Uygulama ve otomatik yedekleme servisini durdur:

   ```bash
   docker compose stop app backup
   ```

2. Yedeği yeni bir hedefe geri yükle:

   ```bash
   docker compose run --rm --no-deps backup node scripts/restore-database.cjs \
     --source /data/backups/easyqr-YYYYMMDDTHHMMSSmmmZ-id.sqlite3 \
     --target /data/restored/easyqr.db
   ```

3. `.env` dosyasına `DATABASE_PATH=/data/restored/easyqr.db` ekle.

4. Servisleri başlat ve sağlık/kullanıcı verisini kontrol et:

   ```bash
   docker compose up -d
   docker compose ps
   ```

Eski `/data/easyqr.db` dosyası otomatik silinmez. Geri dönüş gerektiğinde
`DATABASE_PATH` eski dosyaya çevrilebilir.

## 8. Operasyon kuralları

- `docker compose down -v` çalıştırma; `-v` kalıcı veri volume'ünü siler.
- Veritabanını çalışan konteynerden `cp` ile kopyalama; online backup komutunu kullan.
- Anahtarları image'a, repoya veya tarayıcı ortam değişkenlerine ekleme.
- Yedek geri yüklemeyi düzenli aralıklarla staging üzerinde prova et.
- Disk doluluğunu ve `/api/health` sonucunu hosting sağlayıcısından izle.

## 9. Ölçek sınırı

Bu topoloji ilk pilot işletmeler ve tek uygulama instance'ı içindir. Birden fazla
uygulama instance'ı, yüksek yazma trafiği veya ayrı dosya depolama ihtiyacı
oluştuğunda PostgreSQL ve nesne depolamaya geçiş planlanmalıdır.
