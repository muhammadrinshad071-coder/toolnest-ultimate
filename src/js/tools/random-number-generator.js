import { randomIntegers, randomDecimals, parseNumber, RANDOM_MAX_COUNT } from '../lib/math.js';
import { h, panel, numberInput, checkbox, choiceGroup, actionBar, button, statusLine, copyButton, downloadButton, examples, formatNumber, setInvalid } from '../ui/toolkit.js';

const PRESETS = [
  { label: 'Roll a die', min: 1, max: 6, count: 1, type: 'int' },
  { label: 'Two dice', min: 1, max: 6, count: 2, type: 'int' },
  { label: 'Lottery 6 of 49', min: 1, max: 49, count: 6, type: 'int', unique: true, sort: true },
  { label: 'PIN (4 digits)', min: 0, max: 9, count: 4, type: 'int' },
  { label: 'Percent 0–100', min: 0, max: 100, count: 1, type: 'dec', places: 2 }
];

export function mount(container) {
  const min = numberInput({ label: 'Minimum', value: '1' });
  const max = numberInput({ label: 'Maximum', value: '100' });
  const count = numberInput({ label: 'How many', value: '1', hint: `Up to ${formatNumber(RANDOM_MAX_COUNT)}.` });
  const type = choiceGroup({ legend: 'Type', options: [{ id: 'int', label: 'Whole numbers' }, { id: 'dec', label: 'Decimals' }], value: 'int', onChange: () => syncType() });
  const places = numberInput({ label: 'Decimal places', value: '2' });
  const unique = checkbox({ label: 'No repeats' });
  const sort = checkbox({ label: 'Sort the results' });
  const status = statusLine();
  const big = h('div', { class: 'big-result', 'aria-live': 'polite' });
  const list = h('pre', { class: 'mono-list' });
  let values = [];

  function syncType() {
    const dec = type.value === 'dec';
    places.field.hidden = !dec;
    unique.el.hidden = dec;
  }

  function generate() {
    status.clear();
    const read = (f) => {
      const v = parseNumber(f.el.value);
      setInvalid(f.el, v === null || Number.isNaN(v));
      return v;
    };
    const lo = read(min);
    const hi = read(max);
    const n = read(count);
    try {
      if ([lo, hi, n].some((v) => v === null || Number.isNaN(v))) throw new RangeError('Fill in every field with a number.');
      if (lo > hi) throw new RangeError('The minimum must not be above the maximum.');
      if (type.value === 'int') {
        if (!Number.isInteger(lo) || !Number.isInteger(hi)) throw new RangeError('For whole numbers, use whole minimum and maximum values.');
        values = randomIntegers({ min: lo, max: hi, count: n, unique: unique.input.checked });
      } else {
        values = randomDecimals({ min: lo, max: hi, count: n, places: parseNumber(places.el.value) });
      }
      if (sort.input.checked) values.sort((a, b) => a - b);
      big.textContent = values.length <= 10 ? values.join(', ') : `${formatNumber(values.length)} numbers`;
      list.textContent = values.join('\n');
      list.hidden = values.length <= 10;
    } catch (err) {
      values = [];
      big.textContent = '';
      list.textContent = '';
      status.show('error', err.message);
    }
  }

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Settings',
        children: [
          h('div', { class: 'input-row' }, min.field, max.field),
          h('div', { class: 'input-row' }, count.field, places.field),
          type.el,
          h('div', { class: 'options' }, unique.el, sort.el),
          examples(PRESETS, (p) => {
            min.el.value = String(p.min);
            max.el.value = String(p.max);
            count.el.value = String(p.count);
            type.set(p.type);
            places.el.value = String(p.places ?? 2);
            unique.input.checked = Boolean(p.unique);
            sort.input.checked = Boolean(p.sort);
            syncType();
            generate();
          }),
          actionBar(button({ label: 'Generate', iconName: 'sparkle', variant: 'primary', size: 'md', onClick: generate }))
        ]
      }),
      panel({
        title: 'Result',
        actions: actionBar(
          copyButton(() => values.join('\n'), { emptyMessage: 'Generate some numbers first.' }),
          downloadButton(() => values.join('\n'), { filename: 'random-numbers.txt', emptyMessage: 'Generate some numbers first.' })
        ),
        children: [status.el, big, list, h('p', { class: 'field__hint', text: 'Numbers come from your browser’s cryptographic random generator (crypto.getRandomValues) with rejection sampling, so every value in the range is equally likely.' })]
      })
    )
  );
  syncType();
  generate();
}
