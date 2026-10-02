"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";
import { FRONT_Z, T_EXTERIOR_END, T_ARCH_END, CAM_R, CAM_START_Y, CAM_END_Y, STAIR, stepY } from "./constants";

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const lookTarget = new THREE.Vector3();
const camPos = new THREE.Vector3();

export default function CameraRig() {
  const scroll = useScroll();
  const { camera: cameraBase } = useThree();
  const camera = cameraBase as THREE.PerspectiveCamera;
  const progress = useRef(0);

  useFrame((_, dt) => {
    const target = scroll.offset;
    // critically damped-ish smoothing so the ride feels fluid, not robotic
    progress.current += (target - progress.current) * Math.min(1, dt * 4.2);
    const p = progress.current;

    if (p <= T_EXTERIOR_END) {
      // --- stage 1: standing on the street, closing in on the facade ---
      const t = smoothstep(0, T_EXTERIOR_END, p);
      const z = THREE.MathUtils.lerp(26, FRONT_Z + 6.5, t);
      const y = THREE.MathUtils.lerp(4.2, 2.1, t);
      const sway = Math.sin(p * 9) * (1 - t) * 1.2;
      camPos.set(sway, y, z);
      lookTarget.set(0, THREE.MathUtils.lerp(4.5, 2.6, t), FRONT_Z - 1);
      camera.fov = THREE.MathUtils.lerp(42, 36, t);
    } else if (p <= T_ARCH_END) {
      // --- stage 2: passing through the archway into the courtyard ---
      const t = smoothstep(T_EXTERIOR_END, T_ARCH_END, p);
      const z = THREE.MathUtils.lerp(FRONT_Z + 6.5, -1.5, t);
      const y = THREE.MathUtils.lerp(2.1, STAIR.y0 + 1.35, t);
      camPos.set(0, y, z);
      lookTarget.set(0, STAIR.y0 + 1, Math.min(z - 4, -2));
      camera.fov = THREE.MathUtils.lerp(36, 46, t);
    } else {
      // --- stage 3: orbit-climbing the spiral staircase ---
      const t = smoothstep(T_ARCH_END, 1, p);
      const angle = -t * Math.PI * 2.3 + Math.PI; // start opposite the arch, spin up and around
      const radius = CAM_R - t * 0.9;
      const y = THREE.MathUtils.lerp(CAM_START_Y, CAM_END_Y, t);
      camPos.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const lookY = THREE.MathUtils.lerp(stepY(2), stepY(STAIR.steps - 3), t);
      lookTarget.set(0, lookY, 0);
      camera.fov = 50;
    }

    camera.position.lerp(camPos, Math.min(1, dt * 8));
    const currentLook = camera.userData.look || lookTarget.clone();
    currentLook.lerp(lookTarget, Math.min(1, dt * 8));
    camera.userData.look = currentLook;
    camera.lookAt(currentLook);
    camera.updateProjectionMatrix();
  });

  return null;
}
