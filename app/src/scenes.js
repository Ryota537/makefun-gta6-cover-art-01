// Procedural "photographs": every scene is painted in code on an offscreen canvas,
// so the app ships no photos at all. A seeded generator keeps each scene identical
// on every run, which is what the deterministic screenshots need.

/** A tiny seeded generator (mulberry32): same seed, same scene, every run. */
export function makeSeededRandom(seed) {
  let state = seed >>> 0;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paints a soft cloud bank from a few pale ellipses. */
function paintClouds(ctx, w, h, rand, tint, top, bottom) {
  ctx.save();
  for (let i = 0; i < 7; i++) {
    const cx = rand() * w;
    const cy = top + rand() * (bottom - top);
    const cw = w * (0.10 + rand() * 0.16);
    const ch = h * (0.012 + rand() * 0.02);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw);
    g.addColorStop(0, tint);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A few distant birds: two short strokes each. */
function paintBirds(ctx, w, h, rand, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, h * 0.003);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const x = w * (0.08 + rand() * 0.8);
    const y = h * (0.08 + rand() * 0.22);
    const s = w * (0.008 + rand() * 0.01);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** A retro striped sun: a glowing disc with sky-coloured slits cut across its lower half. */
function paintStripedSun(ctx, cx, cy, r, core, rim) {
  ctx.save();
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, rim);
  glow.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#fff3b0');
  disc.addColorStop(0.55, core);
  disc.addColorStop(1, '#ff5e7a');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A palm silhouette: a leaning trunk and a crown of drooping fronds. */
function paintPalm(ctx, x, y, size, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + lean * size;
  const topY = y - size;
  ctx.lineWidth = size * 0.07;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * size * 0.3, y - size * 0.55, topX, topY);
  ctx.stroke();
  // Fronds: arcs fanning out from the crown, each drooping at the tip.
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.95) + (i / 6) * Math.PI * 0.9;
    const len = size * (0.42 + (i % 3) * 0.05);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.55 + size * 0.16;
    ctx.lineWidth = size * 0.045;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.55,
      topY + Math.sin(a) * len * 0.4 - size * 0.08,
      ex, ey,
    );
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - size * 0.03, topY + size * 0.05, size * 0.045, 0, Math.PI * 2);
  ctx.arc(topX + size * 0.05, topY + size * 0.06, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** A dark skyline: blocky towers with a scatter of lit windows. */
function paintSkyline(ctx, w, baseY, h, rand, color, windowColor) {
  ctx.save();
  ctx.fillStyle = color;
  let x = -w * 0.02;
  while (x < w * 1.02) {
    const bw = w * (0.05 + rand() * 0.07);
    const bh = h * (0.10 + rand() * 0.30);
    ctx.fillRect(x, baseY - bh, bw, bh);
    // Antenna on some towers.
    if (rand() > 0.6) {
      ctx.fillRect(x + bw / 2 - 1, baseY - bh - h * 0.05, 2, h * 0.05);
    }
    ctx.fillStyle = windowColor;
    for (let wy = baseY - bh + h * 0.02; wy < baseY - h * 0.015; wy += h * 0.035) {
      for (let wx = x + bw * 0.15; wx < x + bw * 0.85; wx += bw * 0.22) {
        if (rand() > 0.55) ctx.fillRect(wx, wy, Math.max(2, bw * 0.06), Math.max(2, h * 0.012));
      }
    }
    ctx.fillStyle = color;
    x += bw + w * 0.008;
  }
  ctx.restore();
}

/** A low convertible silhouette, seen from the side, with a warm rim light. */
function paintConvertible(ctx, x, y, w, body, rim) {
  ctx.save();
  const h = w * 0.30;
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - h * 0.72);
  ctx.lineTo(x + w * 0.55, y - h * 0.78);
  ctx.lineTo(x + w * 0.62, y - h * 1.35);
  ctx.lineTo(x + w * 0.72, y - h * 1.35);
  ctx.lineTo(x + w * 0.80, y - h * 0.78);
  ctx.lineTo(x + w, y - h * 0.72);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  // Glowing windshield and a rim light along the hood and the cabin top.
  ctx.fillStyle = 'rgba(255,154,92,0.85)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.60, y - h * 0.78);
  ctx.lineTo(x + w * 0.645, y - h * 1.28);
  ctx.lineTo(x + w * 0.705, y - h * 1.28);
  ctx.lineTo(x + w * 0.735, y - h * 0.78);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(2, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(x, y - h * 0.72);
  ctx.lineTo(x + w * 0.55, y - h * 0.78);
  ctx.moveTo(x + w * 0.62, y - h * 1.35);
  ctx.lineTo(x + w * 0.72, y - h * 1.35);
  ctx.stroke();
  // Wheels.
  ctx.fillStyle = '#12081f';
  for (const wx of [x + w * 0.22, x + w * 0.80]) {
    ctx.beginPath();
    ctx.arc(wx, y, w * 0.085, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b52';
    ctx.beginPath();
    ctx.arc(wx, y, w * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#12081f';
  }
  ctx.restore();
}

/** Scene 1 — "Boulevard": a striped sun setting over a palm-lined beach boulevard. */
function paintBoulevard(ctx, w, h, rand) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, '#2a1052');
  sky.addColorStop(0.35, '#8a2a6d');
  sky.addColorStop(0.62, '#ff6a4d');
  sky.addColorStop(1, '#ffb347');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.62);
  paintStripedSun(ctx, w * 0.5, h * 0.44, h * 0.17, '#ff9a3c', 'rgba(255,150,60,0.55)');
  // Cut the sun's slits with the horizon colour so the stripes read as sky.
  ctx.save();
  ctx.fillStyle = '#ff8a4d';
  for (let i = 0; i < 5; i++) {
    const sy = h * 0.44 + h * 0.02 + i * h * 0.028;
    ctx.fillRect(w * 0.5 - h * 0.17, sy, h * 0.34, h * (0.006 + i * 0.003));
  }
  ctx.restore();
  paintClouds(ctx, w, h, rand, 'rgba(255,180,150,0.35)', h * 0.06, h * 0.30);
  paintBirds(ctx, w, h, rand, 'rgba(40,14,60,0.85)');
  paintSkyline(ctx, w, h * 0.62, h, rand, '#34184e', 'rgba(255,190,90,0.85)');
  // Road: a dark band with perspective dashes, palms leaning in from both sides.
  const road = ctx.createLinearGradient(0, h * 0.62, 0, h);
  road.addColorStop(0, '#4a2358');
  road.addColorStop(1, '#160a24');
  ctx.fillStyle = road;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);
  ctx.fillStyle = 'rgba(255,200,120,0.75)';
  for (let i = 0; i < 4; i++) {
    const ry = h * (0.68 + i * 0.09);
    const rw = w * (0.012 + i * 0.012);
    ctx.fillRect(w * 0.5 - rw / 2, ry, rw, h * 0.018);
  }
  paintPalm(ctx, w * 0.06, h * 0.66, h * 0.30, 0.18, '#1c0b33');
  paintPalm(ctx, w * 0.94, h * 0.64, h * 0.26, -0.20, '#1c0b33');
  paintPalm(ctx, w * 0.16, h * 0.70, h * 0.20, 0.12, '#241040');
  paintConvertible(ctx, w * 0.30, h * 0.86, w * 0.42, '#1c0b33', '#ff8a5c');
}

