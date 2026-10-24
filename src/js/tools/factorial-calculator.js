import { factorialBig, factorialTrailingZeros, scientific, FACTORIAL_LIMIT, parseNumber } from '../lib/math.js';
import { h, panel, numberInput, resultRows, actionBar, textArea, copyButton, downloadButton, debounce, formatNumber, setInvalid } from '../ui/toolkit.js';

export function mount(container) {
  const n = numberInput({ label: 'n', value: '25', hint: `Whole numbers from 0 to ${formatNumber(FACTORIAL_LIMIT)}.` });
  const rows = resultRows({ empty: 'Enter a whole number.' });
  const full = textArea({ label: 'Exact value', rows: 6, mono: true, readOnly: true, labelHidden: true, spellcheck: false });

  function update() {
    const v = parseNumber(n.el.value);
    full.el.value = '';
    if (v === null) { rows.set([]); setInvalid(n.el, false); return; }
    try {
      if (Number.isNaN(v)) throw new RangeError('Enter a whole number.');
      const big = factorialBig(v);
      setInvalid(n.el, false);
      const digits = big.toString();
      full.el.value = digits;
      rows.set([
        { label: `${v}!`, value: digits.length <= 40 ? digits : scientific(big, 10), emphasis: true },
        { label: 'Number of digits', value: formatNumber(digits.length) },
        { label: 'Trailing zeros', value: formatNumber(factorialTrailingZeros(v)) },
        { label: 'Meaning', value: v <= 1 ? `${v}! = 1 by definition` : `${v} × ${v - 1} × … × 2 × 1`, mono: false, copy: false }
      ]);
    } catch (err) {
      setInvalid(n.el, true);
      rows.set([{ label: 'Problem', value: err.message, mono: false, copy: false }]);
    }
  }

  n.el.addEventListener('input', debounce(update, 200));

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({ title: 'Factorial', children: [n.field, rows.el] }),
      panel({
        title: 'Exact value',
        actions: actionBar(
          copyButton(() => full.el.value, { emptyMessage: 'Enter a number first.' }),
          downloadButton(() => full.el.value, { filename: () => `factorial-${n.el.value.trim()}.txt`, emptyMessage: 'Enter a number first.' })
        ),
        children: [full.field, h('p', { class: 'field__hint', text: 'Every digit is exact — the calculation uses arbitrary-precision integers, not rounded floating-point numbers.' })]
      })
    )
  );
  update();
}
