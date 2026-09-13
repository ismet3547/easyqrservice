"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { EngagementPeriod, EngagementRow } from "@/lib/analytics-details";
import { useAppLocale } from "@/components/LocaleProvider";

const pageSize = 5;

function PeriodChange({ locale, number, row }: {
  locale: "en" | "tr";
  number: (value: number) => string;
  row: EngagementRow;
}) {
  if (!row.menuVisits || !row.previousMenuVisits) return <span title={locale === "tr" ? "İki dönemde de etkileşim ölçümü gerekli" : "Engagement measurement is required in both periods"}>—</span>;
  if (!row.previousVisits) return <span>{row.visits ? (locale === "tr" ? "Yeni ilgi" : "New interest") : "0%"}</span>;
  const change = Math.round(((row.visits - row.previousVisits) / row.previousVisits) * 100);
  return <span className={change < 0 ? "negative" : change > 0 ? "positive" : ""}>
    {change > 0 ? "+" : change < 0 ? "−" : ""}{number(Math.abs(change))}%
  </span>;
}

export function AnalyticsEngagement({ data }: { data: EngagementPeriod }) {
  const { intlLocale, locale, number } = useAppLocale();
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  const [kind, setKind] = useState<"products" | "categories">("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("most");
  const [page, setPage] = useState(1);
  const search = query.trim().toLocaleLowerCase(intlLocale);
  const categoryOptions = Array.from(new Map(data.products.map((row) => [row.categoryKey, row])).values());
  const rows = data[kind].filter((row) =>
    (!category || kind === "categories" || row.categoryKey === category) &&
    (!search || `${row.name} ${row.categoryName} ${row.menuName}`.toLocaleLowerCase(intlLocale).includes(search)),
  ).sort((a, b) => {
    if (sort === "least") return a.visits - b.visits || a.name.localeCompare(b.name, intlLocale);
    if (sort === "name") return a.name.localeCompare(b.name, intlLocale);
    return b.visits - a.visits || b.previousVisits - a.previousVisits || a.name.localeCompare(b.name, intlLocale);
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <section className="analytics-engagement" aria-labelledby="engagement-title">
    <div className="analytics-card-heading">
      <div><span>{t("Item and category engagement", "Ürün ve kategori ilgisi")}</span><h2 id="engagement-title">{t("What are guests viewing?", "Menünde neler görülüyor?")}</h2></div>
      <div className="analytics-periods" role="group" aria-label={t("Performance list", "Performans listesi")}>
        <button type="button" aria-pressed={kind === "products"} className={kind === "products" ? "active" : ""}
          onClick={() => { setKind("products"); setPage(1); }}>{t("Items", "Ürünler")}</button>
        <button type="button" aria-pressed={kind === "categories"} className={kind === "categories" ? "active" : ""}
          onClick={() => { setKind("categories"); setCategory(""); setPage(1); }}>{t("Categories", "Kategoriler")}</button>
      </div>
    </div>
    <p className="analytics-engagement-intro">{t("Engagement includes only visits that allowed anonymous analytics. A viewed visit is one in which an item or category appeared on screen; repeated appearances during the same visit count once.", "Etkileşim yalnızca anonim analitiğe izin veren ziyaretleri kapsar. Gören ziyaret, ürünün veya kategorinin ekranda göründüğü ziyarettir; aynı ziyarette tekrar görünmesi bir kez sayılır.")}</p>
    <div className="analytics-detail-filters">
      <label className="analytics-detail-search"><span>{t("Search", "Ara")}</span><div><Search size={16} aria-hidden="true" />
        <input type="search" placeholder={kind === "products" ? t("Search items, categories, or menus", "Ürün, kategori veya menü ara") : t("Search categories or menus", "Kategori veya menü ara")}
          value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div></label>
      {kind === "products" && <label><span>{t("Category", "Kategori")}</span><select value={category}
        onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
        <option value="">{t("All categories", "Tüm kategoriler")}</option>{categoryOptions.map((row) =>
          <option key={row.categoryKey} value={row.categoryKey}>{row.categoryName} · {row.menuName}</option>)}
      </select></label>}
      <label><span>{t("Sort", "Sıralama")}</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
        <option value="most">{t("Most viewed", "En çok görülen")}</option><option value="least">{t("Least viewed", "En az görülen")}</option><option value="name">{t("By name", "Ada göre")}</option>
      </select></label>
    </div>
    <p className="analytics-detail-status" role="status">{number(rows.length)} {kind === "products" ? t("items", "ürün") : t("categories", "kategori")} · {number(data.measuredVisits)} {t("menu visits measured for engagement in this period", "Bu dönemde etkileşim ölçümü alınan menü ziyareti")}</p>
    {!data.measuredVisits && <p className="analytics-measurement-note">{t("There is no engagement measurement for this period yet. Item and category values appear as — until data arrives; historical menu opens do not include this measurement.", "Bu dönem için henüz etkileşim ölçümü yok. Ürün ve kategori değerleri veri gelene kadar — olarak gösterilir; geçmiş menü açılışları bu ölçümü içermez.")}</p>}
    {!rows.length ? <div className="analytics-list-empty">
      <p>{query || category ? t("No records match these filters.", "Bu filtrelerle eşleşen kayıt yok.") : t("Live items, categories, and historical engagement will appear here.", "Yayındaki ürün ve kategoriler ile geçmiş etkileşimler burada listelenecek.")}</p>
      {query || category ? <button type="button" onClick={() => { setQuery(""); setCategory(""); setPage(1); }}>{t("Clear filters", "Filtreleri temizle")}</button>
        : <Link href="/dashboard/menus">{t("View my menus", "Menülerimi görüntüle")} <ArrowUpRight size={14} /></Link>}
    </div> : <>
      <table className="analytics-detail-table" role="table">
        <caption className="sr-only">{kind === "products" ? t("Item", "Ürün") : t("Category", "Kategori")} {t("performance for the selected period and the preceding period of equal length", "performansı; seçilen dönem ve önceki aynı uzunluktaki dönem")}</caption>
        <thead><tr role="row"><th scope="col">{kind === "products" ? t("Item", "Ürün") : t("Category", "Kategori")}</th><th scope="col">{t("Viewed visits", "Gören ziyaret")}</th><th scope="col">{t("Unique visitors", "Tekil ziyaretçi")}</th><th scope="col">{t("Reach", "Erişim")}</th><th scope="col">{t("Previous period", "Önceki dönem")}</th><th scope="col">{t("Change", "Değişim")}</th><th scope="col"><span className="sr-only">{t("Action", "İşlem")}</span></th></tr></thead>
        <tbody>{visible.map((row) => <tr role="row" key={row.key}>
          <th scope="row"><strong>{row.name}</strong><small>{row.menuName}{kind === "products" ? ` · ${row.categoryName}` : ""}</small>
            {!row.live && <em>{t("No longer live", "Artık yayında değil")}</em>}</th>
          <td data-label={t("Viewed visits", "Gören ziyaret")}>{row.menuVisits ? number(row.visits) : "—"}</td>
          <td data-label={t("Unique visitors", "Tekil ziyaretçi")}>{row.menuVisits ? number(row.visitors) : "—"}</td>
          <td data-label={t("Reach", "Erişim")} title={`${number(row.visits)} / ${number(row.menuVisits)} ${t("measured menu visits", "ölçülen menü ziyareti")}`}>{row.reach === null ? "—" : `${number(row.reach)}%`}</td>
          <td data-label={t("Previous period", "Önceki dönem")}>{row.previousMenuVisits ? number(row.previousVisits) : "—"}</td>
          <td data-label={t("Change", "Değişim")}><PeriodChange locale={locale} number={number} row={row} /></td>
          <td className="analytics-detail-action"><Link href={`/studio?menu=${encodeURIComponent(row.menuId)}`} aria-label={t(`Edit ${row.menuName}`, `${row.menuName} menüsünü düzenle`)}>{t("Edit menu", "Menüyü düzenle")} <ArrowUpRight size={14} /></Link></td>
        </tr>)}</tbody>
      </table>
      {pageCount > 1 && <nav className="analytics-detail-pagination" aria-label={t("Performance pages", "Performans sayfaları")}>
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>{t("Previous", "Önceki")}</button>
        <span role="status">{currentPage} / {pageCount}</span>
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>{t("Next", "Sonraki")}</button>
      </nav>}
    </>}
    <details className="analytics-definitions"><summary>{t("How should I read these numbers?", "Bu sayıları nasıl okumalıyım?")}</summary>
      <p><strong>{t("Reach:", "Erişim:")}</strong> {t("Viewed visits divided by measured visits for the relevant menu. Each row is compared with visits to its own menu; percentages are not added together.", "Gören ziyaret / ilgili menüde etkileşim ölçümü alınan ziyaret. Her satır kendi menüsünün ziyaretleriyle karşılaştırılır; oranlar toplanmaz.")}</p>
      <p><strong>{t("Unique visitor:", "Tekil ziyaretçi:")}</strong> {t("For visitors who allowed analytics, the same anonymous browser identifier is counted once. One person may count separately across devices; reopening creates a new visit.", "Analitiğe izin verenlerde aynı anonim tarayıcı kimliği bir kez sayılır. Aynı kişi farklı cihazlarda ayrı sayılabilir; tekrar açılışları ise yeni ziyaret oluşturur.")}</p>
      <p><strong>{t("Period:", "Dönem:")}</strong> {t("Visits are grouped in UTC by the day the menu was opened. The current period is incomplete because today is still in progress. The previous period contains the same number of days.", "Ziyaretler menüyü açtıkları güne göre UTC ile gruplanır. Bugün devam ettiği için mevcut dönem henüz tamamlanmamıştır. Önceki dönem aynı sayıda gün içerir.")}</p>
      <p><strong>{t("— and 0:", "— ve 0:")}</strong> {t("— means no measurement is available; 0 means the item was not viewed despite measurement being active. Historical engagement is retained, but deleted items may no longer have a displayable name.", "— ölçüm bulunmadığını, 0 ise menüde ölçüm varken ilgili öğenin görülmediğini belirtir. Geçmiş etkileşimler korunur; silinmiş öğelerin eski adları tutulmadığından adı gösterilemeyebilir.")}</p>
      <p>{t("These metrics measure visibility and interest—not orders, sales, or revenue.", "Bu veriler görünürlük ve ilgiyi ölçer; sipariş, satış veya gelir değildir.")}</p>
    </details>
  </section>;
}
