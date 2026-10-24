import { addPrefixSuffix, removePrefixSuffix, unescapeSequences, splitLines } from '../lib/text.js';
import {
  h, panel, textArea, textInput, checkbox, choiceGroup, actionBar,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'SQL IN list', value: 'Mumbai\nDelhi\nBengaluru\nChennai', prefix: "'", suffix: "',", mode: 'add' },
  { label: 'Markdown bullets', value: 'Buy groceries\nCall the bank\nFinish report', prefix: '- [ ] ', suffix: '', mode: 'add' },
  { label: 'HTML list items', value: 'Home\nAbout\nContact', prefix: '<li>', suffix: '</li>', mode: 'add' },
  { label: 'Remove quotes', value: '"red",\n"green",\n"blue",', prefix: '"', suffix: '",', mode: 'remove' }
];

export function mount(container) {
  const input = textArea({ label: 'Lines', placeholder: 'Paste text with one item per line…', rows: 12, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Result', rows: 12, mono: true, readOnly: true, labelHidden: true, placeholder: 'The result appears here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const mode = choiceGroup({
    legend: 'Action',
    options: [{ id: 'add', label: 'Add to each line' }, { id: 'remove', label: 'Remove from each line' }],
    value: 'add',
    onChange: () => update()
  });
  const prefix = textInput({ label: 'Prefix (start of line)', placeholder: 'e.g. - or <li>', mono: true });
  const suffix = textInput({ label: 'Suffix (end of line)', placeholder: 'e.g. , or </li>', mono: true });
  const skipEmpty = checkbox({ label: 'Skip empty lines', checked: true, onChange: () => update() });
  const trim = checkbox({ label: 'Trim spaces first', onChange: () => update() });
  const escapes = checkbox({ label: 'Understand \\t (tab) and \\n (new line)', onChange: () => update() });

  function update() {
    const read = (el) => (escapes.input.checked ? unescapeSequences(el.value) : el.value);
    const opts = { prefix: read(prefix.el), suffix: read(suffix.el), skipEmpty: skipEmpty.input.checked, trim: trim.input.checked };
    output.el.value = mode.value === 'add' ? addPrefixSuffix(input.el.value, opts) : removePrefixSuffix(input.el.value, opts);
    skipEmpty.input.disabled = mode.value === 'remove';
    meta.textContent = input.el.value ? plural(splitLines(input.el.value).length, 'line') : '';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  for (const el of [input.el, prefix.el, suffix.el]) el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      mode.el,
      h('div', { class: 'input-row' }, prefix.field, suffix.field),
      h('div', { class: 'options' }, skipEmpty.el, trim.el, escapes.el),
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original',
          actions: actionBar(clearButton([input.el, prefix.el, suffix.el], { onChange: update, label: 'Clear all' })),
          children: [input.field, examples(EXAMPLES, (ex) => {
            input.el.value = ex.value;
            prefix.el.value = ex.prefix;
            suffix.el.value = ex.suffix;
            mode.set(ex.mode);
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
              downloadButton(() => output.el.value, { filename: 'lines.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
