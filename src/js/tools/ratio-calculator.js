import { simplifyRatio, solveProportion, divideInRatio, parseNumber, fmt } from '../lib/math.js';
import { liveCard } from '../ui/calc-card.js';
import { h, card, textInput, numberInput, resultRows, setInvalid } from '../ui/toolkit.js';

function parseRatio(text) {
  const parts = String(text).split(/\s*[:/]\s*|\s+to\s+/i).filter((p) => p.trim() !== '');
  const values = parts.map(parseNumber);
  if (values.length < 2 || values.some((v) => v === null || Number.isNaN(v))) {
    throw new SyntaxError('Write the ratio with colons, for example 16:9 or 2:3:5.');
  }
  return values;
}

export function mount(container) {
  // Simplify
  const ratio = textInput({ label: 'Ratio', value: '1920:1080', placeholder: 'e.g. 16:9 or 2.5:7.5:10' });
  const simplified = resultRows({ empty: 'Enter a ratio such as 16:9.' });
  const updateSimplify = () => {
    try {
      const values = parseRatio(ratio.el.value);
      setInvalid(ratio.el, false);
      const simple = simplifyRatio(values);
      const sum = values.reduce((s, v) => s + v, 0);
      simplified.set([
        { label: 'Simplest form', value: simple.join(' : '), emphasis: true },
        { label: 'As shares', value: values.map((v) => `${fmt((v / sum) * 100, 6)}%`).join(' : ') },
        ...(values.length === 2 && values[1] !== 0 ? [{ label: 'As one number', value: `${fmt(values[0] / values[1], 8)} : 1` }] : [])
      ]);
    } catch (err) {
      setInvalid(ratio.el, Boolean(ratio.el.value.trim()));
      simplified.set(ratio.el.value.trim() ? [{ label: 'Problem', value: err.message, mono: false, copy: false }] : []);
    }
  };
  ratio.el.addEventListener('input', updateSimplify);
  updateSimplify();

  // Proportion
  const proportion = liveCard({
    title: 'Solve a proportion',
    description: 'Find the missing value so both ratios are equal — useful for scaling recipes and maps.',
    parts: [{ key: 'a', label: 'A', value: '2' }, ':', { key: 'b', label: 'B', value: '3' }, '=', { key: 'c', label: 'C', value: '8' }, ': x'],
    compute: ({ a, b, c }) => ({ result: `x = ${fmt(solveProportion(a, b, c))}`, formula: `x = ${fmt(b)} × ${fmt(c)} ÷ ${fmt(a)}` })
  });

  // Divide in a ratio
  const total = numberInput({ label: 'Total amount', value: '1000' });
  const split = textInput({ label: 'Ratio', value: '2:3', placeholder: 'e.g. 2:3 or 1:1:2' });
  const shares = resultRows({ empty: 'Enter a total and a ratio.' });
  const updateShares = () => {
    const t = parseNumber(total.el.value);
    setInvalid(total.el, Number.isNaN(t));
    try {
      if (t === null || Number.isNaN(t)) throw new SyntaxError('Enter the total as a number.');
      const parts = parseRatio(split.el.value);
      setInvalid(split.el, false);
      shares.set(divideInRatio(t, parts).map((v, i) => ({ label: `Part ${i + 1} (${fmt(parts[i])})`, value: fmt(v), emphasis: i === 0 })));
    } catch (err) {
      shares.set([{ label: 'Problem', value: err.message, mono: false, copy: false }]);
    }
  };
  total.el.addEventListener('input', updateShares);
  split.el.addEventListener('input', updateShares);
  updateShares();

  container.append(
    h('div', { class: 'calc-grid' },
      card({ title: 'Simplify a ratio', description: 'Works with two or more parts and with decimals.', children: [ratio.field, simplified.el] }),
      proportion.el,
      card({ title: 'Divide an amount in a ratio', description: 'For example, split a bill or profit 2:3.', children: [h('div', { class: 'input-row' }, total.field, split.field), shares.el] })
    )
  );
}
