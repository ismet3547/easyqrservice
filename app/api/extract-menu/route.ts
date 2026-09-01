import { NextResponse } from "next/server";
import type { MenuData } from "@/lib/menu";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const maximumFileSize = 12 * 1024 * 1024;

type ExtractionBody = {
  fileName?: string;
  mimeType?: string;
  dataUrl?: string;
};

type ExtractedMenu = Omit<MenuData, "categories"> & {
  categories: Array<{
    name: string;
    items: Array<Omit<MenuData["categories"][number]["items"][number], "id">>;
  }>;
};

const menuSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    restaurantName: { type: "string" },
    subtitle: { type: "string" },
    currency: { type: "string" },
    categories: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          items: {
            type: "array",
            maxItems: 50,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "string" },
                badge: { type: "string" },
                originalPrice: { type: "string" },
                isCampaign: { type: "boolean" },
              },
              required: ["name", "description", "price", "badge", "originalPrice", "isCampaign"],
            },
          },
        },
        required: ["name", "items"],
      },
    },
  },
  required: ["restaurantName", "subtitle", "currency", "categories"],
};

function estimateDataUrlBytes(dataUrl: string) {
  const encoded = dataUrl.split(",", 2)[1] ?? "";
  return Math.ceil((encoded.length * 3) / 4);
}

function slug(value: string, fallback: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return normalized || fallback;
}

function addStableIds(menu: ExtractedMenu): MenuData {
  return {
    ...menu,
    restaurantName: menu.restaurantName || "Yeni Mekân",
    currency: menu.currency || "₺",
    categories: menu.categories.map((category, categoryIndex) => ({
      ...category,
      id: `${slug(category.name, "kategori")}-${categoryIndex + 1}`,
      items: category.items.map((item, itemIndex) => ({
        ...item,
        id: `${slug(item.name, "urun")}-${categoryIndex + 1}-${itemIndex + 1}`,
        availability: "available",
      })),
    })),
  };
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const entry of output) {
    if (!entry || typeof entry !== "object") continue;
    const content = Array.isArray((entry as { content?: unknown }).content)
      ? ((entry as { content: unknown[] }).content as unknown[])
      : [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: string }).type === "output_text" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Menü oluşturmak için giriş yapmalısın." },
      { status: 401 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { code: "AI_NOT_CONFIGURED", message: "OPENAI_API_KEY yapılandırılmamış." },
      { status: 503 },
    );
  }

  let body: ExtractionBody;
  try {
    body = (await request.json()) as ExtractionBody;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { dataUrl, fileName = "menu", mimeType = "" } = body;
  if (!dataUrl || !supportedTypes.has(mimeType)) {
    return NextResponse.json(
      { message: "JPG, PNG, WEBP veya PDF biçiminde bir menü yükleyin." },
      { status: 400 },
    );
  }
  if (estimateDataUrlBytes(dataUrl) > maximumFileSize) {
    return NextResponse.json({ message: "Dosya boyutu 12 MB sınırını aşıyor." }, { status: 413 });
  }

  const fileContent = mimeType === "application/pdf"
    ? { type: "input_file", filename: fileName, file_data: dataUrl }
    : { type: "input_image", image_url: dataUrl, detail: "high" };

  const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                "Bu restoran veya kafe menüsünü dikkatle oku ve yapılandırılmış veriye dönüştür.",
                "Metnin özgün dilini ve fiyat yazımını koru. Kategori bulunmuyorsa mantıklı kategoriler oluştur.",
                "Restoran adı, alt başlık, açıklama veya etiket görünmüyorsa boş string kullan.",
                "İndirimli bir üründe güncel fiyatı price, üstü çizili eski fiyatı originalPrice alanına yaz ve isCampaign değerini true yap; kampanya yoksa originalPrice boş ve isCampaign false olsun.",
                "Para birimini tek bir kısa simge/kod olarak ver. Ürünleri uydurma; yalnızca dosyada görünenleri çıkar.",
              ].join(" "),
            },
            fileContent,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "restaurant_menu",
          strict: true,
          schema: menuSchema,
        },
      },
    }),
  });

  const result = (await openAIResponse.json()) as Record<string, unknown>;
  if (!openAIResponse.ok) {
    const error = result.error as { message?: string } | undefined;
    return NextResponse.json(
      { message: error?.message || "Menü analiz edilirken bir sorun oluştu." },
      { status: openAIResponse.status },
    );
  }

  try {
    const menu = JSON.parse(extractOutputText(result)) as ExtractedMenu;
    return NextResponse.json({ menu: addStableIds(menu) });
  } catch {
    return NextResponse.json(
      { message: "Menü okundu ancak sonuç işlenemedi. Lütfen yeniden deneyin." },
      { status: 502 },
    );
  }
}
