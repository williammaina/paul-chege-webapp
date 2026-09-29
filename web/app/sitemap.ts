import type { MetadataRoute } from "next";

/**
 * One page, section-anchored. Fragments are not separate URLs and do not
 * belong in a sitemap — listing them would claim pages that do not exist.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://paulchege.co.ke",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
