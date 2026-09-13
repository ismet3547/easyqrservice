import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getRequestLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return locale === "tr"
    ? {
        title: "Çerezler ve Tarayıcı Depolaması",
        description: "easyqr çerezleri, birinci taraf analitik ve tarayıcı depolama kayıtları hakkında açıklama.",
        alternates: { canonical: "/cerez-politikasi", languages: { en: "/cookies", tr: "/cerez-politikasi" } },
      }
    : {
        title: "Cookies and Browser Storage",
        description: "How easyqr uses essential cookies, first-party analytics, and browser storage.",
        alternates: { canonical: "/cookies", languages: { en: "/cookies", tr: "/cerez-politikasi" } },
      };
}

export default async function CookiePolicyPage() {
  const locale = await getRequestLocale();

  if (locale === "en") {
    return (
      <LegalPage
        description="This page explains the essential session cookie and first-party browser records used by easyqr, including their purpose and lifetime."
        eyebrow="Cookies and similar technologies"
        kind="cookies"
        locale={locale}
        title="Cookies and Browser Storage"
      >
        <section>
          <h2>1. At a glance</h2>
          <p>
            easyqr does not use advertising cookies or third-party tracking cookies. It uses
            a first-party session cookie for secure account access and limited browser storage
            for language choices, draft recovery, and first-party menu analytics.
          </p>
        </section>

        <section>
          <h2>2. Records we use</h2>
          <div className="legal-table-wrap">
            <table>
              <thead><tr><th>Name and type</th><th>Purpose</th><th>Lifetime</th></tr></thead>
              <tbody>
                <tr>
                  <td><code>easyqr_session</code><small>First-party HTTP-only cookie</small></td>
                  <td>Securely authenticate a signed-in account. It is not used for advertising or analytics.</td>
                  <td>24 hours by default; up to 30 days when “Remember me” is selected</td>
                </tr>
                <tr>
                  <td><code>easyqr-locale</code><small>First-party HTTP-only cookie</small></td>
                  <td>Remember the application language explicitly selected by the user.</td>
                  <td>Up to one year</td>
                </tr>
                <tr>
                  <td><code>easyqr-analytics-consent</code><small>Local storage</small></td>
                  <td>Remember whether the visitor allowed or declined optional menu-interaction analytics.</td>
                  <td>Up to 180 days</td>
                </tr>
                <tr>
                  <td><code>easyqr-anonymous-visitor</code><small>Local storage</small></td>
                  <td>Distinguish a returning visitor in first-party QR-menu analytics without cross-site tracking. Only a SHA-256 digest is stored on the server.</td>
                  <td>Up to 180 days</td>
                </tr>
                <tr>
                  <td><code>easyqr-anonymous-visitor-expires</code><small>Local storage</small></td>
                  <td>Apply the expiry time for the anonymous visitor record.</td>
                  <td>Up to 180 days</td>
                </tr>
                <tr>
                  <td><code>easyqr-menu-language</code><small>Local storage</small></td>
                  <td>Remember whether the visitor chose the menu&apos;s source language or its English translation in the same browser.</td>
                  <td>Until the browser&apos;s site data is cleared</td>
                </tr>
                <tr>
                  <td><code>easyqr-draft:&lt;account id&gt;</code><small>Local storage</small></td>
                  <td>Recover the account owner&apos;s menu draft on the same device before it reaches the server.</td>
                  <td>Until saved, removed from the account, or cleared with browser site data</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>3. First-party analytics</h2>
          <p>
            A basic menu open may be counted without a persistent browser identifier. If you
            choose “Allow anonymous analytics,” the menu may also measure item and category
            visibility, language changes, and searches with no results. We do not retain raw
            IP addresses, referring URLs, or full browser strings for analytics. The random
            identifier is not used on other websites, does not build an advertising profile,
            and is not sent to third parties for analytics.
          </p>
        </section>

        <section>
          <h2>4. Managing browser data</h2>
          <ul>
            <li>Signing out removes the active session cookie.</li>
            <li>Turning off “Remember me” creates the shorter 24-hour session.</li>
            <li>You can delete cookies and local-storage records in your browser&apos;s site-data settings.</li>
            <li>Use “Privacy choices” in a published menu&apos;s footer to allow or withdraw optional interaction analytics.</li>
            <li>Clearing local storage may remove language choices and an unsaved recovery draft.</li>
            <li>Blocking the essential session cookie prevents features that require account access.</li>
          </ul>
        </section>

        <section>
          <h2>5. Changes</h2>
          <p>
            If we add a new cookie, advertising technology, or storage purpose, this table
            will be updated before use. Where the law requires consent, a suitable choice
            mechanism must be made available before that technology is enabled.
          </p>
        </section>
      </LegalPage>
    );
  }

  return (
    <LegalPage
      description="easyqr’ın kullandığı zorunlu oturum çerezini ve birinci taraf tarayıcı depolama kayıtlarını amaçları ve süreleriyle açıklar."
      eyebrow="Çerez ve benzer teknolojiler"
      kind="cookies"
      locale={locale}
      title="Çerezler ve Tarayıcı Depolaması"
    >
      <section>
        <h2>1. Kısa açıklama</h2>
        <p>
          easyqr reklam veya üçüncü taraf takip çerezi kullanmaz. Hesaba güvenli erişim
          için birinci taraf zorunlu oturum çerezi; menü tercihleri, taslak kurtarma ve
          sınırlı birinci taraf analitik için tarayıcının yerel depolama alanı kullanılır.
        </p>
      </section>

      <section>
        <h2>2. Kullanılan kayıtlar</h2>
        <div className="legal-table-wrap">
          <table>
            <thead><tr><th>Ad ve tür</th><th>Amaç</th><th>Süre</th></tr></thead>
            <tbody>
              <tr>
                <td><code>easyqr_session</code><small>Birinci taraf HTTP-only çerez</small></td>
                <td>Hesaba giriş yapan kullanıcıyı güvenli biçimde doğrulamak. Reklam veya analitik için kullanılmaz.</td>
                <td>Normal oturumda 24 saat; “Beni 30 gün hatırla” seçeneğinde en fazla 30 gün</td>
              </tr>
              <tr>
                <td><code>easyqr-locale</code><small>Birinci taraf HTTP-only çerez</small></td>
                <td>Kullanıcının açıkça seçtiği uygulama dilini hatırlamak.</td>
                <td>En fazla 1 yıl</td>
              </tr>
              <tr>
                <td><code>easyqr-analytics-consent</code><small>Yerel depolama</small></td>
                <td>Ziyaretçinin isteğe bağlı menü etkileşim analitiğine izin verip vermediğini hatırlamak.</td>
                <td>En fazla 180 gün</td>
              </tr>
              <tr>
                <td><code>easyqr-anonymous-visitor</code><small>Yerel depolama</small></td>
                <td>Aynı QR menü ziyaretçisinin tekrar gelişini, siteler arası takip yapmadan birinci taraf analitikte ayırt etmek. Sunucuda yalnızca SHA-256 özeti tutulur.</td>
                <td>En fazla 180 gün</td>
              </tr>
              <tr>
                <td><code>easyqr-anonymous-visitor-expires</code><small>Yerel depolama</small></td>
                <td>Anonim ziyaretçi kaydının son kullanma zamanını uygulamak.</td>
                <td>En fazla 180 gün</td>
              </tr>
              <tr>
                <td><code>easyqr-menu-language</code><small>Yerel depolama</small></td>
                <td>Ziyaretçinin menünün kaynak dili veya İngilizce çevirisi arasındaki tercihini aynı tarayıcıda hatırlamak.</td>
                <td>Tarayıcı site verileri temizlenene kadar</td>
              </tr>
              <tr>
                <td><code>easyqr-draft:&lt;hesap kimliği&gt;</code><small>Yerel depolama</small></td>
                <td>Hesap sahibinin henüz sunucuya kaydedilmemiş menü taslağını aynı cihazda kurtarmak.</td>
                <td>Taslak kaydedilene, hesaptan kaldırılana veya site verileri temizlenene kadar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Birinci taraf analitik</h2>
        <p>
          Temel menü açılışı kalıcı tarayıcı tanımlayıcısı olmadan sayılabilir. Ziyaretçi
          “Anonim analitiğe izin ver” seçeneğini seçerse ürün ve kategori görünürlüğü, dil
          değişikliği ve sonuçsuz aramalar da ölçülebilir. Ham IP, yönlendiren adres ve tam
          tarayıcı bilgisi analitik için saklanmaz. Rastgele tanımlayıcı başka internet
          sitelerinde kullanılmaz, reklam profili oluşturmaz ve analitik amacıyla üçüncü
          taraflara gönderilmez.
        </p>
      </section>

      <section>
        <h2>4. Kayıtları nasıl yönetebilirsiniz?</h2>
        <ul>
          <li>Hesaptan çıkış yapmak aktif oturum çerezini siler.</li>
          <li>“Beni 30 gün hatırla” seçeneğini kapatmak daha kısa, 24 saatlik oturum oluşturur.</li>
          <li>Tarayıcınızın site verileri bölümünden çerez ve yerel depolama kayıtlarını silebilirsiniz.</li>
          <li>Yayınlanan menünün altındaki “Gizlilik tercihleri” bağlantısından isteğe bağlı etkileşim analitiğine izin verebilir veya izni geri çekebilirsiniz.</li>
          <li>Yerel depolamayı silmek dil tercihini ve henüz kaydedilmemiş kurtarma taslağını kaldırabilir.</li>
          <li>Zorunlu oturum çerezini engellerseniz hesapla giriş gerektiren özellikler çalışmaz.</li>
        </ul>
      </section>

      <section>
        <h2>5. Değişiklikler</h2>
        <p>
          Yeni bir çerez, reklam teknolojisi veya farklı amaçlı depolama eklenirse bu
          tablo kullanımdan önce güncellenir; açık rıza gerektiren bir teknoloji için
          gerekli tercih mekanizması ayrıca sunulur.
        </p>
        <p className="legal-source-note">
          Genel bilgi için Kişisel Verileri Koruma Kurumunun{" "}
          <a href="https://www.kvkk.gov.tr/SharedFolderServer/CMSFiles/fb193dbb-b159-4221-8a7b-3addc083d33f.pdf" target="_blank" rel="noreferrer">Çerez Uygulamaları Hakkında Rehberi</a> incelenebilir.
        </p>
      </section>
    </LegalPage>
  );
}
