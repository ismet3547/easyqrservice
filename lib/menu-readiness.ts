import {
  getMenuTranslationFingerprint,
  type MenuData,
  type MenuItem,
} from "@/lib/menu";

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
  statusLabel: "Yayınlanamaz" | "Geliştirilebilir" | "İyi durumda" | "Yayına hazır";
  visibleItemCount: number;
};

type VisibleItem = {
  categoryId: string;
  item: MenuItem;
};

function isFilled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseMenuPrice(value: string) {
  const withoutCurrency = value
    .trim()
    .replace(/\s+/g, "")
    .replace(/(?:TRY|TL|EUR|USD|GBP|₺|€|\$|£)/gi, "");

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
    normalized = `${decimalParts[0].replaceAll(groupingSeparator, "")}.${decimalParts[1]}`;
  } else {
    const separator = lastComma >= 0 ? "," : lastDot >= 0 ? "." : "";
    if (separator) {
      const parts = withoutCurrency.split(separator);
      if (parts.some((part) => !/^\d+$/.test(part))) return null;
      if (parts.length > 2) {
        if (!parts.slice(1).every((part) => part.length === 3)) return null;
        normalized = parts.join("");
      } else if (parts[1].length === 3) {
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

export function getMenuReadiness(menu: MenuData): MenuReadinessReport {
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
      title: "Menü adı eksik",
      description: "Müşterilerin göreceği işletme veya menü adını yaz.",
      target: { section: "basics", field: "restaurant-name" },
    });
  }

  if (!isFilled(menu.currency)) {
    score -= 10;
    blockers.push({
      id: "currency",
      title: "Para birimi eksik",
      description: "Fiyatların yanında gösterilecek para birimi simgesini veya kodunu yaz.",
      target: { section: "basics", field: "currency" },
    });
  }

  if (visibleItems.length === 0) {
    score -= 55;
    blockers.push({
      id: "visible-products",
      title: "Görünür ürün yok",
      description: "Yayınlamak için en az bir ürünü Satışta veya Tükendi olarak ayarla.",
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
        title: `${unnamedCategories.length} kategori adı eksik`,
        description: "Görünür ürünlerin bulunduğu kategorilere anlaşılır bir ad ver.",
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
        title: `${unnamedItems.length} ürün adı eksik`,
        description: "Müşterinin ne sipariş ettiğini anlayabilmesi için ürün adlarını tamamla.",
        target: {
          section: "products",
          categoryId: unnamedItems[0].categoryId,
          field: "item-name",
          itemId: unnamedItems[0].item.id,
        },
      });
    }

    const invalidPriceItems = visibleItems.filter(({ item }) => parseMenuPrice(item.price) === null);
    if (invalidPriceItems.length > 0) {
      score -= Math.min(24, invalidPriceItems.length * 12);
      blockers.push({
        id: "product-prices",
        title: `${invalidPriceItems.length} ürünün fiyatı geçersiz`,
        description: "Fiyatları sıfırdan büyük bir sayı olarak gir. Örneğin: 150 veya 150,50.",
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
        title: `${missingDescriptions.length} üründe açıklama eksik`,
        description: "Kısa içerik açıklamaları müşterinin daha hızlı karar vermesini sağlar.",
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
        title: `${missingImages.length} üründe görsel eksik`,
        description: "Ürün fotoğrafları menüyü daha çekici ve taranabilir hale getirir.",
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
      const currentPrice = parseMenuPrice(item.price);
      const originalPrice = parseMenuPrice(item.originalPrice || "");
      return currentPrice === null || originalPrice === null || originalPrice <= currentPrice;
    });
    if (invalidCampaigns.length > 0) {
      score -= 5;
      recommendations.push({
        id: "campaign-prices",
        title: `${invalidCampaigns.length} kampanya fiyatını kontrol et`,
        description: "Eski fiyat, kampanyalı fiyattan büyük olmalı.",
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
      title: "Kısa açıklama ekle",
      description: "İşletmeni tek cümlede anlatan bir açıklama menünün karakterini güçlendirir.",
      target: { section: "basics", field: "subtitle" },
    });
  }

  if (!isFilled(menu.businessProfile?.logo)) {
    score -= 3;
    recommendations.push({
      id: "business-logo",
      title: "İşletme logosu ekle",
      description: "Logo, QR menünün markana ait olduğunu ilk bakışta gösterir.",
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
      title: "İletişim bilgisi ekle",
      description: "Adres, telefon, Instagram veya harita bağlantılarından en az birini ekleyebilirsin.",
      target: { section: "business" },
    });
  }

  if (!hasCompleteCurrentEnglishTranslation(menu)) {
    score -= 7;
    recommendations.push({
      id: "english-translation",
      title: menu.translations?.en ? "İngilizce çeviriyi güncelle" : "İngilizce menü oluştur",
      description: "Yabancı ziyaretçiler için menünün güncel İngilizce sürümünü hazırla.",
      target: { section: "language" },
    });
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const statusLabel = blockers.length > 0
    ? "Yayınlanamaz"
    : normalizedScore >= 90
      ? "Yayına hazır"
      : normalizedScore >= 75
        ? "İyi durumda"
        : "Geliştirilebilir";

  return {
    blockers,
    canPublish: blockers.length === 0,
    recommendations,
    score: normalizedScore,
    statusLabel,
    visibleItemCount: visibleItems.length,
  };
}
