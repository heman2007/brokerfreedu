"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { W, D, H, WALL_T, FRONT_Z, ARCH_HALF, ARCH_SPRING } from "./constants";
import { makeBrickTexture, makeFloorTexture } from "./textures";

const CREAM = "#eadfc7";
const CREAM_DK = "#d6c7a5";
const PLASTER = "#e6d5b3";
const BRICK = "#9a4a33";
const TILE_X = 1.7; // world size one brick tile covers
const TILE_Y = 1.6;

/** Round-headed arch outline: straight sides up to springY, then a semicircle. */
export function archShape(halfW: number, springY: number, baseY = 0) {
  const s = new THREE.Shape();
  s.moveTo(-halfW, baseY);
  s.lineTo(-halfW, springY);
  s.absarc(0, springY, halfW, Math.PI, 0, true);
  s.lineTo(halfW, baseY);
  s.lineTo(-halfW, baseY);
  return s;
}

function facadeShape() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(W / 2, H);
  s.lineTo(-W / 2, H);
  s.lineTo(-W / 2, 0);
  s.holes.push(archShape(ARCH_HALF, ARCH_SPRING, 0));
  return s;
}

type Assets = {
  facadeGeo: THREE.ExtrudeGeometry;
  liningGeo: THREE.ShapeGeometry;
  ringGeo: THREE.ExtrudeGeometry;
  pedimentGeo: THREE.ExtrudeGeometry;
  facadeMats: THREE.Material[];
  leftWall: THREE.Material[];
  rightWall: THREE.Material[];
  backWall: THREE.Material[];
  plaster: THREE.MeshStandardMaterial;
  cream: THREE.MeshStandardMaterial;
  creamDk: THREE.MeshStandardMaterial;
  floor: THREE.MeshStandardMaterial;
  disposables: { dispose: () => void }[];
};

function useAssets(): Assets {
  const assets = useMemo<Assets>(() => {
    const disposables: { dispose: () => void }[] = [];
    const brick = makeBrickTexture();
    disposables.push(brick);

    const brickMat = (faceW: number, faceH: number) => {
      const t = brick.clone();
      t.needsUpdate = true;
      t.repeat.set(faceW / TILE_X, faceH / TILE_Y);
      const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.93, metalness: 0 });
      disposables.push(t, m);
      return m;
    };
    const flat = (color: string, roughness = 0.9) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
      disposables.push(m);
      return m;
    };

    const plaster = flat(PLASTER, 1);
    const cream = flat(CREAM, 0.85);
    const creamDk = flat(CREAM_DK, 0.9);
    const brickPlain = flat(BRICK, 0.95);
    const top = flat("#8a7a62", 1);

    // Facade: extrude group 0 = front/back caps (UVs are in world units), group 1 = edges
    const shape = facadeShape();
    const facadeGeo = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false, curveSegments: 32 });
    const liningGeo = new THREE.ShapeGeometry(shape, 32);
    const facadeMats = [brickMat(1, 1), brickPlain];

    // Archivolt: a raised ring of cream stone around the opening
    const ringOuter = archShape(ARCH_HALF + 0.34, ARCH_SPRING, -0.3);
    ringOuter.holes.push(archShape(ARCH_HALF, ARCH_SPRING, 0));
    const ringGeo = new THREE.ExtrudeGeometry(ringOuter, { depth: 0.22, bevelEnabled: false, curveSegments: 32 });

    // Triangular pediment above the arch
    const tri = new THREE.Shape();
    tri.moveTo(-3.6, 0);
    tri.lineTo(3.6, 0);
    tri.lineTo(0, 1.75);
    tri.lineTo(-3.6, 0);
    const pedimentGeo = new THREE.ExtrudeGeometry(tri, { depth: 0.5, bevelEnabled: false });

    // Side + back walls: BoxGeometry face order is [+x, -x, +y, -y, +z, -z]
    const sideLen = D - WALL_T * 2 + WALL_T; // 11.4 (side walls stop at the facade)
    const outerSide = brickMat(sideLen, H);
    const outerBack = brickMat(W - WALL_T * 2, H);
    const leftWall = [plaster, outerSide, top, top, brickPlain, brickPlain];
    const rightWall = [outerSide, plaster, top, top, brickPlain, brickPlain];
    const backWall = [brickPlain, brickPlain, top, top, plaster, outerBack];

    const floorTex = makeFloorTexture();
    floorTex.repeat.set((W - WALL_T * 2) / 2.6, (D - WALL_T + 0.6) / 2.6);
    const floor = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95 });
    disposables.push(floorTex, floor, facadeGeo, liningGeo, ringGeo, pedimentGeo);

    return {
      facadeGeo,
      liningGeo,
      ringGeo,
      pedimentGeo,
      facadeMats,
      leftWall,
      rightWall,
      backWall,
      plaster,
      cream,
      creamDk,
      floor,
      disposables,
    };
  }, []);

  useEffect(() => () => assets.disposables.forEach((d) => d.dispose()), [assets]);
  return assets;
}

