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
  return (
    <aside className="dashboard-sidebar">
      <Link className="dashboard-brand" href="/dashboard">
        <span><QrCode size={19} /></span><strong>easy<i>qr</i></strong>
      </Link>

      <nav className="dashboard-nav" aria-label="Dashboard menüsü">
        <span className="dashboard-nav-label">Çalışma alanı</span>
        <Link className={active === "overview" ? "active" : ""} href="/dashboard">
          <LayoutDashboard size={17} /> Genel bakış
        </Link>
        <Link className={active === "menus" ? "active" : ""} href="/dashboard/menus">
          <BookOpen size={17} /> Menülerim <b>{menuCount}</b>
        </Link>
        <Link className={active === "analytics" ? "active" : ""} href="/dashboard/analytics">
          <BarChart3 size={17} /> Analitik
        </Link>
        <span className="dashboard-nav-label second">Hesap</span>
        <Link className={active === "settings" ? "active" : ""} href="/dashboard/settings">
          <Settings size={17} /> Ayarlar
        </Link>
        <button disabled title="Yardım merkezi sonraki sürümde">
          <CircleHelp size={17} /> Yardım merkezi
        </button>
      </nav>

      <div className="dashboard-profile">
        <span className="profile-avatar">{user.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
        <div><strong>{user.name}</strong><small>{user.email}</small></div>
        <button onClick={onLogout} title="Çıkış yap" aria-label="Çıkış yap">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export function DashboardMobileHeader({ user }: { user: SessionUser }) {
  return (
    <header className="dashboard-mobile-header">
      <Link className="dashboard-brand" href="/dashboard">
        <span><QrCode size={17} /></span><strong>easy<i>qr</i></strong>
      </Link>
      <Link className="dashboard-mobile-avatar" href="/dashboard/settings" aria-label="Hesap ayarlarını aç">
        {user.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
      </Link>
    </header>
  );
}
