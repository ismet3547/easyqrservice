"use client";

import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronDown,
  Clock3,
  Coins,
  Copy,
  Download,
  EyeOff,
  FileText,
  GalleryVerticalEnd,
  Grid2X2,
  ImageOff,
  ImagePlus,
  Instagram,
  LayoutGrid,
  Leaf,
  Languages,
  List,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Plus,
  Printer,
  QrCode,
  ScanLine,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Undo2,
  UploadCloud,
  UserRound,
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
  allergenLabels,
  createId,
  dietaryTagLabels,
  decodePublishedMenu,
  defaultTheme,
  demoMenu,
  getMenuBusinessProfile,
  getMenuTranslationFingerprint,
  hasEnglishMenuTranslation,
  menuAllergens,
  menuDietaryTags,
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
import { buildMenuTrafficUrl } from "@/lib/menu-tracking";
import { aiCreditCosts } from "@/lib/ai-credit-config";
import type { GeneratedThemeDesign } from "@/lib/theme-design";
import { PublicMenu } from "@/components/MenuPreview";
import {
  Brand,
  StudioEditorTabs,
  StudioHeader,
  StudioPreviewDialog,
  StudioPreviewStage,
  StudioSectionNav,
  type StudioEditorTab,
} from "@/components/studio/StudioChrome";
import type { StoredMenu } from "@/lib/menus";

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

const themeBriefSuggestions = [
  "Sıcak ve modern",
  "Minimal ve premium",
  "Doğal ve ferah",
  "Renkli ve enerjik",
] as const;

type ContentSectionId = "products" | "basics" | "business" | "language";
type DesignSectionId = "presets" | "ai" | "brand" | "layout" | "advanced";

const contentSectionLinks: Array<{ id: ContentSectionId; label: string }> = [
  { id: "products", label: "Ürünler" },
  { id: "basics", label: "Başlık" },
  { id: "business", label: "İşletme" },
  { id: "language", label: "Dil" },
];

const designSectionLinks: Array<{ id: DesignSectionId; label: string }> = [
  { id: "presets", label: "Stiller" },
  { id: "ai", label: "AI tasarım" },
  { id: "brand", label: "Marka" },
  { id: "layout", label: "Yerleşim" },
  { id: "advanced", label: "Gelişmiş" },
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

const timezoneOptions = [
  { value: "Europe/Istanbul", label: "Türkiye · İstanbul" },
  { value: "Europe/London", label: "Birleşik Krallık · Londra" },
  { value: "Europe/Berlin", label: "Orta Avrupa · Berlin" },
  { value: "Europe/Paris", label: "Orta Avrupa · Paris" },
  { value: "Asia/Dubai", label: "BAE · Dubai" },
  { value: "America/New_York", label: "ABD · New York" },
  { value: "America/Los_Angeles", label: "ABD · Los Angeles" },
] as const;

function cloneDemoMenu() {
  return JSON.parse(JSON.stringify(demoMenu)) as MenuData;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}

function loadBrowserImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Görsel açılamadı."));
    image.src = source;
  });
}

async function prepareProductImageSource(
  source: string,
  maxDimension = 900,
  maxDataUrlLength = 750_000,
) {
  const image = await loadBrowserImage(source);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Görsel işlenemedi.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const qualities = [0.78, 0.66, 0.56, 0.46, 0.36];
  let result = "";
  for (const quality of qualities) {
    result = canvas.toDataURL("image/jpeg", quality);
    if (result.length <= maxDataUrlLength) return result;
  }
  throw new Error("Görsel menü için yeterince küçültülemedi.");
}

async function prepareProductImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Ürün görseli JPG, PNG veya WEBP olmalı.");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Ürün görseli 8 MB’tan küçük olmalı.");
  }

  return prepareProductImageSource(await fileToDataUrl(file));
}

