import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, CalcError } from '../src/js/lib/expression.js';
import {
  parseNumber, fmt, percentOf, whatPercent, percentChange, percentDifference, increaseBy, decreaseBy, reversePercent,
  parseInteger, gcd, lcm, gcdAll, lcmAll, euclidSteps, factorialBig, factorialTrailingZeros, scientific,
  isPrime, factorize, divisorCount, nextPrime, previousPrime, primesBetween,
  parseFraction, fractionOp, formatFraction, toMixed, toDecimalString, approximateFraction,
  simplifyRatio, solveProportion, divideInRatio, parseNumberList, quantile, describe,
  parseInBase, toBase, groupDigits, twosComplement, toRoman, fromRoman,
  randomInt, randomIntegers, randomDecimals
} from '../src/js/lib/math.js';
import { UNIT_CATEGORIES, convertUnit, conversionFactor } from '../src/js/lib/units.js';

const close = (actual, expected, tol = 1e-9) => assert.ok(Math.abs(actual - expected) <= tol * Math.max(1, Math.abs(expected)), `${actual} ≉ ${expected}`);
const calc = (s, o) => evaluate(s, o);

/* ---------- expression evaluator ---------- */

test('calculator: precedence and associativity', () => {
  assert.equal(calc('2 + 3 * 4'), 14);
  assert.equal(calc('(2 + 3) * 4'), 20);
  assert.equal(calc('2 ^ 3 ^ 2'), 512);
  assert.equal(calc('-2 ^ 2'), -4);
  assert.equal(calc('(-2) ^ 2'), 4);
  assert.equal(calc('2 ^ -1'), 0.5);
  assert.equal(calc('10 - 4 - 3'), 3);
  assert.equal(calc('100 / 10 / 5'), 2);
  assert.equal(calc('2**10'), 1024);
  assert.equal(calc('7 mod 3'), 1);
  assert.equal(calc('-7 mod 3'), 2);
  assert.equal(fmt(calc('0.1 + 0.2')), '0.3');
});

test('calculator: unicode operators, percent, factorial, implicit multiplication', () => {
  assert.equal(calc('6 × 7 − 2 ÷ 2'), 41);
  assert.equal(calc('50%'), 0.5);
  assert.equal(calc('200 * 15%'), 30);
  assert.equal(calc('5!'), 120);
  assert.equal(calc('3!!'), 720);
  assert.equal(calc('0!'), 1);
  close(calc('2π'), 2 * Math.PI);
  assert.equal(calc('3(4 + 1)'), 15);
  assert.equal(calc('(1 + 2)(3 + 4)'), 21);
  assert.equal(calc('√16'), 4);
  assert.equal(calc('√(9) + 1'), 4);
  assert.equal(calc('2√9'), 6);
});

test('calculator: functions in degree and radian mode', () => {
  close(calc('sin(30)'), 0.5);
  assert.equal(calc('sin(180)'), 0);
  assert.equal(calc('cos(90)'), 0);
  assert.equal(calc('tan(180)'), 0);
  close(calc('tan(45)'), 1);
  close(calc('asin(1)'), 90);
  assert.equal(calc('sin(pi)', { angle: 'rad' }), 0);
  close(calc('cos(pi)', { angle: 'rad' }), -1);
  close(calc('atan(1)', { angle: 'rad' }), Math.PI / 4);
  assert.equal(calc('sqrt(144)'), 12);
  assert.equal(calc('cbrt(27)'), 3);
  assert.equal(calc('log(1000)'), 3);
  assert.equal(calc('log(8, 2)'), 3);
  close(calc('ln(e)'), 1);
  assert.equal(calc('log2(1024)'), 10);
  assert.equal(calc('abs(-5)'), 5);
  assert.equal(calc('round(2.5)'), 3);
  assert.equal(calc('round(1.005, 2)'), 1.01);
  assert.equal(calc('round(3.14159, 2)'), 3.14);
  assert.equal(calc('floor(-1.5)'), -2);
  assert.equal(calc('ceil(1.2)'), 2);
  assert.equal(calc('max(3, 9, 4)'), 9);
  assert.equal(calc('min(3, 9, 4)'), 3);
  assert.equal(calc('ncr(5, 2)'), 10);
  assert.equal(calc('npr(5, 2)'), 20);
  assert.equal(calc('ncr(52, 5)'), 2598960);
  assert.equal(calc('ans * 2', { ans: 21 }), 42);
  assert.equal(calc('2e3'), 2000);
  assert.equal(calc('.5 + .5'), 1);
});

