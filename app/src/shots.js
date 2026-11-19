// Fixed scenes for screenshots: ?shot=editor shows the studio with a scene loaded;
// ?shot=cover shows the cover alone, full frame. The query also picks the layout,
// grade, caption, subtitle, export size and the scene in each panel, so every
// screenshot is reproducible from its URL alone. window.__shotReady is set once
// the cover has been painted.

/** Reads a shot scene out of the page's query string. */
export function parseShotQuery(query) {
  const scenes = (query.get('scene') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    shot: query.get('shot'),
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    caption: query.get('caption') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    size: query.get('size') ?? undefined,
    scenes,
  };
}

/** Marks the scene ready for a screenshot, after the paint has landed. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
