import { parseJson, printJson, jsonStats, JsonError } from '../lib/json.js';
import { formatBytes } from '../lib/encoding.js';
import {
  h, panel, textArea, selectField, checkbox, choiceGroup, actionBar, button, statusLine,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, debounce, formatNumber
} from '../ui/toolkit.js';

const INDENTS = [{ id: '2', label: '2 spaces' }, { id: '4', label: '4 spaces' }, { id: 'tab', label: 'Tabs' }];

const EXAMPLES = [
  { label: 'API response', value: '{"user":{"id":12345678901234567890,"name":"Asha Rao","roles":["admin","editor"],"active":true,"lastLogin":null},"meta":{"requestId":"a1b2c3","took_ms":42}}' },
  { label: 'Broken JSON', value: '{\n  "name": "Ben",\n  "age": 31,\n  "city": \'Pune\',\n  "skills": ["js", "sql",],\n}' },
  { label: 'Config file', value: '{"compilerOptions":{"target":"es2022","module":"esnext","strict":true,"paths":{"@/*":["src/*"]}},"include":["src"]}' }
];

export function mount(container) {
  const input = textArea({ label: 'JSON input', placeholder: 'Paste JSON here…', rows: 16, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Formatted JSON', rows: 16, mono: true, readOnly: true, labelHidden: true, spellcheck: false, placeholder: 'Formatted JSON appears here.' });
  const status = statusLine();
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  let lastError = null;

  const mode = choiceGroup({ legend: 'Output', options: [{ id: 'pretty', label: 'Format (pretty)' }, { id: 'minify', label: 'Minify' }], value: 'pretty', onChange: () => update() });
  const indent = selectField({ label: 'Indent', options: INDENTS, value: '2', onChange: () => update() });
  const sortKeys = checkbox({ label: 'Sort keys A → Z', onChange: () => update() });

  const jump = button({
    label: 'Show the error',
    iconName: 'target',
    variant: 'ghost',
    onClick: () => {
      if (!lastError) return;
      input.el.focus();
      input.el.setSelectionRange(lastError.position, Math.min(lastError.position + 1, input.el.value.length));
      // Scroll the textarea so the error line is visible.
      const lineHeight = parseFloat(getComputedStyle(input.el).lineHeight) || 20;
      input.el.scrollTop = Math.max(0, (lastError.line - 3) * lineHeight);
    }
  });

  function errorContext(text, err) {
    const line = text.split('\n')[err.line - 1] ?? '';
    const start = Math.max(0, err.column - 40);
    const snippet = line.slice(start, err.column + 40);
    return `${snippet}\n${' '.repeat(err.column - 1 - start)}^`;
  }

  function update() {
    indent.field.hidden = mode.value === 'minify';
    jump.hidden = true;
    lastError = null;
    const text = input.el.value;
    if (!text.trim()) {
      status.clear();
      output.el.value = '';
      meta.textContent = '';
      input.el.removeAttribute('aria-invalid');
      return;
    }
    try {
      const { ast, warnings } = parseJson(text);
      const pad = mode.value === 'minify' ? '' : indent.el.value === 'tab' ? '\t' : Number(indent.el.value);
      output.el.value = printJson(ast, { indent: pad, sortKeys: sortKeys.input.checked });
      input.el.removeAttribute('aria-invalid');
      const s = jsonStats(ast);
      meta.textContent = `${formatBytes(new TextEncoder().encode(output.el.value).length)} · depth ${s.depth}`;
      if (warnings.length) status.show('warn', `Valid JSON, with a warning: ${warnings[0]}${warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ''}`);
      else status.show('success', `Valid JSON — ${formatNumber(s.objects)} object${s.objects === 1 ? '' : 's'}, ${formatNumber(s.arrays)} array${s.arrays === 1 ? '' : 's'}, ${formatNumber(s.values)} value${s.values === 1 ? '' : 's'}.`);
    } catch (err) {
      if (!(err instanceof JsonError)) throw err;
      lastError = err;
      output.el.value = '';
      meta.textContent = '';
      input.el.setAttribute('aria-invalid', 'true');
      status.show('error', `Line ${err.line}, column ${err.column}: ${err.message}.\n${errorContext(text, err)}`);
      status.el.querySelector('p').classList.add('code-block');
      jump.hidden = false;
    }
  }

  const schedule = debounce(update, 150);
  input.el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, mode.el, indent.field),
      sortKeys.el,
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Input',
          actions: actionBar(jump, clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; update(); })]
        }),
        panel({
          title: 'Output',
          meta,
          children: [
            output.field,
            actionBar(
              copyButton(() => output.el.value, { emptyMessage: 'Fix the JSON first.' }),
              downloadButton(() => output.el.value, { filename: 'formatted.json', mime: 'application/json', emptyMessage: 'Fix the JSON first.' }),
              useAsInputButton(output.el, input.el, update)
            )
          ]
        })
      )
    )
  );
  update();
}
