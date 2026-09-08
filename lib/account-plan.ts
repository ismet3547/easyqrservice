import { db } from "@/lib/db";

export const trialDurationDays = 7;
export const planMenuLimits = {
  trial: 1,
  pro: 5,
} as const;

export type AccountPlanId = keyof typeof planMenuLimits;
export type AccountPlanStatus = "active" | "expired";

export type AccountAccess = {
  plan: AccountPlanId;
  status: AccountPlanStatus;
  endsAt: string | null;
  daysRemaining: number;
  maxMenus: number;
  menuCount: number;
  canCreateMenu: boolean;
  canPublish: boolean;
  canUseAi: boolean;
};

type AccountPlanRow = {
  plan: string;
  trial_ends_at: string | null;
  plan_expires_at: string | null;
  created_at: string;
};

type MenuCountRow = { count: number };

export type AccountFeature = "ai" | "create-menu" | "publish";

export type AccountFeatureBlock = {
  code: "ACCOUNT_ACCESS_EXPIRED" | "MENU_LIMIT_REACHED";
  message: string;
  status: 403 | 409;
};

function validDate(value: string | null) {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString() : null;
}

export function resolveAccountAccess(
  row: AccountPlanRow,
  menuCount: number,
  now = new Date(),
): AccountAccess {
  const plan: AccountPlanId = row.plan === "pro" ? "pro" : "trial";
  const createdAt = validDate(row.created_at);
  const trialFallback = createdAt
    ? new Date(Date.parse(createdAt) + trialDurationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const endsAt = plan === "pro"
    ? validDate(row.plan_expires_at)
    : validDate(row.trial_ends_at) || trialFallback;
  const remainingMilliseconds = endsAt ? Date.parse(endsAt) - now.getTime() : 0;
  const status: AccountPlanStatus = remainingMilliseconds > 0 ? "active" : "expired";
  const maxMenus = planMenuLimits[plan];

  return {
    plan,
    status,
    endsAt,
    daysRemaining: status === "active"
      ? Math.max(1, Math.ceil(remainingMilliseconds / (24 * 60 * 60 * 1000)))
      : 0,
    maxMenus,
    menuCount,
    canCreateMenu: status === "active" && menuCount < maxMenus,
    canPublish: status === "active",
    canUseAi: status === "active",
  };
}

export function getAccountAccess(userId: string, now = new Date()): AccountAccess {
  const row = db.prepare(
    `SELECT plan, trial_ends_at, plan_expires_at, created_at
     FROM users
     WHERE id = ?`,
  ).get(userId) as AccountPlanRow | undefined;

  if (!row) {
    throw new Error("Account not found.");
  }

  const menuCount = (db.prepare(
    "SELECT COUNT(*) AS count FROM menus WHERE user_id = ?",
  ).get(userId) as MenuCountRow).count;

  return resolveAccountAccess(row, menuCount, now);
}

export function getAccountFeatureBlock(
  access: AccountAccess,
  feature: AccountFeature,
): AccountFeatureBlock | null {
  if (access.status === "expired") {
    return {
      code: "ACCOUNT_ACCESS_EXPIRED",
      message: access.plan === "trial"
        ? "7 günlük deneme süren sona erdi. AI araçlarını kullanmak ve menü yayınlamak için Pro erişimini etkinleştir."
        : "Pro erişim süren sona erdi. AI araçlarını kullanmak ve menü yayınlamak için erişimini yenile.",
      status: 403,
    };
  }

  if (feature === "create-menu" && access.menuCount >= access.maxMenus) {
    return {
      code: "MENU_LIMIT_REACHED",
      message: access.plan === "trial"
        ? "Deneme planında 1 menü oluşturabilirsin. Daha fazla menü için Pro erişimini etkinleştir."
        : `Pro planındaki ${access.maxMenus} menü sınırına ulaştın.`,
      status: 409,
    };
  }

  return null;
}
