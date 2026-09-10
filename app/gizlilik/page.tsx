import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "easyqr kişisel veri işleme faaliyetleri, veri aktarımı ve KVKK kapsamındaki haklarınız.",
  alternates: { canonical: "/gizlilik" },
};

export default function PrivacyPage() {
  const legal = getLegalConfig();
  const hasContactEmail = legal.missingFields.every((field) => field !== "İletişim e-postası");

  return (
    <LegalPage
      description="Hesap sahipleri ve yayınlanan QR menüleri ziyaret eden kişiler için hangi verilerin, neden ve ne kadar süreyle işlendiğini açıklar."
      eyebrow="6698 sayılı Kanun kapsamında"
      kind="privacy"
      title="Gizlilik ve KVKK Aydınlatma Metni"
    >
      <section>
        <h2>1. Veri sorumlusu</h2>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri
          sorumlusu <strong>{legal.entityName}</strong>’dır.
        </p>
        <dl className="legal-identity-list">
          <div><dt>Veri sorumlusu</dt><dd>{legal.entityName}</dd></div>
          <div><dt>Adres</dt><dd>{legal.address}</dd></div>
          <div>
            <dt>E-posta</dt>
            <dd>{hasContactEmail ? <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> : legal.contactEmail}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>2. İşlenen kişisel veriler</h2>
        <div className="legal-table-wrap">
          <table>
            <thead><tr><th>Veri grubu</th><th>Örnekler</th></tr></thead>
            <tbody>
              <tr><td>Kimlik ve iletişim</td><td>Ad soyad, e-posta adresi</td></tr>
              <tr><td>Hesap ve güvenlik</td><td>Parola özeti, oturum belirteci özeti, oturum ve parola sıfırlama zamanları, hız sınırı kayıtları</td></tr>
              <tr><td>Hizmet içeriği</td><td>Menü, ürün, fiyat, görsel, işletme profili, iletişim ve çalışma saati bilgileri</td></tr>
              <tr><td>AI işlem verileri</td><td>AI özelliğine gönderilen menü dosyası veya metni, tasarım talebi ve üretilen sonuçlar</td></tr>
              <tr><td>Kullanım ve analitik</td><td>Menü açılış zamanı, kaynak sınıfı, cihaz sınıfı, dil, arama ve görünürlük gibi menü etkileşimleri</td></tr>
              <tr><td>İşlem kayıtları</td><td>Plan durumu, AI kredi hareketleri, yayın ve güncelleme zamanları</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Menü ziyaretlerinde ham IP adresi, yönlendiren adres veya tam tarayıcı bilgisi
          saklanmaz. IP adresi hız sınırlaması için anlık olarak kullanılır ve yalnızca
          ham değer yerine SHA-256 özeti kısa süreli güvenlik kaydında tutulur. Cihaz ve trafik
          bilgileri kaydedilmeden önce genel sınıflara dönüştürülür.
        </p>
      </section>

      <section>
        <h2>3. İşleme amaçları ve hukuki sebepler</h2>
        <ul>
          <li>Hesabı kurmak, kimlik doğrulamak ve QR menü hizmetini sunmak: sözleşmenin kurulması veya ifası.</li>
          <li>Menüleri kaydetmek, yayınlamak, yedeklemek ve hesap talimatlarını yerine getirmek: sözleşmenin ifası ve bir hakkın tesisi, kullanılması veya korunması.</li>
          <li>Kötüye kullanımı önlemek, hız sınırı uygulamak ve hizmet güvenliğini sağlamak: veri sorumlusunun meşru menfaati.</li>
          <li>Birinci taraf, sınırlı menü analitiği üretmek ve hizmeti iyileştirmek: temel haklara zarar vermemek kaydıyla meşru menfaat.</li>
          <li>Yetkili makam taleplerini ve yasal kayıt yükümlülüklerini yerine getirmek: hukuki yükümlülük ve kanunlarda açıkça öngörülme.</li>
        </ul>
        <p>
          Özel nitelikli kişisel veri yüklenmesi hizmetin amacı değildir. Menü içeriğine
          üçüncü kişilere ait kişisel veri ekleyen hesap sahibi, bunu paylaşmaya yetkili
          olduğunu ve ilgili kişileri gerektiği şekilde bilgilendirdiğini temin etmelidir.
        </p>
      </section>

      <section>
        <h2>4. Toplama yöntemi</h2>
        <p>
          Veriler; kayıt ve hesap formları, yüklenen dosyalar, menü düzenleme ve yayınlama
          işlemleri, destek ve parola sıfırlama talepleri, sunucu istekleri ile birinci
          taraf çerez ve tarayıcı depolaması üzerinden otomatik veya kısmen otomatik
          yollarla toplanır.
        </p>
      </section>

      <section>
        <h2>5. Verilerin aktarıldığı taraflar</h2>
        <ul>
          <li><strong>Barındırma ve altyapı sağlayıcıları:</strong> uygulamanın, veritabanının ve yedeklerin çalıştırılması için gerekli ölçüde.</li>
          <li><strong>OpenAI:</strong> yalnızca hesap sahibinin menü okuma, çeviri, tema veya ürün görseli üretme özelliğini başlatması halinde ilgili girdi ve çıktılar için.</li>
          <li><strong>Resend:</strong> parola sıfırlama e-postasının teslimi için e-posta adresi ve e-posta içeriğiyle sınırlı olarak.</li>
          <li><strong>Yetkili kamu kurumları ve adli merciler:</strong> hukuken zorunlu taleplerle sınırlı olarak.</li>
        </ul>
        <p>
          OpenAI, Resend veya seçilen barındırma sağlayıcısının altyapısına bağlı olarak
          veriler Türkiye dışında işlenebilir. Bu işlemler yurt dışına veri aktarımı
          doğurabilir; aktarım faaliyeti KVKK’daki güncel aktarım şartları ve uygun
          güvenceler ayrıca değerlendirilerek yürütülmelidir.
        </p>
      </section>

      <section>
        <h2>6. Saklama süreleri</h2>
        <ul>
          <li>Hesap ve menü kayıtları hesap açık olduğu sürece; hesap silme talimatıyla aktif sistemden kaldırılır.</li>
          <li>Oturumlar normal kullanımda 24 saat, “Beni 30 gün hatırla” seçildiğinde en fazla 30 gün geçerlidir.</li>
          <li>Parola sıfırlama bağlantıları 30 dakika boyunca ve tek kullanımlıktır.</li>
          <li>AI sonuç önbelleği işlem türüne göre 14 veya 30 gün içinde sona erer.</li>
          <li>Anonim ziyaretçi tanımlayıcısı tarayıcıda en fazla 180 gün tutulur; sunucuda yalnızca özeti saklanır.</li>
          <li>Silinen veriler, olağan yedek döngüsü tamamlanana kadar sınırlı süreyle yedeklerde bulunabilir.</li>
        </ul>
        <p>Yasal saklama zorunluluğu veya devam eden bir uyuşmazlık varsa ilgili kayıtlar yalnızca bu amaç ve süreyle saklanabilir.</p>
      </section>

      <section>
        <h2>7. KVKK kapsamındaki haklarınız</h2>
        <p>KVKK’nın 11. maddesi kapsamında veri sorumlusuna başvurarak:</p>
        <ul>
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenebilir ve işlenmişse bilgi talep edebilirsiniz.</li>
          <li>İşleme amacını, amaca uygun kullanımı ve verilerin aktarıldığı üçüncü kişileri öğrenebilirsiniz.</li>
          <li>Eksik veya yanlış verilerin düzeltilmesini; şartları oluşmuşsa silinmesini veya yok edilmesini isteyebilirsiniz.</li>
          <li>Düzeltme, silme veya yok etme işlemlerinin verilerin aktarıldığı taraflara bildirilmesini isteyebilirsiniz.</li>
          <li>Münhasıran otomatik analiz sonucu aleyhinize bir sonuç doğmasına itiraz edebilirsiniz.</li>
          <li>Kanuna aykırı işleme nedeniyle zarara uğramanız halinde giderim talep edebilirsiniz.</li>
        </ul>
      </section>

      <section>
        <h2>8. Başvuru yöntemi</h2>
        <p>
          Talebinizi kimliğinizi ve talebinizi doğrulamaya yeterli bilgilerle birlikte
          {hasContactEmail ? <> <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> adresine</> : " yapılandırılmış iletişim e-posta adresine"}
          {" "}veya <strong>{legal.address}</strong> adresine iletebilirsiniz. Başvurular
          niteliğine göre en kısa sürede ve en geç 30 gün içinde sonuçlandırılır.
        </p>
        <p className="legal-source-note">
          Ayrıntılı bilgi için Kişisel Verileri Koruma Kurumunun{" "}
          <a href="https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-" target="_blank" rel="noreferrer">aydınlatma yükümlülüğü</a>
          {" "}ve <a href="https://www.kvkk.gov.tr/Icerik/2036/Ilgili-Kisinin-Haklari" target="_blank" rel="noreferrer">ilgili kişi hakları</a> sayfalarına bakabilirsiniz.
        </p>
      </section>
    </LegalPage>
  );
}
