"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import Scene from "./Scene";
import Hero3DFallback from "./Hero3DFallback";
import type { NavItem } from "./nav";

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Hero3D({ nav }: { nav: NavItem[] }) {
  const [mode, setMode] = useState<"loading" | "3d" | "fallback">("loading");
  const [progress, setProgress] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 760;
    setMode(reduced || small || !supportsWebGL() ? "fallback" : "3d");
  }, []);

  useEffect(() => {
    if (mode !== "3d") return;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.min(1, Math.max(0, total > 0 ? scrolled / total : 0)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mode]);

  if (mode === "loading") {
    return <div className="skeleton-block" style={{ height: "100dvh" }} />;
  }
  if (mode === "fallback") {
    return <Hero3DFallback nav={nav} />;
  }

  return (
    <div ref={wrapRef} style={{ height: "340dvh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100dvh", overflow: "hidden" }}>
        <Canvas shadows camera={{ fov: 42, near: 0.1, far: 120 }} dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <ScrollControls pages={3.4} damping={0.2}>
              <Scene nav={nav} />
            </ScrollControls>
          </Suspense>
        </Canvas>

        {/* Plain DOM overlay, outside the R3F tree — fine to use regular divs here */}
        <div className="fixed top-[76px] left-0 right-0 h-[2px] bg-black/10 z-30 pointer-events-none">
          <div className="h-full transition-[width]" style={{ background: "var(--accent)", width: `${progress * 100}%` }} />
        </div>
        {progress < 0.06 && (
          <div className="pointer-events-none absolute left-1/2 bottom-10 -translate-x-1/2 flex flex-col items-center gap-2 text-white mix-blend-difference">
            <span className="eyebrow" style={{ color: "inherit", opacity: 0.9 }}>Scroll to walk in</span>
            <div className="w-[1px] h-9 bg-current opacity-70 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
