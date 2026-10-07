import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.url.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/vip",
          "/vip/*",
          "/api",
          "/api/*",
          "/post-ad/buy-coin",
          "/post-ad/payment",
          "/post-ad/payment/*",
          "/post-ad/payment-history",
          "/post-ad/profile",
          "/post-ad/your-ads",
          "/post-ad/your-ads/*",
          "/post-ad/edit/*",
          "/*?*preview=*",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}