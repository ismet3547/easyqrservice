import { ArrowLeft, Mail, QrCode } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getLocalizedAppPath, type AppLocale } from "@/lib/i18n";
import { getLegalConfig, getLegalDocumentDateLabel } from "@/lib/legal";

type LegalPageKind = "cookies" | "privacy" | "terms";

export function LegalPage({
  children,
  description,
  eyebrow,
  kind,
  locale,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  kind: LegalPageKind;
  locale: AppLocale;
  title: string;
}) {
  const legal = getLegalConfig(locale);
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const documents = [
    { href: getLocalizedAppPath(locale, "privacy"), kind: "privacy" as const, label: t("Privacy", "Gizlilik ve KVKK") },
    { href: getLocalizedAppPath(locale, "cookies"), kind: "cookies" as const, label: t("Cookies and storage", "Çerezler ve depolama") },
    { href: getLocalizedAppPath(locale, "terms"), kind: "terms" as const, label: t("Terms of service", "Kullanım koşulları") },
  ];

  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link className="legal-brand" href="/" aria-label={t("easyqr home", "easyqr ana sayfa")}>
          <span><QrCode size={20} /></span>
          <strong>easy<i>qr</i></strong>
        </Link>
        <nav aria-label={t("Legal pages", "Yasal sayfalar")}>
          {documents.map((document) => (
            <Link
              aria-current={kind === document.kind ? "page" : undefined}
              href={document.href}
              key={document.kind}
            >
              {document.label}
            </Link>
          ))}
        </nav>
        <div className="legal-header-actions">
          <LocaleSwitcher compact />
          <Link className="secondary-button" href="/"><ArrowLeft size={16} /> {t("Home", "Ana sayfa")}</Link>
        </div>
      </header>

      <section className="legal-hero">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <small>{t("Effective date", "Yürürlük tarihi")}: {getLegalDocumentDateLabel(locale)}</small>
      </section>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <nav aria-label={t("Document selection", "Belge seçimi")}>
            <strong>{t("Documents", "Belgeler")}</strong>
            {documents.map((document) => (
              <Link
                aria-current={kind === document.kind ? "page" : undefined}
                href={document.href}
                key={document.kind}
              >
                {document.label}
              </Link>
            ))}
          </nav>
          <div className="legal-contact-card">
            <Mail size={18} />
            <div>
              <strong>{t("Need help?", "Bir sorun mu var?")}</strong>
              {legal.contactEmailConfigured ? (
                <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
              ) : (
                <span>{legal.contactEmail}</span>
              )}
            </div>
          </div>
        </aside>

        <article className="legal-document">
          {legal.missingFields.length > 0 && (
            <div className="legal-config-warning" role="note">
              <strong>{t("Development environment note", "Geliştirme ortamı notu")}</strong>
              <p>{t(
                `${legal.missingFields.join(", ")} must be configured before launch.`,
                `Canlıya almadan önce ${legal.missingFields.join(", ").toLocaleLowerCase("tr-TR")} tamamlanmalıdır.`,
              )}</p>
            </div>
          )}
          {children}
        </article>
      </div>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} easyqr</span>
        <div>
          <Link href={getLocalizedAppPath(locale, "privacy")}>{t("Privacy", "Gizlilik")}</Link>
          <Link href={getLocalizedAppPath(locale, "cookies")}>{t("Cookies", "Çerezler")}</Link>
          <Link href={getLocalizedAppPath(locale, "terms")}>{t("Terms", "Koşullar")}</Link>
        </div>
      </footer>
    </main>
  );
}
