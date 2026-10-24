/**
 * Math helpers for the calculators. Exact arithmetic (fractions, primes,
 * factorials, base conversion) uses BigInt so results never lose digits.
 */

/* ------------------------------------------------------------------ */
/* Input & output                                                      */
/* ------------------------------------------------------------------ */

/**
 * Parse a typed number. Accepts "1,234.5", "1 234", "−5", "1e3".
 * @returns {number|null} null for empty input, NaN for invalid input
 */
export function parseNumber(input) {
  const s = String(input ?? '').trim().replace(/[−–]/g, '-').replace(/[,_\s  ]/g, '');
  if (s === '') return null;
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return Number(s);
}

/** Readable number without floating-point noise (0.1 + 0.2 → "0.3"). */
export function fmt(x, significant = 12) {
  if (typeof x === 'bigint') return x.toString();
  if (!Number.isFinite(x)) return '—';
  const r = Number(x.toPrecision(significant));
  if (r !== 0 && (Math.abs(r) >= 1e21 || Math.abs(r) < 1e-9)) return r.toExponential().replace(/\.?0+e/, 'e').replace('e+', 'e');
  return String(Object.is(r, -0) ? 0 : r);
}

/* ------------------------------------------------------------------ */
/* Percentages                                                         */
/* ------------------------------------------------------------------ */

export const percentOf = (percent, value) => (percent / 100) * value;

export function whatPercent(part, whole) {
  if (whole === 0) throw new RangeError('The whole cannot be zero.');
  return (part / whole) * 100;
}

/** Change from an old value to a new value, relative to the old value. */
export function percentChange(from, to) {
  if (from === 0) throw new RangeError('The starting value cannot be zero — a change from zero has no percentage.');
  return ((to - from) / Math.abs(from)) * 100;
}

/** Symmetric difference between two values, relative to their average. */
export function percentDifference(a, b) {
  const mean = (Math.abs(a) + Math.abs(b)) / 2;
  if (mean === 0) return 0;
  return (Math.abs(a - b) / mean) * 100;
}

export const increaseBy = (value, percent) => value * (1 + percent / 100);
export const decreaseBy = (value, percent) => value * (1 - percent / 100);

/** The original value before a percentage increase: 118 after +18% → 100. */
export function reversePercent(final, percent) {
  if (percent === -100) throw new RangeError('A 100% decrease leaves nothing to reverse.');
  return final / (1 + percent / 100);
}

/* ------------------------------------------------------------------ */
/* Integers (BigInt)                                                   */
/* ------------------------------------------------------------------ */

const babs = (n) => (n < 0n ? -n : n);

export function parseInteger(input) {
  const s = String(input ?? '').trim().replace(/[−–]/g, '-').replace(/[,_\s  ]/g, '');
  if (!/^[-+]?\d+$/.test(s)) return null;
  return BigInt(s);
}

export function gcd(a, b) {
  let x = babs(BigInt(a));
  let y = babs(BigInt(b));
  while (y) [x, y] = [y, x % y];
  return x;
}

export function lcm(a, b) {
  const x = BigInt(a);
  const y = BigInt(b);
  if (x === 0n || y === 0n) return 0n;
  return babs(x / gcd(x, y) * y);
}

export const gcdAll = (list) => list.reduce((g, n) => gcd(g, n), 0n);
export const lcmAll = (list) => (list.length ? list.reduce((l, n) => lcm(l, n), 1n) : 0n);

/** The steps of Euclid's algorithm, e.g. "48 = 1 × 36 + 12". */
export function euclidSteps(a, b) {
  let x = babs(BigInt(a));
  let y = babs(BigInt(b));
  if (x < y) [x, y] = [y, x];
  const steps = [];
  while (y && steps.length < 200) {
    steps.push({ a: x, q: x / y, b: y, r: x % y });
    [x, y] = [y, x % y];
  }
  return steps;
}

export const FACTORIAL_LIMIT = 10000;

