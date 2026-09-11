# easyqrservice — düşmanca genel denetim

İncelenen başlangıç: `main` / `07ef63d6e1bd2078d73c2fb119f08698d1738e51`.
GitHub'daki #22–#25 birleşmiş durumdaydı. İncelenen yerel ağacın GitHub ağacıyla
aynı olduğu SHA üzerinden doğrulandı. Çalışma gerçek müşteri verisine veya canlı
sunucuya yazmadan, ayrı test veritabanlarında yapıldı.

## Değerlendirme

En önemli problem içerik güvenilirliğiydi: kullanıcı kaydettiğini sanarken eski bir
istek son değişikliği ezebiliyor, başarısız kayıttan sonra uygulama yine sayfadan
çıkabiliyordu. Güvenlikte şifre değişiminden sonra eski sıfırlama bağlantısının
geçerli kalması doğrudan hesap güvenliği hatasıydı.

Tasarım restoran müşterisinden çok küçük bir vitrin maketi gibi boyutlandırılmıştı.
Canlı menüde 10,5 px açıklama ve 8,5 px alerjen metni kullanılması, soluk renklerle
birleşince okumayı gereksiz zorlaştırıyordu. Renk ailesini koruyup okunabilirliği,
eylem hiyerarşisini ve hata geri bildirimini iyileştirdik.

**Sınır:** Tarayıcı yerel adresi `ERR_BLOCKED_BY_CLIENT` ile engelledi. Bu rapor
kod, CSS, hesaplanan kontrast, entegrasyon ve HTTP doğrulamasına dayanır. Gerçek
cihaz görsel onayı, piksel düzeyinde QA veya tam WCAG uygunluğu iddiası değildir.

## Düzeltilen bulgular

P1: hesap güvenliği veya veri kaybı. P2: önemli işleyiş/kullanılabilirlik sorunu.
P3: davranış tutarlılığı ve bakım iyileştirmesi. Aşağıdaki düzeltmeler PR kodundadır;
canlı ortama uygulanmaları birleştirme ve dağıtım gerektirir.

