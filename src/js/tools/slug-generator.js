import { toSlug, splitLines } from '../lib/text.js';
import {
  h, panel, textArea, textInput, checkbox, selectField, actionBar, statusLine,
  clearButton, copyButton, downloadButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const SEPARATORS = [
  { id: '-', label: 'Hyphen (my-page-title)' },
  { id: '_', label: 'Underscore (my_page_title)' },
  { id: '.', label: 'Dot (my.page.title)' },
  { id: '', label: 'None (mypagetitle)' }
];

const EXAMPLES = [
  { label: 'Blog title', value: '10 Tips & Tricks for Better Sleep — A Beginner’s Guide!' },
  { label: 'Accented words', value: 'Crème Brûlée Recipe\nÜber die Straße\nŁódź Travel Guide' },
  { label: 'Hindi titles', value: 'नमस्ते दुनिया\nभारत की यात्रा', keepUnicode: true }
];

export function mount(container) {
  const input = textArea({ label: 'Titles', placeholder: 'Type a title, or paste several — one per line…', rows: 8, labelHidden: true });
  const output = textArea({ label: 'Slugs', rows: 8, mono: true, readOnly: true, labelHidden: true, placeholder: 'URL slugs appear here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();

  const separator = selectField({ label: 'Separator', options: SEPARATORS, value: '-', onChange: () => update() });
  const maxLength = textInput({ label: 'Maximum length (optional)', type: 'number', placeholder: 'No limit', attrs: { min: '1', max: '500', step: '1', inputmode: 'numeric' } });
  const lowercase = checkbox({ label: 'Lowercase', checked: true, onChange: () => update() });
  const stopwords = checkbox({ label: 'Remove common words (a, the, and, of…)', onChange: () => update() });
  const unicode = checkbox({ label: 'Keep non-Latin letters (Hindi, Russian, Chinese…)', onChange: () => update() });

  function update() {
    status.clear();
    const raw = maxLength.el.value.trim();
    let max = 0;
    if (raw) {
      max = Number(raw);
      if (!Number.isInteger(max) || max < 1) {
        maxLength.el.setAttribute('aria-invalid', 'true');
        status.show('error', 'Maximum length must be a whole number of 1 or more, or left empty.');
        return;
      }
    }
    maxLength.el.removeAttribute('aria-invalid');
    const options = { separator: separator.el.value, lowercase: lowercase.input.checked, removeStopwords: stopwords.input.checked, keepUnicode: unicode.input.checked, maxLength: max };
    const lines = input.el.value ? splitLines(input.el.value) : [];
    const slugs = lines.map((l) => (l.trim() ? toSlug(l, options) : ''));
    output.el.value = slugs.join('\n');
    const lost = lines.some((l, i) => /\p{L}/u.test(l) && !slugs[i]);
    if (lost && !unicode.input.checked) status.show('warn', 'Some titles use letters that can’t be converted to a–z. Turn on “Keep non-Latin letters” to keep them.');
    const count = slugs.filter(Boolean).length;
    meta.textContent = count ? plural(count, 'slug') : '';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);
  maxLength.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, separator.field, maxLength.field),
      h('div', { class: 'options' }, lowercase.el, stopwords.el, unicode.el),
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Titles',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; unicode.input.checked = Boolean(ex.keepUnicode); update(); })]
        }),
        panel({
          title: 'Slugs',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: 'slugs.txt' })
            )
          ]
        })
      )
    )
  );
  update();
  input.el.focus({ preventScroll: true });
}