export function factorialBig(n) {
  const k = Number(n);
  if (!Number.isInteger(k) || k < 0) throw new RangeError('Enter a whole number of 0 or more.');
  if (k > FACTORIAL_LIMIT) throw new RangeError(`The limit is ${FACTORIAL_LIMIT.toLocaleString('en')}! to keep your browser responsive.`);
  let r = 1n;
  for (let i = 2n; i <= BigInt(k); i++) r *= i;
  return r;
}

/** Trailing zeros of n! (count of factors of 5). */
export function factorialTrailingZeros(n) {
  let count = 0;
  for (let p = 5; p <= n; p *= 5) count += Math.floor(n / p);
  return count;
}

/** "1.2345 × 10^N" for a big integer. */
export function scientific(big, digits = 6) {
  const s = babs(big).toString();
  const sign = big < 0n ? '-' : '';
  if (s.length <= digits + 1) return sign + s;
  const mantissa = `${s[0]}.${s.slice(1, digits).replace(/0+$/, '')}`.replace(/\.$/, '');
  return `${sign}${mantissa} × 10^${s.length - 1}`;
}

/* ------------------------------------------------------------------ */
/* Primes                                                              */
/* ------------------------------------------------------------------ */

export const PRIME_LIMIT = 10n ** 24n;

function modPow(base, exp, mod) {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** Deterministic Miller–Rabin, exact for every n below 3.3 × 10^24. */
export function isPrime(input) {
  const n = BigInt(input);
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) { d >>= 1n; s++; }
  witness: for (const a of SMALL_PRIMES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) continue witness;
    }
    return false;
  }
  return true;
}

function pollardRho(n) {
  if (n % 2n === 0n) return 2n;
  for (let c = 1n; ; c++) {
    let x = 2n;
    let y = 2n;
    let d = 1n;
    const f = (v) => (v * v + c) % n;
    while (d === 1n) {
      x = f(x);
      y = f(f(y));
      d = gcd(x > y ? x - y : y - x, n);
    }
    if (d !== n) return d;
  }
}

/** Prime factorization as [{prime, power}], smallest first. */
export function factorize(input) {
  let n = babs(BigInt(input));
  if (n > PRIME_LIMIT) throw new RangeError('Numbers up to 10^24 are supported.');
  if (n < 2n) return [];
  const found = [];
  for (let p = 2n; p < 1000n && p * p <= n; p += p === 2n ? 1n : 2n) {
    while (n % p === 0n) { found.push(p); n /= p; }
  }
  const stack = n > 1n ? [n] : [];
  while (stack.length) {
    const m = stack.pop();
    if (isPrime(m)) { found.push(m); continue; }
    const d = pollardRho(m);
    stack.push(d, m / d);
  }
  found.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const out = [];
  for (const p of found) {
    const last = out[out.length - 1];
    if (last && last.prime === p) last.power++;
    else out.push({ prime: p, power: 1 });
  }
  return out;
}

export function divisorCount(factors) {
  return factors.reduce((n, f) => n * (f.power + 1), 1);
}

export function nextPrime(input) {
  let n = BigInt(input) + 1n;
  if (n <= 2n) return 2n;
  if (n % 2n === 0n) n++;
  while (!isPrime(n)) n += 2n;
  return n;
}

export function previousPrime(input) {
  let n = BigInt(input) - 1n;
  if (n < 2n) return null;
  if (n === 2n) return 2n;
  if (n % 2n === 0n) n--;
  while (n >= 2n && !isPrime(n)) n -= 2n;
  return n >= 2n ? n : 2n;
}

export const SIEVE_LIMIT = 10_000_000;

