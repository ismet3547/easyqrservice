import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import {
  getMenuBusinessProfile,
  getVisibleMenu,
  hasEnglishMenuTranslation,
  type MenuData,
  type MenuItem,
} from "@/lib/menu";
import {
  menuContactActions,
  menuEventTypes,
  type MenuEventBatch,
  type MenuInteractionEvent,
} from "@/lib/menu-event-types";

const maximumBatchSize = 20;
const maximumEventsPerVisit = 750;
const maximumVisitAgeMs = 24 * 60 * 60 * 1000;
const opaqueIdPattern = /^[a-zA-Z0-9_-]{20,100}$/;

type VisitMenuRow = {
  content_json: string;
  menu_id: string;
  published_content_json: string | null;
  viewed_at: string;
};

type EventCountRow = { count: number };

type PreparedMenuEvent = {
  categoryId: string | null;
  dedupeKey: string | null;
  eventValue: string | null;
  itemId: string | null;
  resultCount: number | null;
  type: MenuInteractionEvent["type"];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalBoundedString(value: unknown, maximumLength: number) {
  return value === undefined || (
    typeof value === "string" && value.length <= maximumLength
  );
}

function isValidMenuInteractionEvent(value: unknown): value is MenuInteractionEvent {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => ![
    "type",
    "categoryId",
    "itemId",
    "value",
    "resultCount",
  ].includes(key))) return false;

  return (
    typeof value.type === "string" &&
    menuEventTypes.includes(value.type as MenuInteractionEvent["type"]) &&
    optionalBoundedString(value.categoryId, 100) &&
    optionalBoundedString(value.itemId, 100) &&
    optionalBoundedString(value.value, 100) &&
    (value.resultCount === undefined || (
      Number.isInteger(value.resultCount) &&
      Number(value.resultCount) >= 0 &&
      Number(value.resultCount) <= 500
    ))
  );
}

export function isValidMenuEventBatch(value: unknown): value is MenuEventBatch {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !["visitId", "visitorId", "events"].includes(key))) {
    return false;
  }
  return (
    typeof value.visitId === "string" && opaqueIdPattern.test(value.visitId) &&
    typeof value.visitorId === "string" && opaqueIdPattern.test(value.visitorId) &&
    Array.isArray(value.events) &&
    value.events.length > 0 &&
    value.events.length <= maximumBatchSize &&
    value.events.every(isValidMenuInteractionEvent)
  );
}

