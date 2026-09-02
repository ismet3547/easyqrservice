import { randomBytes, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  menuAllergens,
  menuDietaryTags,
  type MenuData,
  type MenuTheme,
} from "@/lib/menu";

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
};

type MenuRow = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  status: MenuStatus;
  content_json: string;
  theme_json: string;
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
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    menu: JSON.parse(row.content_json) as MenuData,
    theme: JSON.parse(row.theme_json) as MenuTheme,
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEnglishTranslationContainer(
  value: unknown,
  validateEnglish: (translation: Record<string, unknown>) => boolean,
) {
  if (value === undefined) return true;
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "en")) return false;
  if (value.en === undefined) return true;
  return isRecord(value.en) && validateEnglish(value.en);
}

function isValidMenuEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => ["restaurantName", "subtitle", "sourceFingerprint"].includes(key)) &&
    typeof value.restaurantName === "string" && value.restaurantName.length <= 120 &&
    typeof value.subtitle === "string" && value.subtitle.length <= 240 &&
    typeof value.sourceFingerprint === "string" && value.sourceFingerprint.length > 0 &&
    value.sourceFingerprint.length <= 64
  );
}

function isValidCategoryEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => key === "name") &&
    typeof value.name === "string" &&
    value.name.length <= 100
  );
}

function isValidItemEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => ["name", "description", "badge"].includes(key)) &&
    typeof value.name === "string" && value.name.length <= 180 &&
    typeof value.description === "string" && value.description.length <= 1000 &&
    typeof value.badge === "string" && value.badge.length <= 40
  );
}

export function isValidMenuData(value: unknown): value is MenuData {
  if (!value || typeof value !== "object") return false;
  const menu = value as Partial<MenuData>;
  if (
    typeof menu.restaurantName !== "string" || menu.restaurantName.length > 120 ||
    typeof menu.subtitle !== "string" || menu.subtitle.length > 240 ||
    typeof menu.currency !== "string" || menu.currency.length > 12 ||
    !isEnglishTranslationContainer(menu.translations, isValidMenuEnglishTranslation) ||
    !Array.isArray(menu.categories) ||
    menu.categories.length > 30
  ) return false;

  const totalItems = menu.categories.reduce(
    (sum, category) => sum + (Array.isArray(category?.items) ? category.items.length : 0),
    0,
  );
  if (totalItems > 500) return false;

  const totalImageSize = menu.categories.reduce(
    (menuTotal, category) => menuTotal + (Array.isArray(category?.items)
      ? category.items.reduce(
          (categoryTotal, item) => categoryTotal + (typeof item?.image === "string" ? item.image.length : 0),
          0,
        )
      : 0),
    0,
  );
  if (totalImageSize > 8_000_000) return false;

  return menu.categories.every((category) =>
    category &&
    typeof category.id === "string" && category.id.length <= 100 &&
    typeof category.name === "string" && category.name.length <= 100 &&
    isEnglishTranslationContainer(category.translations, isValidCategoryEnglishTranslation) &&
    Array.isArray(category.items) &&
    category.items.length <= 100 &&
    category.items.every((item) =>
      item &&
      typeof item.id === "string" && item.id.length <= 100 &&
      typeof item.name === "string" && item.name.length <= 180 &&
      typeof item.description === "string" && item.description.length <= 1000 &&
      typeof item.price === "string" && item.price.length <= 40 &&
      typeof item.badge === "string" && item.badge.length <= 40 &&
      isEnglishTranslationContainer(item.translations, isValidItemEnglishTranslation) &&
      (item.originalPrice === undefined ||
        (typeof item.originalPrice === "string" && item.originalPrice.length <= 40)) &&
      (item.isCampaign === undefined || typeof item.isCampaign === "boolean") &&
      (item.availability === undefined ||
        ["available", "sold-out", "hidden"].includes(item.availability)) &&
      (item.dietaryTags === undefined ||
        (Array.isArray(item.dietaryTags) &&
          item.dietaryTags.length <= menuDietaryTags.length &&
          new Set(item.dietaryTags).size === item.dietaryTags.length &&
          item.dietaryTags.every((tag) => menuDietaryTags.includes(tag)))) &&
      (item.allergens === undefined ||
        (Array.isArray(item.allergens) &&
          item.allergens.length <= menuAllergens.length &&
          new Set(item.allergens).size === item.allergens.length &&
          item.allergens.every((allergen) => menuAllergens.includes(allergen)))) &&
      (item.image === undefined || item.image === "" ||
        (typeof item.image === "string" &&
          item.image.length <= 750_000 &&
          /^data:image\/(?:jpeg|png|webp);base64,/i.test(item.image))),
    ),
  );
}

export function isValidMenuTheme(value: unknown): value is MenuTheme {
  if (!value || typeof value !== "object") return false;
  const theme = value as Partial<MenuTheme>;
  const isColor = (color: unknown) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
  return (
    isColor(theme.accent) &&
    isColor(theme.background) &&
    isColor(theme.surface) &&
    isColor(theme.text) &&
    ["modern", "editorial", "friendly"].includes(theme.font || "") &&
    ["cards", "compact", "tiles", "showcase"].includes(theme.layout || "") &&
    typeof theme.showDescriptions === "boolean"
  );
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

export function createUserMenu(userId: string, menu: MenuData, theme: MenuTheme) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const name = menu.restaurantName.trim() || "İsimsiz menü";
  const slug = uniqueSlug(name);
  db.prepare(
    `INSERT INTO menus
      (id, user_id, name, slug, status, content_json, theme_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
  ).run(id, userId, name, slug, JSON.stringify(menu), JSON.stringify(theme), now, now);
  return getUserMenu(userId, id)!;
}

export function updateUserMenu(
  userId: string,
  id: string,
  menu: MenuData,
  theme: MenuTheme,
  status?: MenuStatus,
) {
  const existing = getUserMenu(userId, id);
  if (!existing) return null;

  const nextStatus = status || existing.status;
  const now = new Date().toISOString();
  const publishedAt = nextStatus === "published"
    ? existing.publishedAt || now
    : existing.publishedAt;

  db.prepare(
    `UPDATE menus
     SET name = ?, status = ?, content_json = ?, theme_json = ?, updated_at = ?, published_at = ?
     WHERE id = ? AND user_id = ?`,
  ).run(
    menu.restaurantName.trim() || "İsimsiz menü",
    nextStatus,
    JSON.stringify(menu),
    JSON.stringify(theme),
    now,
    publishedAt,
    id,
    userId,
  );
  return getUserMenu(userId, id);
}

export function deleteUserMenu(userId: string, id: string) {
  return db.prepare("DELETE FROM menus WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
}

export function getPublishedMenu(slug: string) {
  const row = db
    .prepare("SELECT * FROM menus WHERE slug = ? AND status = 'published'")
    .get(slug) as MenuRow | undefined;
  return row ? parseRow(row) : null;
}

export function recordMenuView(id: string) {
  const recordView = db.transaction((menuId: string) => {
    db.prepare("INSERT INTO menu_views (menu_id, viewed_at) VALUES (?, ?)")
      .run(menuId, new Date().toISOString());
    db.prepare("UPDATE menus SET view_count = view_count + 1 WHERE id = ?").run(menuId);
  });
  recordView(id);
}
