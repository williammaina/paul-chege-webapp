"use client";

import { useState } from "react";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { StickyBook } from "@/components/layout/StickyBook";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Magnetic } from "@/components/motion/Magnetic";
import { Hero } from "@/components/sections/Hero";
import { Proof } from "@/components/sections/Proof";
import { Brands } from "@/components/sections/Brands";
import { Advisory } from "@/components/sections/Advisory";
import { About } from "@/components/sections/About";
import { Framework } from "@/components/sections/Framework";
import { Book } from "@/components/sections/Book";
import { Insights } from "@/components/sections/Insights";
import { Contact } from "@/components/sections/Contact";
import { BookSession } from "@/components/flows/BookSession";
import { BuyBook } from "@/components/flows/BuyBook";
import { usePrices } from "@/lib/usePrices";

export default function Home() {
  const [booking, setBooking] = useState<{ open: boolean; type?: "free" | "paid" }>({ open: false });
  const [buying, setBuying] = useState<"ebook" | "physical" | null>(null);

  const openBooking = (type?: "free" | "paid") => setBooking({ open: true, type });

  return (
    <>
      <SmoothScroll />
      <Magnetic />
      <Nav onBook={() => openBooking()} />

      <main id="home">
        <Hero onBook={() => openBooking()} />
        <Proof />
        <Brands />
        <Advisory onBook={() => openBooking()} />
        <About onBook={() => openBooking()} />
        <Framework />
        <Book onBuy={setBuying} />
        <Insights />
        <Contact onBook={openBooking} />
      </main>

      <Footer />

      <StickyBook onBook={() => openBooking()} />

      <BookSession open={booking.open} initialType={booking.type}
                   onClose={() => setBooking({ open: false })} />
      <BuyBook sku={buying} onClose={() => setBuying(null)} />
    </>
  );
}
