import { findReplace } from '../lib/text.js';
import {
  h, panel, textArea, textInput, checkbox, actionBar, statusLine,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, debounce, formatNumber, plural
} from '../ui/toolkit.js';
import { createWorkerRunner, StaleRequest, TimeoutError } from '../ui/worker-runner.js';

const TIMEOUT_MS = 2000;
const PREVIEW_LIMIT = 200000;

const EXAMPLES = [
  { label: 'Fix a typo', value: 'Teh report is due on Monday. Please send teh final version to teh team.', find: 'teh', replace: 'the', regex: false, wholeWord: true },
  { label: 'Reformat dates', value: 'Invoices dated 2024-03-15, 2024-04-01 and 2024-04-30 are overdue.', find: '(\\d{4})-(\\d{2})-(\\d{2})', replace: '$3/$2/$1', regex: true, wholeWord: false },
  { label: 'Commas to lines', value: 'apples, bananas, cherries, dates, elderberries', find: ',\\s*', replace: '\\n', regex: true, wholeWord: false }
];

export function mount(container) {
  const runner = createWorkerRunner(
    new URL('../workers/find-replace.worker.js', import.meta.url),
    (p) => findReplace(p.text, p.find, p.replace, p.options),
    { timeoutMs: TIMEOUT_MS }
  );

  const input = textArea({ label: 'Text', placeholder: 'Paste the text you want to search…', rows: 12, labelHidden: true });
  const find = textInput({ label: 'Find', placeholder: 'Text or pattern to find', mono: true });
  const replace = textInput({ label: 'Replace with', placeholder: 'Leave empty to delete matches', mono: true, hint: 'In regular-expression mode, use $1, $2… for captured groups and \\n for a new line.' });

  const matchCase = checkbox({ label: 'Match case', onChange: () => schedule() });
  const wholeWord = checkbox({ label: 'Whole words only', onChange: () => schedule() });
  const regex = checkbox({ label: 'Regular expression', onChange: () => { multiline.el.hidden = !regex.input.checked; schedule(); } });
  const multiline = checkbox({ label: '^ and $ match each line', checked: true, onChange: () => schedule() });
  multiline.el.hidden = true;

  const status = statusLine();
  const count = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const preview = h('pre', { class: 'highlight-view', tabindex: '0', 'aria-label': 'Text with matches highlighted' });
  const output = textArea({ label: 'Result', rows: 10, readOnly: true, labelHidden: true, placeholder: 'The text with replacements appears here.' });

  function renderPreview(text, matches) {
    if (!text) {
      preview.replaceChildren(h('span', { class: 'muted', text: 'Matches will be highlighted here.' }));
      return;
    }
    if (text.length > PREVIEW_LIMIT) {
      preview.replaceChildren(h('span', { class: 'muted', text: `Highlighting is turned off for text longer than ${formatNumber(PREVIEW_LIMIT)} characters to keep the page responsive. Replacement still works.` }));
      return;
    }
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const [start, end] of matches) {
      if (start > pos) frag.append(text.slice(pos, start));
      frag.append(h('mark', { text: text.slice(start, end) }));
      pos = end;
    }
    frag.append(text.slice(pos));
    preview.replaceChildren(frag);
  }

  async function update() {
    const text = input.el.value;
    const payload = {
      text,
      find: find.el.value,
      replace: replace.el.value,
      options: {
        regex: regex.input.checked,
        matchCase: matchCase.input.checked,
        wholeWord: wholeWord.input.checked,
        multiline: multiline.input.checked
      }
    };
    try {
      const r = await runner.run(payload);
      status.clear();
      find.el.removeAttribute('aria-invalid');
      output.el.value = r.output;
      renderPreview(text, r.matches);
      if (!payload.find) count.textContent = '';
      else if (r.count === 0) count.textContent = 'No matches';
      else count.textContent = `${plural(r.count, 'match', 'matches')}${r.truncated ? ` (first ${formatNumber(r.matches.length)} highlighted)` : ''}`;
    } catch (err) {
      if (err instanceof StaleRequest) return;
      count.textContent = '';
      output.el.value = '';
      renderPreview(text, []);
      find.el.setAttribute('aria-invalid', 'true');
      if (err instanceof TimeoutError) {
        status.show('error', `This pattern took longer than ${TIMEOUT_MS / 1000} seconds and was stopped. Patterns with nested repeats such as (a+)+ can be extremely slow — try simplifying it.`);
      } else if (err.name === 'SyntaxError') {
        status.show('error', `Invalid regular expression: ${err.message.replace(/^Invalid regular expression: /, '')}`);
      } else {
        status.show('error', 'Something went wrong while searching. Please try again.');
      }
    }
  }

  const schedule = debounce(update, 120);
  for (const el of [input.el, find.el, replace.el]) el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, find.field, replace.field),
      h('div', { class: 'options' }, matchCase.el, wholeWord.el, regex.el, multiline.el),
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Text',
          actions: actionBar(clearButton([input.el, find.el, replace.el], { onChange: update, label: 'Clear all' })),
          children: [
            input.field,
            examples(EXAMPLES, (ex) => {
              input.el.value = ex.value;
              find.el.value = ex.find;
              replace.el.value = ex.replace;
              regex.input.checked = ex.regex;
              wholeWord.input.checked = ex.wholeWord;
              multiline.el.hidden = !ex.regex;
              update();
            })
          ]
        }),
        panel({ title: 'Matches', meta: count, children: [preview] })
      ),
      panel({
        title: 'Result',
        children: [
          output.field,
          actionBar(
            copyButton(() => output.el.value),
            downloadButton(() => output.el.value, { filename: 'replaced-text.txt' }),
            useAsInputButton(output.el, input.el, update)
          )
        ]
      })
    )
  );
  update();
}
