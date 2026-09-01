"use client";

import {
  ArrowLeft,
  BadgePercent,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  GalleryVerticalEnd,
  Grid2X2,
  ImageOff,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  Palette,
  Plus,
  QrCode,
  ScanLine,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
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
  createId,
  decodePublishedMenu,
  defaultTheme,
  demoMenu,
  type MenuData,
  type MenuItem,
  type MenuTheme,
  type PublishedMenu,
} from "@/lib/menu";
import { MenuPreview, PublicMenu } from "@/components/MenuPreview";
import type { StoredMenu } from "@/lib/menus";

type EditorTab = "content" | "design";
type AuthUser = { id: string; name: string; email: string; createdAt: string };

const themePresets = [
  { name: "Mandarin", accent: "#ea5b2a", background: "#f7f2e8", surface: "#fffdf9", text: "#20251f" },
  { name: "Zeytin", accent: "#64734a", background: "#f1f0e8", surface: "#fbfbf7", text: "#25291f" },
  { name: "Bordo", accent: "#9d3d46", background: "#f8eff0", surface: "#fffafa", text: "#2c2021" },
  { name: "Gece", accent: "#d9a441", background: "#181916", surface: "#24251f", text: "#f7f2e8" },
];

const fontOptions: Array<{ id: MenuTheme["font"]; label: string; sample: string }> = [
  { id: "modern", label: "Modern", sample: "Aa" },
  { id: "editorial", label: "Editoryal", sample: "Aa" },
  { id: "friendly", label: "Samimi", sample: "Aa" },
];

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir sorun oluştu.";
}