function ArchWindow({
  position,
  rotationY = 0,
  w = 0.95,
  h = 1.25,
  frame,
  glassColor = "#1c2731",
}: {
  position: [number, number, number];
  rotationY?: number;
  w?: number;
  h?: number;
  frame: THREE.Material;
  glassColor?: string;
}) {
  const { frameGeo, glassGeo } = useMemo(() => {
    const f = new THREE.ShapeGeometry(archShape(w / 2 + 0.13, h, -0.13), 24);
    const g = new THREE.ShapeGeometry(archShape(w / 2, h, 0), 24);
    return { frameGeo: f, glassGeo: g };
  }, [w, h]);
  useEffect(
    () => () => {
      frameGeo.dispose();
      glassGeo.dispose();
    },
    [frameGeo, glassGeo]
  );
  const total = h + w / 2;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={frameGeo} material={frame} position={[0, 0, 0.012]} />
      <mesh geometry={glassGeo} position={[0, 0, 0.022]}>
        <meshStandardMaterial color={glassColor} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, total / 2, 0.04]} material={frame}>
        <boxGeometry args={[0.05, total, 0.03]} />
      </mesh>
      <mesh position={[0, h * 0.55, 0.04]} material={frame}>
        <boxGeometry args={[w, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0, -0.13, 0.08]} material={frame} castShadow>
        <boxGeometry args={[w + 0.42, 0.1, 0.18]} />
      </mesh>
    </group>
  );
}

function Chhatri({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const cols: [number, number][] = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.12, 1.5]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      {cols.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.9, z]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 1.56, 8]} />
          <meshStandardMaterial color={CREAM} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 1.74, 0]} castShadow>
        <boxGeometry args={[1.5, 0.16, 1.5]} />
        <meshStandardMaterial color={CREAM} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.76, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f2e9d5" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.72, 0]}>
        <coneGeometry args={[0.06, 0.45, 8]} />
        <meshStandardMaterial color="#c9a24a" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  );
}

type WallText = { left: THREE.Texture | null; right: THREE.Texture | null };

