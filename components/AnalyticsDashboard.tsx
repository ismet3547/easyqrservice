"use client";

import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Eye,
  Languages,
  MonitorSmartphone,
  Plus,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { DailyMenuViews, UserAnalytics } from "@/lib/analytics";
import type { SessionUser } from "@/lib/auth";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";

type Period = 7 | 14 | 30;
type BreakdownField = "devices" | "languages" | "sources";
type BreakdownItem = {
  color: string;
  key: string;
  label: string;
  views: number;
};
type BreakdownMeta = Omit<BreakdownItem, "views">;

const sourceMeta: BreakdownMeta[] = [
  { key: "qr", label: "QR kod", color: "#e85c2f" },
  { key: "direct", label: "Doğrudan bağlantı", color: "#788965" },
  { key: "instagram", label: "Instagram", color: "#c44c86" },
  { key: "google", label: "Google", color: "#4f77bd" },
  { key: "facebook", label: "Facebook", color: "#5872a7" },
  { key: "whatsapp", label: "WhatsApp", color: "#4c9870" },
  { key: "other", label: "Diğer siteler", color: "#9b806c" },
  { key: "unknown", label: "Eski kayıtlar", color: "#a7aaa3" },
];

const deviceMeta: BreakdownMeta[] = [
  { key: "mobile", label: "Mobil", color: "#e85c2f" },
  { key: "tablet", label: "Tablet", color: "#9b6cb2" },
  { key: "desktop", label: "Masaüstü", color: "#5d829d" },
  { key: "unknown", label: "Bilinmeyen", color: "#a7aaa3" },
];

const languageMeta: BreakdownMeta[] = [
  { key: "tr", label: "Türkçe", color: "#c94e2a" },
  { key: "en", label: "İngilizce", color: "#557f9e" },
  { key: "unknown", label: "Eski kayıtlar", color: "#a7aaa3" },
];

function formatDay(date: string, withMonth = true) {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    ...(withMonth ? { month: "short" as const } : {}),
    timeZone: "UTC",
  });
}

function buildBreakdown(
  days: DailyMenuViews[],
  field: BreakdownField,
  metadata: BreakdownMeta[],
) {
  return metadata
    .map((item) => ({
      ...item,
      views: days.reduce(
        (total, day) => total + ((day[field] as Record<string, number>)[item.key] || 0),
        0,
      ),
    }))
    .filter((item) => item.views > 0)
    .sort((first, second) => second.views - first.views);
}

