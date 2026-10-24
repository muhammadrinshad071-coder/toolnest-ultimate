/**
 * Percent-encoding (URL encoding) and decoding.
 */

export const URL_MODES = [
  { id: 'component', label: 'Component — query values and path parts (encodes / ? & =)' },
  { id: 'uri', label: 'Full URL — keeps : / ? # & = intact' },
  { id: 'form', label: 'Form data — spaces become +' }
];

/**
 * @returns {{output: string, error?: string}}
 */
export function encodeUrl(text, { mode = 'component', perLine = false } = {}) {
  const encodeOne = (s) => {
    if (mode === 'uri') return encodeURI(s);
    if (mode === 'form') return new URLSearchParams({ v: s }).toString().slice(2);
    return encodeURIComponent(s);
  };
  try {
    const s = String(text ?? '');
    return { output: perLine ? s.split(/\r\n|\r|\n/).map(encodeOne).join('\n') : encodeOne(s) };
  } catch {
    return { output: '', error: 'The text contains an incomplete emoji or symbol (an unpaired surrogate) that cannot be encoded.' };
  }
}

/**
 * Decodes runs of %XX escapes. Invalid or incomplete sequences are left
 * unchanged and counted instead of failing the whole input.
 * @returns {{output: string, invalid: number}}
 */
export function decodeUrl(text, { mode = 'component', plusAsSpace = false } = {}) {
  let s = String(text ?? '');
  if (plusAsSpace) s = s.replace(/\+/g, ' ');
  const decodeRun = mode === 'uri' ? decodeURI : decodeURIComponent;
  let invalid = 0;
  const output = s.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
    try {
      return decodeRun(run);
    } catch {
      // Decode the valid prefix byte by byte; keep anything that isn't valid UTF-8.
      let out = '';
      let i = 0;
      while (i < run.length) {
        let decoded = null;
        for (let len = Math.min(12, run.length - i); len >= 3; len -= 3) {
          try { decoded = { text: decodeRun(run.slice(i, i + len)), len }; break; } catch { /* try shorter */ }
        }
        if (decoded) { out += decoded.text; i += decoded.len; } else { out += run.slice(i, i + 3); i += 3; invalid++; }
      }
      return out;
    }
  });
  return { output, invalid };
}