export default function Building({ wallText }: { wallText: WallText }) {
  const a = useAssets();

  const sideLen = D - WALL_T * 2 + WALL_T;
  const sideCz = -(WALL_T * 2 - WALL_T) / 2 - 0.0; // walls run z from -D/2 to FRONT_Z - WALL_T
  const zBackInner = -D / 2 + WALL_T;
  const zFrontInner = FRONT_Z - WALL_T;
  const xInner = W / 2 - WALL_T;

  const windowXs = [3.4, 5.2, 7.0];

  return (
    <group>
      {/* ---- front facade with the arch cut through it ---- */}
      <mesh geometry={a.facadeGeo} material={a.facadeMats} position={[0, 0, FRONT_Z - WALL_T]} castShadow receiveShadow />
      {/* plaster lining on the courtyard side of the facade */}
      <mesh geometry={a.liningGeo} material={a.plaster} position={[0, 0, zFrontInner - 0.006]} rotation={[0, Math.PI, 0]} receiveShadow />

      {/* archivolt, keystone, pilasters */}
      <mesh geometry={a.ringGeo} material={a.cream} position={[0, 0, FRONT_Z]} castShadow receiveShadow />
      <mesh position={[0, ARCH_SPRING + ARCH_HALF + 0.17, FRONT_Z + 0.2]} material={a.creamDk} castShadow>
        <boxGeometry args={[0.46, 0.55, 0.32]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (ARCH_HALF + 0.95), 0, FRONT_Z + 0.3]}>
          <mesh position={[0, 0.25, 0]} material={a.creamDk} castShadow>
            <boxGeometry args={[0.8, 0.5, 0.8]} />
          </mesh>
          <mesh position={[0, (ARCH_SPRING + 0.4) / 2 + 0.5, 0]} material={a.cream} castShadow>
            <cylinderGeometry args={[0.27, 0.3, ARCH_SPRING + 0.4, 20]} />
          </mesh>
          <mesh position={[0, ARCH_SPRING + 0.95, 0]} material={a.creamDk} castShadow>
            <boxGeometry args={[0.82, 0.3, 0.82]} />
          </mesh>
        </group>
      ))}

      {/* plinth either side of the doorway + entrance steps */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * ((W / 2 + ARCH_HALF + 0.34) / 2 + 0.05), 0.35, FRONT_Z + 0.12]}
          material={a.creamDk}
          receiveShadow
        >
          <boxGeometry args={[W / 2 - ARCH_HALF - 0.34 + 0.2, 0.7, 0.36]} />
        </mesh>
      ))}
      <mesh position={[0, 0.07, FRONT_Z + 0.45]} material={a.creamDk} receiveShadow>
        <boxGeometry args={[ARCH_HALF * 2 + 1.2, 0.14, 0.9]} />
      </mesh>

      {/* frieze band + cornice + pediment */}
      <mesh position={[0, H - 0.55, FRONT_Z + 0.03]} material={a.cream}>
        <boxGeometry args={[W, 0.22, 0.06]} />
      </mesh>
      <mesh position={[0, H + 0.2, FRONT_Z - 0.2]} material={a.cream} castShadow receiveShadow>
        <boxGeometry args={[W + 0.5, 0.4, 0.9]} />
      </mesh>
      <mesh position={[0, H + 0.2, -(FRONT_Z - 0.2)]} material={a.cream} castShadow receiveShadow>
        <boxGeometry args={[W + 0.5, 0.4, 0.9]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.2), H + 0.2, 0]} material={a.cream} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.4, D + 0.5]} />
        </mesh>
      ))}
      <mesh geometry={a.pedimentGeo} material={a.cream} position={[0, H + 0.4, FRONT_Z - 0.45]} castShadow />
      <mesh position={[0, H + 1.05, FRONT_Z + 0.07]}>
        <circleGeometry args={[0.46, 32]} />
        <meshStandardMaterial color="#26303a" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, H + 1.05, FRONT_Z + 0.075]} material={a.creamDk}>
        <ringGeometry args={[0.46, 0.6, 32]} />
      </mesh>

      {/* arched windows above the painted panels */}
      {windowXs.map((x) => (
        <group key={x}>
          <ArchWindow position={[-x, 4.75, FRONT_Z]} frame={a.cream} />
          <ArchWindow position={[x, 4.75, FRONT_Z]} frame={a.cream} />
        </group>
      ))}

      {/* ---- side and back walls (brick outside, plaster inside) ---- */}
      <mesh position={[-(W / 2 - WALL_T / 2), H / 2, sideCz]} material={a.leftWall} castShadow receiveShadow>
        <boxGeometry args={[WALL_T, H, sideLen]} />
      </mesh>
      <mesh position={[W / 2 - WALL_T / 2, H / 2, sideCz]} material={a.rightWall} castShadow receiveShadow>
        <boxGeometry args={[WALL_T, H, sideLen]} />
      </mesh>
      <mesh position={[0, H / 2, -D / 2 + WALL_T / 2]} material={a.backWall} castShadow receiveShadow>
        <boxGeometry args={[W - WALL_T * 2, H, WALL_T]} />
      </mesh>

      {/* ---- courtyard floor (runs out under the arch) ---- */}
      <mesh
        position={[0, 0.012, (zBackInner + FRONT_Z) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={a.floor}
        receiveShadow
      >
        <planeGeometry args={[W - WALL_T * 2, FRONT_Z - zBackInner]} />
      </mesh>

      {/* ---- courtyard windows, so the climb has something to pass ---- */}
      {[-3.4, 0, 3.4].map((z) => (
        <group key={z}>
          <ArchWindow position={[-xInner, 1.9, z]} rotationY={Math.PI / 2} frame={a.cream} w={1.1} h={1.9} />
          <ArchWindow position={[xInner, 1.9, z]} rotationY={-Math.PI / 2} frame={a.cream} w={1.1} h={1.9} />
          <ArchWindow position={[-xInner, 5.6, z]} rotationY={Math.PI / 2} frame={a.cream} w={0.9} h={1.1} />
          <ArchWindow position={[xInner, 5.6, z]} rotationY={-Math.PI / 2} frame={a.cream} w={0.9} h={1.1} />
        </group>
      ))}
      {[-4.6, -1.55, 1.55, 4.6].map((x) => (
        <group key={x}>
          <ArchWindow position={[x, 1.9, zBackInner]} frame={a.cream} w={1.1} h={1.9} />
          <ArchWindow position={[x, 5.6, zBackInner]} frame={a.cream} w={0.9} h={1.1} />
        </group>
      ))}

      {/* ---- chhatris on the four corners ---- */}
      <Chhatri position={[-7.05, H + 0.4, FRONT_Z - 0.9]} />
      <Chhatri position={[7.05, H + 0.4, FRONT_Z - 0.9]} />
      <Chhatri position={[-7.05, H + 0.4, -FRONT_Z + 0.9]} />
      <Chhatri position={[7.05, H + 0.4, -FRONT_Z + 0.9]} />

      {/* ---- painted street art, one panel either side of the arch ---- */}
      {wallText.left && (
        <mesh position={[-5.2, 2.45, FRONT_Z + 0.03]}>
          <planeGeometry args={[4.8, 3]} />
          <meshStandardMaterial
            map={wallText.left}
            transparent
            roughness={1}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      )}
      {wallText.right && (
        <mesh position={[5.2, 2.45, FRONT_Z + 0.03]}>
          <planeGeometry args={[4.8, 3]} />
          <meshStandardMaterial
            map={wallText.right}
            transparent
            roughness={1}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
          />
        </mesh>
      )}
    </group>
  );
}
