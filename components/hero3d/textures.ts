import * as THREE from "three";

// Everything here draws to <canvas> at runtime, so there are no image files to
// ship or license. Call only in the browser.

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function finish(tex: THREE.CanvasTexture, repeat = true) {
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Old red brick with cream mortar. One tile covers ~1.7 x 1.6 world units. */
export function makeBrickTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#d8c8ac";
  g.fillRect(0, 0, size, size);

  const pitchX = 64;
  const pitchY = 32;
  const bw = 59;
  const bh = 26;
  for (let row = 0; row < 8; row++) {
    const off = (row % 2) * 32;
    for (let col = -1; col <= 4; col++) {
      // colour keyed to the brick index modulo 4 so wrapped halves match (seamless tiling)
      const idx = ((col % 4) + 4) % 4;
      const r1 = hash(row * 13 + idx * 7 + 1);
      const r2 = hash(row * 17 + idx * 11 + 2);
      const r3 = hash(row * 19 + idx * 5 + 3);
      g.fillStyle = `hsl(${10 + r1 * 10}, ${42 + r2 * 16}%, ${32 + r3 * 12}%)`;
      g.fillRect(col * pitchX + off + 2.5, row * pitchY + 3, bw, bh);
    }
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,240,220,0.06)";
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  return finish(new THREE.CanvasTexture(c));
}

/** Big sandstone flags for the courtyard floor. */
export function makeFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const half = size / 2;
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      const v = hash(x * 3 + y * 5 + 9);
      g.fillStyle = `hsl(36, ${22 + v * 8}%, ${68 + v * 6}%)`;
      g.fillRect(x * half, y * half, half, half);
    }
  }
  g.strokeStyle = "#a89877";
  g.lineWidth = 4;
  g.strokeRect(0, 0, size, size);
  g.beginPath();
  g.moveTo(half, 0);
  g.lineTo(half, size);
  g.moveTo(0, half);
  g.lineTo(size, half);
  g.stroke();
  for (let i = 0; i < 900; i++) {
    g.fillStyle = Math.random() > 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
    g.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }
  return finish(new THREE.CanvasTexture(c));
}

async function ensureFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const sample = "brokerfreeDU Satyagraha Deepanshu Shokeen";
  const specs = [
    '700 100px Inter',
    '500 40px Inter',
    'italic 400 40px Newsreader',
    '100px "Permanent Marker"',
  ];
  try {
    await Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s, sample))),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {
    /* fall back to system fonts */
  }
}

/** Erodes the paint a little so it reads as painted on brick, not pasted on. */
function weather(g: CanvasRenderingContext2D, w: number, h: number) {
  g.save();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 1100; i++) {
    g.globalAlpha = 0.12 + Math.random() * 0.35;
    g.beginPath();
    g.arc(Math.random() * w, Math.random() * h, Math.random() * 2.2 + 0.4, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 26; i++) {
    g.globalAlpha = 0.15 + Math.random() * 0.2;
    g.fillRect(Math.random() * w, Math.random() * h, 10 + Math.random() * 40, 1 + Math.random() * 2);
  }
  g.restore();
}

const CREAM = "#f4ecd9";
const GOLD = "#e0b352";
const SAFFRON = "#eaa32a";

function setSpacing(g: CanvasRenderingContext2D, px: number) {
  // letterSpacing is not in every browser's canvas; ignore silently where missing
  (g as unknown as { letterSpacing?: string }).letterSpacing = `${px}px`;
}

/** Left wall: the platform's name and one modest, clean paragraph. */
function drawLeft(): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.textBaseline = "alphabetic";
  g.textAlign = "left";

  // wordmark: broker | free | DU, with "free" picked out in gold
  let size = 118;
  const parts: [string, string][] = [
    ["broker", CREAM],
    ["free", GOLD],
    ["DU", CREAM],
  ];
  const measure = (s: number) => {
    g.font = `700 ${s}px Inter, "Helvetica Neue", Arial, sans-serif`;
    return parts.reduce((acc, [t]) => acc + g.measureText(t).width, 0);
  };
  while (measure(size) > 880 && size > 60) size -= 4;
  g.font = `700 ${size}px Inter, "Helvetica Neue", Arial, sans-serif`;
  let x = 70;
  for (const [t, col] of parts) {
    g.fillStyle = col;
    g.fillText(t, x, 190);
    x += g.measureText(t).width;
  }

  g.fillStyle = GOLD;
  g.fillRect(70, 226, 120, 5);

  g.fillStyle = CREAM;
  g.font = '500 44px Inter, "Helvetica Neue", Arial, sans-serif';
  g.fillText("Flats and PGs around DU,", 70, 306);
  g.fillText("posted by the students", 70, 366);
  g.fillText("who actually lived there.", 70, 426);

  g.font = '700 40px Inter, "Helvetica Neue", Arial, sans-serif';
  g.fillStyle = GOLD;
  g.fillText("No brokers. No fees.", 70, 528);

  weather(g, w, h);
  return finish(new THREE.CanvasTexture(c), false);
}

/** Right wall: Satyagraha, in a marker hand with a different palette. */
function drawRight(): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.textBaseline = "alphabetic";
  g.textAlign = "center";

  const marker = '"Permanent Marker", "Marker Felt", "Comic Sans MS", cursive';
  let size = 132;
  g.font = `${size}px ${marker}`;
  while (g.measureText("Satyagraha").width > 900 && size > 60) {
    size -= 4;
    g.font = `${size}px ${marker}`;
  }

  g.save();
  g.translate(w / 2, 214);
  g.rotate(-0.045);
  g.fillStyle = SAFFRON; // offset shadow
  g.fillText("Satyagraha", 6, 6);
  g.fillStyle = CREAM;
  g.fillText("Satyagraha", 0, 0);
  g.lineWidth = 9;
  g.lineCap = "round";
  g.strokeStyle = SAFFRON;
  g.beginPath();
  g.moveTo(-330, 40);
  g.bezierCurveTo(-120, 58, 120, 24, 335, 44);
  g.stroke();
  g.restore();

  g.fillStyle = CREAM;
  g.font = 'italic 400 46px Newsreader, Georgia, serif';
  g.fillText("a movement by", w / 2, 336);

  g.font = `68px ${marker}`;
  g.fillText("Deepanshu Shokeen", w / 2, 424);

  g.fillStyle = SAFFRON;
  g.font = '600 30px Inter, "Helvetica Neue", Arial, sans-serif';
  setSpacing(g, 7);
  g.fillText("DUSU VICE PRESIDENT 2026", w / 2, 498);
  setSpacing(g, 0);

  weather(g, w, h);
  return finish(new THREE.CanvasTexture(c), false);
}

export async function makeWallTextures(): Promise<{ left: THREE.CanvasTexture; right: THREE.CanvasTexture }> {
  await ensureFonts();
  return { left: drawLeft(), right: drawRight() };
}
