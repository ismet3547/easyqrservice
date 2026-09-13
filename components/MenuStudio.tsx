"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BedDouble,
  CakeSlice,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  Coffee,
  Copy,
  Croissant,
  Download,
  FilePlus2,
  FileText,
  GalleryVerticalEnd,
  Grid2X2,
  ImagePlus,
  Instagram,
  LayoutGrid,
  Languages,
  List,
  LockKeyhole,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCcw,
  ScanLine,
  Search,
  Sandwich,
  Share2,
  Sparkles,
  Smartphone,
  Trash2,
  Undo2,
  UploadCloud,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createId,
  defaultTheme,
  getDemoMenu,
  getMenuBusinessProfile,
  getMenuTranslationFingerprint,
  hasEnglishMenuTranslation,
  menuThemePresets,
  menuWeekdays,
  normalizeMenuTheme,
  type MenuCardStyle,
  type MenuCategoryStyle,
  type MenuCornerStyle,
  type MenuAllergen,
  type MenuBusinessProfile,
  type MenuData,
  type MenuDensity,
  type MenuDietaryTag,
  type MenuHeroStyle,
  type MenuImageRatio,
  type MenuItem,
  type MenuPriceStyle,
  type MenuTheme,
  type MenuThemePresetId,
  type MenuWeekday,
  type PublishedMenu,
} from "@/lib/menu";
import { decodePublishedMenu } from "@/lib/menu-link";
import { isValidMenuData, isValidMenuTheme } from "@/lib/menu-validation";
import { buildMenuTrafficUrl } from "@/lib/menu-tracking";
import {
  createMenuFromStarter,
  getMenuStarter,
  getMenuStarters,
  type MenuStarterCurrency,
  type MenuStarterId,
} from "@/lib/menu-starters";
import {
  getMenuReadiness,
  type MenuReadinessTarget,
} from "@/lib/menu-readiness";
import { aiCreditCosts } from "@/lib/ai-credit-config";
import type { GeneratedThemeDesign } from "@/lib/theme-design";
import { useModalFocus } from "@/components/useModalFocus";
import { getThemeAccessibilityIssues, repairThemeAccessibility } from "@/lib/theme-design";
import { createMenuSaveQueue } from "@/lib/menu-save-queue";
import { PublicMenu } from "@/components/MenuPreview";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import {
  Brand,
  StudioEditorTabs,
  StudioHeader,
  StudioPreviewDialog,
  StudioPreviewStage,
  StudioSectionNav,
  type StudioEditorTab,
} from "@/components/studio/StudioChrome";
import {
  ProductDetailEditor,
  ProductListItem,
} from "@/components/studio/ProductEditor";
import type { StoredMenu } from "@/lib/menus";
import { useAppLocale } from "@/components/LocaleProvider";
import { getLocalizedAppPath, type AppLocale } from "@/lib/i18n";

type AuthUser = { id: string; name: string; email: string; createdAt: string };

type ThemeDesignApiResult = {
  code?: string;
  credits?: {
    balance: number;
    cost: number;
    refunded?: boolean;
  };
  design?: GeneratedThemeDesign;
  message?: string;
};

type ThemeDesignFeedback = {
  message: string;
  tone: "error" | "success";
  title: string;
};

type EnglishTranslationResult = {
  translation?: {
    restaurantName: string;
    subtitle: string;
    categories: Array<{
      categoryId: string;
      name: string;
      items: Array<{
        itemId: string;
        name: string;
        description: string;
        badge: string;
      }>;
    }>;
  };
  message?: string;
};

const themePresetOptions: Array<{
  description: string;
  id: MenuThemePresetId;
  label: string;
}> = [
  { id: "minimal", label: "Minimal", description: "Temiz ve hızlı okunan" },
  { id: "bistro", label: "Modern Bistro", description: "Sıcak ve dengeli" },
  { id: "botanical", label: "Botanik", description: "Doğal ve ferah" },
  { id: "editorial", label: "Editoryal", description: "Şık ve karakterli" },
  { id: "dark-luxe", label: "Dark Luxe", description: "Koyu ve premium" },
  { id: "playful", label: "Enerjik", description: "Renkli ve hareketli" },
];

const fontOptions: Array<{ id: MenuTheme["font"]; label: string; sample: string }> = [
  { id: "modern", label: "Modern", sample: "Aa" },
  { id: "editorial", label: "Editoryal", sample: "Aa" },
  { id: "friendly", label: "Samimi", sample: "Aa" },
];

type ThemeChoiceOption<Value extends string> = { id: Value; label: string };

const cardStyleOptions: Array<ThemeChoiceOption<MenuCardStyle>> = [
  { id: "flat", label: "Düz" },
  { id: "outlined", label: "Çizgili" },
  { id: "elevated", label: "Gölgeli" },
];
const cornerStyleOptions: Array<ThemeChoiceOption<MenuCornerStyle>> = [
  { id: "square", label: "Keskin" },
  { id: "soft", label: "Yumuşak" },
  { id: "rounded", label: "Yuvarlak" },
];
const densityOptions: Array<ThemeChoiceOption<MenuDensity>> = [
  { id: "compact", label: "Sıkı" },
  { id: "comfortable", label: "Dengeli" },
  { id: "airy", label: "Ferah" },
];
const imageRatioOptions: Array<ThemeChoiceOption<MenuImageRatio>> = [
  { id: "square", label: "Kare" },
  { id: "portrait", label: "Dikey" },
  { id: "landscape", label: "Yatay" },
];
const priceStyleOptions: Array<ThemeChoiceOption<MenuPriceStyle>> = [
  { id: "plain", label: "Sade" },
  { id: "pill", label: "Rozet" },
  { id: "accent", label: "Çizgili" },
];
const categoryStyleOptions: Array<ThemeChoiceOption<MenuCategoryStyle>> = [
  { id: "pills", label: "Buton" },
  { id: "underline", label: "Alt çizgi" },
  { id: "minimal", label: "Minimal" },
];
const heroStyleOptions: Array<ThemeChoiceOption<MenuHeroStyle>> = [
  { id: "clean", label: "Sade" },
  { id: "tinted", label: "Renkli" },
  { id: "pattern", label: "Desenli" },
];

const studioOptionLabelsEn: Record<string, string> = {
  "AI tasarım": "AI design",
  "Alt çizgi": "Underline",
  "Arka plan": "Background",
  "Botanik": "Botanical",
  "Buton": "Pills",
  "Dengeli": "Comfortable",
  "Desenli": "Pattern",
  "Dikey": "Portrait",
  "Doğal ve ferah": "Natural and fresh",
  "Düz": "Flat",
  "Editoryal": "Editorial",
  "Enerjik": "Playful",
  "Ferah": "Airy",
  "Gölgeli": "Elevated",
  "Hazır stiller": "Presets",
  "İngilizce": "English",
  "İnce ayar": "Fine tuning",
  "İşletme profili": "Business profile",
  "Kare": "Square",
  "Kartlar": "Cards",
  "Keskin": "Square",
  "Koyu ve premium": "Dark and premium",
  "Metin": "Text",
  "Menü bilgileri": "Menu details",
  "Renk ve yazı": "Color and type",
  "Renkli": "Tinted",
  "Renkli ve hareketli": "Colorful and lively",
  "Rozet": "Pill",
  "Sade": "Plain",
  "Samimi": "Friendly",
  "Sıcak ve dengeli": "Warm and balanced",
  "Sıkı": "Compact",
  "Şık ve karakterli": "Elegant and distinctive",
  "Temiz ve hızlı okunan": "Clean and easy to scan",
  "Ürünler": "Items",
  "Vurgu": "Accent",
  "Yerleşim": "Layout",
  "Yatay": "Landscape",
  "Yumuşak": "Soft",
  "Yuvarlak": "Rounded",
  "Çizgili": "Outlined",
};

function localizeStudioOption<Value extends { label: string }>(option: Value, locale: AppLocale): Value {
  if (locale === "tr") return option;
  return { ...option, label: studioOptionLabelsEn[option.label] || option.label };
}

type ThemeColorKey = "accent" | "background" | "surface" | "text";

const themeColorOptions: Array<{
  id: ThemeColorKey;
  label: string;
}> = [
  { id: "accent", label: "Vurgu" },
  { id: "background", label: "Arka plan" },
  { id: "surface", label: "Kartlar" },
  { id: "text", label: "Metin" },
];

const themeBriefSuggestionsTr = [
  "Sıcak ve modern",
  "Minimal ve premium",
  "Doğal ve ferah",
  "Renkli ve enerjik",
] as const;

const themeBriefSuggestionsEn = [
  "Warm and modern",
  "Minimal and premium",
  "Natural and fresh",
  "Colorful and energetic",
] as const;

const starterIcons: Record<MenuStarterId, typeof FileText> = {
  restaurant: Utensils,
  cafe: Coffee,
  patisserie: CakeSlice,
  bakery: Croissant,
  "fast-food": Sandwich,
  hotel: BedDouble,
  blank: FilePlus2,
};

const starterCurrencyOptions: Array<{ en: string; tr: string; value: MenuStarterCurrency }> = [
  { value: "₺", en: "₺ Turkish lira", tr: "₺ Türk lirası" },
  { value: "$", en: "$ US dollar", tr: "$ ABD doları" },
  { value: "€", en: "€ Euro", tr: "€ Euro" },
  { value: "£", en: "£ British pound", tr: "£ İngiliz sterlini" },
];

const menuSourceLanguageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "de", label: "Deutsch" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
  { value: "pt", label: "Português" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "nl", label: "Nederlands" },
  { value: "pl", label: "Polski" },
  { value: "ru", label: "Русский" },
  { value: "uk", label: "Українська" },
  { value: "el", label: "Ελληνικά" },
  { value: "he", label: "עברית" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "th", label: "ไทย" },
] as const;

type ContentSectionId = "products" | "basics" | "business" | "language";
type DesignSectionId = "presets" | "ai" | "brand" | "layout" | "advanced";

const contentSectionLinks: Array<{ id: ContentSectionId; label: string }> = [
  { id: "products", label: "Ürünler" },
  { id: "basics", label: "Menü bilgileri" },
  { id: "business", label: "İşletme profili" },
  { id: "language", label: "İngilizce" },
];

const designSectionLinks: Array<{ id: DesignSectionId; label: string }> = [
  { id: "presets", label: "Hazır stiller" },
  { id: "ai", label: "AI tasarım" },
  { id: "layout", label: "Yerleşim" },
  { id: "brand", label: "Renk ve yazı" },
  { id: "advanced", label: "İnce ayar" },
];

function ThemeChoiceGroup<Value extends string>({
  description,
  label,
  onChange,
  options,
  value,
}: {
  description: string;
  label: string;
  onChange: (value: Value) => void;
  options: Array<ThemeChoiceOption<Value>>;
  value: Value;
}) {
  return (
    <div className="theme-choice-group">
      <div><strong>{label}</strong><small>{description}</small></div>
      <div className="theme-choice-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            aria-pressed={value === option.id}
            className={value === option.id ? "active" : ""}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >{option.label}</button>
        ))}
      </div>
    </div>
  );
}

const weekdayLabels: Record<MenuWeekday, string> = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

const weekdayLabelsEn: Record<MenuWeekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const timezoneOptions = [
  { value: "UTC", en: "UTC", tr: "UTC" },
  { value: "Europe/Istanbul", en: "Türkiye · Istanbul", tr: "Türkiye · İstanbul" },
  { value: "Europe/London", en: "United Kingdom · London", tr: "Birleşik Krallık · Londra" },
  { value: "Europe/Berlin", en: "Germany · Berlin", tr: "Almanya · Berlin" },
  { value: "Europe/Paris", en: "France · Paris", tr: "Fransa · Paris" },
  { value: "Europe/Madrid", en: "Spain · Madrid", tr: "İspanya · Madrid" },
  { value: "Europe/Rome", en: "Italy · Rome", tr: "İtalya · Roma" },
  { value: "Europe/Amsterdam", en: "Netherlands · Amsterdam", tr: "Hollanda · Amsterdam" },
  { value: "Europe/Athens", en: "Greece · Athens", tr: "Yunanistan · Atina" },
  { value: "Europe/Warsaw", en: "Poland · Warsaw", tr: "Polonya · Varşova" },
  { value: "Europe/Kyiv", en: "Ukraine · Kyiv", tr: "Ukrayna · Kyiv" },
  { value: "Europe/Moscow", en: "Russia · Moscow", tr: "Rusya · Moskova" },
  { value: "Asia/Dubai", en: "United Arab Emirates · Dubai", tr: "BAE · Dubai" },
  { value: "Asia/Riyadh", en: "Saudi Arabia · Riyadh", tr: "Suudi Arabistan · Riyad" },
  { value: "Asia/Jerusalem", en: "Israel · Jerusalem", tr: "İsrail · Kudüs" },
  { value: "Asia/Singapore", en: "Singapore", tr: "Singapur" },
  { value: "Asia/Shanghai", en: "China · Shanghai", tr: "Çin · Şanghay" },
  { value: "Asia/Hong_Kong", en: "Hong Kong", tr: "Hong Kong" },
  { value: "Asia/Tokyo", en: "Japan · Tokyo", tr: "Japonya · Tokyo" },
  { value: "Asia/Seoul", en: "South Korea · Seoul", tr: "Güney Kore · Seul" },
  { value: "Asia/Kolkata", en: "India · Kolkata", tr: "Hindistan · Kolkata" },
  { value: "Asia/Bangkok", en: "Thailand · Bangkok", tr: "Tayland · Bangkok" },
  { value: "Asia/Ho_Chi_Minh", en: "Vietnam · Ho Chi Minh City", tr: "Vietnam · Ho Chi Minh" },
  { value: "Asia/Jakarta", en: "Indonesia · Jakarta", tr: "Endonezya · Cakarta" },
  { value: "America/New_York", en: "USA · New York", tr: "ABD · New York" },
  { value: "America/Chicago", en: "USA · Chicago", tr: "ABD · Chicago" },
  { value: "America/Denver", en: "USA · Denver", tr: "ABD · Denver" },
  { value: "America/Los_Angeles", en: "USA · Los Angeles", tr: "ABD · Los Angeles" },
  { value: "America/Toronto", en: "Canada · Toronto", tr: "Kanada · Toronto" },
  { value: "America/Mexico_City", en: "Mexico · Mexico City", tr: "Meksika · Meksiko" },
  { value: "America/Bogota", en: "Colombia · Bogotá", tr: "Kolombiya · Bogotá" },
  { value: "America/Lima", en: "Peru · Lima", tr: "Peru · Lima" },
  { value: "America/Sao_Paulo", en: "Brazil · São Paulo", tr: "Brezilya · São Paulo" },
  { value: "America/Argentina/Buenos_Aires", en: "Argentina · Buenos Aires", tr: "Arjantin · Buenos Aires" },
  { value: "America/Santiago", en: "Chile · Santiago", tr: "Şili · Santiago" },
  { value: "Africa/Johannesburg", en: "South Africa · Johannesburg", tr: "Güney Afrika · Johannesburg" },
  { value: "Australia/Sydney", en: "Australia · Sydney", tr: "Avustralya · Sydney" },
  { value: "Pacific/Auckland", en: "New Zealand · Auckland", tr: "Yeni Zelanda · Auckland" },
] as const;

function cloneDemoMenu(locale: AppLocale) {
  return JSON.parse(JSON.stringify(getDemoMenu(locale))) as MenuData;
}

function fileToDataUrl(file: File, locale: AppLocale) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(locale === "tr" ? "Dosya okunamadı." : "Could not read the file."));
    reader.readAsDataURL(file);
  });
}

function loadBrowserImage(source: string, locale: AppLocale) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(locale === "tr" ? "Görsel açılamadı." : "Could not open the image."));
    image.src = source;
  });
}

async function prepareProductImageSource(
  source: string,
  maxDimension = 900,
  maxDataUrlLength = 750_000,
  locale: AppLocale = "en",
) {
  const image = await loadBrowserImage(source, locale);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error(locale === "tr" ? "Görsel işlenemedi." : "Could not process the image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const qualities = [0.78, 0.66, 0.56, 0.46, 0.36];
  let result = "";
  for (const quality of qualities) {
    result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= maxDataUrlLength) return result;
  }
  throw new Error(locale === "tr" ? "Görsel menü için yeterince küçültülemedi." : "The image could not be reduced enough for the menu.");
}

