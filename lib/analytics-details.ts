import { db } from "@/lib/db";
import { getVisibleMenu, type MenuData } from "@/lib/menu";

export type AnalyticsPeriod = 7 | 14 | 30;
export type EngagementRow = {
  key: string;
  menuId: string;
  menuName: string;
  categoryKey: string;
  categoryName: string;
  name: string;
  live: boolean;
  visits: number;
  previousVisits: number;
  visitors: number;
  menuVisits: number;
  previousMenuVisits: number;
  reach: number | null;
};
export type EngagementPeriod = {
  start: string;
  previousStart: string;
  end: string;
  measuredVisits: number;
  products: EngagementRow[];
  categories: EngagementRow[];
};
export type EngagementAnalytics = Record<AnalyticsPeriod, EngagementPeriod>;

type CatalogRow = Omit<EngagementRow, "visits" | "previousVisits" | "visitors" | "menuVisits" | "previousMenuVisits" | "reach">;
type MenuRow = { id: string; name: string; status: string; published_content_json: string | null };
type VisitRow = { menu_id: string; visits: number; previous_visits: number };
type EventRow = VisitRow & {
  event_type: "category_view" | "product_view";
  category_id: string;
  item_id: string | null;
  visitors: number;
};

const entityKey = (...parts: string[]) => JSON.stringify(parts);

/** Aggregates visit cohorts: a visit and its events belong to its opening day.
 * Only identified/measured visits are eligible, so legacy opens cannot dilute
 * reach. All statements retain the user predicate even with a menu filter.
 */