| ID | Kategori / önem | Kanıt ve etkisi | Düzeltme |
|---|---|---|---|
| S01 | Güvenlik / P1 | `auth/password` oturumları siliyor fakat `password_reset_tokens` kayıtlarını bırakıyordu. Eski e-posta bağlantısı yeni şifreyi değiştirebiliyordu. | Şifre değişimi ile bütün eski sıfırlama tokenları ve oturumlar aynı transaction'da iptal edilir. |
| S02 | Güvenlik / P1 | bcrypt beklenirken başka işlem şifreyi değiştirebilir; eski doğrulama sonucu giriş, şifre değiştirme veya hesap silme yetkisi verebilirdi. | Şifre hash'i işlem anında yeniden karşılaştırılır; şifre değişimi compare-and-swap kullanır. Eski hash ile silme reddedilir. |
| S03 | Güvenlik / P1 | IP çözümleyici istemcinin getirdiği CF/XFF/Real-IP başlıklarını sırayla kabul ediyordu. Compose portu tüm arayüzlere açıktı. | Yalnızca `CLIENT_IP_HEADER` ile seçilmiş tek IP kabul edilir; varsayılan güvenmez. Compose portu loopback'e bağlanır. Şifre/silme limitleri IP değişiminden bağımsız hesap bazlıdır. |
| S04 | Kaynak sınırları / P2 | JSON byte sınırı vardı; gövdesi tamamlanmayan isteğin okuma süresi sınırsızdı. | 15 saniyelik toplam gövde okuma sınırı, 408 ve stream iptali. Reverse proxy'nin bağlantı sınırları ayrıca gereklidir. |
| S05 | Güvenlik / P2 | Eski `#menu=zip...` bağlantıları açılırken açılmış veriye sınır yoktu; JSON biçimi yüzeysel kontrol ediliyordu. | Sıkıştırılmış bağlantı boyutu ve 12 MiB açılım sınırı; menü/tema şemasının tam doğrulanması. Bozuk localStorage taslakları da doğrulanır. |
| S06 | Dosya işleme / P2 | Tekrarlı grup içeren base64 regex'i büyük geçerli dosyalarda regex stack taşması riski taşıyordu; kayıtlı ürün görsellerinde yalnızca URL öneki kontrol ediliyordu. | Basit karakter sınıfı, padding/boyut kontrolü ve raster dosya imzaları. 6 MiB base64/imza test girdisi regresyon testine dahil. |
| D01 | Veri bütünlüğü / P1 | Otomatik kayıt, AI öncesi kayıt, çıkış ve yayın istekleri ortak sıraya sahip değildi. | Bütün Studio PATCH istekleri tek bir kayıt kuyruğunda çalışır; sonraki istek önceki cevabın sürümünü kullanır. |
| D02 | Veri bütünlüğü / P1 | İki sekme aynı eski menüyü okuyup sessizce birbirini ezebiliyordu. | `If-Match` zorunlu: eksik sürüm 428, eski sürüm 409. SQL güncellemesi sürümü de karşılaştırır. Aynı milisaniyede sürümler farklılaştırılır. |
| D03 | İşleyiş / P1 | Dashboard'a dönüş HTTP başarısızlığını yok sayıyordu; çıkış son taslağı beklemiyordu. | Çıkış/dönüş kaydı bekler ve başarısızsa ekranda kalır. Kaydedilmemiş veri için sayfadan ayrılma uyarısı, tekrar deneme ve JSON dışa/içe aktarımı bulunur. |
| D04 | İşleyiş / P2 | Ürün/menü adı, açıklama ve fiyat alanları sunucunun uzunluk sınırlarını aşabiliyordu; kullanıcı yalnızca genel kayıt hatası görüyordu. | Temel alanların `maxLength` değerleri sunucuyla eşleştirilir; kayıt hatası kalıcı ve açıklayıcı gösterilir. |
| D05 | Veri doğrulama / P2 | `1.2.3,45` benzeri bozuk binlik gruplamalar geçerli fiyat sayılıyordu. | Ondalık ve binlik gruplar ayrı doğrulanır; Türkçe ve İngilizce düzgün fiyat yazımları korunur. |
| U01 | UX / dönüşüm / P2 | Ana sayfadaki “Örnek menü” tıklaması anonim ziyaretçiyi girişe gönderiyordu. | `/ornek-menu` kayıt gerektirmeden gerçek müşteri menüsünü açar; bütün örnek CTA'ları ve sitemap güncellenir. |
| U02 | UI / okunabilirlik / P2 | Canlı açıklamalar 10,5 px, alerjenler 8,5 px, çeşitli etiketler 7 px idi. | Ürün adı 16 px, açıklama 14 px; küçük bilgilendirme metinleri en az 12 px. Dar ekran ürün/fiyat düzeni ve metin sarımı iyileştirilir. |
| U03 | UI / renk / P2 | Beyaz yazı ile `#ea5b2a` oranı 3,48:1 idi. Özel renkler ve saydam yardımcı yazılar kontrastı bozabiliyordu. | Eylem turuncusu `#b9431b` ile 5,41:1; hover 7,02:1. Tema önizlemesi/müşteri görünümü okunabilir ton kullanır; ikincil metin rengi iki yüzeyde de en az 4,5:1 olacak şekilde hesaplanır. |
| A01 | Erişilebilirlik / P2 | Dialog'larda ARIA etiketi vardı fakat odak hapsetme, geri verme, arka planı etkisizleştirme ve Escape yönetimi yoktu. | Ortak modal hook'u eklenir; odak görünür kontrollerde kalır, kapatınca geri döner; işlem sürerken kapanma engellenir. |
| A02 | Erişilebilirlik / P2 | Genel klavye odağı ve aktif menü semantiği tutarsız; bazı mobil kontroller küçüktü. | Genel focus-visible stili, dosya alanında odak göstergesi, `aria-current`, kampanya `aria-pressed` ve temel kontrollerde 44 px hedefler. |
| A03 | Animasyon / P3 | CSS azaltılmış hareketi destekliyordu ancak Studio'nun JavaScript kaydırmaları her durumda smooth idi. | Kaydırma kullanıcının reduced-motion tercihinde anlık yapılır. Mevcut CSS hareket azaltma koruması korunur. |
| U04 | Dayanıklılık / P2 | Menü dili localStorage okuma/yazması istisna atarsa müşteri görünümü hata verebiliyordu. | Depolama isteğe bağlıdır; dil seçimi bellekte çalışmayı sürdürür. |
| U05 | UX / hata bildirimi / P2 | Menü silme veya bağlantı kopyalama başarısızlığı sessiz kalabiliyor; paylaşım iptali yakalanmıyordu. | Silme/kopyalama hataları görünür mesaj verir; paylaşım iptali beklenen kullanıcı davranışı olarak ele alınır. |
| C01 | Kod / bakım / P3 | Eski bağlantı, taslak ve API verileri farklı derinlikte doğrulanıyordu. | Ortak, tarayıcıda da kullanılabilen `menu-validation.ts`; kayıt kuyruğu ve modal davranışı ayrı modüllerde. Yeni adversarial test CI'ya eklenir. |

## Tasarım eleştirisi ve uygulanan yaklaşım

- **Hiyerarşi:** Kayıt hatası geçici bir bildirim altında kaybolmamalı. Ayrı hata
  alanı ve kurtarma eylemleri eklendi. Henüz kaydedilmemiş değişiklik varken “QR
  menüyü aç” yerine yayın akışına girilir.
