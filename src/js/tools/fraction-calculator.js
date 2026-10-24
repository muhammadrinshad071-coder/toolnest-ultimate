import { parseFraction, fractionOp, formatFraction, toMixed, toDecimalString, approximateFraction, parseNumber, fmt } from '../lib/math.js';
import { h, card, resultRows, textInput, selectField } from '../ui/toolkit.js';

const OPS = [{ id: '+', label: '+' }, { id: '-', label: '−' }, { id: '*', label: '×' }, { id: '/', label: '÷' }];

function rowsFor(f) {
  return [
    { label: 'Simplified', value: formatFraction(f), emphasis: true },
    { label: 'Mixed number', value: toMixed(f) },
    { label: 'Decimal', value: toDecimalString(f), note: toDecimalString(f).includes('(') ? 'Digits in brackets repeat forever.' : '' },
    { label: 'Percent', value: `${fmt((Number(f.n) / Number(f.d)) * 100, 10)}%` }
  ];
}

function live(inputs, run, rows) {
  const update = () => {
    if (inputs.some((i) => !i.value.trim())) {
      rows.set([]);
      return;
    }
    try {
      rows.set(run());
    } catch (err) {
      rows.set([{ label: 'Problem', value: err.message, mono: false, copy: false }]);
    }
  };
  inputs.forEach((i) => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', update));
  update();
}

export function mount(container) {
  // Fraction arithmetic
  const a = textInput({ label: 'First fraction', value: '1 1/2', placeholder: 'e.g. 3/4 or 1 1/2' });
  const op = selectField({ label: 'Operation', options: OPS, value: '+' });
  const b = textInput({ label: 'Second fraction', value: '2/3', placeholder: 'e.g. 2/3' });
  const arithmetic = resultRows({ empty: 'Enter two fractions.' });
  live([a.el, op.el, b.el], () => rowsFor(fractionOp(parseFraction(a.el.value), op.el.value, parseFraction(b.el.value))), arithmetic);

  // Simplify
  const s = textInput({ label: 'Fraction', value: '42/56', placeholder: 'e.g. 42/56' });
  const simplified = resultRows({ empty: 'Enter a fraction.' });
  live([s.el], () => rowsFor(parseFraction(s.el.value)), simplified);

  // Decimal to fraction
  const d = textInput({ label: 'Decimal', value: '0.375', placeholder: 'e.g. 0.375 or 3.14159' });
  const maxDen = selectField({ label: 'Closest fraction with denominator up to', options: ['10', '100', '1000', '10000'].map((v) => ({ id: v, label: Number(v).toLocaleString() })), value: '1000' });
  const decimal = resultRows({ empty: 'Enter a decimal number.' });
  live([d.el, maxDen.el], () => {
    const exact = parseFraction(d.el.value);
    const n = parseNumber(d.el.value);
    const approx = approximateFraction(n, Number(maxDen.el.value));
    const approxValue = Number(approx.n) / Number(approx.d);
    return [
      { label: 'Exact fraction', value: formatFraction(exact), emphasis: true },
      { label: 'Mixed number', value: toMixed(exact) },
      { label: 'Closest simple fraction', value: formatFraction(approx), note: approxValue === n ? 'Exact match' : `= ${fmt(approxValue)} (off by ${fmt(Math.abs(approxValue - n))})` }
    ];
  }, decimal);

  container.append(
    h('div', { class: 'calc-grid' },
      card({
        title: 'Add, subtract, multiply or divide',
        description: 'Accepts fractions (3/4), mixed numbers (1 1/2), whole numbers and decimals.',
        children: [h('div', { class: 'input-row' }, a.field, op.field, b.field), arithmetic.el]
      }),
      card({ title: 'Simplify a fraction', children: [s.field, simplified.el] }),
      card({
        title: 'Decimal to fraction',
        description: 'Finds the exact fraction and the closest fraction with a small denominator — handy for 0.333 → 1/3.',
        children: [h('div', { class: 'input-row' }, d.field, maxDen.field), decimal.el]
      })
    )
  );
}