/** All primes in [from, to] using a sieve of Eratosthenes. */
export function primesBetween(from, to) {
  if (to > SIEVE_LIMIT) throw new RangeError(`The range can go up to ${SIEVE_LIMIT.toLocaleString('en')}.`);
  if (from > to) return [];
  const composite = new Uint8Array(to + 1);
  const out = [];
  for (let i = 2; i <= to; i++) {
    if (composite[i]) continue;
    if (i >= from) out.push(i);
    for (let j = i * i; j <= to; j += i) composite[j] = 1;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Fractions (exact)                                                   */
/* ------------------------------------------------------------------ */

function normalize(n, d) {
  if (d === 0n) throw new RangeError('The denominator cannot be zero.');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

/**
 * Parse "3/4", "-1 1/2" (mixed), "2", "0.75" or "-.5" into an exact fraction.
 */
export function parseFraction(input) {
  const s = String(input ?? '').trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
  let m;
  if ((m = s.match(/^([-+]?)(\d+) (\d+)\s*\/\s*(\d+)$/))) {
    const sign = m[1] === '-' ? -1n : 1n;
    const whole = BigInt(m[2]);
    const num = BigInt(m[3]);
    const den = BigInt(m[4]);
    return normalize(sign * (whole * den + num), den);
  }
  if ((m = s.match(/^([-+]?\d+)\s*\/\s*([-+]?\d+)$/))) return normalize(BigInt(m[1]), BigInt(m[2]));
  if ((m = s.match(/^([-+]?)(\d*)\.?(\d*)$/)) && (m[2] || m[3])) {
    const den = 10n ** BigInt(m[3].length);
    const num = BigInt((m[2] || '0') + m[3]) * (m[1] === '-' ? -1n : 1n);
    return normalize(num, den);
  }
  throw new SyntaxError(`“${input}” is not a fraction. Use forms like 3/4, 1 1/2 or 0.75.`);
}

export function fractionOp(a, op, b) {
  switch (op) {
    case '+': return normalize(a.n * b.d + b.n * a.d, a.d * b.d);
    case '-': return normalize(a.n * b.d - b.n * a.d, a.d * b.d);
    case '*': return normalize(a.n * b.n, a.d * b.d);
    case '/':
      if (b.n === 0n) throw new RangeError('You cannot divide by zero.');
      return normalize(a.n * b.d, a.d * b.n);
    default: throw new Error(`Unknown operator ${op}`);
  }
}

export const formatFraction = (f) => (f.d === 1n ? `${f.n}` : `${f.n}/${f.d}`);

export function toMixed(f) {
  if (f.d === 1n || babs(f.n) < f.d) return formatFraction(f);
  const whole = f.n / f.d;
  const rest = babs(f.n % f.d);
  return rest === 0n ? `${whole}` : `${whole} ${rest}/${f.d}`;
}

/** Exact decimal expansion, marking a repeating part in brackets: 1/3 → "0.(3)". */
export function toDecimalString(f, maxDigits = 60) {
  const sign = f.n < 0n ? '-' : '';
  let n = babs(f.n);
  const whole = n / f.d;
  n %= f.d;
  if (n === 0n) return sign + whole.toString();
  const seen = new Map();
  let digits = '';
  while (n !== 0n && digits.length < maxDigits) {
    if (seen.has(n)) {
      const at = seen.get(n);
      return `${sign}${whole}.${digits.slice(0, at)}(${digits.slice(at)})`;
    }
    seen.set(n, digits.length);
    n *= 10n;
    digits += (n / f.d).toString();
    n %= f.d;
  }
  return `${sign}${whole}.${digits}${n !== 0n ? '…' : ''}`;
}

/** Closest fraction with a denominator up to maxDen (continued fractions). */
export function approximateFraction(x, maxDen = 1000) {
  if (!Number.isFinite(x)) throw new RangeError('Enter a finite number.');
  const sign = x < 0 ? -1n : 1n;
  let v = Math.abs(x);
  let [h0, h1, k0, k1] = [0n, 1n, 1n, 0n];
  for (let i = 0; i < 64; i++) {
    const a = BigInt(Math.floor(v));
    const h2 = a * h1 + h0;
    const k2 = a * k1 + k0;
    if (k2 > BigInt(maxDen)) break;
    [h0, h1, k0, k1] = [h1, h2, k1, k2];
    const frac = v - Math.floor(v);
    if (frac < 1e-12) break;
    v = 1 / frac;
  }
  return normalize(sign * h1, k1);
}

/* ------------------------------------------------------------------ */
/* Ratios                                                              */
/* ------------------------------------------------------------------ */

/** Simplify a ratio of decimals or integers: [1.5, 2.5] → [3, 5]. */
export function simplifyRatio(values) {
  if (values.length < 2) throw new RangeError('Enter at least two numbers.');
  if (values.some((v) => !Number.isFinite(v) || v < 0)) throw new RangeError('Ratios use positive numbers.');
  if (values.every((v) => v === 0)) throw new RangeError('At least one value must be more than zero.');
  const decimals = Math.max(...values.map((v) => (String(v).split('.')[1] || '').length));
  if (decimals > 12) throw new RangeError('Use at most 12 decimal places.');
  const ints = values.map((v) => BigInt(Math.round(v * 10 ** decimals)));
  const g = gcdAll(ints);
  return ints.map((v) => v / g);
}

/** Solve a : b = c : x for x. */
export function solveProportion(a, b, c) {
  if (a === 0) throw new RangeError('The first value cannot be zero.');
  return (b * c) / a;
}

/** Split a total in the given ratio. */
export function divideInRatio(total, ratio) {
  const sum = ratio.reduce((s, r) => s + r, 0);
  if (sum <= 0) throw new RangeError('The ratio parts must add up to more than zero.');
  return ratio.map((r) => (total * r) / sum);
}

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

/** Pull numbers out of free text; anything else is reported. */
export function parseNumberList(text) {
  const numbers = [];
  const invalid = [];
  for (const token of String(text ?? '').split(/[\s,;\t]+/).filter(Boolean)) {
    const n = parseNumber(token);
    if (n === null) continue;
    if (Number.isNaN(n)) invalid.push(token);
    else numbers.push(n);
  }
  return { numbers, invalid };
}

/** Quantile with linear interpolation (the method used by Excel QUARTILE.INC and R type 7). */
export function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function describe(numbers) {
  const n = numbers.length;
  if (!n) throw new RangeError('Enter at least one number.');
  const sorted = [...numbers].sort((a, b) => a - b);
  // Kahan summation keeps long lists accurate.
  let sum = 0;
  let comp = 0;
  for (const v of numbers) {
    const y = v - comp;
    const t = sum + y;
    comp = (t - sum) - y;
    sum = t;
  }
  const mean = sum / n;
  const squares = numbers.reduce((s, v) => s + (v - mean) ** 2, 0);
  const counts = new Map();
  for (const v of numbers) counts.set(v, (counts.get(v) || 0) + 1);
  const top = Math.max(...counts.values());
  const modes = top > 1 ? [...counts.entries()].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b) : [];
  const allPositive = numbers.every((v) => v > 0);
  return {
    count: n,
    sum,
    mean,
    median: quantile(sorted, 0.5),
    modes,
    modeCount: top,
    min: sorted[0],
    max: sorted[n - 1],
    range: sorted[n - 1] - sorted[0],
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    iqr: quantile(sorted, 0.75) - quantile(sorted, 0.25),
    variancePopulation: squares / n,
    varianceSample: n > 1 ? squares / (n - 1) : NaN,
    sdPopulation: Math.sqrt(squares / n),
    sdSample: n > 1 ? Math.sqrt(squares / (n - 1)) : NaN,
    geometricMean: allPositive ? Math.exp(numbers.reduce((s, v) => s + Math.log(v), 0) / n) : NaN,
    sorted
  };
}

/* ------------------------------------------------------------------ */
/* Number bases                                                        */
/* ------------------------------------------------------------------ */

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/** Parse an integer in base 2–36. Accepts 0x / 0b / 0o prefixes, spaces and underscores. */
export function parseInBase(input, base) {
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError('The base must be between 2 and 36.');
  let s = String(input ?? '').trim().toLowerCase().replace(/[\s_]/g, '');
  let negative = false;
  if (s.startsWith('-')) { negative = true; s = s.slice(1); }
  const prefix = { 16: '0x', 2: '0b', 8: '0o' }[base];
  if (prefix && s.startsWith(prefix)) s = s.slice(2);
  if (!s) throw new SyntaxError('Enter a number.');
  let value = 0n;
  const b = BigInt(base);
  for (const ch of s) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) throw new SyntaxError(`“${ch}” is not a valid digit in base ${base}.`);
    value = value * b + BigInt(d);
  }
  return negative ? -value : value;
}

