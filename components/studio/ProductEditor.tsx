"use client";

import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  ImageOff,
  ImagePlus,
  Leaf,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  allergenLabels,
  allergenLabelsEn,
  dietaryTagLabels,
  dietaryTagLabelsEn,
  formatMenuPrice,
  isMenuCurrencyPrefix,
  menuAllergens,
  menuDietaryTags,
  type MenuAllergen,
  type MenuDietaryTag,
  type MenuItem,
} from "@/lib/menu";
import { useAppLocale } from "@/components/LocaleProvider";

type EditableProductField =
  | "availability"
  | "badge"
  | "description"
  | "image"
  | "isCampaign"
  | "name"
  | "originalPrice"
  | "price";

export function ProductListItem({
  currency,
  item,
  onOpen,
  sourceLanguage,
}: {
  currency: string;
  item: MenuItem;
  onOpen: () => void;
  sourceLanguage: string;
}) {
  const { locale } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const status = item.availability === "sold-out"
    ? t("Sold out", "Tükendi")
    : item.availability === "hidden"
      ? t("Hidden", "Gizli")
      : t("Available", "Satışta");
  const details = [status, item.isCampaign ? t("Promotion", "Kampanya") : "", item.badge]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      aria-label={t(`Edit ${item.name || "unnamed item"}`, `${item.name || "İsimsiz ürün"} ürününü düzenle`)}
      className={`product-list-item availability-${item.availability || "available"}`}
      id={`studio-item-${item.id}`}
      onClick={onOpen}
      type="button"
    >
      <span className={`item-editor-summary-image ${item.image ? "has-image" : ""}`}>
        {item.image
          ? <img src={item.image} alt="" />
          : <ImagePlus aria-hidden="true" size={18} />}
      </span>
      <span className="product-list-item-copy">
        <strong>{item.name || t("Unnamed item", "İsimsiz ürün")}</strong>
        <small>{details}</small>
      </span>
      <span className="product-list-item-price">
        {item.isCampaign && item.originalPrice && <del>{formatMenuPrice(item.originalPrice, currency, sourceLanguage)}</del>}
        <strong>{formatMenuPrice(item.price || "0", currency, sourceLanguage)}</strong>
      </span>
      <span className="product-list-item-action">{t("Edit", "Düzenle")} <ArrowRight size={14} /></span>
    </button>
  );
}

