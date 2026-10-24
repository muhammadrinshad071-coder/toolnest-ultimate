/**
 * Strict JSON parser and printer.
 *
 * Why not JSON.parse? Two reasons:
 *  1. Error messages and positions differ between browsers; this parser
 *     gives the same clear message, line and column everywhere.
 *  2. JSON.parse turns 12345678901234567890 into 12345678901234567000.
 *     Here numbers keep their original text, so formatting never changes data.
 */

export class JsonError extends Error {
  constructor(message, position, text) {
    super(message);
    this.name = 'JsonError';
    this.position = position;
    const before = text.slice(0, position);
    this.line = (before.match(/\n/g) || []).length + 1;
    this.column = position - before.lastIndexOf('\n');
  }
}

const MAX_DEPTH = 1000;

/**
 * @returns {{ast: object, warnings: string[]}}
 */
export function parseJson(text) {
  const s = String(text ?? '');
  let i = 0;
  const warnings = [];
  const fail = (message, at = i) => { throw new JsonError(message, at, s); };
  const describeChar = (c) => (c === undefined ? 'the end of the input' : c === '\n' ? 'a line break' : `“${c}”`);

  const ws = () => {
    for (;;) {
      const c = s[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r') i++;
      else if (c === '/' && (s[i + 1] === '/' || s[i + 1] === '*')) fail('Comments are not allowed in JSON');
      else return;
    }
  };

  function value(depth) {
    if (depth > MAX_DEPTH) fail(`Nesting is deeper than ${MAX_DEPTH} levels`);
    ws();
    const c = s[i];
    if (c === '{') return object(depth);
    if (c === '[') return array(depth);
    if (c === '"') return { type: 'string', value: string() };
    if (c === '-' || (c >= '0' && c <= '9')) return number();
    for (const [word, node] of [['true', { type: 'bool', value: true }], ['false', { type: 'bool', value: false }], ['null', { type: 'null' }]]) {
      if (s.startsWith(word, i)) { i += word.length; return node; }
    }
    if (c === "'") fail('Strings must use double quotes (") in JSON, not single quotes');
    if (c === undefined) fail('Unexpected end of input — the JSON is incomplete');
    if (/[A-Za-z_]/.test(c)) {
      const word = s.slice(i).match(/^[A-Za-z_$][\w$]*/)[0];
      if (['undefined', 'NaN', 'Infinity'].includes(word)) fail(`${word} is not allowed in JSON`);
      fail(`Unexpected word “${word}”. Text values must be in double quotes`);
    }
    fail(`Unexpected ${describeChar(c)}`);
  }

  function object(depth) {
    const start = i;
    i++;
    const entries = [];
    const keys = new Set();
    ws();
    if (s[i] === '}') { i++; return { type: 'object', entries }; }
    for (;;) {
      ws();
      if (s[i] === '}') fail('Trailing commas are not allowed in JSON');
      if (s[i] !== '"') {
        if (s[i] === "'") fail('Property names must use double quotes, not single quotes');
        if (s[i] === undefined) fail('Unexpected end of input inside an object', start);
        fail('Property names must be in double quotes');
      }
      const keyAt = i;
      const key = string();
      if (keys.has(key)) warnings.push(`Duplicate key “${key}” (line ${new JsonError('', keyAt, s).line}) — most programs keep only the last value`);
      keys.add(key);
      ws();
      if (s[i] !== ':') fail(`Expected “:” after the property name “${key}”`);
      i++;
      entries.push([key, value(depth + 1)]);
      ws();
      if (s[i] === ',') { i++; continue; }
      if (s[i] === '}') { i++; return { type: 'object', entries }; }
      if (s[i] === undefined) fail('Unexpected end of input — an object is missing its closing “}”', start);
      fail(`Expected “,” or “}” after a property value, but found ${describeChar(s[i])}`);
    }
  }

  function array(depth) {
    const start = i;
    i++;
    const items = [];
    ws();
    if (s[i] === ']') { i++; return { type: 'array', items }; }
    for (;;) {
      ws();
      if (s[i] === ']') fail('Trailing commas are not allowed in JSON');
      items.push(value(depth + 1));
      ws();
      if (s[i] === ',') { i++; continue; }
      if (s[i] === ']') { i++; return { type: 'array', items }; }
      if (s[i] === undefined) fail('Unexpected end of input — an array is missing its closing “]”', start);
      fail(`Expected “,” or “]” after an array item, but found ${describeChar(s[i])}`);
    }
  }

  function string() {
    const start = i;
    i++;
    let out = '';
    for (;;) {
      const c = s[i];
      if (c === undefined) fail('This string is never closed — add the missing "', start);
      if (c === '"') { i++; return out; }
      if (c === '\\') {
        const e = s[i + 1];
        const map = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (e in map) { out += map[e]; i += 2; continue; }
        if (e === 'u') {
          const hex = s.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('Invalid \\u escape — it needs exactly four hex digits');
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        fail(`Invalid escape “\\${e ?? ''}” in a string`);
      }
      if (c < ' ') fail(c === '\n' ? 'Line breaks inside strings must be written as \\n' : 'Control characters inside strings must be escaped');
      out += c;
      i++;
    }
  }

  function number() {
    const m = s.slice(i).match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    if (!m || m[0] === '-') fail('Invalid number');
    const raw = m[0];
    const next = s[i + raw.length];
    if (/^-?0\d/.test(s.slice(i, i + raw.length + 1))) fail('Numbers cannot have leading zeros');
    if (next === '.' || (next >= '0' && next <= '9')) fail('Invalid number');
    i += raw.length;
    return { type: 'number', raw };
  }

  const ast = value(0);
  ws();
  if (i < s.length) fail(`Unexpected ${describeChar(s[i])} after the end of the JSON value`);
  return { ast, warnings };
}

/**
 * @param {object} ast
 * @param {{indent?: string|number, sortKeys?: boolean}} options indent '' gives minified output
 */
export function printJson(ast, { indent = 2, sortKeys = false } = {}) {
  const pad = typeof indent === 'number' ? ' '.repeat(indent) : indent;
  const nl = pad ? '\n' : '';
  const colon = pad ? ': ' : ':';
  const parts = [];
  const write = (node, level) => {
    switch (node.type) {
      case 'string': parts.push(JSON.stringify(node.value)); break;
      case 'number': parts.push(node.raw); break;
      case 'bool': parts.push(String(node.value)); break;
      case 'null': parts.push('null'); break;
      case 'array': {
        if (!node.items.length) { parts.push('[]'); break; }
        const inner = pad.repeat(level + 1);
        parts.push(`[${nl}`);
        node.items.forEach((item, k) => {
          parts.push(inner);
          write(item, level + 1);
          parts.push(k < node.items.length - 1 ? `,${nl}` : nl);
        });
        parts.push(`${pad.repeat(level)}]`);
        break;
      }
      case 'object': {
        if (!node.entries.length) { parts.push('{}'); break; }
        const entries = sortKeys ? [...node.entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) : node.entries;
        const inner = pad.repeat(level + 1);
        parts.push(`{${nl}`);
        entries.forEach(([key, val], k) => {
          parts.push(`${inner}${JSON.stringify(key)}${colon}`);
          write(val, level + 1);
          parts.push(k < entries.length - 1 ? `,${nl}` : nl);
        });
        parts.push(`${pad.repeat(level)}}`);
        break;
      }
      default: throw new Error(`Unknown node ${node.type}`);
    }
  };
  write(ast, 0);
  return parts.join('');
}

/** Counts used for the summary line. */
export function jsonStats(ast) {
  let objects = 0;
  let arrays = 0;
  let values = 0;
  let depth = 0;
  const walk = (node, d) => {
    depth = Math.max(depth, d);
    if (node.type === 'object') { objects++; node.entries.forEach(([, v]) => walk(v, d + 1)); }
    else if (node.type === 'array') { arrays++; node.items.forEach((v) => walk(v, d + 1)); }
    else values++;
  };
  walk(ast, 0);
  return { objects, arrays, values, depth };
}

/** Convenience: validate and format in one call. */
export function formatJson(text, options) {
  const { ast, warnings } = parseJson(text);
  return { output: printJson(ast, options), warnings, stats: jsonStats(ast) };
}