function AnalyticsBreakdownCard({
  eyebrow,
  icon,
  items,
  title,
}: {
  eyebrow: string;
  icon: ReactNode;
  items: BreakdownItem[];
  title: string;
}) {
  const total = items.reduce((sum, item) => sum + item.views, 0);

  return (
    <article className="analytics-breakdown-card">
      <header>
        <div>{icon}</div>
        <span><small>{eyebrow}</small><strong>{title}</strong></span>
      </header>
      {total === 0 ? (
        <p className="analytics-breakdown-empty">Bu dönem için henüz veri yok.</p>
      ) : (
        <div className="analytics-breakdown-list">
          {items.map((item) => {
            const percentage = Math.round((item.views / total) * 100);
            return (
              <div className="analytics-breakdown-row" key={item.key}>
                <span><i style={{ backgroundColor: item.color }} />{item.label}</span>
                <strong>{item.views.toLocaleString("tr-TR")} <small>%{percentage}</small></strong>
                <div aria-label={`${item.label}: yüzde ${percentage}`} role="img">
                  <i style={{ backgroundColor: item.color, width: `${Math.max(percentage, 3)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}

export function AnalyticsDashboard({ user, analytics }: { user: SessionUser; analytics: UserAnalytics }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>(14);

  const periodData = useMemo(() => analytics.dailyViews.slice(-period), [analytics.dailyViews, period]);
  const previousData = useMemo(
    () => analytics.dailyViews.slice(-(period * 2), -period),
    [analytics.dailyViews, period],
  );
  const periodViews = periodData.reduce((total, point) => total + point.views, 0);
  const previousViews = previousData.reduce((total, point) => total + point.views, 0);
  const todayViews = analytics.dailyViews.at(-1)?.views || 0;
  const maxViews = Math.max(...periodData.map((point) => point.views), 1);
  const averageViews = periodViews / period;
  const sourceBreakdown = useMemo(
    () => buildBreakdown(periodData, "sources", sourceMeta),
    [periodData],
  );
  const deviceBreakdown = useMemo(
    () => buildBreakdown(periodData, "devices", deviceMeta),
    [periodData],
  );
  const languageBreakdown = useMemo(
    () => buildBreakdown(periodData, "languages", languageMeta),
    [periodData],
  );
  const dominantSource = sourceBreakdown.find((item) => item.key !== "unknown") || null;
  const dominantDevice = deviceBreakdown.find((item) => item.key !== "unknown") || null;
  const topMenu = analytics.menus[0] || null;
  const busiestDay = periodData.reduce(
    (best, point) => point.views > best.views ? point : best,
    periodData[0] || { date: "", views: 0 },
  );
  const change = previousViews > 0
    ? Math.round(((periodViews - previousViews) / previousViews) * 100)
    : periodViews > 0 ? null : 0;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="analytics" menuCount={analytics.menus.length} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main analytics-dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content analytics-page-content">
          <div className="dashboard-heading">
            <div><span className="dashboard-kicker"><BarChart3 size={14} /> Canlı performans</span><h1>Analitik</h1><p>QR menülerinin açılışlarını takip et ve en çok ilgi gören menünü keşfet.</p></div>
            <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> Yeni menü oluştur</Link>
          </div>

          <section className="analytics-summary-grid">
            <article><div className="analytics-metric-icon orange"><Eye size={20} /></div><span>Tüm zamanlar</span><strong>{analytics.totalViews.toLocaleString("tr-TR")}</strong><small>Toplam menü açılışı</small></article>
            <article><div className="analytics-metric-icon green"><CalendarDays size={20} /></div><span>Son {period} gün</span><strong>{periodViews.toLocaleString("tr-TR")}</strong><small className={change !== null && change < 0 ? "negative" : "positive"}>{change === null ? <><Sparkles size={12} /> Yeni trafik</> : change < 0 ? <><TrendingDown size={12} /> %{Math.abs(change)} önceki döneme göre</> : <><TrendingUp size={12} /> %{change} önceki döneme göre</>}</small></article>
            <article><div className="analytics-metric-icon purple"><QrCode size={20} /></div><span>Bugün</span><strong>{todayViews.toLocaleString("tr-TR")}</strong><small>Menü açılışı</small></article>
            <article><div className="analytics-metric-icon blue"><BookOpen size={20} /></div><span>Yayındaki menü</span><strong>{analytics.publishedMenus}</strong><small>{analytics.menus.length} toplam menüden</small></article>
          </section>

          <section className="analytics-chart-card">
            <div className="analytics-card-heading">
              <div><span>Görüntülenme trendi</span><h2>Menü açılışları</h2></div>
              <div className="analytics-periods" aria-label="Analitik zaman aralığı">
                {([7, 14, 30] as Period[]).map((option) => <button key={option} aria-pressed={period === option} className={period === option ? "active" : ""} onClick={() => setPeriod(option)}>{option} gün</button>)}
              </div>
            </div>

            {periodViews === 0 ? (
              <div className="analytics-chart-empty"><div><BarChart3 size={29} /></div><h3>Henüz görüntülenme yok</h3><p>Yayınlanan menünün QR kodunu paylaştığında açılışlar burada günlük olarak görünecek.</p><Link href="/dashboard/menus">Menülerimi görüntüle <ArrowUpRight size={14} /></Link></div>
            ) : (
              <div className="analytics-chart-wrap">
                <div className="analytics-chart-grid"><i /><i /><i /><i /></div>
                <div className="analytics-bars">
                  {periodData.map((point, index) => (
                    <div className="analytics-bar-column" key={point.date} title={`${formatDay(point.date)}: ${point.views} görüntülenme`}>
                      <span className="analytics-bar-value">{point.views || ""}</span>
                      <div className="analytics-bar-track"><i style={{ height: point.views ? `${Math.max((point.views / maxViews) * 100, 7)}%` : "0%" }} /></div>
                      <small>{period <= 14 || index % 3 === 0 || index === periodData.length - 1 ? formatDay(point.date) : ""}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analytics-chart-footer"><span><i /> Günlük açılış</span><small>Günde ortalama <strong>{averageViews.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</strong> görüntülenme</small></div>
          </section>

          <section className="analytics-breakdown-grid" aria-label="Ziyaretçi dağılımları">
            <AnalyticsBreakdownCard
              eyebrow={`Son ${period} gün`}
              icon={<ScanLine size={20} />}
              items={sourceBreakdown}
              title="Trafik kaynakları"
            />
            <AnalyticsBreakdownCard
              eyebrow="Cihaz dağılımı"
              icon={<MonitorSmartphone size={20} />}
              items={deviceBreakdown}
              title="Müşteriler nasıl bakıyor?"
            />
            <AnalyticsBreakdownCard
              eyebrow="Menü dili"
              icon={<Languages size={20} />}
              items={languageBreakdown}
              title="Türkçe ve İngilizce"
            />
          </section>

          <p className="analytics-privacy-note"><ShieldCheck size={15} /> Gizlilik odaklı ölçüm: ham IP adresi, yönlendiren adres veya tarayıcı bilgisi saklanmaz; bilinen bot açılışları sayılmaz.</p>

          <div className="analytics-lower-grid">
            <section className="analytics-ranking-card">
              <div className="analytics-card-heading"><div><span>Menü performansı</span><h2>En çok görüntülenenler</h2></div><Link href="/dashboard/menus">Tüm menüler <ArrowUpRight size={14} /></Link></div>
              {analytics.menus.length === 0 ? (
                <div className="analytics-list-empty"><p>Karşılaştırılacak bir menü bulunmuyor.</p><Link href="/studio?new=1">İlk menüyü oluştur</Link></div>
              ) : (
                <div className="analytics-ranking-list">
                  {analytics.menus.map((menu, index) => {
                    const share = analytics.totalViews > 0 ? Math.round((menu.viewCount / analytics.totalViews) * 100) : 0;
                    return <article key={menu.id}><span className="analytics-rank">{String(index + 1).padStart(2, "0")}</span><div className="analytics-rank-name"><strong>{menu.name}</strong><small>{menu.status === "published" ? "Yayında" : "Taslak"}</small></div><div className="analytics-share"><i><b style={{ width: `${share}%` }} /></i><small>%{share}</small></div><strong className="analytics-view-count">{menu.viewCount.toLocaleString("tr-TR")} <small>görüntülenme</small></strong>{menu.status === "published" ? <a href={`/m/${menu.slug}`} target="_blank" rel="noreferrer" aria-label={`${menu.name} menüsünü aç`}><ArrowUpRight size={15} /></a> : <Link href={`/studio?menu=${menu.id}`} aria-label={`${menu.name} menüsünü düzenle`}><ArrowUpRight size={15} /></Link>}</article>;
                  })}
                </div>
              )}
            </section>

            <aside className="analytics-insight-card">
              <span><Sparkles size={14} /> Akıllı özet</span>
              <h2>{periodViews > 0 ? "Trafiğinin kısa özeti" : "İlk verilerini topla"}</h2>
              {periodViews > 0 ? <><p>Son {period} günde menülerin <strong>{periodViews}</strong> kez açıldı. En yoğun gün <strong>{formatDay(busiestDay.date)}</strong> oldu.{dominantSource && <> En güçlü kaynak <strong>{dominantSource.label}</strong>{dominantDevice ? <>, en yaygın cihaz ise <strong>{dominantDevice.label.toLocaleLowerCase("tr-TR")}</strong></> : null}.</>}</p>{topMenu && <div className="analytics-top-menu"><small>En çok görüntülenen menü</small><strong>{topMenu.name}</strong><span>{topMenu.viewCount} toplam açılış</span></div>}</> : <p>Menünü yayınla ve QR kodunu masalara yerleştir. Her açılış otomatik olarak bu sayfaya yansır.</p>}
              <Link href={topMenu ? `/studio?menu=${topMenu.id}` : "/studio?new=1"}>{topMenu ? "Menüyü geliştirmeye devam et" : "Yeni menü oluştur"} <ArrowUpRight size={14} /></Link>
              {analytics.trackingStartedAt && <small className="analytics-tracking-note">Günlük kayıtlar {new Date(analytics.trackingStartedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} tarihinden itibaren tutuluyor.</small>}
            </aside>
          </div>
        </div>
      </section>
      <DashboardMobileNav active="analytics" />
    </main>
  );
}
