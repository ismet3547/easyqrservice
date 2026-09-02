"use client";

import {
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  ImageIcon,
  LayoutTemplate,
  LockKeyhole,
  Printer,
  QrCode,
  ScanLine,
  Share2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";
import type { SessionUser } from "@/lib/auth";
import type { StoredMenu } from "@/lib/menus";

type PrintTemplate = "poster" | "sticker" | "table";
type Feedback = { kind: "error" | "success"; text: string } | null;

const templateOptions: Array<{
  description: string;
  icon: typeof LayoutTemplate;
  id: PrintTemplate;
  label: string;
  printHint: string;
}> = [
  {
    id: "table",
    label: "Masa kartı",
    description: "Çift yüzlü ve katlanabilir",
    printHint: "A4 sayfada iki yüz",
    icon: LayoutTemplate,
  },
  {
    id: "sticker",
    label: "Sticker",
    description: "Kasa ve masa için kompakt",
    printHint: "A4 sayfada 6 adet",
    icon: ScanLine,
  },
  {
    id: "poster",
    label: "Poster",
    description: "Giriş ve vitrin için büyük",
    printHint: "A4 tek sayfa",
    icon: ImageIcon,
  },
];

function safeFilename(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "menu";
}

function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Bağlantı panoya kopyalanamadı.");
}

function QrArtwork({
  logo,
  menuName,
  publicUrl,
  source = false,
  subtitle,
  template,
}: {
  logo: string;
  menuName: string;
  publicUrl: string;
  source?: boolean;
  subtitle: string;
  template: PrintTemplate;
}) {
  const compactUrl = publicUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <article className={`qr-artwork ${template}`}>
      <div className="qr-artwork-brand">
        {logo ? (
          <img alt={`${menuName} logosu`} src={logo} />
        ) : (
          <span>{menuName.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
        )}
      </div>
      <span className="qr-artwork-kicker">
        {template === "poster" ? "Menümüz cebinde" : "Dijital menü"}
      </span>
      <h2>{menuName}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div className="qr-artwork-code" data-qr-source={source ? "true" : undefined}>
        {publicUrl ? (
          <QRCodeSVG
            bgColor="#ffffff"
            fgColor="#20251f"
            level="H"
            marginSize={2}
            size={232}
            title={`${menuName} dijital menü QR kodu`}
            value={publicUrl}
          />
        ) : (
          <div className="qr-code-placeholder" />
        )}
      </div>
      <strong className="qr-artwork-instruction">
        <Smartphone aria-hidden="true" size={16} /> Kameranı aç ve okut
      </strong>
      <small>{compactUrl || "Bağlantı hazırlanıyor…"}</small>
      <footer><QrCode aria-hidden="true" size={13} /> easy<span>qr</span></footer>
    </article>
  );
}

function PrintSheet({
  logo,
  menuName,
  publicUrl,
  subtitle,
  template,
}: {
  logo: string;
  menuName: string;
  publicUrl: string;
  subtitle: string;
  template: PrintTemplate;
}) {
  const copies = template === "sticker" ? 6 : template === "table" ? 2 : 1;
  return (
    <section className={`qr-print-sheet ${template}`} aria-hidden="true">
      {Array.from({ length: copies }, (_, index) => (
        <QrArtwork
          key={index}
          logo={logo}
          menuName={menuName}
          publicUrl={publicUrl}
          subtitle={subtitle}
          template={template}
        />
      ))}
      {template === "table" && <div className="qr-fold-guide"><span>Katlama çizgisi</span></div>}
    </section>
  );
}

