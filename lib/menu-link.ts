import { normalizeMenuTheme, type PublishedMenu } from "@/lib/menu";
import { isValidMenuData, isValidMenuTheme } from "@/lib/menu-validation";

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function decodePublishedMenu(value: string): Promise<PublishedMenu> {
  if (value.length > 1_000_000) throw new Error("Menü bağlantısı çok büyük");
  const maximumDecodedBytes = 12 * 1024 * 1024;
  const [format, encoded] = value.split(".", 2);
  if (!format || !encoded) throw new Error("Geçersiz menü bağlantısı");

  let bytes = base64UrlToBytes(encoded);
  if (format === "zip") {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Tarayıcınız bu menü bağlantısını açamıyor");
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
          throw new Error("Menü bağlantısı çok büyük");
        }
        chunks.push(chunk.value);
      }
    } finally { reader.releaseLock(); }
    bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  } else if (format !== "plain") {
    throw new Error("Bilinmeyen menü bağlantısı");
  }

  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as PublishedMenu;
  if (!isValidMenuData(parsed?.menu) || !isValidMenuTheme(parsed?.theme)) {
    throw new Error("Eksik menü verisi");
  }
  return { ...parsed, theme: normalizeMenuTheme(parsed.theme) };
}
