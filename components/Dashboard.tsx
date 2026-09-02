"use client";

import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Eye,
  FilePenLine,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { StoredMenu } from "@/lib/menus";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";

export function Dashboard({ user, initialMenus }: { user: SessionUser; initialMenus: StoredMenu[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [copiedId, setCopiedId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const totalViews = menus.reduce((sum, menu) => sum + menu.viewCount, 0);
  const totalProducts = menus.reduce(
    (sum, storedMenu) =>
      sum + storedMenu.menu.categories.reduce((categorySum, category) => categorySum + category.items.length, 0),
    0,
  );
  const publishedCount = menus.filter((menu) => menu.status === "published").length;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const copyMenuLink = async (storedMenu: StoredMenu) => {
    await navigator.clipboard.writeText(`${window.location.origin}/m/${storedMenu.slug}`);
    setCopiedId(storedMenu.id);
    window.setTimeout(() => setCopiedId(""), 1600);
  };

  const deleteMenu = async (storedMenu: StoredMenu) => {
    const confirmed = window.confirm(`“${storedMenu.name}” menüsünü silmek istediğine emin misin?`);
    if (!confirmed) return;
    setDeletingId(storedMenu.id);
    try {
      const response = await fetch(`/api/menus/${storedMenu.id}`, { method: "DELETE" });
      if (response.ok) setMenus((current) => current.filter((menu) => menu.id !== storedMenu.id));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="overview" menuCount={menus.length} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content">
          <div className="dashboard-heading">
            <div>
              <span className="dashboard-kicker"><Sparkles size={14} /> Kontrol paneli</span>
              <h1>Hoş geldin, {user.name.split(" ")[0]}.</h1>
              <p>Menülerini yönet, performansını takip et ve yeni deneyimler oluştur.</p>
            </div>
            <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> Yeni menü oluştur</Link>
          </div>

          <div className="dashboard-stats">
            <article><div className="stat-icon orange"><BookOpen size={19} /></div><span>Toplam menü</span><strong>{menus.length}</strong><small>{publishedCount} tanesi yayında</small></article>
            <article><div className="stat-icon green"><QrCode size={19} /></div><span>Yayındaki menü</span><strong>{publishedCount}</strong><small><i /> Müşterilere açık</small></article>
            <article><div className="stat-icon purple"><ScanLine size={19} /></div><span>Toplam görüntülenme</span><strong>{totalViews.toLocaleString("tr-TR")}</strong><small><TrendingUp size={12} /> Canlı sayaç</small></article>
            <article><div className="stat-icon blue"><FilePenLine size={19} /></div><span>Toplam ürün</span><strong>{totalProducts}</strong><small>Tüm menülerde</small></article>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-menus" id="menuler">
              <div className="dashboard-section-heading">
                <div><span>İçerik</span><h2>Menülerim</h2></div>
                {menus.length > 0 && <Link href="/studio?new=1"><Plus size={15} /> Yeni ekle</Link>}
              </div>

              {menus.length === 0 ? (
                <div className="dashboard-empty">
                  <div className="empty-illustration"><QrCode size={34} /><Sparkles size={16} /></div>
                  <h3>İlk menünü oluşturalım</h3>
                  <p>Mevcut menünü yükle; yapay zekâ ürünleri, kategorileri ve fiyatları senin için ayırsın.</p>
                  <Link className="dashboard-primary" href="/studio?new=1"><Plus size={17} /> Menü oluştur</Link>
                </div>
              ) : (
                <div className="dashboard-menu-list">
                  {menus.map((storedMenu) => {
                    const productCount = storedMenu.menu.categories.reduce((sum, category) => sum + category.items.length, 0);
                    return (
                      <article className="dashboard-menu-card" key={storedMenu.id}>
                        <div className="menu-card-preview" style={{ background: storedMenu.theme.background, color: storedMenu.theme.text }}>
                          <span style={{ background: storedMenu.theme.accent }}>{storedMenu.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
                          <strong>{storedMenu.name}</strong>
                          <i style={{ background: storedMenu.theme.accent }} />
                          <i /><i />
                        </div>
                        <div className="menu-card-copy">
                          <div className="menu-card-title">
                            <div><h3>{storedMenu.name}</h3><span className={`status-badge ${storedMenu.status}`}><i /> {storedMenu.status === "published" ? "Yayında" : "Taslak"}</span></div>
                          </div>
                          <p>{storedMenu.menu.categories.length} kategori · {productCount} ürün</p>
                          <div className="menu-card-meta"><span><Eye size={13} /> {storedMenu.viewCount} görüntülenme</span><span>Güncellendi {new Date(storedMenu.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span></div>
                          <div className="menu-card-actions">
                            <Link href={`/studio?menu=${storedMenu.id}`}><FilePenLine size={15} /> Düzenle</Link>
                            {storedMenu.status === "published" && <a href={`/m/${storedMenu.slug}`} target="_blank" rel="noreferrer"><Eye size={15} /> Görüntüle</a>}
                            {storedMenu.status === "published" && <button onClick={() => void copyMenuLink(storedMenu)}>{copiedId === storedMenu.id ? <Check size={15} /> : <Copy size={15} />} {copiedId === storedMenu.id ? "Kopyalandı" : "Bağlantı"}</button>}
                            <button className="delete-menu-button" disabled={deletingId === storedMenu.id} onClick={() => void deleteMenu(storedMenu)}><Trash2 size={15} /></button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="dashboard-side-column">
              <section className="dashboard-progress-card">
                <div className="progress-card-top"><div className="stat-icon orange"><Sparkles size={18} /></div><span>{menus.length > 0 ? "Sıradaki adım" : "Hızlı başlangıç"}</span></div>
                <h3>{publishedCount > 0 ? "Menünü büyüt" : "QR menünü yayınla"}</h3>
                <p>{publishedCount > 0 ? "Menü bağlantını sosyal medya profilinde ve Google işletme sayfanda paylaş." : "Ürünlerini kontrol edip QR kodunu masalara yerleştir."}</p>
                <div className="progress-track"><i style={{ width: publishedCount > 0 ? "100%" : menus.length > 0 ? "66%" : "20%" }} /></div>
                <small>{publishedCount > 0 ? "Tamamlandı" : menus.length > 0 ? "2 / 3 adım" : "1 / 3 adım"}</small>
              </section>

              <section className="dashboard-tips">
                <div className="dashboard-section-heading"><div><span>İpuçları</span><h2>Daha iyi bir menü</h2></div></div>
                <Link href="/dashboard/menus"><span>01</span><div><strong>Fiyatlarını kontrol et</strong><small>AI çıktısını yayınlamadan önce gözden geçir.</small></div><ChevronRight size={15} /></Link>
                <Link href="/dashboard/menus"><span>02</span><div><strong>Kısa açıklamalar kullan</strong><small>İki satırı geçmeyen açıklamalar daha kolay okunur.</small></div><ChevronRight size={15} /></Link>
                <Link href="/dashboard/menus"><span>03</span><div><strong>QR kodunu test et</strong><small>Baskıdan önce farklı telefonlarla okut.</small></div><ChevronRight size={15} /></Link>
              </section>
            </aside>
          </div>
        </div>
      </section>
      <DashboardMobileNav active="overview" />
    </main>
  );
}
