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
import type { MenuData, MenuTheme } from "@/lib/menu";

export type StudioEditorTab = "content" | "design";
export type StudioSaveStatus = "error" | "saved" | "saving";

type SectionLink = {
  id: string;
  label: string;
};

const editorTabs: Array<{
  description: string;
  icon: typeof FileText;
  id: StudioEditorTab;
  label: string;
}> = [
  {
    id: "content",
    label: "İçerik",
    description: "Menü ve işletme",
    icon: FileText,
  },
  {
    id: "design",
    label: "Tasarım",
    description: "Stil ve görünüm",
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
  documentName,
  onBack,
  onLogout,
  onOpenPreview,
  onPublish,
  saveStatus,
  userName,
}: {
  documentName: string;
  onBack: () => void;
  onLogout: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
  saveStatus: StudioSaveStatus;
  userName?: string;
}) {
  const saveMessage = saveStatus === "saving"
    ? "Kaydediliyor…"
    : saveStatus === "error"
      ? "Kaydedilemedi"
      : "Tüm değişiklikler kaydedildi";

  return (
    <header className="studio-header">
      <div className="studio-header-left">
        <button className="icon-button" type="button" aria-label="Dashboard'a dön" onClick={onBack}>
          <ArrowLeft size={19} />
        </button>
        <Brand compact />
        <span className="header-divider" />
        <div className="document-name">
          <strong>{documentName || "İsimsiz menü"}</strong>
          <span className={`save-state ${saveStatus}`} role="status" aria-live="polite">
            <span className="saved-dot" /> {saveMessage}
          </span>
        </div>
      </div>
      <div className="studio-actions">
        {userName && (
          <span className="studio-user"><UserRound size={15} /><span>{userName}</span></span>
        )}
        <button className="secondary-button mobile-preview-button" type="button" onClick={onOpenPreview}>
          <Eye size={17} /> <span>Önizle</span>
        </button>
        <button className="primary-button studio-publish-button" type="button" onClick={onPublish}>
          <QrCode size={17} />
          <span className="studio-publish-label-full">QR menüyü oluştur</span>
          <span className="studio-publish-label-mobile">Yayınla</span>
        </button>
        <button className="icon-button logout-button" type="button" aria-label="Çıkış yap" title="Çıkış yap" onClick={onLogout}>
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
    <div className="editor-tabs" role="tablist" aria-label="Menü düzenleme alanı">
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
            <span className="editor-tab-icon"><Icon size={18} /></span>
            <span className="editor-tab-copy"><strong>{option.label}</strong><small>{option.description}</small></span>
          </button>
        );
      })}
    </div>
  );
}

export function StudioPanelIntro({
  badges,
  description,
  kicker,
  title,
}: {
  badges: string[];
  description: string;
  kicker: string;
  title: string;
}) {
  return (
    <div className="studio-panel-intro">
      <div>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="studio-panel-badges" aria-label="Menü özeti">
        {badges.map((badge) => <span key={badge}>{badge}</span>)}
      </div>
    </div>
  );
}

export function StudioSectionNav({
  label,
  sections,
}: {
  label: string;
  sections: SectionLink[];
}) {
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav className="studio-section-nav" aria-label={label}>
      <span>Bölümler</span>
      <div>
        {sections.map((section) => (
          <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}>
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function StudioPreviewStage({ menu, theme }: { menu: MenuData; theme: MenuTheme }) {
  return (
    <section className="preview-stage" aria-label="Canlı telefon önizlemesi">
      <div className="preview-toolbar">
        <span><Smartphone size={16} /> Canlı önizleme</span>
        <div><i /> 390 × 844</div>
      </div>
      <div className="phone-frame">
        <div className="phone-speaker" />
        <div className="phone-screen"><MenuPreview menu={menu} theme={theme} framed /></div>
      </div>
      <p className="preview-hint">Değişikliklerin anında önizlemeye yansır.</p>
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
  return (
    <div className="modal-backdrop preview-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mobile-preview-modal" role="dialog" aria-modal="true" aria-label="Mobil menü önizlemesi" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Önizlemeyi kapat"><X size={19} /></button>
        <div className="phone-frame">
          <div className="phone-speaker" />
          <div className="phone-screen"><MenuPreview menu={menu} theme={theme} framed /></div>
        </div>
      </section>
    </div>
  );
}
