"use client";

import { ArrowUpRight, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { EngagementPeriod, EngagementRow } from "@/lib/analytics-details";

const pageSize = 5;
const number = (value: number) => value.toLocaleString("tr-TR");

function PeriodChange({ row }: { row: EngagementRow }) {
  if (!row.menuVisits || !row.previousMenuVisits) return <span title="İki dönemde de etkileşim ölçümü gerekli">—</span>;
  if (!row.previousVisits) return <span>{row.visits ? "Yeni ilgi" : "%0"}</span>;
  const change = Math.round(((row.visits - row.previousVisits) / row.previousVisits) * 100);
  return <span className={change < 0 ? "negative" : change > 0 ? "positive" : ""}>
    {change > 0 ? "+" : change < 0 ? "−" : ""}%{number(Math.abs(change))}
  </span>;
}

export function AnalyticsEngagement({ data }: { data: EngagementPeriod }) {
  const [kind, setKind] = useState<"products" | "categories">("products");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("most");
  const [page, setPage] = useState(1);
  const search = query.trim().toLocaleLowerCase("tr-TR");
  const categoryOptions = Array.from(new Map(data.products.map((row) => [row.categoryKey, row])).values());
  const rows = data[kind].filter((row) =>
    (!category || kind === "categories" || row.categoryKey === category) &&
    (!search || `${row.name} ${row.categoryName} ${row.menuName}`.toLocaleLowerCase("tr-TR").includes(search)),
  ).sort((a, b) => {
    if (sort === "least") return a.visits - b.visits || a.name.localeCompare(b.name, "tr");
    if (sort === "name") return a.name.localeCompare(b.name, "tr");
    return b.visits - a.visits || b.previousVisits - a.previousVisits || a.name.localeCompare(b.name, "tr");
  });
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <section className="analytics-engagement" aria-labelledby="engagement-title">
    <div className="analytics-card-heading">
      <div><span>Ürün ve kategori ilgisi</span><h2 id="engagement-title">Menünde neler görülüyor?</h2></div>
      <div className="analytics-periods" role="group" aria-label="Performans listesi">
        <button type="button" aria-pressed={kind === "products"} className={kind === "products" ? "active" : ""}
          onClick={() => { setKind("products"); setPage(1); }}>Ürünler</button>
        <button type="button" aria-pressed={kind === "categories"} className={kind === "categories" ? "active" : ""}
          onClick={() => { setKind("categories"); setCategory(""); setPage(1); }}>Kategoriler</button>
      </div>
    </div>
    <p className="analytics-engagement-intro">Gören ziyaret, ürünün veya kategorinin ekranda göründüğü menü ziyaretidir. Aynı ziyarette tekrar görünmesi bir kez sayılır.</p>
    <div className="analytics-detail-filters">
      <label className="analytics-detail-search"><span>Ara</span><div><Search size={16} aria-hidden="true" />
        <input type="search" placeholder={kind === "products" ? "Ürün, kategori veya menü ara" : "Kategori veya menü ara"}
          value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div></label>
      {kind === "products" && <label><span>Kategori</span><select value={category}
        onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
        <option value="">Tüm kategoriler</option>{categoryOptions.map((row) =>
          <option key={row.categoryKey} value={row.categoryKey}>{row.categoryName} · {row.menuName}</option>)}
      </select></label>}
      <label><span>Sıralama</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
        <option value="most">En çok görülen</option><option value="least">En az görülen</option><option value="name">Ada göre</option>
      </select></label>
    </div>
    <p className="analytics-detail-status" role="status">{number(rows.length)} {kind === "products" ? "ürün" : "kategori"} · Bu dönemde etkileşim ölçümü alınan {number(data.measuredVisits)} menü ziyareti</p>
    {!data.measuredVisits && <p className="analytics-measurement-note">Bu dönem için henüz etkileşim ölçümü yok. Ürün ve kategori değerleri veri gelene kadar — olarak gösterilir; geçmiş menü açılışları bu ölçümü içermez.</p>}
    {!rows.length ? <div className="analytics-list-empty">
      <p>{query || category ? "Bu filtrelerle eşleşen kayıt yok." : "Yayındaki ürün ve kategoriler ile geçmiş etkileşimler burada listelenecek."}</p>
      {query || category ? <button type="button" onClick={() => { setQuery(""); setCategory(""); setPage(1); }}>Filtreleri temizle</button>
        : <Link href="/dashboard/menus">Menülerimi görüntüle <ArrowUpRight size={14} /></Link>}
    </div> : <>
      <table className="analytics-detail-table" role="table">
        <caption className="sr-only">{kind === "products" ? "Ürün" : "Kategori"} performansı; seçilen dönem ve önceki aynı uzunluktaki dönem</caption>
        <thead><tr role="row"><th scope="col">{kind === "products" ? "Ürün" : "Kategori"}</th><th scope="col">Gören ziyaret</th><th scope="col">Tekil ziyaretçi</th><th scope="col">Erişim</th><th scope="col">Önceki dönem</th><th scope="col">Değişim</th><th scope="col"><span className="sr-only">İşlem</span></th></tr></thead>
        <tbody>{visible.map((row) => <tr role="row" key={row.key}>
          <th scope="row"><strong>{row.name}</strong><small>{row.menuName}{kind === "products" ? ` · ${row.categoryName}` : ""}</small>
            {!row.live && <em>Artık yayında değil</em>}</th>
          <td data-label="Gören ziyaret">{row.menuVisits ? number(row.visits) : "—"}</td>
          <td data-label="Tekil ziyaretçi">{row.menuVisits ? number(row.visitors) : "—"}</td>
          <td data-label="Erişim" title={`${number(row.visits)} / ${number(row.menuVisits)} ölçülen menü ziyareti`}>{row.reach === null ? "—" : `%${number(row.reach)}`}</td>
          <td data-label="Önceki dönem">{row.previousMenuVisits ? number(row.previousVisits) : "—"}</td>
          <td data-label="Değişim"><PeriodChange row={row} /></td>
          <td className="analytics-detail-action"><Link href={`/studio?menu=${encodeURIComponent(row.menuId)}`} aria-label={`${row.menuName} menüsünü düzenle`}>Menüyü düzenle <ArrowUpRight size={14} /></Link></td>
        </tr>)}</tbody>
      </table>
      {pageCount > 1 && <nav className="analytics-detail-pagination" aria-label="Performans sayfaları">
        <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Önceki</button>
        <span role="status">{currentPage} / {pageCount}</span>
        <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sonraki</button>
      </nav>}
    </>}
    <details className="analytics-definitions"><summary>Bu sayıları nasıl okumalıyım?</summary>
      <p><strong>Erişim:</strong> Gören ziyaret / ilgili menüde etkileşim ölçümü alınan ziyaret. Her satır kendi menüsünün ziyaretleriyle karşılaştırılır; oranlar toplanmaz.</p>
      <p><strong>Tekil ziyaretçi:</strong> Aynı anonim tarayıcı kimliği bir kez sayılır. Aynı kişi farklı cihazlarda ayrı sayılabilir; tekrar açılışları ise yeni ziyaret oluşturur.</p>
      <p><strong>Dönem:</strong> Ziyaretler menüyü açtıkları güne göre UTC ile gruplanır. Bugün devam ettiği için mevcut dönem henüz tamamlanmamıştır. Önceki dönem aynı sayıda gün içerir.</p>
      <p><strong>— ve 0:</strong> — ölçüm bulunmadığını, 0 ise menüde ölçüm varken ilgili öğenin görülmediğini belirtir. Geçmiş etkileşimler korunur; silinmiş öğelerin eski adları tutulmadığından adı gösterilemeyebilir.</p>
      <p>Bu veriler görünürlük ve ilgiyi ölçer; sipariş, satış veya gelir değildir.</p>
    </details>
  </section>;
}