test('calculator: errors are clear and positioned', () => {
  const err = (s, re, o) => assert.throws(() => calc(s, o), (e) => e instanceof CalcError && re.test(e.message));
  err('1 / 0', /Division by zero/);
  err('5 mod 0', /Modulo by zero/);
  err('2 +', /incomplete/);
  err('(2 + 3', /Missing “\)”/);
  err('2 3', /Unexpected “3”/);
  err('sqrt(-1)', /negative/);
  err('log(0)', /positive/);
  err('foo(2)', /Unknown name “foo”/);
  err('sin 30', /needs brackets/);
  err('(-8) ^ (1/3)', /no real result/);
  err('171!', /too large/);
  err('2.5!', /whole number/);
  err('tan(90)', /undefined/);
  err('asin(2)', /between -1 and 1/);
  err('2 # 3', /Unexpected character “#”/);
  err('', /Enter an expression/);
  err('log(1,2,3)', /takes 1 or 2/);
  err('10^400', /too large/);
  const e = (() => { try { calc('1 + foo'); } catch (x) { return x; } })();
  assert.equal(e.position, 4);
});

/* ---------- parsing & formatting ---------- */

test('parseNumber and fmt', () => {
  assert.equal(parseNumber('1,234.5'), 1234.5);
  assert.equal(parseNumber(' −5 '), -5);
  assert.equal(parseNumber('1e3'), 1000);
  assert.equal(parseNumber(''), null);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('1.2.3')));
  assert.equal(fmt(1 / 3), '0.333333333333');
  assert.equal(fmt(1e25), '1e25');
  assert.equal(fmt(1.5e-12), '1.5e-12');
  assert.equal(fmt(-0), '0');
  assert.equal(fmt(NaN), '—');
  assert.equal(fmt(12345678901234567890n), '12345678901234567890');
});

/* ---------- percentages ---------- */

test('percentages', () => {
  assert.equal(percentOf(15, 200), 30);
  assert.equal(whatPercent(30, 200), 15);
  assert.equal(percentChange(80, 100), 25);
  assert.equal(percentChange(100, 80), -20);
  assert.equal(percentChange(-50, -25), 50);
  assert.equal(percentDifference(80, 100), 22.22222222222222);
  assert.equal(percentDifference(0, 0), 0);
  close(increaseBy(1000, 18), 1180);
  assert.equal(decreaseBy(1000, 10), 900);
  close(reversePercent(1180, 18), 1000);
  assert.throws(() => whatPercent(1, 0), RangeError);
  assert.throws(() => percentChange(0, 5), RangeError);
});

/* ---------- integers ---------- */

test('gcd, lcm and Euclid steps', () => {
  assert.equal(gcd(48, 36), 12n);
  assert.equal(gcd(-48, 36), 12n);
  assert.equal(gcd(0, 5), 5n);
  assert.equal(lcm(4, 6), 12n);
  assert.equal(lcm(0, 6), 0n);
  assert.equal(gcdAll([12n, 18n, 24n]), 6n);
  assert.equal(lcmAll([2n, 3n, 4n, 5n]), 60n);
  assert.equal(lcmAll([12345678901234567n, 98765432109876543n]), 12345678901234567n * 98765432109876543n / gcd(12345678901234567n, 98765432109876543n));
  const steps = euclidSteps(48, 36);
  assert.deepEqual(steps.map((s) => [s.a, s.q, s.b, s.r]), [[48n, 1n, 36n, 12n], [36n, 3n, 12n, 0n]]);
  assert.equal(parseInteger('1,000'), 1000n);
  assert.equal(parseInteger('1.5'), null);
});

test('factorial', () => {
  assert.equal(factorialBig(0), 1n);
  assert.equal(factorialBig(20), 2432902008176640000n);
  assert.equal(factorialBig(25).toString(), '15511210043330985984000000');
  assert.equal(factorialBig(1000).toString().length, 2568);
  assert.equal(factorialTrailingZeros(1000), 249);
  assert.equal(factorialTrailingZeros(100), 24);
  assert.equal(scientific(factorialBig(100)), '9.33262 × 10^157');
  assert.equal(scientific(120n), '120');
  assert.throws(() => factorialBig(-1), RangeError);
  assert.throws(() => factorialBig(10001), RangeError);
});

