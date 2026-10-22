import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  // /inscricao cobre os convites e o cadastro aberto (/inscricao/aberta), que também levam noindex,nofollow
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/inscricao", "/api"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
