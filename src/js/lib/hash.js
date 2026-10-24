/**
 * Hashing. SHA-1 and SHA-2 use the browser's Web Crypto API. MD5 isn't
 * available there, so it is implemented below — it is only suitable for
 * checksums, never for security.
 */
import { bytesToHex, bytesToBase64 } from './encoding.js';

export const HASH_ALGORITHMS = [
  { id: 'MD5', label: 'MD5', note: 'Broken for security — use only to compare checksums.' },
  { id: 'SHA-1', label: 'SHA-1', note: 'Weak — avoid for new security uses.' },
  { id: 'SHA-256', label: 'SHA-256' },
  { id: 'SHA-384', label: 'SHA-384' },
  { id: 'SHA-512', label: 'SHA-512' }
];

/* ---------- MD5 (RFC 1321) ---------- */

const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0);

export function md5(bytes) {
  const length = bytes.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (length * 8) >>> 0, true);
  view.setUint32(padded.length - 4, Math.floor(length / 0x20000000), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const M = new Uint32Array(16);
  for (let off = 0; off < padded.length; off += 64) {
    for (let j = 0; j < 16; j++) M[j] = view.getUint32(off + j * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F;
      let g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  const ov = new DataView(out.buffer);
  [a0, b0, c0, d0].forEach((w, k) => ov.setUint32(k * 4, w, true));
  return out;
}

/* ---------- Public API ---------- */

export const encodeText = (text) => new TextEncoder().encode(String(text ?? ''));

/** @returns {Promise<Uint8Array>} */
export async function digest(algorithm, bytes) {
  if (algorithm === 'MD5') return md5(bytes);
  if (!globalThis.crypto?.subtle) throw new Error('Secure hashing needs a secure (https) page.');
  return new Uint8Array(await globalThis.crypto.subtle.digest(algorithm, bytes));
}

/** HMAC with a text key. Not available for MD5. */
export async function hmac(algorithm, keyText, bytes) {
  if (algorithm === 'MD5') throw new Error('HMAC-MD5 is not supported.');
  const key = await globalThis.crypto.subtle.importKey('raw', encodeText(keyText), { name: 'HMAC', hash: algorithm }, false, ['sign']);
  return new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, bytes));
}

export function formatDigest(bytes, format = 'hex') {
  if (format === 'HEX') return bytesToHex(bytes, true);
  if (format === 'base64') return bytesToBase64(bytes);
  return bytesToHex(bytes);
}

/** Compare a pasted checksum with a computed one, ignoring case and spaces. */
export function sameDigest(expected, bytes) {
  const e = String(expected ?? '').trim().replace(/\s+/g, '');
  if (!e) return null;
  return e.toLowerCase() === bytesToHex(bytes) || e === bytesToBase64(bytes);
}
