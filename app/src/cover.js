// The cover renderer: panels, grade wash, caption lettering, grain and vignette.
// Everything is drawn on a 2D canvas, so the preview and the exported PNG are the
// same drawing, at whatever size the cover is asked for.

import { makeSeededRandom } from './scenes.js';

let grainTile = null;

/** A small tiled noise canvas, seeded so the grain is identical on every run. */
function getGrainTile() {
  if (grainTile) return grainTile;
  const rand = makeSeededRandom(777);
  grainTile = document.createElement('canvas');
  grainTile.width = 140;
  grainTile.height = 140;
  const gtx = grainTile.getContext('2d');
  const img = gtx.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gtx.putImageData(img, 0, 0);
  return grainTile;
}

/** Draws one panel's picture cover-fit, then zoomed and shifted by its crop. */
function drawPanelPicture(ctx, px, py, pw, ph, source, zoom, ox, oy) {
  const sw = source.naturalWidth ?? source.width;
  const sh = source.naturalHeight ?? source.height;
  const base = Math.max(pw / sw, ph / sh) * zoom;
  const dw = sw * base;
  const dh = sh * base;
  const dx = px + (pw - dw) / 2 + ox * pw;
  const dy = py + (ph - dh) / 2 + oy * ph;
  ctx.drawImage(source, dx, dy, dw, dh);
}

/** Lays a grade's wash and tint over a panel, then a soft vignette. */
function washPanel(ctx, px, py, pw, ph, grade) {
  const wash = ctx.createLinearGradient(0, py, 0, py + ph);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.save();
  ctx.globalCompositeOperation = grade.washBlend;
  ctx.fillStyle = wash;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
}

/** Splits a caption into at most two lines that fit the width. */
function wrapCaption(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [''];
  for (const word of words) {
    const trial = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !lines[lines.length - 1]) {
      lines[lines.length - 1] = trial;
    } else if (lines.length < 2) {
      lines.push(word);
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
    }
  }
  return lines.filter(Boolean);
}

