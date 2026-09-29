"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The book, as a real mesh.
 *
 * BoxGeometry rather than a rounded box because its six material groups
 * are exactly the six surfaces a book has: fore-edge, spine, head, tail,
 * jacket, back. The jacket carries clearcoat, which is the laminate on a
 * real cover and most of why it reads as a printed object.
 */
function Book() {
  const mesh = useRef<THREE.Mesh>(null);
  const target = useRef({ x: 0.06, y: -0.42 });
  const current = useRef({ x: 0.06, y: -0.42 });
  const spin = useRef(0);
  const { gl } = useThree();

  const cover = useRef<THREE.Texture | null>(null);
  const pages = useRef<THREE.Texture | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/img/book-cover.jpg", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      cover.current = t;
      setReady(true);
    });

    // The fore-edge: a few hundred page ends, drawn once to a canvas.
    const c = document.createElement("canvas");
    c.width = 512; c.height = 8;
    const ctx = c.getContext("2d")!;
    for (let x = 0; x < 512; x++) {
      const v = 214 + Math.round(Math.sin(x * 1.9) * 9 + (x % 3 === 0 ? 14 : 0));
      ctx.fillStyle = `rgb(${v + 22},${v + 16},${v - 2})`;
      ctx.fillRect(x, 0, 1, 8);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    pages.current = t;
  }, [gl]);

  useEffect(() => {
    const onScroll = () => {
      const el = gl.domElement.parentElement;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = (innerHeight * 0.5 - (r.top + r.height * 0.5)) / (innerHeight * 0.9);
      spin.current = Math.max(-1, Math.min(1, p)) * 0.55;
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, [gl]);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m) return;
    const p = state.pointer;
    target.current.y = -0.42 + p.x * 0.5;
    target.current.x = 0.06 - p.y * 0.25;
    const k = 1 - Math.pow(0.0016, Math.min(dt, 0.05));   // frame-rate independent
    current.current.x += (target.current.x - current.current.x) * k;
    current.current.y += (target.current.y + spin.current - current.current.y) * k;
    m.rotation.x = current.current.x;
    m.rotation.y = current.current.y;
    m.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.045;
  });

  if (!ready) return null;

  return (
    <mesh ref={mesh} castShadow>
      <boxGeometry args={[2.5, 3.75, 0.42]} />
      {/* One material per face, in BoxGeometry's group order: +X fore-edge,
          -X spine, +Y head, -Y tail, +Z jacket, -Z back. Every one needs an
          explicit `attach`; a bare material binds to `mesh.material` and
          replaces the whole array, which silently collapses all six faces
          onto one. */}
      <meshPhysicalMaterial attach="material-0" map={pages.current} roughness={0.78} metalness={0} />
      <meshPhysicalMaterial attach="material-1" color="#7a1a1a" roughness={0.42} clearcoat={0.5} />
      <meshPhysicalMaterial attach="material-2" map={pages.current} roughness={0.78} />
      <meshPhysicalMaterial attach="material-3" map={pages.current} roughness={0.78} />
      <meshPhysicalMaterial attach="material-4" map={cover.current} roughness={0.34} metalness={0.02}
                            clearcoat={0.85} clearcoatRoughness={0.18} />
      <meshPhysicalMaterial attach="material-5" color="#0a1c2e" roughness={0.5} clearcoat={0.6} />
    </mesh>
  );
}

export function BookCanvas() {
  return (
    <div className="absolute inset-0">
      {/* `shadows` alone asks for PCFSoftShadowMap, which three r186 removed —
          it warns and silently downgrades. Asking for the map that exists
          keeps the console clean and the choice explicit. */}
      <Canvas shadows="percentage" dpr={[1, 2]} camera={{ fov: 30, position: [0, 0, 10.4] }}
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance",
                    toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.22 }}>
        <Environment preset="apartment" environmentIntensity={0.8} />
        <directionalLight position={[2.2, 6.4, 3.6]} intensity={2.5} color="#fff2d8" castShadow
                          shadow-mapSize={[1024, 1024]} shadow-bias={-0.0012} />
        <directionalLight position={[-4, 1.4, -3]} intensity={1.5} color="#e6b84c" />
        <hemisphereLight args={["#9fc2ff", "#0a1828", 0.45]} />
        <Book />
        <ContactShadows position={[0, -2.15, 0]} opacity={0.5} scale={12} blur={2.6} far={4} />
      </Canvas>
    </div>
  );
}
