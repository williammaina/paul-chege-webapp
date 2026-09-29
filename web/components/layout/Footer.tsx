import Image from "next/image";
import { nav, site } from "@/lib/content/site";

export function Footer({ licence }: { licence?: string | null }) {
  return (
    <footer className="relative isolate overflow-hidden pb-24 pt-14
      [background:radial-gradient(120%_90%_at_50%_-20%,rgba(230,184,76,.15),transparent_55%),linear-gradient(180deg,#03090f_0%,#081a2c_46%,#0c2340_100%)]">
      <div className="wrap relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-7">
          <a href="#home" className="flex items-center gap-3">
            <Image src="/img/logo-navy.webp" alt="" width={120} height={94} className="h-[50px] w-auto" />
            <span>
              <strong className="block tracking-[.04em] text-white">PAUL CHEGE</strong>
              <small className="block text-[#93a4b8]">{site.role}</small>
            </span>
          </a>
          <nav className="flex flex-wrap gap-5 text-[.9rem] text-[#cfdcea]">
            {nav.slice(1).map((n) => <a key={n.href} href={n.href} className="hover:text-gold-400">{n.label}</a>)}
          </nav>
        </div>

        {/* A licensed intermediary should say so, with the number, and the
            IRA line appears only when the server supplies a real one — an
            invented licence number is a regulatory problem, not a design
            one. */}
        <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8fa3bd]">Regulated business</p>
            <p className="mt-2 text-[.82rem] leading-relaxed text-[#b3c4d8]">
              Insurance is placed through <b className="text-white">{site.broker}</b>, a licensed
              insurance broker. Paul Chege acts as an intermediary for Bizsure; coaching and
              financial education are provided in his own name.
            </p>
            {licence && (
              <p className="mt-2 text-[.82rem] text-[#b3c4d8]">
                IRA licence <b className="text-gold-400 tnum">{licence}</b>
              </p>
            )}
          </div>
          <div>
            <p className="text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8fa3bd]">Office</p>
            <p className="mt-2 text-[.82rem] leading-relaxed text-[#b3c4d8]">
              {site.address.map((l) => <span key={l} className="block">{l}</span>)}
            </p>
          </div>
          <div>
            <p className="text-[.68rem] font-extrabold uppercase tracking-[.13em] text-[#8fa3bd]">Contact</p>
            <p className="mt-2 text-[.82rem] leading-relaxed">
              <a href={site.phoneHref} className="block text-[#dbe6f2] underline decoration-gold-400/40 underline-offset-2">{site.phone}</a>
              <a href={`mailto:${site.email}`} className="block text-[#dbe6f2] underline decoration-gold-400/40 underline-offset-2">{site.email}</a>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4
                        text-[.8rem] text-[#98a9b8]">
          <span>© 2026 Paul Chege.</span>
          <span>Privacy • Terms • Financial disclaimer</span>
        </div>
      </div>
    </footer>
  );
}
