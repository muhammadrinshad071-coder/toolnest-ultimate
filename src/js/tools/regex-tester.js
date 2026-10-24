import { runRegex, splitLiteral, REGEX_FLAGS } from '../lib/regex.js';
import { h, panel, textArea, textInput, checkbox, actionBar, statusLine, tableView, examples, debounce, formatNumber, plural, copyButton } from '../ui/toolkit.js';
import { createWorkerRunner, StaleRequest, TimeoutError } from '../ui/worker-runner.js';

const TIMEOUT_MS = 2000;
const PREVIEW_LIMIT = 200000;
const TABLE_LIMIT = 200;

const PATTERNS = [
  { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+', flags: 'gi', text: 'Write to asha.rao@example.com or support+help@tool-nest.co.in — not to @nobody.' },
  { label: 'Indian mobile', pattern: '(?:\\+91[\\s-]?)?[6-9]\\d{9}', flags: 'g', text: 'Call +91 9876543210 or 8123456789. 5123456789 is not valid.' },
  { label: 'Dates (named groups)', pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})', flags: 'g', text: 'Due 2025-03-15, paid 2025-04-02.', replacement: '$<day>/$<month>/$<year>' },
  { label: 'Hex colours', pattern: '#(?:[0-9a-f]{3}){1,2}\\b', flags: 'gi', text: 'color: #FF8800; background: #fff; border: #12345;' },
  { label: 'URLs', pattern: 'https?:\\/\\/[^\\s/$.?#].[^\\s]*', flags: 'gi', text: 'Docs at https://example.com/docs?page=2 and http://test.dev.' }
];

