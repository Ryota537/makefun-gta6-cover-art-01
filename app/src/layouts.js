// Panel layouts: each one cuts the cover into framed panels, in 0..1 coordinates.
// The caption is lettered over the bottom of the cover in every layout.

export const LAYOUTS = [
  {
    id: 'hero',
    name: 'Hero + Two',
    hint: 'One big panel, two small',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.60 },
      { x: 0, y: 0.60, w: 0.5, h: 0.40 },
      { x: 0.5, y: 0.60, w: 0.5, h: 0.40 },
    ],
  },
  {
    id: 'grid',
    name: 'Grid 2 x 2',
    hint: 'Four equal panels',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  {
    id: 'strip',
    name: 'Tall Strip',
    hint: 'One tall panel, two beside it',
    panels: [
      { x: 0, y: 0, w: 0.56, h: 1 },
      { x: 0.56, y: 0, w: 0.44, h: 0.5 },
      { x: 0.56, y: 0.5, w: 0.44, h: 0.5 },
    ],
  },
  {
    id: 'full',
    name: 'Full Bleed',
    hint: 'One photo, edge to edge',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
];

/** Looks a layout up by id, falling back to the first one. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** The post sizes the app exports, in pixels. */
export const EXPORT_SIZES = [
  { id: '1080x1080', label: 'Square · 1080 x 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait · 1080 x 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide · 1920 x 1080', w: 1920, h: 1080 },
];

/** Looks an export size up by id, falling back to the square. */
export function sizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}
