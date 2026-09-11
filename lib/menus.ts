import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { MenuViewContext } from "@/lib/menu-tracking";
import { normalizeMenuTheme, type MenuData, type MenuTheme, type MenuThemeInput } from "@/lib/menu";
export { isValidMenuData, isValidMenuTheme } from "@/lib/menu-validation";

export type MenuStatus = "draft" | "published";

export type StoredMenu = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  status: MenuStatus;
  menu: MenuData;
  theme: MenuTheme;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

type MenuRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  status: MenuStatus;
  content_json: string;
  theme_json: string;
  published_content_json: string | null;
  published_theme_json: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "menu";
}

function uniqueSlug(name: string) {
  const base = slugify(name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${base}-${suffix}`;
    const exists = db.prepare("SELECT 1 FROM menus WHERE slug = ?").get(candidate);
    if (!exists) return candidate;
  }
  return `${base}-${randomUUID()}`;
}

function parseRow(row: MenuRow): StoredMenu {
  const publishedContent = row.published_content_json || row.content_json;
  const publishedTheme = row.published_theme_json || row.theme_json;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    menu: JSON.parse(row.content_json) as MenuData,
    theme: normalizeMenuTheme(JSON.parse(row.theme_json)),
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    hasUnpublishedChanges: row.status === "published" && (
      row.content_json !== publishedContent || row.theme_json !== publishedTheme
    ),
  };
}

function parsePublishedRow(row: MenuRow): StoredMenu {
  const publishedMenu = JSON.parse(row.published_content_json || row.content_json) as MenuData;
  const publishedTheme = normalizeMenuTheme(
    JSON.parse(row.published_theme_json || row.theme_json),
  );
  return {
    ...parseRow(row),
    name: publishedMenu.restaurantName.trim() || "İsimsiz menü",
    menu: publishedMenu,
    theme: publishedTheme,
    hasUnpublishedChanges: false,
  };
}

export function listUserMenus(userId: string) {
  const rows = db
    .prepare("SELECT * FROM menus WHERE user_id = ? ORDER BY updated_at DESC")
    .all(userId) as MenuRow[];
  return rows.map(parseRow);
}

export function getUserMenu(userId: string, id: string) {
  const row = db
    .prepare("SELECT * FROM menus WHERE id = ? AND user_id = ?")
    .get(id, userId) as MenuRow | undefined;
  return row ? parseRow(row) : null;
}

export function createUserMenu(userId: string, menu: MenuData, theme: MenuThemeInput) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const name = menu.restaurantName.trim() || "İsimsiz menü";
  const slug = uniqueSlug(name);
  const normalizedTheme = normalizeMenuTheme(theme);
  db.prepare(
    `INSERT INTO menus
      (id, user_id, name, slug, status, content_json, theme_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
  ).run(id, userId, name, slug, JSON.stringify(menu), JSON.stringify(normalizedTheme), now, now);
  return getUserMenu(userId, id)!;
}

export function updateUserMenu(
  userId: string,
  id: string,
  menu: MenuData,
  theme: MenuThemeInput,
  options: { publish?: boolean; status?: MenuStatus; expectedUpdatedAt?: string } = {},
) {
  const existing = getUserMenu(userId, id);
  if (!existing) return null;
  if (options.expectedUpdatedAt && existing.updatedAt !== options.expectedUpdatedAt) return null;

  const shouldPublish = options.publish === true;
  const nextStatus = shouldPublish ? "published" : options.status || existing.status;
  const now = new Date(Math.max(Date.now(), Date.parse(existing.updatedAt) + 1)).toISOString();
  const normalizedTheme = normalizeMenuTheme(theme);
  const publishedAt = shouldPublish ? now : existing.publishedAt;
  const serializedMenu = JSON.stringify(menu);
  const serializedTheme = JSON.stringify(normalizedTheme);

  const updated = db.prepare(
    `UPDATE menus
     SET name = ?, status = ?, content_json = ?, theme_json = ?, updated_at = ?, published_at = ?,
         published_content_json = CASE WHEN ? = 1 THEN ? ELSE published_content_json END,
         published_theme_json = CASE WHEN ? = 1 THEN ? ELSE published_theme_json END
     WHERE id = ? AND user_id = ? AND updated_at = ?`,
  ).run(
    menu.restaurantName.trim() || "İsimsiz menü",
    nextStatus,
    serializedMenu,
    serializedTheme,
    now,
    publishedAt,
    shouldPublish ? 1 : 0,
    serializedMenu,
    shouldPublish ? 1 : 0,
    serializedTheme,
    id,
    userId,
    existing.updatedAt,
  );
  if (updated.changes !== 1) return null;
  return getUserMenu(userId, id);
}

export function deleteUserMenu(userId: string, id: string) {
  return db.prepare("DELETE FROM menus WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function getPublishedMenu(slug: string) {
  const row = db
    .prepare("SELECT * FROM menus WHERE slug = ? AND status = 'published'")
    .get(slug) as MenuRow | undefined;
  return row ? parsePublishedRow(row) : null;
}

export function recordMenuView(
  id: string,
  context: MenuViewContext = {
    deviceType: "unknown",
    language: "unknown",
    source: "unknown",
  },
) {
  if (context.deviceType === "bot") return null;
  const visitId = randomUUID();

  const recordView = db.transaction((menuId: string, currentVisitId: string) => {
    db.prepare(
      `INSERT INTO menu_views
        (menu_id, visit_id, viewed_at, source, device_type, language)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      menuId,
      currentVisitId,
      new Date().toISOString(),
      context.source,
      context.deviceType,
      context.language,
    );
    db.prepare("UPDATE menus SET view_count = view_count + 1 WHERE id = ?").run(menuId);
  });
  recordView(id, visitId);
  return visitId;
}
