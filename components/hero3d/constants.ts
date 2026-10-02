// Shared geometry + timeline numbers for the 3D landing hero.
// World units are roughly metres. The building faces +z (toward the street).

export const HEADER_H = 76; // px, height of the sticky site header

// Building footprint
export const W = 16; // facade width
export const D = 12; // depth front to back
export const H = 8; // wall height
export const WALL_T = 0.6;
export const FRONT_Z = D / 2; // z of the outer face of the front facade

// Arched entryway cut through the front facade
export const ARCH_HALF = 1.7; // half-width of the opening
export const ARCH_SPRING = 3.3; // height where the semicircle begins

// Spiral staircase in the middle of the courtyard
export const STAIR = {
  rInner: 0.32,
  rOuter: 1.75,
  rise: 0.4,
  y0: 0.32,
  steps: 28,
  perTurn: 14,
} as const;

export const dPhi = (Math.PI * 2) / STAIR.perTurn;
export const stepAngle = (k: number) => k * dPhi; // 0 = facing the arch (+z), grows toward +x
export const stepY = (k: number) => STAIR.y0 + k * STAIR.rise;

// Which staircase steps carry a menu label (one per nav item, in order)
export const LABEL_STEPS = [1, 5, 9, 13, 17, 21, 25] as const;

// Camera inside the courtyard
export const EYE = 1.35; // camera height above the tread it is "standing" beside
export const CAM_R = 3.7; // orbit radius while climbing
export const CAM_START_Y = STAIR.y0 + EYE;
export const CAM_END_Y = stepY(25) + EYE + 0.4;

// Timeline (0..1 scroll progress)
export const T_EXTERIOR_END = 0.28; // camera has closed in on the facade
export const T_ARCH_END = 0.5; // camera has passed through the arch
