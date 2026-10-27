import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/voluntarios`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${site.url}/patrocinio`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site.url}/termos-de-uso`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/politica-de-privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/politica-de-cancelamento-e-reembolso`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
