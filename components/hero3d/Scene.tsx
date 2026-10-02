"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import Building from "./Building";
import Staircase from "./Staircase";
import CameraRig from "./CameraRig";
import { makeWallTextures } from "./textures";
import { FRONT_Z, D } from "./constants";
import type { NavItem } from "./nav";

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 2, 8]} />
        <meshStandardMaterial color="#5b4631" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[1.3, 2.6, 9]} />
        <meshStandardMaterial color="#3f5a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.6, 0]} castShadow>
        <coneGeometry args={[0.95, 1.9, 9]} />
        <meshStandardMaterial color="#4a6943" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Street() {
  return (
    <group>
      <mesh position={[0, -0.01, FRONT_Z + 14]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46, 26]} />
        <meshStandardMaterial color="#8d7a5c" roughness={1} />
      </mesh>
      <mesh position={[0, 0, FRONT_Z + 22]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[46, 10]} />
        <meshStandardMaterial color="#3a3a3d" roughness={1} />
      </mesh>
      <Tree position={[-9, 0, FRONT_Z + 10]} />
      <Tree position={[9.5, 0, FRONT_Z + 9]} scale={1.15} />
      <Tree position={[-13, 0, FRONT_Z + 15]} scale={0.9} />
    </group>
  );
}

export default function Scene({ nav }: { nav: NavItem[] }) {
  const [wallText, setWallText] = useState<{ left: THREE.Texture | null; right: THREE.Texture | null }>({
    left: null,
    right: null,
  });

  useEffect(() => {
    let live = true;
    makeWallTextures().then((t) => {
      if (live) setWallText(t);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <>
      <color attach="background" args={["#cfd9df"]} />
      <fog attach="fog" args={["#cfd9df", 18, 48]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <pointLight position={[0, 5, -D / 2 + 1]} intensity={14} distance={16} color="#f2d9a0" />
      <hemisphereLight args={["#dfe8ee", "#55493a", 0.5]} />

      <Street />
      <Building wallText={wallText} />
      <Staircase nav={nav} />
      <CameraRig />
    </>
  );
}
