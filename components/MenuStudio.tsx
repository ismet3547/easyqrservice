"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Palette,
  Plus,
  QrCode,
  ScanLine,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  type CSSProperties,
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
  encodePublishedMenu,
  type MenuData,
  type MenuItem,
  type MenuTheme,
  type PublishedMenu,
} from "@/lib/menu";

type EditorTab = "content" | "design";

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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir sorun oluştu.";
}

export function MenuStudio() {
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

  useEffect(() => {
    const readHash = async () => {
      if (!window.location.hash.startsWith("#menu=")) {
        const draft = window.localStorage.getItem("easyqr-draft");
        if (!draft) return;
        try {
          const saved = JSON.parse(draft) as PublishedMenu;
          if (saved?.menu?.categories && saved?.theme?.accent) {
            setMenu(saved.menu);
            setTheme(saved.theme);
            setNotice("Son taslağın tarayıcıdan geri yüklendi.");
            setScreen("studio");
          }
        } catch {
          window.localStorage.removeItem("easyqr-draft");
        }
        return;
      }
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
    if (screen !== "studio") return;
    window.localStorage.setItem("easyqr-draft", JSON.stringify({ menu, theme }));
  }, [menu, screen, theme]);

  const openDemo = () => {
    setMenu(cloneDemoMenu());
    setTheme(defaultTheme);
    setNotice("Örnek menü açık — tüm alanları özgürce değiştirebilirsin.");
    setScreen("studio");
  };

  const processFile = async (file?: File) => {
    if (!file) return;
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
        if (result.code === "AI_NOT_CONFIGURED") {
          setMenu(cloneDemoMenu());
          setNotice(
            "Demo modu açık: API anahtarı eklenene kadar örnek ürünlerle tasarım yapabilirsin.",
          );
          setScreen("studio");
          return;
        }
        throw new Error(result.message || "Menü analiz edilemedi.");
      }
      if (!result.menu) throw new Error("Menü verisi alınamadı.");
      setMenu(result.menu);
      setNotice(`${file.name} başarıyla okundu. Fiyatları yayınlamadan önce kontrol et.`);
      setScreen("studio");
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
    value: string,
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
                },
              ],
            }
          : category,
      ),
    }));
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
    const encoded = await encodePublishedMenu({ menu, theme });
    setPublishUrl(`${window.location.origin}${window.location.pathname}#menu=${encoded}`);
    setPublishOpen(true);
    setCopied(false);
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

  if (screen === "upload") {
    return (
      <main className="landing-shell">
        <header className="landing-header">
          <Brand />
          <nav aria-label="Ana menü">
            <a href="#nasil-calisir">Nasıl çalışır?</a>
            <button className="nav-demo" onClick={openDemo}>Örnek menü</button>
          </nav>
          <button className="header-cta" onClick={() => inputRef.current?.click()}>
            Menü oluştur
          </button>
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
                  <button className="primary-button upload-button" onClick={() => inputRef.current?.click()}>
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
          <button className="icon-button" aria-label="Geri dön" onClick={() => setScreen("upload")}><ArrowLeft size={19} /></button>
          <Brand compact />
          <span className="header-divider" />
          <div className="document-name">
            <strong>{menu.restaurantName || "İsimsiz menü"}</strong>
            <span><span className="saved-dot" /> Tarayıcıya kaydedildi</span>
          </div>
        </div>
        <div className="studio-actions">
          <button className="secondary-button mobile-preview-button" onClick={() => setMobilePreviewOpen(true)}><Eye size={17} /> Önizle</button>
          <button className="primary-button" onClick={() => void preparePublish()}><QrCode size={17} /> QR menüyü oluştur</button>
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
                  <div className="item-count">{menu.categories.reduce((sum, category) => sum + category.items.length, 0)} ürün</div>
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
                              <div className="price-input"><input aria-label="Fiyat" value={item.price} onChange={(event) => updateItem(categoryIndex, itemIndex, "price", event.target.value)} /><span>{menu.currency}</span></div>
                              <button aria-label="Ürünü sil" onClick={() => removeItem(categoryIndex, itemIndex)}><Trash2 size={15} /></button>
                            </div>
                            <textarea aria-label="Ürün açıklaması" rows={2} value={item.description} onChange={(event) => updateItem(categoryIndex, itemIndex, "description", event.target.value)} />
                            <input aria-label="Ürün etiketi" className="badge-input" placeholder="Etiket ekle (örn. Yeni)" value={item.badge} onChange={(event) => updateItem(categoryIndex, itemIndex, "badge", event.target.value)} />
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
                  <button className={theme.layout === "cards" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "cards" })}><LayoutGrid size={22} /><span>Kartlar</span></button>
                  <button className={theme.layout === "compact" ? "active" : ""} onClick={() => setTheme({ ...theme, layout: "compact" })}><List size={22} /><span>Kompakt</span></button>
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
            <small>Bu MVP bağlantısı menü verisini URL içinde taşır. Kalıcı ve kısa bağlantılı yayınlama için sonraki adımda veritabanı eklenebilir.</small>
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

function PublicMenu({ menu, theme }: PublishedMenu) {
  return (
    <main className="public-menu-shell" style={{ background: theme.background }}>
      <MenuPreview menu={menu} theme={theme} />
      <footer className="public-menu-footer"><Brand compact /><span>ile hazırlandı</span></footer>
    </main>
  );
}

function MenuPreview({ menu, theme, framed = false }: PublishedMenu & { framed?: boolean }) {
  const style = {
    "--menu-accent": theme.accent,
    "--menu-bg": theme.background,
    "--menu-surface": theme.surface,
    "--menu-text": theme.text,
  } as CSSProperties;

  return (
    <div className={`menu-preview font-${theme.font} layout-${theme.layout} ${framed ? "is-framed" : ""}`} style={style}>
      <header className="menu-hero">
        <div className="menu-monogram">{menu.restaurantName.trim().charAt(0) || "M"}</div>
        <span className="menu-welcome">Hoş geldiniz</span>
        <h1>{menu.restaurantName || "İsimsiz menü"}</h1>
        {menu.subtitle && <p>{menu.subtitle}</p>}
        <div className="menu-meta"><span><i /> Şimdi açık</span><span>•</span><span>Servis 22:30’a kadar</span></div>
      </header>

      <nav className="menu-categories" aria-label="Menü kategorileri">
        {menu.categories.map((category, index) => (
          <a key={category.id} className={index === 0 ? "active" : ""} href={`#${category.id}`}>{category.name}</a>
        ))}
      </nav>

      <div className="menu-sections">
        {menu.categories.map((category) => (
          <section id={category.id} key={category.id}>
            <div className="menu-section-heading"><h2>{category.name}</h2><span>{category.items.length} ürün</span></div>
            <div className="menu-items">
              {category.items.map((item) => (
                <article className="menu-item" key={item.id}>
                  <div className="menu-item-copy">
                    <div className="menu-item-title">
                      <h3>{item.name || "İsimsiz ürün"}</h3>
                      {item.badge && <span>{item.badge}</span>}
                    </div>
                    {theme.showDescriptions && item.description && <p>{item.description}</p>}
                  </div>
                  <strong className="menu-price">{item.price}<small>{menu.currency}</small></strong>
                </article>
              ))}
              {category.items.length === 0 && <div className="empty-category">Bu kategoride henüz ürün yok.</div>}
            </div>
          </section>
        ))}
      </div>

      <div className="menu-bottom-note"><span>Afiyet olsun</span><i>✦</i><span>Fiyatlara KDV dahildir</span></div>
    </div>
  );
}
