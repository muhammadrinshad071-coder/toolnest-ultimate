/**
 * Colour parsing and conversion: HEX, RGB, HSL, HSV, HWB, CMYK and OKLCH,
 * plus WCAG contrast. Colours are held as sRGB channels 0–255 (floats)
 * and alpha 0–1.
 */

const NAMED_LIST = 'aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32';

export const NAMED_COLORS = new Map();
{
  const parts = NAMED_LIST.split(' ');
  for (let i = 0; i < parts.length; i += 2) NAMED_COLORS.set(parts[i], parts[i + 1]);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, d = 0) => Number(v.toFixed(d));

/* ---------- conversions ---------- */

export function rgbToHsl({ r, g, b }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }) {
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  const f = (n) => {
    const k = (n + ((h % 360) + 360) % 360 / 30) % 12;
    return 255 * (L - S * Math.min(L, 1 - L) * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return { r: f(0), g: f(8), b: f(4) };
}

export function rgbToHsv({ r, g, b }) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const { h } = rgbToHsl({ r, g, b });
  return { h, s: max ? ((max - min) / max) * 100 : 0, v: max * 100 };
}

export function rgbToHwb(rgb) {
  const { h } = rgbToHsl(rgb);
  return { h, w: (Math.min(rgb.r, rgb.g, rgb.b) / 255) * 100, b: (1 - Math.max(rgb.r, rgb.g, rgb.b) / 255) * 100 };
}

export function hwbToRgb({ h, w, b }) {
  let W = clamp(w, 0, 100) / 100;
  let B = clamp(b, 0, 100) / 100;
  if (W + B >= 1) {
    const gray = (W / (W + B)) * 255;
    return { r: gray, g: gray, b: gray };
  }
  const pure = hslToRgb({ h, s: 100, l: 50 });
  const k = 1 - W - B;
  return { r: pure.r * k + W * 255, g: pure.g * k + W * 255, b: pure.b * k + W * 255 };
}

/** Naive (device-independent) CMYK — real print colours depend on the printer profile. */
export function rgbToCmyk({ r, g, b }) {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  return { c: ((1 - R - k) / (1 - k)) * 100, m: ((1 - G - k) / (1 - k)) * 100, y: ((1 - B - k) / (1 - k)) * 100, k: k * 100 };
}

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function rgbToOklab({ r, g, b }) {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  };
}

export function rgbToOklch(rgb) {
  const { L, a, b } = rgbToOklab(rgb);
  const C = Math.sqrt(a * a + b * b);
  const h = C < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { L, C, h };
}

/** @returns {{r, g, b, inGamut: boolean}} */
export function oklchToRgb({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
  const inGamut = lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  const [R, G, B] = lin.map((v) => clamp(fromLinear(clamp(v, 0, 1)), 0, 255));
  return { r: R, g: G, b: B, inGamut };
}

/* ---------- parsing ---------- */

function parseAngle(token) {
  const m = token.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(deg|rad|grad|turn)?$/i);
  if (!m) throw new SyntaxError(`“${token}” is not a valid hue.`);
  const v = Number(m[1]);
  const unit = (m[2] || 'deg').toLowerCase();
  return { deg: v, rad: (v * 180) / Math.PI, grad: v * 0.9, turn: v * 360 }[unit];
}

function parseNumberOrPercent(token, percentScale) {
  const m = token.match(/^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(%)?$/i);
  if (!m) throw new SyntaxError(`“${token}” is not a valid number.`);
  return m[2] ? (Number(m[1]) / 100) * percentScale : Number(m[1]);
}

function parseAlpha(token) {
  if (token === undefined) return 1;
  return clamp(parseNumberOrPercent(token, 1), 0, 1);
}

/**
 * Parse any common CSS colour: #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(),
 * hsl(), hsla(), hwb(), oklch(), named colours and "transparent".
 * @returns {{r: number, g: number, b: number, a: number}}
 */