export function toBase(value, base) {
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new RangeError('The base must be between 2 and 36.');
  return BigInt(value).toString(base);
}

/** Group digits from the right for readability: 11111111 → "1111 1111". */
export function groupDigits(s, size = 4, sep = ' ') {
  const neg = s.startsWith('-');
  const digits = neg ? s.slice(1) : s;
  const out = [];
  for (let i = digits.length; i > 0; i -= size) out.unshift(digits.slice(Math.max(0, i - size), i));
  return (neg ? '-' : '') + out.join(sep);
}

/** Two's complement bit pattern of a negative number at a given width. */
export function twosComplement(value, bits) {
  const v = BigInt(value);
  const min = -(1n << BigInt(bits - 1));
  const max = (1n << BigInt(bits - 1)) - 1n;
  if (v < min || v > max) return null;
  return BigInt.asUintN(bits, v).toString(2).padStart(bits, '0');
}

/* ------------------------------------------------------------------ */
/* Roman numerals                                                      */
/* ------------------------------------------------------------------ */

const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

export function toRoman(n) {
  if (!Number.isInteger(n) || n < 1 || n > 3999) throw new RangeError('Standard Roman numerals cover 1 to 3,999.');
  let out = '';
  for (const [value, symbol] of ROMAN) {
    while (n >= value) { out += symbol; n -= value; }
  }
  return out;
}

