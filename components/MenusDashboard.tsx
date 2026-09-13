"use client";

import {
  BookOpen,
  Check,
  Copy,
  Eye,
  FilePenLine,
  Plus,
  QrCode,
  Rocket,
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
import { AccountAccessNotice } from "@/components/AccountAccessNotice";
import { useAppLocale } from "@/components/LocaleProvider";

type Filter = "all" | MenuStatus;

export function MenusDashboard({ user, initialMenus }: { user: SessionUser; initialMenus: StoredMenu[] }) {
  const router = useRouter();
  const { date, intlLocale, locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const [menus, setMenus] = useState(initialMenus);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [copiedId, setCopiedId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const filteredMenus = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(intlLocale);
    return menus.filter((menu) =>
      (filter === "all" || menu.status === filter) &&
      (!normalizedQuery || menu.name.toLocaleLowerCase(intlLocale).includes(normalizedQuery)),
    );
  }, [filter, intlLocale, menus, query]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
    router.refresh();
  };

  const copyLink = async (menu: StoredMenu) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/m/${menu.slug}`);
      setCopiedId(menu.id);
      setError("");
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setError(t(
        "Could not copy the link. Open the menu and copy it from the address bar.",
        "Bağlantı kopyalanamadı. Menüyü Aç düğmesiyle açıp adresini kopyalayabilirsin.",
      ));
    }
  };

  const deleteMenu = async (menu: StoredMenu) => {
    if (deletingId) return;
    if (!window.confirm(t(
      `Permanently delete the “${menu.name}” menu?`,
      `“${menu.name}” menüsünü kalıcı olarak silmek istiyor musun?`,
    ))) return;
    setDeletingId(menu.id);
    setError("");
    try {
      const response = await fetch(`/api/menus/${menu.id}`, { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || t("Could not delete the menu. Please try again.", "Menü silinemedi. Yeniden dene."));
      } else {
        setMenus((current) => current.filter((item) => item.id !== menu.id));
        router.refresh();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t("Could not delete the menu. Check your connection.", "Menü silinemedi. Bağlantını kontrol et."));
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
            <div><span className="dashboard-kicker"><BookOpen size={14} /> {t("Menu management", "Menü yönetimi")}</span><h1>{t("My menus", "Menülerim")}</h1><p>{t("Edit drafts, view published menus, and manage their links.", "Taslaklarını düzenle, yayınlanan menülerini görüntüle ve bağlantılarını yönet.")}</p></div>
            {user.account.canCreateMenu
              ? <Link className="dashboard-primary" href="/studio?new=1"><Plus size={18} /> {t("Create menu", "Yeni menü oluştur")}</Link>
              : <Link className="dashboard-primary secondary" href="/dashboard/settings">{t("View plan", "Planı görüntüle")}</Link>}
          </div>

          <AccountAccessNotice account={user.account} />
          {error && <p className="studio-save-error" role="alert">{error}</p>}

          <section className="menus-toolbar">
            <label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search menus…", "Menü ara…")} /></label>
            <div className="menus-filters">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{t("All", "Tümü")} <span>{number(menus.length)}</span></button>
              <button className={filter === "published" ? "active" : ""} onClick={() => setFilter("published")}>{t("Published", "Yayında")} <span>{number(menus.filter((menu) => menu.status === "published").length)}</span></button>
              <button className={filter === "draft" ? "active" : ""} onClick={() => setFilter("draft")}>{t("Draft", "Taslak")} <span>{number(menus.filter((menu) => menu.status === "draft").length)}</span></button>
            </div>
          </section>

          {filteredMenus.length === 0 ? (
            <section className="menus-page-empty">
              <div><QrCode size={32} /></div>
              <h2>{menus.length === 0 ? t("No menus yet", "Henüz menün yok") : t("No matching menus", "Eşleşen menü bulunamadı")}</h2>
              <p>{menus.length === 0 ? t("Create your first digital menu to get started.", "İlk dijital menünü oluşturarak başlayabilirsin.") : t("Try changing the search term or filter.", "Arama kelimesini veya filtreyi değiştirmeyi dene.")}</p>
              {menus.length === 0 && user.account.canCreateMenu && <Link className="dashboard-primary" href="/studio?new=1"><Plus size={17} /> {t("Create first menu", "İlk menüyü oluştur")}</Link>}
            </section>
          ) : (
            <section className="menus-page-grid">
              {filteredMenus.map((storedMenu) => {
                const productCount = storedMenu.menu.categories.reduce((sum, category) => sum + category.items.length, 0);
                const needsPublishing = storedMenu.status === "draft" || storedMenu.hasUnpublishedChanges;
                const publishActionAvailable = needsPublishing && user.account.canPublish;
                const studioHref = `/studio?menu=${storedMenu.id}${publishActionAvailable ? "&publish=1" : ""}`;
                return (
                  <article className="menus-page-card" key={storedMenu.id}>
                    <div className="menus-card-cover" style={{ background: storedMenu.theme.background, color: storedMenu.theme.text }}>
                      <div className="menus-card-monogram" style={{ background: storedMenu.theme.accent }}>{storedMenu.name.slice(0, 1).toLocaleUpperCase(intlLocale)}</div>
                      <span>{t("Welcome", "Hoş geldiniz")}</span><strong>{storedMenu.name}</strong><small>{storedMenu.menu.subtitle || t("Digital menu", "Dijital menü")}</small>
                      <div className="menus-cover-lines"><i style={{ background: storedMenu.theme.accent }} /><i /><i /></div>
                    </div>
                    <div className="menus-card-body">
                      <div className="menus-card-heading">
                        <div><h2>{storedMenu.name}</h2><p>{number(storedMenu.menu.categories.length)} {t("categories", "kategori")} · {number(productCount)} {t("items", "ürün")}</p></div>
                        <div className="menu-status-stack">
                          <span className={`status-badge ${storedMenu.status}`}><i /> {storedMenu.status === "published" ? t("Published", "Yayında") : t("Draft", "Taslak")}</span>
                          {storedMenu.hasUnpublishedChanges && <span className="status-badge update-pending"><i /> {t("Update pending", "Güncelleme bekliyor")}</span>}
                        </div>
                      </div>
                      <div className="menus-card-stats"><span><Eye size={14} /><strong>{number(storedMenu.viewCount)}</strong> {t("views", "görüntülenme")}</span><span>{t("Last updated", "Son güncelleme")} <strong>{date(storedMenu.updatedAt, { day: "numeric", month: "short", year: "numeric" })}</strong></span></div>
                      <div className="menus-card-actions">
                        <Link className={publishActionAvailable ? "edit publish-draft" : "edit"} href={studioHref}>
                          {publishActionAvailable ? <Rocket size={16} /> : <FilePenLine size={16} />}
                          {!user.account.canPublish
                            ? t("Edit", "Düzenle")
                            : storedMenu.status === "draft"
                            ? t("Edit and publish", "Düzenle ve yayınla")
                            : storedMenu.hasUnpublishedChanges
                              ? t("Publish update", "Güncellemeyi yayınla")
                              : t("Edit", "Düzenle")}
                        </Link>
                        {storedMenu.status === "published" && <Link className="qr" href={`/dashboard/menus/${storedMenu.id}/qr`}><QrCode size={16} /> {t("QR code", "QR kodu")}</Link>}
                        {storedMenu.status === "published" && <a href={`/m/${storedMenu.slug}`} target="_blank" rel="noreferrer"><Eye size={16} /> {t("Open", "Aç")}</a>}
                        {storedMenu.status === "published" && <button onClick={() => void copyLink(storedMenu)}>{copiedId === storedMenu.id ? <Check size={16} /> : <Copy size={16} />}{copiedId === storedMenu.id ? t("Copied", "Kopyalandı") : t("Link", "Bağlantı")}</button>}
                        <button className="danger" disabled={deletingId === storedMenu.id} onClick={() => void deleteMenu(storedMenu)} aria-label={t("Delete menu", "Menüyü sil")}><Trash2 size={16} /></button>
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