export function parseColor(input) {
  const s = String(input ?? '').trim().toLowerCase();
  if (!s) throw new SyntaxError('Enter a colour, such as #ff6347, rgb(255 99 71) or tomato.');
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (NAMED_COLORS.has(s)) return parseColor(`#${NAMED_COLORS.get(s)}`);

  const hex = s.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? round(parseInt(h.slice(6, 8), 16) / 255, 3) : 1 };
  }

  const fn = s.match(/^(rgba?|hsla?|hwb|oklch)\(\s*([^)]*)\)$/);
  if (!fn) throw new SyntaxError(`“${input}” is not a colour this tool recognises. Try #ff6347, rgb(255, 99, 71), hsl(9 100% 64%) or a name like tomato.`);
  const [main, alphaPart] = fn[2].split('/').map((x) => x.trim());
  let args = main.split(/[\s,]+/).filter(Boolean);
  let alpha = alphaPart;
  if (alpha === undefined && args.length === 4) alpha = args.pop();
  if (args.length !== 3) throw new SyntaxError(`${fn[1]}() needs three values${fn[1].endsWith('a') ? ' and an alpha' : ''}.`);
  const a = parseAlpha(alpha);

  switch (fn[1]) {
    case 'rgb':
    case 'rgba': {
      const [r, g, b] = args.map((t) => clamp(parseNumberOrPercent(t, 255), 0, 255));
      return { r, g, b, a };
    }
    case 'hsl':
    case 'hsla': {
      const h = parseAngle(args[0]);
      const [sat, light] = args.slice(1).map((t) => parseNumberOrPercent(t.endsWith('%') ? t : `${t}%`, 100));
      return { ...hslToRgb({ h, s: sat, l: light }), a };
    }
    case 'hwb': {
      const h = parseAngle(args[0]);
      const [w, b] = args.slice(1).map((t) => parseNumberOrPercent(t.endsWith('%') ? t : `${t}%`, 100));
      return { ...hwbToRgb({ h, w, b }), a };
    }
    case 'oklch': {
      const L = parseNumberOrPercent(args[0], 1);
      const C = parseNumberOrPercent(args[1], 0.4);
      const h = parseAngle(args[2]);
      const { r, g, b } = oklchToRgb({ L: clamp(L, 0, 1), C: Math.max(0, C), h });
      return { r, g, b, a };
    }
    default:
      throw new SyntaxError('Unsupported colour.');
  }
}

/* ---------- output ---------- */

const hex2 = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');

export function toHex({ r, g, b, a = 1 }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;
}

/** Every output format the converter shows. */
export function formatColor(color) {
  const { r, g, b, a } = color;
  const R = Math.round(r);
  const G = Math.round(g);
  const B = Math.round(b);
  const alpha = a < 1 ? round(a, 3) : null;
  const hsl = rgbToHsl(color);
  const hsv = rgbToHsv(color);
  const hwb = rgbToHwb(color);
  const cmyk = rgbToCmyk(color);
  const ok = rgbToOklch(color);
  return {
    hex: toHex(color),
    rgb: alpha === null ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${alpha})`,
    hsl: alpha === null ? `hsl(${round(hsl.h, 1)}, ${round(hsl.s, 1)}%, ${round(hsl.l, 1)}%)` : `hsla(${round(hsl.h, 1)}, ${round(hsl.s, 1)}%, ${round(hsl.l, 1)}%, ${alpha})`,
    hsv: `hsv(${round(hsv.h, 1)}°, ${round(hsv.s, 1)}%, ${round(hsv.v, 1)}%)`,
    hwb: `hwb(${round(hwb.h, 1)} ${round(hwb.w, 1)}% ${round(hwb.b, 1)}%${alpha === null ? '' : ` / ${alpha}`})`,
    cmyk: `cmyk(${round(cmyk.c)}%, ${round(cmyk.m)}%, ${round(cmyk.y)}%, ${round(cmyk.k)}%)`,
    oklch: `oklch(${round(ok.L * 100, 1)}% ${round(ok.C, 3)} ${round(ok.h, 1)}${alpha === null ? '' : ` / ${alpha}`})`
  };
}

/** WCAG 2 relative luminance. */
export function luminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(c1, c2) {
  const [hi, lo] = [luminance(c1), luminance(c2)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.2 levels for normal and large text. */
export function wcagLevels(ratio) {
  return {
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5
  };
}

let namedLab = null;

/** Closest CSS named colour, measured in the perceptual OKLab space. */
export function nearestNamedColor(color) {
  if (!namedLab) {
    namedLab = [...NAMED_COLORS].filter(([name]) => !/grey/.test(name) || name === 'grey').map(([name, hex]) => [name, hex, rgbToOklab(parseColor(`#${hex}`))]);
  }
  const lab = rgbToOklab(color);
  let best = null;
  for (const [name, hex, l] of namedLab) {
    const d = (lab.L - l.L) ** 2 + (lab.a - l.a) ** 2 + (lab.b - l.b) ** 2;
    if (!best || d < best.distance) best = { name, hex: `#${hex}`, distance: d };
  }
  return { ...best, exact: best.distance < 1e-8 };
}
