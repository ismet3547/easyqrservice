import type { MetadataRoute } from "next";
import { getPublicAppOrigin } from "@/lib/legal";

export default function robots(): MetadataRoute.Robots {
  const publicOrigin = getPublicAppOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/giris",
        "/kayit",
        "/sifre-sifirla",
        "/sifremi-unuttum",
        "/studio",
      ],
    },
    sitemap: `${publicOrigin}/sitemap.xml`,
  };
}
