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
  dietaryTagLabels,
  menuAllergens,
  menuDietaryTags,
  type MenuAllergen,
  type MenuDietaryTag,
  type MenuItem,
} from "@/lib/menu";

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
}: {
  currency: string;
  item: MenuItem;
  onOpen: () => void;
}) {
  const status = item.availability === "sold-out"
    ? "Tükendi"
    : item.availability === "hidden"
      ? "Gizli"
      : "Satışta";
  const details = [status, item.isCampaign ? "Kampanya" : "", item.badge]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      aria-label={`${item.name || "İsimsiz ürün"} ürününü düzenle`}
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
        <strong>{item.name || "İsimsiz ürün"}</strong>
        <small>{details}</small>
      </span>
      <span className="product-list-item-price">
        {item.isCampaign && item.originalPrice && <del>{item.originalPrice}{currency}</del>}
        <strong>{item.price || "0"}{currency}</strong>
      </span>
      <span className="product-list-item-action">Düzenle <ArrowRight size={14} /></span>
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
  total: number;
}) {
  const availability = item.availability || "available";
  const selectedDietaryCount = (item.dietaryTags?.length || 0) + (item.allergens?.length || 0);

  return (
    <div className="product-focus-shell" id={`studio-item-${item.id}`}>
      <div className="product-focus-toolbar">
        <button className="product-focus-back" onClick={onBack} type="button">
          <ArrowLeft size={15} /> Ürün listesi
        </button>
        <span>{categoryName || "İsimsiz kategori"} · {position}/{total}</span>
        <div className="product-focus-navigation" aria-label="Ürünler arasında geçiş">
          <button aria-label="Önceki ürün" disabled={!hasPrevious} onClick={onPrevious} type="button">
            <ChevronLeft size={17} />
          </button>
          <button aria-label="Sonraki ürün" disabled={!hasNext} onClick={onNext} type="button">
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
            <span>Ürün düzenleme</span>
            <h3>{item.name || "İsimsiz ürün"}</h3>
            <small>Temel bilgiler üstte, isteğe bağlı ayrıntılar aşağıda.</small>
          </div>
        </div>

        <div className="item-editor-body product-focus-body">
          <div className="product-focus-main-fields">
            <label className="field-label">
              Ürün adı
              <input
                autoFocus
                className="item-name-input"
                data-readiness-field="item-name"
                value={item.name}
                onChange={(event) => onUpdate("name", event.target.value)}
              />
            </label>
            <label className="field-label">
              {item.isCampaign ? "Kampanyalı fiyat" : "Fiyat"}
              <span className="price-input product-focus-price">
                <input
                  aria-label={item.isCampaign ? "Kampanyalı fiyat" : "Fiyat"}
                  data-readiness-field="item-price"
                  inputMode="decimal"
                  value={item.price}
                  onChange={(event) => onUpdate("price", event.target.value)}
                />
                <span>{currency}</span>
              </span>
            </label>
          </div>

          <label className="field-label product-focus-description">
            Açıklama
            <textarea
              data-readiness-field="item-description"
              placeholder="Ürünün içeriğini kısa ve anlaşılır biçimde yaz."
              rows={3}
              value={item.description}
              onChange={(event) => onUpdate("description", event.target.value)}
            />
          </label>

          <div className="item-image-editor">
            <label className={item.image ? "has-image" : ""}>
              {item.image ? <img src={item.image} alt="" /> : <ImagePlus size={18} />}
              <span>
                <strong>{item.image ? "Görseli değiştir" : "Ürün görseli ekle"}</strong>
                <small>JPG, PNG veya WEBP · otomatik küçültülür</small>
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
                aria-label={(item.image ? "AI ile görseli yenile: " : "AI ile görsel oluştur: ") + (item.name || "ürün")}
                onClick={onGenerateImage}
                type="button"
              >
                {generatingItemId === item.id
                  ? <Loader2 className="auto-image-spinner" size={14} />
                  : <Sparkles size={14} />}
                {generatingItemId === item.id ? "Üretiliyor" : item.image ? "AI ile yenile" : "AI oluştur"}
              </button>
              {item.image && (
                <button
                  className="item-remove-image-button"
                  aria-label="Ürün görselini kaldır"
                  onClick={() => onUpdate("image", "")}
                  type="button"
                >
                  <ImageOff size={14} /> Kaldır
                </button>
              )}
            </div>
          </div>

          <div className="item-availability">
            <div className="item-availability-copy">
              <strong>Ürün durumu</strong>
              <small>
                {availability === "sold-out"
                  ? "Menüde görünür ve Tükendi etiketi taşır."
                  : availability === "hidden"
                    ? "Müşteri menüsünde ve kategori sayısında görünmez."
                    : "Müşteriler ürünü normal şekilde görür."}
              </small>
            </div>
            <div className="availability-options" role="group" aria-label={(item.name || "Ürün") + " menü durumu"}>
              <button
                className={`availability-option available ${availability === "available" ? "active" : ""}`}
                aria-pressed={availability === "available"}
                onClick={() => onUpdate("availability", "available")}
                type="button"
              >
                <Check size={13} /> Satışta
              </button>
              <button
                className={`availability-option sold-out ${availability === "sold-out" ? "active" : ""}`}
                aria-pressed={availability === "sold-out"}
                onClick={() => onUpdate("availability", "sold-out")}
                type="button"
              >
                <X size={13} /> Tükendi
              </button>
              <button
                className={`availability-option hidden ${availability === "hidden" ? "active" : ""}`}
                aria-pressed={availability === "hidden"}
                onClick={() => onUpdate("availability", "hidden")}
                type="button"
              >
                <EyeOff size={13} /> Gizli
              </button>
            </div>
          </div>

          <div className="product-optional-fields">
            <label className="field-label">
              Kısa etiket <small>İsteğe bağlı</small>
              <input
                className="badge-input"
                placeholder="Örn. Yeni veya Favori"
                value={item.badge}
                onChange={(event) => onUpdate("badge", event.target.value)}
              />
            </label>
            <button
              className={`campaign-toggle ${item.isCampaign ? "active" : ""}`}
              onClick={() => onUpdate("isCampaign", !item.isCampaign)}
              type="button"
            >
              <BadgePercent size={14} /> {item.isCampaign ? "Kampanyalı" : "Kampanya ekle"}
            </button>
          </div>

          {item.isCampaign && (
            <div className="campaign-editor">
              <BadgePercent size={16} />
              <label>
                <span>Eski fiyat</span>
                <span className="price-input">
                  <input
                    aria-label="Kampanya öncesi fiyat"
                    data-readiness-field="campaign-price"
                    inputMode="decimal"
                    placeholder="475"
                    value={item.originalPrice || ""}
                    onChange={(event) => onUpdate("originalPrice", event.target.value)}
                  />
                  <span>{currency}</span>
                </span>
              </label>
              <p>Menüde <del>{item.originalPrice || "475"}{currency}</del> yerine <strong>{item.price || "400"}{currency}</strong> gösterilir.</p>
            </div>
          )}

          <details className="item-dietary-editor">
            <summary>
              <Leaf size={16} />
              <span className="item-dietary-summary-copy">
                <strong>Beslenme ve alerjenler</strong>
                <small>Yalnızca gerekiyorsa ekle</small>
              </span>
              <b>{selectedDietaryCount}</b>
              <ChevronDown className="dietary-chevron" size={15} />
            </summary>
            <div className="item-dietary-body">
              <div className="item-dietary-group">
                <span>Beslenme etiketleri</span>
                <div className="item-dietary-options">
                  {menuDietaryTags.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className={`dietary-choice ${tag} ${item.dietaryTags?.includes(tag) ? "active" : ""}`}
                      aria-pressed={item.dietaryTags?.includes(tag) || false}
                      onClick={() => onToggleDietaryTag(tag)}
                    >
                      {dietaryTagLabels[tag]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="item-dietary-group">
                <span>Alerjenler</span>
                <div className="item-dietary-options">
                  {menuAllergens.map((allergen) => (
                    <button
                      type="button"
                      key={allergen}
                      className={`allergen-choice ${item.allergens?.includes(allergen) ? "active" : ""}`}
                      aria-pressed={item.allergens?.includes(allergen) || false}
                      onClick={() => onToggleAllergen(allergen)}
                    >
                      {allergenLabels[allergen]}
                    </button>
                  ))}
                </div>
              </div>
              <p className="item-allergen-caution">
                Bu bilgileri yayınlamadan önce mutfak ekibiyle doğrula. Çapraz bulaşma ayrıca değerlendirilmelidir.
              </p>
            </div>
          </details>

          <div className="product-focus-footer">
            <span>Değişiklikler otomatik kaydedilir.</span>
            <button
              className="product-delete-button"
              onClick={() => {
                if (window.confirm(`“${item.name || "Bu ürün"}” silinsin mi?`)) onDelete();
              }}
              type="button"
            >
              <Trash2 size={14} /> Ürünü sil
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
