"use client";

import { QrCode, Search, ShieldAlert, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import {
  allergenLabels,
  allergenLabelsEn,
  dietaryTagLabels,
  dietaryTagLabelsEn,
  getVisibleMenu,
  hasEnglishMenuTranslation,
  menuAllergens,
  menuDietaryTags,
  type MenuAllergen,
  type MenuDietaryTag,
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
    searchLabel: "Menüde ara",
    searchPlaceholder: "Ürün, kategori veya içerik ara",
    clearSearch: "Aramayı temizle",
    filters: "Menü filtreleri",
    hideAllergens: "Alerjenleri gizle",
    allergenSelection: "İçeren ürünleri gizle",
    allergenFilterHint: "Yalnızca işletmenin işaretlediği alerjen bilgilerine göre filtrelenir.",
    clearFilters: "Temizle",
    noSearchResults: "Eşleşen ürün bulunamadı",
    noSearchResultsDescription: "Arama kelimesini veya seçtiğin filtreleri değiştirmeyi dene.",
    resetSearch: "Arama ve filtreleri temizle",
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
    searchLabel: "Search this menu",
    searchPlaceholder: "Search items, categories or ingredients",
    clearSearch: "Clear search",
    filters: "Menu filters",
    hideAllergens: "Hide allergens",
    allergenSelection: "Hide items containing",
    allergenFilterHint: "Filtering uses only the allergen information declared by the venue.",
    clearFilters: "Clear",
    noSearchResults: "No matching items found",
    noSearchResultsDescription: "Try changing your search or selected filters.",
    resetSearch: "Clear search and filters",
  },
} as const;

