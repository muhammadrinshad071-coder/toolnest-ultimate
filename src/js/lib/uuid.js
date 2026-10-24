/**
 * UUID generation and inspection (RFC 9562). Randomness comes from the
 * Web Crypto API.
 */

const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const dashed = (h) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

export function uuidV4(getRandomValues = (b) => globalThis.crypto.getRandomValues(b)) {
  const b = getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

/** Version 7: 48-bit Unix time in milliseconds + random bits, so IDs sort by creation time. */
export function uuidV7(now = Date.now(), getRandomValues = (b) => globalThis.crypto.getRandomValues(b)) {
  const b = getRandomValues(new Uint8Array(16));
  let t = now;
  for (let i = 5; i >= 0; i--) { b[i] = t % 256; t = Math.floor(t / 256); }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

export function formatUuid(uuid, { uppercase = false, hyphens = true, braces = false } = {}) {
  let s = hyphens ? uuid : uuid.replace(/-/g, '');
  if (uppercase) s = s.toUpperCase();
  return braces ? `{${s}}` : s;
}

const VERSION_NAMES = {
  1: 'Version 1 (time and node based)',
  2: 'Version 2 (DCE security)',
  3: 'Version 3 (name-based, MD5)',
  4: 'Version 4 (random)',
  5: 'Version 5 (name-based, SHA-1)',
  6: 'Version 6 (reordered time)',
  7: 'Version 7 (Unix time + random)',
  8: 'Version 8 (custom)'
};

/**
 * @returns {{valid: boolean, error?: string, normalized?: string, version?: number, versionName?: string, variant?: string, timestamp?: Date}}
 */
export function inspectUuid(input) {
  const raw = String(input ?? '').trim().replace(/^urn:uuid:/i, '').replace(/^\{|\}$/g, '');
  const h = raw.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(h) || (raw.includes('-') && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw))) {
    return { valid: false, error: 'A UUID has 32 hexadecimal digits, usually written 8-4-4-4-12 with hyphens.' };
  }
  const normalized = dashed(h);
  if (/^0{32}$/.test(h)) return { valid: true, normalized, version: 0, versionName: 'Nil UUID (all zeros)', variant: '—' };
  if (/^f{32}$/.test(h)) return { valid: true, normalized, version: 15, versionName: 'Max UUID (all ones)', variant: '—' };
  const version = parseInt(h[12], 16);
  const v = parseInt(h[16], 16);
  const variant = v < 8 ? 'NCS (legacy)' : v < 12 ? 'RFC 9562 (standard)' : v < 14 ? 'Microsoft (legacy)' : 'Reserved';
  const result = { valid: true, normalized, version, versionName: VERSION_NAMES[version] || `Unknown version ${version}`, variant };
  if (version === 7) result.timestamp = new Date(parseInt(h.slice(0, 12), 16));
  if (version === 1) {
    const ticks = BigInt(`0x${h.slice(13, 16)}${h.slice(8, 12)}${h.slice(0, 8)}`);
    // 100 ns intervals since 1582-10-15, the start of the Gregorian calendar.
    result.timestamp = new Date(Number((ticks - 122192928000000000n) / 10000n));
  }
  return result;
}
