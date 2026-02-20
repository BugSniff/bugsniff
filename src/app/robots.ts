import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: "https://bugsniff.com.br/sitemap.xml",
    host: "https://bugsniff.com.br",
  };
}
