"use client";

import { BarChart3, BookOpen, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { useAppLocale } from "@/components/LocaleProvider";

type DashboardSection = "overview" | "menus" | "analytics" | "settings";

export function DashboardMobileNav({ active }: { active: DashboardSection }) {
  const { locale } = useAppLocale();
  const copy = locale === "tr"
    ? { analytics: "Analitik", menus: "Menülerim", nav: "Mobil dashboard menüsü", overview: "Genel bakış", settings: "Ayarlar" }
    : { analytics: "Analytics", menus: "My menus", nav: "Mobile dashboard navigation", overview: "Overview", settings: "Settings" };
  return (
    <nav className="dashboard-mobile-nav" aria-label={copy.nav}>
      <Link aria-current={active === "overview" ? "page" : undefined} className={active === "overview" ? "active" : ""} href="/dashboard"><LayoutDashboard size={19} /><span>{copy.overview}</span></Link>
      <Link aria-current={active === "menus" ? "page" : undefined} className={active === "menus" ? "active" : ""} href="/dashboard/menus"><BookOpen size={19} /><span>{copy.menus}</span></Link>
      <Link aria-current={active === "analytics" ? "page" : undefined} className={active === "analytics" ? "active" : ""} href="/dashboard/analytics"><BarChart3 size={19} /><span>{copy.analytics}</span></Link>
      <Link aria-current={active === "settings" ? "page" : undefined} className={active === "settings" ? "active" : ""} href="/dashboard/settings"><Settings size={19} /><span>{copy.settings}</span></Link>
    </nav>
  );
}
