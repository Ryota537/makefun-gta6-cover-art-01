// Sunset Panel Studio: wires the editor. Pick a layout and a grade, fill each panel
// with a painted scene or your own photo (cropped and positioned per panel), letter
// the caption, and export the cover as a PNG. A `?shot=` query sets up a fixed
// scene for a screenshot instead (./shots.js). Nothing leaves the machine: photos
// are read with FileReader and the app makes no network request.

import { drawCover } from './cover.js';
import { SCENES, paintSceneCanvas } from './scenes.js';
import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById, EXPORT_SIZES, sizeById } from './layouts.js';
import { parseShotQuery, markShotReady } from './shots.js';

const preview = document.getElementById('preview');
const status = document.getElementById('status');
const panelList = document.getElementById('panels');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const fillAllBox = document.getElementById('fillAll');

const PANEL_ROLES = {
  hero: ['Hero', 'Bottom left', 'Bottom right'],
  grid: ['Top left', 'Top right', 'Bottom left', 'Bottom right'],
  strip: ['Tall panel', 'Top right', 'Bottom right'],
  full: ['Full cover'],
};

const state = {
  layoutId: 'hero',
  gradeId: 'sunset',
  caption: 'SUNSET HEIST',
  subtitle: 'NEON COAST',
  sizeId: '1080x1080',
  fillAll: false,
  panels: [
    { scene: 'boulevard', image: null, zoom: 1, ox: 0, oy: 0 },
    { scene: 'neon', image: null, zoom: 1, ox: 0, oy: 0 },
    { scene: 'pier', image: null, zoom: 1, ox: 0, oy: 0 },
    { scene: 'boulevard', image: null, zoom: 1, ox: 0, oy: 0 },
  ],
};

const sceneCache = new Map();

/** Returns the painted scene canvas for an id, painting it once and caching it. */
function sceneCanvas(sceneId) {
  if (!sceneCache.has(sceneId)) sceneCache.set(sceneId, paintSceneCanvas(sceneId, 1200, 900));
  return sceneCache.get(sceneId);
}

/** The picture a panel shows: its uploaded photo, or its painted scene. */
function panelSource(index) {
  const panel = state.panels[index];
  if (state.fillAll && index > 0) return panelSource(0);
  return panel.image ?? sceneCanvas(panel.scene);
}

/** The cover the renderer draws, resolved from the editor state. */
function currentCover() {
  const layout = layoutById(state.layoutId);
  return {
    layout,
    grade: gradeById(state.gradeId),
    caption: state.caption,
    subtitle: state.subtitle,
    panels: layout.panels.map((_, i) => {
      const panel = state.fillAll && i > 0 ? state.panels[0] : state.panels[i];
      return { source: panelSource(i), zoom: panel.zoom, ox: panel.ox, oy: panel.oy };
    }),
  };
}

/** Repaints the preview at the chosen export size. */
function redraw() {
  const size = sizeById(state.sizeId);
  preview.width = size.w;
  preview.height = size.h;
  preview.style.aspectRatio = `${size.w} / ${size.h}`;
  drawCover(preview, currentCover());
}

/** Loads an image from a data URL, resolving once it can be drawn. */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Builds one slider row (label, range input, value readout) for a panel card. */
function sliderRow(label, min, max, step, value, onInput) {
  const row = el('div', 'slider-row');
  const lab = el('label', '', label);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const readout = el('span', 'slider-value', value.toFixed(2));
  input.addEventListener('input', () => {
    const v = Number(input.value);
    readout.textContent = v.toFixed(2);
    onInput(v);
  });
  row.append(lab, input, readout);
  return row;
}

