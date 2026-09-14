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
  RefreshCcw,
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
import { ActivationGuide } from "@/components/ActivationGuide";
import { useAppLocale } from "@/components/LocaleProvider";
import type { SessionUser } from "@/lib/auth";
import { normalizeMenuSlug } from "@/lib/menu";
import { buildMenuTrafficUrl } from "@/lib/menu-tracking";
import type { StoredMenu } from "@/lib/menus";

type PrintTemplate = "poster" | "sticker" | "table";
type Feedback = { kind: "error" | "success"; text: string } | null;

function getTemplateOptions(locale: "en" | "tr"): Array<{
  description: string;
  icon: typeof LayoutTemplate;
  id: PrintTemplate;
  label: string;
  printHint: string;
}> {
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  return [
  {
    id: "table",
    label: t("Table tent", "Masa kartı"),
    description: t("Double-sided and foldable", "Çift yüzlü ve katlanabilir"),
    printHint: t("Two sides on an A4 page", "A4 sayfada iki yüz"),
    icon: LayoutTemplate,
  },
  {
    id: "sticker",
    label: "Sticker",
    description: t("Compact for counters and tables", "Kasa ve masa için kompakt"),
    printHint: t("6 copies on an A4 page", "A4 sayfada 6 adet"),
    icon: ScanLine,
  },
  {
    id: "poster",
    label: "Poster",
    description: t("Large format for entrances and windows", "Giriş ve vitrin için büyük"),
    printHint: t("Single A4 page", "A4 tek sayfa"),
    icon: ImageIcon,
  },
  ];
}

function safeFilename(value: string) {
  return normalizeMenuSlug(value, "menu", 60);
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
  if (!copied) throw new Error("copy-failed");
}

function QrArtwork({
  displayUrl,
  logo,
  menuName,
  locale,
  qrUrl,
  source = false,
  subtitle,
  template,
}: {
  displayUrl: string;
  logo: string;
  menuName: string;
  locale: "en" | "tr";
  qrUrl: string;
  source?: boolean;
  subtitle: string;
  template: PrintTemplate;
}) {
  const compactUrl = displayUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <article className={`qr-artwork ${template}`}>
      <div className="qr-artwork-brand">
        {logo ? (
          <img alt={locale === "tr" ? `${menuName} logosu` : `${menuName} logo`} src={logo} />
        ) : (
          <span>{menuName.slice(0, 1).toLocaleUpperCase(locale === "tr" ? "tr-TR" : "en-US")}</span>
        )}
      </div>
      <span className="qr-artwork-kicker">
        {template === "poster"
          ? locale === "tr" ? "Menümüz cebinde" : "Our menu in your pocket"
          : locale === "tr" ? "Dijital menü" : "Digital menu"}
      </span>
      <h2>{menuName}</h2>
      {subtitle && <p>{subtitle}</p>}
      <div className="qr-artwork-code" data-qr-source={source ? "true" : undefined}>
        {qrUrl ? (
          <QRCodeSVG
            bgColor="#ffffff"
            fgColor="#20251f"
            level="H"
            marginSize={2}
            size={232}
            title={locale === "tr" ? `${menuName} dijital menü QR kodu` : `${menuName} digital menu QR code`}
            value={qrUrl}
          />
        ) : (
          <div className="qr-code-placeholder" />
        )}
      </div>
      <strong className="qr-artwork-instruction">
        <Smartphone aria-hidden="true" size={16} /> {locale === "tr" ? "Kameranı aç ve okut" : "Open your camera and scan"}
      </strong>
      <small>{compactUrl || (locale === "tr" ? "Bağlantı hazırlanıyor…" : "Preparing link…")}</small>
      <footer><QrCode aria-hidden="true" size={13} /> easy<span>qr</span></footer>
    </article>
  );
}

function PrintSheet({
  displayUrl,
  logo,
  locale,
  menuName,
  qrUrl,
  subtitle,
  template,
}: {
  displayUrl: string;
  logo: string;
  locale: "en" | "tr";
  menuName: string;
  qrUrl: string;
  subtitle: string;
  template: PrintTemplate;
}) {
  const copies = template === "sticker" ? 6 : template === "table" ? 2 : 1;
  return (
    <section className={`qr-print-sheet ${template}`} aria-hidden="true">
      {Array.from({ length: copies }, (_, index) => (
        <QrArtwork
          key={index}
          displayUrl={displayUrl}
          logo={logo}
          locale={locale}
          menuName={menuName}
          qrUrl={qrUrl}
          subtitle={subtitle}
          template={template}
        />
      ))}
      {template === "table" && <div className="qr-fold-guide"><span>{locale === "tr" ? "Katlama çizgisi" : "Fold line"}</span></div>}
    </section>
  );
}

