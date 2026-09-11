import { BarChart3, BookOpen, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";

type DashboardSection = "overview" | "menus" | "analytics" | "settings";

export function DashboardMobileNav({ active }: { active: DashboardSection }) {
  return (
    <nav className="dashboard-mobile-nav" aria-label="Mobil dashboard menüsü">
      <Link aria-current={active === "overview" ? "page" : undefined} className={active === "overview" ? "active" : ""} href="/dashboard"><LayoutDashboard size={19} /><span>Genel bakış</span></Link>
      <Link aria-current={active === "menus" ? "page" : undefined} className={active === "menus" ? "active" : ""} href="/dashboard/menus"><BookOpen size={19} /><span>Menülerim</span></Link>
      <Link aria-current={active === "analytics" ? "page" : undefined} className={active === "analytics" ? "active" : ""} href="/dashboard/analytics"><BarChart3 size={19} /><span>Analitik</span></Link>
      <Link aria-current={active === "settings" ? "page" : undefined} className={active === "settings" ? "active" : ""} href="/dashboard/settings"><Settings size={19} /><span>Ayarlar</span></Link>
    </nav>
  );
}