function cleanSearchTerm(value: string | undefined) {
  if (!value) return "";
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function prepareEvent(
  event: MenuInteractionEvent,
  menu: MenuData,
): PreparedMenuEvent | null {
  const visibleMenu = getVisibleMenu(menu);
  const categories = new Set(visibleMenu.categories.map((category) => category.id));
  const items = new Map<string, MenuItem>();
  visibleMenu.categories.forEach((category) => {
    category.items.forEach((item) => items.set(`${category.id}\u0000${item.id}`, item));
  });

  if (event.type === "session_start") {
    return {
      categoryId: null,
      dedupeKey: "session",
      eventValue: null,
      itemId: null,
      resultCount: null,
      type: event.type,
    };
  }

  if (event.type === "category_view") {
    if (!event.categoryId || !categories.has(event.categoryId)) return null;
    return {
      categoryId: event.categoryId,
      dedupeKey: `category:${event.categoryId}`,
      eventValue: null,
      itemId: null,
      resultCount: null,
      type: event.type,
    };
  }

  if (event.type === "product_view" || event.type === "campaign_view") {
    if (!event.categoryId || !event.itemId) return null;
    const item = items.get(`${event.categoryId}\u0000${event.itemId}`);
    if (!item || (event.type === "campaign_view" && !item.isCampaign)) return null;
    return {
      categoryId: event.categoryId,
      dedupeKey: `${event.type}:${event.categoryId}:${event.itemId}`,
      eventValue: null,
      itemId: event.itemId,
      resultCount: null,
      type: event.type,
    };
  }

  if (event.type === "search") {
    const searchTerm = cleanSearchTerm(event.value);
    if (searchTerm.length < 2 || event.resultCount === undefined) return null;
    const totalItems = visibleMenu.categories.reduce(
      (total, category) => total + category.items.length,
      0,
    );
    if (event.resultCount > totalItems) return null;
    return {
      categoryId: null,
      dedupeKey: `search:${hashValue(searchTerm.toLocaleLowerCase("tr-TR"))}`,
      eventValue: searchTerm,
      itemId: null,
      resultCount: event.resultCount,
      type: event.type,
    };
  }

  if (event.type === "contact_click") {
    const action = event.value;
    if (!action || !menuContactActions.includes(action as (typeof menuContactActions)[number])) {
      return null;
    }
    const profile = getMenuBusinessProfile(menu);
    const availableActions = {
      phone: Boolean(profile.phone.trim()),
      whatsapp: Boolean(profile.whatsapp.trim()),
      directions: Boolean(profile.mapsUrl.trim() || profile.address.trim()),
      instagram: Boolean(profile.instagram.trim()),
    };
    if (!availableActions[action as keyof typeof availableActions]) return null;
    return {
      categoryId: null,
      dedupeKey: `contact:${action}`,
      eventValue: action,
      itemId: null,
      resultCount: null,
      type: event.type,
    };
  }

  if (event.type === "language_change") {
    if (event.value !== "tr" && event.value !== "en") return null;
    if (event.value === "en" && !hasEnglishMenuTranslation(menu)) return null;
    return {
      categoryId: null,
      dedupeKey: `language:${event.value}`,
      eventValue: event.value,
      itemId: null,
      resultCount: null,
      type: event.type,
    };
  }

  return null;
}

export function recordMenuEventBatch(batch: MenuEventBatch) {
  const visit = db.prepare(
    `SELECT
       menu_views.menu_id,
       menu_views.viewed_at,
       menus.content_json,
       menus.published_content_json
     FROM menu_views
     INNER JOIN menus ON menus.id = menu_views.menu_id
     WHERE menu_views.visit_id = ? AND menus.status = 'published'`,
  ).get(batch.visitId) as VisitMenuRow | undefined;

  if (!visit) return { accepted: 0, found: false };
  const viewedAt = Date.parse(visit.viewed_at);
  if (!Number.isFinite(viewedAt) || Date.now() - viewedAt > maximumVisitAgeMs) {
    return { accepted: 0, found: false };
  }

  let menu: MenuData;
  try {
    menu = JSON.parse(visit.published_content_json || visit.content_json) as MenuData;
  } catch {
    return { accepted: 0, found: false };
  }

  const existingCount = db.prepare(
    "SELECT COUNT(*) AS count FROM menu_events WHERE visit_id = ?",
  ).get(batch.visitId) as EventCountRow;
  let remaining = Math.max(0, maximumEventsPerVisit - Number(existingCount.count));
  if (remaining === 0) return { accepted: 0, found: true };

  const visitorHash = hashValue(batch.visitorId);
  const occurredAt = new Date().toISOString();
  const insertEvent = db.prepare(
    `INSERT OR IGNORE INTO menu_events
      (menu_id, visit_id, event_type, category_id, item_id, event_value,
       result_count, dedupe_key, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const recordEvents = db.transaction(() => {
    db.prepare(
      `UPDATE menu_views
       SET visitor_hash = COALESCE(visitor_hash, ?)
       WHERE visit_id = ?`,
    ).run(visitorHash, batch.visitId);

    let accepted = 0;
    for (const event of batch.events) {
      if (remaining <= 0) break;
      const prepared = prepareEvent(event, menu);
      if (!prepared) continue;
      const result = insertEvent.run(
        visit.menu_id,
        batch.visitId,
        prepared.type,
        prepared.categoryId,
        prepared.itemId,
        prepared.eventValue,
        prepared.resultCount,
        prepared.dedupeKey,
        occurredAt,
      );
      if (result.changes > 0) {
        accepted += 1;
        remaining -= 1;
      }
    }
    return accepted;
  });

  return { accepted: recordEvents(), found: true };
}