export function fromRoman(input) {
  const s = String(input ?? '').trim().toUpperCase();
  if (!s) throw new SyntaxError('Enter a Roman numeral.');
  if (/[^IVXLCDM]/.test(s)) throw new SyntaxError('Roman numerals only use I, V, X, L, C, D and M.');
  if (!ROMAN_RE.test(s)) throw new SyntaxError(`“${s}” is not written in standard form (for example, 4 is IV, not IIII).`);
  const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const v = values[s[i]];
    total += v < (values[s[i + 1]] || 0) ? -v : v;
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* Secure random numbers                                               */
/* ------------------------------------------------------------------ */

function randomUint53() {
  const buf = new Uint32Array(2);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] * 2 ** 21 + (buf[1] >>> 11);
}

/** Uniform integer in [min, max] with rejection sampling (no modulo bias). */
export function randomInt(min, max) {
  const range = max - min + 1;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || range < 1 || !Number.isSafeInteger(range)) {
    throw new RangeError('Use whole numbers within ±9,007,199,254,740,991, with the minimum not above the maximum.');
  }
  const limit = Math.floor(2 ** 53 / range) * range;
  let x;
  do { x = randomUint53(); } while (x >= limit);
  return min + (x % range);
}

export const RANDOM_MAX_COUNT = 10000;

export function randomIntegers({ min, max, count, unique = false, random = randomInt }) {
  if (!Number.isInteger(count) || count < 1 || count > RANDOM_MAX_COUNT) throw new RangeError(`Generate between 1 and ${RANDOM_MAX_COUNT.toLocaleString('en')} numbers.`);
  if (unique && count > max - min + 1) throw new RangeError(`There are only ${(max - min + 1).toLocaleString('en')} different whole numbers in that range.`);
  if (!unique) return Array.from({ length: count }, () => random(min, max));
  const seen = new Set();
  while (seen.size < count) seen.add(random(min, max));
  return [...seen];
}

export function randomDecimals({ min, max, count, places = 2 }) {
  if (!Number.isInteger(count) || count < 1 || count > RANDOM_MAX_COUNT) throw new RangeError(`Generate between 1 and ${RANDOM_MAX_COUNT.toLocaleString('en')} numbers.`);
  if (!(min < max)) throw new RangeError('The minimum must be below the maximum.');
  if (!Number.isInteger(places) || places < 0 || places > 10) throw new RangeError('Use 0 to 10 decimal places.');
  return Array.from({ length: count }, () => {
    const v = min + (randomUint53() / 2 ** 53) * (max - min);
    return Number(v.toFixed(places));
  });
}
