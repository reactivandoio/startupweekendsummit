import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/voluntarios`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/patrocinio`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];
}
