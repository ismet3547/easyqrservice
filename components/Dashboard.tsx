"use client";

import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FilePenLine,
  Plus,
  QrCode,
  Rocket,
  ScanLine,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { StoredMenu } from "@/lib/menus";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";
import { getOnboardingProgress, type OnboardingStepId } from "@/lib/onboarding";

function OnboardingStepIcon({ id }: { id: OnboardingStepId }) {
  if (id === "account") return <UserRound size={18} />;
  if (id === "menu") return <BookOpen size={18} />;
  if (id === "publish") return <Rocket size={18} />;
  return <ScanLine size={18} />;
}

export function Dashboard({
  user,
  initialMenus,
  initialWelcome = false,
}: {
  user: SessionUser;
  initialMenus: StoredMenu[];
  initialWelcome?: boolean;
}) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [copiedId, setCopiedId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [welcomeVisible, setWelcomeVisible] = useState(initialWelcome);

  const totalViews = menus.reduce((sum, menu) => sum + menu.viewCount, 0);
  const totalProducts = menus.reduce(
    (sum, storedMenu) =>
      sum + storedMenu.menu.categories.reduce((categorySum, category) => categorySum + category.items.length, 0),
    0,
  );
  const publishedCount = menus.filter((menu) => menu.status === "published").length;
  const firstPublishedMenu = menus.find((menu) => menu.status === "published");
  const onboarding = getOnboardingProgress(menus);
  const currentOnboardingStepId = onboarding.steps.find((step) => !step.complete)?.id;

  const dismissWelcome = () => {
    setWelcomeVisible(false);
    router.replace("/dashboard", { scroll: false });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const copyMenuLink = async (storedMenu: StoredMenu) => {
    await navigator.clipboard.writeText(`${window.location.origin}/m/${storedMenu.slug}`);
    setCopiedId(storedMenu.id);
    window.setTimeout(() => setCopiedId(""), 1600);
  };

  const deleteMenu = async (storedMenu: StoredMenu) => {
    const confirmed = window.confirm(`“${storedMenu.name}” menüsünü silmek istediğine emin misin?`);
    if (!confirmed) return;
    setDeletingId(storedMenu.id);
    try {
      const response = await fetch(`/api/menus/${storedMenu.id}`, { method: "DELETE" });
      if (response.ok) setMenus((current) => current.filter((menu) => menu.id !== storedMenu.id));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="overview" menuCount={menus.length} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-kicker"><Sparkles size={14} /> Kontrol paneli</span>
              <h1>Hoş geldin, {user.name.split(" ")[0]}.</h1>
              <p>{welcomeVisible ? "İlk QR menünü birlikte hazırlayalım." : "Menülerini yönet, performansını takip et ve yeni deneyimler oluştur."}</p>
            </div>
            <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> Yeni menü oluştur</Link>
          </div>

          {(!onboarding.isComplete || welcomeVisible) && (
            <section className={`onboarding-journey ${welcomeVisible ? "is-welcome" : ""}`} aria-labelledby="onboarding-title">
              <div className="onboarding-intro">
                {welcomeVisible && (
                  <button className="onboarding-welcome-close" type="button" onClick={dismissWelcome} aria-label="Hoş geldin mesajını kapat">
                    <X size={16} />
                  </button>
                )}
                <span className="onboarding-kicker"><Sparkles size={14} /> {welcomeVisible ? "Hoş geldin" : "Başlangıç rehberi"}</span>
                <h2 id="onboarding-title">{welcomeVisible ? "İlk QR menünü birlikte hazırlayalım" : onboarding.nextAction.title}</h2>
                <p>{welcomeVisible ? "Dört kısa adımda menünü oluştur, yayınla ve ilk taramanı al. Tamamladığın adımlar otomatik işaretlenir." : onboarding.nextAction.description}</p>
                <div className="onboarding-progress-copy"><strong>{onboarding.percentage}%</strong><span>{onboarding.completedSteps} / {onboarding.totalSteps} adım tamamlandı</span></div>
                <div
                  className="onboarding-progress-track"
                  role="progressbar"
                  aria-label="QR menü kurulum ilerlemesi"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={onboarding.percentage}
                ><i style={{ width: `${onboarding.percentage}%` }} /></div>
                <Link className="onboarding-primary" href={onboarding.nextAction.href}>{onboarding.nextAction.label} <ChevronRight size={17} /></Link>
              </div>

              <ol className="onboarding-steps" aria-label="QR menü kurulum adımları">
                {onboarding.steps.map((step, index) => {
                  const isCurrent = currentOnboardingStepId === step.id;
                  return (
                    <li className={`${step.complete ? "complete" : ""} ${isCurrent ? "current" : ""}`} key={step.id} aria-current={isCurrent ? "step" : undefined}>
                      <div className="onboarding-step-icon">{step.complete ? <Check size={18} /> : <OnboardingStepIcon id={step.id} />}</div>
                      <div><span>Adım {index + 1}</span><strong>{step.label}</strong><small>{step.description}</small></div>
                      <b>{step.complete ? "Tamam" : isCurrent ? "Sırada" : "Bekliyor"}</b>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <div className="dashboard-stats">
            <article><div className="stat-icon orange"><BookOpen size={19} /></div><span>Toplam menü</span><strong>{menus.length}</strong><small>{publishedCount} tanesi yayında</small></article>
            <article><div className="stat-icon green"><QrCode size={19} /></div><span>Yayındaki menü</span><strong>{publishedCount}</strong><small><i /> Müşterilere açık</small></article>
            <article><div className="stat-icon purple"><ScanLine size={19} /></div><span>Toplam görüntülenme</span><strong>{totalViews.toLocaleString("tr-TR")}</strong><small><TrendingUp size={12} /> Canlı sayaç</small></article>
            <article><div className="stat-icon blue"><FilePenLine size={19} /></div><span>Toplam ürün</span><strong>{totalProducts}</strong><small>Tüm menülerde</small></article>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-menus" id="menuler">
              <div className="dashboard-section-heading">
                <div><span>İçerik</span><h2>Menülerim</h2></div>
                {menus.length > 0 && <Link href="/studio?new=1"><Plus size={15} /> Yeni ekle</Link>}
              </div>

              {menus.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-illustration"><QrCode size={34} /><Sparkles size={16} /></div>
                  <h3>İlk menünü oluşturalım</h3>
                  <p>Mevcut menünü yükle; yapay zekâ ürünleri, kategorileri ve fiyatları senin için ayırsın.</p>
                  <Link className="dashboard-primary" href="/studio?new=1"><Plus size={17} /> Menü oluştur</Link>
                </div>
              ) : (
                <div className="dashboard-menu-list">
                  {menus.map((storedMenu) => {
                    const productCount = storedMenu.menu.categories.reduce((sum, category) => sum + category.items.length, 0);
                    const needsPublishing = storedMenu.status === "draft" || storedMenu.hasUnpublishedChanges;
                    const studioHref = `/studio?menu=${storedMenu.id}${needsPublishing ? "&publish=1" : ""}`;
                    return (
                      <article className="dashboard-menu-card" key={storedMenu.id}>
                        <div className="menu-card-preview" style={{ background: storedMenu.theme.background, color: storedMenu.theme.text }}>
                          <span style={{ background: storedMenu.theme.accent }}>{storedMenu.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                          <strong>{storedMenu.name}</strong>
                          <i style={{ background: storedMenu.theme.accent }} />
                          <i /><i />
                        </div>
                        <div className="menu-card-copy">
                          <div className="menu-card-title">
                            <div>
                              <h3>{storedMenu.name}</h3>
                              <span className={`status-badge ${storedMenu.status}`}><i /> {storedMenu.status === "published" ? "Yayında" : "Taslak"}</span>
                              {storedMenu.hasUnpublishedChanges && <span className="status-badge update-pending"><i /> Güncelleme bekliyor</span>}
                            </div>
                          </div>
                          <p>{storedMenu.menu.categories.length} kategori · {productCount} ürün</p>
                          <div className="menu-card-meta"><span><Eye size={13} /> {storedMenu.viewCount} görüntülenme</span><span>Güncellendi {new Date(storedMenu.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span></div>
                          <div className="menu-card-actions">
                            <Link className={needsPublishing ? "publish-draft" : undefined} href={studioHref}>
                              {needsPublishing ? <Rocket size={15} /> : <FilePenLine size={15} />}
                              {storedMenu.status === "draft"
                                ? "Düzenle ve yayınla"
                                : storedMenu.hasUnpublishedChanges
                                  ? "Güncellemeyi yayınla"
                                  : "Düzenle"}
                            </Link>
                            {storedMenu.status === "published" && <Link className="qr" href={`/dashboard/menus/${storedMenu.id}/qr`}><QrCode size={15} /> QR kodu</Link>}
                            {storedMenu.status === "published" && <a href={`/m/${storedMenu.slug}`} target="_blank" rel="noreferrer"><Eye size={15} /> Görüntüle</a>}
                            {storedMenu.status === "published" && <button onClick={() => void copyMenuLink(storedMenu)}>{copiedId === storedMenu.id ? <Check size={15} /> : <Copy size={15} />} {copiedId === storedMenu.id ? "Kopyalandı" : "Bağlantı"}</button>}
                            <button className="delete-menu-button" disabled={deletingId === storedMenu.id} onClick={() => void deleteMenu(storedMenu)}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="dashboard-side-column">
              <section className="dashboard-progress-card">
                <div className="progress-card-top"><div className="stat-icon orange">{onboarding.isComplete ? <TrendingUp size={18} /> : <Sparkles size={18} />}</div><span>{onboarding.isComplete ? "Büyüme zamanı" : "Sıradaki adım"}</span></div>
                <h3>{onboarding.nextAction.title}</h3>
                <p>{onboarding.nextAction.description}</p>
                <div className="progress-track"><i style={{ width: `${onboarding.percentage}%` }} /></div>
                <small>{onboarding.completedSteps} / {onboarding.totalSteps} adım</small>
                <Link className="dashboard-progress-link" href={onboarding.nextAction.href}>{onboarding.nextAction.label} <ChevronRight size={14} /></Link>
              </section>

              <section className="dashboard-tips">
                <div className="dashboard-section-heading"><div><span>İpuçları</span><h2>Daha iyi bir menü</h2></div></div>
                <Link href="/dashboard/menus"><span>01</span><div><strong>Fiyatlarını kontrol et</strong><small>AI çıktısını yayınlamadan önce gözden geçir.</small></div><ChevronRight size={15} /></Link>
                <Link href="/dashboard/menus"><span>02</span><div><strong>Kısa açıklamalar kullan</strong><small>İki satırı geçmeyen açıklamalar daha kolay okunur.</small></div><ChevronRight size={15} /></Link>
                <Link href={firstPublishedMenu ? `/dashboard/menus/${firstPublishedMenu.id}/qr` : "/dashboard/menus"}><span>03</span><div><strong>QR kodunu test et</strong><small>Baskıdan önce farklı telefonlarla okut.</small></div><ChevronRight size={15} /></Link>
              </section>
            </aside>
          </div>
        </div>
      </section>
      <DashboardMobileNav active="overview" />
    </main>
  );
}
