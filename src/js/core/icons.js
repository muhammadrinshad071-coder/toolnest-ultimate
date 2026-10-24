/**
 * In-house stroke icon set (24×24 grid, 1.8px stroke, currentColor).
 * Shared by the build script (static HTML) and the browser.
 */
const paths = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  star: '<path d="m12 3.2 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.2l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>',
  download: '<path d="M12 3.5v11.5M7 10l5 5 5-5M5 20.5h14"/>',
  upload: '<path d="M12 20.5V9M7 14l5-5 5 5M5 3.5h14"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13"/>',
  eraser: '<path d="m7 21-4-4L14 6l6 6-9 9z"/><path d="M7 21h13M9 11l6 6"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  home: '<path d="m3 11 9-7.5 9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  book: '<path d="M5 19V5.5A2.5 2.5 0 0 1 7.5 3H19v14H7.5A2.5 2.5 0 0 0 5 19.5 2.5 2.5 0 0 0 7.5 22H19v-5"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  sparkle: '<path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2z"/>',
  trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  wifiOff: '<path d="M2 8.5a15 15 0 0 1 4.5-2.8M10 5.1A15 15 0 0 1 22 8.5M5 12a10 10 0 0 1 4-2.2M15 10a10 10 0 0 1 4 2M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M3 3l18 18"/>',
  // Category icons
  type: '<path d="M4 7V4.5h16V7M12 4.5v15M8.5 19.5h7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="9.5" r="2"/><path d="m21 15.5-5-5-11 9.5"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
  sigma: '<path d="M18 5H6l6.5 7L6 19h12"/>',
  code: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  droplet: '<path d="M12 3s6.5 6.5 6.5 11a6.5 6.5 0 0 1-13 0C5.5 9.5 12 3 12 3z"/>',
  shield: '<path d="M12 3 4.5 6v6c0 4.8 3.3 7.9 7.5 9 4.2-1.1 7.5-4.2 7.5-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  hash: '<path d="M5 9h15M4 15h15M10.5 3.5 8.5 20.5M15.5 3.5l-2 17"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><path d="M4 7.5v10A2.5 2.5 0 0 0 6.5 20H20V8H6.5A2.5 2.5 0 0 1 4 5.5"/><path d="M16.5 14h.01"/>',
  'check-square': '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  film: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  // Tool icons
  letters: '<path d="M3.5 18 7.5 6l4 12M5 14h5"/><path d="M15 9h5.5M15 13h5.5M15 17h3.5"/>',
  case: '<path d="M3 18 7.5 6 12 18M4.7 14h5.6"/><circle cx="17.5" cy="15" r="3"/><path d="M20.5 12v6"/>',
  dedupe: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8M12 14.5h5"/>',
  sort: '<path d="M7 4v16M3.5 16.5 7 20l3.5-3.5"/><path d="M13.5 6H21M13.5 12H19M13.5 18h3.5"/>',
  replace: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
  diff: '<rect x="3" y="3.5" width="8" height="17" rx="2"/><rect x="13" y="3.5" width="8" height="17" rx="2"/><path d="M5.5 12h3M15.5 12h3M17 10.5v3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  pilcrow: '<path d="M13 4v16M17 4v16M19.5 4H9.5a4.5 4.5 0 0 0 0 9H13"/>',
  markdown: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M6 15V9l2.5 3L11 9v6M16 9v6M13.5 12.5 16 15l2.5-2.5"/>',
  wand: '<path d="m3.5 20.5 10-10M15 3v2.5M13.75 4.25h2.5M19.5 7.5V10M18.25 8.75h2.5M19 15v2M18 16h2"/><path d="m12 9 3 3"/>',
  brackets: '<path d="M8 4H5v16h3M16 4h3v16h-3"/><path d="M9.5 12h5"/>',
  listOrdered: '<path d="M10 6h11M10 12h11M10 18h11M4 5h1.5v4.5M3.8 9.5h3.4M6.5 19.5H4c0-1.4 2.5-2 2.5-3.4 0-.8-.6-1.3-1.3-1.3-.6 0-1.1.3-1.3.8"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  textHtml: '<path d="M3 6h7M6.5 6v12"/><path d="m15.5 8.5-3 3.5 3 3.5M19 8.5l3 3.5-3 3.5"/>',
  calculator: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  divide: '<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.6"/><circle cx="12" cy="17.5" r="1.6"/>',
  ratio: '<path d="M5 5v14M19 5v14"/><circle cx="12" cy="8.5" r="1.4"/><circle cx="12" cy="15.5" r="1.4"/>',
  chart: '<path d="M3 20.5h18M6.5 20.5v-6M11 20.5v-11M15.5 20.5v-8M20 20.5V5"/>',
  prime: '<path d="M8 20V4h5.5a4.5 4.5 0 0 1 0 9H8"/><path d="M18 3.5 17 7.5"/>',
  venn: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
  factorial: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M12 7.5v6M12 16.5v.5"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01"/>',
  binary: '<path d="M6 4v6M4.5 4H6M18 4v6M16.5 4H18M12 14v6M10.5 14H12"/><rect x="10" y="4" width="4" height="6" rx="2"/><rect x="4" y="14" width="4" height="6" rx="2"/><rect x="16" y="14" width="4" height="6" rx="2"/>',
  roman: '<path d="M4 5h16M4 19h16M8 5v14M12 5v14M16 5v14"/>',
  ruler: '<rect x="2.5" y="7.5" width="19" height="9" rx="1.5"/><path d="M6.5 7.5v3M10.5 7.5v4M14.5 7.5v3M18.5 7.5v4"/>',
  braces: '<path d="M8 4H7a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h1M16 4h1a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-1"/>',
  encode: '<path d="M4 7h7M4 12h10M4 17h6"/><path d="m15 14 3 3 3-3M18 17V7"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14.5 10h4M14.5 13.5h3"/>',
  key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.2 11.8 8.3-8.3M16.5 6.5 19 9M14 9l2 2"/>',
  regex: '<path d="M17 3v10M12.7 5.5l8.6 5M12.7 10.5l8.6-5"/><rect x="3" y="15" width="6" height="6" rx="1"/>'
};

export function iconSvg(name, { size = 20, className = 'icon', label } = {}) {
  const body = paths[name] || paths.grid;
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="${className}" ${a11y} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** The ToolNest mark: three nested arcs (a nest) holding a spark. */
export function logoSvg(size = 32) {
  return `<svg class="logo-mark" aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 32 32"><defs><linearGradient id="tn-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--brand-a)"/><stop offset="1" stop-color="var(--brand-b)"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#tn-g)"/><g fill="none" stroke="#fff" stroke-linecap="round" stroke-width="2.2"><path d="M7 15.5a9 9 0 0 0 18 0"/><path d="M10.5 15.5a5.5 5.5 0 0 0 11 0" opacity=".8"/></g><circle cx="16" cy="10" r="2.6" fill="#fff"/></svg>`;
}

export const iconNames = Object.keys(paths);