export function ProductDetailEditor({
  categoryName,
  currency,
  generatingImages,
  generatingItemId,
  hasNext,
  hasPrevious,
  item,
  onBack,
  onDelete,
  onGenerateImage,
  onImageChange,
  onNext,
  onPrevious,
  onToggleAllergen,
  onToggleDietaryTag,
  onUpdate,
  position,
  sourceLanguage,
  total,
}: {
  categoryName: string;
  currency: string;
  generatingImages: boolean;
  generatingItemId: string;
  hasNext: boolean;
  hasPrevious: boolean;
  item: MenuItem;
  onBack: () => void;
  onDelete: () => void;
  onGenerateImage: () => void;
  onImageChange: (file?: File) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleAllergen: (allergen: MenuAllergen) => void;
  onToggleDietaryTag: (tag: MenuDietaryTag) => void;
  onUpdate: (key: EditableProductField, value: string | boolean) => void;
  position: number;
  sourceLanguage: string;
  total: number;
}) {
  const { locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const currencyBeforeAmount = isMenuCurrencyPrefix(currency, sourceLanguage);
  const availability = item.availability || "available";
  const selectedDietaryCount = (item.dietaryTags?.length || 0) + (item.allergens?.length || 0);

  return (
    <div className="product-focus-shell" id={`studio-item-${item.id}`}>
      <div className="product-focus-toolbar">
        <button className="product-focus-back" onClick={onBack} type="button">
          <ArrowLeft size={15} /> {t("Item list", "Ürün listesi")}
        </button>
        <span>{categoryName || t("Unnamed category", "İsimsiz kategori")} · {number(position)}/{number(total)}</span>
        <div className="product-focus-navigation" aria-label={t("Navigate between items", "Ürünler arasında geçiş")}>
          <button aria-label={t("Previous item", "Önceki ürün")} disabled={!hasPrevious} onClick={onPrevious} type="button">
            <ChevronLeft size={17} />
          </button>
          <button aria-label={t("Next item", "Sonraki ürün")} disabled={!hasNext} onClick={onNext} type="button">
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <article className={`item-editor product-focus-card availability-${availability}`}>
        <div className="product-focus-heading">
          <span className={`product-focus-image ${item.image ? "has-image" : ""}`}>
            {item.image
              ? <img src={item.image} alt="" />
              : <ImagePlus aria-hidden="true" size={22} />}
          </span>
          <div>
            <span>{t("Edit item", "Ürün düzenleme")}</span>
            <h3>{item.name || t("Unnamed item", "İsimsiz ürün")}</h3>
            <small>{t("Essential details are at the top, optional details below.", "Temel bilgiler üstte, isteğe bağlı ayrıntılar aşağıda.")}</small>
          </div>
        </div>

        <div className="item-editor-body product-focus-body">
          <div className="product-focus-main-fields">
            <label className="field-label">
              {t("Item name", "Ürün adı")}
              <input
                autoFocus
                className="item-name-input"
                data-readiness-field="item-name" maxLength={180}
                value={item.name}
                onChange={(event) => onUpdate("name", event.target.value)}
              />
            </label>
            <label className="field-label">
              {item.isCampaign ? t("Promotional price", "Kampanyalı fiyat") : t("Price", "Fiyat")}
              <span className="price-input product-focus-price">
                {currencyBeforeAmount && <span>{currency}</span>}
                <input
                  aria-label={item.isCampaign ? t("Promotional price", "Kampanyalı fiyat") : t("Price", "Fiyat")}
                  data-readiness-field="item-price" maxLength={40}
                  inputMode="decimal"
                  value={item.price}
                  onChange={(event) => onUpdate("price", event.target.value)}
                />
                {!currencyBeforeAmount && <span>{currency}</span>}
              </span>
            </label>
          </div>

          <label className="field-label product-focus-description">
            {t("Description", "Açıklama")}
            <textarea
              data-readiness-field="item-description" maxLength={1000}
              placeholder={t("Describe the item clearly and concisely.", "Ürünün içeriğini kısa ve anlaşılır biçimde yaz.")}
              rows={3}
              value={item.description}
              onChange={(event) => onUpdate("description", event.target.value)}
            />
          </label>

          <div className="item-image-editor">
            <label className={item.image ? "has-image" : ""}>
              {item.image ? <img src={item.image} alt="" /> : <ImagePlus size={18} />}
              <span>
                <strong>{item.image ? t("Change image", "Görseli değiştir") : t("Add item image", "Ürün görseli ekle")}</strong>
                <small>{t("JPG, PNG, or WEBP · resized automatically", "JPG, PNG veya WEBP · otomatik küçültülür")}</small>
              </span>
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  onImageChange(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            <div className="item-image-actions" data-readiness-field="item-image">
              <button
                className="item-ai-image-button"
                disabled={generatingImages || Boolean(generatingItemId)}
                aria-label={(item.image ? t("Refresh image with AI: ", "AI ile görseli yenile: ") : t("Generate image with AI: ", "AI ile görsel oluştur: ")) + (item.name || t("item", "ürün"))}
                onClick={onGenerateImage}
                type="button"
              >
                {generatingItemId === item.id
                  ? <Loader2 className="auto-image-spinner" size={14} />
                  : <Sparkles size={14} />}
                {generatingItemId === item.id ? t("Generating", "Üretiliyor") : item.image ? t("Refresh with AI", "AI ile yenile") : t("Generate with AI", "AI oluştur")}
              </button>
              {item.image && (
                <button
                  className="item-remove-image-button"
                  aria-label={t("Remove item image", "Ürün görselini kaldır")}
                  onClick={() => onUpdate("image", "")}
                  type="button"
                >
                  <ImageOff size={14} /> {t("Remove", "Kaldır")}
                </button>
              )}
            </div>
          </div>

          <div className="item-availability">
            <div className="item-availability-copy">
              <strong>{t("Item status", "Ürün durumu")}</strong>
              <small>
                {availability === "sold-out"
                  ? t("Visible on the menu with a Sold out label.", "Menüde görünür ve Tükendi etiketi taşır.")
                  : availability === "hidden"
                    ? t("Hidden from the guest menu and category count.", "Müşteri menüsünde ve kategori sayısında görünmez.")
                    : t("Guests can view this item normally.", "Müşteriler ürünü normal şekilde görür.")}
              </small>
            </div>
            <div className="availability-options" role="group" aria-label={t(`${item.name || "Item"} menu status`, `${item.name || "Ürün"} menü durumu`)}>
              <button
                className={`availability-option available ${availability === "available" ? "active" : ""}`}
                aria-pressed={availability === "available"}
                onClick={() => onUpdate("availability", "available")}
                type="button"
              >
                <Check size={13} /> {t("Available", "Satışta")}
              </button>
              <button
                className={`availability-option sold-out ${availability === "sold-out" ? "active" : ""}`}
                aria-pressed={availability === "sold-out"}
                onClick={() => onUpdate("availability", "sold-out")}
                type="button"
              >
                <X size={13} /> {t("Sold out", "Tükendi")}
              </button>
              <button
                className={`availability-option hidden ${availability === "hidden" ? "active" : ""}`}
                aria-pressed={availability === "hidden"}
                onClick={() => onUpdate("availability", "hidden")}
                type="button"
              >
                <EyeOff size={13} /> {t("Hidden", "Gizli")}
              </button>
            </div>
          </div>

          <div className="product-optional-fields">
            <label className="field-label">
              {t("Short label", "Kısa etiket")} <small>{t("Optional", "İsteğe bağlı")}</small>
              <input
                className="badge-input" maxLength={40}
                placeholder={t("e.g. New or Favorite", "Örn. Yeni veya Favori")}
                value={item.badge}
                onChange={(event) => onUpdate("badge", event.target.value)}
              />
            </label>
            <button
              className={`campaign-toggle ${item.isCampaign ? "active" : ""}`}
              aria-pressed={Boolean(item.isCampaign)}
              onClick={() => onUpdate("isCampaign", !item.isCampaign)}
              type="button"
            >
              <BadgePercent size={14} /> {item.isCampaign ? t("On promotion", "Kampanyalı") : t("Add promotion", "Kampanya ekle")}
            </button>
          </div>

          {item.isCampaign && (
            <div className="campaign-editor">
              <BadgePercent size={16} />
              <label>
                <span>{t("Original price", "Eski fiyat")}</span>
                <span className="price-input">
                  {currencyBeforeAmount && <span>{currency}</span>}
                  <input
                    aria-label={t("Price before promotion", "Kampanya öncesi fiyat")}
                    data-readiness-field="campaign-price" maxLength={40}
                    inputMode="decimal"
                    placeholder={locale === "tr" ? "475" : "19"}
                    value={item.originalPrice || ""}
                    onChange={(event) => onUpdate("originalPrice", event.target.value)}
                  />
                  {!currencyBeforeAmount && <span>{currency}</span>}
                </span>
              </label>
              <p>{t("The menu shows", "Menüde")} <del>{formatMenuPrice(item.originalPrice || (locale === "tr" ? "475" : "19"), currency, sourceLanguage)}</del> {t("as", "yerine")} <strong>{formatMenuPrice(item.price || (locale === "tr" ? "400" : "16"), currency, sourceLanguage)}</strong>{locale === "tr" ? " gösterilir." : "."}</p>
            </div>
          )}

          <details className="item-dietary-editor">
            <summary>
              <Leaf size={16} />
              <span className="item-dietary-summary-copy">
                <strong>{t("Dietary details and allergens", "Beslenme ve alerjenler")}</strong>
                <small>{t("Add only when relevant", "Yalnızca gerekiyorsa ekle")}</small>
              </span>
              <b>{selectedDietaryCount}</b>
              <ChevronDown className="dietary-chevron" size={15} />
            </summary>
            <div className="item-dietary-body">
              <div className="item-dietary-group">
                <span>{t("Dietary labels", "Beslenme etiketleri")}</span>
                <div className="item-dietary-options">
                  {menuDietaryTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`dietary-choice ${tag} ${item.dietaryTags?.includes(tag) ? "active" : ""}`}
                      aria-pressed={item.dietaryTags?.includes(tag) || false}
                      onClick={() => onToggleDietaryTag(tag)}
                    >
                      {(locale === "tr" ? dietaryTagLabels : dietaryTagLabelsEn)[tag]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="item-dietary-group">
                <span>{t("Allergens", "Alerjenler")}</span>
                <div className="item-dietary-options">
                  {menuAllergens.map((allergen) => (
                    <button
                      type="button"
                      key={allergen}
                      className={`allergen-choice ${item.allergens?.includes(allergen) ? "active" : ""}`}
                      aria-pressed={item.allergens?.includes(allergen) || false}
                      onClick={() => onToggleAllergen(allergen)}
                    >
                      {(locale === "tr" ? allergenLabels : allergenLabelsEn)[allergen]}
                    </button>
                  ))}
                </div>
              </div>
              <p className="item-allergen-caution">
                {t("Verify this information with your kitchen team before publishing. Cross-contamination must be assessed separately.", "Bu bilgileri yayınlamadan önce mutfak ekibiyle doğrula. Çapraz bulaşma ayrıca değerlendirilmelidir.")}
              </p>
            </div>
          </details>

          <div className="product-focus-footer">
            <span>{t("Changes are saved automatically.", "Değişiklikler otomatik kaydedilir.")}</span>
            <button
              className="product-delete-button"
              onClick={() => {
                if (window.confirm(t(`Delete “${item.name || "this item"}”?`, `“${item.name || "Bu ürün"}” silinsin mi?`))) onDelete();
              }}
              type="button"
            >
              <Trash2 size={14} /> {t("Delete item", "Ürünü sil")}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