export function mount(container) {
  const runner = createWorkerRunner(
    new URL('../workers/regex.worker.js', import.meta.url),
    (p) => runRegex(p.pattern, p.flags, p.text, { replacement: p.replacement }),
    { timeoutMs: TIMEOUT_MS }
  );

  const pattern = textInput({ label: 'Regular expression', mono: true, placeholder: 'e.g. \\d{3}-\\d{4} — or paste /pattern/flags' });
  const flagBoxes = REGEX_FLAGS.map((f) => {
    const box = checkbox({ label: f.label, checked: f.id === 'g', onChange: () => schedule() });
    box.el.title = f.title;
    box.input.setAttribute('aria-label', f.title);
    return { ...f, box };
  });
  const text = textArea({ label: 'Test text', placeholder: 'Paste the text to test against…', rows: 8, labelHidden: true, spellcheck: false });
  const replacement = textInput({ label: 'Replace with (optional)', mono: true, placeholder: 'e.g. $1 or $<name>', hint: 'Use $& for the whole match, $1 for group 1, $<name> for named groups and \\n for a new line.' });
  const status = statusLine();
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const preview = h('pre', { class: 'highlight-view', tabindex: '0', 'aria-label': 'Test text with matches highlighted' });
  const tableSlot = h('div', {});
  const output = textArea({ label: 'Replacement result', rows: 6, readOnly: true, labelHidden: true, spellcheck: false });
  const outputPanel = panel({ title: 'Replacement result', actions: actionBar(copyButton(() => output.el.value)), children: [output.field] });

  const flags = () => flagBoxes.filter((f) => f.box.input.checked).map((f) => f.id).join('');
  const setFlags = (s) => flagBoxes.forEach((f) => { f.box.input.checked = s.includes(f.id); });

  pattern.el.addEventListener('paste', () => setTimeout(() => {
    const lit = splitLiteral(pattern.el.value.trim());
    if (lit) { pattern.el.value = lit.pattern; setFlags(lit.flags); update(); }
  }));

  function renderPreview(value, matches) {
    if (value.length > PREVIEW_LIMIT) {
      preview.replaceChildren(h('span', { class: 'muted', text: 'Highlighting is turned off for very long text to keep the page responsive.' }));
      return;
    }
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const m of matches) {
      if (m.index > pos) frag.append(value.slice(pos, m.index));
      frag.append(h('mark', { text: value.slice(m.index, m.end) }));
      pos = m.end;
    }
    frag.append(value.slice(pos));
    preview.replaceChildren(value ? frag : h('span', { class: 'muted', text: 'Matches are highlighted here.' }));
  }

  async function update() {
    const value = text.el.value;
    outputPanel.hidden = !replacement.el.value;
    if (!pattern.el.value) {
      status.clear();
      pattern.el.removeAttribute('aria-invalid');
      meta.textContent = '';
      renderPreview(value, []);
      tableSlot.replaceChildren();
      return;
    }
    try {
      const r = await runner.run({ pattern: pattern.el.value, flags: flags(), text: value, replacement: replacement.el.value || null });
      status.clear();
      pattern.el.removeAttribute('aria-invalid');
      meta.textContent = r.total ? `${plural(r.total, 'match', 'matches')} · ${plural(r.groupCount, 'group')}` : 'No matches';
      renderPreview(value, r.matches);
      const shown = r.matches.slice(0, TABLE_LIMIT);
      const named = shown.find((m) => m.named)?.named;
      const columns = [
        { key: 'n', label: '#', num: true },
        { key: 'at', label: 'Position', num: true },
        { key: 'text', label: 'Match', className: 'cell-text' },
        ...Array.from({ length: r.groupCount }, (_, i) => ({ key: `g${i}`, label: `Group ${i + 1}`, className: 'cell-text' }))
      ];
      tableSlot.replaceChildren(shown.length
        ? tableView(columns, shown.map((m, i) => ({
          n: formatNumber(i + 1),
          at: formatNumber(m.index),
          text: m.text === '' ? '(empty match)' : m.text,
          ...Object.fromEntries(m.groups.map((g, k) => [`g${k}`, g ?? '—']))
        })))
        : h('p', { class: 'muted', text: value ? 'The pattern does not match this text.' : 'Add some test text.' }));
      if (named) tableSlot.append(h('p', { class: 'field__hint', text: `Named groups: ${Object.keys(named).join(', ')}` }));
      if (r.total > TABLE_LIMIT) tableSlot.append(h('p', { class: 'field__hint', text: `Showing the first ${TABLE_LIMIT} of ${formatNumber(r.total)} matches.` }));
      if (!flags().includes('g') && r.total) status.show('info', 'Without the g flag only the first match is found.');
      output.el.value = r.output ?? '';
    } catch (err) {
      if (err instanceof StaleRequest) return;
      pattern.el.setAttribute('aria-invalid', 'true');
      meta.textContent = '';
      tableSlot.replaceChildren();
      renderPreview(value, []);
      output.el.value = '';
      if (err instanceof TimeoutError) status.show('error', `This pattern took longer than ${TIMEOUT_MS / 1000} seconds and was stopped. Nested repeats such as (a+)+ can take exponential time — try simplifying it.`);
      else status.show('error', err.message.replace(/^Invalid regular expression: /, 'Invalid pattern: '));
    }
  }

  const schedule = debounce(update, 150);
  for (const el of [pattern.el, text.el, replacement.el]) el.addEventListener('input', schedule);

  container.append(
    h('div', { class: 'tool-stack' },
      pattern.field,
      h('fieldset', { class: 'choice-group' }, h('legend', { text: 'Flags' }), h('div', { class: 'options' }, flagBoxes.map((f) => h('span', { title: f.title }, f.box.el, h('span', { class: 'field__hint', text: ` ${f.title.split(' — ')[0]}` }))))),
      examples(PATTERNS, (p) => { pattern.el.value = p.pattern; setFlags(p.flags); text.el.value = p.text; replacement.el.value = p.replacement || ''; update(); }),
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({ title: 'Test text', children: [text.field, replacement.field] }),
        panel({ title: 'Matches', meta, children: [preview] })
      ),
      panel({ title: 'Match details', children: [tableSlot] }),
      outputPanel
    )
  );
  update();
}
