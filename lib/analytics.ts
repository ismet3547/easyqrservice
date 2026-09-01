import { db } from "@/lib/db";
import { listUserMenus, type MenuStatus } from "@/lib/menus";

export type DailyMenuViews = {
  date: string;
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

type TrackingRow = {
  tracking_started_at: string | null;
};

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
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
  const dailyViews = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = utcDateKey(date);
    return { date: key, views: viewsByDate.get(key) || 0 };
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
