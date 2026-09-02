export const menuDietaryTags = ["vegan", "vegetarian", "gluten-free", "spicy"] as const;
export type MenuDietaryTag = (typeof menuDietaryTags)[number];

export const menuAllergens = [
  "gluten",
  "milk",
  "egg",
  "nuts",
  "peanut",
  "soy",
  "sesame",
  "fish",
  "shellfish",
] as const;
export type MenuAllergen = (typeof menuAllergens)[number];

export const dietaryTagLabels: Record<MenuDietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vejetaryen",
  "gluten-free": "Glutensiz",
  spicy: "Acılı",
};

export const dietaryTagLabelsEn: Record<MenuDietaryTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-free",
  spicy: "Spicy",
};

export const allergenLabels: Record<MenuAllergen, string> = {
  gluten: "Gluten",
  milk: "Süt",
  egg: "Yumurta",
  nuts: "Kuruyemiş",
  peanut: "Yer fıstığı",
  soy: "Soya",
  sesame: "Susam",
  fish: "Balık",
  shellfish: "Kabuklu deniz ürünü",
};

export const allergenLabelsEn: Record<MenuAllergen, string> = {
  gluten: "Gluten",
  milk: "Milk",
  egg: "Egg",
  nuts: "Tree nuts",
  peanut: "Peanut",
  soy: "Soy",
  sesame: "Sesame",
  fish: "Fish",
  shellfish: "Shellfish",
};

export type MenuLanguage = "tr" | "en";

export const menuWeekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type MenuWeekday = (typeof menuWeekdays)[number];

export type MenuBusinessHours = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
};

export type MenuBusinessProfile = {
  logo: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  mapsUrl: string;
  timezone: string;
  hoursEnabled: boolean;
  weeklyHours: Record<MenuWeekday, MenuBusinessHours>;
};

export type MenuEnglishTranslation = {
  restaurantName: string;
  subtitle: string;
  sourceFingerprint: string;
};

export type MenuCategoryEnglishTranslation = {
  name: string;
};

export type MenuItemEnglishTranslation = {
  name: string;
  description: string;
  badge: string;
};

export type MenuItemAvailability = "available" | "sold-out" | "hidden";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  badge: string;
  originalPrice?: string;
  isCampaign?: boolean;
  image?: string;
  availability?: MenuItemAvailability;
  dietaryTags?: MenuDietaryTag[];
  allergens?: MenuAllergen[];
  translations?: {
    en?: MenuItemEnglishTranslation;
  };
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
  translations?: {
    en?: MenuCategoryEnglishTranslation;
  };
};

export type MenuData = {
  restaurantName: string;
  subtitle: string;
  currency: string;
  categories: MenuCategory[];
  businessProfile?: MenuBusinessProfile;
  translations?: {
    en?: MenuEnglishTranslation;
  };
};

export const menuThemePresetIds = [
  "minimal",
  "bistro",
  "botanical",
  "editorial",
  "dark-luxe",
  "playful",
] as const;
export type MenuThemePresetId = (typeof menuThemePresetIds)[number];

export const menuCardStyles = ["flat", "outlined", "elevated"] as const;
export type MenuCardStyle = (typeof menuCardStyles)[number];

export const menuCornerStyles = ["square", "soft", "rounded"] as const;
export type MenuCornerStyle = (typeof menuCornerStyles)[number];

export const menuImageRatios = ["square", "portrait", "landscape"] as const;
export type MenuImageRatio = (typeof menuImageRatios)[number];

export const menuDensities = ["compact", "comfortable", "airy"] as const;
export type MenuDensity = (typeof menuDensities)[number];

export const menuPriceStyles = ["plain", "pill", "accent"] as const;
export type MenuPriceStyle = (typeof menuPriceStyles)[number];

export const menuCategoryStyles = ["pills", "underline", "minimal"] as const;
export type MenuCategoryStyle = (typeof menuCategoryStyles)[number];

export const menuHeroStyles = ["clean", "tinted", "pattern"] as const;
export type MenuHeroStyle = (typeof menuHeroStyles)[number];

export type MenuTheme = {
  accent: string;
  background: string;
  cardStyle: MenuCardStyle;
  categoryStyle: MenuCategoryStyle;
  cornerStyle: MenuCornerStyle;
  density: MenuDensity;
  surface: string;
  text: string;
  font: "modern" | "editorial" | "friendly";
  heroStyle: MenuHeroStyle;
  imageRatio: MenuImageRatio;
  layout: "cards" | "compact" | "tiles" | "showcase";
  priceStyle: MenuPriceStyle;
  showDescriptions: boolean;
  stylePreset: MenuThemePresetId | "custom";
};

