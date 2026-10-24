/**
 * Safe calculator expression evaluator — a hand-written recursive-descent
 * parser. It never uses eval() or Function(), so typed input can only ever
 * be arithmetic.
 *
 * Grammar (lowest to highest precedence):
 *   expr    := term (("+" | "-") term)*
 *   term    := unary (("*" | "/" | "mod" | implicit) unary)*
 *   unary   := ("+" | "-") unary | power
 *   power   := postfix ("^" unary)?          (right-associative; -2^2 = -4)
 *   postfix := primary ("!" | "%")*
 *   primary := number | constant | function "(" args ")" | "(" expr ")" | "√" unary
 */

export class CalcError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'CalcError';
    this.position = position;
  }
}

const CONSTANTS = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2 };

/** Snap values like sin(π) = 1.2e-16 to 0. */
const snap = (x) => (Math.abs(x) < 1e-14 ? 0 : x);

function factorial(n, pos) {
  if (!Number.isInteger(n) || n < 0) throw new CalcError('Factorial needs a whole number of 0 or more', pos);
  if (n > 170) throw new CalcError('Factorial is too large (the limit here is 170!)', pos);
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function choose(n, k, pos) {
  if (![n, k].every(Number.isInteger) || n < 0 || k < 0) throw new CalcError('nCr and nPr need whole numbers of 0 or more', pos);
  if (k > n) return 0;
  let r = 1;
  for (let i = 1; i <= Math.min(k, n - k); i++) r = (r * (n - Math.min(k, n - k) + i)) / i;
  return Math.round(r);
}

function makeFunctions(angle) {
  const toRad = (x) => (angle === 'deg' ? (x * Math.PI) / 180 : x);
  const fromRad = (x) => (angle === 'deg' ? (x * 180) / Math.PI : x);
  // Exact answers at the special angles where floating point is slightly off.
  const trig = (fn, x, pos) => {
    if (angle === 'deg') {
      const m = ((x % 360) + 360) % 360;
      if (fn === 'sin' && m % 180 === 0) return 0;
      if (fn === 'cos' && m % 180 === 90) return 0;
      if (fn === 'tan' && m % 180 === 0) return 0;
      if (fn === 'tan' && m % 180 === 90) throw new CalcError(`tan(${x}°) is undefined`, pos);
    }
    return snap(Math[fn](toRad(x)));
  };
  const domain = (ok, msg, pos) => { if (!ok) throw new CalcError(msg, pos); };
  return {
    sin: { n: 1, f: ([x], p) => trig('sin', x, p) },
    cos: { n: 1, f: ([x], p) => trig('cos', x, p) },
    tan: { n: 1, f: ([x], p) => trig('tan', x, p) },
    asin: { n: 1, f: ([x], p) => { domain(x >= -1 && x <= 1, 'asin needs a value between -1 and 1', p); return fromRad(Math.asin(x)); } },
    acos: { n: 1, f: ([x], p) => { domain(x >= -1 && x <= 1, 'acos needs a value between -1 and 1', p); return fromRad(Math.acos(x)); } },
    atan: { n: 1, f: ([x]) => fromRad(Math.atan(x)) },
    sinh: { n: 1, f: ([x]) => Math.sinh(x) },
    cosh: { n: 1, f: ([x]) => Math.cosh(x) },
    tanh: { n: 1, f: ([x]) => Math.tanh(x) },
    sqrt: { n: 1, f: ([x], p) => { domain(x >= 0, 'Square root of a negative number is not a real number', p); return Math.sqrt(x); } },
    cbrt: { n: 1, f: ([x]) => Math.cbrt(x) },
    ln: { n: 1, f: ([x], p) => { domain(x > 0, 'ln needs a positive number', p); return Math.log(x); } },
    log: {
      n: [1, 2],
      f: ([x, b], p) => {
        domain(x > 0, 'log needs a positive number', p);
        if (b === undefined) return Math.log10(x);
        domain(b > 0 && b !== 1, 'The log base must be positive and not 1', p);
        return Math.log(x) / Math.log(b);
      }
    },
    log2: { n: 1, f: ([x], p) => { domain(x > 0, 'log2 needs a positive number', p); return Math.log2(x); } },
    exp: { n: 1, f: ([x]) => Math.exp(x) },
    abs: { n: 1, f: ([x]) => Math.abs(x) },
    round: { n: [1, 2], f: ([x, d = 0], p) => { domain(Number.isInteger(d) && d >= 0 && d <= 15, 'round(x, places) needs 0–15 places', p); return Number(Math.round(Number(`${x}e${d}`)) + `e-${d}`); } },
    floor: { n: 1, f: ([x]) => Math.floor(x) },
    ceil: { n: 1, f: ([x]) => Math.ceil(x) },
    min: { n: [1, Infinity], f: (a) => Math.min(...a) },
    max: { n: [1, Infinity], f: (a) => Math.max(...a) },
    ncr: { n: 2, f: ([n, k], p) => choose(n, k, p) },
    npr: { n: 2, f: ([n, k], p) => (k > n ? 0 : Math.round(choose(n, k, p) * factorial(k, p))) }
  };
}

const TOKEN_RE = /\s*(?:(\d+(?:\.\d*)?(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)|([a-zA-Zπ][a-zA-Z0-9]*)|(\*\*|[-+*/^%!(),√×÷−]))/y;

export function tokenize(input) {
  const tokens = [];
  const src = String(input);
  let pos = 0;
  TOKEN_RE.lastIndex = 0;
  while (pos < src.length) {
    if (/^\s*$/.test(src.slice(pos))) break;
    TOKEN_RE.lastIndex = pos;
    const m = TOKEN_RE.exec(src);
    if (!m) throw new CalcError(`Unexpected character “${src.slice(pos).trim()[0]}”`, pos);
    const at = m.index + m[0].length - (m[1] || m[2] || m[3]).length;
    if (m[1]) tokens.push({ type: 'num', value: Number(m[1]), pos: at });
    else if (m[2]) tokens.push({ type: 'id', value: m[2].toLowerCase(), pos: at });
    else {
      const op = { '×': '*', '÷': '/', '−': '-', '**': '^' }[m[3]] || m[3];
      tokens.push({ type: 'op', value: op, pos: at });
    }
    pos = TOKEN_RE.lastIndex;
  }
  return tokens;
}

/**
 * Evaluate an expression.
 * @param {string} input
 * @param {{angle?: 'deg'|'rad', ans?: number}} options
 * @returns {number}
 */
export function evaluate(input, { angle = 'deg', ans = 0 } = {}) {
  const tokens = tokenize(input);
  if (!tokens.length) throw new CalcError('Enter an expression', 0);
  const fns = makeFunctions(angle);
  let i = 0;
  const peek = () => tokens[i];
  const isOp = (v) => peek() && peek().type === 'op' && peek().value === v;
  const end = () => (tokens.length ? tokens[tokens.length - 1].pos + String(tokens[tokens.length - 1].value).length : 0);
  const expect = (v) => {
    if (!isOp(v)) throw new CalcError(peek() ? `Expected “${v}”` : `Missing “${v}”`, peek() ? peek().pos : end());
    i++;
  };

  function expr() {
    let v = term();
    while (isOp('+') || isOp('-')) {
      const op = tokens[i++].value;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  function startsOperand(t) {
    return t && (t.type === 'num' || t.type === 'id' || (t.type === 'op' && (t.value === '(' || t.value === '√')));
  }

  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (isOp('*') || isOp('/')) {
        i++;
        const r = unary();
        if (t.value === '/' && r === 0) throw new CalcError('Division by zero', t.pos);
        v = t.value === '*' ? v * r : v / r;
      } else if (t && t.type === 'id' && t.value === 'mod') {
        i++;
        const r = unary();
        if (r === 0) throw new CalcError('Modulo by zero', t.pos);
        v = ((v % r) + r) % r;
      } else if (startsOperand(t) && !(t.type === 'num' && tokens[i - 1].type === 'num')) {
        v *= unary(); // implicit multiplication: 2π, 3(4+1), (1+2)(3+4)
      } else {
        return v;
      }
    }
  }

  function unary() {
    if (isOp('-')) { i++; return -unary(); }
    if (isOp('+')) { i++; return unary(); }
    return power();
  }

  function power() {
    const base = postfix();
    if (isOp('^')) {
      const t = tokens[i++];
      const exp = unary();
      const r = base ** exp;
      if (Number.isNaN(r)) throw new CalcError('This power has no real result (for example a negative number to a fractional power)', t.pos);
      return r;
    }
    return base;
  }

  function postfix() {
    let v = primary();
    for (;;) {
      if (isOp('!')) v = factorial(v, tokens[i++].pos);
      else if (isOp('%')) { i++; v /= 100; }
      else return v;
    }
  }

  function primary() {
    const t = peek();
    if (!t) throw new CalcError('The expression is incomplete', end());
    if (t.type === 'num') { i++; return t.value; }
    if (t.type === 'op' && t.value === '(') {
      i++;
      const v = expr();
      expect(')');
      return v;
    }
    if (t.type === 'op' && t.value === '√') {
      i++;
      const v = unary();
      if (v < 0) throw new CalcError('Square root of a negative number is not a real number', t.pos);
      return Math.sqrt(v);
    }
    if (t.type === 'id') {
      i++;
      if (t.value === 'ans') return ans;
      if (Object.hasOwn(CONSTANTS, t.value)) return CONSTANTS[t.value];
      const fn = fns[t.value];
      if (!fn) throw new CalcError(`Unknown name “${t.value}”`, t.pos);
      if (!isOp('(')) throw new CalcError(`${t.value} needs brackets, for example ${t.value}(30)`, t.pos);
      i++;
      const args = [expr()];
      while (isOp(',')) { i++; args.push(expr()); }
      expect(')');
      const [lo, hi] = Array.isArray(fn.n) ? fn.n : [fn.n, fn.n];
      if (args.length < lo || args.length > hi) throw new CalcError(`${t.value} takes ${lo === hi ? lo : `${lo} or ${hi === Infinity ? 'more' : hi}`} value${hi === 1 ? '' : 's'}`, t.pos);
      return fn.f(args, t.pos);
    }
    throw new CalcError(`Unexpected “${t.value}”`, t.pos);
  }

  const result = expr();
  if (i < tokens.length) throw new CalcError(`Unexpected “${tokens[i].value}”`, tokens[i].pos);
  if (!Number.isFinite(result)) throw new CalcError('The result is too large to show', 0);
  return result;
}
