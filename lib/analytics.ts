import { db } from "@/lib/db";
import {
  menuTrafficSources,
  menuViewLanguages,
  trackedMenuDeviceTypes,
  type MenuTrafficSource,
  type MenuViewLanguage,
  type TrackedMenuDeviceType,
} from "@/lib/menu-tracking";
import { listUserMenus, type MenuStatus } from "@/lib/menus";

export type DailyMenuViews = {
  date: string;
  devices: Record<TrackedMenuDeviceType, number>;
  languages: Record<MenuViewLanguage, number>;
  sources: Record<MenuTrafficSource, number>;
  views: number;
};

export type MenuAnalyticsRow = {
  id: string;
  name: string;
  slug: string;
  status: MenuStatus;
  viewCount: number;
};

export type UserAnalytics = {
  dailyViews: DailyMenuViews[];
  menus: MenuAnalyticsRow[];
  totalViews: number;
  publishedMenus: number;
  trackingStartedAt: string | null;
};

type DailyViewRow = {
  date: string;
  views: number;
};

type DailyBreakdownRow = {
  date: string;
  device_type: string;
  language: string;
  source: string;
  views: number;
};

type TrackingRow = {
  tracking_started_at: string | null;
};

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyBreakdown<Key extends string>(keys: readonly Key[]) {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<Key, number>;
}

function normalizeBreakdownKey<Key extends string>(
  value: string,
  keys: readonly Key[],
): Key {
  return keys.includes(value as Key) ? value as Key : "unknown" as Key;
}

export function getUserAnalytics(userId: string, requestedDays = 60): UserAnalytics {
  const days = Math.min(Math.max(Math.trunc(requestedDays), 14), 90);
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const rows = db.prepare(
    `SELECT substr(menu_views.viewed_at, 1, 10) AS date, COUNT(*) AS views
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ? AND menu_views.viewed_at >= ?
     GROUP BY substr(menu_views.viewed_at, 1, 10)
     ORDER BY date ASC`,
  ).all(userId, start.toISOString()) as DailyViewRow[];

  const viewsByDate = new Map(rows.map((row) => [row.date, Number(row.views)]));
  const breakdownRows = db.prepare(
    `SELECT
       substr(menu_views.viewed_at, 1, 10) AS date,
       menu_views.source,
       menu_views.device_type,
       menu_views.language,
       COUNT(*) AS views
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ? AND menu_views.viewed_at >= ?
     GROUP BY date, menu_views.source, menu_views.device_type, menu_views.language
     ORDER BY date ASC`,
  ).all(userId, start.toISOString()) as DailyBreakdownRow[];

  const breakdownByDate = new Map<string, {
    devices: Record<TrackedMenuDeviceType, number>;
    languages: Record<MenuViewLanguage, number>;
    sources: Record<MenuTrafficSource, number>;
  }>();
  breakdownRows.forEach((row) => {
    const breakdown = breakdownByDate.get(row.date) || {
      devices: emptyBreakdown(trackedMenuDeviceTypes),
      languages: emptyBreakdown(menuViewLanguages),
      sources: emptyBreakdown(menuTrafficSources),
    };
    const views = Number(row.views);
    const source = normalizeBreakdownKey(row.source, menuTrafficSources);
    const device = normalizeBreakdownKey(row.device_type, trackedMenuDeviceTypes);
    const language = normalizeBreakdownKey(row.language, menuViewLanguages);
    breakdown.sources[source] += views;
    breakdown.devices[device] += views;
    breakdown.languages[language] += views;
    breakdownByDate.set(row.date, breakdown);
  });

  const dailyViews = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = utcDateKey(date);
    const breakdown = breakdownByDate.get(key) || {
      devices: emptyBreakdown(trackedMenuDeviceTypes),
      languages: emptyBreakdown(menuViewLanguages),
      sources: emptyBreakdown(menuTrafficSources),
    };
    return { date: key, views: viewsByDate.get(key) || 0, ...breakdown };
  });

  const storedMenus = listUserMenus(userId);
  const menus = storedMenus
    .map((menu) => ({
      id: menu.id,
      name: menu.name,
      slug: menu.slug,
      status: menu.status,
      viewCount: menu.viewCount,
    }))
    .sort((left, right) => right.viewCount - left.viewCount || left.name.localeCompare(right.name, "tr"));

  const tracking = db.prepare(
    `SELECT MIN(menu_views.viewed_at) AS tracking_started_at
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ?`,
  ).get(userId) as TrackingRow;

  return {
    dailyViews,
    menus,
    totalViews: storedMenus.reduce((total, menu) => total + menu.viewCount, 0),
    publishedMenus: storedMenus.filter((menu) => menu.status === "published").length,
    trackingStartedAt: tracking.tracking_started_at,
  };
}