type MenuThemeV2Fields = Pick<
  MenuTheme,
  | "cardStyle"
  | "categoryStyle"
  | "cornerStyle"
  | "density"
  | "heroStyle"
  | "imageRatio"
  | "priceStyle"
  | "stylePreset"
>;

export type MenuThemeInput = Omit<MenuTheme, keyof MenuThemeV2Fields> &
  Partial<MenuThemeV2Fields>;

export type PublishedMenu = {
  menu: MenuData;
  theme: MenuTheme;
};

export const defaultTheme: MenuTheme = {
  accent: "#ea5b2a",
  background: "#f7f2e8",
  cardStyle: "elevated",
  categoryStyle: "pills",
  cornerStyle: "soft",
  density: "comfortable",
  surface: "#fffdf9",
  text: "#20251f",
  font: "modern",
  heroStyle: "pattern",
  imageRatio: "square",
  layout: "cards",
  priceStyle: "plain",
  showDescriptions: true,
  stylePreset: "bistro",
};

export const menuThemePresets: Record<MenuThemePresetId, MenuTheme> = {
  minimal: {
    ...defaultTheme,
    accent: "#343a35",
    background: "#f4f4f0",
    cardStyle: "outlined",
    categoryStyle: "underline",
    density: "compact",
    heroStyle: "clean",
    layout: "compact",
    surface: "#ffffff",
    text: "#1f2420",
    stylePreset: "minimal",
  },
  bistro: defaultTheme,
  botanical: {
    ...defaultTheme,
    accent: "#65784e",
    background: "#f0f1e8",
    cardStyle: "flat",
    cornerStyle: "rounded",
    density: "airy",
    font: "friendly",
    heroStyle: "tinted",
    imageRatio: "portrait",
    priceStyle: "accent",
    surface: "#fbfcf6",
    text: "#283025",
    stylePreset: "botanical",
  },
  editorial: {
    ...defaultTheme,
    accent: "#8c3f34",
    background: "#f3ece1",
    cardStyle: "outlined",
    categoryStyle: "minimal",
    cornerStyle: "square",
    density: "airy",
    font: "editorial",
    heroStyle: "clean",
    imageRatio: "landscape",
    layout: "showcase",
    surface: "#fffaf1",
    text: "#30251f",
    stylePreset: "editorial",
  },
  "dark-luxe": {
    ...defaultTheme,
    accent: "#d9a441",
    background: "#181916",
    cardStyle: "elevated",
    categoryStyle: "underline",
    font: "editorial",
    heroStyle: "tinted",
    imageRatio: "portrait",
    layout: "showcase",
    priceStyle: "pill",
    surface: "#24251f",
    text: "#f7f2e8",
    stylePreset: "dark-luxe",
  },
  playful: {
    ...defaultTheme,
    accent: "#df526f",
    background: "#fff1d8",
    cardStyle: "elevated",
    cornerStyle: "rounded",
    font: "friendly",
    heroStyle: "pattern",
    layout: "tiles",
    priceStyle: "pill",
    surface: "#fffaf0",
    text: "#302b48",
    stylePreset: "playful",
  },
};

export function normalizeMenuTheme(value: unknown): MenuTheme {
  const theme = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<MenuTheme>
    : {};
  const isColor = (color: unknown): color is string =>
    typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color);
  const valueOr = <Value extends string>(
    candidate: unknown,
    values: readonly Value[],
    fallback: Value,
  ): Value => typeof candidate === "string" && values.includes(candidate as Value)
    ? candidate as Value
    : fallback;

  return {
    accent: isColor(theme.accent) ? theme.accent : defaultTheme.accent,
    background: isColor(theme.background) ? theme.background : defaultTheme.background,
    cardStyle: valueOr(theme.cardStyle, menuCardStyles, defaultTheme.cardStyle),
    categoryStyle: valueOr(theme.categoryStyle, menuCategoryStyles, defaultTheme.categoryStyle),
    cornerStyle: valueOr(theme.cornerStyle, menuCornerStyles, defaultTheme.cornerStyle),
    density: valueOr(theme.density, menuDensities, defaultTheme.density),
    surface: isColor(theme.surface) ? theme.surface : defaultTheme.surface,
    text: isColor(theme.text) ? theme.text : defaultTheme.text,
    font: valueOr(theme.font, ["modern", "editorial", "friendly"] as const, defaultTheme.font),
    heroStyle: valueOr(theme.heroStyle, menuHeroStyles, defaultTheme.heroStyle),
    imageRatio: valueOr(theme.imageRatio, menuImageRatios, defaultTheme.imageRatio),
    layout: valueOr(
      theme.layout,
      ["cards", "compact", "tiles", "showcase"] as const,
      defaultTheme.layout,
    ),
    priceStyle: valueOr(theme.priceStyle, menuPriceStyles, defaultTheme.priceStyle),
    showDescriptions: typeof theme.showDescriptions === "boolean"
      ? theme.showDescriptions
      : defaultTheme.showDescriptions,
    stylePreset: valueOr(
      theme.stylePreset,
      [...menuThemePresetIds, "custom"] as const,
      "custom",
    ),
  };
}

