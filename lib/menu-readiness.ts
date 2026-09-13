import {
  getMenuTranslationFingerprint,
  type MenuData,
  type MenuItem,
} from "@/lib/menu";
import { formatAppNumber, type AppLocale } from "@/lib/i18n";

export type MenuReadinessSection = "products" | "basics" | "business" | "language";

export type MenuReadinessTarget = {
  section: MenuReadinessSection;
  categoryId?: string;
  field?:
    | "restaurant-name"
    | "currency"
    | "subtitle"
    | "category-name"
    | "item-name"
    | "item-price"
    | "item-description"
    | "item-image"
    | "campaign-price";
  itemId?: string;
};

export type MenuReadinessIssue = {
  id: string;
  title: string;
  description: string;
  target: MenuReadinessTarget;
};

export type MenuReadinessReport = {
  blockers: MenuReadinessIssue[];
  canPublish: boolean;
  recommendations: MenuReadinessIssue[];
  score: number;
  statusLabel: string;
  visibleItemCount: number;
};

type VisibleItem = {
  categoryId: string;
  item: MenuItem;
};

function isFilled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeMenuDigits(value: string) {
  const digitRanges = [0x0660, 0x06f0, 0x0966, 0x09e6, 0x0e50, 0xff10];
  return value
    .replace(/[٠-٩۰-۹०-९০-৯๐-๙０-９]/g, (digit) => {
      const codePoint = digit.codePointAt(0) || 0;
      const rangeStart = digitRanges.find((start) => codePoint >= start && codePoint <= start + 9);
      return rangeStart === undefined ? digit : String(codePoint - rangeStart);
    })
    .replace(/[٫．]/g, ".")
    .replace(/[٬，]/g, ",");
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseMenuPrice(value: string, currency = "") {
  const normalizedCurrency = currency.trim();
  const removableCurrency = normalizedCurrency && /[\p{L}\p{Sc}]/u.test(normalizedCurrency)
    ? new RegExp(escapeRegularExpression(normalizedCurrency), "giu")
    : null;
  const withoutCurrency = normalizeMenuDigits(value)
    .trim()
    .replace(removableCurrency || /$^/, "")
    .replace(/\s+/g, "")
    .replace(/(?:TRY|TL|EUR|USD|GBP|JPY|CNY|AED|SAR|INR|KRW|₺|€|\$|£|¥|￥|₹|₩)/gi, "");

  if (!withoutCurrency || !/\d/.test(withoutCurrency) || /[^\d.,]/.test(withoutCurrency)) {
    return null;
  }

  const lastComma = withoutCurrency.lastIndexOf(",");
  const lastDot = withoutCurrency.lastIndexOf(".");
  let normalized = withoutCurrency;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    const decimalParts = withoutCurrency.split(decimalSeparator);
    if (decimalParts.length !== 2 || !/^\d{1,2}$/.test(decimalParts[1])) return null;
    const groups = decimalParts[0].split(groupingSeparator);
    if (!/^\d{1,3}$/.test(groups[0]) || !groups.slice(1).every((part) => /^\d{3}$/.test(part))) return null;
    normalized = `${decimalParts[0].replaceAll(groupingSeparator, "")}.${decimalParts[1]}`;
  } else {
    const separator = lastComma >= 0 ? "," : lastDot >= 0 ? "." : "";
    if (separator) {
      const parts = withoutCurrency.split(separator);
      if (parts.some((part) => !/^\d+$/.test(part))) return null;
      if (parts.length > 2) {
        if (parts[0].length > 3 || !parts.slice(1).every((part) => part.length === 3)) return null;
        normalized = parts.join("");
      } else if (parts[1].length === 3) {
        if (parts[0].length > 3) return null;
        normalized = parts.join("");
      } else if (parts[1].length <= 2) {
        normalized = `${parts[0]}.${parts[1]}`;
      } else {
        return null;
      }
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function hasCompleteCurrentEnglishTranslation(menu: MenuData) {
  const translation = menu.translations?.en;
  if (!translation || translation.sourceFingerprint !== getMenuTranslationFingerprint(menu)) {
    return false;
  }
  if (typeof translation.restaurantName !== "string" || typeof translation.subtitle !== "string") {
    return false;
  }

  return menu.categories.every((category) => (
    typeof category.translations?.en?.name === "string" &&
    category.items.every((item) => (
      typeof item.translations?.en?.name === "string" &&
      typeof item.translations?.en?.description === "string" &&
      typeof item.translations?.en?.badge === "string"
    ))
  ));
}

export function getMenuReadiness(menu: MenuData, locale: AppLocale = "en"): MenuReadinessReport {
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const count = (value: number) => formatAppNumber(locale, value);
  const blockers: MenuReadinessIssue[] = [];
  const recommendations: MenuReadinessIssue[] = [];
  const visibleItems: VisibleItem[] = menu.categories.flatMap((category) =>
    category.items
      .filter((item) => item.availability !== "hidden")
      .map((item) => ({ categoryId: category.id, item })),
  );
  let score = 100;

  if (!isFilled(menu.restaurantName)) {
    score -= 30;
    blockers.push({
      id: "restaurant-name",
      title: t("Menu name is missing", "Menü adı eksik"),
      description: t("Enter the business or menu name guests will see.", "Müşterilerin göreceği işletme veya menü adını yaz."),
      target: { section: "basics", field: "restaurant-name" },
    });
  }

  if (!isFilled(menu.currency)) {
    score -= 10;
    blockers.push({
      id: "currency",
      title: t("Currency is missing", "Para birimi eksik"),
      description: t("Enter the currency symbol or code to display beside prices.", "Fiyatların yanında gösterilecek para birimi simgesini veya kodunu yaz."),
      target: { section: "basics", field: "currency" },
    });
  }

  if (visibleItems.length === 0) {
    score -= 55;
    blockers.push({
      id: "visible-products",
      title: t("No visible items", "Görünür ürün yok"),
      description: t("Set at least one item to Available or Sold out before publishing.", "Yayınlamak için en az bir ürünü Satışta veya Tükendi olarak ayarla."),
      target: { section: "products" },
    });
  } else {
    const unnamedCategories = menu.categories.filter((category) =>
      category.items.some((item) => item.availability !== "hidden") && !isFilled(category.name),
    );
    if (unnamedCategories.length > 0) {
      score -= Math.min(20, unnamedCategories.length * 10);
      blockers.push({
        id: "category-names",
        title: t(`${count(unnamedCategories.length)} category names are missing`, `${count(unnamedCategories.length)} kategori adı eksik`),
        description: t("Give every category with visible items a clear name.", "Görünür ürünlerin bulunduğu kategorilere anlaşılır bir ad ver."),
        target: {
          section: "products",
          categoryId: unnamedCategories[0].id,
          field: "category-name",
        },
      });
    }

    const unnamedItems = visibleItems.filter(({ item }) => !isFilled(item.name));
    if (unnamedItems.length > 0) {
      score -= Math.min(24, unnamedItems.length * 12);
      blockers.push({
        id: "product-names",
        title: t(`${count(unnamedItems.length)} item names are missing`, `${count(unnamedItems.length)} ürün adı eksik`),
        description: t("Complete item names so guests know what they are ordering.", "Müşterinin ne sipariş ettiğini anlayabilmesi için ürün adlarını tamamla."),
        target: {
          section: "products",
          categoryId: unnamedItems[0].categoryId,
          field: "item-name",
          itemId: unnamedItems[0].item.id,
        },
      });
    }

    const invalidPriceItems = visibleItems.filter(({ item }) => parseMenuPrice(item.price, menu.currency) === null);
    if (invalidPriceItems.length > 0) {
      score -= Math.min(24, invalidPriceItems.length * 12);
      blockers.push({
        id: "product-prices",
        title: t(`${count(invalidPriceItems.length)} items have invalid prices`, `${count(invalidPriceItems.length)} ürünün fiyatı geçersiz`),
        description: t("Enter a number greater than zero, such as 15 or 15.50.", "Fiyatları sıfırdan büyük bir sayı olarak gir. Örneğin: 150 veya 150,50."),
        target: {
          section: "products",
          categoryId: invalidPriceItems[0].categoryId,
          field: "item-price",
          itemId: invalidPriceItems[0].item.id,
        },
      });
    }

    const missingDescriptions = visibleItems.filter(({ item }) => !isFilled(item.description));
    if (missingDescriptions.length > 0) {
      score -= Math.round((missingDescriptions.length / visibleItems.length) * 8);
      recommendations.push({
        id: "product-descriptions",
        title: t(`${count(missingDescriptions.length)} items are missing descriptions`, `${count(missingDescriptions.length)} üründe açıklama eksik`),
        description: t("Short descriptions help guests decide more quickly.", "Kısa içerik açıklamaları müşterinin daha hızlı karar vermesini sağlar."),
        target: {
          section: "products",
          categoryId: missingDescriptions[0].categoryId,
          field: "item-description",
          itemId: missingDescriptions[0].item.id,
        },
      });
    }

    const missingImages = visibleItems.filter(({ item }) => !isFilled(item.image));
    if (missingImages.length > 0) {
      score -= Math.round((missingImages.length / visibleItems.length) * 10);
      recommendations.push({
        id: "product-images",
        title: t(`${count(missingImages.length)} items are missing images`, `${count(missingImages.length)} üründe görsel eksik`),
        description: t("Item photos make the menu more appealing and easier to scan.", "Ürün fotoğrafları menüyü daha çekici ve taranabilir hale getirir."),
        target: {
          section: "products",
          categoryId: missingImages[0].categoryId,
          field: "item-image",
          itemId: missingImages[0].item.id,
        },
      });
    }

    const invalidCampaigns = visibleItems.filter(({ item }) => {
      if (!item.isCampaign) return false;
      const currentPrice = parseMenuPrice(item.price, menu.currency);
      const originalPrice = parseMenuPrice(item.originalPrice || "", menu.currency);
      return currentPrice === null || originalPrice === null || originalPrice <= currentPrice;
    });
    if (invalidCampaigns.length > 0) {
      score -= 5;
      recommendations.push({
        id: "campaign-prices",
        title: t(`Review ${count(invalidCampaigns.length)} promotional prices`, `${count(invalidCampaigns.length)} kampanya fiyatını kontrol et`),
        description: t("The original price must be higher than the promotional price.", "Eski fiyat, kampanyalı fiyattan büyük olmalı."),
        target: {
          section: "products",
          categoryId: invalidCampaigns[0].categoryId,
          field: "campaign-price",
          itemId: invalidCampaigns[0].item.id,
        },
      });
    }
  }

  if (!isFilled(menu.subtitle)) {
    score -= 5;
    recommendations.push({
      id: "subtitle",
      title: t("Add a short description", "Kısa açıklama ekle"),
      description: t("A one-sentence description of your business gives the menu more character.", "İşletmeni tek cümlede anlatan bir açıklama menünün karakterini güçlendirir."),
      target: { section: "basics", field: "subtitle" },
    });
  }

  if (!isFilled(menu.businessProfile?.logo)) {
    score -= 3;
    recommendations.push({
      id: "business-logo",
      title: t("Add your business logo", "İşletme logosu ekle"),
      description: t("A logo makes your QR menu instantly recognizable as part of your brand.", "Logo, QR menünün markana ait olduğunu ilk bakışta gösterir."),
      target: { section: "business" },
    });
  }

  const hasContact = [
    menu.businessProfile?.address,
    menu.businessProfile?.phone,
    menu.businessProfile?.whatsapp,
    menu.businessProfile?.instagram,
    menu.businessProfile?.mapsUrl,
  ].some(isFilled);
  if (!hasContact) {
    score -= 5;
    recommendations.push({
      id: "business-contact",
      title: t("Add contact details", "İletişim bilgisi ekle"),
      description: t("Add at least one address, phone number, Instagram account, or map link.", "Adres, telefon, Instagram veya harita bağlantılarından en az birini ekleyebilirsin."),
      target: { section: "business" },
    });
  }

  const sourceIsEnglish = /^en(?:-|$)/i.test(menu.sourceLanguage || "");
  if (!sourceIsEnglish && !hasCompleteCurrentEnglishTranslation(menu)) {
    score -= 7;
    recommendations.push({
      id: "english-translation",
      title: menu.translations?.en ? t("Update the English translation", "İngilizce çeviriyi güncelle") : t("Create an English menu", "İngilizce menü oluştur"),
      description: t("Prepare an up-to-date English version for international guests.", "Yabancı ziyaretçiler için menünün güncel İngilizce sürümünü hazırla."),
      target: { section: "language" },
    });
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const statusLabel = blockers.length > 0
    ? t("Cannot publish", "Yayınlanamaz")
    : normalizedScore >= 90
      ? t("Ready to publish", "Yayına hazır")
      : normalizedScore >= 75
        ? t("In good shape", "İyi durumda")
        : t("Can be improved", "Geliştirilebilir");

  return {
    blockers,
    canPublish: blockers.length === 0,
    recommendations,
    score: normalizedScore,
    statusLabel,
    visibleItemCount: visibleItems.length,
  };
}