/** Rebuilds the per-panel cards for the current layout. */
function buildPanelCards() {
  const layout = layoutById(state.layoutId);
  const roles = PANEL_ROLES[state.layoutId] ?? layout.panels.map((_, i) => `Panel ${i + 1}`);
  panelList.replaceChildren();
  layout.panels.forEach((_, i) => {
    const panel = state.panels[i];
    const card = el('article', 'panel-card');
    card.append(el('h3', '', `Panel ${i + 1} · ${roles[i]}`));

    const sceneRow = el('div', 'scene-row');
    for (const scene of SCENES) {
      const btn = el('button', `scene-btn${panel.scene === scene.id && !panel.image ? ' active' : ''}`, scene.name);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        panel.image = null;
        panel.scene = scene.id;
        buildPanelCards();
        redraw();
      });
      sceneRow.append(btn);
    }
    card.append(sceneRow);

    const uploadLabel = el('label', 'upload-label', panel.image ? 'Photo loaded — replace it' : 'Upload your photo');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      const url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      panel.image = await loadImage(url);
      status.textContent = `Loaded ${file.name} into panel ${i + 1}.`;
      buildPanelCards();
      redraw();
    });
    uploadLabel.append(fileInput);
    card.append(uploadLabel);

    card.append(sliderRow('Zoom', 1, 2.5, 0.01, panel.zoom, (v) => { panel.zoom = v; redraw(); }));
    card.append(sliderRow('Shift left–right', -0.35, 0.35, 0.01, panel.ox, (v) => { panel.ox = v; redraw(); }));
    card.append(sliderRow('Shift up–down', -0.35, 0.35, 0.01, panel.oy, (v) => { panel.oy = v; redraw(); }));
    panelList.append(card);
  });
}

/** Builds a row of toggle buttons from a list of {id, name, hint?, swatch?}. */
function buildToggles(containerId, items, currentId, onPick, renderButton) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  for (const item of items) {
    const btn = renderButton(item);
    btn.type = 'button';
    btn.classList.toggle('active', item.id === currentId);
    btn.addEventListener('click', () => {
      onPick(item.id);
      buildToggles(containerId, items, item.id, onPick, renderButton);
      redraw();
    });
    container.append(btn);
  }
}

function layoutButton(layout) {
  const btn = el('button', 'toggle-btn');
  btn.append(el('span', 'toggle-name', layout.name));
  btn.append(el('span', 'toggle-hint', layout.hint));
  return btn;
}

function gradeButton(grade) {
  const btn = el('button', 'toggle-btn grade-btn');
  const swatch = el('span', 'grade-swatch');
  swatch.style.background = `linear-gradient(135deg, ${grade.swatch.join(', ')})`;
  btn.append(swatch, el('span', 'toggle-name', grade.name));
  return btn;
}

function sizeButton(size) {
  const btn = el('button', 'toggle-btn');
  btn.append(el('span', 'toggle-name', size.label));
  return btn;
}

/** (Re)builds the layout, grade and size toggle rows from the current state. */
function buildAllToggles() {
  buildToggles('layouts', LAYOUTS, state.layoutId, (id) => {
    state.layoutId = id;
    buildPanelCards();
  }, layoutButton);
  buildToggles('grades', GRADES, state.gradeId, (id) => { state.gradeId = id; }, gradeButton);
  buildToggles('sizes', EXPORT_SIZES, state.sizeId, (id) => { state.sizeId = id; }, sizeButton);
}

buildAllToggles();

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
fillAllBox.addEventListener('change', () => {
  state.fillAll = fillAllBox.checked;
  status.textContent = state.fillAll
    ? 'One photo fills every panel.'
    : 'Each panel keeps its own photo.';
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  const size = sizeById(state.sizeId);
  const name = `sunset-panel-studio-${size.w}x${size.h}.png`;
  preview.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved ${name} — ${size.w} x ${size.h} PNG.`;
  }, 'image/png');
});

document.getElementById('sampleAll').addEventListener('click', () => {
  const ids = SCENES.map((s) => s.id);
  state.panels.forEach((panel, i) => {
    panel.image = null;
    panel.scene = ids[i % ids.length];
  });
  buildPanelCards();
  redraw();
  status.textContent = 'Filled every panel with a painted scene.';
});

// A `?shot=` query sets up a fixed scene for a screenshot instead of the editor.
const query = new URLSearchParams(location.search);
const shot = parseShotQuery(query);
if (shot.shot) {
  if (shot.layout) state.layoutId = shot.layout;
  if (shot.grade) state.gradeId = shot.grade;
  if (shot.caption !== undefined) { state.caption = shot.caption; captionInput.value = shot.caption; }
  if (shot.subtitle !== undefined) { state.subtitle = shot.subtitle; subtitleInput.value = shot.subtitle; }
  if (shot.size) state.sizeId = shot.size;
  shot.scenes.forEach((sceneId, i) => {
    if (state.panels[i]) {
      state.panels[i].scene = sceneId;
      state.panels[i].image = null;
    }
  });
  if (shot.shot === 'cover') document.body.classList.add('shot-cover');
  buildAllToggles();
  buildPanelCards();
  redraw();
  markShotReady();
} else {
  buildPanelCards();
  redraw();
}
