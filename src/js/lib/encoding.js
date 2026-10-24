/**
 * Base64 and byte helpers. Text is always encoded as UTF-8, so emoji and
 * non-Latin scripts survive the round trip (plain btoa() would throw).
 */

const CHUNK = 0x8000;

export function bytesToBase64(bytes, { urlSafe = false, wrap = 0 } = {}) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  let b64 = btoa(binary);
  if (urlSafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (wrap > 0) b64 = b64.match(new RegExp(`.{1,${wrap}}`, 'g'))?.join('\n') ?? '';
  return b64;
}

export const textToBase64 = (text, options) => bytesToBase64(new TextEncoder().encode(String(text ?? '')), options);

/**
 * Decode standard or URL-safe Base64, ignoring whitespace and a data: URI
 * prefix, with or without padding.
 * @returns {{bytes: Uint8Array, mime: string|null}}
 */
export function base64ToBytes(input) {
  let s = String(input ?? '').trim();
  let mime = null;
  const dataUri = s.match(/^data:([^;,]*)(?:;[^,]*)?;base64,/i);
  if (dataUri) { mime = dataUri[1] || null; s = s.slice(dataUri[0].length); }
  else if (/^data:/i.test(s)) throw new SyntaxError('This data URI is not Base64-encoded (it has no “;base64,” part).');
  s = s.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const bad = s.replace(/=+$/, '').search(/[^A-Za-z0-9+/]/);
  if (bad >= 0) throw new SyntaxError(`“${s[bad]}” is not a Base64 character (position ${bad + 1}).`);
  s = s.replace(/=+$/, '');
  if (s.length % 4 === 1) throw new SyntaxError('This Base64 text has the wrong length — part of it may be missing.');
  s += '='.repeat((4 - (s.length % 4)) % 4);
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, mime };
}

/** Decode bytes as UTF-8, or return null if they are not valid text. */
export function bytesToText(bytes) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    // Binary data often decodes as "valid" UTF-8 full of control characters.
    const controls = (text.match(/[\u0000-\u0008\u000E-\u001F]/g) || []).length;
    return controls > Math.max(2, text.length * 0.02) ? null : text;
  } catch {
    return null;
  }
}

const SIGNATURES = [
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/gif', ext: 'gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', ext: 'webp', bytes: [0x52, 0x49, 0x46, 0x46], at8: [0x57, 0x45, 0x42, 0x50] },
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', ext: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: 'application/gzip', ext: 'gz', bytes: [0x1f, 0x8b] },
  { mime: 'audio/mpeg', ext: 'mp3', bytes: [0x49, 0x44, 0x33] },
  { mime: 'image/x-icon', ext: 'ico', bytes: [0x00, 0x00, 0x01, 0x00] }
];

/** Guess a file type from its first bytes ("magic numbers"). */
export function sniffType(bytes) {
  const starts = (sig, offset = 0) => sig.every((b, k) => bytes[offset + k] === b);
  for (const s of SIGNATURES) {
    if (starts(s.bytes) && (!s.at8 || starts(s.at8, 8))) return { mime: s.mime, ext: s.ext };
  }
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart();
  if (/^<svg[\s>]|^<\?xml[^>]*>\s*<svg/i.test(head)) return { mime: 'image/svg+xml', ext: 'svg' };
  return null;
}

export const bytesToHex = (bytes, upper = false) => {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return upper ? hex.toUpperCase() : hex;
};

/** Human-readable size: 1536 → "1.5 KB". Uses 1000-based units, like most operating systems' file managers on the web. */
export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let v = n;
  let u = -1;
  do { v /= 1000; u++; } while (v >= 1000 && u < units.length - 1);
  return `${v >= 100 ? Math.round(v) : Number(v.toFixed(1))} ${units[u]}`;
}