export function QrCenter({
  menuCount,
  storedMenu,
  user,
}: {
  menuCount: number;
  storedMenu: StoredMenu;
  user: SessionUser;
}) {
  const router = useRouter();
  const [publicUrl, setPublicUrl] = useState("");
  const [template, setTemplate] = useState<PrintTemplate>("table");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pngLoading, setPngLoading] = useState(false);
  const feedbackTimer = useRef<number | null>(null);
  const filename = `${safeFilename(storedMenu.name)}-qr`;
  const logo = storedMenu.menu.businessProfile?.logo || "";
  const artworkStyle = { "--qr-accent": storedMenu.theme.accent } as CSSProperties;
  const selectedTemplate = templateOptions.find((option) => option.id === template)!;
  const isLocalPreview = /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::|\/)/i.test(publicUrl);

  useEffect(() => {
    setPublicUrl(`${window.location.origin}/m/${storedMenu.slug}`);
  }, [storedMenu.slug]);

  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);

  const notify = (nextFeedback: NonNullable<Feedback>) => {
    setFeedback(nextFeedback);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 2600);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const serializeQr = () => {
    const svg = document.querySelector<SVGSVGElement>("[data-qr-source='true'] svg");
    if (!svg) throw new Error("QR kodu henüz hazırlanmadı.");
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", "1600");
    clone.setAttribute("height", "1600");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  };

  const downloadSvg = () => {
    try {
      downloadBlob(
        new Blob([serializeQr()], { type: "image/svg+xml;charset=utf-8" }),
        `${filename}.svg`,
      );
      notify({ kind: "success", text: "Vektörel SVG dosyası indirildi." });
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : "QR kodu indirilemedi." });
    }
  };

  const downloadPng = async () => {
    setPngLoading(true);
    try {
      const svgBlob = new Blob([serializeQr()], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("QR görseli oluşturulamadı."));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1600;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PNG dosyası oluşturulamadı.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("PNG dosyası oluşturulamadı.")),
          "image/png",
          1,
        );
      });
      downloadBlob(pngBlob, `${filename}-1600.png`);
      notify({ kind: "success", text: "1600 × 1600 PNG dosyası indirildi." });
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : "PNG indirilemedi." });
    } finally {
      setPngLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await copyText(publicUrl);
      notify({ kind: "success", text: "Menü bağlantısı kopyalandı." });
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : "Bağlantı kopyalanamadı." });
    }
  };

  const shareLink = async () => {
    if (!publicUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          text: `${storedMenu.name} dijital menüsünü görüntüle.`,
          title: `${storedMenu.name} menüsü`,
          url: publicUrl,
        });
        notify({ kind: "success", text: "Menü bağlantısı paylaşıldı." });
        return;
      }
      await copyLink();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      notify({ kind: "error", text: "Paylaşım başlatılamadı." });
    }
  };

  const printTemplate = () => {
    if (!publicUrl) return;
    window.print();
  };

  if (storedMenu.status !== "published") {
    return (
      <main className="dashboard-shell">
        <DashboardSidebar active="menus" menuCount={menuCount} onLogout={() => void logout()} user={user} />
        <section className="dashboard-main qr-center-main">
          <DashboardMobileHeader user={user} />
          <div className="dashboard-content qr-center-content">
            <div className="dashboard-heading">
              <div>
                <span className="dashboard-kicker"><QrCode size={14} /> QR Baskı Merkezi</span>
                <h1>Önce menünü yayınla</h1>
                <p>QR kod, müşterilerin açabileceği yayınlanmış menü için hazırlanır.</p>
              </div>
              <Link className="settings-back-link" href="/dashboard/menus"><ArrowLeft size={17} /> Menülerime dön</Link>
            </div>
            <section className="qr-unpublished-card">
              <div><LockKeyhole size={30} /></div>
              <h2>{storedMenu.name} henüz taslak</h2>
              <p>İçeriği kontrol edip menüyü yayınladığında kalıcı QR kodun otomatik oluşacak.</p>
              <Link className="dashboard-primary" href={`/studio?menu=${storedMenu.id}`}>
                Menüyü düzenle ve yayınla <ExternalLink size={16} />
              </Link>
            </section>
          </div>
        </section>
        <DashboardMobileNav active="menus" />
      </main>
    );
  }

  return (
    <main className="dashboard-shell" style={artworkStyle}>
      <DashboardSidebar active="menus" menuCount={menuCount} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main qr-center-main">
        <DashboardMobileHeader user={user} />
        <div className="dashboard-content qr-center-content">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-kicker"><QrCode size={14} /> QR Baskı Merkezi</span>
              <h1>QR kodunu her yere taşı</h1>
              <p>{storedMenu.name} için baskıya hazır tasarımlar oluştur, indir ve paylaş.</p>
            </div>
            <Link className="settings-back-link" href="/dashboard/menus"><ArrowLeft size={17} /> Menülerime dön</Link>
          </div>

          <div className="qr-center-grid">
            <div className="qr-center-controls">
              <section className="qr-control-card">
                <div className="qr-control-heading">
                  <span>01</span>
                  <div><h2>Baskı biçimini seç</h2><p>Kullanacağın alana uygun hazır düzen.</p></div>
                </div>
                <div className="qr-template-options">
                  {templateOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        className={template === option.id ? "active" : ""}
                        key={option.id}
                        onClick={() => setTemplate(option.id)}
                        type="button"
                      >
                        <Icon size={20} />
                        <span><strong>{option.label}</strong><small>{option.description}</small></span>
                        <i>{template === option.id && <Check size={12} />}</i>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="qr-control-card">
                <div className="qr-control-heading">
                  <span>02</span>
                  <div><h2>Dosyanı indir</h2><p>Dijital paylaşım veya profesyonel baskı için.</p></div>
                </div>
                <div className="qr-download-grid">
                  <button disabled={!publicUrl || pngLoading} onClick={() => void downloadPng()} type="button">
                    <FileImage size={20} />
                    <span><strong>{pngLoading ? "Hazırlanıyor…" : "PNG indir"}</strong><small>1600 × 1600 px</small></span>
                    <Download size={16} />
                  </button>
                  <button disabled={!publicUrl} onClick={downloadSvg} type="button">
                    <QrCode size={20} />
                    <span><strong>SVG indir</strong><small>Sınırsız baskı kalitesi</small></span>
                    <Download size={16} />
                  </button>
                </div>
                <button className="qr-print-button" disabled={!publicUrl} onClick={printTemplate} type="button">
                  <Printer size={18} />
                  <span><strong>{selectedTemplate.label} yazdır</strong><small>{selectedTemplate.printHint} · PDF olarak da kaydedebilirsin</small></span>
                </button>
              </section>

              <section className="qr-control-card">
                <div className="qr-control-heading">
                  <span>03</span>
                  <div><h2>Bağlantıyı paylaş</h2><p>QR ile aynı kalıcı menü adresini kullanır.</p></div>
                </div>
                <div className="qr-link-box"><span>{publicUrl || "Bağlantı hazırlanıyor…"}</span><button aria-label="Bağlantıyı kopyala" disabled={!publicUrl} onClick={() => void copyLink()}><Copy size={17} /></button></div>
                <div className="qr-share-actions">
                  <button disabled={!publicUrl} onClick={() => void shareLink()}><Share2 size={16} /> Paylaş</button>
                  <a href={publicUrl || undefined} rel="noreferrer" target="_blank"><ExternalLink size={16} /> Menüyü test et</a>
                </div>
              </section>

              {isLocalPreview && (
                <aside className="qr-local-note">
                  <CircleAlert size={20} />
                  <div><strong>Şu an yerel bağlantı kullanıyorsun</strong><p>Bu QR yalnızca bilgisayarında açılır. Gerçek baskıyı uygulamayı internete yayınladıktan sonra indir.</p></div>
                </aside>
              )}

              <aside className="qr-safety-note">
                <ShieldCheck size={20} />
                <div><strong>QR kodun kalıcıdır</strong><p>Menü içeriğini veya tasarımını değiştirdiğinde yeniden baskı yapman gerekmez.</p></div>
              </aside>

              {feedback && <div className={`qr-feedback ${feedback.kind}`} role="status">{feedback.kind === "success" ? <Check size={17} /> : <QrCode size={17} />}{feedback.text}</div>}
            </div>

            <section className="qr-preview-card">
              <div className="qr-preview-heading">
                <div><span>Canlı önizleme</span><strong>{selectedTemplate.label}</strong></div>
                <small><i /> Baskıya hazır</small>
              </div>
              <div className={`qr-preview-stage ${template}`}>
                <QrArtwork
                  logo={logo}
                  menuName={storedMenu.name}
                  publicUrl={publicUrl}
                  source
                  subtitle={storedMenu.menu.subtitle}
                  template={template}
                />
              </div>
              <p><Printer size={14} /> Yazdırma ekranında ölçeği “Varsayılan” veya “%100” olarak bırak.</p>
            </section>
          </div>
        </div>
      </section>

      <PrintSheet
        logo={logo}
        menuName={storedMenu.name}
        publicUrl={publicUrl}
        subtitle={storedMenu.menu.subtitle}
        template={template}
      />
      <DashboardMobileNav active="menus" />
    </main>
  );
}