export const defaultBusinessProfile: MenuBusinessProfile = {
  logo: "",
  address: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  mapsUrl: "",
  timezone: "Europe/Istanbul",
  hoursEnabled: false,
  weeklyHours: {
    monday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    tuesday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    wednesday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    thursday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    friday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    saturday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
    sunday: { isOpen: true, opensAt: "09:00", closesAt: "22:00" },
  },
};

export function getMenuBusinessProfile(menu: MenuData): MenuBusinessProfile {
  const storedProfile = menu.businessProfile;
  return {
    ...defaultBusinessProfile,
    ...storedProfile,
    weeklyHours: Object.fromEntries(
      menuWeekdays.map((weekday) => [
        weekday,
        {
          ...defaultBusinessProfile.weeklyHours[weekday],
          ...storedProfile?.weeklyHours?.[weekday],
        },
      ]),
    ) as Record<MenuWeekday, MenuBusinessHours>,
  };
}

export const demoMenu: MenuData = {
  restaurantName: "Sade Mutfak",
  subtitle: "Mevsiminde, yerel ve özenli",
  currency: "₺",
  categories: [
    {
      id: "kahvalti",
      name: "Kahvaltı",
      items: [
        {
          id: "avokado-tost",
          name: "Avokado Tost",
          description: "Ekşi maya ekmek, avokado, poşe yumurta ve taze otlar",
          price: "285",
          badge: "Favori",
          originalPrice: "340",
          isCampaign: true,
          dietaryTags: ["vegetarian"],
          allergens: ["gluten", "egg"],
        },
        {
          id: "granola-kase",
          name: "Ev Yapımı Granola",
          description: "Süzme yoğurt, mevsim meyveleri, bal ve fındık",
          price: "220",
          badge: "",
          dietaryTags: ["vegetarian"],
          allergens: ["milk", "nuts"],
        },
        {
          id: "menemen",
          name: "Otlu Menemen",
          description: "Köy yumurtası, domates, biber ve taze kekik",
          price: "245",
          badge: "Yeni",
        },
      ],
    },
    {
      id: "kahve",
      name: "Kahve",
      items: [
        {
          id: "flat-white",
          name: "Flat White",
          description: "Çift shot espresso ve ipeksi süt",
          price: "145",
          badge: "",
        },
        {
          id: "cold-brew",
          name: "Portakallı Cold Brew",
          description: "18 saat demlenmiş kahve ve portakal kabuğu",
          price: "175",
          badge: "Favori",
        },
      ],
    },
    {
      id: "tatli",
      name: "Tatlı",
      items: [
        {
          id: "san-sebastian",
          name: "San Sebastian",
          description: "Yanık cheesecake ve bitter çikolata sosu",
          price: "240",
          badge: "",
        },
      ],
    },
  ],
};

export function getMenuTranslationFingerprint(menu: MenuData) {
  const source = JSON.stringify({
    restaurantName: menu.restaurantName,
    subtitle: menu.subtitle,
    categories: menu.categories.map((category) => ({
      id: category.id,
      name: category.name,
      items: category.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        badge: item.badge,
      })),
    })),
  });

  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function hasEnglishMenuTranslation(menu: MenuData) {
  return Boolean(menu.translations?.en);
}

export function getVisibleMenu(menu: MenuData): MenuData {
  return {
    ...menu,
    categories: menu.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.availability !== "hidden"),
      }))
      .filter((category) => category.items.length > 0),
  };
}

export function createId(prefix: string) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${suffix}`;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function encodePublishedMenu(payload: PublishedMenu) {
  const raw = new TextEncoder().encode(JSON.stringify(payload));

  if (typeof CompressionStream === "undefined") {
    return `plain.${bytesToBase64Url(raw)}`;
  }

  const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return `zip.${bytesToBase64Url(compressed)}`;
}

export async function decodePublishedMenu(value: string): Promise<PublishedMenu> {
  const [format, encoded] = value.split(".", 2);
  if (!format || !encoded) throw new Error("Geçersiz menü bağlantısı");

  let bytes = base64UrlToBytes(encoded);
  if (format === "zip") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Tarayıcınız bu menü bağlantısını açamıyor");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  } else if (format !== "plain") {
    throw new Error("Bilinmeyen menü bağlantısı");
  }

  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as PublishedMenu;
  if (!parsed?.menu?.categories || !parsed?.theme?.accent) {
    throw new Error("Eksik menü verisi");
  }
  return { ...parsed, theme: normalizeMenuTheme(parsed.theme) };
}
