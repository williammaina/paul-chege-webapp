/**
 * Live 3D + smooth scroll.
 *
 * Everything here is progressive enhancement. The page already renders a
 * CSS-transform book that looks fine; this replaces it with a real mesh on
 * the GPU only when the device can clearly afford it, and never otherwise.
 * If this whole file fails to parse, the page is exactly what it was.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const quiet = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ══ can this device actually do it? ══════════════════════════════════════
   A dropped-frame 3D scene looks far worse than a clean CSS one, so the
   bar is deliberately high and the answer is checked before anything is
   downloaded into GPU memory. */
function capable() {
  if (quiet()) return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    if (!gl) return false;
    // Touch devices get the CSS book, full stop. Plenty of phones could
    // render this, but 550KB over mobile data for one decorative object is
    // not a trade worth making, and the fallback is already good.
    if (matchMedia("(pointer: coarse)").matches) return false;
    if ((navigator.deviceMemory || 4) <= 3) return false;
    if ((navigator.hardwareConcurrency || 4) <= 2) return false;
    // Software rasterisers report themselves honestly; they cannot hold 60.
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|software/i.test(name)) return false;
    return true;
  } catch { return false; }
}

/* ══ the book, as an object ═══════════════════════════════════════════════ */
function initBook() {
  const stage = document.querySelector(".book3d-stage");
  const coverImg = document.querySelector(".book3d-face img");
  if (!stage || !coverImg) return;

  const mount = document.createElement("div");
  mount.className = "gl-stage";
  stage.prepend(mount);

  const W = () => mount.clientWidth || 320;
  const H = () => mount.clientHeight || 460;

  const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true, powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W() / H(), 0.1, 100);
    // Far enough back that the bloom halo has fallen to nothing well before
  // the edge of the canvas. Too close and the glow is clipped by the
  // element bounds, which draws a visible rectangle over the section.
  camera.position.set(0, 0, 10.4);

  // A procedural room as the reflection source. This is what makes the
  // jacket look like a printed surface under real light rather than a
  // flat-shaded box, and it needs no .hdr file to ship.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;

  const key = new THREE.DirectionalLight(0xfff2d8, 2.5);
  key.position.set(2.2, 6.4, 3.6);   // more overhead, so the shadow sits under the book
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 7;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xe6b84c, 1.5);
  rim.position.set(-4, 1.4, -3);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x9fc2ff, 0x0a1828, 0.45));

  /* The cover texture is taken from the <img> already in the document, so
     it works identically whether that image is a file or the base64 data
     URI the shareable build inlines. Nothing is fetched twice. */
  const cover = new THREE.Texture(coverImg);
  cover.colorSpace = THREE.SRGBColorSpace;
  cover.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  cover.needsUpdate = true;

  // The fore-edge: a few hundred page ends, drawn once to a canvas.
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = 512; pageCanvas.height = 8;
  const pctx = pageCanvas.getContext("2d");
  for (let x = 0; x < 512; x++) {
    const v = 214 + Math.round(Math.sin(x * 1.9) * 9 + (x % 3 === 0 ? 14 : 0));
    pctx.fillStyle = `rgb(${v + 22},${v + 16},${v - 2})`;
    pctx.fillRect(x, 0, 1, 8);
  }
  const pages = new THREE.CanvasTexture(pageCanvas);
  pages.colorSpace = THREE.SRGBColorSpace;
  pages.wrapS = pages.wrapT = THREE.RepeatWrapping;

  const paper = (map) => new THREE.MeshPhysicalMaterial({
    map, color: 0xffffff, roughness: 0.78, metalness: 0,
  });
  const jacket = new THREE.MeshPhysicalMaterial({
    map: cover, roughness: 0.34, metalness: 0.02,
    clearcoat: 0.85, clearcoatRoughness: 0.18,   // the laminate on a real cover
    sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xe6b84c),
  });

  const w = 2.5, h = 3.75, d = 0.42;
  // BoxGeometry gives one material group per face, which is exactly the six
  // surfaces a book has.
  const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
  const book = new THREE.Mesh(geo, [
    paper(pages),                                              // fore-edge
    new THREE.MeshPhysicalMaterial({ color: 0x7a1a1a, roughness: 0.42, clearcoat: 0.5 }), // spine
    paper(pages), paper(pages),                                // head & tail
    jacket,                                                    // front
    new THREE.MeshPhysicalMaterial({ color: 0x0a1c2e, roughness: 0.5, clearcoat: 0.6 }),  // back
  ]);
  book.castShadow = true;
  scene.add(book);

  // Something for the shadow to land on. Invisible except where it is dark.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.5 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.15;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ══ post-processing ═══════════════════════════════════════════════════
     Bloom on the gold, then one custom pass for the things a display does
     that a renderer does not: a little chromatic aberration at the edges,
     film grain so the gradients never band, and a vignette. */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio, 2));
  composer.setSize(W(), H());
  composer.addPass(new RenderPass(scene, camera));
    /* UnrealBloomPass is not used here, and the reason is worth recording.
     Its final composite writes alpha 1 across the whole screen quad. On an
     opaque scene that is invisible; on this one — a transparent canvas
     sitting over a navy band — it turns the entire canvas into a solid
     lighter rectangle over the section. The bloom below is done inside the
     grade pass instead, where it can be multiplied by the scene's own
     alpha and so never touches an empty pixel. */
  const GradePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uAmount: { value: 0.0016 },
      uBloomStrength: { value: 1.35 },
      uBloomThreshold: { value: 0.72 },
      uBloomRadius: { value: 0.022 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uAmount;
      uniform float uBloomStrength;
      uniform float uBloomThreshold;
      uniform float uBloomRadius;
      varying vec2 vUv;

      // Cheap hash noise. Enough to break up 8-bit banding, not enough to see.
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      void main(){
        vec2 c = vUv - 0.5;
        float r2 = dot(c, c);

        // Lateral chromatic aberration: zero in the centre, grows outward,
        // which is how a real lens behaves.
        vec2 off = c * uAmount * r2 * 12.0;
        vec4 mid = texture2D(tDiffuse, vUv);
        vec4 col = mid;
        col.r = mix(mid.r, texture2D(tDiffuse, vUv + off).r, mid.a);
        col.b = mix(mid.b, texture2D(tDiffuse, vUv - off).b, mid.a);

        // Bloom: twelve taps on a golden-angle spiral, bright-pass only.
        // Cheap, and unlike UnrealBloomPass it can be weighted by alpha.
        vec3 glow = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          float fi = float(i);
          float ang = fi * 2.399963;
          float rad = (fi / 12.0) * uBloomRadius;
          vec2 sp = vUv + vec2(cos(ang), sin(ang)) * rad;
          vec4 t = texture2D(tDiffuse, sp);
          float lum = dot(t.rgb, vec3(0.2126, 0.7152, 0.0722));
          glow += max(t.rgb - uBloomThreshold, 0.0) * t.a * smoothstep(0.0, 0.25, lum);
        }
        col.rgb += (glow / 12.0) * uBloomStrength * mid.a;

        // Everything below is scaled by alpha. The canvas sits over the
        // page with a transparent background, and grain or a vignette
        // painted onto empty pixels draws a visible rectangle around the
        // whole scene — which is exactly what the first version did.
        float a = col.a;

        // Grain, animated so it reads as sensor noise rather than a texture.
        float n = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 91.7) - 0.5;
        col.rgb += n * 0.022 * a;

        // A vignette that only ever darkens the object, never the gap
        // around it.
        col.rgb *= 1.0 - smoothstep(0.30, 0.95, r2) * 0.30 * a;

        gl_FragColor = col;
      }
    `,
  });
  composer.addPass(GradePass);
  composer.addPass(new OutputPass());

  /* ══ motion ════════════════════════════════════════════════════════════ */
  const target = { x: 0.06, y: -0.42 };
  const current = { x: 0.06, y: -0.42 };
  let scrollSpin = 0;

  mount.addEventListener("pointermove", (e) => {
    const r = mount.getBoundingClientRect();
    target.y = -0.42 + ((e.clientX - r.left) / r.width - 0.5) * 1.05;
    target.x = 0.06 + ((e.clientY - r.top) / r.height - 0.5) * -0.5;
  }, { passive: true });
  mount.addEventListener("pointerleave", () => { target.x = 0.06; target.y = -0.42; });

  const onScroll = () => {
    const r = mount.getBoundingClientRect();
    // -1 below the fold, +1 above it: the book turns as the section passes.
    const p = (innerHeight * 0.5 - (r.top + r.height * 0.5)) / (innerHeight * 0.9);
    scrollSpin = Math.max(-1, Math.min(1, p)) * 0.55;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Nothing renders while the section is off screen.
  let visible = false;
  new IntersectionObserver(
    ([e]) => { visible = e.isIntersecting; },
    { rootMargin: "120px" }
  ).observe(mount);

  const resize = () => {
    const w2 = W(), h2 = H();
    camera.aspect = w2 / h2;
    camera.updateProjectionMatrix();
    renderer.setSize(w2, h2);
    composer.setSize(w2, h2);
  };
  addEventListener("resize", resize, { passive: true });
  new ResizeObserver(resize).observe(mount);

  const clock = new THREE.Clock();
  function frame(time) {
    if (visible) {
      const dt = Math.min(clock.getDelta(), 0.05);
      const k = 1 - Math.pow(0.0016, dt);      // frame-rate independent damping
      current.x += (target.x - current.x) * k;
      current.y += (target.y + scrollSpin - current.y) * k;
      book.rotation.x = current.x;
      book.rotation.y = current.y;
      book.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.045;
      GradePass.uniforms.uTime.value = clock.elapsedTime;
      composer.render();
    } else {
      clock.getDelta();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Only now is the CSS stand-in retired.
  stage.classList.add("gl-on");
}

/* ══ boot ═════════════════════════════════════════════════════════════════
   This file is only ever injected by the loader in the page, which has
   already decided the device can afford it. Smooth scroll is handled
   separately and is already running by the time this arrives. */
try { initBook(); } catch (err) {
  console.warn("[gl] falling back to the CSS book:", err);
  document.querySelector(".book3d-stage")?.classList.remove("gl-on");
}
