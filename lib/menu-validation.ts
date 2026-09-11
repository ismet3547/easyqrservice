import {
  menuAllergens,
  menuCardStyles,
  menuCategoryStyles,
  menuCornerStyles,
  menuDensities,
  menuDietaryTags,
  menuHeroStyles,
  menuImageRatios,
  menuPriceStyles,
  menuThemePresetIds,
  menuWeekdays,
  normalizeMenuTheme,
  type MenuData,
  type MenuTheme,
  type MenuThemeInput,
} from "@/lib/menu";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRasterImage(value: unknown, maximumLength: number) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > maximumLength) return false;
  const match = /^data:image\/(jpeg|png|webp);base64,/i.exec(value);
  if (!match) return false;
  const encoded = value.slice(match[0].length);
  if (!encoded.length || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return false;
  try {
    const prefix = atob(encoded.slice(0, 16));
    if (match[1].toLowerCase() === "jpeg") return prefix.startsWith("\xff\xd8\xff");
    if (match[1].toLowerCase() === "png") return prefix.startsWith("\x89PNG\r\n\x1a\n");
    return prefix.startsWith("RIFF") && prefix.slice(8, 12) === "WEBP";
  } catch { return false; }
}

function isEnglishTranslationContainer(
  value: unknown,
  validateEnglish: (translation: Record<string, unknown>) => boolean,
) {
  if (value === undefined) return true;
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "en")) return false;
  if (value.en === undefined) return true;
  return isRecord(value.en) && validateEnglish(value.en);
}

function isValidMenuEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => ["restaurantName", "subtitle", "sourceFingerprint"].includes(key)) &&
    typeof value.restaurantName === "string" && value.restaurantName.length <= 120 &&
    typeof value.subtitle === "string" && value.subtitle.length <= 240 &&
    typeof value.sourceFingerprint === "string" && value.sourceFingerprint.length > 0 &&
    value.sourceFingerprint.length <= 64
  );
}

function isValidCategoryEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => key === "name") &&
    typeof value.name === "string" &&
    value.name.length <= 100
  );
}

function isValidItemEnglishTranslation(value: Record<string, unknown>) {
  return (
    Object.keys(value).every((key) => ["name", "description", "badge"].includes(key)) &&
    typeof value.name === "string" && value.name.length <= 180 &&
    typeof value.description === "string" && value.description.length <= 1000 &&
    typeof value.badge === "string" && value.badge.length <= 40
  );
}

function isValidBusinessProfile(value: unknown) {
  if (value === undefined) return true;
  if (!isRecord(value)) return false;

  const allowedKeys = [
    "logo",
    "address",
    "phone",
    "whatsapp",
    "instagram",
    "mapsUrl",
    "timezone",
    "hoursEnabled",
    "weeklyHours",
  ];
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) return false;

  const logoIsValid = isRasterImage(value.logo, 500_000);
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const weeklyHours = value.weeklyHours;
  if (
    !logoIsValid ||
    typeof value.address !== "string" || value.address.length > 300 ||
    typeof value.phone !== "string" || value.phone.length > 60 ||
    typeof value.whatsapp !== "string" || value.whatsapp.length > 120 ||
    typeof value.instagram !== "string" || value.instagram.length > 120 ||
    typeof value.mapsUrl !== "string" || value.mapsUrl.length > 500 ||
    typeof value.timezone !== "string" || value.timezone.length === 0 ||
    value.timezone.length > 80 || !/^[A-Za-z0-9_+\-/]+$/.test(value.timezone) ||
    typeof value.hoursEnabled !== "boolean" ||
    !isRecord(weeklyHours) ||
    Object.keys(weeklyHours).length !== menuWeekdays.length ||
    Object.keys(weeklyHours).some((key) => !menuWeekdays.includes(key as (typeof menuWeekdays)[number]))
  ) return false;

  return menuWeekdays.every((weekday) => {
    const hours = weeklyHours[weekday];
    return (
      isRecord(hours) &&
      Object.keys(hours).every((key) => ["isOpen", "opensAt", "closesAt"].includes(key)) &&
      Object.keys(hours).length === 3 &&
      typeof hours.isOpen === "boolean" &&
      typeof hours.opensAt === "string" && timePattern.test(hours.opensAt) &&
      typeof hours.closesAt === "string" && timePattern.test(hours.closesAt)
    );
  });
}

