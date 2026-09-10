import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { getLegalConfig } from "@/lib/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "easyqr hesabı, QR menü yayını, AI özellikleri ve plan kullanımına ilişkin koşullar.",
  alternates: { canonical: "/kullanim-kosullari" },
};

export default function TermsPage() {
  const legal = getLegalConfig();
  const hasContactEmail = legal.missingFields.every((field) => field !== "İletişim e-postası");

  return (
    <LegalPage
      description="easyqr hesabı açarken ve QR menü hizmetini kullanırken tarafların sorumluluklarını ve hizmet sınırlarını açıklar."
      eyebrow="Hizmet sözleşmesi"
      kind="terms"
      title="Kullanım Koşulları"
    >
      <section>
        <h2>1. Taraflar ve kabul</h2>
        <p>
          Bu koşullar, easyqr hizmetini sunan <strong>{legal.entityName}</strong> ile
          hesap oluşturan kişi veya adına hareket ettiği işletme arasındadır. Hesap
          oluştururken koşulları kabul etmeniz hizmet sözleşmesini kurar. Gizlilik ve
          kişisel veri işleme bilgileri ayrıca <Link href="/gizlilik">Gizlilik ve KVKK Aydınlatma Metni</Link>’nde açıklanır.
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
