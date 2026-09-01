import { NextResponse } from "next/server";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

type GenerateProductImageBody = {
  name?: string;
  description?: string;
  categoryName?: string;
  restaurantName?: string;
};

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { code?: string; message?: string };
};

function normalizeMenuText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getVisualGuidance(name: string, categoryName: string) {
  const item = normalizeMenuText(name);
  const category = normalizeMenuText(categoryName);

  if (item === "maden suyu" || item === "soda" || item.startsWith("soda ")) {
    return "In Turkish restaurant usage this is sparkling mineral water. Show a clear glass of carbonated mineral water with visible bubbles. It is a beverage, never food, soup, dessert, or a plated dish.";
  }

  if (
    item === "su" ||
    item.startsWith("su ") ||
    item.includes("icme suyu") ||
    item.includes("kaynak suyu")
  ) {
    return "This item is plain still drinking water. Show one clean transparent drinking glass filled with clear colorless water and subtle condensation. Never show a bowl, plate, soup, noodles, pastry, sauce, tea, coffee, or colored drink.";
  }

  if (item === "ayran" || item.startsWith("ayran ")) {
    return "This is Turkish ayran, a cold white yogurt drink served in a clear glass or traditional metal cup. It is a beverage, not yogurt in a bowl and not solid food.";
  }

  const beverageCategories = ["icecek", "icecekler", "kahve", "cay", "mesrubat", "soguk icecek", "sicak icecek"];
  if (beverageCategories.some((keyword) => category.includes(keyword))) {
    return "This menu item belongs to the beverage category. Show it unmistakably as a drink in an appropriate glass or cup, never as solid food or a plated dish.";
  }

  const dessertCategories = ["tatli", "tatlilar", "pasta", "dondurma"];
  if (dessertCategories.some((keyword) => category.includes(keyword))) {
    return "This menu item belongs to the dessert category. Show a realistic single dessert serving, not a savory meal or beverage.";
  }

  return "";
}

const hourlyImageLimit = 12;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ message: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Görsel üretmek için giriş yapmalısın." }, { status: 401 });
  }

  const rateLimit = checkRateLimit(
    "product-image:" + user.id + ":" + getClientAddress(request),
    hourlyImageLimit,
    60 * 60 * 1000,
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        code: "IMAGE_RATE_LIMIT",
        message: "Saatlik görsel üretme sınırına ulaştın. Bir süre sonra tekrar dene.",
      },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        code: "AI_NOT_CONFIGURED",
        message: "AI görsel üretimi için OPENAI_API_KEY ayarlanmalı.",
      },
      { status: 503 },
    );
  }

  let body: GenerateProductImageBody;
  try {
    body = (await request.json()) as GenerateProductImageBody;
  } catch {
    return NextResponse.json({ message: "Geçersiz istek." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const categoryName = typeof body.categoryName === "string" ? body.categoryName.trim() : "";
  const restaurantName = typeof body.restaurantName === "string" ? body.restaurantName.trim() : "";

  if (
    !name ||
    name.length > 180 ||
    description.length > 1000 ||
    categoryName.length > 100 ||
    restaurantName.length > 120
  ) {
    return NextResponse.json(
      { message: "Ürün adı veya açıklaması görsel üretimi için uygun değil." },
      { status: 400 },
    );
  }

  const visualGuidance = getVisualGuidance(name, categoryName);
  const prompt = [
    "Create a photorealistic square product photograph for a professional restaurant QR menu.",
    "The menu language is Turkish; interpret the Turkish item name using its category and description.",
    "Menu item name: " + name + ".",
    categoryName ? "Menu category: " + categoryName + "." : "",
    description ? "Item description and ingredients: " + description + "." : "",
    restaurantName ? "Restaurant context: " + restaurantName + "." : "",
    visualGuidance,
    "Show exactly one finished serving in the correct vessel or plate and represent the named item faithfully.",
    "If the identity is uncertain, use the most canonical restaurant serving for the stated category; never invent a different product.",
    "Use a clean elegant surface, soft natural light, a 45-degree camera angle, realistic texture, and centered composition.",
    "No written text, prices, logos, watermarks, people, hands, branded packaging, collage, or decorative typography.",
  ].filter(Boolean).join(" ");

  let openAIResponse: Response;
  try {
    openAIResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch (error) {
    console.error("Product image generation request failed.", error);
    return NextResponse.json(
      {
        code: "AI_TEMPORARILY_UNAVAILABLE",
        message: "Görsel servisine şu anda ulaşılamıyor. Biraz sonra tekrar dene.",
      },
      { status: 503 },
    );
  }

  let result: OpenAIImageResponse;
  try {
    result = (await openAIResponse.json()) as OpenAIImageResponse;
  } catch {
    return NextResponse.json(
      { message: "Görsel servisinden geçersiz yanıt alındı." },
      { status: 502 },
    );
  }

  if (!openAIResponse.ok) {
    console.error("Product image generation failed.", {
      status: openAIResponse.status,
      code: result.error?.code,
    });
    const isTemporary = openAIResponse.status === 429 || openAIResponse.status >= 500;
    return NextResponse.json(
      {
        code: isTemporary ? "AI_TEMPORARILY_UNAVAILABLE" : "IMAGE_GENERATION_FAILED",
        message: isTemporary
          ? "Görsel servisi şu anda yoğun veya kullanım kotası dolu. Biraz sonra tekrar dene."
          : "Bu ürün için görsel üretilemedi. Ürün adını veya açıklamasını değiştirip tekrar dene.",
      },
      { status: isTemporary ? 503 : 422 },
    );
  }

  const base64Image = result.data?.[0]?.b64_json;
  if (!base64Image || base64Image.length > 12_000_000) {
    return NextResponse.json(
      { message: "Üretilen görsel güvenli boyut sınırını aştı veya boş döndü." },
      { status: 502 },
    );
  }

  return NextResponse.json(
    { imageDataUrl: "data:image/png;base64," + base64Image },
    { headers: { "Cache-Control": "no-store" } },
  );
}
