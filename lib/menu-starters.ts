import {
  createId,
  type MenuData,
  type MenuThemePresetId,
} from "@/lib/menu";
import type { AppLocale } from "@/lib/i18n";

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

const menuStartersTr: MenuStarter[] = [
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

const menuStartersEn: MenuStarter[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    description: "Starters, mains and drinks",
    defaultName: "New Restaurant",
    subtitle: "Thoughtfully prepared food",
    themePresetId: "bistro",
    categories: [
      { name: "Starters", items: [
        { name: "Soup of the Day", description: "Made daily with seasonal ingredients", price: "8", badge: "Chef's pick" },
        { name: "Crispy Dumplings", description: "Herb yogurt and spiced butter", price: "11" },
      ] },
      { name: "Mains", items: [
        { name: "Grilled Meatballs", description: "Served with potatoes, peppers and rice", price: "19", badge: "Popular" },
        { name: "Chicken Schnitzel", description: "Seasonal salad and fries", price: "18" },
      ] },
      { name: "Drinks", items: [
        { name: "House Lemonade", description: "Fresh lemon and mint", price: "6" },
        { name: "Sparkling Water", description: "Chilled mineral water", price: "4" },
      ] },
    ],
  },
  {
    id: "cafe",
    label: "Cafe",
    description: "Coffee, cold drinks and light bites",
    defaultName: "New Cafe",
    subtitle: "Great coffee, better breaks",
    themePresetId: "botanical",
    categories: [
      { name: "Hot Coffee", items: [
        { name: "Espresso", description: "Rich double shot", price: "4" },
        { name: "Flat White", description: "Double espresso and silky milk", price: "6", badge: "Popular" },
      ] },
      { name: "Cold Coffee", items: [
        { name: "Iced Latte", description: "Espresso, milk and ice", price: "6" },
        { name: "Cold Brew", description: "Slow-steeped for 18 hours", price: "7" },
      ] },
      { name: "Light Bites", items: [
        { name: "Croissant Sandwich", description: "Cheese, greens and tomato", price: "10" },
        { name: "Granola Bowl", description: "Yogurt, seasonal fruit and granola", price: "9" },
      ] },
    ],
  },
  {
    id: "patisserie",
    label: "Dessert Shop",
    description: "Cakes, desserts and hot drinks",
    defaultName: "New Dessert Shop",
    subtitle: "Fresh every day, joy in every slice",
    themePresetId: "playful",
    categories: [
      { name: "Cake Slices", items: [
        { name: "Chocolate Cake", description: "Dark chocolate and cocoa sponge", price: "9", badge: "Most loved" },
        { name: "Seasonal Fruit Tart", description: "Pastry cream and fresh fruit", price: "9" },
      ] },
      { name: "Desserts", items: [
        { name: "Burnt Cheesecake", description: "Basque-style cheesecake with chocolate sauce", price: "10" },
        { name: "Banana Pudding", description: "Banana, vanilla cream and biscuit", price: "8" },
      ] },
      { name: "Hot Drinks", items: [
        { name: "Americano", description: "Double espresso and hot water", price: "5" },
        { name: "Tea", description: "Freshly brewed selection", price: "4" },
      ] },
    ],
  },
  {
    id: "bakery",
    label: "Bakery",
    description: "Bread, pastries and sandwiches",
    defaultName: "New Bakery",
    subtitle: "Fresh from the oven every day",
    themePresetId: "editorial",
    categories: [
      { name: "Bread", items: [
        { name: "Sourdough Loaf", description: "Long-fermented with a crisp crust", price: "7", badge: "Baked daily" },
        { name: "Whole Wheat Loaf", description: "Whole grain and high in fiber", price: "6" },
      ] },
      { name: "Pastries", items: [
        { name: "Butter Croissant", description: "Flaky and buttery", price: "5" },
        { name: "Cinnamon Roll", description: "Soft dough and cinnamon filling", price: "5" },
      ] },
      { name: "Sandwiches", items: [
        { name: "Turkey Sandwich", description: "Sourdough, cheese and greens", price: "10" },
        { name: "Grilled Vegetable Sandwich", description: "Seasonal vegetables, pesto and rocket", price: "9" },
      ] },
    ],
  },
  {
    id: "fast-food",
    label: "Fast Casual",
    description: "Burgers, sides and cold drinks",
    defaultName: "New Fast Casual",
    subtitle: "Big flavor, served fast",
    themePresetId: "dark-luxe",
    categories: [
      { name: "Burgers", items: [
        { name: "Classic Burger", description: "Beef patty, cheddar, pickles and house sauce", price: "14", badge: "Popular" },
        { name: "Crispy Chicken Burger", description: "Crispy chicken, slaw and spicy mayo", price: "13" },
      ] },
      { name: "Sides", items: [
        { name: "Seasoned Fries", description: "Classic or spicy", price: "5" },
        { name: "Onion Rings", description: "Served with house dip", price: "6" },
      ] },
      { name: "Drinks", items: [
        { name: "House Iced Tea", description: "Peach or lemon", price: "5" },
        { name: "Soft Drink", description: "Ask the team for today's selection", price: "4" },
      ] },
    ],
  },
  {
    id: "hotel",
    label: "Hotel",
    description: "Breakfast, all-day dining and drinks",
    defaultName: "New Hotel",
    subtitle: "A thoughtful stay, from morning to night",
    themePresetId: "minimal",
    categories: [
      { name: "Breakfast", items: [
        { name: "Continental Breakfast", description: "Croissant, preserves, cheese, fruit and a hot drink", price: "22" },
        { name: "Granola Breakfast", description: "Granola, yogurt, fruit and fresh juice", price: "18" },
      ] },
      { name: "All-Day Dining", items: [
        { name: "Club Sandwich", description: "Chicken, turkey, egg and fries", price: "20", badge: "Available all day" },
        { name: "Penne Arrabbiata", description: "Spicy tomato sauce and parmesan", price: "18" },
      ] },
      { name: "Drinks", items: [
        { name: "Fresh Orange Juice", description: "Pressed to order", price: "7" },
        { name: "Filter Coffee", description: "Freshly brewed", price: "5" },
      ] },
    ],
  },
  {
    id: "blank",
    label: "Blank menu",
    description: "Add every category and item yourself",
    defaultName: "New Menu",
    subtitle: "",
    themePresetId: "minimal",
    categories: [],
  },
];

