import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { getLocalizedAppPath } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { getLegalConfig } from "@/lib/legal";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return locale === "tr"
    ? {
        title: "Kullanım Koşulları",
        description: "easyqr hesabı, QR menü yayını, AI özellikleri ve plan kullanımına ilişkin koşullar.",
        alternates: { canonical: "/kullanim-kosullari", languages: { en: "/terms", tr: "/kullanim-kosullari" } },
      }
    : {
        title: "Terms of Service",
        description: "Terms for easyqr accounts, QR-menu publishing, AI features, and plan access.",
        alternates: { canonical: "/terms", languages: { en: "/terms", tr: "/kullanim-kosullari" } },
      };
}

export default async function TermsPage() {
  const locale = await getRequestLocale();
  const legal = getLegalConfig(locale);
  const hasContactEmail = legal.contactEmailConfigured;

  if (locale === "en") {
    return (
      <LegalPage
        description="These terms explain the responsibilities and service limits that apply when you create an easyqr account and publish a QR menu."
        eyebrow="Service agreement"
        kind="terms"
        locale={locale}
        title="Terms of Service"
      >
        <section>
          <h2>1. Parties and acceptance</h2>
          <p>
            These terms are between <strong>{legal.entityName}</strong>, the operator of
            easyqr, and the person creating an account or the business they represent.
            Accepting the terms during registration forms the service agreement. Our handling
            of personal data is explained in the <Link href={getLocalizedAppPath(locale, "privacy")}>Privacy Notice</Link>.
          </p>
        </section>

        <section>
          <h2>2. The service</h2>
          <p>
            easyqr provides menu creation and editing, publishing through a QR link,
            print-ready QR materials, limited menu analytics, and optional AI-assisted menu
            extraction, translation, theme, and image tools.
          </p>
          <ul>
            <li>New accounts start with a seven-day trial and one menu.</li>
            <li>The current Pro plan supports up to five menus for the activated period.</li>
            <li>AI features may be limited by plan, rate limits, credits, or provider capacity.</li>
            <li>The plan duration, scope, and price shown before a purchase govern that transaction.</li>
          </ul>
        </section>

        <section>
          <h2>3. Account security</h2>
          <ul>
            <li>Provide accurate, current information belonging to you or the business you represent.</li>
            <li>You are responsible for securing your password and devices with account access.</li>
            <li>Report suspected unauthorised access promptly through the contact address.</li>
            <li>Do not use the service unlawfully, disrupt it, evade limits, or infringe another person&apos;s rights.</li>
          </ul>
        </section>

        <section>
          <h2>4. Menu content and publishing</h2>
          <p>
            You retain responsibility for the text, prices, brands, images, contact details,
            allergens, and other content you upload or publish. You grant easyqr a limited,
            non-exclusive technical licence to host, process, and display that content in the
            QR menus you choose to publish.
          </p>
          <ul>
            <li>Check products, prices, opening hours, and allergen information before publishing.</li>
            <li>Do not upload content that infringes copyright, trademarks, privacy, or other rights.</li>
            <li>Content that is unlawful or creates a security risk may be removed and the account may be restricted.</li>
          </ul>
        </section>

        <section>
          <h2>5. AI features</h2>
          <p>
            AI output is generated automatically and may be inaccurate, incomplete, or
            unsuitable. easyqr provides it as a draft; the account owner decides whether to
            publish it and must review names, prices, ingredients, allergens, nutrition claims,
            translations, and images before use.
          </p>
        </section>

        <section>
          <h2>6. Fees, term, cancellation, and refunds</h2>
          <p>
            During the pilot, Pro access may be activated manually for the price and period
            separately agreed with easyqr. The application does not currently renew plans or
            charge cards automatically. Invoices, cancellation, withdrawal, and refund rights
            depend on the transaction, whether you act as a business or consumer, and mandatory
            law. Payment-specific terms will be presented before paid self-service checkout is enabled.
          </p>
        </section>

        <section>
          <h2>7. Availability and changes</h2>
          <p>
            Security work, maintenance, provider outages, or events outside reasonable control
            may interrupt the service. We use reasonable technical measures and backups but do
            not promise uninterrupted or error-free operation. Material changes to plans or
            terms will be communicated through an appropriate channel before they take effect.
          </p>
        </section>

        <section>
          <h2>8. Ending an account</h2>
          <p>
            You can delete your account in Settings. Deletion permanently removes the active
            account, menus, sessions, and related records; limited copies may remain until the
            normal backup cycle completes. Serious or repeated violations may result in account
            restriction or termination.
          </p>
        </section>

        <section>
          <h2>9. Limits of responsibility</h2>
          <p>
            To the extent permitted by mandatory law, easyqr is not responsible for indirect
            loss caused by customer-published content, unchecked AI output, physical QR-print
            quality, or third-party outages. Nothing in these terms excludes liability that
            cannot lawfully be excluded, including liability for intent or gross negligence where applicable.
          </p>
        </section>

        <section>
          <h2>10. Governing law and contact</h2>
          <p>
            These terms are governed by the laws of the Republic of Türkiye, without removing
            mandatory consumer protections or jurisdiction rights that apply where you live.
            Questions can be sent to {hasContactEmail ? <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> : "the configured contact address"}.
          </p>
        </section>
      </LegalPage>
    );
  }

  return (
    <LegalPage
      description="easyqr hesabı açarken ve QR menü hizmetini kullanırken tarafların sorumluluklarını ve hizmet sınırlarını açıklar."
      eyebrow="Hizmet sözleşmesi"
      kind="terms"
      locale={locale}
      title="Kullanım Koşulları"
    >
      <section>
        <h2>1. Taraflar ve kabul</h2>
        <p>
          Bu koşullar, easyqr hizmetini sunan <strong>{legal.entityName}</strong> ile
          hesap oluşturan kişi veya adına hareket ettiği işletme arasındadır. Hesap
          oluştururken koşulları kabul etmeniz hizmet sözleşmesini kurar. Gizlilik ve
          kişisel veri işleme bilgileri ayrıca <Link href={getLocalizedAppPath(locale, "privacy")}>Gizlilik ve KVKK Aydınlatma Metni</Link>’nde açıklanır.
        </p>
      </section>

      <section>
        <h2>2. Hizmetin kapsamı</h2>
        <p>
          easyqr; menü oluşturma ve düzenleme, QR bağlantısı üzerinden yayınlama,
          baskı çıktıları, sınırlı menü analitiği ve isteğe bağlı AI destekli menü
          okuma, çeviri, tema ve görsel üretimi araçları sunar.
        </p>
        <ul>
          <li>Yeni hesaplar 7 günlük deneme süresi ve 1 menü hakkıyla açılır.</li>
          <li>Mevcut Pro plan 5 menüye kadar kullanım sağlar ve etkinleştirilen süre boyunca geçerlidir.</li>
          <li>AI özellikleri plan, hız sınırı, kredi veya sağlayıcı kapasitesiyle sınırlandırılabilir.</li>
          <li>Satın alma öncesinde bildirilen plan süresi, kapsam ve ücret ilgili işlem için esas alınır.</li>
        </ul>
      </section>

      <section>
        <h2>3. Hesap güvenliği</h2>
        <ul>
          <li>Doğru, güncel ve size veya temsil ettiğiniz işletmeye ait bilgiler vermelisiniz.</li>
          <li>Parolanızın ve hesabınıza erişen cihazların güvenliğinden siz sorumlusunuz.</li>
          <li>Yetkisiz kullanım şüphesini gecikmeden iletişim adresine bildirmelisiniz.</li>
          <li>Hesabı hukuka aykırı faaliyet, hizmeti bozma, sınırları aşma veya başkasının haklarını ihlal etme amacıyla kullanamazsınız.</li>
        </ul>
      </section>

      <section>
        <h2>4. Menü içeriği ve yayın sorumluluğu</h2>
        <p>
          Yüklediğiniz ve yayınladığınız metin, fiyat, marka, görsel, iletişim bilgisi,
          alerjen ve diğer içerik üzerindeki hak ve sorumluluk size aittir. İçeriği
          barındırmak, işlemek ve seçtiğiniz QR menüde göstermek için easyqr’a hizmetin
          sunulmasıyla sınırlı ve münhasır olmayan teknik kullanım izni verirsiniz.
        </p>
        <ul>
          <li>Fiyatların, ürünlerin, çalışma saatlerinin ve alerjen bilgilerinin doğru ve güncel olduğunu yayınlamadan önce kontrol etmelisiniz.</li>
          <li>Üçüncü kişilerin telif, marka, kişilik ve kişisel veri haklarını ihlal eden içerik yükleyemezsiniz.</li>
          <li>Hukuka aykırı veya güvenlik riski oluşturan içerik kaldırılabilir ve ilgili hesap sınırlandırılabilir.</li>
        </ul>
      </section>

      <section>
        <h2>5. Yapay zekâ özellikleri</h2>
        <p>
          AI çıktıları otomatik üretilir ve hata, eksiklik veya uygunsuz öneri içerebilir.
          easyqr AI sonucunu taslak olarak sunar; yayın kararı ve son kontrol hesap
          sahibine aittir. Özellikle ürün adı, fiyat, içerik, alerjen, beslenme etiketi,
          çeviri ve görseller insan tarafından doğrulanmalıdır.
        </p>
      </section>

      <section>
        <h2>6. Ücret, süre ve iptal</h2>
        <p>
          Pro erişimi pilot dönemde easyqr ile ayrıca mutabık kalınan bedel ve süreyle
          manuel olarak etkinleştirilebilir; uygulama içinde otomatik yenileme veya karttan
          otomatik tahsilat yapılmaz. Fatura, cayma, iptal ve iade hakları işlemin niteliği,
          tarafların tacir veya tüketici olması ve emredici mevzuata göre değerlendirilir.
        </p>
      </section>

      <section>
        <h2>7. Hizmet sürekliliği ve değişiklikler</h2>
        <p>
          Güvenlik, bakım, sağlayıcı kesintisi veya mücbir sebep nedeniyle hizmet geçici
          olarak aksayabilir. Makul teknik önlemler ve yedekler uygulanır; kesintisiz veya
          hatasız çalışma garantisi verilmez. Esaslı plan veya koşul değişiklikleri uygun
          bir kanaldan yürürlüğe girmeden önce bildirilir.
        </p>
      </section>

      <section>
        <h2>8. Hesabın sona ermesi</h2>
        <p>
          Hesabınızı ayarlardan silebilirsiniz. Silme işlemi aktif sistemdeki hesap,
          menü, oturum ve ilişkili kayıtları geri alınamaz biçimde kaldırır; kayıtlar
          olağan yedek döngüsü tamamlanana kadar yedeklerde sınırlı süre bulunabilir.
          Koşulların ağır veya tekrarlanan ihlalinde hesap erişimi sınırlandırılabilir
          ya da sona erdirilebilir.
        </p>
      </section>

      <section>
        <h2>9. Sorumluluğun sınırı</h2>
        <p>
          Emredici hukuk kuralları saklı kalmak üzere easyqr; hesap sahibinin yayınladığı
          içerikten, yanlış AI çıktısının kontrol edilmeden kullanılmasından, QR baskısının
          fiziksel kalitesinden veya üçüncü taraf hizmet kesintilerinden doğan dolaylı
          zararlardan sorumlu değildir. Bu hüküm kasıt, ağır kusur veya kanunen
          sınırlandırılamayan sorumlulukları ortadan kaldırmaz.
        </p>
      </section>

      <section>
        <h2>10. Uygulanacak hukuk ve iletişim</h2>
        <p>
          Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır. Emredici yetki kuralları ve
          tüketici hakları saklıdır. Sorularınızı
          {hasContactEmail ? <> <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> adresine</> : " yapılandırılmış iletişim e-posta adresine"}
          {" "}iletebilirsiniz.
        </p>
      </section>
    </LegalPage>
  );
}
