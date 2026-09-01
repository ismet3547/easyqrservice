export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  badge: string;
  originalPrice?: string;
  isCampaign?: boolean;
};

export type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

export type MenuData = {
  restaurantName: string;
  subtitle: string;
  currency: string;
  categories: MenuCategory[];
};

export type MenuTheme = {
  accent: string;
  background: string;
  surface: string;
  text: string;
  font: "modern" | "editorial" | "friendly";
  layout: "cards" | "compact" | "tiles" | "showcase";
  showDescriptions: boolean;
};

export type PublishedMenu = {
  menu: MenuData;
  theme: MenuTheme;
};

export const defaultTheme: MenuTheme = {
  accent: "#ea5b2a",
  background: "#f7f2e8",
  surface: "#fffdf9",
  text: "#20251f",
  font: "modern",
  layout: "cards",
  showDescriptions: true,
};

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
        },
        {
          id: "granola-kase",
          name: "Ev Yapımı Granola",
          description: "Süzme yoğurt, mevsim meyveleri, bal ve fındık",
          price: "220",
          badge: "",
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
  return parsed;
}