function localizedText(source: string, translated: string | undefined, language: MenuLanguage) {
  return language === "en" && typeof translated === "string" ? translated : source;
}

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState<MenuDietaryTag[]>([]);
  const [excludedAllergens, setExcludedAllergens] = useState<MenuAllergen[]>([]);

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
  const normalizedQuery = normalizeSearchText(searchQuery);
  const queryTokens = normalizedQuery ? normalizedQuery.split(" ") : [];
  const totalItemCount = visibleCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const availableDietaryTags = menuDietaryTags.filter((tag) =>
    visibleCategories.some((category) =>
      category.items.some((item) => item.dietaryTags?.includes(tag)),
    ),
  );
  const availableAllergens = menuAllergens.filter((allergen) =>
    visibleCategories.some((category) =>
      category.items.some((item) => item.allergens?.includes(allergen)),
    ),
  );
  const filteredCategories = visibleCategories
    .map((category) => {
      const categoryName = localizedText(
        category.name,
        category.translations?.en?.name,
        activeLanguage,
      );
      return {
        ...category,
        items: category.items.filter((item) => {
          const itemTranslation = item.translations?.en;
          const searchableText = normalizeSearchText([
            category.name,
            category.translations?.en?.name || "",
            item.name,
            itemTranslation?.name || "",
            item.description,
            itemTranslation?.description || "",
            item.badge,
            itemTranslation?.badge || "",
            item.price,
            item.originalPrice || "",
            item.isCampaign ? copy.campaign : "",
            item.availability === "sold-out" ? copy.soldOut : "",
            ...(item.dietaryTags || []).flatMap((tag) => [
              dietaryTagLabels[tag],
              dietaryTagLabelsEn[tag],
            ]),
            ...(item.allergens || []).flatMap((allergen) => [
              allergenLabels[allergen],
              allergenLabelsEn[allergen],
            ]),
          ].join(" "));
          const matchesQuery = queryTokens.every((token) => searchableText.includes(token));
          const matchesDietaryFilters = dietaryFilters.every((tag) =>
            item.dietaryTags?.includes(tag),
          );
          const containsExcludedAllergen = (item.allergens || []).some((allergen) =>
            excludedAllergens.includes(allergen),
          );
          return matchesQuery && matchesDietaryFilters && !containsExcludedAllergen;
        }),
        localizedName: categoryName,
      };
    })
    .filter((category) => category.items.length > 0);
  const filteredItemCount = filteredCategories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const hasActiveDiscovery = Boolean(
    normalizedQuery || dietaryFilters.length || excludedAllergens.length,
  );

  const changeLanguage = (nextLanguage: MenuLanguage) => {
    setLanguage(nextLanguage);
    if (!framed) window.localStorage.setItem(languagePreferenceKey, nextLanguage);
  };

  const toggleDietaryFilter = (tag: MenuDietaryTag) => {
    setDietaryFilters((current) => {
      if (current.includes(tag)) return current.filter((currentTag) => currentTag !== tag);
      const withoutConflictingDiet = tag === "vegan"
        ? current.filter((currentTag) => currentTag !== "vegetarian")
        : tag === "vegetarian"
          ? current.filter((currentTag) => currentTag !== "vegan")
          : current;
      return [...withoutConflictingDiet, tag];
    });
  };

  const toggleExcludedAllergen = (allergen: MenuAllergen) => {
    setExcludedAllergens((current) =>
      current.includes(allergen)
        ? current.filter((currentAllergen) => currentAllergen !== allergen)
        : [...current, allergen],
    );
  };

  const resetDiscovery = () => {
    setSearchQuery("");
    setDietaryFilters([]);
    setExcludedAllergens([]);
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
        <section className="menu-discovery" aria-label={copy.filters}>
          <div className="menu-search-box">
            <Search aria-hidden="true" size={16} />
            <input
              aria-label={copy.searchLabel}
              autoComplete="off"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              spellCheck="false"
              type="search"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                aria-label={copy.clearSearch}
                className="menu-search-clear"
                onClick={() => setSearchQuery("")}
                type="button"
              ><X size={14} /></button>
            )}
          </div>

          {(availableDietaryTags.length > 0 || availableAllergens.length > 0) && (
            <div className="menu-filter-tools">
              {availableDietaryTags.map((tag) => (
                <button
                  aria-pressed={dietaryFilters.includes(tag)}
                  className={`menu-filter-chip tag-${tag} ${dietaryFilters.includes(tag) ? "active" : ""}`}
                  key={tag}
                  onClick={() => toggleDietaryFilter(tag)}
                  type="button"
                >{dietaryLabels[tag]}</button>
              ))}

              {availableAllergens.length > 0 && (
                <details className="allergen-filter">
                  <summary>
                    <ShieldAlert aria-hidden="true" size={14} />
                    <span>{copy.hideAllergens}</span>
                    {excludedAllergens.length > 0 && <b>{excludedAllergens.length}</b>}
                  </summary>
                  <div className="allergen-filter-panel">
                    <div className="allergen-filter-heading">
                      <strong>{copy.allergenSelection}</strong>
                      <small>{copy.allergenFilterHint}</small>
                    </div>
                    <div className="allergen-filter-grid" role="group" aria-label={copy.hideAllergens}>
                      {availableAllergens.map((allergen) => (
                        <label key={allergen}>
                          <input
                            checked={excludedAllergens.includes(allergen)}
                            onChange={() => toggleExcludedAllergen(allergen)}
                            type="checkbox"
                          />
                          <span>{currentAllergenLabels[allergen]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </details>
              )}
            </div>
          )}

          <div className="menu-filter-summary" aria-live="polite">
            <span>
              {activeLanguage === "en"
                ? `${filteredItemCount} of ${totalItemCount} ${totalItemCount === 1 ? copy.product : copy.products} shown`
                : `${totalItemCount} üründen ${filteredItemCount} tanesi gösteriliyor`}
            </span>
            {hasActiveDiscovery && (
              <button onClick={resetDiscovery} type="button">{copy.clearFilters}</button>
            )}
          </div>
        </section>
      )}

      {filteredCategories.length > 0 && (
        <nav className="menu-categories" aria-label={copy.categoryNavigation}>
          {filteredCategories.map((category, index) => (
            <a key={category.id} className={index === 0 ? "active" : ""} href={`#${category.id}`}>{category.localizedName}</a>
          ))}
        </nav>
      )}

      <div className="menu-sections">
        {visibleCategories.length === 0 ? (
          <div className="menu-empty-state">
            <span>{copy.updating}</span>
            <h2>{copy.noProducts}</h2>
            <p>{copy.noProductsDescription}</p>
          </div>
        ) : filteredCategories.length > 0 ? filteredCategories.map((category) => {
          const productLabel = activeLanguage === "en" && category.items.length === 1
            ? copy.product
            : copy.products;
          return (
            <section id={category.id} key={category.id}>
              <div className="menu-section-heading"><h2>{category.localizedName}</h2><span>{category.items.length} {productLabel}</span></div>
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
          <div className="menu-empty-state menu-search-empty">
            <span>{copy.searchLabel}</span>
            <h2>{copy.noSearchResults}</h2>
            <p>{copy.noSearchResultsDescription}</p>
            <button className="menu-empty-reset" onClick={resetDiscovery} type="button">
              {copy.resetSearch}
            </button>
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