async function prepareProductImage(file: File, locale: AppLocale) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(locale === "tr" ? "Ürün görseli JPG, PNG veya WEBP olmalı." : "The item image must be JPG, PNG, or WEBP.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error(locale === "tr" ? "Ürün görseli 8 MB’tan küçük olmalı." : "The item image must be smaller than 8 MB.");
  }

  return prepareProductImageSource(await fileToDataUrl(file, locale), 900, 750_000, locale);
}

async function prepareBusinessLogo(file: File, locale: AppLocale) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error(locale === "tr" ? "Logo JPG, PNG veya WEBP olmalı." : "The logo must be JPG, PNG, or WEBP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(locale === "tr" ? "Logo 5 MB’tan küçük olmalı." : "The logo must be smaller than 5 MB.");
  }

  const image = await loadBrowserImage(await fileToDataUrl(file, locale), locale);
  const dimensions = [480, 360, 280, 220];
  const qualities = [0.88, 0.76, 0.64];

  for (const maxDimension of dimensions) {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error(locale === "tr" ? "Logo işlenemedi." : "Could not process the logo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const result = canvas.toDataURL("image/webp", quality);
      if (result.length <= 500_000) return result;
    }
  }

  throw new Error(locale === "tr" ? "Logo menü için yeterince küçültülemedi." : "The logo could not be reduced enough for the menu.");
}

function getErrorMessage(error: unknown, locale: AppLocale = "en") {
  return error instanceof Error ? error.message : locale === "tr" ? "Beklenmeyen bir sorun oluştu." : "Something unexpected happened.";
}

function getEnglishTranslationCoverage(menu: MenuData) {
  const total = 2 + menu.categories.reduce(
    (sum, category) => sum + 1 + category.items.length * 3,
    0,
  );
  let translated = 0;
  if (typeof menu.translations?.en?.restaurantName === "string") translated += 1;
  if (typeof menu.translations?.en?.subtitle === "string") translated += 1;

  menu.categories.forEach((category) => {
    if (typeof category.translations?.en?.name === "string") translated += 1;
    category.items.forEach((item) => {
      if (typeof item.translations?.en?.name === "string") translated += 1;
      if (typeof item.translations?.en?.description === "string") translated += 1;
      if (typeof item.translations?.en?.badge === "string") translated += 1;
    });
  });

  return {
    translated,
    total,
    percentage: Math.round((translated / total) * 100),
  };
}

