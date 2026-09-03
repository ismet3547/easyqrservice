import {
  createId,
  type MenuData,
  type MenuThemePresetId,
} from "@/lib/menu";

export const menuStarterIds = [
  "restaurant",
  "cafe",
  "patisserie",
  "bakery",
  "fast-food",
  "hotel",
  "blank",
] as const;

export type MenuStarterId = (typeof menuStarterIds)[number];
export type MenuStarterCurrency = "₺" | "$" | "€" | "£";

type StarterItem = {
  badge?: string;
  description: string;
  name: string;
  price: string;
};

type StarterCategory = {
  items: StarterItem[];
  name: string;
};

export type MenuStarter = {
  categories: StarterCategory[];
  defaultName: string;
  description: string;
  id: MenuStarterId;
  label: string;
  subtitle: string;
  themePresetId: MenuThemePresetId;
};

export const menuStarters: MenuStarter[] = [
  {
    id: "restaurant",
    label: "Restoran",
    description: "Başlangıç, ana yemek ve içecek düzeni",
    defaultName: "Yeni Restoran",
    subtitle: "Özenle hazırlanan lezzetler",
    themePresetId: "bistro",
    categories: [
      {
        name: "Başlangıçlar",
        items: [
          { name: "Günün Çorbası", description: "Günlük ve mevsimlik malzemelerle", price: "120", badge: "Günün seçimi" },
          { name: "Çıtır Mantı", description: "Sarımsaklı yoğurt ve baharatlı tereyağı", price: "195" },
        ],
      },
      {
        name: "Ana Yemekler",
        items: [
          { name: "Izgara Köfte", description: "Patates, köz biber ve pilav ile", price: "360", badge: "Favori" },
          { name: "Tavuk Schnitzel", description: "Mevsim salata ve patates ile", price: "325" },
        ],
      },
      {
        name: "İçecekler",
        items: [
          { name: "Ev Yapımı Limonata", description: "Taze limon ve nane", price: "110" },
          { name: "Ayran", description: "Geleneksel yayık ayranı", price: "65" },
        ],
      },
    ],
  },
  {
    id: "cafe",
    label: "Kafe",
    description: "Kahve, soğuk içecek ve atıştırmalık düzeni",
    defaultName: "Yeni Kafe",
    subtitle: "İyi kahve, güzel molalar",
    themePresetId: "botanical",
    categories: [
      {
        name: "Sıcak Kahveler",
        items: [
          { name: "Espresso", description: "Yoğun aromalı çift shot", price: "90" },
          { name: "Flat White", description: "Çift shot espresso ve ipeksi süt", price: "135", badge: "Favori" },
        ],
      },
      {
        name: "Soğuk Kahveler",
        items: [
          { name: "Iced Latte", description: "Espresso, süt ve buz", price: "150" },
          { name: "Cold Brew", description: "18 saat soğuk demlenmiş kahve", price: "155" },
        ],
      },
      {
        name: "Atıştırmalıklar",
        items: [
          { name: "Kruvasan Sandviç", description: "Peynir, yeşillik ve domates", price: "220" },
          { name: "Granola Bowl", description: "Yoğurt, mevsim meyveleri ve granola", price: "210" },
        ],
      },
    ],
  },
  {
    id: "patisserie",
    label: "Pastane",
    description: "Pasta, sütlü tatlı ve sıcak içecek düzeni",
    defaultName: "Yeni Pastane",
    subtitle: "Her gün taze, her dilimde mutluluk",
    themePresetId: "playful",
    categories: [
      {
        name: "Dilim Pastalar",
        items: [
          { name: "Çikolatalı Pasta", description: "Bitter çikolata ve kakaolu pandispanya", price: "190", badge: "Çok sevilen" },
          { name: "Meyveli Tart", description: "Pastacı kreması ve mevsim meyveleri", price: "175" },
        ],
      },
      {
        name: "Tatlılar",
        items: [
          { name: "San Sebastian", description: "Yanık cheesecake ve çikolata sosu", price: "210" },
          { name: "Magnolia", description: "Muz, krema ve bisküvi katları", price: "175" },
        ],
      },
      {
        name: "Sıcak İçecekler",
        items: [
          { name: "Türk Kahvesi", description: "Lokum ile servis edilir", price: "95" },
          { name: "Çay", description: "Taze demlenmiş siyah çay", price: "55" },
        ],
      },
    ],
  },
  {
    id: "bakery",
    label: "Fırın",
    description: "Ekmek, hamur işi ve sandviç düzeni",
    defaultName: "Yeni Fırın",
    subtitle: "Fırından çıkan günlük lezzetler",
    themePresetId: "editorial",
    categories: [
      {
        name: "Ekmekler",
        items: [
          { name: "Ekşi Maya Ekmek", description: "Uzun fermantasyonlu, çıtır kabuklu", price: "120", badge: "Günlük" },
          { name: "Tam Buğday Ekmek", description: "Tam tahıllı ve yüksek lifli", price: "95" },
        ],
      },
      {
        name: "Hamur İşleri",
        items: [
          { name: "Sade Kruvasan", description: "Tereyağlı ve kat kat", price: "90" },
          { name: "Zeytinli Açma", description: "Yumuşak hamur ve zeytin ezmesi", price: "55" },
        ],
      },
      {
        name: "Sandviçler",
        items: [
          { name: "Hindi Füme Sandviç", description: "Ekşi maya ekmek, peynir ve yeşillik", price: "185" },
          { name: "Sebzeli Sandviç", description: "Izgara sebze, pesto ve roka", price: "175" },
        ],
      },
    ],
  },
  {
    id: "fast-food",
    label: "Fast food",
    description: "Burger, yan ürün ve içecek düzeni",
    defaultName: "Yeni Burger",
    subtitle: "Hızlı servis, güçlü lezzet",
    themePresetId: "dark-luxe",
    categories: [
      {
        name: "Burgerler",
        items: [
          { name: "Klasik Burger", description: "Dana köfte, cheddar, turşu ve özel sos", price: "290", badge: "Favori" },
          { name: "Çıtır Tavuk Burger", description: "Çıtır tavuk, coleslaw ve acı mayo", price: "275" },
        ],
      },
      {
        name: "Yan Ürünler",
        items: [
          { name: "Patates Kızartması", description: "Baharatlı veya sade", price: "110" },
          { name: "Soğan Halkası", description: "Özel dip sos ile", price: "125" },
        ],
      },
      {
        name: "İçecekler",
        items: [
          { name: "Ev Yapımı Ice Tea", description: "Şeftali veya limon", price: "105" },
          { name: "Kutu İçecek", description: "Seçenekler için ekibimize danışın", price: "85" },
        ],
      },
    ],
  },
  {
    id: "hotel",
    label: "Otel",
    description: "Kahvaltı, oda servisi ve içecek düzeni",
    defaultName: "Otel Oda Servisi",
    subtitle: "Konforunuz için gün boyu servis",
    themePresetId: "minimal",
    categories: [
      {
        name: "Kahvaltı",
        items: [
          { name: "Kontinental Kahvaltı", description: "Kruvasan, reçel, peynir, meyve ve sıcak içecek", price: "450" },
          { name: "Fit Kahvaltı", description: "Granola, yoğurt, meyve ve taze meyve suyu", price: "390" },
        ],
      },
      {
        name: "Oda Servisi",
        items: [
          { name: "Club Sandviç", description: "Tavuk, hindi füme, yumurta ve patates", price: "420", badge: "24 saat" },
          { name: "Penne Arrabbiata", description: "Acılı domates sosu ve parmesan", price: "380" },
        ],
      },
      {
        name: "İçecekler",
        items: [
          { name: "Taze Portakal Suyu", description: "Günlük sıkım", price: "160" },
          { name: "Filtre Kahve", description: "Taze demlenmiş", price: "130" },
        ],
      },
    ],
  },
  {
    id: "blank",
    label: "Boş menü",
    description: "Kategori ve ürünleri tamamen kendin ekle",
    defaultName: "Yeni Menü",
    subtitle: "",
    themePresetId: "minimal",
    categories: [],
  },
];

export function getMenuStarter(id: MenuStarterId) {
  return menuStarters.find((starter) => starter.id === id) || menuStarters[0];
}

function adaptStarterPrice(price: string, currency: MenuStarterCurrency) {
  if (currency === "₺") return price;
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return price;
  const divisor = currency === "£" ? 30 : 25;
  return String(Math.max(1, Math.round(numericPrice / divisor)));
}

export function createMenuFromStarter(
  starterId: MenuStarterId,
  businessName: string,
  currency: MenuStarterCurrency,
): MenuData {
  const starter = getMenuStarter(starterId);
  return {
    restaurantName: businessName.trim() || starter.defaultName,
    subtitle: starter.subtitle,
    currency,
    categories: starter.categories.map((category) => ({
      id: createId("kategori"),
      name: category.name,
      items: category.items.map((item) => ({
        id: createId("urun"),
        name: item.name,
        description: item.description,
        price: adaptStarterPrice(item.price, currency),
        badge: item.badge || "",
        originalPrice: "",
        isCampaign: false,
        image: "",
        availability: "available",
        dietaryTags: [],
        allergens: [],
      })),
    })),
  };
}
