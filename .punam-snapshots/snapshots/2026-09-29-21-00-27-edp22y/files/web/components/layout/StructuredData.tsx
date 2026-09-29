import { bookFacts, site } from "@/lib/content/site";

/**
 * Structured data, for the search result rather than the page.
 *
 * Every claim here is one the page itself makes and a reader can check:
 * the address, the phone, the broker Paul places cover through, the book
 * and its ISBN, the two session prices the server charges.
 *
 * Deliberately absent: `aggregateRating` and `review`. There are no
 * testimonials yet, and inventing them for a rich result would be a
 * fabricated claim about a licensed intermediary — a regulatory problem,
 * not a marketing one. They go in when real ones with consent exist.
 */
export function StructuredData({ prices }: { prices: { coaching: number; ebook: number; physical: number } }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": "https://paulchege.co.ke/#paul",
        name: "Paul Chege",
        jobTitle: "Financial Advisor, Insurance Broker and Author",
        telephone: site.phone,
        email: site.email,
        url: "https://paulchege.co.ke",
        image: "https://paulchege.co.ke/img/paul-chege-portrait.jpg",
        sameAs: [site.youtube, site.tiktok, site.facebook],
        alumniOf: { "@type": "CollegeOrUniversity", name: "KCA University" },
        worksFor: { "@id": "https://paulchege.co.ke/#practice" },
      },
      {
        "@type": "FinancialService",
        "@id": "https://paulchege.co.ke/#practice",
        name: "Paul Chege — Financial Advisory",
        description:
          "Borrowing and financial coaching, and insurance placed through a licensed broker.",
        telephone: site.phone,
        email: site.email,
        url: "https://paulchege.co.ke",
        areaServed: { "@type": "Country", name: "Kenya" },
        currenciesAccepted: "KES",
        paymentAccepted: "M-Pesa",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Ciata City Mall, Block A, 2nd Floor, Ridgeways, Kiambu Road",
          addressLocality: "Nairobi",
          addressCountry: "KE",
        },
        parentOrganization: { "@type": "Organization", name: site.broker, url: site.bizsure },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Consultations",
          itemListElement: [
            {
              "@type": "Offer", price: 0, priceCurrency: "KES",
              itemOffered: { "@type": "Service", name: "30-minute insurance review" },
            },
            {
              "@type": "Offer", price: prices.coaching, priceCurrency: "KES",
              itemOffered: { "@type": "Service", name: "60-minute smart borrowing coaching" },
            },
          ],
        },
      },
      {
        "@type": "Book",
        "@id": "https://paulchege.co.ke/#book",
        name: bookFacts.title,
        isbn: bookFacts.isbn,
        author: { "@id": "https://paulchege.co.ke/#paul" },
        inLanguage: "en",
        image: "https://paulchege.co.ke/img/book-cover.jpg",
        offers: [
          { "@type": "Offer", price: prices.ebook, priceCurrency: "KES",
            availability: "https://schema.org/InStock",
            itemOffered: { "@type": "Book", bookFormat: "https://schema.org/EBook", name: bookFacts.title } },
          { "@type": "Offer", price: prices.physical, priceCurrency: "KES",
            availability: "https://schema.org/InStock",
            itemOffered: { "@type": "Book", bookFormat: "https://schema.org/Paperback", name: bookFacts.title } },
        ],
      },
    ],
  };

  return (
    <script type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
  );
}
