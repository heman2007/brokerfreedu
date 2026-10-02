"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Html } from "@react-three/drei";
import Link from "next/link";
import { STAIR, dPhi, stepAngle, stepY, LABEL_STEPS } from "./constants";
import type { NavItem } from "./nav";

const STONE = "#cdbd98";
const STONE_DK = "#a9926a";
const RAIL = "#5a4a34";

function Tread({ k }: { k: number }) {
  const phi = stepAngle(k);
  const y = stepY(k);
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    const steps = 10;
    shape.moveTo(STAIR.rInner, 0);
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * dPhi;
      shape.lineTo(Math.cos(a) * STAIR.rOuter, Math.sin(a) * STAIR.rOuter);
    }
    for (let i = steps; i >= 0; i--) {
      const a = (i / steps) * dPhi;
      shape.lineTo(Math.cos(a) * STAIR.rInner, Math.sin(a) * STAIR.rInner);
    }
    return new THREE.ExtrudeGeometry(shape, { depth: STAIR.rise * 0.82, bevelEnabled: false, curveSegments: 10 });
  }, []);

  return (
    <group rotation={[0, -phi, 0]} position={[0, y, 0]}>
      <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={k % 2 === 0 ? STONE : STONE_DK} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Label({ item }: { item: NavItem }) {
  return (
    <Html
      transform
      occlude
      distanceFactor={2.6}
      position={[0, 0.72, 0]}
      rotation-x={-0.08}
      style={{ pointerEvents: "auto" }}
    >
      <Link
        href={item.href}
        className="block whitespace-nowrap px-5 py-2.5 text-[15px] font-medium rounded-sm transition-transform hover:scale-105"
        style={{
          background: item.accent ? "var(--signal)" : "rgba(26,26,28,0.88)",
          color: "#f4ecd9",
          border: `1px solid ${item.accent ? "var(--signal)" : "rgba(244,236,217,0.35)"}`,
          letterSpacing: "0.01em",
          backdropFilter: "blur(2px)",
        }}
      >
        {item.label}
      </Link>
    </Html>
  );
}

export default function Staircase({ nav }: { nav: NavItem[] }) {
  const treads = useMemo(() => Array.from({ length: STAIR.steps }, (_, k) => k), []);
  const newelH = stepY(STAIR.steps - 1) + 1.1;

  return (
    <group>
      {/* central newel post */}
      <mesh position={[0, newelH / 2 + STAIR.y0 - 0.3, 0]} castShadow>
        <cylinderGeometry args={[STAIR.rInner, STAIR.rInner, newelH, 16]} />
        <meshStandardMaterial color={RAIL} roughness={0.6} />
      </mesh>

      {treads.map((k) => (
        <Tread key={k} k={k} />
      ))}

      {/* outer handrail: a tube following the helix */}
      <Handrail />

      {LABEL_STEPS.map((k, i) =>
        nav[i] ? (
          <group key={k} rotation={[0, -stepAngle(k), 0]} position={[0, stepY(k) + STAIR.rise * 0.82, 0]}>
            <group position={[(STAIR.rInner + STAIR.rOuter) / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <Label item={nav[i]} />
            </group>
          </group>
        ) : null
      )}
    </group>
  );
}

function Handrail() {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const total = STAIR.steps - 1;
    for (let i = 0; i <= total * 6; i++) {
      const k = (i / 6) * (total / total); // fine-grained k
      const kk = (i / (total * 6)) * total;
      const phi = stepAngle(kk);
      const y = stepY(kk) + STAIR.rise * 0.82 + 0.92;
      pts.push(new THREE.Vector3(Math.cos(phi) * (STAIR.rOuter - 0.08), y, Math.sin(phi) * (STAIR.rOuter - 0.08)));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, []);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.05, 8, false), [curve]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={RAIL} roughness={0.5} />
    </mesh>
  );
}