/** Scene 2 — "Neon Street": a rainy night street, neon signs, wet reflections. */
function paintNeonStreet(ctx, w, h, rand) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#070b26');
  sky.addColorStop(0.55, '#141038');
  sky.addColorStop(1, '#2a1048');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  paintClouds(ctx, w, h, rand, 'rgba(120,90,200,0.20)', h * 0.04, h * 0.22);
  // Buildings left and right, leaving a street canyon down the middle.
  ctx.fillStyle = '#0d0a24';
  ctx.fillRect(0, 0, w * 0.30, h * 0.72);
  ctx.fillRect(w * 0.70, 0, w * 0.30, h * 0.78);
  ctx.fillStyle = '#151036';
  ctx.fillRect(w * 0.30, h * 0.18, w * 0.12, h * 0.54);
  ctx.fillRect(w * 0.58, h * 0.12, w * 0.12, h * 0.60);
  // Lit windows.
  for (let i = 0; i < 46; i++) {
    const side = rand() > 0.5 ? 0 : w * 0.70;
    const wx = side + rand() * w * 0.26;
    const wy = rand() * h * 0.66;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,214,120,0.8)' : 'rgba(120,220,255,0.7)';
    ctx.fillRect(wx, wy, w * 0.02, h * 0.02);
  }
  // Neon signs with glow, kept near the third-lines so even a portrait crop shows them whole.
  const signs = [
    { x: w * 0.21, y: h * 0.16, t: 'HOTEL', c: '#ff4da6' },
    { x: w * 0.57, y: h * 0.18, t: 'DINER', c: '#2ee6ff' },
    { x: w * 0.21, y: h * 0.42, t: '24 HR', c: '#ffe14d' },
    { x: w * 0.57, y: h * 0.44, t: 'PIER 9', c: '#7dff6a' },
  ];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const s of signs) {
    ctx.save();
    ctx.font = `900 ${Math.round(h * 0.05)}px 'Arial Black', Impact, sans-serif`;
    ctx.shadowColor = s.c;
    ctx.shadowBlur = h * 0.03;
    ctx.fillStyle = s.c;
    ctx.fillText(s.t, s.x + w * 0.11, s.y);
    ctx.shadowBlur = h * 0.012;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(s.t, s.x + w * 0.11, s.y);
    ctx.restore();
  }
  // Wet pavement: dark street with stretched neon reflections.
  const street = ctx.createLinearGradient(0, h * 0.70, 0, h);
  street.addColorStop(0, '#171233');
  street.addColorStop(1, '#05030f');
  ctx.fillStyle = street;
  ctx.fillRect(0, h * 0.70, w, h * 0.30);
  for (let i = 0; i < 26; i++) {
    const rx = w * (0.06 + rand() * 0.88);
    const rh = h * (0.04 + rand() * 0.16);
    const cols = ['rgba(255,77,166,0.5)', 'rgba(46,230,255,0.5)', 'rgba(255,225,77,0.4)'];
    ctx.fillStyle = cols[Math.floor(rand() * cols.length)];
    ctx.fillRect(rx, h * 0.72 + rand() * h * 0.05, w * 0.012, rh);
  }
  paintPalm(ctx, w * 0.33, h * 0.74, h * 0.24, 0.10, '#08041a');
  paintPalm(ctx, w * 0.66, h * 0.76, h * 0.22, -0.10, '#08041a');
}

