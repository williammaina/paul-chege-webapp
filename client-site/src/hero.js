/**
 * The hero backdrop, on the GPU.
 *
 * Raw WebGL2 on purpose — no three.js. This is one fullscreen quad and one
 * fragment shader, which bundles to a few kilobytes instead of 550, so
 * unlike the book scene it can run on a phone as well as a workstation.
 *
 * What it draws: domain-warped fractal noise through the site's navy and
 * gold, flowing slowly enough that you never catch it moving, plus a warm
 * lift that follows the pointer. The hero panels above it are opaque, so
 * nothing here is ever behind text.
 */
const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;      // 0..1, -1 when the pointer has left
uniform float uFade;       // entry fade, 0..1

/* Simplex-ish value noise. Cheap, and at this scale indistinguishable
   from the real thing once it is warped and blurred by the palette. */
vec2 hash2(vec2 p){
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash2(i + vec2(0,0)), f - vec2(0,0)),
                 dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
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
  vec2 q  = uv * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.035;

  // Domain warp: noise sampled at coordinates that are themselves noisy.
  // This is what turns flat bands into something that looks like weather.
  vec2 w = vec2(fbm(q * 1.6 + vec2(0.0, t)), fbm(q * 1.6 + vec2(4.7, -t)));
  float n = fbm(q * 2.1 + w * 1.5 + vec2(t * 0.7, 0.0));
  n = n * 0.5 + 0.5;

  /* The first palette had all three stops within a few percent of each
     other, which rendered as flat navy — technically a shader, visually
     nothing. These are spread far enough apart to actually read. */
  vec3 deep = vec3(0.006, 0.027, 0.058);
  vec3 mid  = vec3(0.055, 0.156, 0.266);
  vec3 lift = vec3(0.122, 0.290, 0.443);
  vec3 col  = mix(deep, mid, smoothstep(0.18, 0.66, n));
  col = mix(col, lift, smoothstep(0.55, 0.96, n));

  // Gold, kept to the crests so it reads as light catching an edge rather
  // than as a colour wash.
  float crest = smoothstep(0.68, 0.99, n);
  col += vec3(0.92, 0.73, 0.30) * crest * 0.46;

  // A second, slower band of gold low on the left, echoing the section
  // below. Anchored to uv so it does not swim with the aspect ratio.
  col += vec3(0.85, 0.66, 0.24) * 0.10 *
         smoothstep(0.55, 0.0, distance(uv, vec2(0.16, 0.12))) *
         (0.6 + 0.4 * sin(uTime * 0.25)) * 1.7;

  // The pointer warms what it passes over. Nothing moves; only the light.
  if (uMouse.x >= 0.0){
    float d = distance(q, uMouse * vec2(uRes.x / uRes.y, 1.0));
    col += vec3(0.95, 0.76, 0.34) * 0.18 * smoothstep(0.45, 0.0, d);
  }

  // Grain. A gradient this large and this dark bands badly without it.
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.016;

  // Darkest at the top, where the sticky header sits over it, lifting
  // toward the horizon — the same move the dark sections below make.
  col *= mix(0.62, 1.12, smoothstep(0.0, 0.85, uv.y));

  o = vec4(col * uFade, 1.0);
}`;

export function initHero() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = document.querySelector(".hero-bg");
  if (!host) return;

  const cv = document.createElement("canvas");
  cv.className = "hero-gl";
  const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) return;

  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res: gl.getUniformLocation(prog, "uRes"),
    time: gl.getUniformLocation(prog, "uTime"),
    mouse: gl.getUniformLocation(prog, "uMouse"),
    fade: gl.getUniformLocation(prog, "uFade"),
  };

  // Noise hides resolution, so this renders at 1.25x at most however good
  // the display is. On a 4K panel the full ratio would quadruple the
  // fragment count for no visible gain.
  const DPR = () => Math.min(devicePixelRatio || 1, 1.25);
  const resize = () => {
    const w = Math.max(1, Math.round(host.clientWidth * DPR()));
    const h = Math.max(1, Math.round(host.clientHeight * DPR()));
    if (cv.width === w && cv.height === h) return;
    cv.width = w; cv.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
  };

  host.prepend(cv);
  host.classList.add("hero-gl-on");
  resize();
  new ResizeObserver(resize).observe(host);

  let mx = -1, my = -1;
  host.addEventListener("pointermove", (e) => {
    const r = host.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width;
    my = 1 - (e.clientY - r.top) / r.height;
  }, { passive: true });
  host.addEventListener("pointerleave", () => { mx = my = -1; });

  let live = true;
  new IntersectionObserver(([e]) => { live = e.isIntersecting; }, { rootMargin: "80px" }).observe(host);

  const t0 = performance.now();
  let fade = 0;
  const frame = (now) => {
    if (live) {
      fade = Math.min(1, fade + 0.02);
      gl.uniform1f(U.time, (now - t0) / 1000);
      gl.uniform2f(U.mouse, mx, my);
      gl.uniform1f(U.fade, fade);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
