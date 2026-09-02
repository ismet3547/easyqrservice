"use client";

import {
  BookOpen,
  Check,
  Copy,
  Eye,
  FilePenLine,
  Plus,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import type { MenuStatus, StoredMenu } from "@/lib/menus";
import { DashboardMobileNav } from "@/components/DashboardMobileNav";
import { DashboardMobileHeader, DashboardSidebar } from "@/components/DashboardSidebar";

type Filter = "all" | MenuStatus;

export function MenusDashboard({ user, initialMenus }: { user: SessionUser; initialMenus: StoredMenu[] }) {
  const router = useRouter();
  const [menus, setMenus] = useState(initialMenus);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedId, setCopiedId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    return menus.filter((menu) =>
      (filter === "all" || menu.status === filter) &&
      (!normalizedQuery || menu.name.toLocaleLowerCase("tr-TR").includes(normalizedQuery)),
    );
  }, [filter, menus, query]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const copyLink = async (menu: StoredMenu) => {
    await navigator.clipboard.writeText(`${window.location.origin}/m/${menu.slug}`);
    setCopiedId(menu.id);
    window.setTimeout(() => setCopiedId(""), 1600);
  };

  const deleteMenu = async (menu: StoredMenu) => {
    if (!window.confirm(`“${menu.name}” menüsünü kalıcı olarak silmek istiyor musun?`)) return;
    setDeletingId(menu.id);
    try {
      const response = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
      if (response.ok) setMenus((current) => current.filter((item) => item.id !== menu.id));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="dashboard-shell">
      <DashboardSidebar active="menus" menuCount={menus.length} onLogout={() => void logout()} user={user} />

      <section className="dashboard-main menus-dashboard-main">
        <DashboardMobileHeader user={user} />

        <div className="dashboard-content menus-page-content">
          <div className="dashboard-heading">
            <div><span className="dashboard-kicker"><BookOpen size={14} /> Menü yönetimi</span><h1>Menülerim</h1><p>Taslaklarını düzenle, yayınlanan menülerini görüntüle ve bağlantılarını yönet.</p></div>
            <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> Yeni menü oluştur</Link>
          </div>

          <section className="menus-toolbar">
            <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Menü ara…" /></label>
            <div className="menus-filters">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Tümü <span>{menus.length}</span></button>
              <button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>Yayında <span>{menus.filter((menu) => menu.status === "published").length}</span></button>
              <button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>Taslak <span>{menus.filter((menu) => menu.status === "draft").length}</span></button>
            </div>
          </section>

          {filteredMenus.length === 0 ? (
            <section className="menus-page-empty">
              <div><QrCode size={32} /></div>
              <h2>{menus.length === 0 ? "Henüz menün yok" : "Eşleşen menü bulunamadı"}</h2>
              <p>{menus.length === 0 ? "İlk dijital menünü oluşturarak başlayabilirsin." : "Arama kelimesini veya filtreyi değiştirmeyi dene."}</p>
              {menus.length === 0 && <Link className="dashboard-primary" href="/studio?new=1"><Plus size={17} /> İlk menüyü oluştur</Link>}
            </section>
          ) : (
            <section className="menus-page-grid">
              {filteredMenus.map((storedMenu) => {
                const productCount = storedMenu.menu.categories.reduce((sum, category) => sum + category.items.length, 0);
                return (
                  <article className="menus-page-card" key={storedMenu.id}>
                    <div className="menus-card-cover" style={{ background: storedMenu.theme.background, color: storedMenu.theme.text }}>
                      <div className="menus-card-monogram" style={{ background: storedMenu.theme.accent }}>{storedMenu.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</div>
                      <span>Hoş geldiniz</span><strong>{storedMenu.name}</strong><small>{storedMenu.menu.subtitle || "Dijital menü"}</small>
                      <div className="menus-cover-lines"><i style={{ background: storedMenu.theme.accent }} /><i /><i /></div>
                    </div>
                    <div className="menus-card-body">
                      <div className="menus-card-heading"><div><h2>{storedMenu.name}</h2><p>{storedMenu.menu.categories.length} kategori · {productCount} ürün</p></div><span className={`status-badge ${storedMenu.status}`}><i /> {storedMenu.status === "published" ? "Yayında" : "Taslak"}</span></div>
                      <div className="menus-card-stats"><span><Eye size={14} /><strong>{storedMenu.viewCount}</strong> görüntülenme</span><span>Son güncelleme <strong>{new Date(storedMenu.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</strong></span></div>
                      <div className="menus-card-actions">
                        <Link className="edit" href={`/studio?menu=${storedMenu.id}`}><FilePenLine size={16} /> Düzenle</Link>
                        {storedMenu.status === "published" && <a href={`/m/${storedMenu.slug}`} target="_blank" rel="noreferrer"><Eye size={16} /> Aç</a>}
                        {storedMenu.status === "published" && <button onClick={() => void copyLink(storedMenu)}>{copiedId === storedMenu.id ? <Check size={16} /> : <Copy size={16} />}{copiedId === storedMenu.id ? "Kopyalandı" : "Bağlantı"}</button>}
                        <button className="danger" disabled={deletingId === storedMenu.id} onClick={() => void deleteMenu(storedMenu)} aria-label="Menüyü sil"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </section>
      <DashboardMobileNav active="menus" />
    </main>
  );
}