export function isValidMenuData(value: unknown): value is MenuData {
  if (!isRecord(value)) return false;
  const allowedMenuKeys = [
    "businessProfile",
    "categories",
    "currency",
    "restaurantName",
    "subtitle",
    "translations",
  ];
  if (Object.keys(value).some((key) => !allowedMenuKeys.includes(key))) return false;

  const menu = value as Partial<MenuData>;
  if (
    typeof menu.restaurantName !== "string" || menu.restaurantName.length > 120 ||
    typeof menu.subtitle !== "string" || menu.subtitle.length > 240 ||
    typeof menu.currency !== "string" || menu.currency.length > 12 ||
    !isValidBusinessProfile(menu.businessProfile) ||
    !isEnglishTranslationContainer(menu.translations, isValidMenuEnglishTranslation) ||
    !Array.isArray(menu.categories) ||
    menu.categories.length > 30
  ) return false;

  const totalItems = menu.categories.reduce(
    (sum, category) => sum + (Array.isArray(category?.items) ? category.items.length : 0),
    0,
  );
  if (totalItems > 500) return false;

  const totalImageSize = menu.categories.reduce(
    (menuTotal, category) => menuTotal + (Array.isArray(category?.items)
      ? category.items.reduce(
          (categoryTotal, item) => categoryTotal + (typeof item?.image === "string" ? item.image.length : 0),
          0,
        )
      : 0),
    0,
  ) + (typeof menu.businessProfile?.logo === "string" ? menu.businessProfile.logo.length : 0);
  if (totalImageSize > 8_000_000) return false;

  const categoryIds = new Set<string>();
  const itemIds = new Set<string>();
  const categoryKeys = ["id", "items", "name", "translations"];
  const itemKeys = [
    "allergens",
    "availability",
    "badge",
    "description",
    "dietaryTags",
    "id",
    "image",
    "isCampaign",
    "name",
    "originalPrice",
    "price",
    "translations",
  ];

  return menu.categories.every((category) => {
    if (
      !isRecord(category) ||
      Object.keys(category).some((key) => !categoryKeys.includes(key)) ||
      typeof category.id !== "string" ||
      category.id.length === 0 ||
      category.id.length > 100 ||
      categoryIds.has(category.id) ||
      typeof category.name !== "string" ||
      category.name.length > 100 ||
      !isEnglishTranslationContainer(category.translations, isValidCategoryEnglishTranslation) ||
      !Array.isArray(category.items) ||
      category.items.length > 100
    ) return false;
    categoryIds.add(category.id);

    return category.items.every((item) => {
      if (
        !isRecord(item) ||
        Object.keys(item).some((key) => !itemKeys.includes(key)) ||
        typeof item.id !== "string" ||
        item.id.length === 0 ||
        item.id.length > 100 ||
        itemIds.has(item.id) ||
        typeof item.name !== "string" ||
        item.name.length > 180 ||
        typeof item.description !== "string" ||
        item.description.length > 1000 ||
        typeof item.price !== "string" ||
        item.price.length > 40 ||
        typeof item.badge !== "string" ||
        item.badge.length > 40 ||
        !isEnglishTranslationContainer(item.translations, isValidItemEnglishTranslation) ||
        (
          item.originalPrice !== undefined &&
          (typeof item.originalPrice !== "string" || item.originalPrice.length > 40)
        ) ||
        (item.isCampaign !== undefined && typeof item.isCampaign !== "boolean") ||
        (
          item.availability !== undefined &&
          !["available", "sold-out", "hidden"].includes(item.availability as string)
        ) ||
        (
          item.dietaryTags !== undefined &&
          (
            !Array.isArray(item.dietaryTags) ||
            item.dietaryTags.length > menuDietaryTags.length ||
            new Set(item.dietaryTags).size !== item.dietaryTags.length ||
            !item.dietaryTags.every((tag) => menuDietaryTags.includes(tag))
          )
        ) ||
        (
          item.allergens !== undefined &&
          (
            !Array.isArray(item.allergens) ||
            item.allergens.length > menuAllergens.length ||
            new Set(item.allergens).size !== item.allergens.length ||
            !item.allergens.every((allergen) => menuAllergens.includes(allergen))
          )
        ) ||
        (
          item.image !== undefined &&
          item.image !== "" &&
          (
            !isRasterImage(item.image, 750_000)
          )
        )
      ) return false;

      itemIds.add(item.id);
      return true;
    });
  });
}

export function isValidMenuTheme(value: unknown): value is MenuThemeInput {
  if (!value || typeof value !== "object") return false;
  const theme = value as Partial<MenuThemeInput>;
  const isColor = (color: unknown) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
  const optionalValueIsValid = <Value extends string>(
    candidate: unknown,
    values: readonly Value[],
  ) => candidate === undefined || (
    typeof candidate === "string" && values.includes(candidate as Value)
  );
  const allowedKeys = new Set([
    "accent",
    "background",
    "cardStyle",
    "categoryStyle",
    "cornerStyle",
    "density",
    "font",
    "heroStyle",
    "imageRatio",
    "layout",
    "priceStyle",
    "showDescriptions",
    "stylePreset",
    "surface",
    "text",
  ]);
  return (
    Object.keys(theme).every((key) => allowedKeys.has(key)) &&
    isColor(theme.accent) &&
    isColor(theme.background) &&
    isColor(theme.surface) &&
    isColor(theme.text) &&
    ["modern", "editorial", "friendly"].includes(theme.font || "") &&
    ["cards", "compact", "tiles", "showcase"].includes(theme.layout || "") &&
    typeof theme.showDescriptions === "boolean" &&
    optionalValueIsValid(theme.cardStyle, menuCardStyles) &&
    optionalValueIsValid(theme.categoryStyle, menuCategoryStyles) &&
    optionalValueIsValid(theme.cornerStyle, menuCornerStyles) &&
    optionalValueIsValid(theme.density, menuDensities) &&
    optionalValueIsValid(theme.heroStyle, menuHeroStyles) &&
    optionalValueIsValid(theme.imageRatio, menuImageRatios) &&
    optionalValueIsValid(theme.priceStyle, menuPriceStyles) &&
    optionalValueIsValid(theme.stylePreset, [...menuThemePresetIds, "custom"] as const)
  );
}