/** Scene 3 — "Pier": a low sun over the sea, a wooden pier, a lone angler. */
function paintPier(ctx, w, h, rand) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.58);
  sky.addColorStop(0, '#0e3a5c');
  sky.addColorStop(0.45, '#2a7a8c');
  sky.addColorStop(0.75, '#ff9a5c');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.58);
  // Low sun with a glitter path on the water.
  const sx = w * 0.62;
  const sy = h * 0.52;
  const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, h * 0.30);
  glow.addColorStop(0, 'rgba(255,220,140,0.9)');
  glow.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - h * 0.3, sy - h * 0.3, h * 0.6, h * 0.6);
  ctx.fillStyle = '#fff0b8';
  ctx.beginPath();
  ctx.arc(sx, sy, h * 0.075, 0, Math.PI * 2);
  ctx.fill();
  paintClouds(ctx, w, h, rand, 'rgba(255,200,160,0.30)', h * 0.05, h * 0.28);
  paintBirds(ctx, w, h, rand, 'rgba(20,30,60,0.8)');
  // Sea with shimmer strokes.
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h);
  sea.addColorStop(0, '#c96a4a');
  sea.addColorStop(0.25, '#2a6a7a');
  sea.addColorStop(1, '#0a2e44');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  for (let i = 0; i < 60; i++) {
    const yy = h * (0.60 + rand() * 0.36);
    const xx = w * rand();
    const len = w * (0.02 + rand() * 0.09);
    ctx.fillStyle = rand() > 0.4 ? 'rgba(255,220,150,0.28)' : 'rgba(180,240,255,0.20)';
    ctx.fillRect(xx, yy, len, Math.max(1.5, h * 0.003));
  }
  // Pier planks in perspective, from the bottom edge to the horizon.
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h);
  ctx.lineTo(w * 0.44, h * 0.60);
  ctx.lineTo(w * 0.56, h * 0.60);
  ctx.lineTo(w * 0.72, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,140,0.35)';
  ctx.lineWidth = Math.max(1.5, h * 0.002);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const y = h * (0.60 + 0.40 * t * t + 0.40 * t * 0.4);
    const xl = w * (0.44 - 0.16 * (1 - t));
    const xr = w * (0.56 + 0.16 * (1 - t));
    ctx.beginPath();
    ctx.moveTo(xl, y);
    ctx.lineTo(xr, y);
    ctx.stroke();
  }
  // The angler: a small silhouette at the pier's end, rod bent toward the water.
  const ax = w * 0.50;
  const ay = h * 0.585;
  ctx.strokeStyle = '#160d08';
  ctx.fillStyle = '#160d08';
  ctx.lineWidth = h * 0.008;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(ax, ay - h * 0.055, h * 0.012, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ax, ay - h * 0.043);
  ctx.lineTo(ax, ay - h * 0.005);
  ctx.moveTo(ax, ay - h * 0.005);
  ctx.lineTo(ax - h * 0.012, ay + h * 0.028);
  ctx.moveTo(ax, ay - h * 0.005);
  ctx.lineTo(ax + h * 0.014, ay + h * 0.028);
  ctx.stroke();
  ctx.lineWidth = h * 0.004;
  ctx.beginPath();
  ctx.moveTo(ax + h * 0.008, ay - h * 0.030);
  ctx.quadraticCurveTo(ax + h * 0.09, ay - h * 0.06, ax + h * 0.13, ay + h * 0.02);
  ctx.stroke();
}

export const SCENES = [
  { id: 'boulevard', name: 'Boulevard', seed: 101, paint: paintBoulevard },
  { id: 'neon', name: 'Neon Street', seed: 202, paint: paintNeonStreet },
  { id: 'pier', name: 'Pier', seed: 303, paint: paintPier },
];

/** Paints a scene onto a fresh canvas of the given size and returns it. */
export function paintSceneCanvas(sceneId, width, height) {
  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  scene.paint(ctx, width, height, makeSeededRandom(scene.seed));
  return canvas;
}
