import type { MetadataRoute } from "next";
import { getPublicAppOrigin, legalDocumentVersion } from "@/lib/legal";

const lastModified = new Date(`${legalDocumentVersion}T00:00:00.000Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  const publicOrigin = getPublicAppOrigin();
  return [
    { url: publicOrigin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${publicOrigin}/gizlilik`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${publicOrigin}/cerez-politikasi`, lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: `${publicOrigin}/kullanim-kosullari`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
