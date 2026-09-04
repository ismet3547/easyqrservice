import { db } from "@/lib/db";
import {
  menuTrafficSources,
  menuViewLanguages,
  trackedMenuDeviceTypes,
  type MenuTrafficSource,
  type MenuViewLanguage,
  type TrackedMenuDeviceType,
} from "@/lib/menu-tracking";
import { getVisibleMenu, type MenuData } from "@/lib/menu";
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

export type DashboardPeriod = 7 | 30;

export type DashboardActivityPoint = {
  date: string;
  productViews: number;
  views: number;
};

export type DashboardProductPerformance = {
  categoryId: string;
  categoryName: string;
  isCampaign: boolean;
  itemId: string;
  itemName: string;
  menuId: string;
  menuName: string;
  previousViews: number;
  views: number;
};

export type DashboardCategoryPerformance = {
  categoryId: string;
  categoryName: string;
  menuId: string;
  menuName: string;
  previousViews: number;
  reach: number;
  views: number;
};

export type DashboardMissedSearch = {
  count: number;
  term: string;
};

export type DashboardPeriodAnalytics = {
  activity: DashboardActivityPoint[];
  campaignViews: number;
  categoryPerformance: DashboardCategoryPerformance[];
  contactClicks: number;
  days: DashboardPeriod;
  missedSearches: DashboardMissedSearch[];
  popularProducts: DashboardProductPerformance[];
  previousCampaignViews: number;
  previousProductViews: number;
  previousReturningVisitors: number;
  previousUniqueVisitors: number;
  previousViews: number;
  productViews: number;
  qrScans: number;
  returningVisitors: number;
  searches: number;
  uniqueVisitors: number;
  views: number;
};