- **Renk / ton / parlaklık:** Parlak turuncu küçük beyaz yazıyı zayıflatıyordu.
  Marka renginin ailesi korunarak tonu koyulaştırıldı. Koyu ve açık menülerde aynı
  saydamlık yüzdesini kullanmak yerine metin-yüzey kontrastı hesaplanıyor. Tükenen
  ürünlerin fiyat ve açıklamalarındaki saydamlaştırma kaldırıldı.
- **Tipografi / yoğunluk:** Fiyat, açıklama ve alerjen metni dekoratif ayrıntı
  değildir. Mobilde görsel, ürün ve fiyatın üç dar sütuna sıkışması azaltıldı;
  çok dar ekranda ızgara tek sütuna iner. Editör telefon önizlemesi de müşteri
  menüsünün aynı tipografi kurallarını kullanır. Arama ve temel editör girişlerinde
  16 px yazı kullanılır.
- **Animasyon:** Yeni sürekli animasyon eklenmedi. Mevcut hareket azaltma tercihi
  JavaScript kaydırmasını da kapsar. Pencere etkileşimi klavye için düzenlendi.
- **Güven / dönüşüm:** Örnek düğmesinin bir kayıt duvarına çıkması yerine ziyaretçi
  doğrudan ürünün çıktısını görür ve oradan kendi menüsünü oluşturmaya geçebilir.

Kontrast hedefi [W3C WCAG 2.2 Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
modal davranışı [W3C Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
esas alınarak değerlendirildi. Bu kontroller tüm sayfalarda bütün WCAG kriterlerini
karşıladığımız anlamına gelmez; özellikle görsel/klavye tarayıcı kontrolü bekler.

## Doğrulama ve sınırlar

- `npm run typecheck`, `test:security`, `test:account`, `test:analytics`, `test:ops`
  ve yeni `test:adversarial` geçti.
- `npm run build` üretim derlemesi geçti.
- `npm audit --omit=dev --audit-level=high`: tarama anında 0 bilinen açık.
- Adversarial test: token iptali, eski şifreyle yarış, IP başlığı sahteciliği,
  tamamlanmayan gövde, 6 MiB base64/imza girdisi, bozuk JSON/base64, açılım sınırı, hesap
  izolasyonu, CSRF, iki yazıcı çakışması, yayın/taslak ayrımı, plan sınırı, kayıt
  sırası ve 7 tema senaryosu. Rastgele/fuzz testi veya yük testi değildir.
- Üretim HTTP smoke kontrolü geçti: sağlık, örnek menü, kayıt, oturum, dashboard,
  Studio, QR, sürüm zorunluluğu, çakışma, yayın/taslak ayrımı ve çıkış. Tarayıcı etkileşimleri
  bu ortamda çalıştırılamadığı için HTTP başarısı görsel onay yerine geçmez.
- Docker CLI yerelde yoksa imaj doğrulaması GitHub Actions'taki mevcut Docker
  adımında yapılır. Canlı CDN/proxy, TLS, e-posta teslimi, gerçek OpenAI çağrıları
  ve üretim yedeklerinin geri yüklenmesi bu yerel denetimle doğrulanmış değildir.

## Yayından önce uygulanacaklar

1. `docs/production-runbook.md` içindeki `CLIENT_IP_HEADER` ve loopback proxy
   geçişini uygula. Başlığın güvenilir proxy tarafından yeniden yazıldığını,
   origin'in doğrudan internete açık olmadığını doğrula. Boş başlık tüm
   ziyaretçileri ortak limite sokar.
2. Açık eski Studio sekmelerini yenile; sürümsüz eski istemciler artık 428 alır.
3. 320/390/768/1440 px ekranlarda ana sayfa → örnek → kayıt → Studio → yayın → QR
   akışını görsel olarak kontrol et. Uzun ürün adı, uzun fiyat, görselli/görselsiz
   ürün, ızgara ve koyu tema dahil olsun.
4. Klavyeyle her pencereyi aç; Tab/Shift+Tab, Escape ve odağın geri dönüşünü
   dene. 200% zoom ve reduced-motion ile taşma/hareket kontrolü yap.
5. Bağlantıyı kesip değişiklik yap: kayıt hatası görünmeli; dönüş/çıkış veri
   kaybettirmemeli. Taslağı indir, yeniden aç, geri yükle ve yayınla. İki sekmeyle
   409 çakışması sonrası bilinçli kurtarma akışını kontrol et.

## Mimari ve ticari sınırlar

`MenuStudio.tsx` ve `globals.css` hâlâ büyük. Bu PR sorunlu kayıt, doğrulama ve
modal sorumluluklarını ayırır; tüm uygulamayı baştan yazmaz. Görseller hâlâ JSON
ve SQLite içinde tutulur; yüksek trafikte medya depolama/CDN ve yük testi ayrı
çalışma gerektirir. Tek instance pilot ve manuel Pro etkinleştirme mevcut ürün
kararlarıdır. E-posta doğrulaması, otomatik ödeme, fiyatlandırma ve bağımsız canlı
pentest bu değişiklikte tamamlanmış özellikler olarak sunulmaz.