/** The big title: gradient-filled capitals with a heavy outline and a drop shadow. */
function drawTitle(ctx, w, h, grade, caption) {
  const text = caption.trim().toUpperCase();
  if (!text) return;
  const maxWidth = w * 0.88;
  const fontFor = (size) => `900 ${size}px 'Arial Black', Impact, 'Helvetica Neue', sans-serif`;
  let size = Math.round(h * 0.105);
  ctx.font = fontFor(size);
  let lines = wrapCaption(ctx, text, maxWidth);
  while ((lines.length > 2 || (lines.length && ctx.measureText(lines[0]).width > maxWidth)) && size > 18) {
    size -= 4;
    ctx.font = fontFor(size);
    lines = wrapCaption(ctx, text, maxWidth);
  }
  if (!lines.length) return;
  const lineHeight = size * 1.02;
  const blockH = lines.length * lineHeight;
  const top = h - h * 0.175 - blockH;
  const grad = ctx.createLinearGradient(0, top, 0, top + blockH);
  grad.addColorStop(0, grade.title[0]);
  grad.addColorStop(0.55, grade.title[1]);
  grad.addColorStop(1, grade.title[2]);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fontFor(size);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  lines.forEach((line, i) => {
    const y = top + lineHeight * (i + 0.92);
    ctx.shadowColor = 'rgba(10,4,24,0.85)';
    ctx.shadowBlur = size * 0.22;
    ctx.shadowOffsetY = size * 0.06;
    ctx.fillStyle = '#160a24';
    ctx.fillText(line, w / 2, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = size * 0.16;
    ctx.strokeStyle = '#160a24';
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = grad;
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();
  return top;
}

/** The subtitle: small, wide-tracked, glowing neon capitals under the title. */
function drawSubtitle(ctx, w, h, grade, subtitle, titleTop) {
  const text = subtitle.trim().toUpperCase();
  if (!text) return;
  const size = Math.round(h * 0.028);
  ctx.save();
  ctx.font = `italic 800 ${size}px 'Arial Black', Impact, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(size * 0.42)}px`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const y = (titleTop ?? h - h * 0.20) - size * 0.9;
  ctx.shadowColor = grade.subtitleGlow;
  ctx.shadowBlur = size * 0.9;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(text, w / 2, y);
  ctx.fillText(text, w / 2, y);
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (which must already be the export size).
 * `cover` is { layout, grade, caption, subtitle, panels }, where each panel is
 * { source, zoom, ox, oy } and source is an image or canvas to draw.
 */
export function drawCover(canvas, cover) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const { layout, grade } = cover;

  // White print frame, then the panels tiled inside it with white gutters.
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(0, 0, w, h);
  const frame = Math.round(w * 0.016);
  const gutter = Math.max(2, Math.round(w * 0.011));
  const ix = frame;
  const iy = frame;
  const iw = w - frame * 2;
  const ih = h - frame * 2;

  for (let i = 0; i < layout.panels.length; i++) {
    const r = layout.panels[i];
    const panel = cover.panels[i];
    if (!panel || !panel.source) continue;
    const px = ix + r.x * iw + (r.x > 0 ? gutter / 2 : 0);
    const py = iy + r.y * ih + (r.y > 0 ? gutter / 2 : 0);
    const pw = r.w * iw - (r.x > 0 ? gutter / 2 : 0) - (r.x + r.w < 1 ? gutter / 2 : 0);
    const ph = r.h * ih - (r.y > 0 ? gutter / 2 : 0) - (r.y + r.h < 1 ? gutter / 2 : 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    drawPanelPicture(ctx, px, py, pw, ph, panel.source, panel.zoom, panel.ox, panel.oy);
    washPanel(ctx, px, py, pw, ph, grade);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(22,10,36,0.28)';
    ctx.lineWidth = Math.max(1, w * 0.0016);
    ctx.strokeRect(px, py, pw, ph);
    ctx.restore();
  }

  // Bottom scrim the lettering sits on.
  const scrim = ctx.createLinearGradient(0, h * 0.52, 0, h);
  scrim.addColorStop(0, 'rgba(12,6,24,0)');
  scrim.addColorStop(0.55, 'rgba(12,6,24,0.55)');
  scrim.addColorStop(1, 'rgba(12,6,24,0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(frame, h * 0.52, w - frame * 2, h * 0.48 - frame);

  // Halftone dots fading up out of the scrim.
  const dotGap = Math.max(10, Math.round(w * 0.016));
  ctx.save();
  for (let y = h * 0.56; y < h * 0.72; y += dotGap) {
    const fade = 1 - (y - h * 0.56) / (h * 0.16);
    ctx.fillStyle = `rgba(255,255,255,${(0.10 * fade).toFixed(3)})`;
    for (let x = frame + dotGap / 2; x < w - frame; x += dotGap) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, w * 0.0016), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Vignette, then the lettering on top of everything.
  const vig = ctx.createRadialGradient(
    w / 2, h * 0.42, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(10,5,25,0)');
  vig.addColorStop(1, `rgba(10,5,25,${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  const titleTop = drawTitle(ctx, w, h, grade, cover.caption);
  drawSubtitle(ctx, w, h, grade, cover.subtitle, titleTop);

  // Grain over the whole print.
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(getGrainTile(), 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Tiny studio credit along the foot, in dark ink on the white print frame.
  ctx.save();
  ctx.font = `700 ${Math.max(11, Math.round(h * 0.011))}px system-ui, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(40,20,60,0.60)';
  ctx.fillText('MADE WITH SUNSET PANEL STUDIO · OFFLINE · NO UPLOAD', w / 2, h - frame * 0.45);
  ctx.restore();
}

/** Renders a cover at the given size on a fresh canvas and returns it. */
export function renderCoverCanvas(width, height, cover) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCover(canvas, cover);
  return canvas;
}
