"use client";

import {
  ArrowLeft,
  Eye,
  FileText,
  LogOut,
  Palette,
  QrCode,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import type { KeyboardEvent } from "react";
import { MenuPreview } from "@/components/MenuPreview";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAppLocale } from "@/components/LocaleProvider";
import type { MenuData, MenuTheme } from "@/lib/menu";

export type StudioEditorTab = "content" | "design";
export type StudioSaveStatus = "error" | "saved" | "saving";

type SectionLink = {
  id: string;
  label: string;
};

const editorTabs: Array<{
  icon: typeof FileText;
  id: StudioEditorTab;
}> = [
  {
    id: "content",
    icon: FileText,
  },
  {
    id: "design",
    icon: Palette,
  },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark"><QrCode size={compact ? 17 : 20} /></span>
      <strong>easy<span>qr</span></strong>
    </div>
  );
}

export function StudioHeader({
  busy,
  documentName,
  hasUnpublishedChanges,
  isPublished,
  onBack,
  onLogout,
  onOpenPreview,
  onPublish,
  saveStatus,
  userName,
}: {
  busy: boolean;
  documentName: string;
  hasUnpublishedChanges: boolean;
  isPublished: boolean;
  onBack: () => void;
  onLogout: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
  saveStatus: StudioSaveStatus;
  userName?: string;
}) {
  const { locale } = useAppLocale();
  const copy = locale === "tr" ? {
    back: "Dashboard'a dön",
    liveCurrent: "Canlı sürüm güncel",
    openQr: "QR menüyü aç",
    preview: "Önizle",
    publish: "Yayınla",
    publishChanges: "Değişiklikleri yayınla",
    publishMenu: "QR menüyü oluştur",
    qrMenu: "QR menü",
    saveError: "Kaydedilemedi",
    saved: "Tüm değişiklikler kaydedildi",
    saving: "Kaydediliyor…",
    signOut: "Çıkış yap",
    untitled: "İsimsiz menü",
    waiting: "Taslak kaydedildi · yayın bekliyor",
  } : {
    back: "Back to dashboard",
    liveCurrent: "Live version is up to date",
    openQr: "Open QR menu",
    preview: "Preview",
    publish: "Publish",
    publishChanges: "Publish changes",
    publishMenu: "Create QR menu",
    qrMenu: "QR menu",
    saveError: "Could not save",
    saved: "All changes saved",
    saving: "Saving…",
    signOut: "Log out",
    untitled: "Untitled menu",
    waiting: "Draft saved · waiting to publish",
  };
  const saveMessage = saveStatus === "saving"
    ? copy.saving
    : saveStatus === "error"
      ? copy.saveError
      : hasUnpublishedChanges
        ? copy.waiting
        : isPublished
          ? copy.liveCurrent
          : copy.saved;
  const publishLabel = isPublished && saveStatus === "saved"
    ? hasUnpublishedChanges ? copy.publishChanges : copy.openQr
    : copy.publishMenu;

  return (
    <header className="studio-header">
      <div className="studio-header-left">
        <button className="icon-button" type="button" disabled={busy} aria-label={copy.back} onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <Brand compact />
        <span className="header-divider" />
        <div className="document-name">
          <strong>{documentName || copy.untitled}</strong>
          <span className={`save-state ${saveStatus} ${hasUnpublishedChanges ? "unpublished" : ""}`} role="status" aria-live="polite">
            <span className="saved-dot" /> {saveMessage}
          </span>
        </div>
      </div>
      <div className="studio-actions">
        <LocaleSwitcher compact />
        {userName && (
          <span className="studio-user"><UserRound size={15} /><span>{userName}</span></span>
        )}
        <button className="secondary-button mobile-preview-button" type="button" onClick={onOpenPreview}>
          <Eye size={17} /> <span>{copy.preview}</span>
        </button>
        <button className="primary-button studio-publish-button" type="button" disabled={busy} onClick={onPublish}>
          <QrCode size={17} />
          <span className="studio-publish-label-full">{publishLabel}</span>
          <span className="studio-publish-label-mobile">{isPublished && saveStatus === "saved" && !hasUnpublishedChanges ? copy.qrMenu : copy.publish}</span>
        </button>
        <button className="icon-button logout-button" type="button" disabled={busy} aria-label={copy.signOut} title={copy.signOut} onClick={onLogout}>
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}

export function StudioEditorTabs({
  activeTab,
  onChange,
}: {
  activeTab: StudioEditorTab;
  onChange: (tab: StudioEditorTab) => void;
}) {
  const { locale } = useAppLocale();
  const labels: Record<StudioEditorTab, string> = locale === "tr"
    ? { content: "İçerik", design: "Tasarım" }
    : { content: "Content", design: "Design" };
  const selectTab = (nextTab: StudioEditorTab) => {
    onChange(nextTab);
    window.requestAnimationFrame(() => {
      document.getElementById(`studio-tab-${nextTab}`)?.focus();
    });
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: StudioEditorTab,
  ) => {
    const currentIndex = editorTabs.findIndex((option) => option.id === currentTab);
    let nextIndex: number | null = null;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + editorTabs.length) % editorTabs.length;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % editorTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = editorTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(editorTabs[nextIndex].id);
  };

  return (
    <div className="editor-tabs" role="tablist" aria-label={locale === "tr" ? "Menü düzenleme alanı" : "Menu editing workspace"}>
      {editorTabs.map((option) => {
        const Icon = option.icon;
        const isActive = activeTab === option.id;
        return (
          <button
            aria-controls={`studio-panel-${option.id}`}
            aria-selected={isActive}
            className={isActive ? "active" : ""}
            id={`studio-tab-${option.id}`}
            key={option.id}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, option.id)}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            <Icon size={17} />
            <span>{labels[option.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

export function StudioSectionNav<SectionId extends string>({
  activeSection,
  label,
  onChange,
  sections,
}: {
  activeSection: SectionId;
  label: string;
  onChange: (section: SectionId) => void;
  sections: Array<SectionLink & { id: SectionId }>;
}) {
  return (
    <nav className="studio-section-nav" aria-label={label}>
      <div>
        {sections.map((section) => (
          <button
            aria-pressed={activeSection === section.id}
            className={activeSection === section.id ? "active" : ""}
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function StudioPreviewStage({ menu, theme }: { menu: MenuData; theme: MenuTheme }) {
  const { locale } = useAppLocale();
  return (
    <section className="preview-stage" aria-label={locale === "tr" ? "Canlı telefon önizlemesi" : "Live phone preview"}>
      <div className="preview-toolbar">
        <span><Smartphone size={16} /> {locale === "tr" ? "Canlı önizleme" : "Live preview"}</span>
        <div><i /> {locale === "tr" ? "Mobil görünüm" : "Mobile view"}</div>
      </div>
      <div className="phone-frame">
        <div className="phone-speaker" />
        <div className="phone-screen"><div className="public-menu-shell preview-viewport"><MenuPreview menu={menu} theme={theme} framed /></div></div>
      </div>
      <p className="preview-hint">{locale === "tr" ? "Değişikliklerin anında önizlemeye yansır." : "Your changes appear in the preview instantly."}</p>
    </section>
  );
}

export function StudioPreviewDialog({
  menu,
  onClose,
  theme,
}: {
  menu: MenuData;
  onClose: () => void;
  theme: MenuTheme;
}) {
  const { locale } = useAppLocale();
  return (
    <div className="modal-backdrop preview-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mobile-preview-modal" role="dialog" aria-modal="true" aria-label={locale === "tr" ? "Mobil menü önizlemesi" : "Mobile menu preview"} onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label={locale === "tr" ? "Önizlemeyi kapat" : "Close preview"}><X size={19} /></button>
        <div className="phone-frame">
          <div className="phone-speaker" />
          <div className="phone-screen"><div className="public-menu-shell preview-viewport"><MenuPreview menu={menu} theme={theme} framed /></div></div>
        </div>
      </section>
    </div>
  );
}
