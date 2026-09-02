"use client";

import { QrCode } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import {
  allergenLabels,
  allergenLabelsEn,
  dietaryTagLabels,
  dietaryTagLabelsEn,
  getVisibleMenu,
  hasEnglishMenuTranslation,
  type MenuLanguage,
  type PublishedMenu,
} from "@/lib/menu";

type PublicMenuProps = PublishedMenu & {
  initialLanguage?: MenuLanguage;
};

type MenuPreviewProps = PublishedMenu & {
  framed?: boolean;
  initialLanguage?: MenuLanguage;
};

const languagePreferenceKey = "easyqr-menu-language";

const interfaceText = {
  tr: {
    welcome: "Hoş geldiniz",
    unnamedMenu: "İsimsiz menü",
    openNow: "Şimdi açık",
    serviceUntil: "Servis 22:30’a kadar",
    categoryNavigation: "Menü kategorileri",
    product: "ürün",
    products: "ürün",
    productImage: "Ürün görseli",
    unnamedProduct: "İsimsiz ürün",
    soldOut: "Tükendi",
    dietaryLabels: "Beslenme etiketleri",
    allergens: "Alerjenler:",
    campaign: "Kampanya",
    updating: "Menü güncelleniyor",
    noProducts: "Şu anda gösterilecek ürün yok",
    noProductsDescription: "Yeni ürünler hazır olduğunda burada görünecek.",
    allergenTitle: "Alerjen bilgisi",
    allergenNotice: "Bilgiler işletme beyanıdır. Ciddi alerjiniz veya çapraz bulaşma hassasiyetiniz varsa sipariş vermeden önce ekibe danışın.",
    enjoy: "Afiyet olsun",
    vatIncluded: "Fiyatlara KDV dahildir",
    language: "Menü dili",
  },
  en: {
    welcome: "Welcome",
    unnamedMenu: "Untitled menu",
    openNow: "Open now",
    serviceUntil: "Service until 10:30 PM",
    categoryNavigation: "Menu categories",
    product: "item",
    products: "items",
    productImage: "Product image",
    unnamedProduct: "Unnamed item",
    soldOut: "Sold out",
    dietaryLabels: "Dietary labels",
    allergens: "Allergens:",
    campaign: "Special offer",
    updating: "Menu being updated",
    noProducts: "There are no items to show right now",
    noProductsDescription: "New items will appear here when they are ready.",
    allergenTitle: "Allergen information",
    allergenNotice: "Information is provided by the venue. If you have a serious allergy or cross-contact sensitivity, please ask the team before ordering.",
    enjoy: "Enjoy your meal",
    vatIncluded: "Prices include VAT",
    language: "Menu language",
  },
} as const;

function localizedText(source: string, translated: string | undefined, language: MenuLanguage) {
  return language === "en" && typeof translated === "string" ? translated : source;
}

export function PublicMenu({ menu, theme, initialLanguage = "tr" }: PublicMenuProps) {
  return (
    <main className="public-menu-shell" style={{ background: theme.background }}>
      <MenuPreview menu={menu} theme={theme} initialLanguage={initialLanguage} />
      <footer className="public-menu-footer">
        <div className="brand compact">
          <span className="brand-mark"><QrCode size={17} /></span>
          <strong>easy<span>qr</span></strong>
        </div>
        <span>QR menu by</span>
      </footer>
    </main>
  );
}