test('primes', () => {
  const small = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  for (let n = 0; n < 50; n++) assert.equal(isPrime(n), small.includes(n), `isPrime(${n})`);
  assert.equal(isPrime(2147483647n), true);
  assert.equal(isPrime(561n), false, 'Carmichael number');
  assert.equal(isPrime(3215031751n), false, 'strong pseudoprime to bases 2, 3, 5, 7');
  assert.equal(isPrime(1000000000000000003n), true);
  assert.equal(isPrime(999999999999999989n * 1n), true);
  assert.deepEqual(factorize(360).map((f) => [f.prime, f.power]), [[2n, 3], [3n, 2], [5n, 1]]);
  assert.deepEqual(factorize(1), []);
  assert.deepEqual(factorize(97).map((f) => f.prime), [97n]);
  const semi = 1000003n * 999983n;
  assert.deepEqual(factorize(semi).map((f) => f.prime), [999983n, 1000003n]);
  assert.equal(divisorCount(factorize(360)), 24);
  assert.equal(nextPrime(13), 17n);
  assert.equal(nextPrime(1), 2n);
  assert.equal(previousPrime(13), 11n);
  assert.equal(previousPrime(3), 2n);
  assert.equal(previousPrime(2), null);
  assert.deepEqual(primesBetween(10, 30), [11, 13, 17, 19, 23, 29]);
  assert.equal(primesBetween(1, 1000000).length, 78498);
  assert.throws(() => primesBetween(1, 10_000_001), RangeError);
  assert.throws(() => factorize(10n ** 25n), RangeError);
});

/* ---------- fractions & ratios ---------- */

test('fractions', () => {
  assert.deepEqual(parseFraction('6/8'), { n: 3n, d: 4n });
  assert.deepEqual(parseFraction('-1 1/2'), { n: -3n, d: 2n });
  assert.deepEqual(parseFraction('0.75'), { n: 3n, d: 4n });
  assert.deepEqual(parseFraction('-.5'), { n: -1n, d: 2n });
  assert.deepEqual(parseFraction('3/-6'), { n: -1n, d: 2n });
  assert.deepEqual(parseFraction('4'), { n: 4n, d: 1n });
  assert.throws(() => parseFraction('1/0'), RangeError);
  assert.throws(() => parseFraction('abc'), SyntaxError);
  const half = parseFraction('1/2');
  const third = parseFraction('1/3');
  assert.equal(formatFraction(fractionOp(half, '+', third)), '5/6');
  assert.equal(formatFraction(fractionOp(half, '-', third)), '1/6');
  assert.equal(formatFraction(fractionOp(half, '*', third)), '1/6');
  assert.equal(formatFraction(fractionOp(half, '/', third)), '3/2');
  assert.throws(() => fractionOp(half, '/', parseFraction('0')), RangeError);
  assert.equal(toMixed(parseFraction('7/3')), '2 1/3');
  assert.equal(toMixed(parseFraction('-7/3')), '-2 1/3');
  assert.equal(toMixed(parseFraction('2/3')), '2/3');
  assert.equal(toDecimalString(parseFraction('1/3')), '0.(3)');
  assert.equal(toDecimalString(parseFraction('1/7')), '0.(142857)');
  assert.equal(toDecimalString(parseFraction('1/6')), '0.1(6)');
  assert.equal(toDecimalString(parseFraction('3/8')), '0.375');
  assert.equal(toDecimalString(parseFraction('-5/2')), '-2.5');
  assert.equal(formatFraction(approximateFraction(0.333333)), '1/3');
  assert.equal(formatFraction(approximateFraction(Math.PI, 1000)), '355/113');
  assert.equal(formatFraction(approximateFraction(-0.75)), '-3/4');
  assert.equal(formatFraction(approximateFraction(2)), '2');
});

test('ratios', () => {
  assert.deepEqual(simplifyRatio([4, 6]), [2n, 3n]);
  assert.deepEqual(simplifyRatio([1.5, 2.5]), [3n, 5n]);
  assert.deepEqual(simplifyRatio([10, 20, 30]), [1n, 2n, 3n]);
  assert.deepEqual(simplifyRatio([0, 5]), [0n, 1n]);
  assert.throws(() => simplifyRatio([0, 0]), RangeError);
  assert.throws(() => simplifyRatio([3]), RangeError);
  assert.equal(solveProportion(2, 3, 8), 12);
  assert.throws(() => solveProportion(0, 3, 8), RangeError);
  assert.deepEqual(divideInRatio(1000, [2, 3]), [400, 600]);
  assert.deepEqual(divideInRatio(90, [1, 1, 1]), [30, 30, 30]);
});

