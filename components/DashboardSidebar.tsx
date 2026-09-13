"use client";

import {
  BarChart3,
  BookOpen,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
} from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { AICreditBadge } from "@/components/AICreditBadge";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAppLocale } from "@/components/LocaleProvider";

export type DashboardSection = "analytics" | "menus" | "overview" | "settings";

export function DashboardSidebar({
  active,
  menuCount,
  onLogout,
  user,
}: {
  active: DashboardSection;
  menuCount: number;
  onLogout: () => void;
  user: SessionUser;
}) {
  const { intlLocale, locale } = useAppLocale();
  const copy = locale === "tr" ? {
    account: "Hesap",
    analytics: "Analitik",
    help: "Yardım merkezi",
    helpSoon: "Yardım merkezi sonraki sürümde",
    logout: "Çıkış yap",
    menus: "Menülerim",
    nav: "Dashboard menüsü",
    overview: "Genel bakış",
    settings: "Ayarlar",
    workspace: "Çalışma alanı",
  } : {
    account: "Account",
    analytics: "Analytics",
    help: "Help center",
    helpSoon: "Help center is coming soon",
    logout: "Log out",
    menus: "My menus",
    nav: "Dashboard navigation",
    overview: "Overview",
    settings: "Settings",
    workspace: "Workspace",
  };
  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" href="/dashboard">
        <span><QrCode size={19} /></span><strong>easy<i>qr</i></strong>
      </Link>

      <nav className="dashboard-nav" aria-label={copy.nav}>
        <span className="dashboard-nav-label">{copy.workspace}</span>
        <Link aria-current={active === "overview" ? "page" : undefined} className={active === "overview" ? "active" : ""} href="/dashboard">
          <LayoutDashboard size={17} /> {copy.overview}
        </Link>
        <Link aria-current={active === "menus" ? "page" : undefined} className={active === "menus" ? "active" : ""} href="/dashboard/menus">
          <BookOpen size={17} /> {copy.menus} <b>{menuCount}</b>
        </Link>
        <Link aria-current={active === "analytics" ? "page" : undefined} className={active === "analytics" ? "active" : ""} href="/dashboard/analytics">
          <BarChart3 size={17} /> {copy.analytics}
        </Link>
        <span className="dashboard-nav-label second">{copy.account}</span>
        <Link aria-current={active === "settings" ? "page" : undefined} className={active === "settings" ? "active" : ""} href="/dashboard/settings">
          <Settings size={17} /> {copy.settings}
        </Link>
        <button disabled title={copy.helpSoon}>
          <CircleHelp size={17} /> {copy.help}
        </button>
      </nav>

      <LocaleSwitcher />
      <AICreditBadge />

      <div className="dashboard-profile">
        <span className="profile-avatar">{user.name.slice(0, 1).toLocaleUpperCase(intlLocale)}</span>
        <div><strong>{user.name}</strong><small>{user.email}</small></div>
        <button onClick={onLogout} title={copy.logout} aria-label={copy.logout}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export function DashboardMobileHeader({ user }: { user: SessionUser }) {
  const { intlLocale, locale } = useAppLocale();
  return (
    <header className="dashboard-mobile-header">
      <Link className="dashboard-brand" href="/dashboard">
        <span><QrCode size={17} /></span><strong>easy<i>qr</i></strong>
      </Link>
      <div className="dashboard-mobile-actions">
        <LocaleSwitcher compact />
        <AICreditBadge compact />
        <Link className="dashboard-mobile-avatar" href="/dashboard/settings" aria-label={locale === "tr" ? "Hesap ayarlarını aç" : "Open account settings"}>
          {user.name.slice(0, 1).toLocaleUpperCase(intlLocale)}
        </Link>
      </div>
    </header>
  );
}
