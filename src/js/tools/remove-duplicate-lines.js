import { removeDuplicateLines } from '../lib/text.js';
import {
  h, panel, textArea, checkbox, choiceGroup, actionBar, tableView,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, formatNumber, plural
} from '../ui/toolkit.js';

const REPORT_LIMIT = 100;

const EXAMPLES = [
  { label: 'Email list', value: 'asha@example.com\nben@example.com\nAsha@Example.com\ncarla@example.com\nben@example.com\n  dev@example.com\ndev@example.com', ignoreCase: true },
  { label: 'Shopping list', value: 'Milk\nBread\nEggs\nmilk\nApples\nBread\n\nEggs\nRice\n\nApples' },
  { label: 'Log lines', value: 'ERROR Disk almost full\nINFO Backup started\nERROR Disk almost full\nWARN Slow response\nINFO Backup started\nERROR Disk almost full' }
];

export function mount(container) {
  const input = textArea({ label: 'Lines to clean', placeholder: 'Paste a list with one item per line…', rows: 14, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Unique lines', rows: 14, mono: true, readOnly: true, labelHidden: true, placeholder: 'Unique lines appear here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const ignoreCase = checkbox({ label: 'Ignore letter case', onChange: () => update() });
  const trim = checkbox({ label: 'Ignore spaces at line ends', checked: true, onChange: () => update() });
  const removeEmpty = checkbox({ label: 'Remove empty lines', checked: true, onChange: () => update() });
  const keep = choiceGroup({
    legend: 'When a line repeats, keep the',
    options: [{ id: 'first', label: 'First copy' }, { id: 'last', label: 'Last copy' }],
    value: 'first',
    onChange: () => update()
  });

  const reportSlot = h('div', {});
  const report = h('details', { class: 'disclosure' }, h('summary', { text: 'Duplicate report' }), h('div', { class: 'disclosure__body' }, reportSlot));
  report.addEventListener('toggle', () => renderReport());
  let result = removeDuplicateLines('');

  function renderReport() {
    if (!report.open) return;
    const dups = result.duplicates;
    if (!dups.length) {
      reportSlot.replaceChildren(h('p', { class: 'muted', text: input.el.value ? 'No repeated lines found.' : 'Paste some lines to see which ones repeat.' }));
      return;
    }
    reportSlot.replaceChildren(
      tableView(
        [{ key: 'line', label: 'Line', className: 'cell-text' }, { key: 'count', label: 'Times', num: true }],
        dups.slice(0, REPORT_LIMIT).map((d) => ({ line: d.line === '' ? '(empty line)' : d.line, count: formatNumber(d.count) }))
      ),
      dups.length > REPORT_LIMIT ? h('p', { class: 'field__hint', text: `Showing the ${REPORT_LIMIT} most repeated of ${formatNumber(dups.length)} duplicated lines.` }) : null
    );
  }

  function update() {
    result = removeDuplicateLines(input.el.value, {
      ignoreCase: ignoreCase.input.checked,
      trim: trim.input.checked,
      removeEmpty: removeEmpty.input.checked,
      keep: keep.value
    });
    output.el.value = result.output;
    meta.textContent = input.el.value
      ? `${plural(result.total, 'line')} → ${formatNumber(result.kept)} kept · ${formatNumber(result.removed)} removed`
      : '';
    report.querySelector('summary').textContent = result.duplicates.length
      ? `Duplicate report (${plural(result.duplicates.length, 'repeated line')})`
      : 'Duplicate report';
    renderReport();
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'options' }, ignoreCase.el, trim.el, removeEmpty.el),
      keep.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original list',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; ignoreCase.input.checked = Boolean(ex.ignoreCase); update(); })]
        }),
        panel({
          title: 'Unique lines',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'unique-lines.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      ),
      report
    )
  );
  update();
}
