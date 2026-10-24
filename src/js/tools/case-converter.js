import { convertCase, CASE_MODES } from '../lib/text.js';
import {
  h, panel, textArea, choiceGroup, checkbox, actionBar,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Headline', value: 'the quick guide to NASA missions and the iPhone of space exploration', mode: 'title' },
  { label: 'SHOUTY TEXT', value: 'PLEASE REMEMBER TO SUBMIT YOUR ASSIGNMENT BY FRIDAY. LATE WORK WILL NOT BE ACCEPTED! i will check on monday.', mode: 'sentence' },
  { label: 'Variable names', value: 'user first name\nTotal Order Amount\nparseHTTPResponse\nmax-retry-count', mode: 'camel' }
];

const ACRONYM_MODES = new Set(['title', 'sentence']);

export function mount(container) {
  const input = textArea({ label: 'Text to convert', placeholder: 'Type or paste text here…', rows: 10, labelHidden: true });
  const output = textArea({ label: 'Converted text', rows: 10, readOnly: true, labelHidden: true, placeholder: 'Your converted text appears here.' });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const mode = choiceGroup({ legend: 'Convert to', options: CASE_MODES, value: 'title', onChange: () => update() });
  const preserve = checkbox({ label: 'Preserve acronyms and brand names (NASA, iPhone)', checked: true, onChange: () => update() });

  function update() {
    const m = mode.value;
    output.el.value = convertCase(input.el.value, m, { preserveAcronyms: preserve.input.checked });
    preserve.input.disabled = !ACRONYM_MODES.has(m);
    preserve.el.classList.toggle('muted', !ACRONYM_MODES.has(m));
    meta.textContent = input.el.value ? plural([...output.el.value].length, 'character') : '';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      mode.el,
      preserve.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Original',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [
            input.field,
            examples(EXAMPLES, (ex) => { input.el.value = ex.value; mode.set(ex.mode); update(); })
          ]
        }),
        panel({
          title: 'Result',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'converted-text.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
