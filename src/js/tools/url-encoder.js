import { encodeUrl, decodeUrl, URL_MODES } from '../lib/url.js';
import {
  h, panel, textArea, checkbox, choiceGroup, selectField, actionBar, statusLine,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Search query', value: 'café & croissants near me?', direction: 'encode', mode: 'component' },
  { label: 'Full URL', value: 'https://example.com/docs/my file.pdf?lang=हिन्दी&page=2', direction: 'encode', mode: 'uri' },
  { label: 'Encoded link', value: 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3D50%25%20off%20%E2%82%B9999', direction: 'decode', mode: 'component' },
  { label: 'Form data', value: 'name=Asha+Rao&city=New+Delhi&note=hello%2C+world%21', direction: 'decode', mode: 'form' }
];

export function mount(container) {
  const input = textArea({ label: 'Input', placeholder: 'Paste text or a URL…', rows: 8, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Result', rows: 8, mono: true, readOnly: true, labelHidden: true, placeholder: 'The result appears here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();

  const direction = choiceGroup({
    legend: 'Direction',
    options: [{ id: 'encode', label: 'Encode' }, { id: 'decode', label: 'Decode' }],
    value: 'encode',
    onChange: () => update()
  });
  const mode = selectField({ label: 'Encoding style', options: URL_MODES, value: 'component', onChange: () => update() });
  const perLine = checkbox({ label: 'Encode each line separately', onChange: () => update() });
  const plus = checkbox({ label: 'Treat + as a space', onChange: () => update() });

  function update() {
    const encoding = direction.value === 'encode';
    perLine.el.hidden = !encoding;
    plus.el.hidden = encoding;
    if (mode.el.value === 'form' && !encoding) plus.input.checked = true;
    status.clear();
    if (encoding) {
      const r = encodeUrl(input.el.value, { mode: mode.el.value, perLine: perLine.input.checked });
      output.el.value = r.output;
      if (r.error) status.show('error', r.error);
    } else {
      const r = decodeUrl(input.el.value, { mode: mode.el.value, plusAsSpace: plus.input.checked });
      output.el.value = r.output;
      if (r.invalid) status.show('warn', `${plural(r.invalid, 'escape sequence')} couldn’t be decoded and ${r.invalid === 1 ? 'was' : 'were'} left unchanged (for example a lone “%” or an incomplete character).`);
    }
    meta.textContent = input.el.value ? `${plural([...input.el.value].length, 'character')} → ${[...output.el.value].length}` : '';
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, direction.el, mode.field),
      h('div', { class: 'options' }, perLine.el, plus.el),
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Input',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => {
            input.el.value = ex.value;
            direction.set(ex.direction);
            mode.el.value = ex.mode;
            plus.input.checked = ex.mode === 'form';
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
              downloadButton(() => output.el.value, { filename: 'url-result.txt' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
