/**
 * Regular-expression testing. The tool runs this in a Web Worker with a
 * time limit, because some patterns can take exponential time.
 */
import { unescapeSequences } from './text.js';

export const REGEX_FLAGS = [
  { id: 'g', label: 'g', title: 'Global — find every match, not just the first' },
  { id: 'i', label: 'i', title: 'Ignore case' },
  { id: 'm', label: 'm', title: 'Multiline — ^ and $ match at each line' },
  { id: 's', label: 's', title: 'Dot-all — . also matches line breaks' },
  { id: 'u', label: 'u', title: 'Unicode — full Unicode support, enables \\p{…}' },
  { id: 'y', label: 'y', title: 'Sticky — match only at the current position' }
];

/** Accept /pattern/flags pasted from code. */
export function splitLiteral(input) {
  const m = String(input ?? '').match(/^\/([\s\S]+)\/([a-z]*)$/);
  return m ? { pattern: m[1], flags: m[2] } : null;
}

/**
 * @returns {{matches: Array<{index: number, end: number, text: string, groups: Array<string|undefined>, named: object|null}>, total: number, truncated: boolean, groupCount: number, output: string|null}}
 */
export function runRegex(pattern, flags, text, { maxMatches = 1000, replacement = null } = {}) {
  const re = new RegExp(pattern, flags);
  const s = String(text ?? '');
  const matches = [];
  let total = 0;
  const record = (m) => {
    total++;
    if (matches.length < maxMatches) {
      matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: m.slice(1), named: m.groups ? { ...m.groups } : null });
    }
  };
  if (re.global) {
    for (const m of s.matchAll(re)) record(m);
  } else {
    const m = re.exec(s);
    if (m) record(m);
  }
  // Count capture groups even when nothing matched.
  const groupCount = new RegExp(`${pattern}|`, flags.replace(/[gy]/g, '')).exec('').length - 1;
  const output = replacement === null ? null : s.replace(new RegExp(pattern, flags), unescapeSequences(replacement));
  return { matches, total, truncated: total > matches.length, groupCount, output };
}
