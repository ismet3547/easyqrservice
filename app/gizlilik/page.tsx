import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getRequestLocale } from "@/lib/i18n-server";
import { getLegalConfig } from "@/lib/legal";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return locale === "tr"
    ? {
        title: "Gizlilik ve KVKK Aydınlatma Metni",
        description: "easyqr kişisel veri işleme faaliyetleri, veri aktarımı ve KVKK kapsamındaki haklarınız.",
        alternates: { canonical: "/gizlilik", languages: { en: "/privacy", tr: "/gizlilik" } },
      }
    : {
        title: "Privacy Notice",
        description: "How easyqr collects, uses, shares, and retains personal data.",
        alternates: { canonical: "/privacy", languages: { en: "/privacy", tr: "/gizlilik" } },
      };
}

export default async function PrivacyPage() {
  const locale = await getRequestLocale();
  const legal = getLegalConfig(locale);
  const hasContactEmail = legal.contactEmailConfigured;

  if (locale === "en") {
    return (
      <LegalPage
        description="This notice explains what data we process about account owners and visitors to published QR menus, why we process it, and how long we keep it."
        eyebrow="Privacy and data protection"
        kind="privacy"
        locale={locale}
        title="Privacy Notice"
      >
        <section>
          <h2>1. Who is responsible for your data?</h2>
          <p><strong>{legal.entityName}</strong> is responsible for the personal data described in this notice.</p>
          <dl className="legal-identity-list">
            <div><dt>Legal entity</dt><dd>{legal.entityName}</dd></div>
            <div><dt>Address</dt><dd>{legal.address}</dd></div>
            <div><dt>Email</dt><dd>{hasContactEmail ? <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> : legal.contactEmail}</dd></div>
          </dl>
        </section>

        <section>
          <h2>2. Data we process</h2>
          <div className="legal-table-wrap">
            <table>
              <thead><tr><th>Data group</th><th>Examples</th></tr></thead>
              <tbody>
                <tr><td>Identity and contact</td><td>Name and email address</td></tr>
                <tr><td>Account and security</td><td>Password hash, session-token hash, session and password-reset timestamps, and rate-limit records</td></tr>
                <tr><td>Service content</td><td>Menus, items, prices, images, business profile, contact details, and opening hours</td></tr>
                <tr><td>AI requests</td><td>Menu files or text, design instructions, and generated results when you choose an AI feature</td></tr>
                <tr><td>Usage and analytics</td><td>Menu-open time, broad traffic source, device class, language, searches, and item or category visibility</td></tr>
                <tr><td>Service records</td><td>Plan state, AI-credit movements, and publish or update timestamps</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            We do not retain a visitor&apos;s raw IP address, referring URL, or full browser
            string in menu analytics. An IP address may be used momentarily for security
            rate limiting; only a SHA-256 digest is held in the short-lived security record.
            Device and traffic details are reduced to broad categories before storage.
          </p>
        </section>

        <section>
          <h2>3. Why we process data</h2>
          <ul>
            <li>To create accounts, authenticate users, and provide the QR-menu service.</li>
            <li>To save, publish, back up, and maintain menus at the account owner&apos;s request.</li>
            <li>To prevent abuse, enforce rate limits, and protect the service and its users.</li>
            <li>To provide limited first-party menu analytics and improve the product.</li>
            <li>To meet legal obligations and respond to valid requests from public authorities.</li>
          </ul>
          <p>
            Where applicable, we rely on performing our contract, complying with law, and
            legitimate interests such as service security and limited, identifier-free menu-open
            measurement. Optional interaction analytics that use a persistent random browser
            identifier run only after the visitor allows them. We do not ask you to upload
            sensitive personal data. Account owners must have the right to publish any personal
            data they add to menu content and must give any required notices.
          </p>
        </section>

        <section>
          <h2>4. How data is collected</h2>
          <p>
            Data comes from account and recovery forms, uploaded files, menu editing and
            publishing actions, support requests, server requests, first-party cookies, and
            browser storage. Collection may be automatic or partly automatic.
          </p>
        </section>

        <section>
          <h2>5. Service providers and international processing</h2>
          <ul>
            <li><strong>Hosting and infrastructure providers:</strong> to run the application, database, and backups.</li>
            <li><strong>OpenAI:</strong> only when an account owner starts menu extraction, translation, theme, or product-image generation; the relevant input and output are processed.</li>
            <li><strong>Resend:</strong> to deliver password-reset emails using the recipient address and message content.</li>
            <li><strong>Public authorities:</strong> where disclosure is legally required.</li>
          </ul>
          <p>
            Providers may process data outside your country. Where data-protection law
            requires safeguards for an international transfer, the operator must assess and
            put the appropriate safeguards in place before launch in that market.
          </p>
        </section>

        <section>
          <h2>6. Retention</h2>
          <ul>
            <li>Account and menu records remain while the account is open and are removed from the active system when the account is deleted.</li>
            <li>Sessions last 24 hours by default or up to 30 days when “Remember me” is selected.</li>
            <li>Password-reset links expire after 30 minutes and can be used only once.</li>
            <li>AI result caches expire after 14 or 30 days, depending on the operation.</li>
            <li>After analytics is allowed, the anonymous visitor identifier remains in browser storage for up to 180 days; the server stores only its digest.</li>
            <li>Deleted records may remain for a limited period until the normal backup cycle completes.</li>
          </ul>
          <p>Records may be retained longer only where law requires it or for a live legal claim, and only for that purpose.</p>
        </section>

        <section>
          <h2>7. Your choices and rights</h2>
          <p>
            Depending on where you live and which law applies, you may have rights to access,
            correct, delete, restrict, or object to the processing of your personal data, and
            to receive a portable copy. You may also have the right to complain to your local
            data-protection authority. These rights can be subject to legal exceptions.
          </p>
          <p className="legal-source-note">
            People in the EEA can consult the official text of the{" "}
            <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" target="_blank" rel="noreferrer">General Data Protection Regulation</a>.
          </p>
        </section>

        <section>
          <h2>8. Contact and requests</h2>
          <p>
            Send a request with enough information to verify your identity and understand the
            request to {hasContactEmail ? <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> : "the configured privacy contact"}
            {" "}or to <strong>{legal.address}</strong>. We will respond within the period required by the law that applies to your request.
          </p>
        </section>
      </LegalPage>
    );
  }

  return (
    <LegalPage
      description="Hesap sahipleri ve yayınlanan QR menüleri ziyaret eden kişiler için hangi verilerin, neden ve ne kadar süreyle işlendiğini açıklar."
      eyebrow="6698 sayılı Kanun kapsamında"
      kind="privacy"
      locale={locale}
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
          <li>Kalıcı ziyaretçi tanımlayıcısı olmadan temel menü açılışını ölçmek ve hizmet güvenilirliğini değerlendirmek: temel haklara zarar vermemek kaydıyla meşru menfaat.</li>
          <li>Rastgele ve kalıcı tarayıcı tanımlayıcısıyla ürün görünürlüğü, dil değişikliği ve arama etkileşimlerini ölçmek: ziyaretçinin açık tercihi ve gerektiğinde açık rızası.</li>
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
          <li>Analitiğe izin verildikten sonra anonim ziyaretçi tanımlayıcısı tarayıcıda en fazla 180 gün tutulur; sunucuda yalnızca özeti saklanır.</li>
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
