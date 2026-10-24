import { generateLorem, LOREM_LIMITS } from '../lib/lorem.js';
import { textStats } from '../lib/text.js';
import {
  h, panel, textArea, textInput, checkbox, selectField, actionBar, button, statusLine,
  copyButton, downloadButton, formatNumber, debounce
} from '../ui/toolkit.js';

const UNITS = [
  { id: 'paragraphs', label: 'Paragraphs' },
  { id: 'sentences', label: 'Sentences' },
  { id: 'words', label: 'Words' }
];

const FORMATS = [
  { id: 'text', label: 'Plain text' },
  { id: 'html', label: 'HTML paragraphs (<p>)' }
];

export function mount(container) {
  const count = textInput({ label: 'How many', type: 'number', value: '3', attrs: { min: '1', step: '1', inputmode: 'numeric' } });
  const unit = selectField({ label: 'Of', options: UNITS, value: 'paragraphs', onChange: () => generate() });
  const format = selectField({ label: 'Format', options: FORMATS, value: 'text', onChange: () => generate() });
  const classic = checkbox({ label: 'Start with “Lorem ipsum dolor sit amet…”', checked: true, onChange: () => generate() });
  const output = textArea({ label: 'Placeholder text', rows: 14, readOnly: true, labelHidden: true });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();

  function generate() {
    const n = Number(count.el.value);
    const max = LOREM_LIMITS[unit.el.value];
    count.el.max = String(max);
    status.clear();
    if (!Number.isInteger(n) || n < 1 || n > max) {
      count.el.setAttribute('aria-invalid', 'true');
      status.show('error', `Enter a whole number from 1 to ${formatNumber(max)} ${unit.el.value}.`);
      return;
    }
    count.el.removeAttribute('aria-invalid');
    output.el.value = generateLorem({ unit: unit.el.value, count: n, startWithLorem: classic.input.checked, format: format.el.value });
    const stats = textStats(output.el.value.replace(/<\/?p>/g, ''));
    meta.textContent = `${formatNumber(stats.words)} words · ${formatNumber(stats.characters)} characters`;
  }

  count.el.addEventListener('input', debounce(generate, 200));

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, count.field, unit.field, format.field),
      classic.el,
      status.el,
      panel({
        title: 'Generated text',
        meta,
        children: [
          output.field,
          actionBar(
            button({ label: 'Generate again', iconName: 'swap', variant: 'primary', onClick: () => generate() }),
            copyButton(() => output.el.value),
            downloadButton(() => output.el.value, { filename: () => (format.el.value === 'html' ? 'lorem-ipsum.html' : 'lorem-ipsum.txt') })
          )
        ]
      })
    )
  );
  generate();
}
