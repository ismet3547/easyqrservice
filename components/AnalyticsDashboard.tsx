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
import { useMemo, useTransition, type ReactNode } from "react";
import type { DailyMenuViews, UserAnalytics } from "@/lib/analytics";
import type { AnalyticsPeriod, EngagementAnalytics } from "@/lib/analytics-details";
import { AnalyticsEngagement } from "@/components/AnalyticsEngagement";
import type { SessionUser } from "@/lib/auth";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";
import { useAppLocale } from "@/components/LocaleProvider";

type Period = AnalyticsPeriod;
type BreakdownField = "devices" | "languages" | "sources";
type BreakdownItem = {
  color: string;
  key: string;
  label: string;
  views: number;
};
type BreakdownMeta = Omit<BreakdownItem, "views">;

const sourceMeta = (locale: "en" | "tr"): BreakdownMeta[] => [
  { key: "qr", label: locale === "tr" ? "QR kod" : "QR code", color: "#e85c2f" },
  { key: "direct", label: locale === "tr" ? "Doğrudan bağlantı" : "Direct link", color: "#788965" },
  { key: "instagram", label: "Instagram", color: "#c44c86" },
  { key: "google", label: "Google", color: "#4f77bd" },
  { key: "facebook", label: "Facebook", color: "#5872a7" },
  { key: "whatsapp", label: "WhatsApp", color: "#4c9870" },
  { key: "other", label: locale === "tr" ? "Diğer siteler" : "Other websites", color: "#9b806c" },
  { key: "unknown", label: locale === "tr" ? "Eski kayıtlar" : "Legacy records", color: "#a7aaa3" },
];

const deviceMeta = (locale: "en" | "tr"): BreakdownMeta[] => [
  { key: "mobile", label: locale === "tr" ? "Mobil" : "Mobile", color: "#e85c2f" },
  { key: "tablet", label: "Tablet", color: "#9b6cb2" },
  { key: "desktop", label: locale === "tr" ? "Masaüstü" : "Desktop", color: "#5d829d" },
  { key: "unknown", label: locale === "tr" ? "Bilinmeyen" : "Unknown", color: "#a7aaa3" },
];

const languageColors = ["#557f9e", "#c94e2a", "#6f8c67", "#9b6cb2", "#b27b43", "#3f8f8a"];

function languageMeta(locale: "en" | "tr", days: DailyMenuViews[]): BreakdownMeta[] {
  const languageKeys = [...new Set(days.flatMap((day) => Object.keys(day.languages)))];
  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames([locale], { type: "language" });
  } catch { /* Fall back to the normalized language code. */ }

  return languageKeys.map((key, index) => ({
    key,
    label: key === "unknown"
      ? locale === "tr" ? "Eski kayıtlar" : "Legacy records"
      : displayNames?.of(key) || key.toLocaleUpperCase("en-US"),
    color: key === "unknown" ? "#a7aaa3" : languageColors[index % languageColors.length],
  }));
}