async function prepareBusinessLogo(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Logo JPG, PNG veya WEBP olmalı.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Logo 5 MB’tan küçük olmalı.");
  }

  const image = await loadBrowserImage(await fileToDataUrl(file));
  const dimensions = [480, 360, 280, 220];
  const qualities = [0.88, 0.76, 0.64];

  for (const maxDimension of dimensions) {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Logo işlenemedi.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const result = canvas.toDataURL("image/webp", quality);
      if (result.length <= 500_000) return result;
    }
  }

  throw new Error("Logo menü için yeterince küçültülemedi.");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir sorun oluştu.";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const themeColorFrameRef = useRef<number | null>(null);
  const pendingThemeColorRef = useRef<{ key: ThemeColorKey; value: string } | null>(null);
  const [screen, setScreen] = useState<"upload" | "studio">("upload");
  const [tab, setTab] = useState<StudioEditorTab>("content");
  const [contentSection, setContentSection] = useState<ContentSectionId>("products");
  const [designSection, setDesignSection] = useState<DesignSectionId>("presets");
  const [productQuery, setProductQuery] = useState("");
  const [expandedItemId, setExpandedItemId] = useState("");
  const [categoryOpenState, setCategoryOpenState] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<MenuData>(() => cloneDemoMenu());
  const [theme, setTheme] = useState<MenuTheme>(defaultTheme);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
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
  const totalItemCount = menu.categories.reduce((sum, category) => sum + category.items.length, 0);
  const missingImageCount = menu.categories.reduce(
    (sum, category) =>
      sum + category.items.filter((item) => !item.image && item.availability !== "hidden").length,
    0,
  );
  const normalizedProductQuery = productQuery.trim().toLocaleLowerCase("tr-TR");
  const editorCategories = menu.categories
    .map((category, categoryIndex) => {
      const categoryMatches = category.name.toLocaleLowerCase("tr-TR").includes(normalizedProductQuery);
      const items = category.items
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => {
          if (!normalizedProductQuery || categoryMatches) return true;
          return [item.name, item.description, item.badge, item.price]
            .some((value) => value.toLocaleLowerCase("tr-TR").includes(normalizedProductQuery));
        });
      return { category, categoryIndex, categoryMatches, items };
    })
    .filter(({ categoryMatches, items }) => !normalizedProductQuery || categoryMatches || items.length > 0);
  const filteredItemCount = editorCategories.reduce((sum, category) => sum + category.items.length, 0);
  const englishCoverage = getEnglishTranslationCoverage(menu);
  const hasEnglishTranslation = hasEnglishMenuTranslation(menu);
  const publishQrUrl = buildMenuTrafficUrl(publishUrl, "qr");
  const englishTranslationCurrent = hasEnglishTranslation &&
    englishCoverage.percentage === 100 &&
    menu.translations?.en?.sourceFingerprint === getMenuTranslationFingerprint(menu);
  const businessProfile = getMenuBusinessProfile(menu);
  const themeCreditsInsufficient = themeCreditBalance !== null &&
    themeCreditBalance < aiCreditCosts.themeDesign;
  const changeEditorTab = (nextTab: StudioEditorTab) => {
    setTab(nextTab);
    window.requestAnimationFrame(() => {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const changeContentSection = (nextSection: ContentSectionId) => {
    setContentSection(nextSection);
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
        const payload = await decodePublishedMenu(window.location.hash.slice(6));
        setPublicPayload(payload);
      } catch (decodeError) {
        setPublicError(getErrorMessage(decodeError));
      }
    };
    void readHash();
  }, []);

  useEffect(() => {
    if (window.location.hash.startsWith("#menu=")) return;
    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = (await response.json()) as { user: AuthUser | null };
        if (!result.user) {
          setAuthStatus("anonymous");
          return;
        }

        setCurrentUser(result.user);
        setAuthStatus("authenticated");
        const searchParams = new URLSearchParams(window.location.search);
        const requestedMenuId = searchParams.get("menu");
        if (requestedMenuId) {
          const menuResponse = await fetch(`/api/menus/${requestedMenuId}`, { cache: "no-store" });
          if (menuResponse.ok) {
            const menuResult = (await menuResponse.json()) as { menu: StoredMenu };
            setMenu(menuResult.menu.menu);
            setTheme(normalizeMenuTheme(menuResult.menu.theme));
            setActiveMenuId(menuResult.menu.id);
            setActiveMenuSlug(menuResult.menu.slug);
            setActiveMenuStatus(menuResult.menu.status);
            setScreen("studio");
          } else {
            setError("Açmak istediğin menü bulunamadı.");
          }
          return;
        }
        if (searchParams.has("new")) return;

        const draftKey = `easyqr-draft:${result.user.id}`;
        const draft = window.localStorage.getItem(draftKey);
        if (!draft) return;
        try {
          const saved = JSON.parse(draft) as PublishedMenu;
          if (saved?.menu?.categories && saved?.theme?.accent) {
            setMenu(saved.menu);
            setTheme(normalizeMenuTheme(saved.theme));
            setNotice("Son taslağın hesabın için geri yüklendi.");
            setScreen("studio");
          }
        } catch {
          window.localStorage.removeItem(draftKey);
        }
      } catch {
        setAuthStatus("anonymous");
      }
    };
    void loadUser();
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
        if (!response.ok || !result.credits) throw new Error("Kredi bilgisi alınamadı.");
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
    window.localStorage.setItem(
      `easyqr-draft:${currentUser.id}`,
      JSON.stringify({ menu, theme }),
    );
  }, [currentUser, menu, screen, theme]);

  useEffect(() => {
    if (screen !== "studio" || !currentUser || !activeMenuId) return;
    setSaveStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/menus/${activeMenuId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menu, theme, status: activeMenuStatus }),
        });
        setSaveStatus(response.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [activeMenuId, activeMenuStatus, currentUser, menu, screen, theme]);

  const persistNewMenu = async (newMenu: MenuData, newTheme: MenuTheme) => {
    const response = await fetch("/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menu: newMenu, theme: newTheme }),
    });
    const result = (await response.json()) as { menu?: StoredMenu; message?: string };
    if (!response.ok || !result.menu) throw new Error(result.message || "Menü kaydedilemedi.");
    setActiveMenuId(result.menu.id);
    setActiveMenuSlug(result.menu.slug);
    setActiveMenuStatus(result.menu.status);
    window.history.replaceState(null, "", `/studio?menu=${result.menu.id}`);
    return result.menu;
  };

  const goToLogin = () => {
    window.location.href = "/giris?next=%2Fstudio%3Fnew%3D1";
  };

  const requestUpload = () => {
    if (!currentUser) {
      goToLogin();
      return;
    }
    inputRef.current?.click();
  };

  const openDemo = async () => {
    if (!currentUser) {
      goToLogin();
      return;
    }
    const demo = cloneDemoMenu();
    setMenu(demo);
    setTheme(defaultTheme);
    setNotice("Örnek menü açık — tüm alanları özgürce değiştirebilirsin.");
    setScreen("studio");
    try {
      await persistNewMenu(demo, defaultTheme);
    } catch (persistError) {
      setNotice(getErrorMessage(persistError));
      setSaveStatus("error");
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
      setError("Lütfen JPG, PNG, WEBP veya PDF biçiminde bir dosya seç.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Dosya 12 MB’tan küçük olmalı.");
      return;
    }

    setError("");
    setNotice("");
    setFileName(file.name);
    setLoading(true);

    try {
      const dataUrl = await fileToDataUrl(file);
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
          const demo = cloneDemoMenu();
          setMenu(demo);
          setNotice(
            "Demo modu açık: API anahtarı eklenene kadar örnek ürünlerle tasarım yapabilirsin.",
          );
          setScreen("studio");
          await persistNewMenu(demo, theme);
          return;
        }
        throw new Error(result.message || "Menü analiz edilemedi.");
      }
      if (!result.menu) throw new Error("Menü verisi alınamadı.");
      setMenu(result.menu);
      setNotice(
        cacheHit
          ? `${file.name} daha önce analiz edilmişti; menü önbellekten anında getirildi.`
          : `${file.name} başarıyla okundu. Fiyatları yayınlamadan önce kontrol et.`,
      );
      setScreen("studio");
      await persistNewMenu(result.menu, theme);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError));
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
      const logo = await prepareBusinessLogo(file);
      updateBusinessProfile({ logo });
      setNotice("İşletme logosu menü için optimize edildi ve eklendi.");
    } catch (logoError) {
      setNotice(`Logo eklenemedi: ${getErrorMessage(logoError)}`);
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
    const itemId = createId("urun");
    const categoryId = menu.categories[categoryIndex]?.id;
    setProductQuery("");
    setExpandedItemId(itemId);
    if (categoryId) {
      setCategoryOpenState((current) => ({ ...current, [categoryId]: true }));
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
                  name: "Yeni ürün",
                  description: "Ürün açıklaması",
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
  };

  const updateItemImage = async (categoryIndex: number, itemIndex: number, file?: File) => {
    if (!file) return;
    try {
      const image = await prepareProductImage(file);
      updateItem(categoryIndex, itemIndex, "image", image);
      setNotice("Ürün görseli menü için optimize edildi ve eklendi.");
    } catch (imageError) {
      setNotice(`Görsel eklenemedi: ${getErrorMessage(imageError)}`);
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
      setNotice("Tüm ürünlerin görseli zaten hazır.");
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
      setNotice("Menü görsel depolama sınırına yaklaştı. Devam etmek için bazı büyük görselleri kaldır veya değiştir.");
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
            throw new Error(result.message || "Görsel servisine şu anda ulaşılamıyor.");
          }
          failed += 1;
        } else if (!result.imageDataUrl) {
          failed += 1;
        } else {
          try {
            const optimizedImage = await prepareProductImageSource(result.imageDataUrl, 720, 420_000);
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
        setNotice("Görseller üretilemedi. Ürün adlarını ve açıklamalarını kontrol edip tekrar dene.");
      } else {
        const remaining = Math.max(0, missingItems.length - completed);
        let message = completed + " ürün görseli otomatik oluşturuldu.";
        if (cacheHits > 0) message += " " + cacheHits + " tanesi önbellekten getirildi.";
        if (failed > 0) message += " " + failed + " ürün atlandı.";
        if (remaining > 0) message += " Kalan " + remaining + " ürün için düğmeye tekrar basabilirsin.";
        setNotice(message);
      }
    } catch (generationError) {
      const prefix = completed > 0 ? completed + " görsel hazırlandı. " : "";
      setNotice(prefix + getErrorMessage(generationError));
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
      setNotice("Menü görsel depolama sınırına yaklaştı. Önce bazı büyük görselleri kaldır veya değiştir.");
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
        throw new Error(result.message || "Bu ürün için görsel üretilemedi.");
      }

      const optimizedImage = await prepareProductImageSource(result.imageDataUrl, 720, 420_000);
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
      setNotice((item.name.trim() || "Ürün") + " için yeni AI görseli hazırlandı.");
    } catch (generationError) {
      setNotice("Görsel yenilenemedi: " + getErrorMessage(generationError));
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
        throw new Error(result.message || "İngilizce çeviri oluşturulamadı.");
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
          ? "Aynı içerik daha önce çevrilmişti; İngilizce menü önbellekten anında getirildi."
          : "İngilizce çeviri hazır. Yabancı ziyaretçiler menüyü otomatik olarak İngilizce görecek.",
      );
    } catch (translationError) {
      setNotice("Çeviri oluşturulamadı: " + getErrorMessage(translationError));
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
        title: "Kısa bir yön tarif et",
        message: "Örneğin “sıcak, modern ve kahve tonlarında” yazabilirsin.",
      });
      return;
    }
    if (
      themeCreditBalance !== null &&
      themeCreditBalance < aiCreditCosts.themeDesign
    ) {
      setThemeDesignFeedback({
        tone: "error",
        title: "Kredi bakiyesi yetersiz",
        message: `Bu tasarım için ${aiCreditCosts.themeDesign} kredi gerekiyor.`,
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
        setSaveStatus("saving");
        const saveResponse = await fetch(`/api/menus/${menuId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menu, theme, status: activeMenuStatus }),
        });
        let saveResult: { message?: string } = {};
        try {
          saveResult = (await saveResponse.json()) as typeof saveResult;
        } catch {
          saveResult = {};
        }
        if (!saveResponse.ok) {
          setSaveStatus("error");
          throw new Error(saveResult.message || "Menü AI tasarımından önce kaydedilemedi.");
        }
        setSaveStatus("saved");
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
        throw new Error(result.message || "AI tasarımı oluşturulamadı.");
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
        title: "Tasarım oluşturulamadı",
        message: getErrorMessage(designError),
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
    const categoryId = createId("kategori");
    setCategoryOpenState((current) => ({ ...current, [categoryId]: true }));
    setMenu((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: categoryId,
          name: "Yeni kategori",
          items: [],
        },
      ],
    }));
  };

  const removeCategory = (categoryIndex: number) => {
    const removedCategoryId = menu.categories[categoryIndex]?.id;
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

  const preparePublish = async () => {
    try {
      let menuId = activeMenuId;
      let menuSlug = activeMenuSlug;
      if (!menuId) {
        const storedMenu = await persistNewMenu(menu, theme);
        menuId = storedMenu.id;
        menuSlug = storedMenu.slug;
      }
      const response = await fetch(`/api/menus/${menuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu, theme, status: "published" }),
      });
      const result = (await response.json()) as { menu?: StoredMenu; message?: string };
      if (!response.ok || !result.menu) throw new Error(result.message || "Menü yayınlanamadı.");
      menuSlug = result.menu.slug;
      setActiveMenuStatus("published");
      setActiveMenuSlug(menuSlug);
      setSaveStatus("saved");
      setPublishUrl(`${window.location.origin}/m/${menuSlug}`);
      setPublishOpen(true);
      setCopied(false);
    } catch (publishError) {
      setNotice(getErrorMessage(publishError));
      setSaveStatus("error");
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${menu.restaurantName} menüsü`, url: publishUrl });
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
    link.download = `${menu.restaurantName.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}-qr.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setAuthStatus("anonymous");
    setScreen("upload");
    setNotice("");
    window.location.href = "/";
  };

  const goToDashboard = async () => {
    if (activeMenuId) {
      await fetch(`/api/menus/${activeMenuId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu, theme, status: activeMenuStatus }),
      }).catch(() => null);
    }
    window.location.href = "/dashboard";
  };

  if (publicPayload) {
    return <PublicMenu menu={publicPayload.menu} theme={publicPayload.theme} />;
  }

  if (publicError) {
    return (
      <main className="link-error-page">
        <div className="link-error-card">
          <div className="brand-mark"><QrCode size={22} /></div>
          <h1>Bu menü bağlantısı açılamadı</h1>
          <p>{publicError}</p>
          <button className="primary-button" onClick={() => { window.location.hash = ""; window.location.reload(); }}>
            easyqr ana sayfasına dön
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
          <nav aria-label="Uygulama yolu">
            <a href="/dashboard">Dashboard</a><span>/</span><a href="/dashboard/menus">Menülerim</a><span>/</span><strong>Yeni menü</strong>
          </nav>
          <div className="studio-new-user">
            <span><UserRound size={16} /> {currentUser?.name}</span>
            <button className="icon-button" aria-label="Çıkış yap" onClick={() => void logout()}><LogOut size={16} /></button>
          </div>
        </header>

        <section className="studio-new-content">
          <a className="studio-new-back" href="/dashboard/menus"><ArrowLeft size={16} /> Menülerime dön</a>
          <div className="studio-new-title">
            <span><Sparkles size={14} /> Yeni menü</span>
            <h1>Menünü nasıl oluşturmak istersin?</h1>
            <p>Mevcut dosyanı yapay zekâ ile dönüştür veya örnek içerikle başlayıp kendin düzenle.</p>
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
                  <h2>Menün okunuyor</h2>
                  <p>{fileName}</p>
                  <div className="analysis-steps">
                    <span className="done"><Check size={14} /> Dosya alındı</span>
                    <span className="active"><Loader2 size={14} /> Ürünler ayrıştırılıyor</span>
                    <span>Tasarım hazırlanıyor</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="workspace-upload-icon"><UploadCloud size={30} /></div>
                  <span className="workspace-option-label">Önerilen</span>
                  <h2>Menü dosyanı yükle</h2>
                  <p>PDF veya menü fotoğrafını bırak; ürünleri ve fiyatları yapay zekâ ayırsın.</p>
                  <button className="primary-button" onClick={requestUpload}><Sparkles size={17} /> Dosya seç ve dönüştür</button>
                  <div className="file-types"><span>PDF</span><span>JPG</span><span>PNG</span><small>Maks. 12 MB</small></div>
                </>
              )}
              <input ref={inputRef} className="sr-only" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={onInputChange} />
            </div>

            <div className="workspace-manual-card">
              <div className="workspace-manual-icon"><FileText size={27} /></div>
              <span className="workspace-option-label neutral">Alternatif</span>
              <h2>Örnek menüyle başla</h2>
              <p>Hazır kategorileri ve ürünleri aç, sonra tüm alanları işletmene göre değiştir.</p>
              <button className="secondary-button" onClick={() => void openDemo()}><Plus size={17} /> Örnek taslak oluştur</button>
              <small>Sonrasında tüm ürünleri silebilir veya yenilerini ekleyebilirsin.</small>
            </div>
          </div>

          {error && <div className="workspace-error"><X size={16} /> {error}</div>}

          <div className="studio-new-steps">
            <article><span>1</span><div><strong>İçeriği aktar</strong><small>Dosyadan veya örnekten başla</small></div></article>
            <i />
            <article><span>2</span><div><strong>Tasarımı düzenle</strong><small>Renk ve görünümü seç</small></div></article>
            <i />
            <article><span>3</span><div><strong>QR kodunu yayınla</strong><small>Kalıcı bağlantını paylaş</small></div></article>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "upload") {
    return (
      <main className="landing-shell">
        <header className="landing-header">
          <Brand />
          <nav aria-label="Ana menü">
            <a href="#nasil-calisir">Nasıl çalışır?</a>
            <button className="nav-demo" onClick={openDemo}>Örnek menü</button>
          </nav>
          <div className="landing-auth-actions">
            {authStatus === "loading" ? (
              <span className="auth-status-skeleton" />
            ) : currentUser ? (
              <>
                <a className="landing-user" href="/dashboard"><UserRound size={15} /> Dashboard</a>
                <button className="header-cta" onClick={requestUpload}>Menü oluştur</button>
              </>
            ) : (
              <>
                <a className="login-link" href="/giris">Giriş yap</a>
                <a className="header-cta" href="/kayit">Ücretsiz başla</a>
              </>
            )}
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Yapay zekâ destekli QR menü</div>
            <h1>Kâğıt menünden<br /><span>dijital deneyime.</span></h1>
            <p>
              Menünü yükle. Yapay zekâ ürünleri ve fiyatları ayırsın. Markana uygun,
              telefonda harika görünen QR menün dakikalar içinde hazır olsun.
            </p>
            <div className="hero-proof">
              <span><Check size={16} /> Tasarım bilgisi gerekmez</span>
              <span><Check size={16} /> Kredi kartı gerekmez</span>
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
                  <h2>Menün okunuyor</h2>
                  <p>{fileName}</p>
                  <div className="analysis-steps">
                    <span className="done"><Check size={14} /> Dosya alındı</span>
                    <span className="active"><Loader2 size={14} /> Ürünler ayrıştırılıyor</span>
                    <span>Tasarım hazırlanıyor</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="upload-icon"><UploadCloud size={28} /></div>
                  <div>
                    <h2>Menünü buraya bırak</h2>
                    <p>ya da bilgisayarından bir dosya seç</p>
                  </div>
                  <button className="primary-button upload-button" onClick={requestUpload}>
                    <Sparkles size={17} /> Menüyü dönüştür
                  </button>
                  <div className="file-types">
                    <span>PDF</span><span>JPG</span><span>PNG</span><small>Maks. 12 MB</small>
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
            <button className="demo-link" onClick={openDemo}>Dosyan hazır değil mi? Örnek menüyü dene <span>→</span></button>
          </div>
        </section>

        <section className="how-it-works" id="nasil-calisir">
          <div className="section-intro">
            <span>Üç basit adım</span>
            <h2>Menün, yeniden tasarlanmış halde.</h2>
          </div>
          <div className="feature-grid">
            <article><div className="feature-number">01</div><ScanLine size={25} /><h3>Yükle</h3><p>Fotoğrafını çek veya PDF menünü yükle.</p></article>
            <article><div className="feature-number">02</div><Palette size={25} /><h3>Kişiselleştir</h3><p>Renkleri, yazı stilini ve görünümü markana uyarla.</p></article>
            <article><div className="feature-number">03</div><QrCode size={25} /><h3>Paylaş</h3><p>QR kodunu indir, masalara yerleştir ve yayına al.</p></article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="studio-shell">
      <StudioHeader
        documentName={menu.restaurantName}
        onBack={() => { void goToDashboard(); }}
        onLogout={() => { void logout(); }}
        onOpenPreview={() => setMobilePreviewOpen(true)}
        onPublish={() => { void preparePublish(); }}
        saveStatus={saveStatus}
        userName={currentUser?.name}
      />

      <div className="studio-body">
        <aside className="editor-panel">
          <StudioEditorTabs activeTab={tab} onChange={changeEditorTab} />

          {notice && <div className="notice"><Sparkles size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Bildirimi kapat"><X size={14} /></button></div>}

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
                label="İçerik bölümleri"
                onChange={changeContentSection}
                sections={contentSectionLinks}
              />

              {contentSection === "basics" && (
                <section className="form-section studio-tool-panel" id="studio-content-basics">
                <div className="section-heading"><div><span>İşletme</span><h2>Menü başlığı</h2></div></div>
                <label className="field-label">İşletme adı<input value={menu.restaurantName} onChange={(event) => setMenu({ ...menu, restaurantName: event.target.value })} /></label>
                <label className="field-label">Kısa açıklama<input value={menu.subtitle} onChange={(event) => setMenu({ ...menu, subtitle: event.target.value })} /></label>
                </section>
              )}

              {contentSection === "business" && (
                <section className="form-section business-profile-section studio-tool-panel" id="studio-content-business">
                <div className="section-heading">
                  <div><span>İşletme profili</span><h2>Logo, iletişim ve saatler</h2></div>
                  <div className="business-profile-status">İsteğe bağlı</div>
                </div>
                <p className="business-profile-help">
                  Doldurduğun bilgiler müşteri menüsünde görünür. Boş bıraktığın bağlantılar gizlenir.
                </p>

                <div className="business-logo-editor">
                  <div className={`business-logo-preview ${businessProfile.logo ? "has-logo" : ""}`}>
                    {businessProfile.logo
                      ? <img src={businessProfile.logo} alt="İşletme logosu önizlemesi" />
                      : <ImagePlus aria-hidden="true" size={22} />}
                  </div>
                  <div className="business-logo-copy">
                    <strong>İşletme logosu</strong>
                    <small>Şeffaf PNG kullanabilirsin · otomatik küçültülür</small>
                  </div>
                  <div className="business-logo-actions">
                    <label>
                      <UploadCloud size={14} /> {businessProfile.logo ? "Değiştir" : "Logo yükle"}
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
                        aria-label="İşletme logosunu kaldır"
                        onClick={() => updateBusinessProfile({ logo: "" })}
                        type="button"
                      ><Trash2 size={14} /> Kaldır</button>
                    )}
                  </div>
                </div>

                <label className="field-label business-field-with-icon">
                  <span><MapPin size={14} /> Adres</span>
                  <textarea
                    maxLength={300}
                    placeholder="Örn. Caferağa Mah. Moda Cad. No: 12, Kadıköy / İstanbul"
                    rows={3}
                    value={businessProfile.address}
                    onChange={(event) => updateBusinessProfile({ address: event.target.value })}
                  />
                </label>

                <div className="business-contact-grid">
                  <label className="field-label business-field-with-icon">
                    <span><Phone size={14} /> Telefon</span>
                    <input
                      maxLength={60}
                      placeholder="+90 212 000 00 00"
                      type="tel"
                      value={businessProfile.phone}
                      onChange={(event) => updateBusinessProfile({ phone: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><MessageCircle size={14} /> WhatsApp</span>
                    <input
                      maxLength={120}
                      placeholder="+90 555 000 00 00"
                      value={businessProfile.whatsapp}
                      onChange={(event) => updateBusinessProfile({ whatsapp: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><Instagram size={14} /> Instagram</span>
                    <input
                      maxLength={120}
                      placeholder="@kullaniciadi"
                      value={businessProfile.instagram}
                      onChange={(event) => updateBusinessProfile({ instagram: event.target.value })}
                    />
                  </label>
                  <label className="field-label business-field-with-icon">
                    <span><MapPin size={14} /> Google Maps bağlantısı</span>
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
                      <strong><Clock3 size={15} /> Çalışma saatleri</strong>
                      <small>Açık/kapalı durumu müşterinin bulunduğu anda hesaplanır</small>
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
                        Saat dilimi
                        <select
                          value={businessProfile.timezone}
                          onChange={(event) => updateBusinessProfile({ timezone: event.target.value })}
                        >
                          {timezoneOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
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
                                <span>{weekdayLabels[weekday]}</span>
                              </label>
                              {hours.isOpen ? (
                                <div className="weekly-time-inputs">
                                  <input
                                    aria-label={`${weekdayLabels[weekday]} açılış saati`}
                                    type="time"
                                    value={hours.opensAt}
                                    onChange={(event) => {
                                      if (event.target.value) updateBusinessHours(weekday, { opensAt: event.target.value });
                                    }}
                                  />
                                  <span>—</span>
                                  <input
                                    aria-label={`${weekdayLabels[weekday]} kapanış saati`}
                                    type="time"
                                    value={hours.closesAt}
                                    onChange={(event) => {
                                      if (event.target.value) updateBusinessHours(weekday, { closesAt: event.target.value });
                                    }}
                                  />
                                </div>
                              ) : <span className="weekly-closed-label">Kapalı</span>}
                            </div>
                          );
                        })}
                      </div>
                      <p className="overnight-hours-note">Gece yarısını aşan saatler desteklenir; örneğin 18:00 — 02:00.</p>
                    </div>
                  )}
                </div>
                </section>
              )}

              {contentSection === "language" && (
                <section className="form-section translation-section studio-tool-panel" id="studio-content-language">
                <div className="section-heading">
                  <div><span>Dil desteği</span><h2>İngilizce menü</h2></div>
                  <div className={`translation-status ${englishTranslationCurrent ? "ready" : hasEnglishTranslation ? "stale" : "empty"}`}>
                    {englishTranslationCurrent ? "Güncel" : hasEnglishTranslation ? "Güncelle" : "Hazır değil"}
                  </div>
                </div>
                <div className={`translation-assistant ${englishTranslationCurrent ? "is-ready" : hasEnglishTranslation ? "is-stale" : ""}`} aria-live="polite">
                  <div className="translation-assistant-copy">
                    <span className="translation-assistant-icon"><Languages size={18} /></span>
                    <div>
                      <strong>
                        {englishTranslationCurrent
                          ? "İngilizce çeviri yayına hazır"
                          : hasEnglishTranslation
                            ? "Türkçe içerik değişti"
                            : "Menüyü tek tıkla İngilizceye çevir"}
                      </strong>
                      <p>
                        {englishTranslationCurrent
                          ? "Tarayıcı dili Türkçe olmayan ziyaretçiler İngilizce menüyü doğrudan görür."
                          : hasEnglishTranslation
                            ? "Son değişikliklerin İngilizce menüye yansıması için çeviriyi güncelle."
                            : "Ürün adları, açıklamalar, kategoriler ve etiketler çevrilir; fiyatlar ile görseller değişmez."}
                      </p>
                    </div>
                  </div>
                  <button
                    className="translation-button"
                    disabled={translatingEnglish}
                    onClick={() => { void generateEnglishTranslation(); }}
                    title="OpenAI kullanım kotanı kullanır"
                  >
                    {translatingEnglish ? <Loader2 className="auto-image-spinner" size={16} /> : <Languages size={16} />}
                    {translatingEnglish
                      ? "Çevriliyor…"
                      : englishTranslationCurrent
                        ? "Çeviriyi yenile"
                        : hasEnglishTranslation
                          ? "Çeviriyi güncelle"
                          : "İngilizceyi oluştur"}
                  </button>
                  <div className="translation-progress">
                    <span aria-hidden="true"><i style={{ width: englishCoverage.percentage + "%" }} /></span>
                    <small>{englishCoverage.percentage}% çevrildi</small>
                  </div>
                </div>
                </section>
              )}

              {contentSection === "products" && (
                <section className="form-section categories-section studio-tool-panel" id="studio-content-products">
                <div className="section-heading">
                  <div><span>İçerik</span><h2>Kategoriler ve ürünler</h2></div>
                  <div className="item-count">{totalItemCount} ürün</div>
                </div>
                <div className="auto-image-assistant" aria-live="polite">
                  <div className="auto-image-copy">
                    <span className="auto-image-icon"><Sparkles size={17} /></span>
                    <div>
                      <strong>AI görsel asistanı</strong>
                      <p>
                        {missingImageCount > 0
                          ? <>{missingImageCount} üründe görsel eksik. Tek seferde en fazla 6 görsel üretilir; eklediklerin korunur.</>
                          : <>Tüm ürünlerin görseli hazır.</>}
                      </p>
                    </div>
                  </div>
                  <button
                    className="auto-image-button"
                    disabled={generatingImages || Boolean(generatingItemId) || missingImageCount === 0}
                    onClick={() => { void generateMissingImages(); }}
                    title="OpenAI kullanım kotanı kullanır"
                  >
                    {generatingImages ? <Loader2 className="auto-image-spinner" size={16} /> : <Sparkles size={16} />}
                    {generatingImages
                      ? <>{imageGenerationProgress.done}/{imageGenerationProgress.total} hazırlanıyor</>
                      : <>AI ile tamamla</>}
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
                      <small>{imageGenerationProgress.done} / {imageGenerationProgress.total} ürün işlendi</small>
                    </div>
                  )}
                </div>
                <div className="product-editor-toolbar">
                  <label className="product-editor-search">
                    <Search aria-hidden="true" size={16} />
                    <input
                      aria-label="Ürünlerde ara"
                      onChange={(event) => setProductQuery(event.target.value)}
                      placeholder="Ürün, kategori veya fiyat ara"
                      type="search"
                      value={productQuery}
                    />
                  </label>
                  <span>{normalizedProductQuery ? `${filteredItemCount} sonuç` : `${menu.categories.length} kategori`}</span>
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
                        setCategoryOpenState((current) => current[category.id] === isOpen
                          ? current
                          : { ...current, [category.id]: isOpen });
                      }}
                      open={Boolean(normalizedProductQuery) || categoryOpenState[category.id] === true}
                    >
                      <summary>
                        <ChevronDown className="category-chevron" size={17} />
                        <input
                          aria-label="Kategori adı"
                          value={category.name}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            const categories = menu.categories.map((item, index) => index === categoryIndex ? { ...item, name: event.target.value } : item);
                            setMenu({ ...menu, categories });
                          }}
                        />
                        <span>{category.items.length}</span>
                        <button aria-label="Kategoriyi sil" onClick={(event) => { event.preventDefault(); removeCategory(categoryIndex); }}><Trash2 size={15} /></button>
                      </summary>
                      <div className="category-items">
                        {items.map(({ item, itemIndex }) => (
                          <details
                            className={`item-editor availability-${item.availability || "available"}`}
                            key={item.id}
                            onToggle={(event) => {
                              const isOpen = event.currentTarget.open;
                              setExpandedItemId((current) => isOpen ? item.id : current === item.id ? "" : current);
                            }}
                            open={expandedItemId === item.id}
                          >
                            <summary className="item-editor-summary">
                              <span className={`item-editor-summary-image ${item.image ? "has-image" : ""}`}>
                                {item.image ? <img src={item.image} alt="" /> : <ImagePlus aria-hidden="true" size={18} />}
                              </span>
                              <span className="item-editor-summary-copy">
                                <strong>{item.name || "İsimsiz ürün"}</strong>
                                <small>
                                  {[
                                    item.availability === "sold-out"
                                      ? "Tükendi"
                                      : item.availability === "hidden"
                                        ? "Gizli"
                                        : "Satışta",
                                    item.isCampaign ? "Kampanya" : "",
                                    item.badge,
                                  ].filter(Boolean).join(" · ")}
                                </small>
                              </span>
                              <span className="item-editor-summary-price">
                                {item.isCampaign && item.originalPrice && <del>{item.originalPrice}{menu.currency}</del>}
                                <strong>{item.price || "0"}{menu.currency}</strong>
                              </span>
                              <ChevronDown className="item-editor-chevron" aria-hidden="true" size={16} />
                            </summary>
                            <div className="item-editor-body">
                            <div className="item-editor-top">
                              <input aria-label="Ürün adı" className="item-name-input" value={item.name} onChange={(event) => updateItem(categoryIndex, itemIndex, "name", event.target.value)} />
                              <div className="price-input"><input aria-label={item.isCampaign ? "Kampanyalı fiyat" : "Fiyat"} value={item.price} onChange={(event) => updateItem(categoryIndex, itemIndex, "price", event.target.value)} /><span>{menu.currency}</span></div>
                              <button aria-label="Ürünü sil" onClick={() => removeItem(categoryIndex, itemIndex)}><Trash2 size={15} /></button>
                            </div>
                            <textarea aria-label="Ürün açıklaması" rows={2} value={item.description} onChange={(event) => updateItem(categoryIndex, itemIndex, "description", event.target.value)} />
                            <div className="item-image-editor">
                              <label className={item.image ? "has-image" : ""}>
                                {item.image ? <img src={item.image} alt="" /> : <ImagePlus size={18} />}
                                <span><strong>{item.image ? "Görseli değiştir" : "Ürün görseli ekle"}</strong><small>JPG, PNG veya WEBP · otomatik küçültülür</small></span>
                                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void updateItemImage(categoryIndex, itemIndex, event.target.files?.[0]); event.target.value = ""; }} />
                              </label>
                              <div className="item-image-actions">
                                <button
                                  className="item-ai-image-button"
                                  disabled={generatingImages || Boolean(generatingItemId)}
                                  aria-label={(item.image ? "AI ile görseli yenile: " : "AI ile görsel oluştur: ") + (item.name || "ürün")}
                                  onClick={() => { void generateItemImage(categoryIndex, itemIndex); }}
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
                                    onClick={() => updateItem(categoryIndex, itemIndex, "image", "")}
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
                                  {(item.availability || "available") === "sold-out"
                                    ? "Menüde görünür ve Tükendi etiketi taşır."
                                    : (item.availability || "available") === "hidden"
                                      ? "Müşteri menüsünde ve kategori sayısında görünmez."
                                      : "Müşteriler ürünü normal şekilde görür."}
                                </small>
                              </div>
                              <div className="availability-options" role="group" aria-label={(item.name || "Ürün") + " menü durumu"}>
                                <button
                                  className={`availability-option available ${(item.availability || "available") === "available" ? "active" : ""}`}
                                  aria-pressed={(item.availability || "available") === "available"}
                                  onClick={() => updateItem(categoryIndex, itemIndex, "availability", "available")}
                                >
                                  <Check size={13} /> Satışta
                                </button>
                                <button
                                  className={`availability-option sold-out ${item.availability === "sold-out" ? "active" : ""}`}
                                  aria-pressed={item.availability === "sold-out"}
                                  onClick={() => updateItem(categoryIndex, itemIndex, "availability", "sold-out")}
                                >
                                  <X size={13} /> Tükendi
                                </button>
                                <button
                                  className={`availability-option hidden ${item.availability === "hidden" ? "active" : ""}`}
                                  aria-pressed={item.availability === "hidden"}
                                  onClick={() => updateItem(categoryIndex, itemIndex, "availability", "hidden")}
                                >
                                  <EyeOff size={13} /> Gizli
                                </button>
                              </div>
                            </div>
                            <details className="item-dietary-editor">
                              <summary>
                                <Leaf size={16} />
                                <span className="item-dietary-summary-copy">
                                  <strong>Beslenme &amp; alerjenler</strong>
                                  <small>Menüde gösterilecek ürün bilgileri</small>
                                </span>
                                <b>{(item.dietaryTags?.length || 0) + (item.allergens?.length || 0)}</b>
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
                                        onClick={() => toggleDietaryTag(categoryIndex, itemIndex, tag)}
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
                                        onClick={() => toggleAllergen(categoryIndex, itemIndex, allergen)}
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
                            <div className="item-editor-extras">
                              <input aria-label="Ürün etiketi" className="badge-input" placeholder="Etiket ekle (örn. Yeni)" value={item.badge} onChange={(event) => updateItem(categoryIndex, itemIndex, "badge", event.target.value)} />
                              <button className={`campaign-toggle ${item.isCampaign ? "active" : ""}`} onClick={() => updateItem(categoryIndex, itemIndex, "isCampaign", !item.isCampaign)}><BadgePercent size={14} /> {item.isCampaign ? "Kampanyalı" : "Kampanya ekle"}</button>
                            </div>
                            {item.isCampaign && (
                              <div className="campaign-editor">
                                <BadgePercent size={16} />
                                <label><span>Eski fiyat</span><div className="price-input"><input aria-label="Kampanya öncesi fiyat" placeholder="475" value={item.originalPrice || ""} onChange={(event) => updateItem(categoryIndex, itemIndex, "originalPrice", event.target.value)} /><span>{menu.currency}</span></div></label>
                                <p>Menüde <del>{item.originalPrice || "475"}{menu.currency}</del> yerine <strong>{item.price || "400"}{menu.currency}</strong> gösterilir.</p>
                              </div>
                            )}
                            </div>
                          </details>
                        ))}
                        <button className="add-row-button" onClick={() => addItem(categoryIndex)}><Plus size={16} /> Ürün ekle</button>
                      </div>
                    </details>
                  ))}
                  {editorCategories.length === 0 && (
                    <div className="product-editor-empty">
                      <Search aria-hidden="true" size={19} />
                      <strong>Sonuç bulunamadı</strong>
                      <span>Farklı bir ürün veya kategori adı deneyebilirsin.</span>
                      <button type="button" onClick={() => setProductQuery("")}>Aramayı temizle</button>
                    </div>
                  )}
                </div>
                <button className="add-category-button" onClick={addCategory}><Plus size={17} /> Yeni kategori</button>
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
                label="Tasarım bölümleri"
                onChange={changeDesignSection}
                sections={designSectionLinks}
              />

              {designSection === "ai" && (
                <section className="form-section ai-theme-designer-section studio-tool-panel" id="studio-design-ai">
                <div className="ai-theme-designer-heading">
                  <div className="ai-theme-designer-icon"><Sparkles size={19} /></div>
                  <div><span>AI tasarım asistanı</span><h2>Markana özel görünüm</h2></div>
                  <div className="ai-theme-credit-cost"><Coins size={13} /> {aiCreditCosts.themeDesign} kredi</div>
                </div>
                <p className="ai-theme-designer-description">
                  İstediğin atmosferi anlat; renkleri ve tüm görünüm ayarlarını menüne göre birlikte hazırlasın.
                </p>
                <label className="ai-theme-brief" htmlFor="ai-theme-brief">
                  <span>Tasarım yönü</span>
                  <textarea
                    id="ai-theme-brief"
                    maxLength={400}
                    onChange={(event) => setThemeBrief(event.target.value)}
                    placeholder="Örn. Ahşap tonları kullanan, sıcak ama premium bir kahve dükkânı tasarımı"
                    rows={3}
                    value={themeBrief}
                  />
                  <small>{themeBrief.length} / 400</small>
                </label>
                <div className="ai-theme-suggestions" aria-label="Tasarım yönü önerileri">
                  {themeBriefSuggestions.map((suggestion) => (
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
                        ? "Bakiye yükleniyor…"
                        : themeCreditsFailed && themeCreditBalance === null
                          ? "Bakiye alınamadı"
                          : `${themeCreditBalance ?? "—"} kredi mevcut`}
                    </span>
                  </div>
                  <button
                    className="ai-theme-generate-button"
                    disabled={generatingTheme || themeBrief.trim().length < 3 || themeCreditsInsufficient}
                    onClick={() => { void generateThemeDesign(); }}
                    type="button"
                  >
                    {generatingTheme
                      ? <><Loader2 className="auto-image-spinner" size={16} /> Tasarım hazırlanıyor</>
                      : <><Sparkles size={16} /> Özel tasarım üret</>}
                  </button>
                </div>
                <p className="ai-theme-charge-note">Yalnızca doğrulanmış bir tasarım hazırlandığında kredi düşer.</p>
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
                      ><Undo2 size={14} /> Geri al</button>
                    )}
                  </div>
                )}
                </section>
              )}

              {designSection === "presets" && (
                <section className="form-section theme-preset-section studio-tool-panel" id="studio-design-presets">
                <div className="section-heading"><div><span>Hızlı başlangıç</span><h2>Hazır stiller</h2></div></div>
                <p className="theme-section-description">Renk, tipografi ve görünüm ayarlarını tek seçimle uygula; ardından istediğin ayrıntıyı değiştirebilirsin.</p>
                <div className="theme-grid">
                  {themePresetOptions.map((preset) => {
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
                <>
                <section className="form-section studio-tool-panel" id="studio-design-colors">
                <div className="section-heading"><div><span>Marka kimliği</span><h2>Renkler</h2></div>{theme.stylePreset === "custom" && <div className="theme-custom-badge">Özel</div>}</div>
                <div className="theme-color-grid">
                  {themeColorOptions.map((color) => (
                    <label className="theme-color-control" key={color.id}>
                      <span>{color.label}</span>
                      <div>
                        <input
                          aria-label={`${color.label} rengini seç`}
                          type="color"
                          value={theme[color.id]}
                          onChange={(event) => updateThemeColor(color.id, event.target.value)}
                        />
                        <code>{theme[color.id].toLocaleUpperCase("en-US")}</code>
                      </div>
                    </label>
                  ))}
                </div>
                </section>

                <section className="form-section" id="studio-design-type">
                <div className="section-heading"><div><span>Tipografi</span><h2>Yazı karakteri</h2></div></div>
                <div className="font-grid">
                  {fontOptions.map((font) => (
                    <button aria-pressed={theme.font === font.id} key={font.id} className={`${font.id} ${theme.font === font.id ? "active" : ""}`} onClick={() => updateThemeOption("font", font.id)} type="button">
                      <strong>{font.sample}</strong><span>{font.label}</span>
                    </button>
                  ))}
                </div>
                </section>
                </>
              )}

              {designSection === "layout" && (
                <section className="form-section studio-tool-panel" id="studio-design-layout">
                <div className="section-heading"><div><span>Düzen</span><h2>Ürün görünümü</h2></div></div>
                <div className="layout-grid">
                  <button aria-pressed={theme.layout === "cards"} className={theme.layout === "cards" ? "active" : ""} onClick={() => updateThemeOption("layout", "cards")} type="button"><LayoutGrid size={22} /><span><strong>Kartlar</strong><small>Rahat ve dengeli</small></span></button>
                  <button aria-pressed={theme.layout === "compact"} className={theme.layout === "compact" ? "active" : ""} onClick={() => updateThemeOption("layout", "compact")} type="button"><List size={22} /><span><strong>Kompakt</strong><small>Uzun menüler için</small></span></button>
                  <button aria-pressed={theme.layout === "tiles"} className={theme.layout === "tiles" ? "active" : ""} onClick={() => updateThemeOption("layout", "tiles")} type="button"><Grid2X2 size={22} /><span><strong>Izgara</strong><small>İki sütunlu vitrin</small></span></button>
                  <button aria-pressed={theme.layout === "showcase"} className={theme.layout === "showcase" ? "active" : ""} onClick={() => updateThemeOption("layout", "showcase")} type="button"><GalleryVerticalEnd size={22} /><span><strong>Öne çıkan</strong><small>İlk ürünü vurgular</small></span></button>
                </div>
                <label className="toggle-row"><span><strong>Ürün açıklamaları</strong><small>Menüde açıklamaları göster</small></span><input type="checkbox" checked={theme.showDescriptions} onChange={(event) => updateThemeOption("showDescriptions", event.target.checked)} /><i /></label>
                </section>
              )}

              {designSection === "advanced" && (
                <section className="form-section advanced-theme-section studio-tool-panel" id="studio-design-advanced">
                <div className="section-heading"><div><span>İnce ayar</span><h2>Gelişmiş görünüm</h2></div><Sparkles size={17} /></div>
                <p className="theme-section-description">Menünün karakterini değiştiren ayrıntıları canlı önizlemede karşılaştır.</p>
                <div className="theme-choice-list">
                  <ThemeChoiceGroup description="Kartların yüzey etkisi" label="Kart stili" onChange={(value) => updateThemeOption("cardStyle", value)} options={cardStyleOptions} value={theme.cardStyle} />
                  <ThemeChoiceGroup description="Kart ve görsel köşeleri" label="Köşeler" onChange={(value) => updateThemeOption("cornerStyle", value)} options={cornerStyleOptions} value={theme.cornerStyle} />
                  <ThemeChoiceGroup description="Ekrandaki içerik aralığı" label="Yoğunluk" onChange={(value) => updateThemeOption("density", value)} options={densityOptions} value={theme.density} />
                  <ThemeChoiceGroup description="Ürün fotoğraflarının biçimi" label="Görsel oranı" onChange={(value) => updateThemeOption("imageRatio", value)} options={imageRatioOptions} value={theme.imageRatio} />
                  <ThemeChoiceGroup description="Fiyatın vurgulanma biçimi" label="Fiyat stili" onChange={(value) => updateThemeOption("priceStyle", value)} options={priceStyleOptions} value={theme.priceStyle} />
                  <ThemeChoiceGroup description="Yatay kategori menüsü" label="Kategori stili" onChange={(value) => updateThemeOption("categoryStyle", value)} options={categoryStyleOptions} value={theme.categoryStyle} />
                  <ThemeChoiceGroup description="Menünün üst karşılama alanı" label="Kapak alanı" onChange={(value) => updateThemeOption("heroStyle", value)} options={heroStyleOptions} value={theme.heroStyle} />
                </div>
                </section>
              )}
            </div>
          )}
        </aside>

        <StudioPreviewStage menu={menu} theme={theme} />
      </div>

      {publishOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setPublishOpen(false)}>
          <section className="publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setPublishOpen(false)} aria-label="Pencereyi kapat"><X size={19} /></button>
            <div className="publish-icon"><QrCode size={25} /></div>
            <span className="modal-kicker">Paylaşmaya hazır</span>
            <h2 id="publish-title">QR menün hazır!</h2>
            <p>Müşterilerin kodu okuttuğunda menünün bu sürümünü telefonunda görecek.</p>
            <div className="qr-wrap" id="menu-qr">
              <QRCodeSVG value={publishQrUrl} size={184} level="M" marginSize={2} fgColor="#20251f" bgColor="#ffffff" />
              <div className="qr-brand"><QrCode size={13} /></div>
            </div>
            <div className="link-box"><span>{publishUrl}</span><button onClick={() => void copyLink()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
            <div className="publish-actions">
              <button className="primary-button" onClick={downloadQr}><Download size={17} /> QR kodu indir</button>
              <button className="secondary-button" onClick={() => void shareLink()}><Share2 size={17} /> Paylaş</button>
            </div>
            {activeMenuId && <a className="publish-print-link" href={`/dashboard/menus/${activeMenuId}/qr`}><Printer size={16} /> Masa kartı ve baskı şablonlarını aç</a>}
            <small>Bu kısa bağlantı kalıcıdır. Menüyü editörden güncellediğinde aynı QR kod yeni içeriği göstermeye devam eder.</small>
          </section>
        </div>
      )}

      {mobilePreviewOpen && (
        <StudioPreviewDialog menu={menu} onClose={() => setMobilePreviewOpen(false)} theme={theme} />
      )}
    </main>
  );
}
