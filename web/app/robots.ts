import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing under /api is a page. Crawling it wastes budget, and a
        // crawler that follows a download link burns a buyer's token.
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://paulchege.co.ke/sitemap.xml",
  };
}