export type DashboardOverviewAnalytics = {
  periods: Record<DashboardPeriod, DashboardPeriodAnalytics>;
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

type OverviewViewMetricsRow = {
  qr_scans: number;
  unique_visitors: number;
  views: number;
};

type OverviewEventMetricsRow = {
  campaign_views: number;
  contact_clicks: number;
  product_views: number;
  searches: number;
};

type CountRow = { count: number };
type DailyOverviewRow = { date: string; product_views?: number; views?: number };
type MenuViewCountRow = { menu_id: string; views: number };
type ProductEventRow = {
  category_id: string;
  item_id: string;
  menu_id: string;
  previous_views: number;
  views: number;
};
type CategoryEventRow = {
  category_id: string;
  menu_id: string;
  previous_views: number;
  views: number;
};
type MissedSearchRow = { count: number; term: string };
type PublishedAnalyticsMenuRow = {
  content_json: string;
  id: string;
  name: string;
  published_content_json: string | null;
};

function getUtcPeriodStart(days: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function getViewMetrics(userId: string, start: Date, end?: Date) {
  const endClause = end ? "AND menu_views.viewed_at < ?" : "";
  const parameters = end
    ? [userId, start.toISOString(), end.toISOString()]
    : [userId, start.toISOString()];
  const row = db.prepare(
    `SELECT
       COUNT(*) AS views,
       COUNT(DISTINCT menu_views.visitor_hash) AS unique_visitors,
       COALESCE(SUM(CASE WHEN menu_views.source = 'qr' THEN 1 ELSE 0 END), 0) AS qr_scans
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ? AND menu_views.viewed_at >= ? ${endClause}`,
  ).get(...parameters) as OverviewViewMetricsRow;

  const returning = db.prepare(
    `SELECT COUNT(*) AS count
     FROM (
       SELECT menu_views.visitor_hash
       FROM menu_views
       INNER JOIN menus ON menus.id = menu_views.menu_id
       WHERE menus.user_id = ?
         AND menu_views.visitor_hash IS NOT NULL
         AND menu_views.viewed_at >= ? ${endClause}
       GROUP BY menu_views.visitor_hash
       HAVING COUNT(*) > 1
     )`,
  ).get(...parameters) as CountRow;

  return {
    qrScans: Number(row.qr_scans),
    returningVisitors: Number(returning.count),
    uniqueVisitors: Number(row.unique_visitors),
    views: Number(row.views),
  };
}

function getEventMetrics(userId: string, start: Date, end?: Date) {
  const endClause = end ? "AND menu_events.occurred_at < ?" : "";
  const parameters = end
    ? [userId, start.toISOString(), end.toISOString()]
    : [userId, start.toISOString()];
  const row = db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN menu_events.event_type = 'product_view' THEN 1 ELSE 0 END), 0) AS product_views,
       COALESCE(SUM(CASE WHEN menu_events.event_type = 'campaign_view' THEN 1 ELSE 0 END), 0) AS campaign_views,
       COALESCE(SUM(CASE WHEN menu_events.event_type = 'contact_click' THEN 1 ELSE 0 END), 0) AS contact_clicks,
       COALESCE(SUM(CASE WHEN menu_events.event_type = 'search' THEN 1 ELSE 0 END), 0) AS searches
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ? AND menu_events.occurred_at >= ? ${endClause}`,
  ).get(...parameters) as OverviewEventMetricsRow;
  return {
    campaignViews: Number(row.campaign_views),
    contactClicks: Number(row.contact_clicks),
    productViews: Number(row.product_views),
    searches: Number(row.searches),
  };
}

function getPublishedAnalyticsMenus(userId: string) {
  const rows = db.prepare(
    `SELECT id, name, content_json, published_content_json
     FROM menus
     WHERE user_id = ? AND status = 'published'`,
  ).all(userId) as PublishedAnalyticsMenuRow[];

  return rows.flatMap((row) => {
    try {
      const menu = getVisibleMenu(
        JSON.parse(row.published_content_json || row.content_json) as MenuData,
      );
      return [{ id: row.id, name: menu.restaurantName.trim() || row.name, menu }];
    } catch {
      return [];
    }
  });
}

function getDashboardPeriodAnalytics(
  userId: string,
  days: DashboardPeriod,
  publishedMenus: ReturnType<typeof getPublishedAnalyticsMenus>,
): DashboardPeriodAnalytics {
  const currentStart = getUtcPeriodStart(days);
  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);

  const currentViews = getViewMetrics(userId, currentStart);
  const previousViews = getViewMetrics(userId, previousStart, currentStart);
  const currentEvents = getEventMetrics(userId, currentStart);
  const previousEvents = getEventMetrics(userId, previousStart, currentStart);

  const viewRows = db.prepare(
    `SELECT substr(menu_views.viewed_at, 1, 10) AS date, COUNT(*) AS views
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ? AND menu_views.viewed_at >= ?
     GROUP BY date`,
  ).all(userId, currentStart.toISOString()) as DailyOverviewRow[];
  const productRows = db.prepare(
    `SELECT substr(menu_events.occurred_at, 1, 10) AS date, COUNT(*) AS product_views
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ?
       AND menu_events.event_type = 'product_view'
       AND menu_events.occurred_at >= ?
     GROUP BY date`,
  ).all(userId, currentStart.toISOString()) as DailyOverviewRow[];
  const viewsByDate = new Map(viewRows.map((row) => [row.date, Number(row.views || 0)]));
  const productsByDate = new Map(
    productRows.map((row) => [row.date, Number(row.product_views || 0)]),
  );
  const activity = Array.from({ length: days }, (_, index) => {
    const date = new Date(currentStart);
    date.setUTCDate(date.getUTCDate() + index);
    const key = utcDateKey(date);
    return {
      date: key,
      productViews: productsByDate.get(key) || 0,
      views: viewsByDate.get(key) || 0,
    };
  });

  const productEventRows = db.prepare(
    `SELECT
       menu_events.menu_id,
       menu_events.category_id,
       menu_events.item_id,
       SUM(CASE WHEN menu_events.occurred_at >= ? THEN 1 ELSE 0 END) AS views,
       SUM(CASE WHEN menu_events.occurred_at < ? THEN 1 ELSE 0 END) AS previous_views
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ?
       AND menu_events.event_type = 'product_view'
       AND menu_events.occurred_at >= ?
       AND menu_events.category_id IS NOT NULL
       AND menu_events.item_id IS NOT NULL
     GROUP BY menu_events.menu_id, menu_events.category_id, menu_events.item_id`,
  ).all(
    currentStart.toISOString(),
    currentStart.toISOString(),
    userId,
    previousStart.toISOString(),
  ) as ProductEventRow[];
  const productEvents = new Map(productEventRows.map((row) => [
    `${row.menu_id}\u0000${row.category_id}\u0000${row.item_id}`,
    { previousViews: Number(row.previous_views), views: Number(row.views) },
  ]));
  const popularProducts = publishedMenus.flatMap((storedMenu) =>
    storedMenu.menu.categories.flatMap((category) =>
      category.items.flatMap((item) => {
        const metrics = productEvents.get(`${storedMenu.id}\u0000${category.id}\u0000${item.id}`);
        if (!metrics || metrics.views === 0) return [];
        return [{
          categoryId: category.id,
          categoryName: category.name,
          isCampaign: Boolean(item.isCampaign),
          itemId: item.id,
          itemName: item.name,
          menuId: storedMenu.id,
          menuName: storedMenu.name,
          ...metrics,
        }];
      }),
    ),
  ).sort((left, right) => right.views - left.views || right.previousViews - left.previousViews)
    .slice(0, 8);

  const categoryRows = db.prepare(
    `SELECT
       menu_events.menu_id,
       menu_events.category_id,
       SUM(CASE WHEN menu_events.occurred_at >= ? THEN 1 ELSE 0 END) AS views,
       SUM(CASE WHEN menu_events.occurred_at < ? THEN 1 ELSE 0 END) AS previous_views
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ?
       AND menu_events.event_type = 'category_view'
       AND menu_events.occurred_at >= ?
       AND menu_events.category_id IS NOT NULL
     GROUP BY menu_events.menu_id, menu_events.category_id`,
  ).all(
    currentStart.toISOString(),
    currentStart.toISOString(),
    userId,
    previousStart.toISOString(),
  ) as CategoryEventRow[];
  const categoryEvents = new Map(categoryRows.map((row) => [
    `${row.menu_id}\u0000${row.category_id}`,
    { previousViews: Number(row.previous_views), views: Number(row.views) },
  ]));
  const menuViewRows = db.prepare(
    `SELECT menu_views.menu_id, COUNT(*) AS views
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menus.user_id = ? AND menu_views.viewed_at >= ?
     GROUP BY menu_views.menu_id`,
  ).all(userId, currentStart.toISOString()) as MenuViewCountRow[];
  const menuViews = new Map(menuViewRows.map((row) => [row.menu_id, Number(row.views)]));
  const categoryPerformance = publishedMenus.flatMap((storedMenu) =>
    storedMenu.menu.categories.map((category) => {
      const metrics = categoryEvents.get(`${storedMenu.id}\u0000${category.id}`) || {
        previousViews: 0,
        views: 0,
      };
      const menuSessions = menuViews.get(storedMenu.id) || 0;
      return {
        categoryId: category.id,
        categoryName: category.name,
        menuId: storedMenu.id,
        menuName: storedMenu.name,
        previousViews: metrics.previousViews,
        reach: menuSessions > 0 ? Math.min(100, Math.round((metrics.views / menuSessions) * 100)) : 0,
        views: metrics.views,
      };
    }),
  ).sort((left, right) => right.views - left.views || left.categoryName.localeCompare(right.categoryName, "tr"));

  const missedSearches = db.prepare(
    `SELECT menu_events.event_value AS term, COUNT(*) AS count
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ?
       AND menu_events.event_type = 'search'
       AND menu_events.result_count = 0
       AND menu_events.event_value IS NOT NULL
       AND menu_events.occurred_at >= ?
     GROUP BY lower(menu_events.event_value)
     ORDER BY count DESC, term ASC
     LIMIT 5`,
  ).all(userId, currentStart.toISOString()) as MissedSearchRow[];

  return {
    activity,
    campaignViews: currentEvents.campaignViews,
    categoryPerformance,
    contactClicks: currentEvents.contactClicks,
    days,
    missedSearches: missedSearches.map((row) => ({
      count: Number(row.count),
      term: row.term,
    })),
    popularProducts,
    previousCampaignViews: previousEvents.campaignViews,
    previousProductViews: previousEvents.productViews,
    previousReturningVisitors: previousViews.returningVisitors,
    previousUniqueVisitors: previousViews.uniqueVisitors,
    previousViews: previousViews.views,
    productViews: currentEvents.productViews,
    qrScans: currentViews.qrScans,
    returningVisitors: currentViews.returningVisitors,
    searches: currentEvents.searches,
    uniqueVisitors: currentViews.uniqueVisitors,
    views: currentViews.views,
  };
}

export function getDashboardOverviewAnalytics(userId: string): DashboardOverviewAnalytics {
  const publishedMenus = getPublishedAnalyticsMenus(userId);
  const tracking = db.prepare(
    `SELECT MIN(menu_events.occurred_at) AS tracking_started_at
     FROM menu_events
     INNER JOIN menus ON menus.id = menu_events.menu_id
     WHERE menus.user_id = ?`,
  ).get(userId) as TrackingRow;

  return {
    periods: {
      7: getDashboardPeriodAnalytics(userId, 7, publishedMenus),
      30: getDashboardPeriodAnalytics(userId, 30, publishedMenus),
    },
    trackingStartedAt: tracking.tracking_started_at,
  };
}
