/**
 * Pure text-processing functions used by the text tools.
 * No DOM access — everything here is covered by Node tests.
 */

export const splitLines = (text) => String(text).split(/\r\n|\r|\n/);

/* ------------------------------------------------------------------ */
/* Counting                                                            */
/* ------------------------------------------------------------------ */

// Chinese/Japanese characters count as one word each; other scripts use
// runs of letters/digits, joined by inner apostrophes, hyphens or dots.
const CJK = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}';
const WORD_CHAR = `(?:(?![${CJK}])[\\p{L}\\p{N}\\p{M}])`;
const WORD_RE = new RegExp(`[${CJK}]|${WORD_CHAR}+(?:['’\\-.]${WORD_CHAR}+)*`, 'gu');

export function words(text) {
  return String(text).match(WORD_RE) || [];
}

const graphemeSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

/** Visible characters: an emoji or accented letter counts once. */
export function countCharacters(text) {
  const s = String(text);
  if (!s) return 0;
  if (graphemeSegmenter) {
    let n = 0;
    for (const _ of graphemeSegmenter.segment(s)) n++;
    return n;
  }
  return [...s].length;
}

const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'e.g', 'i.e', 'fig', 'approx', 'dept', 'inc', 'ltd', 'mt']);
const TERMINATOR_RE = /[.!?。！？…]+(?=["'”’)\]]*(?:\s|$))/g;

/** True when the "." ending at `index` belongs to an abbreviation or an initial. */
function isAbbreviationAt(text, index) {
  const before = text.slice(0, index).match(/[\p{L}.]+$/u);
  const word = before ? before[0] : '';
  return ABBREVIATIONS.has(word.toLowerCase()) || /^\p{Lu}$/u.test(word);
}

function sentencesInLine(line) {
  let count = 0;
  let lastEnd = 0;
  TERMINATOR_RE.lastIndex = 0;
  let m;
  while ((m = TERMINATOR_RE.exec(line))) {
    if (m[0] === '.' && isAbbreviationAt(line, m.index)) continue;
    if (/[\p{L}\p{N}]/u.test(line.slice(lastEnd, m.index))) count++;
    lastEnd = m.index + m[0].length;
  }
  if (/[\p{L}\p{N}]/u.test(line.slice(lastEnd))) count++;
  return count;
}

export function countSentences(text) {
  return splitLines(text).reduce((n, line) => n + sentencesInLine(line), 0);
}

export function countParagraphs(text) {
  return splitLines(text).filter((l) => l.trim() !== '').length;
}

export function utf8Bytes(text) {
  return new TextEncoder().encode(String(text)).length;
}

export const READING_WPM = 238;
export const SPEAKING_WPM = 130;

export function textStats(text, { readingWpm = READING_WPM, speakingWpm = SPEAKING_WPM } = {}) {
  const s = String(text ?? '');
  const list = words(s);
  const unique = new Set(list.map((w) => w.toLocaleLowerCase()));
  const letterTotal = list.reduce((n, w) => n + [...w].length, 0);
  let longestWord = '';
  for (const w of list) if ([...w].length > [...longestWord].length) longestWord = w;
  return {
    words: list.length,
    characters: countCharacters(s),
    charactersNoSpaces: countCharacters(s.replace(/\s+/g, '')),
    sentences: countSentences(s),
    paragraphs: countParagraphs(s),
    lines: s === '' ? 0 : splitLines(s).length,
    bytes: utf8Bytes(s),
    uniqueWords: unique.size,
    averageWordLength: list.length ? letterTotal / list.length : 0,
    longestWord,
    readingSeconds: (list.length / readingWpm) * 60,
    speakingSeconds: (list.length / speakingWpm) * 60
  };
}

const STOPWORDS = new Set(('a an and are as at be been but by can could did do does for from had has have he her his i if in into is it its just me my no not of on or our she so than that the their them then there these they this to too us was we were what when which who will with would you your').split(' '));

export function keywordDensity(text, { limit = 10, excludeStopwords = true, minLength = 2 } = {}) {
  const list = words(text).map((w) => w.toLocaleLowerCase());
  const counts = new Map();
  for (const w of list) {
    if ([...w].length < minLength) continue;
    if (excludeStopwords && STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count, percent: list.length ? (count / list.length) * 100 : 0 }));
}

export function formatDuration(totalSeconds) {
  const s = Math.round(totalSeconds);
  if (!Number.isFinite(s) || s <= 0) return '0 sec';
  if (s < 60) return `${s} sec`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return m ? `${h} hr ${m} min` : `${h} hr`;
  return sec ? `${m} min ${sec} sec` : `${m} min`;
}

/* ------------------------------------------------------------------ */
/* Case conversion                                                     */
/* ------------------------------------------------------------------ */

/** Words such as NASA, iPhone or McDonald whose capitals are deliberate. */
export function isAcronymLike(word) {
  const letters = word.replace(/[^\p{L}]/gu, '');
  if (letters.length < 2) return false;
  const hasLower = /\p{Ll}/u.test(letters);
  if (!hasLower) return true;
  return /\p{Lu}/u.test(letters.slice(1));
}

/** Acronym preservation only makes sense when most cased letters are lowercase. */
function shouldPreserve(text, wanted) {
  if (!wanted) return false;
  const lower = (String(text).match(/\p{Ll}/gu) || []).length;
  const upper = (String(text).match(/\p{Lu}/gu) || []).length;
  return lower > 0 && lower >= upper;
}

const SMALL_WORDS = new Set('a an and as at but by en for if in nor of on or per the to up via vs v yet so'.split(' '));

function capitalizeFirst(word) {
  const i = word.search(/\p{L}/u);
  if (i < 0) return word.toLowerCase();
  return word.slice(0, i) + word[i].toUpperCase() + word.slice(i + 1).toLowerCase();
}

function titleLine(line, preserve) {
  const parts = line.split(/(\s+)/);
  const wordIdx = [];
  parts.forEach((p, i) => { if (i % 2 === 0 && p) wordIdx.push(i); });
  const first = wordIdx[0];
  const last = wordIdx[wordIdx.length - 1];
  let forceCapital = true;
  for (const i of wordIdx) {
    const w = parts[i];
    const core = w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
    if (preserve && isAcronymLike(w)) {
      // keep as typed
    } else if (i !== first && i !== last && !forceCapital && SMALL_WORDS.has(core)) {
      parts[i] = w.toLowerCase();
    } else {
      parts[i] = w.split('-').map(capitalizeFirst).join('-');
    }
    forceCapital = /[:.!?—]["'”’)]*$/.test(w);
  }
  return parts.join('');
}

export function toTitleCase(text, { preserveAcronyms = true } = {}) {
  const preserve = shouldPreserve(text, preserveAcronyms);
  return splitLines(text).map((l) => titleLine(l, preserve)).join('\n');
}

export function toSentenceCase(text, { preserveAcronyms = true } = {}) {
  const preserve = shouldPreserve(text, preserveAcronyms);
  let out = String(text).replace(/\r\n|\r/g, '\n');
  out = out.replace(/\S+/g, (w) => (preserve && isAcronymLike(w) ? w : w.toLowerCase()));
  out = out.replace(/(^|[^\p{L}\p{N}'’.])i(?![\p{L}\p{N}]|\.\p{L})/gu, '$1I');
  out = out.replace(
    /(^|([.!?…])["'”’)\]]*\s+|\n[ \t]*)(["'“‘(\[]*)(\p{Ll})/gu,
    (match, lead, term, quote, letter, offset, whole) => {
      if (term === '.' && isAbbreviationAt(whole, offset)) return match;
      return lead + quote + letter.toUpperCase();
    }
  );
  return out;
}

export function capitalizeWords(text) {
  return String(text).replace(/\S+/g, (w) => w.split('-').map(capitalizeFirst).join('-'));
}

export function invertCase(text) {
  return [...String(text)].map((c) => {
    const up = c.toUpperCase();
    return c === up ? c.toLowerCase() : up;
  }).join('');
}

/** Split identifiers and phrases into lowercase words: "parseHTTPResponse v2" → parse http response v2 */
export function identifierWords(line) {
  return String(line)
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
const perLine = (text, fn) => splitLines(text).map((l) => (l.trim() ? fn(identifierWords(l)) : '')).join('\n');

export const toCamelCase = (t) => perLine(t, (w) => w.map((x, i) => (i ? cap(x) : x)).join(''));
export const toPascalCase = (t) => perLine(t, (w) => w.map(cap).join(''));
export const toSnakeCase = (t) => perLine(t, (w) => w.join('_'));
export const toKebabCase = (t) => perLine(t, (w) => w.join('-'));
export const toConstantCase = (t) => perLine(t, (w) => w.join('_').toUpperCase());

export const CASE_MODES = [
  { id: 'upper', label: 'UPPERCASE' },
  { id: 'lower', label: 'lowercase' },
  { id: 'title', label: 'Title Case' },
  { id: 'sentence', label: 'Sentence case' },
  { id: 'capitalize', label: 'Capitalize Each Word' },
  { id: 'invert', label: 'iNVERT cASE' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' }
];

export function convertCase(text, mode, options = {}) {
  const s = String(text ?? '');
  switch (mode) {
    case 'upper': return s.toUpperCase();
    case 'lower': return s.toLowerCase();
    case 'title': return toTitleCase(s, options);
    case 'sentence': return toSentenceCase(s, options);
    case 'capitalize': return capitalizeWords(s);
    case 'invert': return invertCase(s);
    case 'camel': return toCamelCase(s);
    case 'pascal': return toPascalCase(s);
    case 'snake': return toSnakeCase(s);
    case 'kebab': return toKebabCase(s);
    case 'constant': return toConstantCase(s);
    default: throw new Error(`Unknown case mode: ${mode}`);
  }
}

/* ------------------------------------------------------------------ */
/* Line tools                                                          */
/* ------------------------------------------------------------------ */

export function removeDuplicateLines(text, { ignoreCase = false, trim = true, keep = 'first', removeEmpty = false } = {}) {
  if (text === '' || text == null) return { output: '', total: 0, kept: 0, removed: 0, duplicates: [] };
  const lines = splitLines(text);
  const keyOf = (l) => {
    const k = trim ? l.trim() : l;
    return ignoreCase ? k.toLocaleLowerCase() : k;
  };
  const isSkipped = (l) => removeEmpty && l.trim() === '';

  const counts = new Map();
  for (const l of lines) {
    if (isSkipped(l)) continue;
    const k = keyOf(l);
    const entry = counts.get(k);
    if (entry) entry.count++;
    else counts.set(k, { line: trim ? l.trim() : l, count: 1 });
  }

  const seen = new Set();
  const pick = (l) => {
    if (isSkipped(l)) return false;
    const k = keyOf(l);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  };
  const result = keep === 'last' ? lines.slice().reverse().filter(pick).reverse() : lines.filter(pick);

  return {
    output: result.join('\n'),
    total: lines.length,
    kept: result.length,
    removed: lines.length - result.length,
    duplicates: [...counts.values()].filter((d) => d.count > 1).sort((a, b) => b.count - a.count)
  };
}

export const SORT_MODES = [
  { id: 'az', label: 'A → Z' },
  { id: 'za', label: 'Z → A' },
  { id: 'natural', label: 'Natural (1, 2, 10)' },
  { id: 'length-asc', label: 'Shortest first' },
  { id: 'length-desc', label: 'Longest first' },
  { id: 'numeric-asc', label: 'Number: low → high' },
  { id: 'numeric-desc', label: 'Number: high → low' },
  { id: 'reverse', label: 'Reverse order' },
  { id: 'shuffle', label: 'Shuffle' }
];

/** Uniform random integer in [0, n) using the Web Crypto API (rejection sampling). */
export function cryptoRandomInt(n) {
  if (n <= 1) return 0;
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  let x;
  do {
    globalThis.crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % n;
}

export function firstNumber(line) {
  const m = String(line).replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1').match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i);
  return m ? Number(m[0]) : NaN;
}

export function sortLines(text, { mode = 'az', ignoreCase = true, trim = false, removeEmpty = true, unique = false, locale, randomInt = cryptoRandomInt } = {}) {
  if (!text) return { output: '', count: 0 };
  let lines = splitLines(text);
  if (trim) lines = lines.map((l) => l.trim());
  if (removeEmpty) lines = lines.filter((l) => l.trim() !== '');
  if (unique) {
    const seen = new Set();
    lines = lines.filter((l) => {
      const k = ignoreCase ? l.toLocaleLowerCase() : l;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  const collator = new Intl.Collator(locale, {
    numeric: mode === 'natural',
    sensitivity: ignoreCase ? 'accent' : 'variant',
    caseFirst: ignoreCase ? 'false' : 'upper'
  });
  const cmp = collator.compare;
  const len = (s) => [...s].length;

  switch (mode) {
    case 'az':
    case 'natural':
      lines.sort(cmp); break;
    case 'za':
      lines.sort((a, b) => cmp(b, a)); break;
    case 'length-asc':
      lines.sort((a, b) => len(a) - len(b) || cmp(a, b)); break;
    case 'length-desc':
      lines.sort((a, b) => len(b) - len(a) || cmp(a, b)); break;
    case 'numeric-asc':
    case 'numeric-desc': {
      const dir = mode === 'numeric-asc' ? 1 : -1;
      const withNum = lines.map((l) => ({ l, n: firstNumber(l) }));
      withNum.sort((a, b) => {
        const an = Number.isNaN(a.n);
        const bn = Number.isNaN(b.n);
        if (an && bn) return cmp(a.l, b.l);
        if (an) return 1;
        if (bn) return -1;
        return (a.n - b.n) * dir || cmp(a.l, b.l);
      });
      lines = withNum.map((x) => x.l);
      break;
    }
    case 'reverse':
      lines.reverse(); break;
    case 'shuffle':
      for (let i = lines.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [lines[i], lines[j]] = [lines[j], lines[i]];
      }
      break;
    default:
      throw new Error(`Unknown sort mode: ${mode}`);
  }
  return { output: lines.join('\n'), count: lines.length };
}

/* ------------------------------------------------------------------ */
/* Find & replace                                                      */
/* ------------------------------------------------------------------ */

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Turn \n, \t, \r and \\ typed by the user into real characters. */
export function unescapeSequences(s) {
  return String(s).replace(/\\([ntr\\])/g, (_, c) => ({ n: '\n', t: '\t', r: '\r', '\\': '\\' }[c]));
}

/**
 * Build the RegExp for a search. Throws a SyntaxError for invalid patterns.
 */
export function buildPattern(find, { regex = false, matchCase = false, wholeWord = false, multiline = true } = {}) {
  const source = regex ? find : escapeRegExp(find);
  const flags = 'g' + (matchCase ? '' : 'i') + (regex && multiline ? 'm' : '');
  if (wholeWord) {
    try {
      return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${source})(?![\\p{L}\\p{N}_])`, flags + 'u');
    } catch {
      // Pattern is not valid in Unicode mode; fall back to ASCII word boundaries.
    }
    return new RegExp(`\\b(?:${source})\\b`, flags);
  }
  return new RegExp(source, flags);
}

/**
 * @returns {{output: string, count: number, matches: Array<[number, number]>, truncated: boolean}}
 */
export function findReplace(text, find, replacement, options = {}, { maxMatches = 2000 } = {}) {
  const s = String(text ?? '');
  if (!find) return { output: s, count: 0, matches: [], truncated: false };
  const re = buildPattern(find, options);
  const matches = [];
  let count = 0;
  for (const m of s.matchAll(re)) {
    count++;
    if (matches.length < maxMatches) matches.push([m.index, m.index + m[0].length]);
  }
  const rep = String(replacement ?? '');
  const output = options.regex
    ? s.replace(re, unescapeSequences(rep))
    : s.replace(re, () => rep);
  return { output, count, matches, truncated: count > matches.length };
}

/* ------------------------------------------------------------------ */
/* Text cleanup                                                        */
/* ------------------------------------------------------------------ */

export const CLEANUP_OPTIONS = [
  { id: 'trimLines', label: 'Trim spaces at the start and end of lines', default: true },
  { id: 'collapseSpaces', label: 'Replace repeated spaces with one space', default: true },
  { id: 'collapseEmptyLines', label: 'Allow at most one empty line in a row', default: true },
  { id: 'removeEmptyLines', label: 'Remove all empty lines', default: false },
  { id: 'joinLines', label: 'Join broken lines within paragraphs (text copied from PDFs)', default: false },
  { id: 'removeInvisible', label: 'Remove invisible characters (zero-width spaces, BOM, soft hyphens)', default: true },
  { id: 'nbspToSpace', label: 'Replace non-breaking spaces with normal spaces', default: true },
  { id: 'tabsToSpaces', label: 'Convert tabs to spaces', default: false },
  { id: 'straightQuotes', label: 'Convert curly quotes to straight quotes', default: false },
  { id: 'spaceBeforePunctuation', label: 'Remove spaces before punctuation (word , → word,)', default: false },
  { id: 'normalizeUnicode', label: 'Normalize Unicode (NFC) so identical-looking letters match', default: true }
];

const INVISIBLE_RE = /[​-‍⁠﻿­]/g;

/**
 * @returns {{output: string, invisibleRemoved: number, charactersRemoved: number, linesRemoved: number}}
 */
export function cleanText(text, options = {}) {
  const o = Object.fromEntries(CLEANUP_OPTIONS.map((opt) => [opt.id, options[opt.id] ?? opt.default]));
  const original = String(text ?? '');
  let s = original.replace(/\r\n|\r/g, '\n');
  let invisibleRemoved = 0;

  if (o.normalizeUnicode) s = s.normalize('NFC');
  if (o.removeInvisible) {
    s = s.replace(INVISIBLE_RE, () => { invisibleRemoved++; return ''; });
  }
  if (o.nbspToSpace) s = s.replace(/[   ]/g, ' ');
  if (o.tabsToSpaces) s = s.replace(/\t/g, ' ');
  if (o.straightQuotes) s = s.replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"');
  if (o.collapseSpaces) s = s.replace(/ {2,}/g, ' ');
  if (o.spaceBeforePunctuation) s = s.replace(/[ \t]+([,.;:!?)\]}])/g, '$1');
  if (o.trimLines) s = s.split('\n').map((l) => l.trim()).join('\n');
  if (o.joinLines) {
    s = s.split(/\n[ \t]*\n/).map((para) => para.split('\n').map((l) => l.trim()).filter(Boolean).join(' ')).join('\n\n');
    if (o.collapseSpaces) s = s.replace(/ {2,}/g, ' ');
  }
  if (o.removeEmptyLines) s = s.split('\n').filter((l) => l.trim() !== '').join('\n');
  else if (o.collapseEmptyLines) s = s.replace(/\n([ \t]*\n){2,}/g, '\n\n');

  const lineCount = (t) => (t === '' ? 0 : t.split(/\r\n|\r|\n/).length);
  return {
    output: s,
    invisibleRemoved,
    charactersRemoved: Math.max(0, [...original].length - [...s].length),
    linesRemoved: Math.max(0, lineCount(original) - lineCount(s))
  };
}

/* ------------------------------------------------------------------ */
/* Slugs                                                               */
/* ------------------------------------------------------------------ */

const SPECIAL_LETTERS = { ß: 'ss', æ: 'ae', Æ: 'AE', ø: 'o', Ø: 'O', đ: 'd', Đ: 'D', ł: 'l', Ł: 'L', œ: 'oe', Œ: 'OE', þ: 'th', Þ: 'TH', ð: 'd', Ð: 'D', ı: 'i' };
const SLUG_STOPWORDS = new Set('a an the and or but of to in on at for with by from is are was were'.split(' '));

export function toSlug(text, { separator = '-', lowercase = true, maxLength = 0, removeStopwords = false, keepUnicode = false } = {}) {
  let s = String(text ?? '').replace(/&/g, ' and ').replace(/@/g, ' at ');
  if (keepUnicode) {
    s = s.normalize('NFC');
  } else {
    s = s.replace(/[ßæÆøØđĐłŁœŒþÞðÐı]/g, (c) => SPECIAL_LETTERS[c]).normalize('NFKD').replace(/\p{M}/gu, '');
  }
  if (lowercase) s = s.toLocaleLowerCase();
  // Drop apostrophes inside words so "don't" becomes "dont", not "don-t".
  s = s.replace(/(\p{L})['’](\p{L})/gu, '$1$2');
  const allowed = keepUnicode ? /[\p{L}\p{N}\p{M}]+/gu : /[A-Za-z0-9]+/g;
  let words = s.match(allowed) || [];
  if (removeStopwords) {
    const kept = words.filter((w) => !SLUG_STOPWORDS.has(w.toLowerCase()));
    if (kept.length) words = kept;
  }
  let slug = words.join(separator);
  if (maxLength > 0 && slug.length > maxLength) {
    const cut = slug.slice(0, maxLength);
    const lastSep = separator ? cut.lastIndexOf(separator) : -1;
    slug = lastSep > 0 && slug[maxLength] !== separator ? cut.slice(0, lastSep) : cut;
    if (separator) while (slug.endsWith(separator)) slug = slug.slice(0, -separator.length);
  }
  return slug;
}

/* ------------------------------------------------------------------ */
/* Prefix / suffix and line numbers                                    */
/* ------------------------------------------------------------------ */

export function addPrefixSuffix(text, { prefix = '', suffix = '', skipEmpty = true, trim = false } = {}) {
  if (!text) return '';
  return splitLines(text).map((line) => {
    const l = trim ? line.trim() : line;
    if (skipEmpty && l.trim() === '') return l;
    return prefix + l + suffix;
  }).join('\n');
}

export function removePrefixSuffix(text, { prefix = '', suffix = '', trim = false } = {}) {
  if (!text) return '';
  return splitLines(text).map((line) => {
    let l = trim ? line.trim() : line;
    if (prefix && l.startsWith(prefix)) l = l.slice(prefix.length);
    if (suffix && l.endsWith(suffix)) l = l.slice(0, -suffix.length);
    return l;
  }).join('\n');
}

export const NUMBER_SEPARATORS = [
  { id: '. ', label: '1. item' },
  { id: ') ', label: '1) item' },
  { id: ': ', label: '1: item' },
  { id: ' | ', label: '1 | item' },
  { id: '\t', label: '1 → tab → item' },
  { id: ' ', label: '1 item' }
];

export function numberLines(text, { start = 1, step = 1, separator = '. ', pad = 'none', skipEmpty = false } = {}) {
  if (!text) return '';
  const lines = splitLines(text);
  const numbered = skipEmpty ? lines.filter((l) => l.trim() !== '').length : lines.length;
  const last = start + step * Math.max(0, numbered - 1);
  const width = Math.max(String(Math.abs(start)).length, String(Math.abs(last)).length);
  let n = start;
  return lines.map((line) => {
    if (skipEmpty && line.trim() === '') return line;
    const abs = String(Math.abs(n));
    const body = pad === 'zeros' ? abs.padStart(width, '0') : abs;
    let label = (n < 0 ? '-' : '') + body;
    if (pad === 'spaces') label = label.padStart(width + (last < 0 || start < 0 ? 1 : 0), ' ');
    n += step;
    return label + separator + line;
  }).join('\n');
}

/**
 * Removes leading numbers like "1. ", "(2) ", "3) ", "4: ", "5 | " or "6<tab>".
 * A number must be followed by punctuation and a space, so "2024 was" and "3.14" are left alone.
 */
export function removeLineNumbers(text) {
  if (!text) return '';
  return splitLines(text)
    .map((l) => l.replace(/^[ \t]*(?:\(\d+\)|\[\d+\]|\d+[.):|])[ \t]+|^[ \t]*\d+(?:\t| \| )/, ''))
    .join('\n');
}
