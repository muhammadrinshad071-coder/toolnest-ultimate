import { numberLines, removeLineNumbers, NUMBER_SEPARATORS, splitLines } from '../lib/text.js';
import {
  h, panel, textArea, textInput, checkbox, choiceGroup, selectField, actionBar, statusLine,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Steps', value: 'Preheat the oven to 180 °C.\nMix the flour and sugar.\nAdd the eggs and milk.\nBake for 25 minutes.', mode: 'add' },
  { label: 'Code', value: 'function greet(name) {\n  const message = `Hello, ${name}!`;\n\n  console.log(message);\n}', mode: 'add', separator: ' | ', pad: 'spaces' },
  { label: 'Remove numbers', value: '1. Introduction\n2. Methods\n3. Results\n10. Appendix', mode: 'remove' }
];

const PADDING = [
  { id: 'none', label: 'None (1, 2 … 10)' },
  { id: 'zeros', label: 'Zeros (01, 02 … 10)' },
  { id: 'spaces', label: 'Spaces (aligned)' }
];

export function mount(container) {
  const input = textArea({ label: 'Lines', placeholder: 'Paste text to number…', rows: 12, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Result', rows: 12, mono: true, readOnly: true, labelHidden: true, placeholder: 'Numbered lines appear here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();

  const mode = choiceGroup({
    legend: 'Action',
    options: [{ id: 'add', label: 'Add line numbers' }, { id: 'remove', label: 'Remove line numbers' }],
    value: 'add',
    onChange: () => update()
  });
  const start = textInput({ label: 'Start at', type: 'number', value: '1', attrs: { step: '1', inputmode: 'numeric' } });
  const step = textInput({ label: 'Count by', type: 'number', value: '1', attrs: { min: '1', step: '1', inputmode: 'numeric' } });
  const separator = selectField({ label: 'Format', options: NUMBER_SEPARATORS, value: '. ', onChange: () => update() });
  const pad = selectField({ label: 'Padding', options: PADDING, value: 'none', onChange: () => update() });
  const skipEmpty = checkbox({ label: 'Don’t number empty lines', onChange: () => update() });
  const addOptions = h('div', { class: 'tool-stack' }, h('div', { class: 'input-row' }, start.field, step.field, separator.field, pad.field), skipEmpty.el);

  function readInt(field, min) {
    const raw = field.el.value.trim();
    const n = Number(raw);
    const ok = raw !== '' && Number.isInteger(n) && n >= min && Math.abs(n) <= 1e9;
    if (ok) field.el.removeAttribute('aria-invalid');
    else field.el.setAttribute('aria-invalid', 'true');
    return ok ? n : null;
  }

  function update() {
    const adding = mode.value === 'add';
    addOptions.hidden = !adding;
    status.clear();
    if (adding) {
      const s = readInt(start, -1e9);
      const st = readInt(step, 1);
      if (s === null || st === null) {
        status.show('error', s === null ? '“Start at” must be a whole number.' : '“Count by” must be a whole number of 1 or more.');
        output.el.value = '';
        return;
      }
      output.el.value = numberLines(input.el.value, { start: s, step: st, separator: separator.el.value, pad: pad.el.value, skipEmpty: skipEmpty.input.checked });
    } else {
      output.el.value = removeLineNumbers(input.el.value);
    }
    meta.textContent = input.el.value ? plural(splitLines(input.el.value).length, 'line') : '';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  for (const el of [input.el, start.el, step.el]) el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      mode.el,
      addOptions,
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => {
            input.el.value = ex.value;
            mode.set(ex.mode);
            separator.el.value = ex.separator || '. ';
            pad.el.value = ex.pad || 'none';
            update();
          })]
        }),
        panel({
          title: 'Result',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'numbered-lines.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