export function MenuStudio({
  workspaceMode = false,
  initialUser = null,
}: {
  workspaceMode?: boolean;
  initialUser?: AuthUser | null;
}) {
  const { intlLocale, locale } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const inputRef = useRef<HTMLInputElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const saveQueueRef = useRef<ReturnType<typeof createMenuSaveQueue> | null>(null);
  if (!saveQueueRef.current) saveQueueRef.current = createMenuSaveQueue(fetch, locale);
  const lastSavedRef = useRef<PublishedMenu | null>(null);
  const publishingRef = useRef(false);
  const creatingStarterRef = useRef(false);
  const themeColorFrameRef = useRef<number | null>(null);
  const pendingThemeColorRef = useRef<{ key: ThemeColorKey; value: string } | null>(null);
  const [screen, setScreen] = useState<"upload" | "studio">("upload");
  const [starterPickerOpen, setStarterPickerOpen] = useState(false);
  const [selectedStarterId, setSelectedStarterId] = useState<MenuStarterId>("restaurant");
  const [starterBusinessName, setStarterBusinessName] = useState("");
  const [starterCurrency, setStarterCurrency] = useState<MenuStarterCurrency>(
    () => locale === "tr" ? "₺" : "$",
  );
  const [creatingStarter, setCreatingStarter] = useState(false);
  const [starterError, setStarterError] = useState("");
  const [tab, setTab] = useState<StudioEditorTab>("content");
  const [contentSection, setContentSection] = useState<ContentSectionId>("products");
  const [designSection, setDesignSection] = useState<DesignSectionId>("presets");
  const [productQuery, setProductQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState("");
  const [categoryOpenState, setCategoryOpenState] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuData>(() => cloneDemoMenu(locale));
  const [theme, setTheme] = useState<MenuTheme>(defaultTheme);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [publishReviewOpen, setPublishReviewOpen] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [inlinePreviewOpen, setInlinePreviewOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [publicPayload, setPublicPayload] = useState<PublishedMenu | null>(null);
  const [publicError, setPublicError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser);
  const [authStatus, setAuthStatus] = useState<"loading" | "authenticated" | "anonymous">(
    initialUser ? "authenticated" : "loading",
  );
  const [activeMenuId, setActiveMenuId] = useState("");
  const [activeMenuSlug, setActiveMenuSlug] = useState("");
  const [activeMenuStatus, setActiveMenuStatus] = useState<"draft" | "published">("draft");
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [saveError, setSaveError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const latestContentRef = useRef({ menu, theme });
  latestContentRef.current = { menu, theme };
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState("");
  const [imageGenerationProgress, setImageGenerationProgress] = useState({ done: 0, total: 0 });
  const [translatingEnglish, setTranslatingEnglish] = useState(false);
  const [themeBrief, setThemeBrief] = useState("");
  const [generatingTheme, setGeneratingTheme] = useState(false);
  const [themeCreditBalance, setThemeCreditBalance] = useState<number | null>(null);
  const [themeCreditsLoading, setThemeCreditsLoading] = useState(false);
  const [themeCreditsFailed, setThemeCreditsFailed] = useState(false);
  const [themeDesignFeedback, setThemeDesignFeedback] = useState<ThemeDesignFeedback | null>(null);
  const [previousTheme, setPreviousTheme] = useState<MenuTheme | null>(null);
  useModalFocus(
    mobilePreviewOpen ? "preview" : publishOpen ? "published" : publishReviewOpen ? "review" : starterPickerOpen ? "starter" : null,
    () => {
      if (mobilePreviewOpen) setMobilePreviewOpen(false);
      else if (publishOpen) setPublishOpen(false);
      else if (publishReviewOpen) setPublishReviewOpen(false);
      else setStarterPickerOpen(false);
    },
    !publishing && !creatingStarter,
  );
  const themeAccessibilityIssues = getThemeAccessibilityIssues(theme);
  const sourceIsEnglish = /^en(?:-|$)/i.test(menu.sourceLanguage || "");
  const sourceLanguageLabel = menuSourceLanguageOptions.find((option) => option.value === menu.sourceLanguage)?.label || menu.sourceLanguage || t("source language", "kaynak dil");
  const localizedContentSectionLinks = contentSectionLinks
    .filter((section) => section.id !== "language" || !sourceIsEnglish)
    .map((section) => localizeStudioOption(section, locale));
  const localizedDesignSectionLinks = designSectionLinks.map((section) => localizeStudioOption(section, locale));
  const localizedThemePresetOptions = themePresetOptions.map((option) => ({
    ...localizeStudioOption(option, locale),
    description: locale === "tr" ? option.description : studioOptionLabelsEn[option.description] || option.description,
  }));
  const localizedWeekdayLabels = locale === "tr" ? weekdayLabels : weekdayLabelsEn;
  const localizedThemeBriefSuggestions = locale === "tr" ? themeBriefSuggestionsTr : themeBriefSuggestionsEn;
  const availableMenuStarters = getMenuStarters(locale);
  const selectedStarter = getMenuStarter(selectedStarterId, locale);
  const SelectedStarterIcon = starterIcons[selectedStarter.id];
  const selectedStarterItemCount = selectedStarter.categories.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const totalItemCount = menu.categories.reduce((sum, category) => sum + category.items.length, 0);
  const missingImageCount = menu.categories.reduce(
    (sum, category) =>
      sum + category.items.filter((item) => !item.image && item.availability !== "hidden").length,
    0,
  );
  const normalizedProductQuery = productQuery.trim().toLocaleLowerCase(intlLocale);
  const editorCategories = menu.categories
    .map((category, categoryIndex) => {
      const categoryMatches = category.name.toLocaleLowerCase(intlLocale).includes(normalizedProductQuery);
      const items = category.items
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => {
          if (!normalizedProductQuery || categoryMatches) return true;
          return [item.name, item.description, item.badge, item.price]
            .some((value) => value.toLocaleLowerCase(intlLocale).includes(normalizedProductQuery));
        });
      return { category, categoryIndex, categoryMatches, items };
    })
    .filter(({ categoryMatches, items }) => !normalizedProductQuery || categoryMatches || items.length > 0);
  const filteredItemCount = editorCategories.reduce((sum, category) => sum + category.items.length, 0);
  const productEditorItems = menu.categories.flatMap((category, categoryIndex) =>
    category.items.map((item, itemIndex) => ({ category, categoryIndex, item, itemIndex })),
  );
  const activeProductIndex = productEditorItems.findIndex(({ item }) => item.id === expandedItemId);
  const activeProductEditor = activeProductIndex >= 0
    ? productEditorItems[activeProductIndex]
    : null;
  const previousProduct = activeProductIndex > 0
    ? productEditorItems[activeProductIndex - 1]
    : null;
  const nextProduct = activeProductIndex >= 0 && activeProductIndex < productEditorItems.length - 1
    ? productEditorItems[activeProductIndex + 1]
    : null;
  const englishCoverage = getEnglishTranslationCoverage(menu);
  const hasEnglishTranslation = hasEnglishMenuTranslation(menu);
  const publishQrUrl = buildMenuTrafficUrl(publishUrl, "qr");
  const englishTranslationCurrent = hasEnglishTranslation &&
    englishCoverage.percentage === 100 &&
    menu.translations?.en?.sourceFingerprint === getMenuTranslationFingerprint(menu);
  const businessProfile = getMenuBusinessProfile(menu);
  const publishReadiness = getMenuReadiness(menu, locale);
  const themeCreditsInsufficient = themeCreditBalance !== null &&
    themeCreditBalance < aiCreditCosts.themeDesign;
  const changeEditorTab = (nextTab: StudioEditorTab) => {
    setTab(nextTab);
    if (nextTab === "design" && !window.matchMedia("(max-width: 760px)").matches) setInlinePreviewOpen(true);
    setExpandedItemId("");
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const changeContentSection = (nextSection: ContentSectionId) => {
    setContentSection(nextSection);
    setExpandedItemId("");
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const changeDesignSection = (nextSection: DesignSectionId) => {
    setDesignSection(nextSection);
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const openCategory = (categoryId: string) => {
    setProductQuery("");
    setExpandedItemId("");
    setCategoryOpenState({ [categoryId]: true });
    revealEditorElement(`studio-category-${categoryId}`);
  };

  const openProductEditor = (itemId: string) => {
    setExpandedItemId(itemId);
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const returnToProductList = (categoryId: string) => {
    setExpandedItemId("");
    setCategoryOpenState({ [categoryId]: true });
    revealEditorElement(`studio-category-${categoryId}`);
  };

  const revealEditorElement = (elementId: string, inputSelector?: string) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const element = document.getElementById(elementId);
        element?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
        if (inputSelector) {
          element?.querySelector<HTMLInputElement>(inputSelector)?.focus({ preventScroll: true });
        }
      });
    });
  };

  const updateThemeOption = <Key extends keyof MenuTheme>(
    key: Key,
    value: MenuTheme[Key],
  ) => {
    if (Object.is(theme[key], value)) return;
    setPreviousTheme(null);
    setThemeDesignFeedback((current) => current?.tone === "success" ? null : current);
    setTheme((current) => Object.is(current[key], value)
      ? current
      : { ...current, [key]: value, stylePreset: "custom" });
  };

  const updateThemeColor = (key: ThemeColorKey, value: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(value) || Object.is(theme[key], value)) return;
    pendingThemeColorRef.current = { key, value };
    if (themeColorFrameRef.current !== null) return;

    themeColorFrameRef.current = window.requestAnimationFrame(() => {
      themeColorFrameRef.current = null;
      const pendingColor = pendingThemeColorRef.current;
      pendingThemeColorRef.current = null;
      if (!pendingColor) return;

      setPreviousTheme(null);
      setThemeDesignFeedback((current) => current?.tone === "success" ? null : current);
      setTheme((current) => Object.is(current[pendingColor.key], pendingColor.value)
        ? current
        : { ...current, [pendingColor.key]: pendingColor.value, stylePreset: "custom" });
    });
  };

  useEffect(() => () => {
    if (themeColorFrameRef.current !== null) {
      window.cancelAnimationFrame(themeColorFrameRef.current);
    }
  }, []);

  useEffect(() => {
    const readHash = async () => {
      if (!window.location.hash.startsWith("#menu=")) return;
      try {
        const payload = await decodePublishedMenu(window.location.hash.slice(6), locale);
        setPublicPayload(payload);
      } catch (decodeError) {
        setPublicError(getErrorMessage(decodeError, locale));
      }
    };
    void readHash();
  }, [locale]);

  useEffect(() => {
    if (window.location.hash.startsWith("#menu=")) return;
    const controller = new AbortController();
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
        const result = (await response.json()) as { user: AuthUser | null };
        if (!result.user) {
          setAuthStatus("anonymous");
          return;
        }

        setCurrentUser(result.user);
        setAuthStatus("authenticated");
        const searchParams = new URLSearchParams(window.location.search);
        const requestedMenuId = searchParams.get("menu");
        const shouldOpenPublishReview = searchParams.get("publish") === "1";
        if (requestedMenuId) {
          const menuResponse = await fetch(`/api/menus/${requestedMenuId}`, { cache: "no-store", signal: controller.signal });
          if (menuResponse.ok) {
            const menuResult = (await menuResponse.json()) as { menu: StoredMenu };
            setMenu(menuResult.menu.menu);
            const loadedTheme = normalizeMenuTheme(menuResult.menu.theme);
            setTheme(loadedTheme);
            lastSavedRef.current = { menu: menuResult.menu.menu, theme: loadedTheme };
            saveQueueRef.current!.acknowledge(menuResult.menu);
            setActiveMenuId(menuResult.menu.id);
            setActiveMenuSlug(menuResult.menu.slug);
            setActiveMenuStatus(menuResult.menu.status);
            setHasUnpublishedChanges(menuResult.menu.hasUnpublishedChanges);
            setScreen("studio");
            if (shouldOpenPublishReview) {
              setPublishError("");
              setPublishReviewOpen(true);
            }
          } else {
            setError(t("The menu you tried to open could not be found.", "Açmak istediğin menü bulunamadı."));
          }
          return;
        }
        if (searchParams.has("new")) return;

        const draftKey = `easyqr-draft:${result.user.id}`;
        let draft: string | null = null;
        try {
          draft = window.localStorage.getItem(draftKey);
        } catch {
          return;
        }
        if (!draft) return;
        try {
          const saved = JSON.parse(draft) as PublishedMenu;
          if (isValidMenuData(saved?.menu) && isValidMenuTheme(saved?.theme)) {
            setMenu(saved.menu);
            setTheme(normalizeMenuTheme(saved.theme));
            setNotice(t("Your latest draft was restored for this account.", "Son taslağın hesabın için geri yüklendi."));
            setSaveStatus("error");
            setSaveError(t("This draft has not been saved to your account yet. Use Retry to save it.", "Bu taslak henüz hesabına kaydedilmedi. Yeniden dene düğmesiyle kaydet."));
            setScreen("studio");
          }
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      } catch {
        if (!controller.signal.aborted) setAuthStatus("anonymous");
      }
    };
    void loadUser();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (screen !== "studio" || tab !== "design" || !currentUser) return;
    const controller = new AbortController();
    setThemeCreditsLoading(true);
    setThemeCreditsFailed(false);

    const loadThemeCredits = async () => {
      try {
        const response = await fetch("/api/ai-credits", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as {
          credits?: { balance: number };
        };
        if (!response.ok || !result.credits) throw new Error(t("Could not load credit information.", "Kredi bilgisi alınamadı."));
        setThemeCreditBalance(result.credits.balance);
      } catch (creditError) {
        if ((creditError as Error).name !== "AbortError") setThemeCreditsFailed(true);
      } finally {
        if (!controller.signal.aborted) setThemeCreditsLoading(false);
      }
    };

    void loadThemeCredits();
    return () => controller.abort();
  }, [currentUser, screen, tab]);

  useEffect(() => {
    if (screen !== "studio" || !currentUser) return;
    const draftKey = `easyqr-draft:${currentUser.id}`;

    try {
      if (activeMenuId) {
        window.localStorage.removeItem(draftKey);
        return;
      }
      window.localStorage.setItem(draftKey, JSON.stringify({ menu, theme }));
    } catch {
      // Browsers can deny storage or exhaust their small localStorage quota
      // when a draft contains images. Keep a text-only recovery copy instead.
      const compactMenu: MenuData = {
        ...menu,
        businessProfile: menu.businessProfile
          ? { ...menu.businessProfile, logo: "" }
          : undefined,
        categories: menu.categories.map((category) => ({
          ...category,
          items: category.items.map((item) => ({ ...item, image: "" })),
        })),
      };
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({ menu: compactMenu, theme }),
        );
      } catch {
        try {
          window.localStorage.removeItem(draftKey);
        } catch {
          // Storage is unavailable; server autosave still protects saved menus.
        }
      }
    }
  }, [activeMenuId, currentUser, menu, screen, theme]);

  const cancelPendingAutosave = () => {
    if (autoSaveTimeoutRef.current !== null) {
      window.clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
  };

  const saveSnapshot = async (id: string, snapshot: PublishedMenu, publish = false) => {
    setSaveStatus("saving");
    try {
      const stored = await saveQueueRef.current!.save({ id, ...snapshot, publish });
      lastSavedRef.current = snapshot;
      const isCurrent = latestContentRef.current.menu === snapshot.menu &&
        latestContentRef.current.theme === snapshot.theme;
      setHasUnpublishedChanges(stored.hasUnpublishedChanges || (!isCurrent && stored.status === "published"));
      setSaveStatus(isCurrent ? "saved" : "saving");
      setSaveError("");
      return stored;
    } catch (error) {
      setSaveStatus("error");
      setSaveError(getErrorMessage(error, locale));
      throw error;
    }
  };

  useEffect(() => {
    if (screen !== "studio" || !currentUser || !activeMenuId) return;
    if (lastSavedRef.current?.menu === menu && lastSavedRef.current?.theme === theme) return;
    setSaveStatus("saving");
    if (activeMenuStatus === "published") setHasUnpublishedChanges(true);
    const timeout = window.setTimeout(() => {
      autoSaveTimeoutRef.current = null;
      void saveSnapshot(activeMenuId, { menu, theme }).catch(() => undefined);
    }, 650);
    autoSaveTimeoutRef.current = timeout;
    return () => {
      window.clearTimeout(timeout);
      if (autoSaveTimeoutRef.current === timeout) autoSaveTimeoutRef.current = null;
    };
  }, [activeMenuId, currentUser, menu, screen, theme]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      const latest = latestContentRef.current;
      if (screen === "studio" && (lastSavedRef.current?.menu !== latest.menu ||
        lastSavedRef.current?.theme !== latest.theme)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [screen]);

  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(latestContentRef.current, null, 2)], {
      type: "application/json",
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "easyqr-taslak.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restoreDraft = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error(t("The draft file must be smaller than 12 MB.", "Taslak dosyası 12 MB'tan küçük olmalı."));
      const restored = JSON.parse(await file.text()) as PublishedMenu;
      if (!isValidMenuData(restored?.menu) || !isValidMenuTheme(restored?.theme)) {
        throw new Error(t("This is not a valid easyqr draft file.", "Bu dosya geçerli bir easyqr taslağı değil."));
      }
      if (!window.confirm(t("The file will replace this draft. The live menu will stay unchanged until you publish again. Continue?", "Dosyadaki içerik bu menünün taslağının yerine geçecek. Canlı menü, yeniden yayınlayana kadar değişmez. Devam edilsin mi?"))) return;
      cancelPendingAutosave();
      setMenu(restored.menu);
      setTheme(normalizeMenuTheme(restored.theme));
      setNotice(t("Draft restored. Review the content before publishing.", "Taslak dosyası geri yüklendi. Yayınlamadan önce içeriği kontrol et."));
    } catch (error) { setNotice(getErrorMessage(error, locale)); }
  };

  const persistNewMenu = async (newMenu: MenuData, newTheme: MenuTheme) => {
    const response = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu: newMenu, theme: newTheme }),
    });
    const result = (await response.json()) as { menu?: StoredMenu; message?: string };
    if (!response.ok || !result.menu) throw new Error(result.message || t("Could not save the menu.", "Menü kaydedilemedi."));
    saveQueueRef.current!.acknowledge(result.menu);
    lastSavedRef.current = { menu: newMenu, theme: newTheme };
    setActiveMenuId(result.menu.id);
    setActiveMenuSlug(result.menu.slug);
    setActiveMenuStatus(result.menu.status);
    setHasUnpublishedChanges(result.menu.hasUnpublishedChanges);
    window.history.replaceState(null, "", `/studio?menu=${result.menu.id}`);
    return result.menu;
  };

  const goToLogin = () => {
    window.location.href = `${getLocalizedAppPath(locale, "login")}?next=%2Fstudio%3Fnew%3D1`;
  };

  const requestUpload = () => {
    if (!currentUser) {
      goToLogin();
      return;
    }
    inputRef.current?.click();
  };

  const openStarterPicker = () => {
    setStarterError("");
    setStarterPickerOpen(true);
  };

  const createStarterDraft = async () => {
    if (creatingStarterRef.current) return;
    if (!currentUser) {
      goToLogin();
      return;
    }

    const starterMenu = createMenuFromStarter(
      selectedStarterId,
      starterBusinessName,
      starterCurrency,
      locale,
    );
    const starterTheme = { ...menuThemePresets[selectedStarter.themePresetId] };
    creatingStarterRef.current = true;
    setCreatingStarter(true);
    setStarterError("");

    try {
      await persistNewMenu(starterMenu, starterTheme);
      setMenu(starterMenu);
      setTheme(starterTheme);
      setTab("content");
      setContentSection("products");
      setProductQuery("");
      setExpandedItemId("");
      setCategoryOpenState(
        starterMenu.categories[0]
          ? { [starterMenu.categories[0].id]: true }
          : {},
      );
      setNotice(
        selectedStarter.id === "blank"
          ? t("Your blank draft is ready — add your first category and item.", "Boş taslağın hazır — ilk kategorini ve ürünlerini ekleyebilirsin.")
          : t(`${selectedStarter.label} is ready — customize the sample content for your venue.`, `${selectedStarter.label} şablonu hazır — örnek içerikleri işletmene göre düzenle.`),
      );
      setStarterPickerOpen(false);
      setScreen("studio");
    } catch (starterCreateError) {
      setStarterError(getErrorMessage(starterCreateError, locale));
      setSaveStatus("error");
    } finally {
      creatingStarterRef.current = false;
      setCreatingStarter(false);
    }
  };

  const processFile = async (file?: File) => {
    if (!file) return;
    if (!currentUser) {
      goToLogin();
      return;
    }
    const supported = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!supported.includes(file.type)) {
      setError(t("Choose a JPG, PNG, WEBP, or PDF file.", "Lütfen JPG, PNG, WEBP veya PDF biçiminde bir dosya seç."));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError(t("The file must be smaller than 12 MB.", "Dosya 12 MB’tan küçük olmalı."));
      return;
    }

    setError("");
    setNotice("");
    setFileName(file.name);
    setLoading(true);

    try {
      const dataUrl = await fileToDataUrl(file, locale);
      const response = await fetch("/api/extract-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataUrl }),
      });
      const cacheHit = response.headers.get("X-AI-Cache") === "HIT";
      const result = (await response.json()) as {
        menu?: MenuData;
        code?: string;
        message?: string;
      };

      if (!response.ok) {
        if (result.code === "AUTH_REQUIRED") {
          setCurrentUser(null);
          setAuthStatus("anonymous");
          goToLogin();
          return;
        }
        if (result.code === "AI_NOT_CONFIGURED") {
          const demo = cloneDemoMenu(locale);
          setMenu(demo);
          setNotice(
            t("Demo mode is active: you can design with sample items until an API key is configured.", "Demo modu açık: API anahtarı eklenene kadar örnek ürünlerle tasarım yapabilirsin."),
          );
          setScreen("studio");
          await persistNewMenu(demo, theme);
          return;
        }
        throw new Error(result.message || t("The menu could not be analyzed.", "Menü analiz edilemedi."));
      }
      if (!result.menu) throw new Error(t("No menu data was returned.", "Menü verisi alınamadı."));
      setMenu(result.menu);
      setNotice(
        cacheHit
          ? t(`${file.name} was analyzed before, so the menu was restored instantly from cache.`, `${file.name} daha önce analiz edilmişti; menü önbellekten anında getirildi.`)
          : t(`${file.name} was read successfully. Review prices before publishing.`, `${file.name} başarıyla okundu. Fiyatları yayınlamadan önce kontrol et.`),
      );
      setScreen("studio");
      await persistNewMenu(result.menu, theme);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, locale));
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void processFile(event.dataTransfer.files?.[0]);
  };

  const updateBusinessProfile = (patch: Partial<MenuBusinessProfile>) => {
    setMenu((current) => ({
      ...current,
      businessProfile: {
        ...getMenuBusinessProfile(current),
        ...patch,
      },
    }));
  };

  const updateBusinessHours = (
    weekday: MenuWeekday,
    patch: Partial<MenuBusinessProfile["weeklyHours"][MenuWeekday]>,
  ) => {
    setMenu((current) => {
      const currentProfile = getMenuBusinessProfile(current);
      return {
        ...current,
        businessProfile: {
          ...currentProfile,
          weeklyHours: {
            ...currentProfile.weeklyHours,
            [weekday]: {
              ...currentProfile.weeklyHours[weekday],
              ...patch,
            },
          },
        },
      };
    });
  };

  const updateBusinessLogo = async (file?: File) => {
    if (!file) return;
    try {
      const logo = await prepareBusinessLogo(file, locale);
      updateBusinessProfile({ logo });
      setNotice(t("The business logo was optimized and added to the menu.", "İşletme logosu menü için optimize edildi ve eklendi."));
    } catch (logoError) {
      setNotice(`${t("Could not add logo:", "Logo eklenemedi:")} ${getErrorMessage(logoError, locale)}`);
    }
  };

  const updateItem = (
    categoryIndex: number,
    itemIndex: number,
    key: keyof Omit<MenuItem, "id">,
    value: string | boolean,
  ) => {
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, currentItemIndex) =>
                currentItemIndex === itemIndex ? { ...item, [key]: value } : item,
              ),
            },
      ),
    }));
  };

  const toggleDietaryTag = (
    categoryIndex: number,
    itemIndex: number,
    tag: MenuDietaryTag,
  ) => {
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, currentItemIndex) => {
                if (currentItemIndex !== itemIndex) return item;
                const currentTags = item.dietaryTags || [];
                const removing = currentTags.includes(tag);
                let dietaryTags = removing
                  ? currentTags.filter((currentTag) => currentTag !== tag)
                  : [...currentTags, tag];

                if (!removing && tag === "vegan") {
                  dietaryTags = dietaryTags.filter((currentTag) => currentTag !== "vegetarian");
                }
                if (!removing && tag === "vegetarian") {
                  dietaryTags = dietaryTags.filter((currentTag) => currentTag !== "vegan");
                }

                const allergens = !removing && tag === "gluten-free"
                  ? (item.allergens || []).filter((allergen) => allergen !== "gluten")
                  : item.allergens || [];

                return { ...item, dietaryTags, allergens };
              }),
            },
      ),
    }));
  };

  const toggleAllergen = (
    categoryIndex: number,
    itemIndex: number,
    allergen: MenuAllergen,
  ) => {
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, currentCategoryIndex) =>
        currentCategoryIndex !== categoryIndex
          ? category
          : {
              ...category,
              items: category.items.map((item, currentItemIndex) => {
                if (currentItemIndex !== itemIndex) return item;
                const currentAllergens = item.allergens || [];
                const removing = currentAllergens.includes(allergen);
                const allergens = removing
                  ? currentAllergens.filter((currentAllergen) => currentAllergen !== allergen)
                  : [...currentAllergens, allergen];
                const dietaryTags = !removing && allergen === "gluten"
                  ? (item.dietaryTags || []).filter((tag) => tag !== "gluten-free")
                  : item.dietaryTags || [];

                return { ...item, dietaryTags, allergens };
              }),
            },
      ),
    }));
  };

  const addItem = (categoryIndex: number) => {
    const itemId = createId("item");
    const categoryId = menu.categories[categoryIndex]?.id;
    setProductQuery("");
    setExpandedItemId(itemId);
    if (categoryId) {
      setCategoryOpenState({ [categoryId]: true });
    }
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: itemId,
                  name: t("New item", "Yeni ürün"),
                  description: t("Item description", "Ürün açıklaması"),
                  price: "0",
                  badge: "",
                  originalPrice: "",
                  isCampaign: false,
                  image: "",
                  availability: "available",
                  dietaryTags: [],
                  allergens: [],
                },
              ],
            }
          : category,
      ),
    }));
    revealEditorElement(`studio-item-${itemId}`, ".item-name-input");
  };

  const updateItemImage = async (categoryIndex: number, itemIndex: number, file?: File) => {
    if (!file) return;
    try {
      const image = await prepareProductImage(file, locale);
      updateItem(categoryIndex, itemIndex, "image", image);
      setNotice(t("The item image was optimized and added to the menu.", "Ürün görseli menü için optimize edildi ve eklendi."));
    } catch (imageError) {
      setNotice(`${t("Could not add image:", "Görsel eklenemedi:")} ${getErrorMessage(imageError, locale)}`);
    }
  };

  const generateMissingImages = async () => {
    if (generatingImages || generatingItemId) return;

    const missingItems = menu.categories.flatMap((category) =>
      category.items
        .filter((item) => !item.image && item.availability !== "hidden")
        .map((item) => ({
          itemId: item.id,
          name: item.name,
          description: item.description,
          categoryName: category.name,
        })),
    );

    if (missingItems.length === 0) {
      setNotice(t("Every item already has an image.", "Tüm ürünlerin görseli zaten hazır."));
      return;
    }

    const currentImageSize = menu.categories.reduce(
      (menuTotal, category) =>
        menuTotal + category.items.reduce((categoryTotal, item) => categoryTotal + (item.image?.length || 0), 0),
      0,
    ) + (menu.businessProfile?.logo?.length || 0);
    const capacity = Math.max(0, Math.floor((8_000_000 - currentImageSize) / 420_000));
    const queue = missingItems.slice(0, Math.min(6, capacity));

    if (queue.length === 0) {
      setNotice(t("The menu is near its image storage limit. Remove or replace some large images to continue.", "Menü görsel depolama sınırına yaklaştı. Devam etmek için bazı büyük görselleri kaldır veya değiştir."));
      return;
    }

    setGeneratingImages(true);
    setImageGenerationProgress({ done: 0, total: queue.length });
    setNotice("");
    let completed = 0;
    let failed = 0;
    let cacheHits = 0;

    try {
      for (let index = 0; index < queue.length; index += 1) {
        const target = queue[index];
        const response = await fetch("/api/generate-product-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: target.name,
            description: target.description,
            categoryName: target.categoryName,
            restaurantName: menu.restaurantName,
            sourceLanguage: menu.sourceLanguage,
          }),
        });
        const cacheHit = response.headers.get("X-AI-Cache") === "HIT";

        let result: { imageDataUrl?: string; code?: string; message?: string } = {};
        try {
          result = (await response.json()) as typeof result;
        } catch {
          result = {};
        }

        if (!response.ok) {
          if ([401, 403, 429, 503].includes(response.status) || result.code === "AI_NOT_CONFIGURED") {
            throw new Error(result.message || t("The image service is currently unavailable.", "Görsel servisine şu anda ulaşılamıyor."));
          }
          failed += 1;
        } else if (!result.imageDataUrl) {
          failed += 1;
        } else {
          try {
            const optimizedImage = await prepareProductImageSource(result.imageDataUrl, 720, 420_000, locale);
            setMenu((current) => ({
              ...current,
              categories: current.categories.map((category) => ({
                ...category,
                items: category.items.map((item) =>
                  item.id === target.itemId && !item.image ? { ...item, image: optimizedImage } : item,
                ),
              })),
            }));
            completed += 1;
            if (cacheHit) cacheHits += 1;
          } catch {
            failed += 1;
          }
        }

        setImageGenerationProgress({ done: index + 1, total: queue.length });
      }

      if (completed === 0) {
        setNotice(t("Images could not be generated. Review the item names and descriptions, then try again.", "Görseller üretilemedi. Ürün adlarını ve açıklamalarını kontrol edip tekrar dene."));
      } else {
        const remaining = Math.max(0, missingItems.length - completed);
        let message = t(`${completed} item images were generated automatically.`, `${completed} ürün görseli otomatik oluşturuldu.`);
        if (cacheHits > 0) message += t(` ${cacheHits} came from cache.`, ` ${cacheHits} tanesi önbellekten getirildi.`);
        if (failed > 0) message += t(` ${failed} items were skipped.`, ` ${failed} ürün atlandı.`);
        if (remaining > 0) message += t(` Run it again for the remaining ${remaining} items.`, ` Kalan ${remaining} ürün için düğmeye tekrar basabilirsin.`);
        setNotice(message);
      }
    } catch (generationError) {
      const prefix = completed > 0 ? t(`${completed} images are ready. `, `${completed} görsel hazırlandı. `) : "";
      setNotice(prefix + getErrorMessage(generationError, locale));
    } finally {
      setGeneratingImages(false);
    }
  };

  const generateItemImage = async (categoryIndex: number, itemIndex: number) => {
    const category = menu.categories[categoryIndex];
    const item = category?.items[itemIndex];
    if (!category || !item || generatingImages || generatingItemId) return;

    const currentImageSize = menu.categories.reduce(
      (menuTotal, currentCategory) =>
        menuTotal + currentCategory.items.reduce(
          (categoryTotal, currentItem) => categoryTotal + (currentItem.image?.length || 0),
          0,
        ),
      0,
    ) + (menu.businessProfile?.logo?.length || 0);
    if (currentImageSize - (item.image?.length || 0) + 420_000 > 8_000_000) {
      setNotice(t("The menu is near its image storage limit. Remove or replace some large images first.", "Menü görsel depolama sınırına yaklaştı. Önce bazı büyük görselleri kaldır veya değiştir."));
      return;
    }

    setGeneratingItemId(item.id);
    setNotice("");
    try {
      const response = await fetch("/api/generate-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          categoryName: category.name,
          restaurantName: menu.restaurantName,
          sourceLanguage: menu.sourceLanguage,
          refresh: true,
        }),
      });

      let result: { imageDataUrl?: string; message?: string } = {};
      try {
        result = (await response.json()) as typeof result;
      } catch {
        result = {};
      }

      if (!response.ok || !result.imageDataUrl) {
        throw new Error(result.message || t("Could not generate an image for this item.", "Bu ürün için görsel üretilemedi."));
      }

      const optimizedImage = await prepareProductImageSource(result.imageDataUrl, 720, 420_000, locale);
      setMenu((current) => ({
        ...current,
        categories: current.categories.map((currentCategory) =>
          currentCategory.id === category.id
            ? {
                ...currentCategory,
                items: currentCategory.items.map((currentItem) =>
                  currentItem.id === item.id ? { ...currentItem, image: optimizedImage } : currentItem,
                ),
              }
            : currentCategory,
        ),
      }));
      setNotice(t(`A new AI image is ready for ${item.name.trim() || "the item"}.`, `${item.name.trim() || "Ürün"} için yeni AI görseli hazırlandı.`));
    } catch (generationError) {
      setNotice(t("Could not refresh image: ", "Görsel yenilenemedi: ") + getErrorMessage(generationError, locale));
    } finally {
      setGeneratingItemId("");
    }
  };

  const generateEnglishTranslation = async () => {
    if (translatingEnglish) return;

    const sourceFingerprint = getMenuTranslationFingerprint(menu);
    setTranslatingEnglish(true);
    setNotice("");
    try {
      const response = await fetch("/api/translate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName: menu.restaurantName,
          subtitle: menu.subtitle,
          categories: menu.categories.map((category) => ({
            categoryId: category.id,
            name: category.name,
            items: category.items.map((item) => ({
              itemId: item.id,
              name: item.name,
              description: item.description,
              badge: item.badge,
            })),
          })),
        }),
      });
      const cacheHit = response.headers.get("X-AI-Cache") === "HIT";

      let result: EnglishTranslationResult = {};
      try {
        result = (await response.json()) as EnglishTranslationResult;
      } catch {
        result = {};
      }
      if (!response.ok || !result.translation) {
        throw new Error(result.message || t("Could not create the English translation.", "İngilizce çeviri oluşturulamadı."));
      }

      const translation = result.translation;
      const translatedCategories = new Map(
        translation.categories.map((category) => [category.categoryId, category]),
      );
      setMenu((current) => ({
        ...current,
        translations: {
          ...current.translations,
          en: {
            restaurantName: translation.restaurantName,
            subtitle: translation.subtitle,
            sourceFingerprint,
          },
        },
        categories: current.categories.map((category) => {
          const translatedCategory = translatedCategories.get(category.id);
          if (!translatedCategory) return category;
          const translatedItems = new Map(
            translatedCategory.items.map((item) => [item.itemId, item]),
          );
          return {
            ...category,
            translations: {
              ...category.translations,
              en: { name: translatedCategory.name },
            },
            items: category.items.map((item) => {
              const translatedItem = translatedItems.get(item.id);
              if (!translatedItem) return item;
              return {
                ...item,
                translations: {
                  ...item.translations,
                  en: {
                    name: translatedItem.name,
                    description: translatedItem.description,
                    badge: translatedItem.badge,
                  },
                },
              };
            }),
          };
        }),
      }));
      setNotice(
        cacheHit
          ? t("This content was translated before, so the English menu was restored instantly from cache.", "Aynı içerik daha önce çevrilmişti; İngilizce menü önbellekten anında getirildi.")
          : t("The English translation is ready. Visitors using English will see it automatically.", "İngilizce çeviri hazır. Yabancı ziyaretçiler menüyü otomatik olarak İngilizce görecek."),
      );
    } catch (translationError) {
      setNotice(t("Could not create translation: ", "Çeviri oluşturulamadı: ") + getErrorMessage(translationError, locale));
    } finally {
      setTranslatingEnglish(false);
    }
  };

  const generateThemeDesign = async () => {
    if (generatingTheme) return;
    if (!currentUser) {
      goToLogin();
      return;
    }

    const brief = themeBrief.replace(/\s+/g, " ").trim();
    if (brief.length < 3) {
      setThemeDesignFeedback({
        tone: "error",
        title: t("Describe a direction", "Kısa bir yön tarif et"),
        message: t("For example: “warm, modern, with coffee tones.”", "Örneğin “sıcak, modern ve kahve tonlarında” yazabilirsin."),
      });
      return;
    }
    if (
      themeCreditBalance !== null &&
      themeCreditBalance < aiCreditCosts.themeDesign
    ) {
      setThemeDesignFeedback({
        tone: "error",
        title: t("Insufficient credit balance", "Kredi bakiyesi yetersiz"),
        message: t(`This design requires ${aiCreditCosts.themeDesign} credits.`, `Bu tasarım için ${aiCreditCosts.themeDesign} kredi gerekiyor.`),
      });
      return;
    }

    setGeneratingTheme(true);
    setThemeDesignFeedback(null);
    setThemeBrief(brief);

    try {
      let menuId = activeMenuId;
      if (!menuId) {
        const storedMenu = await persistNewMenu(menu, theme);
        menuId = storedMenu.id;
      } else {
        cancelPendingAutosave();
        await saveSnapshot(menuId, { menu, theme });
      }

      const response = await fetch("/api/generate-menu-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          menuId,
          requestId: window.crypto.randomUUID(),
        }),
      });
      let result: ThemeDesignApiResult = {};
      try {
        result = (await response.json()) as ThemeDesignApiResult;
      } catch {
        result = {};
      }

      if (result.credits && Number.isFinite(result.credits.balance)) {
        setThemeCreditBalance(result.credits.balance);
        setThemeCreditsFailed(false);
      }
      if (!response.ok || !result.design) {
        throw new Error(result.message || t("Could not create the AI design.", "AI tasarımı oluşturulamadı."));
      }

      setPreviousTheme(theme);
      setTheme(normalizeMenuTheme(result.design.theme));
      setThemeDesignFeedback({
        tone: "success",
        title: result.design.name,
        message: result.design.summary,
      });
    } catch (designError) {
      setThemeDesignFeedback({
        tone: "error",
        title: t("Could not create the design", "Tasarım oluşturulamadı"),
        message: getErrorMessage(designError, locale),
      });
    } finally {
      setGeneratingTheme(false);
    }
  };

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const removedItemId = menu.categories[categoryIndex]?.items[itemIndex]?.id;
    if (removedItemId && removedItemId === expandedItemId) setExpandedItemId("");
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex
          ? { ...category, items: category.items.filter((_, i) => i !== itemIndex) }
          : category,
      ),
    }));
  };

  const addCategory = () => {
    const categoryId = createId("category");
    setCategoryOpenState({ [categoryId]: true });
    setMenu((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: categoryId,
          name: t("New category", "Yeni kategori"),
          items: [],
        },
      ],
    }));
    revealEditorElement(`studio-category-${categoryId}`, "summary input");
  };

  const removeCategory = (categoryIndex: number) => {
    const removedCategoryId = menu.categories[categoryIndex]?.id;
    const removesActiveProduct = menu.categories[categoryIndex]?.items.some(
      (item) => item.id === expandedItemId,
    );
    if (removesActiveProduct) setExpandedItemId("");
    if (removedCategoryId) {
      setCategoryOpenState((current) => {
        const next = { ...current };
        delete next[removedCategoryId];
        return next;
      });
    }
    setMenu((current) => ({
      ...current,
      categories: current.categories.filter((_, index) => index !== categoryIndex),
    }));
  };

  const goToReadinessTarget = (target: MenuReadinessTarget) => {
    setPublishReviewOpen(false);
    setTab("content");
    setContentSection(target.section);
    setProductQuery("");
    const categoryId = target.categoryId;
    if (categoryId) {
      setCategoryOpenState({ [categoryId]: true });
    }
    if (target.itemId) setExpandedItemId(target.itemId);

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const elementId = target.itemId
          ? `studio-item-${target.itemId}`
          : target.categoryId
            ? `studio-category-${target.categoryId}`
            : `studio-content-${target.section}`;
        const targetElement = document.getElementById(elementId);
        targetElement?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });

        const fieldElement = target.field
          ? targetElement?.querySelector<HTMLElement>(`[data-readiness-field="${target.field}"]`)
          : null;
        const focusElement = fieldElement?.matches("input, textarea, button")
          ? fieldElement
          : fieldElement?.querySelector<HTMLElement>("input:not(.sr-only), textarea, button");
        focusElement?.focus({ preventScroll: true });
      });
    });
  };

  const preparePublish = async () => {
    if (publishingRef.current) return;
    if (!publishReadiness.canPublish) {
      setPublishReviewOpen(true);
      return;
    }

    publishingRef.current = true;
    setPublishError("");
    setPublishing(true);
    try {
      cancelPendingAutosave();

      let menuId = activeMenuId;
      let menuSlug = activeMenuSlug;
      if (!menuId) {
        const storedMenu = await persistNewMenu(menu, theme);
        menuId = storedMenu.id;
        menuSlug = storedMenu.slug;
      }
      const stored = await saveSnapshot(menuId, { menu, theme }, true);
      menuSlug = stored.slug;
      setActiveMenuStatus("published");
      setActiveMenuSlug(menuSlug);
      setPublishUrl(`${window.location.origin}/m/${menuSlug}`);
      setPublishReviewOpen(false);
      setPublishOpen(true);
      setCopied(false);
    } catch (publishError) {
      const message = getErrorMessage(publishError, locale);
      setPublishError(message);
      setNotice(message);
      setSaveStatus("error");
    } finally {
      publishingRef.current = false;
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publishUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setNotice(t("Could not copy the link. Select the menu URL and copy it manually.", "Bağlantı kopyalanamadı. Menü bağlantısını seçerek elle kopyalayabilirsin.")); }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t(`${menu.restaurantName} menu`, `${menu.restaurantName} menüsü`), url: publishUrl });
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) setNotice(t("Could not open sharing. You can copy the link instead.", "Paylaşım açılamadı. Bağlantıyı kopyalayabilirsin."));
      }
      return;
    }
    await copyLink();
  };

  const downloadQr = () => {
    const svg = document.querySelector("#menu-qr svg");
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${menu.restaurantName.toLocaleLowerCase(intlLocale).replace(/\s+/g, "-")}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const flushBeforeLeaving = async () => {
    if (screen !== "studio") return;
    cancelPendingAutosave();
    const latest = latestContentRef.current;
    if (lastSavedRef.current?.menu === latest.menu && lastSavedRef.current?.theme === latest.theme) {
      return;
    }
    let menuId = activeMenuId;
    if (!menuId) menuId = (await persistNewMenu(latest.menu, latest.theme)).id;
    while (lastSavedRef.current?.menu !== latestContentRef.current.menu ||
      lastSavedRef.current?.theme !== latestContentRef.current.theme) {
      await saveSnapshot(menuId, latestContentRef.current);
    }
    cancelPendingAutosave();
  };

  const leaveStudio = async (signOut: boolean) => {
    if (leaving) return;
    setLeaving(true);
    try {
      await flushBeforeLeaving();
      if (signOut) {
        const response = await fetch("/api/auth/logout", { method: "POST" });
        if (!response.ok) throw new Error(t("Could not log out. Please try again.", "Çıkış yapılamadı. Yeniden dene."));
      }
      window.location.href = signOut ? "/" : "/dashboard";
    } catch (error) {
      setSaveStatus("error");
      setSaveError(getErrorMessage(error, locale));
      setLeaving(false);
    }
  };
  const logout = () => leaveStudio(true);
  const goToDashboard = () => leaveStudio(false);

  if (publicPayload) {
    return <PublicMenu menu={publicPayload.menu} theme={publicPayload.theme} />;
  }

  if (publicError) {
    return (
      <main className="link-error-page">
        <div className="link-error-card">
          <div className="brand-mark"><QrCode size={22} /></div>
          <h1>{t("This menu link could not be opened", "Bu menü bağlantısı açılamadı")}</h1>
          <p>{publicError}</p>
          <button className="primary-button" onClick={() => { window.location.hash = ""; window.location.reload(); }}>
            {t("Back to easyqr home", "easyqr ana sayfasına dön")}
          </button>
        </div>
      </main>
    );
  }

  if (screen === "upload" && workspaceMode) {
    return (
      <main className="studio-new-shell">
        <header className="studio-new-header">
          <Brand />
          <nav aria-label={t("Breadcrumb", "Uygulama yolu")}>
            <a href="/dashboard">Dashboard</a><span>/</span><a href="/dashboard/menus">{t("My menus", "Menülerim")}</a><span>/</span><strong>{t("New menu", "Yeni menü")}</strong>
          </nav>
          <div className="studio-new-user">
            <LocaleSwitcher compact />
            <span><UserRound size={16} /> {currentUser?.name}</span>
            <button className="icon-button" aria-label={t("Log out", "Çıkış yap")} onClick={() => void logout()}><LogOut size={16} /></button>
          </div>
        </header>

        <section className="studio-new-content">
          <a className="studio-new-back" href="/dashboard/menus"><ArrowLeft size={16} /> {t("Back to my menus", "Menülerime dön")}</a>
          <div className="studio-new-title">
            <span><Sparkles size={14} /> {t("New menu", "Yeni menü")}</span>
            <h1>{t("How would you like to create your menu?", "Menünü nasıl oluşturmak istersin?")}</h1>
            <p>{t("Convert an existing file with AI or start from editable sample content.", "Mevcut dosyanı yapay zekâ ile dönüştür veya örnek içerikle başlayıp kendin düzenle.")}</p>
          </div>

          <div className="studio-create-grid">
            <div
              className={`workspace-upload-card ${dragging ? "is-dragging" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {loading ? (
                <div className="analysis-state" aria-live="polite">
                  <div className="scan-document"><FileText size={48} strokeWidth={1.5} /><span className="scan-line" /></div>
                  <h2>{t("Reading your menu", "Menün okunuyor")}</h2>
                  <p>{fileName}</p>
                  <div className="analysis-steps">
                    <span className="done"><Check size={14} /> {t("File received", "Dosya alındı")}</span>
                    <span className="active"><Loader2 size={14} /> {t("Extracting items", "Ürünler ayrıştırılıyor")}</span>
                    <span>{t("Preparing the design", "Tasarım hazırlanıyor")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="workspace-upload-icon"><UploadCloud size={30} /></div>
                  <span className="workspace-option-label">{t("Recommended", "Önerilen")}</span>
                  <h2>{t("Upload your menu file", "Menü dosyanı yükle")}</h2>
                  <p>{t("Drop a PDF or menu photo and let AI extract the items and prices.", "PDF veya menü fotoğrafını bırak; ürünleri ve fiyatları yapay zekâ ayırsın.")}</p>
                  <button className="primary-button" onClick={requestUpload}><Sparkles size={17} /> {t("Choose and convert file", "Dosya seç ve dönüştür")}</button>
                  <div className="file-types"><span>PDF</span><span>JPG</span><span>PNG</span><small>{t("Max 12 MB", "Maks. 12 MB")}</small></div>
                </>
              )}
              <input ref={inputRef} className="sr-only" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={onInputChange} />
            </div>

            <div className="workspace-manual-card">
              <div className="workspace-manual-icon"><FileText size={27} /></div>
              <span className="workspace-option-label neutral">{t("Alternative", "Alternatif")}</span>
              <h2>{t("Start with an industry template", "Sektör şablonuyla başla")}</h2>
              <p>{t("Choose your venue type and start with sample categories, items, and a matching design.", "İşletme türünü seç; uygun kategoriler, örnek ürünler ve tasarım stili hazır gelsin.")}</p>
              <div className="workspace-starter-chips" aria-label={t("Template examples", "Şablon örnekleri")}>
                <span>{t("Restaurant", "Restoran")}</span><span>{t("Cafe", "Kafe")}</span><span>{t("Bakery", "Pastane")}</span><span>+4</span>
              </div>
              <button className="secondary-button" onClick={openStarterPicker}><Plus size={17} /> {t("View templates", "Şablonları görüntüle")}</button>
              <small>{t("You can also start with a completely blank menu.", "İstersen tamamen boş bir menüyle de başlayabilirsin.")}</small>
            </div>
          </div>

          {error && <div className="workspace-error"><X size={16} /> {error}</div>}

          <div className="studio-new-steps">
            <article><span>1</span><div><strong>{t("Import content", "İçeriği aktar")}</strong><small>{t("Start from a file or template", "Dosyadan veya örnekten başla")}</small></div></article>
            <i />
            <article><span>2</span><div><strong>{t("Customize the design", "Tasarımı düzenle")}</strong><small>{t("Choose colors and layout", "Renk ve görünümü seç")}</small></div></article>
            <i />
            <article><span>3</span><div><strong>{t("Publish the QR code", "QR kodunu yayınla")}</strong><small>{t("Share your permanent link", "Kalıcı bağlantını paylaş")}</small></div></article>
          </div>
        </section>

        {starterPickerOpen && (
          <div
            className="modal-backdrop starter-picker-backdrop"
            role="presentation"
            onMouseDown={() => { if (!creatingStarter) setStarterPickerOpen(false); }}
          >
            <section
              aria-labelledby="starter-picker-title"
              aria-modal="true"
              className="starter-picker-modal"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
            >
              <button
                aria-label={t("Close template selection", "Şablon seçimini kapat")}
                className="modal-close"
                disabled={creatingStarter}
                onClick={() => setStarterPickerOpen(false)}
                type="button"
              ><X size={19} /></button>

              <div className="starter-picker-heading">
                <span><Sparkles size={13} /> {t("Quick start", "Hızlı başlangıç")}</span>
                <h2 id="starter-picker-title">{t("Choose a foundation for your venue", "İşletmene uygun bir temel seç")}</h2>
                <p>{t("You can edit, delete, or add to every sample field in Studio.", "Tüm örnek alanları Studio’da değiştirebilir, silebilir veya yenilerini ekleyebilirsin.")}</p>
              </div>

              <div className="starter-setup-fields">
                <label>
                  <span>{t("Venue name", "İşletme adı")} <small>{t("Optional", "İsteğe bağlı")}</small></span>
                  <input
                    autoComplete="organization"
                    maxLength={80}
                    onChange={(event) => setStarterBusinessName(event.target.value)}
                    placeholder={selectedStarter.defaultName}
                    value={starterBusinessName}
                  />
                </label>
                <label>
                  <span>{t("Currency", "Para birimi")}</span>
                  <select
                    aria-label={t("Menu currency", "Menü para birimi")}
                    onChange={(event) => setStarterCurrency(event.target.value as MenuStarterCurrency)}
                    value={starterCurrency}
                  >
                    {starterCurrencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option[locale]}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="starter-template-grid" role="group" aria-label={t("Industry templates", "Sektör şablonları")}>
                {availableMenuStarters.map((starter) => {
                  const StarterIcon = starterIcons[starter.id];
                  const itemCount = starter.categories.reduce(
                    (sum, category) => sum + category.items.length,
                    0,
                  );
                  const selected = selectedStarterId === starter.id;
                  return (
                    <button
                      aria-pressed={selected}
                      className={selected ? "selected" : ""}
                      disabled={creatingStarter}
                      key={starter.id}
                      onClick={() => {
                        setSelectedStarterId(starter.id);
                        setStarterError("");
                      }}
                      type="button"
                    >
                      <span className="starter-template-icon"><StarterIcon size={19} /></span>
                      <span className="starter-template-copy">
                        <strong>{starter.label}</strong>
                        <small>{starter.description}</small>
                      </span>
                      <span className="starter-template-meta">
                        {starter.id === "blank"
                          ? t("From scratch", "Sıfırdan")
                          : t(`${starter.categories.length} categories · ${itemCount} items`, `${starter.categories.length} kategori · ${itemCount} ürün`)}
                      </span>
                      {selected && <CheckCircle2 className="starter-template-check" size={17} />}
                    </button>
                  );
                })}
              </div>

              <div className="starter-selection-summary" aria-live="polite">
                <span className="starter-selection-icon">
                  <SelectedStarterIcon size={18} />
                </span>
                <div>
                  <span>{t("Selected starting point", "Seçili başlangıç")}</span>
                  <strong>{selectedStarter.label}</strong>
                  <small>
                    {selectedStarter.id === "blank"
                      ? t("You will create the categories and items yourself.", "Kategori ve ürünleri kendin oluşturacaksın.")
                      : t(`${selectedStarter.categories.length} categories and ${selectedStarterItemCount} sample items will be added.`, `${selectedStarter.categories.length} kategori ve ${selectedStarterItemCount} örnek ürün eklenecek.`)}
                  </small>
                </div>
                {selectedStarter.categories.length > 0 && (
                  <div className="starter-category-preview">
                    {selectedStarter.categories.map((category) => <span key={category.name}>{category.name}</span>)}
                  </div>
                )}
              </div>

              {starterError && (
                <div className="starter-picker-error" role="alert">
                  <AlertTriangle size={16} /> {starterError}
                </div>
              )}

              <div className="starter-picker-actions">
                <button
                  className="secondary-button"
                  disabled={creatingStarter}
                  onClick={() => setStarterPickerOpen(false)}
                  type="button"
                >{t("Cancel", "Vazgeç")}</button>
                <button
                  className="primary-button"
                  disabled={creatingStarter}
                  onClick={() => { void createStarterDraft(); }}
                  type="button"
                >
                  {creatingStarter
                    ? <><Loader2 className="auto-image-spinner" size={16} /> {t("Preparing draft…", "Taslak hazırlanıyor…")}</>
                    : <><ArrowRight size={16} /> {t(`Start with ${selectedStarter.label}`, `${selectedStarter.label} ile başla`)}</>}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  if (screen === "upload") {
    return (
      <main className="landing-shell">
        <header className="landing-header">
          <Brand />
          <nav aria-label={t("Main navigation", "Ana menü")}>
            <a href="#nasil-calisir">{t("How it works", "Nasıl çalışır?")}</a>
            <a href="#ozellikler">{t("Features", "Özellikler")}</a>
            <a href="#guven">{t("Trust", "Güven")}</a>
            <a href="#sss">{t("FAQ", "S.S.S.")}</a>
            <a className="nav-demo" href={getLocalizedAppPath(locale, "sampleMenu")}>{t("Sample menu", "Örnek menü")}</a>
          </nav>
          <div className="landing-auth-actions">
            <LocaleSwitcher compact />
            {authStatus === "loading" ? (
              <span className="auth-status-skeleton" />
            ) : currentUser ? (
              <>
                <a className="landing-user" href="/dashboard"><UserRound size={15} /> Dashboard</a>
                <button className="header-cta" onClick={requestUpload}>{t("Create menu", "Menü oluştur")}</button>
              </>
            ) : (
              <>
                <a className="login-link" href={getLocalizedAppPath(locale, "login")}>{t("Log in", "Giriş yap")}</a>
                <a className="header-cta" href={getLocalizedAppPath(locale, "register")}>{t("Start free", "Ücretsiz başla")}</a>
              </>
            )}
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> {t("Free QR menu for 7 days", "7 gün ücretsiz QR menü")}</div>
            <h1>{t("Your menu changes.", "Menün değişsin.")}<br /><span>{t("Your QR code stays.", "QR kodun aynı kalsın.")}</span></h1>
            <p>
              {t(
                "Upload a PDF or photo. Manage items, prices, and promotions in one place, and update the menu without reprinting the QR code.",
                "PDF veya fotoğraf menünü yükle. Ürünleri, fiyatları ve kampanyaları tek yerden yönet; masadaki QR kodunu yeniden bastırmadan menünü güncelle.",
              )}
            </p>
            <div className="hero-proof">
              <span><Check size={16} /> {t("Free for 7 days", "7 gün ücretsiz")}</span>
              <span><Check size={16} /> {t("No credit card required", "Kredi kartı gerekmez")}</span>
              <span><Check size={16} /> {t("No design skills needed", "Tasarım bilgisi gerekmez")}</span>
            </div>
          </div>

          <div className="upload-stage">
            <div className="stage-spark stage-spark-one">✦</div>
            <div className="stage-spark stage-spark-two">✦</div>
            <div
              className={`upload-card ${dragging ? "is-dragging" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              {loading ? (
                <div className="analysis-state" aria-live="polite">
                  <div className="scan-document">
                    <FileText size={48} strokeWidth={1.5} />
                    <span className="scan-line" />
                  </div>
                  <h2>{t("Reading your menu", "Menün okunuyor")}</h2>
                  <p>{fileName}</p>
                  <div className="analysis-steps">
                    <span className="done"><Check size={14} /> {t("File received", "Dosya alındı")}</span>
                    <span className="active"><Loader2 size={14} /> {t("Extracting items", "Ürünler ayrıştırılıyor")}</span>
                    <span>{t("Preparing the design", "Tasarım hazırlanıyor")}</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="upload-icon"><UploadCloud size={28} /></div>
                  <div>
                    <h2>{t("Drop your menu here", "Menünü buraya bırak")}</h2>
                    <p>{t("or choose a file from your device", "ya da bilgisayarından bir dosya seç")}</p>
                  </div>
                  <button className="primary-button upload-button" onClick={requestUpload}>
                    <Sparkles size={17} /> {t("Convert menu", "Menüyü dönüştür")}
                  </button>
                  <div className="file-types">
                    <span>PDF</span><span>JPG</span><span>PNG</span><small>{t("Max 12 MB", "Maks. 12 MB")}</small>
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={onInputChange}
              />
            </div>
            {error && <div className="upload-error"><X size={16} /> {error}</div>}
            <a className="demo-link" href={getLocalizedAppPath(locale, "sampleMenu")}>{t("No file ready? Try the sample menu", "Dosyan hazır değil mi? Örnek menüyü dene")} <span>→</span></a>
          </div>
        </section>

        <section className="how-it-works" id="nasil-calisir">
          <div className="section-intro">
            <span>{t("Three simple steps", "Üç basit adım")}</span>
            <h2>{t("Your menu, redesigned and ready.", "Menün, yeniden tasarlanmış halde.")}</h2>
          </div>
          <div className="feature-grid">
            <article><div className="feature-number">01</div><ScanLine size={25} /><h3>{t("Upload", "Yükle")}</h3><p>{t("Take a photo or upload your PDF menu.", "Fotoğrafını çek veya PDF menünü yükle.")}</p></article>
            <article><div className="feature-number">02</div><Palette size={25} /><h3>{t("Customize", "Kişiselleştir")}</h3><p>{t("Match the colors, typography, and layout to your brand.", "Renkleri, yazı stilini ve görünümü markana uyarla.")}</p></article>
            <article><div className="feature-number">03</div><QrCode size={25} /><h3>{t("Share", "Paylaş")}</h3><p>{t("Download the QR code, place it at your venue, and go live.", "QR kodunu indir, masalara yerleştir ve yayına al.")}</p></article>
          </div>
        </section>

        <section className="landing-value" id="ozellikler">
          <div className="landing-section-heading">
            <span>{t("Set it up once, use it every day", "Bir kez kur, her gün kullan")}</span>
            <h2>{t("More than a QR code. A menu that stays useful.", "Sadece QR üretmez. Menünü çalışır halde tutar.")}</h2>
            <p>
              {t(
                "Change prices, hide sold-out items, launch offers, and serve international guests without redesigning or reprinting.",
                "Fiyat değişikliği, tükenen ürün, yeni kampanya veya İngilizce menü için yeniden tasarım ve baskıyla uğraşmazsın.",
              )}
            </p>
          </div>

          <div className="landing-value-grid">
            <article className="landing-value-card is-highlighted">
              <span className="landing-value-icon"><RefreshCcw size={22} /></span>
              <div>
                <small>{t("Same link, same printed code", "Aynı bağlantı, aynı baskı")}</small>
                <h3>{t("Your QR code stays current", "QR kodun hep güncel")}</h3>
                <p>{t("Edit, review, and publish. Guests see the new version without you replacing the QR code.", "Menünü düzenle, kontrol et ve yayınla. Masadaki QR kodu değiştirmeden müşterine yeni halini göster.")}</p>
              </div>
              <ul>
                <li><CheckCircle2 size={15} /> {t("Separate draft and live versions", "Taslak ve canlı menü birbirinden ayrı")}</li>
                <li><CheckCircle2 size={15} /> {t("Quality checks before publishing", "Yayınlamadan önce kalite kontrolü")}</li>
                <li><CheckCircle2 size={15} /> {t("Short, permanent menu link", "Kısa ve kalıcı menü bağlantısı")}</li>
              </ul>
            </article>

            <article className="landing-value-card">
              <span className="landing-value-icon"><Smartphone size={22} /></span>
              <div>
                <small>{t("The guest-facing experience", "Müşterinin gördüğü yüz")}</small>
                <h3>{t("Made for every phone", "Telefona hazır menü")}</h3>
                <p>{t("Item search, allergen filters, opening hours, and multilingual menus adapt to every screen.", "Ürün arama, alerjen filtreleri, açık-kapalı bilgisi ve TR/EN desteği her ekrana uyum sağlar.")}</p>
              </div>
            </article>

            <article className="landing-value-card">
              <span className="landing-value-icon"><BarChart3 size={22} /></span>
              <div>
                <small>{t("Real engagement, not guesses", "Tahmin değil, gerçek ilgi")}</small>
                <h3>{t("See what guests notice", "Neye bakıldığını gör")}</h3>
                <p>{t("Track QR visits, popular items, and searches with no results, then improve the menu using real behavior.", "QR açılışlarını, popüler ürünleri ve sonuçsuz aramaları gör; menünü gerçek kullanıma göre iyileştir.")}</p>
              </div>
            </article>

            <article className="landing-value-card">
              <span className="landing-value-icon"><QrCode size={22} /></span>
              <div>
                <small>{t("Ready for your venue", "Masaya çıkmaya hazır")}</small>
                <h3>{t("Download from the Print Center", "Baskı merkezinden indir")}</h3>
                <p>{t("Create table cards, stickers, and posters as high-resolution PNG, SVG, or A4 PDF files.", "Masa kartı, sticker ve poster tasarımlarını yüksek çözünürlüklü PNG, SVG veya A4/PDF olarak hazırla.")}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-trust" id="guven">
          <div className="landing-trust-copy">
            <span>{t("A secure workspace", "Güvenli çalışma alanı")}</span>
            <h2>{t("You control every edit and every publish.", "Değişiklik sende, yayın kararı sende.")}</h2>
            <p>
              {t(
                "AI speeds up the first draft, while you stay in control of every item, price, and detail. Draft changes never reach the live menu until you publish them.",
                "Yapay zekâ başlangıcı hızlandırır; ürün adını, fiyatını ve içeriğini sen kontrol edersin. Taslak değişiklikler açıkça yayınlayana kadar canlı menüye geçmez.",
              )}
            </p>
            <a className="secondary-button" href={getLocalizedAppPath(locale, "register")}>{t("Create your free account", "Ücretsiz hesabını oluştur")} <ArrowRight size={16} /></a>
          </div>
          <div className="landing-trust-list">
            <article>
              <LockKeyhole size={20} />
              <div><strong>{t("Private account access", "Hesabına özel erişim")}</strong><span>{t("Passwords are hashed and session tokens stay in secure HTTP-only cookies.", "Parolalar hash’lenir; oturum anahtarı güvenli HTTP-only çerezde tutulur.")}</span></div>
            </article>
            <article>
              <BarChart3 size={20} />
              <div><strong>{t("Privacy-first analytics", "Gizlilik odaklı analitik")}</strong><span>{t("Raw IP addresses, referrer URLs, and browser details are not stored.", "Ham IP adresi, yönlendiren adres ve tarayıcı bilgisi saklanmaz.")}</span></div>
            </article>
            <article>
              <CheckCircle2 size={20} />
              <div><strong>{t("Pre-publish review", "Yayın öncesi kontrol")}</strong><span>{t("Missing items, invalid prices, and visible-content issues are flagged before publishing.", "Eksik ürün, geçersiz fiyat ve görünür içerik sorunları yayından önce gösterilir.")}</span></div>
            </article>
          </div>
        </section>

        <section className="landing-faq" id="sss">
          <div className="landing-section-heading">
            <span>{t("Frequently asked questions", "Sık sorulanlar")}</span>
            <h2>{t("What to know before you start.", "Başlamadan önce bilmen gerekenler.")}</h2>
          </div>
          <div className="landing-faq-list">
            <details>
              <summary>{t("Why use this instead of a one-off QR code?", "Neden tek seferlik bir QR yerine sürekli kullanayım?")}<ChevronDown size={18} /></summary>
              <p>{t("Prices, availability, offers, and items change. easyqr keeps the same QR code current and shows you what guests engage with.", "Çünkü fiyat, stok, kampanya ve ürünlerin değişir. easyqr aynı QR kodla menünü güncel tutar; ayrıca kullanım ve ürün ilgisini görmeni sağlar.")}</p>
            </details>
            <details>
              <summary>{t("Do I need to reprint the QR code after an update?", "Menüyü güncelleyince QR kodu yeniden basmam gerekir mi?")}<ChevronDown size={18} /></summary>
              <p>{t("No. Your published menu has a permanent short link, and every new release appears on the same QR code.", "Hayır. Yayınlanan menünün kısa bağlantısı kalıcıdır; yaptığın yeni yayınlar aynı QR kodunda görünür.")}</p>
            </details>
            <details>
              <summary>{t("Which file types can I upload?", "Hangi dosyaları yükleyebilirim?")}<ChevronDown size={18} /></summary>
              <p>{t("PDF, JPG, PNG, and WEBP menus up to 12 MB are supported. You can also start from an industry template or a blank menu.", "12 MB’a kadar PDF, JPG, PNG ve WEBP menüler desteklenir. İstersen sektör şablonuyla veya tamamen boş menüyle de başlayabilirsin.")}</p>
            </details>
            <details>
              <summary>{t("Can I edit the content extracted by AI?", "Yapay zekânın çıkardığı içeriği değiştirebilir miyim?")}<ChevronDown size={18} /></summary>
              <p>{t("Yes. Edit categories, items, prices, images, and design, then publish only when everything is ready.", "Evet. Kategorileri, ürünleri, fiyatları, görselleri ve tasarımı düzenleyebilir; yalnızca hazır olduğunda yayınlayabilirsin.")}</p>
            </details>
          </div>
        </section>

        <section className="landing-final-cta">
          <div>
            <span>{t("Ready for your first menu?", "İlk menün için hazır mısın?")}</span>
            <h2>{t("Put your QR menu in front of guests today.", "QR menünü bugün masaya çıkar.")}</h2>
            <p>{t("Try it free for 7 days. No credit card required.", "7 gün ücretsiz dene. Kredi kartı gerekmez.")}</p>
          </div>
          <div className="landing-final-actions">
            <a className="primary-button" href={currentUser ? "/studio" : getLocalizedAppPath(locale, "register")}>
              {currentUser ? t("Create menu", "Menü oluştur") : t("Start free", "Ücretsiz başla")} <ArrowRight size={16} />
            </a>
            <a className="secondary-button" href={getLocalizedAppPath(locale, "sampleMenu")}>{t("Open sample menu", "Örnek menüyü aç")}</a>
          </div>
        </section>

        <footer className="landing-footer">
          <div>
            <Brand />
            <p>{t("An editable, measurable, mobile-ready QR menu for restaurants and cafes.", "Restoran ve kafeler için güncellenebilir, ölçülebilir ve telefona hazır QR menü.")}</p>
          </div>
          <nav aria-label={t("Footer navigation", "Alt menü")}>
            <a href="#nasil-calisir">{t("How it works", "Nasıl çalışır?")}</a>
            <a href="#ozellikler">{t("Features", "Özellikler")}</a>
            <a href="#guven">{t("Trust", "Güven")}</a>
            <a href={getLocalizedAppPath(locale, "privacy")}>{t("Privacy", "Gizlilik")}</a>
            <a href={getLocalizedAppPath(locale, "cookies")}>{t("Cookies", "Çerezler")}</a>
            <a href={getLocalizedAppPath(locale, "terms")}>{t("Terms", "Koşullar")}</a>
            <a href={getLocalizedAppPath(locale, "login")}>{t("Log in", "Giriş yap")}</a>
          </nav>
          <small>© {new Date().getFullYear()} easyqr</small>
        </footer>
      </main>
    );
  }

  return (
    <main className="studio-shell">
      <StudioHeader
        documentName={menu.restaurantName}
        hasUnpublishedChanges={hasUnpublishedChanges}
        isPublished={activeMenuStatus === "published"}
        busy={leaving || publishing}
        onBack={() => { void goToDashboard(); }}
        onLogout={() => { void logout(); }}
        onOpenPreview={() => {
          if (window.matchMedia("(max-width: 760px)").matches) setMobilePreviewOpen(true);
          else setInlinePreviewOpen((current) => !current);
        }}
        onPublish={() => {
          setPublishError("");
          if (activeMenuStatus === "published" && saveStatus === "saved" && !hasUnpublishedChanges && activeMenuSlug) {
            setPublishUrl(`${window.location.origin}/m/${activeMenuSlug}`);
            setPublishOpen(true);
            setCopied(false);
          } else {
            setPublishReviewOpen(true);
          }
        }}
        saveStatus={saveStatus}
        previewVisible={inlinePreviewOpen}
        userName={currentUser?.name}
      />

      {saveError && <div className="studio-save-error" role="alert">
        <span><strong>{t("Changes could not be saved", "Değişiklikler kaydedilemedi")}</strong> {saveError}</span>
        <button type="button" onClick={() => {
          cancelPendingAutosave();
          if (activeMenuId) void saveSnapshot(activeMenuId, latestContentRef.current).catch(() => undefined);
          else void persistNewMenu(menu, theme).then(() => { setSaveError(""); setSaveStatus("saved"); }).catch((error) => setSaveError(getErrorMessage(error, locale)));
        }}>{t("Retry", "Yeniden dene")}</button>
        <button type="button" onClick={downloadDraft}>{t("Download draft", "Taslağı indir")}</button>
      </div>}
      <div className={`studio-body ${inlinePreviewOpen ? "has-preview" : "editor-focus"}`}>
        <aside className="editor-panel">
          <StudioEditorTabs activeTab={tab} onChange={changeEditorTab} />

          {notice && <div className="notice"><Sparkles size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label={t("Dismiss notification", "Bildirimi kapat")}><X size={14} /></button></div>}

          {tab === "content" ? (
            <div
              aria-labelledby="studio-tab-content"
              className="editor-content"
              id="studio-panel-content"
              ref={editorScrollRef}
              role="tabpanel"
            >
              <StudioSectionNav
                activeSection={contentSection}
                label={t("Content sections", "İçerik bölümleri")}
                onChange={changeContentSection}
                sections={localizedContentSectionLinks}
              />

              {contentSection === "basics" && (
                <section className="form-section studio-tool-panel" id="studio-content-basics">
                <div className="section-heading"><div><span>{t("Business", "İşletme")}</span><h2>{t("Menu heading", "Menü başlığı")}</h2></div></div>
                <div className="draft-file-actions">
                  <button type="button" onClick={downloadDraft}><Download size={16} /> {t("Download draft", "Taslağı indir")}</button>
                  <label><UploadCloud size={16} /> {t("Restore from draft", "Taslaktan geri yükle")}
                    <input className="sr-only" type="file" accept="application/json,.json" onChange={(event) => {
                      void restoreDraft(event.target.files?.[0]);
                      event.target.value = "";
                    }} />
                  </label>
                </div>
                <div className="menu-title-fields">
                  <label className="field-label">{t("Business name", "İşletme adı")}<input data-readiness-field="restaurant-name" maxLength={120} value={menu.restaurantName} onChange={(event) => setMenu({ ...menu, restaurantName: event.target.value })} /></label>
                  <label className="field-label">{t("Currency", "Para birimi")}<input data-readiness-field="currency" maxLength={12} placeholder={locale === "tr" ? "₺" : "$"} value={menu.currency} onChange={(event) => setMenu({ ...menu, currency: event.target.value })} /></label>
                  <label className="field-label">{t("Menu content language", "Menü içerik dili")}<select value={menu.sourceLanguage || (locale === "tr" ? "tr" : "en")} onChange={(event) => {
                    setMenu({ ...menu, sourceLanguage: event.target.value });
                  }}>
                    {menu.sourceLanguage && !menuSourceLanguageOptions.some((option) => option.value === menu.sourceLanguage) && (
                      <option value={menu.sourceLanguage}>{menu.sourceLanguage.toLocaleUpperCase("en-US")}</option>
                    )}
                    {menuSourceLanguageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select></label>
                </div>
                <label className="field-label">{t("Short description", "Kısa açıklama")}<input data-readiness-field="subtitle" maxLength={240} value={menu.subtitle} onChange={(event) => setMenu({ ...menu, subtitle: event.target.value })} /></label>
                </section>
              )}

              {contentSection === "business" && (
                <section className="form-section business-profile-section studio-tool-panel" id="studio-content-business">
                <div className="section-heading">
                  <div><span>{t("Business profile", "İşletme profili")}</span><h2>{t("Logo, contact, and hours", "Logo, iletişim ve saatler")}</h2></div>
                  <div className="business-profile-status">{t("Optional", "İsteğe bağlı")}</div>
                </div>
                <p className="business-profile-help">
                  {t("Completed details appear on the guest menu. Empty links stay hidden.", "Doldurduğun bilgiler müşteri menüsünde görünür. Boş bıraktığın bağlantılar gizlenir.")}
                </p>

                <div className="business-logo-editor">
                  <div className={`business-logo-preview ${businessProfile.logo ? "has-logo" : ""}`}>
                    {businessProfile.logo
                      ? <img src={businessProfile.logo} alt={t("Business logo preview", "İşletme logosu önizlemesi")} />
                      : <ImagePlus aria-hidden="true" size={22} />}
                  </div>
                  <div className="business-logo-copy">
                    <strong>{t("Business logo", "İşletme logosu")}</strong>
                    <small>{t("Transparent PNG supported · resized automatically", "Şeffaf PNG kullanabilirsin · otomatik küçültülür")}</small>
                  </div>
                  <div className="business-logo-actions">
                    <label>
                      <UploadCloud size={14} /> {businessProfile.logo ? t("Change", "Değiştir") : t("Upload logo", "Logo yükle")}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          void updateBusinessLogo(file);
                        }}
                      />
                    </label>
                    {businessProfile.logo && (
                      <button
                        aria-label={t("Remove business logo", "İşletme logosunu kaldır")}
                        onClick={() => updateBusinessProfile({ logo: "" })}
                        type="button"
                      ><Trash2 size={14} /> {t("Remove", "Kaldır")}</button>
                    )}
                  </div>
                </div>

                <label className="field-label business-field-with-icon">
                  <span><MapPin size={14} /> {t("Address", "Adres")}</span>
                  <textarea
                    maxLength={300}
                    placeholder={t("e.g. 123 Market Street, San Francisco, CA", "Örn. Caferağa Mah. Moda Cad. No: 12, Kadıköy / İstanbul")}
                    rows={3}
                    value={businessProfile.address}
                    onChange={(event) => updateBusinessProfile({ address: event.target.value })}
                  />
                </label>

                <div className="business-contact-grid">
                  <label className="field-label business-field-with-icon">
                    <span><Phone size={14} /> {t("Phone", "Telefon")}</span>
                    <input
                      maxLength={60}
                      placeholder={t("+1 415 555 0100", "+90 212 000 00 00")}
                      type="tel"
                      value={businessProfile.phone}
                      onChange={(event) => updateBusinessProfile({ phone: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><MessageCircle size={14} /> WhatsApp</span>
                    <input
                      maxLength={120}
                      placeholder={t("+1 415 555 0100", "+90 555 000 00 00")}
                      value={businessProfile.whatsapp}
                      onChange={(event) => updateBusinessProfile({ whatsapp: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><Instagram size={14} /> Instagram</span>
                    <input
                      maxLength={120}
                      placeholder={t("@username", "@kullaniciadi")}
                      value={businessProfile.instagram}
                      onChange={(event) => updateBusinessProfile({ instagram: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><MapPin size={14} /> {t("Google Maps link", "Google Maps bağlantısı")}</span>
                    <input
                      maxLength={500}
                      placeholder="https://maps.app.goo.gl/..."
                      type="url"
                      value={businessProfile.mapsUrl}
                      onChange={(event) => updateBusinessProfile({ mapsUrl: event.target.value })}
                    />
                  </label>
                </div>

                <div className="business-hours-card">
                  <label className="toggle-row business-hours-toggle">
                    <span>
                      <strong><Clock3 size={15} /> {t("Business hours", "Çalışma saatleri")}</strong>
                      <small>{t("Open/closed status is calculated at the guest's current time", "Açık/kapalı durumu müşterinin bulunduğu anda hesaplanır")}</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={businessProfile.hoursEnabled}
                      onChange={(event) => updateBusinessProfile({ hoursEnabled: event.target.checked })}
                    />
                    <i />
                  </label>

                  {businessProfile.hoursEnabled && (
                    <div className="business-hours-settings">
                      <label className="field-label business-timezone-field">
                        {t("Time zone", "Saat dilimi")}
                        <select
                          value={businessProfile.timezone}
                          onChange={(event) => updateBusinessProfile({ timezone: event.target.value })}
                        >
                          {!timezoneOptions.some((option) => option.value === businessProfile.timezone) && (
                            <option value={businessProfile.timezone}>{businessProfile.timezone}</option>
                          )}
                          {timezoneOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option[locale]}</option>
                          ))}
                        </select>
                      </label>
                      <div className="weekly-hours-list">
                        {menuWeekdays.map((weekday) => {
                          const hours = businessProfile.weeklyHours[weekday];
                          return (
                            <div className={`weekly-hours-row ${hours.isOpen ? "" : "is-closed"}`} key={weekday}>
                              <label className="weekday-availability">
                                <input
                                  checked={hours.isOpen}
                                  onChange={(event) => updateBusinessHours(weekday, { isOpen: event.target.checked })}
                                  type="checkbox"
                                />
                                <span>{localizedWeekdayLabels[weekday]}</span>
                              </label>
                              {hours.isOpen ? (
                                <div className="weekly-time-inputs">
                                  <input
                                    aria-label={t(`${localizedWeekdayLabels[weekday]} opening time`, `${localizedWeekdayLabels[weekday]} açılış saati`)}
                                    type="time"
                                    value={hours.opensAt}
                                    onChange={(event) => {
                                      if (event.target.value) updateBusinessHours(weekday, { opensAt: event.target.value });
                                    }}
                                  />
                                  <span>—</span>
                                  <input
                                    aria-label={t(`${localizedWeekdayLabels[weekday]} closing time`, `${localizedWeekdayLabels[weekday]} kapanış saati`)}
                                    type="time"
                                    value={hours.closesAt}
                                    onChange={(event) => {
                                      if (event.target.value) updateBusinessHours(weekday, { closesAt: event.target.value });
                                    }}
                                  />
                                </div>
                              ) : <span className="weekly-closed-label">{t("Closed", "Kapalı")}</span>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="overnight-hours-note">{t("Hours that cross midnight are supported; for example, 6:00 PM — 2:00 AM.", "Gece yarısını aşan saatler desteklenir; örneğin 18:00 — 02:00.")}</p>
                    </div>
                  )}
                </div>
                </section>
              )}

              {contentSection === "language" && (
                <section className="form-section translation-section studio-tool-panel" id="studio-content-language">
                <div className="section-heading">
                  <div><span>{t("Language support", "Dil desteği")}</span><h2>{t("English menu", "İngilizce menü")}</h2></div>
                  <div className={`translation-status ${englishTranslationCurrent ? "ready" : hasEnglishTranslation ? "stale" : "empty"}`}>
                    {englishTranslationCurrent ? t("Current", "Güncel") : hasEnglishTranslation ? t("Update", "Güncelle") : t("Not ready", "Hazır değil")}
                  </div>
                </div>
                <div className={`translation-assistant ${englishTranslationCurrent ? "is-ready" : hasEnglishTranslation ? "is-stale" : ""}`} aria-live="polite">
                  <div className="translation-assistant-copy">
                    <span className="translation-assistant-icon"><Languages size={18} /></span>
                    <div>
                      <strong>
                        {englishTranslationCurrent
                          ? t("The English translation is ready to publish", "İngilizce çeviri yayına hazır")
                          : hasEnglishTranslation
                            ? t(`${sourceLanguageLabel} content has changed`, "Kaynak içerik değişti")
                            : t("Translate the menu into English with one click", "Menüyü tek tıkla İngilizceye çevir")}
                      </strong>
                      <p>
                        {englishTranslationCurrent
                          ? t("Visitors using English will see the translated menu automatically.", "Tarayıcı dili Türkçe olmayan ziyaretçiler İngilizce menüyü doğrudan görür.")
                          : hasEnglishTranslation
                            ? t("Update the translation to include your latest changes.", "Son değişikliklerin İngilizce menüye yansıması için çeviriyi güncelle.")
                            : t("Item names, descriptions, categories, and labels are translated; prices and images stay unchanged.", "Ürün adları, açıklamalar, kategoriler ve etiketler çevrilir; fiyatlar ile görseller değişmez.")}
                      </p>
                    </div>
                  </div>
                  <button
                    className="translation-button"
                    disabled={translatingEnglish}
                    onClick={() => { void generateEnglishTranslation(); }}
                    title={t("Uses your OpenAI quota", "OpenAI kullanım kotanı kullanır")}
                  >
                    {translatingEnglish ? <Loader2 className="auto-image-spinner" size={16} /> : <Languages size={16} />}
                    {translatingEnglish
                      ? t("Translating…", "Çevriliyor…")
                      : englishTranslationCurrent
                        ? t("Refresh translation", "Çeviriyi yenile")
                        : hasEnglishTranslation
                          ? t("Update translation", "Çeviriyi güncelle")
                          : t("Create English version", "İngilizceyi oluştur")}
                  </button>
                  <div className="translation-progress">
                    <span aria-hidden="true"><i style={{ width: englishCoverage.percentage + "%" }} /></span>
                    <small>{englishCoverage.percentage}% {t("translated", "çevrildi")}</small>
                  </div>
                </div>
                </section>
              )}

              {contentSection === "products" && (
                <section className="form-section categories-section studio-tool-panel" id="studio-content-products">
                <div className="section-heading">
                  <div><span>{t("Content", "İçerik")}</span><h2>{t("Categories and items", "Kategoriler ve ürünler")}</h2></div>
                  <div className="item-count">{totalItemCount} {t("items", "ürün")}</div>
                </div>
                {activeProductEditor ? (
                  <ProductDetailEditor
                    categoryName={activeProductEditor.category.name}
                    currency={menu.currency}
                    generatingImages={generatingImages}
                    generatingItemId={generatingItemId}
                    hasNext={Boolean(nextProduct)}
                    hasPrevious={Boolean(previousProduct)}
                    item={activeProductEditor.item}
                    key={activeProductEditor.item.id}
                    onBack={() => returnToProductList(activeProductEditor.category.id)}
                    onDelete={() => removeItem(activeProductEditor.categoryIndex, activeProductEditor.itemIndex)}
                    onGenerateImage={() => {
                      void generateItemImage(activeProductEditor.categoryIndex, activeProductEditor.itemIndex);
                    }}
                    onImageChange={(file) => {
                      void updateItemImage(activeProductEditor.categoryIndex, activeProductEditor.itemIndex, file);
                    }}
                    onNext={() => nextProduct && openProductEditor(nextProduct.item.id)}
                    onPrevious={() => previousProduct && openProductEditor(previousProduct.item.id)}
                    onToggleAllergen={(allergen) => toggleAllergen(
                      activeProductEditor.categoryIndex,
                      activeProductEditor.itemIndex,
                      allergen,
                    )}
                    onToggleDietaryTag={(tag) => toggleDietaryTag(
                      activeProductEditor.categoryIndex,
                      activeProductEditor.itemIndex,
                      tag,
                    )}
                    onUpdate={(key, value) => updateItem(
                      activeProductEditor.categoryIndex,
                      activeProductEditor.itemIndex,
                      key,
                      value,
                    )}
                    position={activeProductIndex + 1}
                    sourceLanguage={menu.sourceLanguage || "tr"}
                    total={productEditorItems.length}
                  />
                ) : (
                  <>
                <div className="auto-image-assistant" aria-live="polite">
                  <div className="auto-image-copy">
                    <span className="auto-image-icon"><Sparkles size={17} /></span>
                    <div>
                      <strong>{t("AI image assistant", "AI görsel asistanı")}</strong>
                      <p>
                        {totalItemCount === 0
                          ? <>{t("Add your first item, then create images in one click.", "Önce ilk ürününü ekle; ardından görselleri tek tuşla hazırlayabilirsin.")}</>
                          : missingImageCount > 0
                          ? <>{t(`${missingImageCount} items are missing images. Up to 6 are generated at a time; existing images are preserved.`, `${missingImageCount} üründe görsel eksik. Tek seferde en fazla 6 görsel üretilir; eklediklerin korunur.`)}</>
                          : <>{t("Every item has an image.", "Tüm ürünlerin görseli hazır.")}</>}
                      </p>
                    </div>
                  </div>
                  <button
                    className="auto-image-button"
                    disabled={generatingImages || Boolean(generatingItemId) || missingImageCount === 0}
                    onClick={() => { void generateMissingImages(); }}
                    title={t("Uses your OpenAI quota", "OpenAI kullanım kotanı kullanır")}
                  >
                    {generatingImages ? <Loader2 className="auto-image-spinner" size={16} /> : <Sparkles size={16} />}
                    {generatingImages
                      ? <>{imageGenerationProgress.done}/{imageGenerationProgress.total} {t("preparing", "hazırlanıyor")}</>
                      : <>{t("Complete with AI", "AI ile tamamla")}</>}
                  </button>
                  {generatingImages && (
                    <div className="auto-image-progress">
                      <span aria-hidden="true">
                        <i
                          style={{
                            width: imageGenerationProgress.total
                              ? Math.round((imageGenerationProgress.done / imageGenerationProgress.total) * 100) + "%"
                              : "0%",
                          }}
                        />
                      </span>
                      <small>{imageGenerationProgress.done} / {imageGenerationProgress.total} {t("items processed", "ürün işlendi")}</small>
                    </div>
                  )}
                </div>
                <div className="product-editor-tools">
                  <div className="product-editor-toolbar">
                    <label className="product-editor-search">
                      <Search aria-hidden="true" size={16} />
                      <input
                        aria-label={t("Search items", "Ürünlerde ara")}
                        onChange={(event) => setProductQuery(event.target.value)}
                        placeholder={t("Search items or categories", "Ürün veya kategori ara")}
                        type="search"
                        value={productQuery}
                      />
                    </label>
                    <button className="product-toolbar-add" onClick={addCategory} type="button">
                      <Plus size={15} /> {t("Category", "Kategori")}
                    </button>
                    <span>{normalizedProductQuery ? t(`${filteredItemCount} results`, `${filteredItemCount} sonuç`) : t(`${menu.categories.length} categories`, `${menu.categories.length} kategori`)}</span>
                  </div>
                  {menu.categories.length > 1 && (
                    <nav className="category-jump-nav" aria-label={t("Category shortcuts", "Kategori kısayolları")}>
                      {menu.categories.map((category) => (
                        <button
                          aria-current={categoryOpenState[category.id] ? "true" : undefined}
                          className={categoryOpenState[category.id] ? "active" : ""}
                          key={category.id}
                          onClick={() => openCategory(category.id)}
                          title={t(`Open ${category.name || "unnamed category"}`, `${category.name || "İsimsiz kategori"} kategorisini aç`)}
                          type="button"
                        >
                          <span>{category.name || t("Unnamed category", "İsimsiz kategori")}</span>
                          <b>{category.items.length}</b>
                        </button>
                      ))}
                    </nav>
                  )}
                </div>
                <div className="category-list">
                  {editorCategories.map(({ category, categoryIndex, items }) => (
                    <details
                      className="category-editor"
                      id={`studio-category-${category.id}`}
                      key={`${category.id}-${normalizedProductQuery ? "filtered" : "all"}`}
                      onToggle={(event) => {
                        if (normalizedProductQuery) return;
                        const isOpen = event.currentTarget.open;
                        setCategoryOpenState((current) => {
                          if (isOpen) {
                            return current[category.id] && Object.keys(current).length === 1
                              ? current
                              : { [category.id]: true };
                          }
                          return current[category.id] ? {} : current;
                        });
                      }}
                      open={Boolean(normalizedProductQuery) || categoryOpenState[category.id] === true}
                    >
                      <summary>
                        <ChevronDown className="category-chevron" size={17} />
                        <input
                          aria-label={t("Category name", "Kategori adı")}
                          data-readiness-field="category-name" maxLength={100}
                          value={category.name}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const categories = menu.categories.map((item, index) => index === categoryIndex ? { ...item, name: event.target.value } : item);
                            setMenu({ ...menu, categories });
                          }}
                        />
                        <span>{category.items.length}</span>
                        <button
                          aria-label={t(`Add an item to ${category.name || "category"}`, `${category.name || "Kategori"} kategorisine ürün ekle`)}
                          className="category-quick-add"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            addItem(categoryIndex);
                          }}
                          title={t("Add an item to this category", "Bu kategoriye ürün ekle")}
                          type="button"
                        ><Plus size={16} /></button>
                        <button
                          aria-label={t("Delete category", "Kategoriyi sil")}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (window.confirm(t(
                              `Delete “${category.name || "this category"}” and its ${category.items.length} items?`,
                              `“${category.name || "Bu kategori"}” ve içindeki ${category.items.length} ürün silinsin mi?`,
                            ))) {
                              removeCategory(categoryIndex);
                            }
                          }}
                          type="button"
                        ><Trash2 size={15} /></button>
                      </summary>
                      <div className="category-items">
                        {items.map(({ item }) => (
                          <ProductListItem
                            currency={menu.currency}
                            item={item}
                            key={item.id}
                            onOpen={() => openProductEditor(item.id)}
                            sourceLanguage={menu.sourceLanguage || "tr"}
                          />
                        ))}
                        <button className="add-row-button" onClick={() => addItem(categoryIndex)}><Plus size={16} /> {t("Add item", "Ürün ekle")}</button>
                      </div>
                    </details>
                  ))}
                  {menu.categories.length === 0 && !normalizedProductQuery && (
                    <div className="product-editor-empty">
                      <FilePlus2 aria-hidden="true" size={19} />
                      <strong>{t("Create your first category", "İlk kategorini oluştur")}</strong>
                      <span>{t("Try starting with Breakfast, Mains, or Drinks.", "Örneğin Kahvaltı, Ana Yemekler veya İçecekler ile başlayabilirsin.")}</span>
                      <button type="button" onClick={addCategory}>{t("Add category", "Kategori ekle")}</button>
                    </div>
                  )}
                  {editorCategories.length === 0 && Boolean(normalizedProductQuery) && (
                    <div className="product-editor-empty">
                      <Search aria-hidden="true" size={19} />
                      <strong>{t("No results", "Sonuç bulunamadı")}</strong>
                      <span>{t("Try a different item or category name.", "Farklı bir ürün veya kategori adı deneyebilirsin.")}</span>
                      <button type="button" onClick={() => setProductQuery("")}>{t("Clear search", "Aramayı temizle")}</button>
                    </div>
                  )}
                </div>
                  </>
                )}
                </section>
              )}
            </div>
          ) : (
            <div
              aria-labelledby="studio-tab-design"
              className="editor-content design-content"
              id="studio-panel-design"
              ref={editorScrollRef}
              role="tabpanel"
            >
              <StudioSectionNav
                activeSection={designSection}
                label={t("Design sections", "Tasarım bölümleri")}
                onChange={changeDesignSection}
                sections={localizedDesignSectionLinks}
              />

              {designSection === "ai" && (
                <section className="form-section ai-theme-designer-section studio-tool-panel" id="studio-design-ai">
                <div className="ai-theme-designer-heading">
                  <div className="ai-theme-designer-icon"><Sparkles size={19} /></div>
                  <div><span>{t("AI design assistant", "AI tasarım asistanı")}</span><h2>{t("A look made for your brand", "Markana özel görünüm")}</h2></div>
                  <div className="ai-theme-credit-cost"><Coins size={13} /> {aiCreditCosts.themeDesign} {t("credits", "kredi")}</div>
                </div>
                <p className="ai-theme-designer-description">
                  {t("Describe the atmosphere you want and let AI create the colors and visual settings around your menu.", "İstediğin atmosferi anlat; renkleri ve tüm görünüm ayarlarını menüne göre birlikte hazırlasın.")}
                </p>
                <label className="ai-theme-brief" htmlFor="ai-theme-brief">
                  <span>{t("Design direction", "Tasarım yönü")}</span>
                  <textarea
                    id="ai-theme-brief"
                    maxLength={400}
                    onChange={(event) => setThemeBrief(event.target.value)}
                    placeholder={t("e.g. A warm but premium coffee shop with natural wood tones", "Örn. Ahşap tonları kullanan, sıcak ama premium bir kahve dükkânı tasarımı")}
                    rows={3}
                    value={themeBrief}
                  />
                  <small>{themeBrief.length} / 400</small>
                </label>
                <div className="ai-theme-suggestions" aria-label={t("Design direction suggestions", "Tasarım yönü önerileri")}>
                  {localizedThemeBriefSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setThemeBrief(suggestion)}
                      type="button"
                    >{suggestion}</button>
                  ))}
                </div>
                <div className="ai-theme-designer-actions">
                  <div className={`ai-theme-balance ${themeCreditsInsufficient ? "is-low" : ""}`}>
                    <Coins size={15} />
                    <span>
                      {themeCreditsLoading && themeCreditBalance === null
                        ? t("Loading balance…", "Bakiye yükleniyor…")
                        : themeCreditsFailed && themeCreditBalance === null
                          ? t("Could not load balance", "Bakiye alınamadı")
                          : `${themeCreditBalance ?? "—"} ${t("credits available", "kredi mevcut")}`}
                    </span>
                  </div>
                  <button
                    className="ai-theme-generate-button"
                    disabled={generatingTheme || themeBrief.trim().length < 3 || themeCreditsInsufficient}
                    onClick={() => { void generateThemeDesign(); }}
                    type="button"
                  >
                    {generatingTheme
                      ? <><Loader2 className="auto-image-spinner" size={16} /> {t("Creating design", "Tasarım hazırlanıyor")}</>
                      : <><Sparkles size={16} /> {t("Generate custom design", "Özel tasarım üret")}</>}
                  </button>
                </div>
                <p className="ai-theme-charge-note">{t("Credits are charged only after a valid design is ready.", "Yalnızca doğrulanmış bir tasarım hazırlandığında kredi düşer.")}</p>
                {themeDesignFeedback && (
                  <div className={`ai-theme-feedback ${themeDesignFeedback.tone}`} aria-live="polite">
                    <div>
                      {themeDesignFeedback.tone === "success" ? <Check size={16} /> : <X size={16} />}
                      <span><strong>{themeDesignFeedback.title}</strong><small>{themeDesignFeedback.message}</small></span>
                    </div>
                    {themeDesignFeedback.tone === "success" && previousTheme && (
                      <button
                        onClick={() => {
                          setTheme(previousTheme);
                          setPreviousTheme(null);
                          setThemeDesignFeedback(null);
                        }}
                        type="button"
                      ><Undo2 size={14} /> {t("Undo", "Geri al")}</button>
                    )}
                  </div>
                )}
                </section>
              )}

              {designSection === "presets" && (
                <section className="form-section theme-preset-section studio-tool-panel" id="studio-design-presets">
                <div className="section-heading"><div><span>{t("Quick start", "Hızlı başlangıç")}</span><h2>{t("Style presets", "Hazır stiller")}</h2></div></div>
                <p className="theme-section-description">{t("Apply color, typography, and layout settings in one click, then fine-tune any detail.", "Renk, tipografi ve görünüm ayarlarını tek seçimle uygula; ardından istediğin ayrıntıyı değiştirebilirsin.")}</p>
                <div className="theme-grid">
                  {localizedThemePresetOptions.map((preset) => {
                    const presetTheme = menuThemePresets[preset.id];
                    const isActive = theme.stylePreset === preset.id;
                    return (
                      <button
                        aria-pressed={isActive}
                        key={preset.id}
                        className={`theme-option ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setTheme({ ...presetTheme });
                          setPreviousTheme(null);
                          setThemeDesignFeedback((current) => current?.tone === "success" ? null : current);
                        }}
                        type="button"
                      >
                        <span className="theme-preset-preview" style={{ background: presetTheme.background }}>
                          <i style={{ background: presetTheme.accent }} />
                          <b style={{ background: presetTheme.surface }}><i style={{ background: presetTheme.text }} /><i style={{ background: presetTheme.text }} /></b>
                        </span>
                        <span className="theme-option-copy"><strong>{preset.label}</strong><small>{preset.description}</small></span>
                        {isActive && <Check size={15} />}
                      </button>
                    );
                  })}
                </div>
                </section>
              )}

              {designSection === "brand" && (
                <section className="form-section studio-tool-panel" id="studio-design-brand">
                <div className="section-heading"><div><span>{t("Brand identity", "Marka kimliği")}</span><h2>{t("Color and typography", "Renk ve yazı")}</h2></div>{theme.stylePreset === "custom" && <div className="theme-custom-badge">{t("Custom", "Özel")}</div>}</div>
                <p className="theme-section-description">{t("Match the menu's color palette and typeface to your brand in one place.", "Menünün renk paletini ve yazı karakterini tek yerden markana uyarla.")}</p>
                <h3 className="theme-subsection-heading">{t("Color palette", "Renk paleti")}</h3>
                <div className="theme-color-grid">
                  {themeColorOptions.map((sourceColor) => {
                    const color = localizeStudioOption(sourceColor, locale);
                    return (
                    <label className="theme-color-control" key={color.id}>
                      <span>{color.label}</span>
                      <div>
                        <input
                          aria-label={t(`Choose ${color.label.toLocaleLowerCase("en-US")} color`, `${color.label} rengini seç`)}
                          type="color"
                          value={theme[color.id]}
                          onChange={(event) => updateThemeColor(color.id, event.target.value)}
                        />
                        <code>{theme[color.id].toLocaleUpperCase("en-US")}</code>
                      </div>
                    </label>
                  );})}
                </div>
                {themeAccessibilityIssues.length > 0 && <div className="theme-contrast-notice" role="status">
                  <strong>{t("Some text is difficult to read with these colors.", "Bu renklerde bazı yazılar zor okunuyor.")}</strong>
                  <p>{t("The preview and guest menu automatically balance tones for readability.", "Önizleme ve müşteri menüsü, okunabilirlik için renk tonlarını otomatik dengeler.")}</p>
                  <button type="button" onClick={() => setTheme(repairThemeAccessibility(theme))}>{t("Apply readable colors", "Okunabilir renkleri uygula")}</button>
                </div>}
                <h3 className="theme-subsection-heading typography">{t("Typeface", "Yazı karakteri")}</h3>
                <div className="font-grid">
                  {fontOptions.map((sourceFont) => {
                    const font = localizeStudioOption(sourceFont, locale);
                    return (
                    <button aria-pressed={theme.font === font.id} key={font.id} className={`${font.id} ${theme.font === font.id ? "active" : ""}`} onClick={() => updateThemeOption("font", font.id)} type="button">
                      <strong>{font.sample}</strong><span>{font.label}</span>
                    </button>
                  );})}
                </div>
                </section>
              )}

              {designSection === "layout" && (
                <section className="form-section studio-tool-panel" id="studio-design-layout">
                <div className="section-heading"><div><span>{t("Most used", "En sık kullanılan")}</span><h2>{t("Menu layout", "Menü düzeni")}</h2></div></div>
                <p className="theme-section-description">{t("Choose how items are arranged on your guest's phone.", "Ürünlerin müşterinin telefonunda nasıl sıralanacağını seç.")}</p>
                <div className="layout-grid">
                  <button aria-pressed={theme.layout === "cards"} className={theme.layout === "cards" ? "active" : ""} onClick={() => updateThemeOption("layout", "cards")} type="button"><LayoutGrid size={22} /><span><strong>{t("Cards", "Kartlar")}</strong><small>{t("Comfortable and balanced", "Rahat ve dengeli")}</small></span></button>
                  <button aria-pressed={theme.layout === "compact"} className={theme.layout === "compact" ? "active" : ""} onClick={() => updateThemeOption("layout", "compact")} type="button"><List size={22} /><span><strong>{t("Compact", "Kompakt")}</strong><small>{t("For long menus", "Uzun menüler için")}</small></span></button>
                  <button aria-pressed={theme.layout === "tiles"} className={theme.layout === "tiles" ? "active" : ""} onClick={() => updateThemeOption("layout", "tiles")} type="button"><Grid2X2 size={22} /><span><strong>{t("Grid", "Izgara")}</strong><small>{t("Two-column showcase", "İki sütunlu vitrin")}</small></span></button>
                  <button aria-pressed={theme.layout === "showcase"} className={theme.layout === "showcase" ? "active" : ""} onClick={() => updateThemeOption("layout", "showcase")} type="button"><GalleryVerticalEnd size={22} /><span><strong>{t("Showcase", "Öne çıkan")}</strong><small>{t("Highlights the first item", "İlk ürünü vurgular")}</small></span></button>
                </div>
                <label className="toggle-row"><span><strong>{t("Item descriptions", "Ürün açıklamaları")}</strong><small>{t("Show descriptions on the menu", "Menüde açıklamaları göster")}</small></span><input type="checkbox" checked={theme.showDescriptions} onChange={(event) => updateThemeOption("showDescriptions", event.target.checked)} /><i /></label>
                </section>
              )}

              {designSection === "advanced" && (
                <section className="form-section advanced-theme-section studio-tool-panel" id="studio-design-advanced">
                <div className="section-heading"><div><span>{t("Fine tuning", "İnce ayar")}</span><h2>{t("Card and layout details", "Kart ve görünüm detayları")}</h2></div><Sparkles size={17} /></div>
                <p className="theme-section-description">{t("Compare details such as corners, density, and price styling in the live preview.", "Köşe, yoğunluk ve fiyat gibi ayrıntıları canlı önizlemede karşılaştır.")}</p>
                <div className="theme-choice-list">
                  <ThemeChoiceGroup description={t("Card surface treatment", "Kartların yüzey etkisi")} label={t("Card style", "Kart stili")} onChange={(value) => updateThemeOption("cardStyle", value)} options={cardStyleOptions.map((option) => localizeStudioOption(option, locale))} value={theme.cardStyle} />
                  <ThemeChoiceGroup description={t("Card and image corners", "Kart ve görsel köşeleri")} label={t("Corners", "Köşeler")} onChange={(value) => updateThemeOption("cornerStyle", value)} options={cornerStyleOptions.map((option) => localizeStudioOption(option, locale))} value={theme.cornerStyle} />
                  <ThemeChoiceGroup description={t("Spacing between content", "Ekrandaki içerik aralığı")} label={t("Density", "Yoğunluk")} onChange={(value) => updateThemeOption("density", value)} options={densityOptions.map((option) => localizeStudioOption(option, locale))} value={theme.density} />
                  <ThemeChoiceGroup description={t("Shape of item photos", "Ürün fotoğraflarının biçimi")} label={t("Image ratio", "Görsel oranı")} onChange={(value) => updateThemeOption("imageRatio", value)} options={imageRatioOptions.map((option) => localizeStudioOption(option, locale))} value={theme.imageRatio} />
                  <ThemeChoiceGroup description={t("How the price is emphasized", "Fiyatın vurgulanma biçimi")} label={t("Price style", "Fiyat stili")} onChange={(value) => updateThemeOption("priceStyle", value)} options={priceStyleOptions.map((option) => localizeStudioOption(option, locale))} value={theme.priceStyle} />
                  <ThemeChoiceGroup description={t("Horizontal category navigation", "Yatay kategori menüsü")} label={t("Category style", "Kategori stili")} onChange={(value) => updateThemeOption("categoryStyle", value)} options={categoryStyleOptions.map((option) => localizeStudioOption(option, locale))} value={theme.categoryStyle} />
                  <ThemeChoiceGroup description={t("Top welcome area of the menu", "Menünün üst karşılama alanı")} label={t("Hero area", "Kapak alanı")} onChange={(value) => updateThemeOption("heroStyle", value)} options={heroStyleOptions.map((option) => localizeStudioOption(option, locale))} value={theme.heroStyle} />
                </div>
                </section>
              )}
            </div>
          )}
        </aside>

        {inlinePreviewOpen && <StudioPreviewStage menu={menu} theme={theme} />}
      </div>

      {publishReviewOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => { if (!publishing) setPublishReviewOpen(false); }}
        >
          <section
            className="publish-readiness-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-readiness-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              disabled={publishing}
              onClick={() => setPublishReviewOpen(false)}
              aria-label={t("Close dialog", "Pencereyi kapat")}
              type="button"
            ><X size={19} /></button>

            <div className="readiness-modal-heading">
              <span className="modal-kicker">{t("Pre-publish review", "Yayın öncesi kontrol")}</span>
              <h2 id="publish-readiness-title">{t("Give your QR menu one final review", "QR menünü son kez kontrol et")}</h2>
              <p>{t("See required fixes and suggestions that improve the guest experience in one place.", "Zorunlu alanları ve müşteri deneyimini iyileştirecek önerileri tek yerde gör.")}</p>
            </div>

            <div className={`readiness-overview ${publishReadiness.canPublish ? "ready" : "blocked"}`}>
              <div className="readiness-score" aria-label={t(`Menu quality score ${publishReadiness.score} out of 100`, `Menü kalite puanı ${publishReadiness.score}/100`)}>
                <strong>{publishReadiness.score}</strong>
                <span>/100</span>
              </div>
              <div className="readiness-overview-copy">
                <span>{t("Menu quality score", "Menü kalite puanı")}</span>
                <strong>{publishReadiness.statusLabel}</strong>
                <small>
                  {publishReadiness.canPublish
                    ? t(`${publishReadiness.visibleItemCount} visible items are ready to publish.`, `${publishReadiness.visibleItemCount} görünür ürün yayınlanmaya hazır.`)
                    : t(`${publishReadiness.blockers.length} required issues must be fixed.`, `${publishReadiness.blockers.length} zorunlu sorun düzeltilmeli.`)}
                </small>
                <div className="readiness-meter" aria-hidden="true">
                  <i style={{ width: `${publishReadiness.score}%` }} />
                </div>
              </div>
            </div>

            {publishReadiness.blockers.length > 0 && (
              <div className="readiness-issue-section">
                <div className="readiness-section-heading">
                  <div><span>{t("Required", "Zorunlu")}</span><strong>{t("Fix before publishing", "Yayından önce düzelt")}</strong></div>
                  <small>{publishReadiness.blockers.length} {t("issues", "sorun")}</small>
                </div>
                <div className="readiness-issue-list">
                  {publishReadiness.blockers.map((issue) => (
                    <article className="readiness-issue blocker" key={issue.id}>
                      <span className="readiness-issue-icon"><AlertTriangle size={17} /></span>
                      <span className="readiness-issue-copy">
                        <strong>{issue.title}</strong>
                        <small>{issue.description}</small>
                      </span>
                      <button onClick={() => goToReadinessTarget(issue.target)} type="button">
                        {t("Fix", "Düzelt")} <ArrowRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {publishReadiness.recommendations.length > 0 ? (
              <div className="readiness-issue-section recommendations">
                <div className="readiness-section-heading">
                  <div><span>{t("Improvements", "İyileştirmeler")}</span><strong>{t("Strengthen your menu", "Menünü güçlendir")}</strong></div>
                  <small>{t("Does not block publishing", "Yayını engellemez")}</small>
                </div>
                <div className="readiness-issue-list">
                  {publishReadiness.recommendations.map((issue) => (
                    <article className="readiness-issue recommendation" key={issue.id}>
                      <span className="readiness-issue-icon"><Sparkles size={16} /></span>
                      <span className="readiness-issue-copy">
                        <strong>{issue.title}</strong>
                        <small>{issue.description}</small>
                      </span>
                      <button onClick={() => goToReadinessTarget(issue.target)} type="button">
                        {t("Open", "Aç")} <ArrowRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="readiness-all-clear">
                <CheckCircle2 size={20} />
                <div><strong>{t("All checks complete", "Tüm kontroller tamam")}</strong><small>{t("Your menu looks ready to share.", "Menün paylaşmaya hazır görünüyor.")}</small></div>
              </div>
            )}

            {publishError && (
              <div className="readiness-publish-error" role="alert">
                <AlertTriangle size={17} />
                <span><strong>{t("Could not publish menu", "Menü yayınlanamadı")}</strong><small>{publishError}</small></span>
              </div>
            )}

            <div className="readiness-actions">
              <button
                className="secondary-button"
                disabled={publishing}
                onClick={() => setPublishReviewOpen(false)}
                type="button"
              >{t("Back to editing", "Düzenlemeye dön")}</button>
              {publishReadiness.canPublish ? (
                <button
                  className="primary-button"
                  disabled={publishing}
                  onClick={() => { void preparePublish(); }}
                  type="button"
                >
                  {publishing
                    ? <><Loader2 className="auto-image-spinner" size={16} /> {t("Publishing…", "Yayınlanıyor…")}</>
                    : <><QrCode size={16} /> {activeMenuStatus === "published" ? t("Publish changes", "Değişiklikleri yayınla") : t("Publish now", "Şimdi yayınla")}</>}
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={() => {
                    const firstBlocker = publishReadiness.blockers[0];
                    if (firstBlocker) goToReadinessTarget(firstBlocker.target);
                  }}
                  type="button"
                ><ArrowRight size={16} /> {t("Fix first issue", "İlk sorunu düzelt")}</button>
              )}
            </div>
          </section>
        </div>
      )}

      {publishOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPublishOpen(false)}>
          <section className="publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setPublishOpen(false)} aria-label={t("Close dialog", "Pencereyi kapat")}><X size={19} /></button>
            <div className="publish-icon"><QrCode size={25} /></div>
            <span className="modal-kicker">{t("Ready to share", "Paylaşmaya hazır")}</span>
            <h2 id="publish-title">{t("Your QR menu is ready!", "QR menün hazır!")}</h2>
            <p>{t("When guests scan the code, they'll see this version of your menu on their phone.", "Müşterilerin kodu okuttuğunda menünün bu sürümünü telefonunda görecek.")}</p>
            <div className="qr-wrap" id="menu-qr">
              <QRCodeSVG value={publishQrUrl} size={184} level="M" marginSize={2} fgColor="#20251f" bgColor="#ffffff" />
              <div className="qr-brand"><QrCode size={13} /></div>
            </div>
            <div className="link-box"><span>{publishUrl}</span><button onClick={() => void copyLink()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
            <div className="publish-actions">
              <button className="primary-button" onClick={downloadQr}><Download size={17} /> {t("Download QR code", "QR kodu indir")}</button>
              <button className="secondary-button" onClick={() => void shareLink()}><Share2 size={17} /> {t("Share", "Paylaş")}</button>
            </div>
            {activeMenuId && <a className="publish-print-link" href={`/dashboard/menus/${activeMenuId}/qr`}><Printer size={16} /> {t("Open table cards and print templates", "Masa kartı ve baskı şablonlarını aç")}</a>}
            <small>{t("This short link is permanent. Editor changes reach the same QR code only after you publish.", "Bu kısa bağlantı kalıcıdır. Editördeki değişiklikler yalnızca “Yayınla” dediğinde aynı QR koda yansır.")}</small>
          </section>
        </div>
      )}

      {mobilePreviewOpen && (
        <StudioPreviewDialog menu={menu} onClose={() => setMobilePreviewOpen(false)} theme={theme} />
      )}
    </main>
  );
}
