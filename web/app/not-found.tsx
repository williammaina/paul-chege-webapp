import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-navy px-6 text-center">
      <div>
        <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">404</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2rem,1.3rem+2.4vw,3rem)] font-semibold text-white">
          That page does not exist.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[#b3c4d8]">
          It may have moved, or the link may be wrong. Everything lives on one
          page, so the way back is short.
        </p>
        <Link href="/"
              className="mt-7 inline-block rounded-[10px] bg-gold-bright px-5 py-3.5 font-bold text-navy">
          Back to the site →
        </Link>
      </div>
    </main>
  );
}