export function MenuPreview({ menu, theme, framed = false, initialLanguage = "tr" }: MenuPreviewProps) {
  const canUseEnglish = hasEnglishMenuTranslation(menu);
  const [language, setLanguage] = useState<MenuLanguage>(
    initialLanguage === "en" && canUseEnglish ? "en" : "tr",
  );

  useEffect(() => {
    if (framed || !canUseEnglish) return;
    const savedLanguage = window.localStorage.getItem(languagePreferenceKey);
    if (savedLanguage === "tr" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, [canUseEnglish, framed]);

  const activeLanguage: MenuLanguage = language === "en" && canUseEnglish ? "en" : "tr";
  const copy = interfaceText[activeLanguage];
  const menuTranslation = menu.translations?.en;
  const restaurantName = localizedText(
    menu.restaurantName,
    menuTranslation?.restaurantName,
    activeLanguage,
  );
  const subtitle = localizedText(menu.subtitle, menuTranslation?.subtitle, activeLanguage);
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
  const dietaryLabels = activeLanguage === "en" ? dietaryTagLabelsEn : dietaryTagLabels;
  const currentAllergenLabels = activeLanguage === "en" ? allergenLabelsEn : allergenLabels;

  const changeLanguage = (nextLanguage: MenuLanguage) => {
    setLanguage(nextLanguage);
    if (!framed) window.localStorage.setItem(languagePreferenceKey, nextLanguage);
  };

  return (
    <div
      className={`menu-preview font-${theme.font} layout-${theme.layout} ${framed ? "is-framed" : ""}`}
      lang={activeLanguage}
      style={style}
    >
      <header className="menu-hero">
        {canUseEnglish && (
          <div className="menu-language-switch" role="group" aria-label={copy.language}>
            <button
              className={activeLanguage === "tr" ? "active" : ""}
              aria-label="Türkçe"
              aria-pressed={activeLanguage === "tr"}
              onClick={() => changeLanguage("tr")}
              type="button"
            >TR</button>
            <button
              className={activeLanguage === "en" ? "active" : ""}
              aria-label="English"
              aria-pressed={activeLanguage === "en"}
              onClick={() => changeLanguage("en")}
              type="button"
            >EN</button>
          </div>
        )}
        <div className="menu-monogram">{restaurantName.trim().charAt(0) || "M"}</div>
        <span className="menu-welcome">{copy.welcome}</span>
        <h1>{restaurantName || copy.unnamedMenu}</h1>
        {subtitle && <p>{subtitle}</p>}
        <div className="menu-meta"><span><i /> {copy.openNow}</span><span>•</span><span>{copy.serviceUntil}</span></div>
      </header>

      {visibleCategories.length > 0 && (
        <nav className="menu-categories" aria-label={copy.categoryNavigation}>
          {visibleCategories.map((category, index) => {
            const categoryName = localizedText(
              category.name,
              category.translations?.en?.name,
              activeLanguage,
            );
            return (
              <a key={category.id} className={index === 0 ? "active" : ""} href={`#${category.id}`}>{categoryName}</a>
            );
          })}
        </nav>
      )}

      <div className="menu-sections">
        {visibleCategories.length > 0 ? visibleCategories.map((category) => {
          const categoryName = localizedText(
            category.name,
            category.translations?.en?.name,
            activeLanguage,
          );
          const productLabel = activeLanguage === "en" && category.items.length === 1
            ? copy.product
            : copy.products;
          return (
            <section id={category.id} key={category.id}>
              <div className="menu-section-heading"><h2>{categoryName}</h2><span>{category.items.length} {productLabel}</span></div>
              <div className="menu-items">
                {category.items.map((item) => {
                  const soldOut = item.availability === "sold-out";
                  const itemTranslation = item.translations?.en;
                  const itemName = localizedText(item.name, itemTranslation?.name, activeLanguage);
                  const description = localizedText(item.description, itemTranslation?.description, activeLanguage);
                  const badge = localizedText(item.badge, itemTranslation?.badge, activeLanguage);
                  return (
                    <article
                      className={`menu-item ${item.image ? "has-image" : ""} ${soldOut ? "is-sold-out" : ""}`}
                      aria-disabled={soldOut}
                      key={item.id}
                    >
                      {item.image && <div className="menu-item-image"><img src={item.image} alt={itemName || copy.productImage} /></div>}
                      <div className="menu-item-copy">
                        <div className="menu-item-title">
                          <h3>{itemName || copy.unnamedProduct}</h3>
                          {(soldOut || badge) && (
                            <div className="menu-item-badges">
                              {soldOut && <span className="sold-out-label">{copy.soldOut}</span>}
                              {badge && <span>{badge}</span>}
                            </div>
                          )}
                        </div>
                        {theme.showDescriptions && description && <p>{description}</p>}
                        {(item.dietaryTags?.length || 0) > 0 && (
                          <div className="menu-dietary-tags" aria-label={copy.dietaryLabels}>
                            {item.dietaryTags?.map((tag) => (
                              <span className={`tag-${tag}`} key={tag}>{dietaryLabels[tag]}</span>
                            ))}
                          </div>
                        )}
                        {(item.allergens?.length || 0) > 0 && (
                          <div className="menu-item-allergens">
                            <strong>{copy.allergens}</strong>
                            <span>{item.allergens?.map((allergen) => currentAllergenLabels[allergen]).join(", ")}</span>
                          </div>
                        )}
                      </div>
                      <div className={`menu-price-area ${item.isCampaign && item.originalPrice ? "has-campaign" : ""}`}>
                        {item.isCampaign && item.originalPrice && <><span className="menu-campaign-label">{copy.campaign}</span><del>{item.originalPrice}<small>{menu.currency}</small></del></>}
                        <strong className="menu-price">{item.price}<small>{menu.currency}</small></strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }) : (
          <div className="menu-empty-state">
            <span>{copy.updating}</span>
            <h2>{copy.noProducts}</h2>
            <p>{copy.noProductsDescription}</p>
          </div>
        )}
      </div>

      {hasAllergenInfo && (
        <div className="menu-allergen-note">
          <strong>{copy.allergenTitle}</strong>
          <span>{copy.allergenNotice}</span>
        </div>
      )}
      <div className="menu-bottom-note"><span>{copy.enjoy}</span><i>✦</i><span>{copy.vatIncluded}</span></div>
    </div>
  );
}