/* ---------- statistics ---------- */

test('statistics', () => {
  const { numbers, invalid } = parseNumberList('2, 4 4;4\n5 5 7 9 abc');
  assert.deepEqual(numbers, [2, 4, 4, 4, 5, 5, 7, 9]);
  assert.deepEqual(invalid, ['abc']);
  const s = describe(numbers);
  assert.equal(s.count, 8);
  assert.equal(s.sum, 40);
  assert.equal(s.mean, 5);
  assert.equal(s.median, 4.5);
  assert.deepEqual(s.modes, [4]);
  assert.equal(s.sdPopulation, 2);
  close(s.sdSample, 2.138089935299395);
  assert.equal(s.variancePopulation, 4);
  assert.equal(s.range, 7);
  assert.equal(s.q1, 4);
  assert.equal(s.q3, 5.5);
  close(describe([1, 2, 4, 8]).geometricMean, 2.8284271247461903);
  assert.ok(Number.isNaN(describe([-1, 2]).geometricMean));
  assert.deepEqual(describe([1, 2, 3]).modes, [], 'no mode when nothing repeats');
  assert.deepEqual(describe([1, 1, 2, 2, 3]).modes, [1, 2]);
  assert.ok(Number.isNaN(describe([5]).sdSample));
  assert.equal(quantile([1, 2, 3, 4], 0.25), 1.75);
  assert.throws(() => describe([]), RangeError);
  close(describe(Array(1e5).fill(0.1)).sum, 1e4, 1e-12);
});

/* ---------- bases & roman ---------- */

test('number bases', () => {
  assert.equal(parseInBase('ff', 16), 255n);
  assert.equal(parseInBase('0xFF', 16), 255n);
  assert.equal(parseInBase('0b1010', 2), 10n);
  assert.equal(parseInBase('1111 1111', 2), 255n);
  assert.equal(parseInBase('-777', 8), -511n);
  assert.equal(parseInBase('zz', 36), 1295n);
  assert.equal(parseInBase('123456789012345678901234567890', 10).toString(16), '18ee90ff6c373e0ee4e3f0ad2');
  assert.throws(() => parseInBase('12', 2), /not a valid digit in base 2/);
  assert.throws(() => parseInBase('', 10), SyntaxError);
  assert.throws(() => parseInBase('1', 37), RangeError);
  assert.equal(toBase(255n, 2), '11111111');
  assert.equal(toBase(-255n, 16), '-ff');
  assert.equal(groupDigits('11111111'), '1111 1111');
  assert.equal(groupDigits('1234567', 3, ','), '1,234,567');
  assert.equal(twosComplement(-1n, 8), '11111111');
  assert.equal(twosComplement(-128n, 8), '10000000');
  assert.equal(twosComplement(-129n, 8), null);
  assert.equal(twosComplement(5n, 8), '00000101');
});

test('roman numerals', () => {
  const pairs = [[1, 'I'], [4, 'IV'], [9, 'IX'], [14, 'XIV'], [40, 'XL'], [90, 'XC'], [400, 'CD'], [1994, 'MCMXCIV'], [2026, 'MMXXVI'], [3999, 'MMMCMXCIX']];
  for (const [n, r] of pairs) {
    assert.equal(toRoman(n), r);
    assert.equal(fromRoman(r), n);
  }
  for (let n = 1; n <= 3999; n++) assert.equal(fromRoman(toRoman(n)), n);
  assert.equal(fromRoman(' mcmxciv '), 1994);
  assert.throws(() => toRoman(0), RangeError);
  assert.throws(() => toRoman(4000), RangeError);
  assert.throws(() => toRoman(1.5), RangeError);
  assert.throws(() => fromRoman('IIII'), /standard form/);
  assert.throws(() => fromRoman('VX'), /standard form/);
  assert.throws(() => fromRoman('ABC'), /only use/);
});

/* ---------- random ---------- */

