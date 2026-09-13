import type { MetadataRoute } from "next";
import { getPublicAppOrigin, legalDocumentVersion } from "@/lib/legal";

const lastModified = new Date(`${legalDocumentVersion}T00:00:00.000Z`);

export default function sitemap(): MetadataRoute.Sitemap {
  const publicOrigin = getPublicAppOrigin();
  const languages = (englishPath: string, turkishPath: string) => ({
    en: `${publicOrigin}${englishPath}`,
    tr: `${publicOrigin}${turkishPath}`,
  });
  return [
    { url: publicOrigin, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${publicOrigin}/sample-menu`, changeFrequency: "monthly", priority: 0.7, alternates: { languages: languages("/sample-menu", "/ornek-menu") } },
    { url: `${publicOrigin}/ornek-menu`, changeFrequency: "monthly", priority: 0.7, alternates: { languages: languages("/sample-menu", "/ornek-menu") } },
    { url: `${publicOrigin}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/privacy", "/gizlilik") } },
    { url: `${publicOrigin}/gizlilik`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/privacy", "/gizlilik") } },
    { url: `${publicOrigin}/cookies`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/cookies", "/cerez-politikasi") } },
    { url: `${publicOrigin}/cerez-politikasi`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/cookies", "/cerez-politikasi") } },
    { url: `${publicOrigin}/terms`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/terms", "/kullanim-kosullari") } },
    { url: `${publicOrigin}/kullanim-kosullari`, lastModified, changeFrequency: "monthly", priority: 0.4, alternates: { languages: languages("/terms", "/kullanim-kosullari") } },
  ];
}
