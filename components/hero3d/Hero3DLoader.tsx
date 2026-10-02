"use client";

import dynamic from "next/dynamic";
import type { NavItem } from "./nav";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <div className="skeleton-block" style={{ height: "100dvh" }} />,
});

export default function Hero3DLoader({ nav }: { nav: NavItem[] }) {
  return <Hero3D nav={nav} />;
}