test('secure random numbers', () => {
  for (let i = 0; i < 2000; i++) {
    const v = randomInt(-3, 3);
    assert.ok(Number.isInteger(v) && v >= -3 && v <= 3);
  }
  assert.equal(randomInt(5, 5), 5);
  const counts = new Array(6).fill(0);
  for (let i = 0; i < 60000; i++) counts[randomInt(1, 6) - 1]++;
  for (const c of counts) assert.ok(c > 9000 && c < 11000, `die roll counts look biased: ${counts}`);
  const uniq = randomIntegers({ min: 1, max: 10, count: 10, unique: true });
  assert.deepEqual([...uniq].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.throws(() => randomIntegers({ min: 1, max: 5, count: 6, unique: true }), RangeError);
  assert.throws(() => randomInt(5, 1), RangeError);
  const decimals = randomDecimals({ min: 0, max: 1, count: 100, places: 3 });
  assert.ok(decimals.every((d) => d >= 0 && d <= 1 && Math.round(d * 1000) === d * 1000));
});

/* ---------- units ---------- */

test('unit conversions match reference values', () => {
  const c = (v, cat, a, b) => convertUnit(v, cat, a, b);
  close(c(1, 'length', 'in', 'cm'), 2.54);
  close(c(1, 'length', 'mi', 'km'), 1.609344);
  close(c(1, 'length', 'ft', 'in'), 12);
  close(c(5280, 'length', 'ft', 'mi'), 1);
  close(c(1, 'length', 'nmi', 'm'), 1852);
  close(c(1, 'mass', 'lb', 'g'), 453.59237);
  close(c(1, 'mass', 'kg', 'lb'), 2.2046226218487757);
  close(c(14, 'mass', 'lb', 'st'), 1);
  close(c(16, 'mass', 'oz', 'lb'), 1);
  close(c(1, 'mass', 'tola', 'g'), 11.6638038);
  close(c(0, 'temperature', 'c', 'f'), 32);
  close(c(100, 'temperature', 'c', 'f'), 212);
  close(c(-40, 'temperature', 'c', 'f'), -40);
  close(c(98.6, 'temperature', 'f', 'c'), 37);
  close(c(0, 'temperature', 'k', 'c'), -273.15);
  close(c(491.67, 'temperature', 'r', 'f'), 32);
  assert.throws(() => c(-300, 'temperature', 'c', 'k'), /absolute zero/);
  close(c(1, 'area', 'acre', 'm2'), 4046.8564224);
  close(c(1, 'area', 'ha', 'acre'), 2.471053814671653);
  close(c(1, 'area', 'ft2', 'in2'), 144);
  close(c(1, 'volume', 'gal', 'l'), 3.785411784);
  close(c(1, 'volume', 'gal-uk', 'l'), 4.54609);
  close(c(1, 'volume', 'cup', 'tbsp'), 16);
  close(c(1, 'volume', 'tbsp', 'tsp'), 3);
  close(c(1, 'volume', 'l', 'ml'), 1000);
  close(c(100, 'speed', 'kmh', 'mps'), 27.77777777777778);
  close(c(60, 'speed', 'mph', 'kmh'), 96.56064);
  close(c(1, 'speed', 'kn', 'kmh'), 1.852);
  close(c(1, 'time', 'd', 'h'), 24);
  close(c(1, 'time', 'yr', 'd'), 365.2425);
  close(c(1, 'time', 'wk', 'min'), 10080);
  close(c(1, 'data', 'GiB', 'MiB'), 1024);
  close(c(1, 'data', 'GB', 'MB'), 1000);
  close(c(1, 'data', 'GB', 'GiB'), 0.9313225746154785);
  close(c(100, 'data', 'Mbit', 'MB'), 12.5);
  close(c(1, 'data', 'B', 'bit'), 8);
  close(c(1, 'pressure', 'atm', 'kpa'), 101.325);
  close(c(1, 'pressure', 'bar', 'psi'), 14.503773773020923);
  close(c(760, 'pressure', 'mmhg', 'atm'), 1, 1e-6);
  close(c(1, 'pressure', 'atm', 'torr'), 760);
  close(c(1, 'energy', 'kwh', 'mj'), 3.6);
  close(c(1, 'energy', 'kcal', 'kj'), 4.184);
  close(c(1, 'energy', 'btu', 'j'), 1055.05585262);
  close(c(1, 'energy', 'wh', 'j'), 3600);
  close(conversionFactor('length', 'ft', 'm'), 0.3048);
  assert.equal(conversionFactor('temperature', 'c', 'f'), null);
});

test('unit tables are consistent and round-trip', () => {
  for (const cat of UNIT_CATEGORIES) {
    const ids = cat.units.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate unit in ${cat.id}`);
    for (const a of cat.units) {
      for (const b of cat.units) {
        const there = convertUnit(123.456, cat.id, a.id, b.id);
        close(convertUnit(there, cat.id, b.id, a.id), 123.456, 1e-9);
      }
    }
  }
});
