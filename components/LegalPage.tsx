import { ArrowLeft, Mail, QrCode } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getLegalConfig, legalDocumentDateLabel } from "@/lib/legal";

type LegalPageKind = "cookies" | "privacy" | "terms";

const documents = [
  { href: "/gizlilik", kind: "privacy" as const, label: "Gizlilik ve KVKK" },
  { href: "/cerez-politikasi", kind: "cookies" as const, label: "Çerezler ve depolama" },
  { href: "/kullanim-kosullari", kind: "terms" as const, label: "Kullanım koşulları" },
];

export function LegalPage({
  children,
  description,
  eyebrow,
  kind,
  title,
}: {
  children: ReactNode;
  description: string;
  eyebrow: string;
  kind: LegalPageKind;
  title: string;
}) {
  const legal = getLegalConfig();
  const hasContactEmail = legal.missingFields.every((field) => field !== "İletişim e-postası");

  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Link className="legal-brand" href="/" aria-label="easyqr ana sayfa">
          <span><QrCode size={20} /></span>
          <strong>easy<i>qr</i></strong>
        </Link>
        <nav aria-label="Yasal sayfalar">
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
        <Link className="secondary-button" href="/"><ArrowLeft size={16} /> Ana sayfa</Link>
      </header>

      <section className="legal-hero">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <small>Yürürlük tarihi: {legalDocumentDateLabel}</small>
      </section>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <nav aria-label="Belge seçimi">
            <strong>Belgeler</strong>
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
              <strong>Bir sorun mu var?</strong>
              {hasContactEmail ? (
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
              <strong>Geliştirme ortamı notu</strong>
              <p>Canlıya almadan önce {legal.missingFields.join(", ").toLocaleLowerCase("tr-TR")} tamamlanmalıdır.</p>
            </div>
          )}
          {children}
        </article>
      </div>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} easyqr</span>
        <div>
          <Link href="/gizlilik">Gizlilik</Link>
          <Link href="/cerez-politikasi">Çerezler</Link>
          <Link href="/kullanim-kosullari">Koşullar</Link>
        </div>
      </footer>
    </main>
  );
}