export function MenuStudio({
  workspaceMode = false,
  initialUser = null,
}: {
  workspaceMode?: boolean;
  initialUser?: AuthUser | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<"upload" | "studio">("upload");
  const [tab, setTab] = useState<EditorTab>("content");
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
  const totalItemCount = menu.categories.reduce((sum, category) => sum + category.items.length, 0);
  const missingImageCount = menu.categories.reduce(
    (sum, category) => sum + category.items.filter((item) => !item.image).length,
    0,
  );

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
            setTheme(menuResult.menu.theme);
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
            setTheme(saved.theme);
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
      setNotice(`${file.name} başarıyla okundu. Fiyatları yayınlamadan önce kontrol et.`);
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

  const addItem = (categoryIndex: number) => {
    setMenu((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex
          ? {
              ...category,
              items: [
                ...category.items,
                {
                  id: createId("urun"),
                  name: "Yeni ürün",
                  description: "Ürün açıklaması",
                  price: "0",
                  badge: "",
                  originalPrice: "",
                  isCampaign: false,
                  image: "",
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
        .filter((item) => !item.image)
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
    );
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
    );
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

  const removeItem = (categoryIndex: number, itemIndex: number) => {
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
    setMenu((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: createId("kategori"),
          name: "Yeni kategori",
          items: [],
        },
      ],
    }));
  };

  const removeCategory = (categoryIndex: number) => {
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
      <header className="studio-header">
        <div className="studio-header-left">
          <button className="icon-button" aria-label="Dashboard'a dön" onClick={() => void goToDashboard()}><ArrowLeft size={19} /></button>
          <Brand compact />
          <span className="header-divider" />
          <div className="document-name">
            <strong>{menu.restaurantName || "İsimsiz menü"}</strong>
            <span className={`save-state ${saveStatus}`}><span className="saved-dot" /> {saveStatus === "saving" ? "Kaydediliyor…" : saveStatus === "error" ? "Kaydedilemedi" : "Tüm değişiklikler kaydedildi"}</span>
          </div>
        </div>
        <div className="studio-actions">
          {currentUser && <span className="studio-user"><UserRound size={15} /><span>{currentUser.name}</span></span>}
          <button className="secondary-button mobile-preview-button" onClick={() => setMobilePreviewOpen(true)}><Eye size={17} /> Önizle</button>
          <button className="primary-button" onClick={() => void preparePublish()}><QrCode size={17} /> QR menüyü oluştur</button>
          <button className="icon-button logout-button" aria-label="Çıkış yap" title="Çıkış yap" onClick={() => void logout()}><LogOut size={17} /></button>
        </div>
      </header>

      <div className="studio-body">
        <aside className="editor-panel">
          <div className="editor-tabs" role="tablist">
            <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}>
              <FileText size={17} /> İçerik
            </button>
            <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}>
              <Palette size={17} /> Tasarım
            </button>
          </div>

          {notice && <div className="notice"><Sparkles size={16} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Bildirimi kapat"><X size={14} /></button></div>}

          {tab === "content" ? (
            <div className="editor-content">
              <section className="form-section">
                <div className="section-heading"><div><span>İşletme</span><h2>Menü başlığı</h2></div></div>
                <label className="field-label">İşletme adı<input value={menu.restaurantName} onChange={(event) => setMenu({ ...menu, restaurantName: event.target.value })} /></label>
                <label className="field-label">Kısa açıklama<input value={menu.subtitle} onChange={(event) => setMenu({ ...menu, subtitle: event.target.value })} /></label>
              </section>

              <section className="form-section categories-section">
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
                <div className="category-list">
                  {menu.categories.map((category, categoryIndex) => (
                    <details className="category-editor" key={category.id} open={categoryIndex === 0}>
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
                        {category.items.map((item, itemIndex) => (
                          <article className="item-editor" key={item.id}>
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
                          </article>
                        ))}
                        <button className="add-row-button" onClick={() => addItem(categoryIndex)}><Plus size={16} /> Ürün ekle</button>
                      </div>
                    </details>
                  ))}
                </div>
                <button className="add-category-button" onClick={addCategory}><Plus size={17} /> Yeni kategori</button>
              </section>
            </div>
          ) : (
            <div className="editor-content design-content">
              <section className="form-section">
                <div className="section-heading"><div><span>Görünüm</span><h2>Renk paleti</h2></div></div>
                <div className="theme-grid">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.name}
                      className={`theme-option ${theme.accent === preset.accent ? "active" : ""}`}
                      onClick={() => setTheme((current) => ({ ...current, ...preset }))}
                    >
                      <span className="theme-swatches"><i style={{ background: preset.accent }} /><i style={{ background: preset.background }} /><i style={{ background: preset.text }} /></span>
                      <span>{preset.name}</span>
                      {theme.accent === preset.accent && <Check size={15} />}
                    </button>
                  ))}
                </div>
                <label className="color-field">Vurgu rengi<div><span style={{ background: theme.accent }} /><input type="text" value={theme.accent} onChange={(event) => setTheme({ ...theme, accent: event.target.value })} /></div></label>
              </section>

              <section className="form-section">
                <div className="section-heading"><div><span>Tipografi</span><h2>Yazı karakteri</h2></div></div>
                <div className="font-grid">
                  {fontOptions.map((font) => (
                    <button key={font.id} className={`${font.id} ${theme.font === font.id ? "active" : ""}`} onClick={() => setTheme({ ...theme, font: font.id })}>
                      <strong>{font.sample}</strong><span>{font.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="form-section">
                <div className="section-heading"><div><span>Düzen</span><h2>Ürün görünümü</h2></div></div>
                <div className="layout-grid">
                  <button className={theme.layout === "cards" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "cards" })}><LayoutGrid size={22} /><span><strong>Kartlar</strong><small>Rahat ve dengeli</small></span></button>
                  <button className={theme.layout === "compact" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "compact" })}><List size={22} /><span><strong>Kompakt</strong><small>Uzun menüler için</small></span></button>
                  <button className={theme.layout === "tiles" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "tiles" })}><Grid2X2 size={22} /><span><strong>Izgara</strong><small>İki sütunlu vitrin</small></span></button>
                  <button className={theme.layout === "showcase" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "showcase" })}><GalleryVerticalEnd size={22} /><span><strong>Öne çıkan</strong><small>İlk ürünü vurgular</small></span></button>
                </div>
                <label className="toggle-row"><span><strong>Ürün açıklamaları</strong><small>Menüde açıklamaları göster</small></span><input type="checkbox" checked={theme.showDescriptions} onChange={(event) => setTheme({ ...theme, showDescriptions: event.target.checked })} /><i /></label>
              </section>
            </div>
          )}
        </aside>

        <section className="preview-stage">
          <div className="preview-toolbar"><span><Smartphone size={16} /> Canlı önizleme</span><div><i /> 390 × 844</div></div>
          <div className="phone-frame">
            <div className="phone-speaker" />
            <div className="phone-screen"><MenuPreview menu={menu} theme={theme} framed /></div>
          </div>
          <p className="preview-hint">Değişikliklerin anında önizlemeye yansır.</p>
        </section>
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
              <QRCodeSVG value={publishUrl} size={184} level="M" marginSize={2} fgColor="#20251f" bgColor="#ffffff" />
              <div className="qr-brand"><QrCode size={13} /></div>
            </div>
            <div className="link-box"><span>{publishUrl}</span><button onClick={() => void copyLink()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
            <div className="publish-actions">
              <button className="primary-button" onClick={downloadQr}><Download size={17} /> QR kodu indir</button>
              <button className="secondary-button" onClick={() => void shareLink()}><Share2 size={17} /> Paylaş</button>
            </div>
            <small>Bu kısa bağlantı kalıcıdır. Menüyü editörden güncellediğinde aynı QR kod yeni içeriği göstermeye devam eder.</small>
          </section>
        </div>
      )}

      {mobilePreviewOpen && (
        <div className="modal-backdrop preview-modal-backdrop" role="presentation" onMouseDown={() => setMobilePreviewOpen(false)}>
          <section className="mobile-preview-modal" role="dialog" aria-modal="true" aria-label="Mobil menü önizlemesi" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setMobilePreviewOpen(false)} aria-label="Önizlemeyi kapat"><X size={19} /></button>
            <div className="phone-frame">
              <div className="phone-speaker" />
              <div className="phone-screen"><MenuPreview menu={menu} theme={theme} framed /></div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark"><QrCode size={compact ? 17 : 20} /></span>
      <strong>easy<span>qr</span></strong>
    </div>
  );
}