export function getEngagementAnalytics(
  userId: string,
  menuId: string | null = null,
  now = new Date(),
): EngagementAnalytics {
  const menus = db.prepare(
    `SELECT id, name, status, published_content_json FROM menus
     WHERE user_id = ? AND (? IS NULL OR id = ?)`,
  ).all(userId, menuId, menuId) as MenuRow[];
  const menuNames = new Map(menus.map((menu) => [menu.id, menu.name]));
  const products = new Map<string, CatalogRow>();
  const categories = new Map<string, CatalogRow>();

  for (const stored of menus) {
    if (!stored.published_content_json) continue;
    try {
      const published = JSON.parse(stored.published_content_json) as MenuData;
      menuNames.set(stored.id, published.restaurantName.trim() || stored.name);
      const visible = getVisibleMenu(published);
      const liveCategories = new Set(visible.categories.map((category) => category.id));
      const liveProducts = new Set(visible.categories.flatMap((category) =>
        category.items.map((item) => entityKey(stored.id, category.id, item.id)),
      ));
      for (const category of published.categories) {
        const categoryKey = entityKey(stored.id, category.id);
        const common = {
          menuId: stored.id,
          menuName: menuNames.get(stored.id)!,
          categoryKey,
          categoryName: category.name,
        };
        categories.set(categoryKey, {
          ...common, key: categoryKey, name: category.name,
          live: stored.status === "published" && liveCategories.has(category.id),
        });
        for (const item of category.items) {
          const key = entityKey(stored.id, category.id, item.id);
          products.set(key, {
            ...common, key, name: item.name,
            live: stored.status === "published" && liveProducts.has(key),
          });
        }
      }
    } catch {
      // Keep historical event counts even if the current snapshot cannot load.
    }
  }

  const period = (days: AnalyticsPeriod): EngagementPeriod => {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days + 1);
    const previousStart = new Date(start);
    previousStart.setUTCDate(start.getUTCDate() - days);
    const params = {
      userId, menuId, start: start.toISOString(),
      previousStart: previousStart.toISOString(), end: now.toISOString(),
    };
    const visits = db.prepare(
      `SELECT v.menu_id,
         SUM(CASE WHEN v.viewed_at >= @start THEN 1 ELSE 0 END) AS visits,
         SUM(CASE WHEN v.viewed_at < @start THEN 1 ELSE 0 END) AS previous_visits
       FROM menu_views v INNER JOIN menus m ON m.id = v.menu_id
       WHERE m.user_id = @userId AND (@menuId IS NULL OR m.id = @menuId)
         AND v.visitor_hash IS NOT NULL
         AND v.viewed_at >= @previousStart AND v.viewed_at <= @end
       GROUP BY v.menu_id`,
    ).all(params) as VisitRow[];
    const visitsByMenu = new Map(visits.map((row) => [row.menu_id, row]));
    const events = db.prepare(
      `SELECT e.menu_id, e.event_type, e.category_id, e.item_id,
         COUNT(DISTINCT CASE WHEN v.viewed_at >= @start THEN v.visit_id END) AS visits,
         COUNT(DISTINCT CASE WHEN v.viewed_at < @start THEN v.visit_id END) AS previous_visits,
         COUNT(DISTINCT CASE WHEN v.viewed_at >= @start THEN v.visitor_hash END) AS visitors
       FROM menu_views v INNER JOIN menus m ON m.id = v.menu_id
       INNER JOIN menu_events e ON e.visit_id = v.visit_id AND e.menu_id = v.menu_id
       WHERE m.user_id = @userId AND (@menuId IS NULL OR m.id = @menuId)
         AND v.visitor_hash IS NOT NULL
         AND v.viewed_at >= @previousStart AND v.viewed_at <= @end
         AND e.occurred_at >= v.viewed_at AND e.occurred_at <= @end
         AND e.category_id IS NOT NULL
         AND (e.event_type = 'category_view' OR (e.event_type = 'product_view' AND e.item_id IS NOT NULL))
       GROUP BY e.menu_id, e.event_type, e.category_id, e.item_id`,
    ).all(params) as EventRow[];

    const metrics = new Map<string, EventRow>();
    const periodProducts = new Map(products);
    const periodCategories = new Map(categories);
    for (const event of events) {
      const categoryKey = entityKey(event.menu_id, event.category_id);
      const key = event.event_type === "product_view"
        ? entityKey(event.menu_id, event.category_id, event.item_id!) : categoryKey;
      const catalog = event.event_type === "product_view" ? periodProducts : periodCategories;
      metrics.set(key, event);
      if (!catalog.has(key)) {
        catalog.set(key, {
          key, menuId: event.menu_id, menuName: menuNames.get(event.menu_id) || "Menü",
          categoryKey, categoryName: categories.get(categoryKey)?.name || "Geçmiş kategori",
          name: event.event_type === "product_view" ? "Kaldırılmış ürün" : "Kaldırılmış kategori",
          live: false,
        });
      }
    }
    const withMetrics = (catalog: Map<string, CatalogRow>): EngagementRow[] =>
      Array.from(catalog.values()).flatMap((row) => {
        const counts = metrics.get(row.key);
        if (!row.live && !counts) return [];
        const menuCounts = visitsByMenu.get(row.menuId);
        const menuVisits = Number(menuCounts?.visits || 0);
        const seen = Number(counts?.visits || 0);
        return [{
          ...row, visits: seen, previousVisits: Number(counts?.previous_visits || 0),
          visitors: Number(counts?.visitors || 0), menuVisits,
          previousMenuVisits: Number(menuCounts?.previous_visits || 0),
          reach: menuVisits ? Math.round((seen / menuVisits) * 1000) / 10 : null,
        }];
      }).sort((a, b) => b.visits - a.visits || b.previousVisits - a.previousVisits || a.name.localeCompare(b.name, "tr") || a.key.localeCompare(b.key));

    return {
      start: params.start, previousStart: params.previousStart, end: params.end,
      measuredVisits: visits.reduce((total, row) => total + Number(row.visits), 0),
      products: withMetrics(periodProducts), categories: withMetrics(periodCategories),
    };
  };
  return { 7: period(7), 14: period(14), 30: period(30) };
}
