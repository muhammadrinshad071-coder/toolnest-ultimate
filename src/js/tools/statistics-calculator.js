import { parseNumberList, describe, fmt } from '../lib/math.js';
import { h, panel, textArea, actionBar, statusLine, resultRows, clearButton, copyButton, examples, liveUpdater, formatNumber } from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Test scores', value: '72, 85, 90, 66, 85, 78, 92, 85, 70, 88' },
  { label: 'Daily temperatures', value: '31.2 33.5 29.8 34.1 35.0 32.7 30.9' },
  { label: 'Pasted column', value: '1200\n1350\n980\n1500\n1100\n1350\n1275' }
];

export function mount(container) {
  const input = textArea({ label: 'Numbers', placeholder: 'Paste or type numbers separated by commas, spaces or new lines…', rows: 8, mono: true, labelHidden: true, spellcheck: false });
  const status = statusLine();
  const rows = resultRows({ empty: 'Enter at least one number.' });
  const sortedOut = h('pre', { class: 'mono-list' });
  let summary = '';

  function update() {
    const { numbers, invalid } = parseNumberList(input.el.value);
    status.clear();
    if (invalid.length) {
      status.show('warn', `Ignored ${invalid.length === 1 ? 'one entry that is' : `${formatNumber(invalid.length)} entries that are`} not a number: ${invalid.slice(0, 5).map((t) => `“${t}”`).join(', ')}${invalid.length > 5 ? '…' : ''}`);
    }
    if (!numbers.length) {
      rows.set([]);
      sortedOut.textContent = '';
      summary = '';
      return;
    }
    const s = describe(numbers);
    const data = [
      { label: 'Count', value: fmt(s.count) },
      { label: 'Mean (average)', value: fmt(s.mean), emphasis: true },
      { label: 'Median', value: fmt(s.median) },
      { label: 'Mode', value: s.modes.length ? s.modes.map((m) => fmt(m)).join(', ') : 'None', note: s.modes.length ? `Appears ${s.modeCount} times` : 'No value repeats' },
      { label: 'Sum', value: fmt(s.sum) },
      { label: 'Minimum', value: fmt(s.min) },
      { label: 'Maximum', value: fmt(s.max) },
      { label: 'Range', value: fmt(s.range) },
      { label: 'Std. deviation (sample)', value: fmt(s.sdSample), note: 'Use when your numbers are a sample of a larger group (n − 1).' },
      { label: 'Std. deviation (population)', value: fmt(s.sdPopulation), note: 'Use when your numbers are the whole group (n).' },
      { label: 'Variance (sample)', value: fmt(s.varianceSample) },
      { label: 'Variance (population)', value: fmt(s.variancePopulation) },
      { label: 'Lower quartile (Q1)', value: fmt(s.q1) },
      { label: 'Upper quartile (Q3)', value: fmt(s.q3) },
      { label: 'Interquartile range', value: fmt(s.iqr) },
      { label: 'Geometric mean', value: Number.isNaN(s.geometricMean) ? '—' : fmt(s.geometricMean), note: Number.isNaN(s.geometricMean) ? 'Only defined when every number is positive.' : '' }
    ];
    rows.set(data);
    summary = data.map((r) => `${r.label}: ${r.value}`).join('\n');
    sortedOut.textContent = s.sorted.slice(0, 5000).map((v) => fmt(v)).join(', ') + (s.sorted.length > 5000 ? ' …' : '');
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Your numbers',
        actions: actionBar(clearButton([input.el], { onChange: update })),
        children: [
          input.field,
          examples(EXAMPLES, (ex) => { input.el.value = ex.value; update(); }),
          status.el,
          h('details', { class: 'disclosure' }, h('summary', { text: 'Sorted values' }), h('div', { class: 'disclosure__body' }, sortedOut))
        ]
      }),
      panel({
        title: 'Statistics',
        actions: actionBar(copyButton(() => summary, { label: 'Copy all', emptyMessage: 'Enter some numbers first.' })),
        children: [rows.el, h('p', { class: 'field__hint', text: 'Quartiles use linear interpolation, the same method as Excel’s QUARTILE.INC and Google Sheets’ QUARTILE.' })]
      })
    )
  );
  update();
}
