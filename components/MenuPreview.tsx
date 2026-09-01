"use client";

import { QrCode } from "lucide-react";
import type { CSSProperties } from "react";
import type { PublishedMenu } from "@/lib/menu";

export function PublicMenu({ menu, theme }: PublishedMenu) {
  return (
    <main className="public-menu-shell" style={{ background: theme.background }}>
      <MenuPreview menu={menu} theme={theme} />
      <footer className="public-menu-footer">
        <div className="brand compact">
          <span className="brand-mark"><QrCode size={17} /></span>
          <strong>easy<span>qr</span></strong>
        </div>
        <span>ile hazırlandı</span>
      </footer>
    </main>
  );
}

export function MenuPreview({ menu, theme, framed = false }: PublishedMenu & { framed?: boolean }) {
  const style = {
    "--menu-accent": theme.accent,
    "--menu-bg": theme.background,
    "--menu-surface": theme.surface,
    "--menu-text": theme.text,
  } as CSSProperties;

  return (
    <div className={`menu-preview font-${theme.font} layout-${theme.layout} ${framed ? "is-framed" : ""}`} style={style}>
      <header className="menu-hero">
        <div className="menu-monogram">{menu.restaurantName.trim().charAt(0) || "M"}</div>
        <span className="menu-welcome">Hoş geldiniz</span>
        <h1>{menu.restaurantName || "İsimsiz menü"}</h1>
        {menu.subtitle && <p>{menu.subtitle}</p>}
        <div className="menu-meta"><span><i /> Şimdi açık</span><span>•</span><span>Servis 22:30’a kadar</span></div>
      </header>

      <nav className="menu-categories" aria-label="Menü kategorileri">
        {menu.categories.map((category, index) => (
          <a key={category.id} className={index === 0 ? "active" : ""} href={`#${category.id}`}>{category.name}</a>
        ))}
      </nav>

      <div className="menu-sections">
        {menu.categories.map((category) => (
          <section id={category.id} key={category.id}>
            <div className="menu-section-heading"><h2>{category.name}</h2><span>{category.items.length} ürün</span></div>
            <div className="menu-items">
              {category.items.map((item) => (
                <article className="menu-item" key={item.id}>
                  <div className="menu-item-copy">
                    <div className="menu-item-title">
                      <h3>{item.name || "İsimsiz ürün"}</h3>
                      {item.badge && <span>{item.badge}</span>}
                    </div>
                    {theme.showDescriptions && item.description && <p>{item.description}</p>}
                  </div>
                  <strong className="menu-price">{item.price}<small>{menu.currency}</small></strong>
                </article>
              ))}
              {category.items.length === 0 && <div className="empty-category">Bu kategoride henüz ürün yok.</div>}
            </div>
          </section>
        ))}
      </div>

      <div className="menu-bottom-note"><span>Afiyet olsun</span><i>✦</i><span>Fiyatlara KDV dahildir</span></div>
    </div>
  );
}