function formatDay(date: string, intlLocale: string, withMonth = true) {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString(intlLocale, {
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
  locale,
  number,
  title,
}: {
  eyebrow: string;
  icon: ReactNode;
  items: BreakdownItem[];
  locale: "en" | "tr";
  number: (value: number) => string;
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
        <p className="analytics-breakdown-empty">{locale === "tr" ? "Bu dönem için henüz veri yok." : "No data for this period yet."}</p>
      ) : (
        <div className="analytics-breakdown-list">
          {items.map((item) => {
            const percentage = Math.round((item.views / total) * 100);
            return (
              <div className="analytics-breakdown-row" key={item.key}>
                <span><i style={{ backgroundColor: item.color }} />{item.label}</span>
                <strong>{number(item.views)} <small>{number(percentage)}%</small></strong>
                <div aria-label={locale === "tr" ? `${item.label}: yüzde ${percentage}` : `${item.label}: ${percentage} percent`} role="img">
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

export function AnalyticsDashboard({ user, analytics, engagement, menuOptions, selectedMenuId, initialPeriod }: {
  user: SessionUser;
  analytics: UserAnalytics;
  engagement: EngagementAnalytics;
  menuOptions: { id: string; name: string }[];
  selectedMenuId: string | null;
  initialPeriod: Period;
}) {
  const router = useRouter();
  const { date, intlLocale, locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const period = initialPeriod;
  const [isPending, startTransition] = useTransition();
  const changeScope = (menuId: string | null, days: Period) => {
    const params = new URLSearchParams({ period: String(days) });
    if (menuId) params.set("menu", menuId);
    startTransition(() => router.replace(`/dashboard/analytics?${params}`, { scroll: false }));
  };

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
    () => buildBreakdown(periodData, "sources", sourceMeta(locale)),
    [locale, periodData],
  );
  const deviceBreakdown = useMemo(
    () => buildBreakdown(periodData, "devices", deviceMeta(locale)),
    [locale, periodData],
  );
  const languageBreakdown = useMemo(
    () => buildBreakdown(periodData, "languages", languageMeta(locale, periodData)),
    [locale, periodData],
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
      <DashboardSidebar active="analytics" menuCount={menuOptions.length} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main analytics-dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content analytics-page-content">
          <div className="dashboard-heading">
            <div><span className="dashboard-kicker"><BarChart3 size={14} /> {t("Live performance", "Canlı performans")}</span><h1>{t("Analytics", "Analitik")}</h1><p>{t("Track menu opens, item engagement, and category reach in one place.", "Menü açılışlarını, ürün ilgisini ve kategori erişimini tek yerden incele.")}</p></div>
            <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> {t("Create menu", "Yeni menü oluştur")}</Link>
          </div>

          <section className="analytics-scope" aria-label={t("Analytics filters", "Analitik filtreleri")} aria-busy={isPending}>
            <label><span>{t("Menu", "Menü")}</span><select value={selectedMenuId || ""} disabled={isPending}
              onChange={(event) => changeScope(event.target.value || null, period)}>
              <option value="">{t("All menus", "Tüm menüler")}</option>{menuOptions.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
            </select></label>
            <div><span>{t("Period", "Dönem")}</span><div className="analytics-periods" role="group" aria-label={t("Analytics date range", "Analitik zaman aralığı")}>
              {([7, 14, 30] as Period[]).map((option) => <button type="button" key={option} disabled={isPending} aria-pressed={period === option}
                className={period === option ? "active" : ""} onClick={() => changeScope(selectedMenuId, option)}>{number(option)} {t("days", "gün")}</button>)}
            </div></div>
            <p role="status">{isPending ? t("Updating data…", "Veriler güncelleniyor…") : `${formatDay(engagement[period].start.slice(0, 10), intlLocale)} – ${formatDay(engagement[period].end.slice(0, 10), intlLocale)} · ${t("Includes today", "Bugün dahil")} · UTC`}</p>
          </section>

          <section className="analytics-summary-grid">
            <article><div className="analytics-metric-icon orange"><Eye size={20} /></div><span>{t("All time", "Tüm zamanlar")}</span><strong>{number(analytics.totalViews)}</strong><small>{t("Total menu opens", "Toplam menü açılışı")}</small></article>
            <article><div className="analytics-metric-icon green"><CalendarDays size={20} /></div><span>{t(`Last ${period} days`, `Son ${period} gün`)}</span><strong>{number(periodViews)}</strong><small className={change !== null && change < 0 ? "negative" : "positive"}>{change === null ? <><Sparkles size={12} /> {t("New traffic", "Yeni trafik")}</> : change < 0 ? <><TrendingDown size={12} /> {number(Math.abs(change))}% {t("vs previous period", "önceki döneme göre")}</> : <><TrendingUp size={12} /> {number(change)}% {t("vs previous period", "önceki döneme göre")}</>}</small></article>
            <article><div className="analytics-metric-icon purple"><QrCode size={20} /></div><span>{t("Today", "Bugün")}</span><strong>{number(todayViews)}</strong><small>{t("Menu opens", "Menü açılışı")}</small></article>
            <article><div className="analytics-metric-icon blue"><BookOpen size={20} /></div><span>{t("Published menus", "Yayındaki menü")}</span><strong>{number(analytics.publishedMenus)}</strong><small>{t(`of ${analytics.menus.length} total menus`, `${analytics.menus.length} toplam menüden`)}</small></article>
          </section>

          <AnalyticsEngagement key={`${selectedMenuId || "all"}:${period}`} data={engagement[period]} />

          <section className="analytics-chart-card">
            <div className="analytics-card-heading">
              <div><span>{t("View trend", "Görüntülenme trendi")}</span><h2>{t("Menu opens", "Menü açılışları")}</h2></div>
              <span className="analytics-detail-status">{t(`Last ${period} days`, `Son ${period} gün`)}</span>
            </div>

            {periodViews === 0 ? (
              <div className="analytics-chart-empty"><div><BarChart3 size={29} /></div><h3>{t("No views yet", "Henüz görüntülenme yok")}</h3><p>{t("Once you share a published menu's QR code, daily opens will appear here.", "Yayınlanan menünün QR kodunu paylaştığında açılışlar burada günlük olarak görünecek.")}</p><Link href="/dashboard/menus">{t("View my menus", "Menülerimi görüntüle")} <ArrowUpRight size={14} /></Link></div>
            ) : (
              <div className="analytics-chart-wrap">
                <div className="analytics-chart-grid"><i /><i /><i /><i /></div>
                <div className="analytics-bars">
                  {periodData.map((point, index) => (
                    <div className="analytics-bar-column" key={point.date} title={`${formatDay(point.date, intlLocale)}: ${number(point.views)} ${t("views", "görüntülenme")}`}>
                      <span className="analytics-bar-value">{point.views ? number(point.views) : ""}</span>
                      <div className="analytics-bar-track"><i style={{ height: point.views ? `${Math.max((point.views / maxViews) * 100, 7)}%` : "0%" }} /></div>
                      <small>{period <= 14 || index % 3 === 0 || index === periodData.length - 1 ? formatDay(point.date, intlLocale) : ""}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="analytics-chart-footer"><span><i /> {t("Daily opens", "Günlük açılış")}</span><small>{t("Daily average", "Günde ortalama")} <strong>{number(averageViews, { maximumFractionDigits: 1 })}</strong> {t("views", "görüntülenme")}</small></div>
          </section>

          <section className="analytics-breakdown-grid" aria-label={t("Visitor breakdowns", "Ziyaretçi dağılımları")}>
            <AnalyticsBreakdownCard
              eyebrow={t(`Last ${period} days`, `Son ${period} gün`)}
              icon={<ScanLine size={20} />}
              items={sourceBreakdown}
              locale={locale}
              number={number}
              title={t("Traffic sources", "Trafik kaynakları")}
            />
            <AnalyticsBreakdownCard
              eyebrow={t("Device breakdown", "Cihaz dağılımı")}
              icon={<MonitorSmartphone size={20} />}
              items={deviceBreakdown}
              locale={locale}
              number={number}
              title={t("How are guests viewing?", "Müşteriler nasıl bakıyor?")}
            />
            <AnalyticsBreakdownCard
              eyebrow={t("Menu language", "Menü dili")}
              icon={<Languages size={20} />}
              items={languageBreakdown}
              locale={locale}
              number={number}
              title={t("Languages used", "Kullanılan diller")}
            />
          </section>

          <p className="analytics-privacy-note"><ShieldCheck size={15} /> {t("Privacy-first measurement: interaction and returning-visitor metrics include only analytics-enabled visits; raw IP addresses, referrer URLs, and full browser details are not retained, and known bots are excluded.", "Gizlilik odaklı ölçüm: etkileşim ve geri dönen ziyaretçi verileri yalnızca analitiğe izin verilen ziyaretleri kapsar; ham IP, yönlendiren adres ve tam tarayıcı bilgisi saklanmaz, bilinen botlar hariç tutulur.")}</p>

          <div className="analytics-lower-grid">
            <section className="analytics-ranking-card">
              <div className="analytics-card-heading"><div><span>{t("All time · Menu performance", "Tüm zamanlar · Menü performansı")}</span><h2>{t("Most viewed", "En çok görüntülenenler")}</h2></div><Link href="/dashboard/menus">{t("All menus", "Tüm menüler")} <ArrowUpRight size={14} /></Link></div>
              {analytics.menus.length === 0 ? (
                <div className="analytics-list-empty"><p>{t("There are no menus to compare.", "Karşılaştırılacak bir menü bulunmuyor.")}</p><Link href="/studio?new=1">{t("Create first menu", "İlk menüyü oluştur")}</Link></div>
              ) : (
                <div className="analytics-ranking-list">
                  {analytics.menus.map((menu, index) => {
                    const share = analytics.totalViews > 0 ? Math.round((menu.viewCount / analytics.totalViews) * 100) : 0;
                    return <article key={menu.id}><span className="analytics-rank">{String(index + 1).padStart(2, "0")}</span><div className="analytics-rank-name"><strong>{menu.name}</strong><small>{menu.status === "published" ? t("Published", "Yayında") : t("Draft", "Taslak")}</small></div><div className="analytics-share"><i><b style={{ width: `${share}%` }} /></i><small>{number(share)}%</small></div><strong className="analytics-view-count">{number(menu.viewCount)} <small>{t("views", "görüntülenme")}</small></strong>{menu.status === "published" ? <a href={`/m/${menu.slug}`} target="_blank" rel="noreferrer" aria-label={t(`Open ${menu.name}`, `${menu.name} menüsünü aç`)}><ArrowUpRight size={15} /></a> : <Link href={`/studio?menu=${menu.id}`} aria-label={t(`Edit ${menu.name}`, `${menu.name} menüsünü düzenle`)}><ArrowUpRight size={15} /></Link>}</article>;
                  })}
                </div>
              )}
            </section>

            <aside className="analytics-insight-card">
              <span><Sparkles size={14} /> {t("Smart summary", "Akıllı özet")}</span>
              <h2>{periodViews > 0 ? t("Your traffic at a glance", "Trafiğinin kısa özeti") : t("Collect your first data", "İlk verilerini topla")}</h2>
              {periodViews > 0 ? <><p>{t(`Your menus were opened `, `Son ${period} günde menülerin `)}<strong>{number(periodViews)}</strong>{t(` times in the last ${period} days. The busiest day was `, ` kez açıldı. En yoğun gün `)}<strong>{formatDay(busiestDay.date, intlLocale)}</strong>{t(".", " oldu.")}{dominantSource && <>{t(" Your strongest source was ", " En güçlü kaynak ")}<strong>{dominantSource.label}</strong>{dominantDevice ? <>{t(", and the most common device was ", ", en yaygın cihaz ise ")}<strong>{dominantDevice.label.toLocaleLowerCase(intlLocale)}</strong></> : null}.</>}</p>{topMenu && <div className="analytics-top-menu"><small>{t("Most viewed menu", "En çok görüntülenen menü")}</small><strong>{topMenu.name}</strong><span>{number(topMenu.viewCount)} {t("total opens", "toplam açılış")}</span></div>}</> : <p>{t("Publish your menu and place its QR code at your venue. Every open will automatically appear here.", "Menünü yayınla ve QR kodunu masalara yerleştir. Her açılış otomatik olarak bu sayfaya yansır.")}</p>}
              <Link href={topMenu ? `/studio?menu=${topMenu.id}` : "/studio?new=1"}>{topMenu ? t("Keep improving the menu", "Menüyü geliştirmeye devam et") : t("Create menu", "Yeni menü oluştur")} <ArrowUpRight size={14} /></Link>
              {analytics.trackingStartedAt && <small className="analytics-tracking-note">{t("Daily records have been kept since", "Günlük kayıtlar")} {date(analytics.trackingStartedAt, { day: "numeric", month: "long", year: "numeric" })}{locale === "tr" ? " tarihinden itibaren tutuluyor." : "."}</small>}
            </aside>
          </div>
        </div>
      </section>
      <DashboardMobileNav active="analytics" />
    </main>
  );
}
