"use client";

import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FilePenLine,
  Flame,
  Layers3,
  MousePointerClick,
  Plus,
  QrCode,
  Repeat2,
  Rocket,
  ScanLine,
  SearchX,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type {
  DashboardOverviewAnalytics,
  DashboardPeriod,
} from "@/lib/analytics";
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

function formatDashboardDay(date: string) {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function MetricChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return current > 0
      ? <small className="positive"><Sparkles size={12} /> Yeni veri</small>
      : <small className="neutral">Henüz veri yok</small>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change < 0) {
    return <small className="negative"><TrendingDown size={12} /> %{Math.abs(change)}</small>;
  }
  return <small className="positive"><TrendingUp size={12} /> %{change}</small>;
}

function DashboardMetric({
  current,
  icon,
  label,
  previous,
  subtitle,
  tone,
  value,
}: {
  current: number;
  icon: ReactNode;
  label: string;
  previous: number;
  subtitle: string;
  tone: "orange" | "green" | "purple" | "blue";
  value: string;
}) {
  return (
    <article className="dashboard-v2-metric">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <div><MetricChange current={current} previous={previous} /><small>{subtitle}</small></div>
    </article>
  );
}

type DashboardOpportunity = {
  description: string;
  href: string;
  icon: "flame" | "layers" | "search";
  label: string;
  title: string;
  tone: "orange" | "green" | "purple";
};

