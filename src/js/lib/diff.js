/**
 * Text comparison using the Myers O(ND) diff algorithm.
 *
 * Tokens are mapped to integers first so comparisons are cheap, and the
 * common prefix and suffix are trimmed before diffing. Memory grows with
 * the square of the number of differences, so beyond `maxEdits` the
 * changed region is reported as one replacement and `simplified` is set.
 */
import { splitLines } from './text.js';

export const DIFF_MODES = [
  { id: 'lines', label: 'Lines' },
  { id: 'words', label: 'Words' },
  { id: 'chars', label: 'Characters' }
];

export const MAX_CHAR_MODE_LENGTH = 20000;

/** Shortest edit script between two integer arrays. Returns null when it exceeds maxEdits. */
function myers(A, B, maxEdits) {
  const N = A.length;
  const M = B.length;
  const trace = [];
  for (let d = 0; d <= N + M; d++) {
    if (d > maxEdits) return null;
    const prev = trace[d - 1];
    const get = (k) => (d === 0 ? 0 : prev[k + d - 1]);
    const v = new Int32Array(2 * d + 1);
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? get(k + 1) : get(k - 1) + 1;
      let y = x - k;
      while (x < N && y < M && A[x] === B[y]) { x++; y++; }
      v[k + d] = x;
      if (x >= N && y >= M) {
        trace.push(v);
        return backtrack(trace, N, M);
      }
    }
    trace.push(v);
  }
  return [];
}

function backtrack(trace, N, M) {
  const ops = [];
  let x = N;
  let y = M;
  for (let d = trace.length - 1; d > 0; d--) {
    const prev = trace[d - 1];
    const get = (k) => prev[k + d - 1];
    const k = x - y;
    const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1;
    const prevX = get(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) { ops.push(0); x--; y--; }
    if (x === prevX) { ops.push(1); y--; } else { ops.push(-1); x--; }
  }
  while (x > 0 && y > 0) { ops.push(0); x--; y--; }
  return ops.reverse();
}

/**
 * Diff two token arrays.
 * @returns {{ops: Array<{type: 'equal'|'insert'|'delete', tokens: string[]}>, simplified: boolean}}
 */
export function diffTokens(a, b, { keyOf = (t) => t, maxEdits = 2500 } = {}) {
  const ids = new Map();
  const idOf = (t) => {
    const key = keyOf(t);
    let id = ids.get(key);
    if (id === undefined) { id = ids.size; ids.set(key, id); }
    return id;
  };
  const A = a.map(idOf);
  const B = b.map(idOf);

  let start = 0;
  while (start < A.length && start < B.length && A[start] === B[start]) start++;
  let endA = A.length;
  let endB = B.length;
  while (endA > start && endB > start && A[endA - 1] === B[endB - 1]) { endA--; endB--; }

  let core = myers(A.slice(start, endA), B.slice(start, endB), maxEdits);
  const simplified = core === null;
  if (simplified) core = [...Array(endA - start).fill(-1), ...Array(endB - start).fill(1)];

  const ops = [];
  const push = (type, token) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.tokens.push(token);
    else ops.push({ type, tokens: [token] });
  };
  for (let i = 0; i < start; i++) push('equal', b[i]);
  let i = start;
  let j = start;
  for (const op of core) {
    if (op === 0) { push('equal', b[j]); i++; j++; }
    else if (op === -1) { push('delete', a[i]); i++; }
    else { push('insert', b[j]); j++; }
  }
  for (let k = endB; k < b.length; k++) push('equal', b[k]);
  return { ops, simplified };
}

const graphemes = (s) => {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)].map((g) => g.segment);
  }
  return [...s];
};

export function tokenize(text, mode) {
  const s = String(text ?? '');
  if (s === '') return [];
  if (mode === 'lines') return splitLines(s);
  if (mode === 'words') return s.split(/(\s+)/).filter((t) => t !== '');
  return graphemes(s);
}

/**
 * Compare two texts.
 * @returns {{mode, ops, simplified, stats: {added: number, removed: number, unchanged: number}, identical: boolean}}
 */
export function diffText(before, after, { mode = 'lines', ignoreCase = false, ignoreWhitespace = false, maxEdits } = {}) {
  if (mode === 'chars' && (before.length > MAX_CHAR_MODE_LENGTH || after.length > MAX_CHAR_MODE_LENGTH)) {
    throw new RangeError(`Character mode supports up to ${MAX_CHAR_MODE_LENGTH.toLocaleString('en')} characters per side. Use Words or Lines for longer text.`);
  }
  const keyOf = (t) => {
    let k = t;
    if (ignoreWhitespace) k = mode === 'lines' ? k.trim().replace(/\s+/g, ' ') : (/^\s+$/.test(k) ? ' ' : k);
    if (ignoreCase) k = k.toLocaleLowerCase();
    return k;
  };
  const { ops, simplified } = diffTokens(tokenize(before, mode), tokenize(after, mode), { keyOf, maxEdits });
  const counts = (op) => (mode === 'words' ? op.tokens.filter((t) => !/^\s+$/.test(t)).length : op.tokens.length);
  const stats = { added: 0, removed: 0, unchanged: 0 };
  for (const op of ops) {
    if (op.type === 'insert') stats.added += counts(op);
    else if (op.type === 'delete') stats.removed += counts(op);
    else stats.unchanged += counts(op);
  }
  return { mode, ops, simplified, stats, identical: stats.added === 0 && stats.removed === 0 };
}

/** Plain-text patch: "+"/"-"/" " prefixes for lines, [-…-]{+…+} markers for words and characters. */
export function formatDiff(result) {
  if (result.mode === 'lines') {
    const sign = { equal: ' ', insert: '+', delete: '-' };
    return result.ops.flatMap((op) => op.tokens.map((t) => `${sign[op.type]} ${t}`)).join('\n');
  }
  return result.ops.map((op) => {
    const t = op.tokens.join('');
    if (op.type === 'insert') return `{+${t}+}`;
    if (op.type === 'delete') return `[-${t}-]`;
    return t;
  }).join('');
}
