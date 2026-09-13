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
        "/login",
        "/kayit",
        "/register",
        "/sifre-sifirla",
        "/sifremi-unuttum",
        "/reset-password",
        "/forgot-password",
        "/studio",
      ],
    },
    sitemap: `${publicOrigin}/sitemap.xml`,
  };
}