export const menuStarters = menuStartersEn;

export function getMenuStarters(locale: AppLocale = "en") {
  return locale === "tr" ? menuStartersTr : menuStartersEn;
}

export function getMenuStarter(id: MenuStarterId, locale: AppLocale = "en") {
  const starters = getMenuStarters(locale);
  return starters.find((starter) => starter.id === id) || starters[0];
}

function adaptStarterPrice(price: string, currency: MenuStarterCurrency, locale: AppLocale) {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return price;
  if (locale === "tr") {
    if (currency === "₺") return price;
    const divisor = currency === "£" ? 52 : currency === "€" ? 46 : 40;
    return String(Math.max(1, Math.round(numericPrice / divisor)));
  }
  if (currency === "₺") return String(Math.max(1, Math.round(numericPrice * 40)));
  if (currency === "£") return String(Math.max(1, Math.round(numericPrice * 0.8)));
  return price;
}

export function createMenuFromStarter(
  starterId: MenuStarterId,
  businessName: string,
  currency: MenuStarterCurrency,
  locale: AppLocale = "en",
): MenuData {
  const starter = getMenuStarter(starterId, locale);
  return {
    restaurantName: businessName.trim() || starter.defaultName,
    subtitle: starter.subtitle,
    currency,
    sourceLanguage: locale,
    categories: starter.categories.map((category) => ({
      id: createId("category"),
      name: category.name,
      items: category.items.map((item) => ({
        id: createId("item"),
        name: item.name,
        description: item.description,
        price: adaptStarterPrice(item.price, currency, locale),
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
