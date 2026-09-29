import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
import { StructuredData } from "@/components/layout/StructuredData";

/**
 * Both faces are self-hosted through Fontsource rather than fetched from
 * Google. The previous build learned this the hard way: the stylesheet
 * asked for Inter for months and nothing ever served it, so every visitor
 * read the page in whatever their operating system happened to have.
 */

export const metadata: Metadata = {
  metadataBase: new URL("https://paulchege.co.ke"),
  title: {
    default: "Paul Chege — Financial Advisor, Author & Educator",
    template: "%s · Paul Chege",
  },
  description:
    "Practical financial guidance for individuals, professionals and business " +
    "owners in Kenya. Licensed insurance broker with Bizsure, financial coach, " +
    "and author of The Anatomy of Smart Borrowing.",
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Paul Chege",
    title: "Paul Chege — Financial Advisor, Author & Educator",
    description:
      "Understand money. Borrow intentionally. Build with confidence.",
    images: [{ url: "/img/paul-chege-portrait.jpg", width: 2047, height: 2048 }],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#0c2238",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-KE">
      <body>
        {/* Straight past the nav, for anyone who reaches the page by
            keyboard. Visible only once it has focus. */}
        <a href="#home"
           className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]
                      focus:rounded-[10px] focus:bg-gold-bright focus:px-4 focus:py-2.5
                      focus:font-bold focus:text-navy">
          Skip to content
        </a>
        {children}
        <StructuredData prices={{ coaching: 5000, ebook: 999, physical: 1999 }} />
      </body>
    </html>
  );
}
