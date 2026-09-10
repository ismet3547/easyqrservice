import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Çerezler ve Tarayıcı Depolaması",
  description: "easyqr çerezleri, birinci taraf analitik ve tarayıcı depolama kayıtları hakkında açıklama.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage
      description="easyqr’ın kullandığı zorunlu oturum çerezini ve birinci taraf tarayıcı depolama kayıtlarını amaçları ve süreleriyle açıklar."
      eyebrow="Çerez ve benzer teknolojiler"
      kind="cookies"
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
                <td>Ziyaretçinin Türkçe veya İngilizce menü tercihini aynı tarayıcıda hatırlamak.</td>
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
          Yayınlanan menülerde QR açılışı, genel trafik kaynağı, cihaz sınıfı, dil,
          ürün ve kategori görünürlüğü ile sonuçsuz aramalar ölçülebilir. Ham IP,
          yönlendiren adres ve tam tarayıcı bilgisi saklanmaz. Tanımlayıcı başka internet
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
