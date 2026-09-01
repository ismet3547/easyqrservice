"use client";

import { QrCode } from "lucide-react";
import type { CSSProperties } from "react";
import {
  allergenLabels,
  dietaryTagLabels,
  getVisibleMenu,
  type PublishedMenu,
} from "@/lib/menu";

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
  const visibleCategories = getVisibleMenu(menu).categories;
  const hasAllergenInfo = visibleCategories.some((category) =>
    category.items.some((item) => (item.allergens?.length || 0) > 0),
  );

  return (
    <div className={`menu-preview font-${theme.font} layout-${theme.layout} ${framed ? "is-framed" : ""}`} style={style}>
      <header className="menu-hero">
        <div className="menu-monogram">{menu.restaurantName.trim().charAt(0) || "M"}</div>
        <span className="menu-welcome">Hoş geldiniz</span>
        <h1>{menu.restaurantName || "İsimsiz menü"}</h1>
        {menu.subtitle && <p>{menu.subtitle}</p>}
        <div className="menu-meta"><span><i /> Şimdi açık</span><span>•</span><span>Servis 22:30’a kadar</span></div>
      </header>

      {visibleCategories.length > 0 && (
        <nav className="menu-categories" aria-label="Menü kategorileri">
          {visibleCategories.map((category, index) => (
            <a key={category.id} className={index === 0 ? "active" : ""} href={`#${category.id}`}>{category.name}</a>
          ))}
        </nav>
      )}

      <div className="menu-sections">
        {visibleCategories.length > 0 ? visibleCategories.map((category) => (
          <section id={category.id} key={category.id}>
            <div className="menu-section-heading"><h2>{category.name}</h2><span>{category.items.length} ürün</span></div>
            <div className="menu-items">
              {category.items.map((item) => {
                const soldOut = item.availability === "sold-out";
                return (
                  <article
                    className={`menu-item ${item.image ? "has-image" : ""} ${soldOut ? "is-sold-out" : ""}`}
                    aria-disabled={soldOut}
                    key={item.id}
                  >
                    {item.image && <div className="menu-item-image"><img src={item.image} alt={item.name || "Ürün görseli"} /></div>}
                    <div className="menu-item-copy">
                      <div className="menu-item-title">
                        <h3>{item.name || "İsimsiz ürün"}</h3>
                        {(soldOut || item.badge) && (
                          <div className="menu-item-badges">
                            {soldOut && <span className="sold-out-label">Tükendi</span>}
                            {item.badge && <span>{item.badge}</span>}
                          </div>
                        )}
                      </div>
                      {theme.showDescriptions && item.description && <p>{item.description}</p>}
                      {(item.dietaryTags?.length || 0) > 0 && (
                        <div className="menu-dietary-tags" aria-label="Beslenme etiketleri">
                          {item.dietaryTags?.map((tag) => (
                            <span className={`tag-${tag}`} key={tag}>{dietaryTagLabels[tag]}</span>
                          ))}
                        </div>
                      )}
                      {(item.allergens?.length || 0) > 0 && (
                        <div className="menu-item-allergens">
                          <strong>Alerjenler:</strong>
                          <span>{item.allergens?.map((allergen) => allergenLabels[allergen]).join(", ")}</span>
                        </div>
                      )}
                    </div>
                    <div className={`menu-price-area ${item.isCampaign && item.originalPrice ? "has-campaign" : ""}`}>
                      {item.isCampaign && item.originalPrice && <><span className="menu-campaign-label">Kampanya</span><del>{item.originalPrice}<small>{menu.currency}</small></del></>}
                      <strong className="menu-price">{item.price}<small>{menu.currency}</small></strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )) : (
          <div className="menu-empty-state">
            <span>Menü güncelleniyor</span>
            <h2>Şu anda gösterilecek ürün yok</h2>
            <p>Yeni ürünler hazır olduğunda burada görünecek.</p>
          </div>
        )}
      </div>

      {hasAllergenInfo && (
        <div className="menu-allergen-note">
          <strong>Alerjen bilgisi</strong>
          <span>Bilgiler işletme beyanıdır. Ciddi alerjiniz veya çapraz bulaşma hassasiyetiniz varsa sipariş vermeden önce ekibe danışın.</span>
        </div>
      )}
      <div className="menu-bottom-note"><span>Afiyet olsun</span><i>✦</i><span>Fiyatlara KDV dahildir</span></div>
    </div>
  );
}
