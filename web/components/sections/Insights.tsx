"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { episodes as baked, categories, type Episode } from "@/lib/content/episodes";
import { speaking, site } from "@/lib/content/site";
import { SectionHead } from "@/components/ui/SectionHead";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Real episodes. Figures come from the server, which holds the YouTube key
 * — it never reaches the browser. Nothing is loaded from youtube.com until
 * a visitor presses play, so there is no iframe here until then.
 */
export function Insights() {
  const [items, setItems] = useState<Episode[]>(baked);
  const [cat, setCat] = useState<string>("all");
  const [playing, setPlaying] = useState<Episode | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/episodes")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.items?.length) return;
        const byId = new Map(baked.map((e) => [e.id, e]));
        setItems(d.items.map((i: Episode) => ({ ...byId.get(i.id), ...i })).filter(Boolean));
      })
      .catch(() => {});
  }, []);

  // The grid leans into the direction of travel and settles. The skew goes
  // on the grid, never the cards — they carry their own transforms.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = scrollY, v = 0, raf = 0, idle = 0;
    const loop = () => {
      const now = scrollY, raw = now - last; last = now;
      v += (raw - v) * 0.16;
      grid.current?.style.setProperty("--sv", Math.max(-1, Math.min(1, v / 58)).toFixed(4));
      idle = Math.abs(v) < 0.05 && Math.abs(raw) < 0.5 ? idle + 1 : 0;
      if (idle > 30) { grid.current?.style.setProperty("--sv", "0"); raf = 0; return; }
      raf = requestAnimationFrame(loop);
    };
    const onScroll = () => { idle = 0; if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener("scroll", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const shown = useMemo(() => items.filter((e) => cat === "all" || e.cat === cat), [items, cat]);
  const [hero, ...rest] = shown;

  return (
    <section id="insights" className="section bg-cream">
      <div className="wrap">
        <SectionHead eyebrow="Insights & speaking" title={<>Watch Before You Sign.</>}
          lede={<>Real episodes from Paul&apos;s channel — loans, shares, cover and the clauses
                 nobody reads to you. In English and in Kikuyu.</>} />

        <div className="-mt-1.5 mb-7 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)}
                    className={`rounded-full border px-4 py-2 text-[.82rem] font-semibold transition
                      [transition-timing-function:var(--ease-out-soft)] duration-300
                      ${cat === c.key
                        ? "border-surface-800 bg-surface-800 text-white shadow-lg shadow-black/20"
                        : "border-[#dfe5ec] bg-white text-[#4a5865] hover:-translate-y-0.5 hover:border-accent-coral hover:shadow-md motion-reduce:hover:translate-y-0"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {shown.length === 0 && <p className="py-6 text-center text-[#6b7784]">Nothing in that category yet.</p>}

        <div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          {hero && <Card ep={hero} big onPlay={setPlaying} />}
          <div ref={grid} className="grid grid-cols-2 gap-4"
               style={{ transform: "skewY(calc(var(--sv,0) * 1.15deg))" }}>
            {rest.map((e) => <Card key={e.id} ep={e} onPlay={setPlaying} />)}
          </div>
        </div>

        <Reveal className="mt-11 rounded-[20px] border border-white/5 p-8
          [background:radial-gradient(90%_80%_at_12%_0%,rgba(230,184,76,.14),transparent_60%),linear-gradient(160deg,#0c2238,#17344f)]">
          <div className="flex flex-wrap items-end justify-between gap-x-9 gap-y-4">
            <div>
              <p className="text-[.78rem] font-extrabold uppercase tracking-[.15em] text-gold-400">
                Speaking &amp; financial education
              </p>
              <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-[1.8rem] text-white">
                Bring this into your organisation.
              </h3>
            </div>
            <p className="max-w-[30rem] text-[.92rem] leading-relaxed text-text-tertiary">
              Keynotes, workshops and financial literacy sessions — the same material,
              delivered to your team.
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {speaking.map((s) => (
              <a key={s.title} href="#contact"
                 className="rounded-[14px] border border-white/10 bg-white/5 p-4 text-white transition
                            hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/10">
                <span className="block text-[1.25rem] text-gold-400">{s.icon}</span>
                <b className="mt-2 block text-[.9rem] text-white">{s.title}</b>
                <small className="mt-1 block text-[.78rem] leading-relaxed text-text-tertiary">{s.body}</small>
              </a>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 text-center">
          <a href={site.youtube} target="_blank" rel="noreferrer"
             className="inline-block rounded-[10px] border border-[#cbd3dc] bg-white px-5 py-3 font-bold text-navy">
            All episodes on YouTube →
          </a>
        </div>
      </div>

      {playing && <Player ep={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}

/**
 * Hovering cycles YouTube's own frames from a quarter, half and three
 * quarters through the video. The animated `an_webp` preview answers 404
 * and the storyboard sprite 403 — both need signed parameters only
 * YouTube's client generates. These three stills are unsigned, come from
 * the host the posters already use, and cost about 36KB.
 */
function Card({ ep, big = false, onPlay }: { ep: Episode; big?: boolean; onPlay: (e: Episode) => void }) {
  const [frame, setFrame] = useState<string | null>(null);
  const timers = useRef<{ intent?: number; cycle?: number }>({});

  const stop = () => {
    clearTimeout(timers.current.intent); clearInterval(timers.current.cycle);
    setFrame(null);
  };

  const start = () => {
    if (matchMedia("(hover: hover)").matches === false) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    timers.current.intent = window.setTimeout(() => {
      const urls = [1, 2, 3].map((n) => `https://i.ytimg.com/vi/${ep.id}/hq${n}.jpg`);
      let i = 0;
      setFrame(urls[0]);
      timers.current.cycle = window.setInterval(() => { i = (i + 1) % urls.length; setFrame(urls[i]); }, 780);
    }, 240);
  };

  useEffect(() => stop, []);

  return (
    <Reveal as="article" className={big ? "" : ""}>
      <button onClick={() => onPlay(ep)} onPointerEnter={start} onPointerLeave={stop}
              className="group block w-full text-left"
              aria-label={`Play: ${ep.title}`}>
        <span className="relative block aspect-video overflow-hidden rounded-[16px]
                         ring-1 ring-transparent transition-all duration-300
                         [transition-timing-function:var(--ease-out-soft)]
                         group-hover:-translate-y-1 group-hover:ring-accent-violet/60
                         group-hover:shadow-xl group-hover:shadow-black/25
                         motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
          <Image src={`https://i.ytimg.com/vi/${ep.id}/maxresdefault.jpg`} alt="" fill unoptimized
                 sizes={big ? "(max-width:1024px) 100vw, 50vw" : "(max-width:1024px) 50vw, 25vw"}
                 className="object-cover transition-transform duration-700 group-hover:scale-105" />
          {frame && (
            <span className="absolute inset-0 z-[1] bg-cover bg-center transition-opacity duration-300"
                  style={{ backgroundImage: `url("${frame}")` }} aria-hidden />
          )}
          <span className="absolute inset-0 z-[2] bg-[linear-gradient(to_top,rgba(8,22,38,.88),rgba(8,22,38,.05)_58%)]" />
          <span className={`absolute left-1/2 top-1/2 z-[2] grid -translate-x-1/2 -translate-y-1/2 place-items-center
                            rounded-full bg-white/90 text-navy transition group-hover:scale-110 group-hover:bg-gold-bright
                            ${big ? "h-[76px] w-[76px]" : "h-[54px] w-[54px]"}`}>
            <svg viewBox="0 0 24 24" width={big ? 26 : 20} height={big ? 26 : 20} aria-hidden>
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </span>
          <span className="absolute bottom-2.5 right-2.5 z-[2] rounded bg-black/70 px-1.5 py-0.5
                           text-[.7rem] font-semibold text-white tnum">
            {ep.len}{frame ? " · preview" : ""}
          </span>
          <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-gold-bright px-2 py-0.5
                           text-[.62rem] font-extrabold uppercase tracking-wide text-navy">
            {ep.cat}
          </span>
        </span>
        <span className="mt-3 block">
          <span className={`block font-bold leading-snug text-[#17344f] ${big ? "text-[1.15rem]" : "text-[.93rem]"}`}>
            {ep.title}
          </span>
          <span className="mt-1 block text-[.76rem] text-[#5f7085] tnum">{ep.views} views · {ep.age}</span>
        </span>
      </button>
    </Reveal>
  );
}

function Player({ ep, onClose }: { ep: Episode; onClose: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(2,10,18,.78)] p-6"
         onClick={onClose} role="dialog" aria-modal>
      <div className="w-full max-w-4xl rounded-[22px] bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-5">
          <h3 className="text-[1.05rem] font-semibold">{ep.title}</h3>
          <button onClick={onClose} aria-label="Close"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef2f5]">✕</button>
        </div>
        <div className="mt-4 aspect-video overflow-hidden rounded-[14px] bg-black">
          <iframe className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen title={ep.title}
                  src={`https://www.youtube-nocookie.com/embed/${ep.id}?autoplay=1&rel=0`} />
        </div>
      </div>
    </div>
  );
}
