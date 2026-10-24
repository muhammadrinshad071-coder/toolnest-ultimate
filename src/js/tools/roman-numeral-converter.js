import { toRoman, fromRoman, parseNumber } from '../lib/math.js';
import { h, card, textInput, resultRows, tableView, setInvalid } from '../ui/toolkit.js';

export function mount(container) {
  const number = textInput({ label: 'Number (1–3,999)', value: '2026', attrs: { inputmode: 'numeric' } });
  const toRows = resultRows({ empty: 'Enter a number from 1 to 3,999.' });
  const roman = textInput({ label: 'Roman numeral', value: 'MCMXCIV', mono: true, attrs: { autocapitalize: 'characters' } });
  const fromRows = resultRows({ empty: 'Enter a Roman numeral such as XIV.' });

  const updateTo = () => {
    const v = parseNumber(number.el.value);
    if (v === null) { toRows.set([]); setInvalid(number.el, false); return; }
    try {
      if (Number.isNaN(v)) throw new RangeError('Enter a whole number.');
      const r = toRoman(v);
      setInvalid(number.el, false);
      toRows.set([{ label: 'Roman numeral', value: r, emphasis: true }]);
    } catch (err) {
      setInvalid(number.el, true);
      toRows.set([{ label: 'Problem', value: err.message, mono: false, copy: false }]);
    }
  };

  const updateFrom = () => {
    if (!roman.el.value.trim()) { fromRows.set([]); setInvalid(roman.el, false); return; }
    try {
      const n = fromRoman(roman.el.value);
      setInvalid(roman.el, false);
      fromRows.set([{ label: 'Number', value: n.toLocaleString(), emphasis: true }]);
    } catch (err) {
      setInvalid(roman.el, true);
      fromRows.set([{ label: 'Problem', value: err.message, mono: false, copy: false }]);
    }
  };

  number.el.addEventListener('input', updateTo);
  roman.el.addEventListener('input', updateFrom);

  container.append(
    h('div', { class: 'calc-grid' },
      card({ title: 'Number → Roman', children: [number.field, toRows.el] }),
      card({ title: 'Roman → Number', description: 'Checks that the numeral is written in standard form.', children: [roman.field, fromRows.el] }),
      card({
        title: 'Symbols',
        description: 'A smaller symbol before a larger one is subtracted: IV = 4, IX = 9, XL = 40, XC = 90, CD = 400, CM = 900.',
        children: [tableView(
          [{ key: 's', label: 'Symbol' }, { key: 'v', label: 'Value', num: true }],
          [['I', 1], ['V', 5], ['X', 10], ['L', 50], ['C', 100], ['D', 500], ['M', 1000]].map(([s, v]) => ({ s, v: v.toLocaleString() }))
        )]
      })
    )
  );
  updateTo();
  updateFrom();
}
