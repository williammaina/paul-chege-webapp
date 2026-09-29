"use client";

import { useEffect, useRef } from "react";

/**
 * The hero backdrop, on the GPU.
 *
 * Raw WebGL2 rather than three.js: one fullscreen triangle and one
 * fragment shader is a few kilobytes, so unlike the book scene this can
 * run on a phone as well as a workstation.
 *
 * Domain-warped fractal noise through the site's navy, gold kept to the
 * crests so it reads as light catching an edge, and a warm lift that
 * follows the pointer. The panels above are frosted, not transparent, so
 * no text is ever measured against this.
 */
const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uFade;

vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i), f), dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
             mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
                 dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 q = uv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.035;

  vec2 w = vec2(fbm(q * 1.6 + vec2(0.0, t)), fbm(q * 1.6 + vec2(4.7, -t)));
  float n = fbm(q * 2.1 + w * 1.5 + vec2(t * 0.7, 0.0)) * 0.5 + 0.5;

  vec3 col = mix(vec3(0.006,0.027,0.058), vec3(0.055,0.156,0.266), smoothstep(0.18,0.66,n));
  col = mix(col, vec3(0.122,0.290,0.443), smoothstep(0.55,0.96,n));
  col += vec3(0.92,0.73,0.30) * smoothstep(0.68,0.99,n) * 0.46;
  col += vec3(0.85,0.66,0.24) * 0.17 *
         smoothstep(0.55,0.0,distance(uv, vec2(0.16,0.12))) * (0.6 + 0.4*sin(uTime*0.25));

  if (uMouse.x >= 0.0){
    col += vec3(0.95,0.76,0.34) * 0.18 *
           smoothstep(0.45, 0.0, distance(q, uMouse * vec2(uRes.x/uRes.y, 1.0)));
  }

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
  col += (g - 0.5) * 0.016;
  col *= mix(0.62, 1.12, smoothstep(0.0, 0.85, uv.y));
  o = vec4(col * uFade, 1.0);
}`;

export function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cv = ref.current;
    const host = cv?.parentElement;
    if (!cv || !host) return;

    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;   // the CSS gradient underneath stands in

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };

    let raf = 0;
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U = {
        res: gl.getUniformLocation(prog, "uRes"),
        time: gl.getUniformLocation(prog, "uTime"),
        mouse: gl.getUniformLocation(prog, "uMouse"),
        fade: gl.getUniformLocation(prog, "uFade"),
      };

      // Noise hides resolution, so this never renders above 1.25x however
      // good the display is — on a 4K panel the full ratio would quadruple
      // the fragment count for nothing visible.
      const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, 1.25);
        const w = Math.max(1, Math.round(host.clientWidth * dpr));
        const h = Math.max(1, Math.round(host.clientHeight * dpr));
        if (cv.width === w && cv.height === h) return;
        cv.width = w; cv.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(U.res, w, h);
      };
      resize();
      const ro = new ResizeObserver(resize); ro.observe(host);

      let mx = -1, my = -1;
      const move = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width;
        my = 1 - (e.clientY - r.top) / r.height;
      };
      const leave = () => { mx = my = -1; };
      host.addEventListener("pointermove", move, { passive: true });
      host.addEventListener("pointerleave", leave);

      let live = true;
      const io = new IntersectionObserver(([e]) => { live = e.isIntersecting; }, { rootMargin: "80px" });
      io.observe(host);

      const t0 = performance.now();
      let fade = 0;
      const frame = (now: number) => {
        if (live) {
          fade = Math.min(1, fade + 0.02);
          gl.uniform1f(U.time, (now - t0) / 1000);
          gl.uniform2f(U.mouse, mx, my);
          gl.uniform1f(U.fade, fade);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      cv.style.opacity = "1";

      return () => {
        cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerleave", leave);
      };
    } catch {
      cancelAnimationFrame(raf);
    }
  }, []);

  return (
    <canvas ref={ref} aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-0 transition-opacity duration-700" />
  );
}
