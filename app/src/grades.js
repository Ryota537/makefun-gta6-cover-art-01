// Colour grades: each one is a wash of sunset or neon light laid over the panels,
// plus the lettering palette the caption wears with it. Names are the studio's own.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    swatch: ['#ffb347', '#ff6a4d', '#c22a72'],
    washTop: 'rgba(255,170,80,0.00)',
    washBottom: 'rgba(255,60,110,0.42)',
    washBlend: 'soft-light',
    tint: '#ff8a3c',
    tintAlpha: 0.10,
    vignette: 0.26,
    title: ['#ffe259', '#ff9a3c', '#ff2e88'],
    subtitle: '#7df3ff',
    subtitleGlow: '#19c8ff',
  },
  {
    id: 'neon',
    name: 'Neon Night',
    swatch: ['#ff2ea6', '#7b2fff', '#00e5ff'],
    washTop: 'rgba(255,46,166,0.10)',
    washBottom: 'rgba(0,229,255,0.34)',
    washBlend: 'overlay',
    tint: '#19e3ff',
    tintAlpha: 0.08,
    vignette: 0.34,
    title: ['#fff3a6', '#ff5ea8', '#19e3ff'],
    subtitle: '#ffe14d',
    subtitleGlow: '#ff2ea6',
  },
  {
    id: 'dusk',
    name: 'Palm Dusk',
    swatch: ['#7b2fff', '#c22a72', '#00b3a6'],
    washTop: 'rgba(123,47,255,0.14)',
    washBottom: 'rgba(0,179,166,0.30)',
    washBlend: 'soft-light',
    tint: '#8a5cff',
    tintAlpha: 0.09,
    vignette: 0.30,
    title: ['#ffd76e', '#ff7ab8', '#7bffde'],
    subtitle: '#ffb347',
    subtitleGlow: '#ff5ea8',
  },
  {
    id: 'vice',
    name: 'Vice Glow',
    swatch: ['#ff5ea8', '#ff2e88', '#19e3ff'],
    washTop: 'rgba(255,94,168,0.16)',
    washBottom: 'rgba(25,227,255,0.38)',
    washBlend: 'overlay',
    tint: '#ff5ea8',
    tintAlpha: 0.10,
    vignette: 0.36,
    title: ['#fff8a6', '#ff6ec7', '#ff2e88'],
    subtitle: '#7dff6a',
    subtitleGlow: '#19e3ff',
  },
];

/** Looks a grade up by id, falling back to the first one. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}
