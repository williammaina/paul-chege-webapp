"use client";

import { useEffect, useState } from "react";

/**
 * Whether this device should be given the WebGL book at all.
 *
 * Lives outside the canvas so the section can decide between the mesh and
 * the still cover rather than rendering both and hiding one — which is
 * what the first version did, with a CSS class that nothing ever applied,
 * so the still sat permanently on top of a scene nobody could see.
 *
 * Returns null until it has run, so the server and the first client paint
 * agree and React does not report a hydration mismatch.
 */
export function useAffordable3D(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const decide = () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
      // 550KB of three.js over mobile data for one decorative object is
      // not a trade worth making when the still cover is good.
      if (matchMedia("(pointer: coarse)").matches) return false;
      const nav = navigator as Navigator & { deviceMemory?: number };
      if ((nav.deviceMemory ?? 4) <= 3) return false;
      if ((navigator.hardwareConcurrency || 4) <= 2) return false;
      try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
    };
    setOk(decide());
  }, []);

  return ok;
}