export function Dashboard({
  user,
  initialAnalytics,
  initialMenus,
  initialWelcome = false,
}: {
  user: SessionUser;
  initialAnalytics: DashboardOverviewAnalytics;
  initialMenus: StoredMenu[];
  initialWelcome?: boolean;
}) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [copiedId, setCopiedId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [welcomeVisible, setWelcomeVisible] = useState(initialWelcome);
  const [period, setPeriod] = useState<DashboardPeriod>(7);

  const analytics = initialAnalytics.periods[period];
  const hasInteractionTracking = Boolean(initialAnalytics.trackingStartedAt);
  const firstPublishedMenu = menus.find((menu) => menu.status === "published");
  const onboarding = getOnboardingProgress(menus);
  const currentOnboardingStepId = onboarding.steps.find((step) => !step.complete)?.id;
  const returningRate = analytics.uniqueVisitors > 0
    ? Math.round((analytics.returningVisitors / analytics.uniqueVisitors) * 100)
    : 0;
  const previousReturningRate = analytics.previousUniqueVisitors > 0
    ? Math.round((analytics.previousReturningVisitors / analytics.previousUniqueVisitors) * 100)
    : 0;
  const topProduct = analytics.popularProducts[0] || null;
  const hasCategoryData = analytics.categoryPerformance.some((category) => category.views > 0);
  const lowReachCategory = hasCategoryData && analytics.views >= 3
    ? [...analytics.categoryPerformance]
      .filter((category) => category.reach < 25)
      .sort((left, right) => left.reach - right.reach || left.views - right.views)[0] || null
    : null;
  const missedSearch = analytics.missedSearches[0] || null;
  const opportunities: DashboardOpportunity[] = [];

  if (topProduct) {
    opportunities.push({
      description: `Son ${period} günde ${topProduct.views} doğrulanmış ürün görünürlüğü aldı.`,
      href: `/studio?menu=${topProduct.menuId}`,
      icon: "flame",
      label: "Ürünü geliştir",
      title: `${topProduct.itemName} dikkat çekiyor`,
      tone: "orange",
    });
  }
  if (missedSearch) {
    opportunities.push({
      description: `“${missedSearch.term}” ${missedSearch.count} kez arandı ancak eşleşen ürün bulunamadı.`,
      href: "/dashboard/menus",
      icon: "search",
      label: "Menüleri kontrol et",
      title: "Müşterinin aradığını yakala",
      tone: "purple",
    });
  }
  if (lowReachCategory && opportunities.length < 3) {
    opportunities.push({
      description: `Menü ziyaretlerinin yalnızca %${lowReachCategory.reach} kadarı bu kategoriye ulaştı.`,
      href: `/studio?menu=${lowReachCategory.menuId}`,
      icon: "layers",
      label: "Kategoriyi düzenle",
      title: `${lowReachCategory.categoryName} daha görünür olabilir`,
      tone: "green",
    });
  }
  if (opportunities.length === 0) {
    opportunities.push({
      description: firstPublishedMenu
        ? "QR kodunu müşterilerle paylaş. Ürün ilgisi oluştuğunda fırsatlar burada otomatik belirecek."
        : onboarding.nextAction.description,
      href: firstPublishedMenu
        ? `/dashboard/menus/${firstPublishedMenu.id}/qr`
        : onboarding.nextAction.href,
      icon: "flame",
      label: firstPublishedMenu ? "QR kodunu paylaş" : onboarding.nextAction.label,
      title: firstPublishedMenu ? "İlk davranış verilerini topla" : onboarding.nextAction.title,
      tone: "orange",
    });
  }
  const maximumActivity = Math.max(
    ...analytics.activity.flatMap((point) => [point.views, point.productViews]),
    1,
  );

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
      if (response.ok) {
        setMenus((current) => current.filter((menu) => menu.id !== storedMenu.id));
        router.refresh();
      }
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

          <section className="dashboard-period-toolbar" aria-label="Dashboard tarih aralığı">
            <div>
              <strong>Menünde ne oluyor?</strong>
              <span>
                {initialAnalytics.trackingStartedAt
                  ? "Gerçek müşteri davranışlarından güncellenir."
                  : "Yeni etkileşim ölçümü ilk müşteri ziyaretini bekliyor."}
              </span>
            </div>
            <div role="group" aria-label="Tarih aralığı seç">
              {([7, 30] as DashboardPeriod[]).map((option) => (
                <button
                  aria-pressed={period === option}
                  className={period === option ? "active" : ""}
                  key={option}
                  onClick={() => setPeriod(option)}
                  type="button"
                >Son {option} gün</button>
              ))}
            </div>
          </section>

          <section className="dashboard-v2-metrics" aria-label={`Son ${period} gün performans özeti`}>
            <DashboardMetric
              current={analytics.views}
              icon={<Eye size={20} />}
              label="Menü görüntüleme"
              previous={analytics.previousViews}
              subtitle="önceki döneme göre"
              tone="orange"
              value={analytics.views.toLocaleString("tr-TR")}
            />
            <DashboardMetric
              current={analytics.uniqueVisitors}
              icon={<UsersRound size={20} />}
              label="Tekil ziyaretçi"
              previous={analytics.previousUniqueVisitors}
              subtitle={`${analytics.qrScans} QR kaynaklı açılış`}
              tone="green"
              value={hasInteractionTracking ? analytics.uniqueVisitors.toLocaleString("tr-TR") : "—"}
            />
            <DashboardMetric
              current={returningRate}
              icon={<Repeat2 size={20} />}
              label="Tekrar gelen"
              previous={previousReturningRate}
              subtitle={`${analytics.returningVisitors} ziyaretçi geri geldi`}
              tone="purple"
              value={hasInteractionTracking ? `%${returningRate}` : "—"}
            />
            <DashboardMetric
              current={analytics.productViews}
              icon={<MousePointerClick size={20} />}
              label="Ürün görünürlüğü"
              previous={analytics.previousProductViews}
              subtitle={`${analytics.campaignViews} kampanya gösterimi`}
              tone="blue"
              value={hasInteractionTracking ? analytics.productViews.toLocaleString("tr-TR") : "—"}
            />
          </section>

          <section className="dashboard-opportunities" aria-labelledby="dashboard-opportunities-title">
            <div className="dashboard-v2-section-heading">
              <div><span><Sparkles size={13} /> Akıllı fırsatlar</span><h2 id="dashboard-opportunities-title">Sıradaki en iyi hamleler</h2></div>
              <Link href="/dashboard/analytics">Tüm analitik <ArrowUpRight size={14} /></Link>
            </div>
            <div className="dashboard-opportunity-grid">
              {opportunities.slice(0, 3).map((opportunity) => (
                <article className={`dashboard-opportunity ${opportunity.tone}`} key={`${opportunity.icon}-${opportunity.title}`}>
                  <div>
                    {opportunity.icon === "flame" && <Flame size={20} />}
                    {opportunity.icon === "layers" && <Layers3 size={20} />}
                    {opportunity.icon === "search" && <SearchX size={20} />}
                  </div>
                  <span>Fırsat</span>
                  <h3>{opportunity.title}</h3>
                  <p>{opportunity.description}</p>
                  <Link href={opportunity.href}>{opportunity.label} <ArrowUpRight size={14} /></Link>
                </article>
              ))}
            </div>
          </section>

          <div className="dashboard-performance-grid">
            <section className="dashboard-popular-products">
              <div className="dashboard-v2-section-heading">
                <div><span><Flame size={13} /> Ürün ilgisi</span><h2>En çok görüntülenen ürünler</h2></div>
                <Link href="/dashboard/analytics">Detaylar <ArrowUpRight size={14} /></Link>
              </div>
              {analytics.popularProducts.length === 0 ? (
                <div className="dashboard-v2-empty">
                  <MousePointerClick size={24} />
                  <strong>Ürün verisi henüz oluşmadı</strong>
                  <p>Müşteriler yayınlanan menüde gezinmeye başladığında ürün sıralaması burada görünecek.</p>
                </div>
              ) : (
                <div className="dashboard-product-ranking">
                  {analytics.popularProducts.slice(0, 5).map((product, index) => {
                    const change = product.previousViews > 0
                      ? Math.round(((product.views - product.previousViews) / product.previousViews) * 100)
                      : null;
                    return (
                      <article key={`${product.menuId}-${product.categoryId}-${product.itemId}`}>
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        <div><strong>{product.itemName}</strong><span>{product.menuName} · {product.categoryName}</span></div>
                        {product.isCampaign && <em>Kampanya</em>}
                        <strong>{product.views.toLocaleString("tr-TR")} <small>görünüm</small></strong>
                        <span className={change !== null && change < 0 ? "negative" : "positive"}>
                          {change === null ? "Yeni" : `${change >= 0 ? "+" : ""}${change}%`}
                        </span>
                        <Link href={`/studio?menu=${product.menuId}`} aria-label={`${product.itemName} ürününü düzenle`}><ArrowUpRight size={15} /></Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-activity-card">
              <div className="dashboard-v2-section-heading">
                <div><span><BarChart3 size={13} /> Günlük hareket</span><h2>Ziyaret trendi</h2></div>
              </div>
              <div className="dashboard-activity-summary">
                <strong>{analytics.views.toLocaleString("tr-TR")}</strong>
                <span>Son {period} günde menü açılışı</span>
              </div>
              <div className="dashboard-mini-chart" role="img" aria-label={`Son ${period} günlük menü ve ürün görüntüleme grafiği`}>
                {analytics.activity.map((point, index) => (
                  <div key={point.date} title={`${formatDashboardDay(point.date)}: ${point.views} menü, ${point.productViews} ürün görünümü`}>
                    <span>
                      <i style={{ height: `${Math.max((point.views / maximumActivity) * 100, point.views ? 5 : 0)}%` }} />
                      <b style={{ height: `${Math.max((point.productViews / maximumActivity) * 100, point.productViews ? 5 : 0)}%` }} />
                    </span>
                    <small>{period === 7 || index % 5 === 0 || index === analytics.activity.length - 1 ? formatDashboardDay(point.date) : ""}</small>
                  </div>
                ))}
              </div>
              <div className="dashboard-chart-legend"><span><i /> Menü</span><span><i /> Ürün</span><Link href="/dashboard/analytics">Analitiği aç <ArrowUpRight size={13} /></Link></div>
              {(analytics.contactClicks > 0 || analytics.searches > 0) && (
                <p className="dashboard-activity-detail"><strong>{analytics.searches}</strong> arama · <strong>{analytics.contactClicks}</strong> iletişim tıklaması</p>
              )}
            </section>
          </div>

          <section className="dashboard-menus dashboard-v2-menus" id="menuler">
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
        </div>
      </section>
      <DashboardMobileNav active="overview" />
    </main>
  );
}
