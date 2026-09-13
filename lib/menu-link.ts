import { normalizeMenuTheme, type PublishedMenu } from "@/lib/menu";
import { isValidMenuData, isValidMenuTheme } from "@/lib/menu-validation";
import type { AppLocale } from "@/lib/i18n";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)) as Uint8Array<ArrayBuffer>;
}

export async function decodePublishedMenu(value: string, locale: AppLocale = "tr"): Promise<PublishedMenu> {
  const t = (english: string, turkish: string) => locale === "tr" ? turkish : english;
  if (value.length > 1_000_000) throw new Error(t("The menu link is too large.", "Menü bağlantısı çok büyük"));
  const maximumDecodedBytes = 12 * 1024 * 1024;
  const [format, encoded] = value.split(".", 2);
  if (!format || !encoded) throw new Error(t("The menu link is invalid.", "Geçersiz menü bağlantısı"));

  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = base64UrlToBytes(encoded);
  } catch {
    throw new Error(t("The menu link is invalid.", "Geçersiz menü bağlantısı"));
  }
  if (format === "zip") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error(t("Your browser cannot open this menu link.", "Tarayıcınız bu menü bağlantısını açamıyor"));
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > maximumDecodedBytes) {
          void reader.cancel().catch(() => undefined);
          throw new Error(t("The menu link is too large.", "Menü bağlantısı çok büyük"));
        }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  } else if (format !== "plain") {
    throw new Error(t("The menu link format is not supported.", "Bilinmeyen menü bağlantısı"));
  }

  let parsed: PublishedMenu;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes)) as PublishedMenu;
  } catch {
    throw new Error(t("The menu link is invalid.", "Geçersiz menü bağlantısı"));
  }
  if (!isValidMenuData(parsed?.menu) || !isValidMenuTheme(parsed?.theme)) {
    throw new Error(t("The menu link contains incomplete data.", "Eksik menü verisi"));
  }
  return { ...parsed, theme: normalizeMenuTheme(parsed.theme) };
}
