import { parseInteger, gcdAll, lcmAll, euclidSteps } from '../lib/math.js';
import { h, card, textInput, resultRows, examples } from '../ui/toolkit.js';

const MAX_NUMBERS = 100;

const EXAMPLES = [
  { label: 'Two numbers', value: '48, 180' },
  { label: 'Bus timetables', value: '12 15 20' },
  { label: 'Large numbers', value: '123456789012, 987654321098' }
];

export function mount(container) {
  const input = textInput({ label: 'Whole numbers', value: '48, 180', placeholder: 'e.g. 12, 18, 30', hint: 'Separate numbers with commas or spaces. Negative numbers use their size.' });
  const rows = resultRows({ empty: 'Enter at least two whole numbers.' });
  const steps = h('pre', { class: 'code-block' });
  const stepsBox = h('details', { class: 'disclosure' }, h('summary', { text: 'Step-by-step (Euclid’s algorithm)' }), h('div', { class: 'disclosure__body' }, steps));

  function update() {
    const tokens = input.el.value.split(/[\s,;]+/).filter(Boolean);
    const numbers = tokens.map(parseInteger);
    stepsBox.hidden = true;
    if (numbers.length < 2) {
      rows.set(tokens.length ? [{ label: 'Problem', value: 'Enter at least two whole numbers.', mono: false, copy: false }] : []);
      return;
    }
    const bad = tokens.find((t, i) => numbers[i] === null);
    if (bad) {
      rows.set([{ label: 'Problem', value: `“${bad}” is not a whole number.`, mono: false, copy: false }]);
      return;
    }
    if (numbers.length > MAX_NUMBERS) {
      rows.set([{ label: 'Problem', value: `Use up to ${MAX_NUMBERS} numbers.`, mono: false, copy: false }]);
      return;
    }
    const g = gcdAll(numbers);
    const l = lcmAll(numbers);
    rows.set([
      { label: 'GCD (HCF)', value: g.toString(), emphasis: true, note: 'Greatest common divisor, also called highest common factor' },
      { label: 'LCM', value: l.toString(), emphasis: true, note: numbers.includes(0n) ? 'The LCM is 0 when any number is 0.' : 'Least common multiple' },
      ...(g === 1n ? [{ label: 'Note', value: 'These numbers are coprime (they share no factor except 1).', mono: false, copy: false }] : [])
    ]);
    if (numbers.length === 2) {
      const list = euclidSteps(numbers[0], numbers[1]);
      if (list.length) {
        steps.textContent = `${list.map((s) => `${s.a} = ${s.q} × ${s.b} + ${s.r}`).join('\n')}\n\nThe last non-zero remainder is the GCD: ${g}.\nLCM = |a × b| ÷ GCD = ${l}.`;
        stepsBox.hidden = false;
      }
    }
  }

  input.el.addEventListener('input', update);

  container.append(
    h('div', { class: 'tool-stack' },
      card({ title: 'GCD and LCM', children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; update(); }), rows.el, stepsBox] })
    )
  );
  update();
}