export function QrCenter({
  menuCount,
  onboardingMode = false,
  storedMenu,
  user,
}: {
  menuCount: number;
  onboardingMode?: boolean;
  storedMenu: StoredMenu;
  user: SessionUser;
}) {
  const router = useRouter();
  const { locale } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const templateOptions = getTemplateOptions(locale);
  const [publicUrl, setPublicUrl] = useState("");
  const [template, setTemplate] = useState<PrintTemplate>("table");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pngLoading, setPngLoading] = useState(false);
  const [checkingVisit, setCheckingVisit] = useState(false);
  const [visitConfirmed, setVisitConfirmed] = useState(storedMenu.viewCount > 0);
  const feedbackTimer = useRef<number | null>(null);
  const filename = `${safeFilename(storedMenu.name)}-qr`;
  const logo = storedMenu.menu.businessProfile?.logo || "";
  const artworkStyle = { "--qr-accent": storedMenu.theme.accent } as CSSProperties;
  const selectedTemplate = templateOptions.find((option) => option.id === template)!;
  const qrUrl = buildMenuTrafficUrl(publicUrl, "qr");
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
    if (!svg) throw new Error(t("The QR code is not ready yet.", "QR kodu henüz hazırlanmadı."));
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
      notify({ kind: "success", text: t("Vector SVG downloaded.", "Vektörel SVG dosyası indirildi.") });
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : t("Could not download the QR code.", "QR kodu indirilemedi.") });
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
        image.onerror = () => reject(new Error(t("Could not create the QR image.", "QR görseli oluşturulamadı.")));
        image.src = svgUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1600;
      const context = canvas.getContext("2d");
      if (!context) throw new Error(t("Could not create the PNG file.", "PNG dosyası oluşturulamadı."));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error(t("Could not create the PNG file.", "PNG dosyası oluşturulamadı."))),
          "image/png",
          1,
        );
      });
      downloadBlob(pngBlob, `${filename}-1600.png`);
      notify({ kind: "success", text: t("1600 × 1600 PNG downloaded.", "1600 × 1600 PNG dosyası indirildi.") });
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : t("Could not download the PNG.", "PNG indirilemedi.") });
    } finally {
      setPngLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await copyText(publicUrl);
      notify({ kind: "success", text: t("Menu link copied.", "Menü bağlantısı kopyalandı.") });
    } catch {
      notify({ kind: "error", text: t("Could not copy the link.", "Bağlantı kopyalanamadı.") });
    }
  };

  const shareLink = async () => {
    if (!publicUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          text: t(`View the digital menu for ${storedMenu.name}.`, `${storedMenu.name} dijital menüsünü görüntüle.`),
          title: t(`${storedMenu.name} menu`, `${storedMenu.name} menüsü`),
          url: publicUrl,
        });
        notify({ kind: "success", text: t("Menu link shared.", "Menü bağlantısı paylaşıldı.") });
        return;
      }
      await copyLink();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      notify({ kind: "error", text: t("Could not start sharing.", "Paylaşım başlatılamadı.") });
    }
  };

  const printTemplate = () => {
    if (!publicUrl) return;
    window.print();
  };

  const checkFirstVisit = async () => {
    if (checkingVisit) return;
    setCheckingVisit(true);
    try {
      const response = await fetch(`/api/menus/${encodeURIComponent(storedMenu.id)}`, { cache: "no-store" });
      const result = (await response.json()) as { menu?: StoredMenu; message?: string };
      if (!response.ok || !result.menu) throw new Error(result.message || t("Could not check the menu visit.", "Menü ziyareti kontrol edilemedi."));
      if (result.menu.viewCount > 0) {
        setVisitConfirmed(true);
        notify({ kind: "success", text: t("Test visit confirmed. Setup is complete.", "Test ziyareti doğrulandı. Kurulum tamamlandı.") });
      } else {
        notify({ kind: "error", text: t("No visit yet. Scan the QR code, wait a moment, then check again.", "Henüz ziyaret yok. QR kodunu okut, kısa bir süre bekle ve tekrar kontrol et.") });
      }
    } catch (error) {
      notify({ kind: "error", text: error instanceof Error ? error.message : t("Could not check the menu visit.", "Menü ziyareti kontrol edilemedi.") });
    } finally {
      setCheckingVisit(false);
    }
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
                <span className="dashboard-kicker"><QrCode size={14} /> {t("QR Print Center", "QR Baskı Merkezi")}</span>
                <h1>{t("Publish your menu first", "Önce menünü yayınla")}</h1>
                <p>{t("A QR code is created for a published menu that guests can open.", "QR kod, müşterilerin açabileceği yayınlanmış menü için hazırlanır.")}</p>
              </div>
              <Link className="settings-back-link" href="/dashboard/menus"><ArrowLeft size={17} /> {t("Back to my menus", "Menülerime dön")}</Link>
            </div>
            <section className="qr-unpublished-card">
              <div><LockKeyhole size={30} /></div>
              <h2>{t(`${storedMenu.name} is still a draft`, `${storedMenu.name} henüz taslak`)}</h2>
              <p>{t("Review the content and publish the menu to generate its permanent QR code automatically.", "İçeriği kontrol edip menüyü yayınladığında kalıcı QR kodun otomatik oluşacak.")}</p>
              <Link className="dashboard-primary" href={`/studio?menu=${storedMenu.id}`}>
                {t("Edit and publish menu", "Menüyü düzenle ve yayınla")} <ExternalLink size={16} />
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
              <span className="dashboard-kicker"><QrCode size={14} /> {t("QR Print Center", "QR Baskı Merkezi")}</span>
              <h1>{t("Take your QR code anywhere", "QR kodunu her yere taşı")}</h1>
              <p>{t(`Create, download, and share print-ready designs for ${storedMenu.name}.`, `${storedMenu.name} için baskıya hazır tasarımlar oluştur, indir ve paylaş.`)}</p>
            </div>
            <Link className="settings-back-link" href="/dashboard/menus"><ArrowLeft size={17} /> {t("Back to my menus", "Menülerime dön")}</Link>
          </div>

          {onboardingMode && (
            <ActivationGuide
              currentStep={4}
              title={visitConfirmed
                ? t("Your first menu is live and verified.", "İlk menün yayında ve doğrulandı.")
                : t("One last check: open the QR menu.", "Son bir kontrol: QR menüyü aç.")}
              description={visitConfirmed
                ? t("Setup is complete. You can now place the permanent QR code at your venue.", "Kurulum tamamlandı. Kalıcı QR kodunu artık işletmende kullanabilirsin.")
                : t("Scan the code with another phone. If a second device is unavailable, open the test link in a new tab.", "Kodu farklı bir telefonla okut. İkinci cihaz yoksa test bağlantısını yeni sekmede aç.")}
              action={visitConfirmed ? (
                <Link href="/dashboard?activated=1"><Check size={16} /> {t("Finish setup", "Kurulumu tamamla")}</Link>
              ) : (
                <div className="activation-guide-buttons">
                  <a aria-disabled={!qrUrl} href={qrUrl || undefined} rel="noreferrer" target="_blank"><ExternalLink size={16} /> {t("Open test menu", "Test menüsünü aç")}</a>
                  <button disabled={checkingVisit} onClick={() => void checkFirstVisit()} type="button"><RefreshCcw className={checkingVisit ? "activation-spinner" : ""} size={16} /> {t("Check visit", "Ziyareti kontrol et")}</button>
                </div>
              )}
            />
          )}

          <div className="qr-center-grid">
            <div className="qr-center-controls">
              <section className="qr-control-card">
                <div className="qr-control-heading">
                  <span>01</span>
                  <div><h2>{t("Choose a print format", "Baskı biçimini seç")}</h2><p>{t("A ready-made layout for where you'll use it.", "Kullanacağın alana uygun hazır düzen.")}</p></div>
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
                  <div><h2>{t("Download your file", "Dosyanı indir")}</h2><p>{t("For digital sharing or professional printing.", "Dijital paylaşım veya profesyonel baskı için.")}</p></div>
                </div>
                <div className="qr-download-grid">
                  <button disabled={!publicUrl || pngLoading} onClick={() => void downloadPng()} type="button">
                    <FileImage size={20} />
                    <span><strong>{pngLoading ? t("Preparing…", "Hazırlanıyor…") : t("Download PNG", "PNG indir")}</strong><small>1600 × 1600 px</small></span>
                    <Download size={16} />
                  </button>
                  <button disabled={!publicUrl} onClick={downloadSvg} type="button">
                    <QrCode size={20} />
                    <span><strong>{t("Download SVG", "SVG indir")}</strong><small>{t("Unlimited print quality", "Sınırsız baskı kalitesi")}</small></span>
                    <Download size={16} />
                  </button>
                </div>
                <button className="qr-print-button" disabled={!publicUrl} onClick={printTemplate} type="button">
                  <Printer size={18} />
                  <span><strong>{t(`Print ${selectedTemplate.label}`, `${selectedTemplate.label} yazdır`)}</strong><small>{selectedTemplate.printHint} · {t("you can also save as PDF", "PDF olarak da kaydedebilirsin")}</small></span>
                </button>
              </section>

              <section className="qr-control-card">
                <div className="qr-control-heading">
                  <span>03</span>
                  <div><h2>{t("Share the link", "Bağlantıyı paylaş")}</h2><p>{t("It uses the same permanent menu address as the QR code.", "QR ile aynı kalıcı menü adresini kullanır.")}</p></div>
                </div>
                <div className="qr-link-box"><span>{publicUrl || t("Preparing link…", "Bağlantı hazırlanıyor…")}</span><button aria-label={t("Copy link", "Bağlantıyı kopyala")} disabled={!publicUrl} onClick={() => void copyLink()}><Copy size={17} /></button></div>
                <div className="qr-share-actions">
                  <button disabled={!publicUrl} onClick={() => void shareLink()}><Share2 size={16} /> {t("Share", "Paylaş")}</button>
                  <a href={qrUrl || undefined} rel="noreferrer" target="_blank"><ExternalLink size={16} /> {t("Test menu", "Menüyü test et")}</a>
                </div>
              </section>

              {isLocalPreview && (
                <aside className="qr-local-note">
                  <CircleAlert size={20} />
                  <div><strong>{t("You're using a local link", "Şu an yerel bağlantı kullanıyorsun")}</strong><p>{t("This QR code only opens on your computer. Download the final print after deploying the app online.", "Bu QR yalnızca bilgisayarında açılır. Gerçek baskıyı uygulamayı internete yayınladıktan sonra indir.")}</p></div>
                </aside>
              )}

              <aside className="qr-safety-note">
                <ShieldCheck size={20} />
                <div><strong>{t("Your QR code is permanent", "QR kodun kalıcıdır")}</strong><p>{t("You won't need to reprint it when you change menu content or design.", "Menü içeriğini veya tasarımını değiştirdiğinde yeniden baskı yapman gerekmez.")}</p></div>
              </aside>

              {feedback && <div className={`qr-feedback ${feedback.kind}`} role="status">{feedback.kind === "success" ? <Check size={17} /> : <QrCode size={17} />}{feedback.text}</div>}
            </div>

            <section className="qr-preview-card">
              <div className="qr-preview-heading">
                <div><span>{t("Live preview", "Canlı önizleme")}</span><strong>{selectedTemplate.label}</strong></div>
                <small><i /> {t("Print ready", "Baskıya hazır")}</small>
              </div>
              <div className={`qr-preview-stage ${template}`}>
                <QrArtwork
                  displayUrl={publicUrl}
                  logo={logo}
                  locale={locale}
                  menuName={storedMenu.name}
                  qrUrl={qrUrl}
                  source
                  subtitle={storedMenu.menu.subtitle}
                  template={template}
                />
              </div>
              <p><Printer size={14} /> {t("In the print dialog, leave scale at “Default” or “100%.”", "Yazdırma ekranında ölçeği “Varsayılan” veya “%100” olarak bırak.")}</p>
            </section>
          </div>
        </div>
      </section>

      <PrintSheet
        displayUrl={publicUrl}
        logo={logo}
        locale={locale}
        menuName={storedMenu.name}
        qrUrl={qrUrl}
        subtitle={storedMenu.menu.subtitle}
        template={template}
      />
      <DashboardMobileNav active="menus" />
    </main>
  );
}
