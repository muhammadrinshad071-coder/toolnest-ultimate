import { diffText, formatDiff, DIFF_MODES } from '../lib/diff.js';
import {
  h, panel, textArea, checkbox, choiceGroup, actionBar, button, statusLine,
  clearButton, copyButton, downloadButton, examples, debounce, formatNumber
} from '../ui/toolkit.js';
import { createWorkerRunner, StaleRequest, TimeoutError } from '../ui/worker-runner.js';
import { toast } from '../ui/toast.js';

const CONTEXT = 3;
const MAX_ROWS = 5000;
const MAX_INLINE_TOKENS = 30000;

const EXAMPLES = [
  {
    label: 'Edited paragraph',
    mode: 'words',
    before: 'The quick brown fox jumps over the lazy dog. It was a sunny day in the park.',
    after: 'The quick red fox leaped over the sleepy dog. It was a bright, sunny day in the park.'
  },
  {
    label: 'Shopping list',
    mode: 'lines',
    before: 'Milk\nBread\nEggs\nButter\nApples\nRice',
    after: 'Milk\nBrown bread\nEggs\nApples\nBananas\nRice\nTea'
  },
  {
    label: 'Config file',
    mode: 'lines',
    before: 'port = 8080\nhost = "localhost"\ndebug = true\ntimeout = 30\nretries = 3\nlog_level = "info"\ncache = false\nworkers = 4',
    after: 'port = 8080\nhost = "0.0.0.0"\ndebug = false\ntimeout = 30\nretries = 5\nlog_level = "info"\ncache = false\nworkers = 4'
  }
];

const SIGNS = { equal: ' ', insert: '+', delete: '−' };

function renderLines(result, hideUnchanged) {
  const rows = [];
  let a = 1;
  let b = 1;
  let shown = 0;
  const row = (type, text, an, bn) => h('div', { class: `diff-line diff-line--${type}` },
    h('span', { class: 'diff-num', text: an ?? '' }),
    h('span', { class: 'diff-num', text: bn ?? '' }),
    h('span', { class: 'diff-sign', 'aria-hidden': 'true', text: SIGNS[type] }),
    h('span', {}, type === 'insert' ? h('span', { class: 'visually-hidden', text: 'Added: ' }) : type === 'delete' ? h('span', { class: 'visually-hidden', text: 'Removed: ' }) : null, text || '​'));

  result.ops.forEach((op, index) => {
    if (shown >= MAX_ROWS) return;
    if (op.type === 'equal' && hideUnchanged) {
      const first = index === 0;
      const last = index === result.ops.length - 1;
      const head = first ? 0 : CONTEXT;
      const tail = last ? 0 : CONTEXT;
      if (op.tokens.length > head + tail + 1) {
        op.tokens.slice(0, head).forEach((t, i) => { rows.push(row('equal', t, a + i, b + i)); shown++; });
        const skipped = op.tokens.length - head - tail;
        rows.push(h('div', { class: 'diff-gap', text: `⋯ ${formatNumber(skipped)} unchanged line${skipped === 1 ? '' : 's'}` }));
        op.tokens.slice(op.tokens.length - tail).forEach((t, i) => {
          const off = op.tokens.length - tail + i;
          rows.push(row('equal', t, a + off, b + off));
          shown++;
        });
        a += op.tokens.length;
        b += op.tokens.length;
        return;
      }
    }
    for (const t of op.tokens) {
      if (shown >= MAX_ROWS) break;
      if (op.type === 'equal') rows.push(row('equal', t, a++, b++));
      else if (op.type === 'delete') rows.push(row('delete', t, a++, null));
      else rows.push(row('insert', t, null, b++));
      shown++;
    }
  });
  if (shown >= MAX_ROWS) rows.push(h('div', { class: 'diff-gap', text: `Display stops after ${formatNumber(MAX_ROWS)} lines. Copy or download the diff to see everything.` }));
  return rows;
}

function renderInline(result) {
  const frag = h('div', { class: 'diff-inline' });
  let tokens = 0;
  for (const op of result.ops) {
    if (tokens > MAX_INLINE_TOKENS) {
      frag.append(h('div', { class: 'diff-gap', text: 'Display stops here for very long text. Copy or download the diff to see everything.' }));
      break;
    }
    tokens += op.tokens.length;
    const text = op.tokens.join('');
    if (op.type === 'insert') frag.append(h('ins', { title: 'Added' }, text));
    else if (op.type === 'delete') frag.append(h('del', { title: 'Removed' }, text));
    else frag.append(text);
  }
  return [frag];
}

export function mount(container) {
  const runner = createWorkerRunner(
    new URL('../workers/diff.worker.js', import.meta.url),
    (p) => diffText(p.before, p.after, p.options),
    { timeoutMs: 5000 }
  );

  const before = textArea({ label: 'Original text', placeholder: 'Paste the original version…', rows: 12, labelHidden: true });
  const after = textArea({ label: 'Changed text', placeholder: 'Paste the changed version…', rows: 12, labelHidden: true });
  const view = h('div', { class: 'diff-view', role: 'region', 'aria-label': 'Differences', tabindex: '0' });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();
  let last = null;

  const mode = choiceGroup({ legend: 'Compare by', options: DIFF_MODES, value: 'lines', onChange: () => update() });
  const ignoreCase = checkbox({ label: 'Ignore letter case', onChange: () => update() });
  const ignoreSpace = checkbox({ label: 'Ignore spacing differences', onChange: () => update() });
  const hideSame = checkbox({ label: 'Hide unchanged lines', onChange: () => render() });

  function render() {
    hideSame.el.hidden = mode.value !== 'lines';
    if (!last) return;
    if (!before.el.value && !after.el.value) {
      view.replaceChildren(h('p', { class: 'diff-placeholder', text: 'Paste text in both boxes to see what changed.' }));
      return;
    }
    if (last.identical) {
      view.replaceChildren(h('p', { class: 'diff-placeholder', text: 'No differences — the texts match with the current options.' }));
      return;
    }
    view.replaceChildren(...(last.mode === 'lines' ? renderLines(last, hideSame.input.checked) : renderInline(last)));
  }

  async function update() {
    const payload = {
      before: before.el.value,
      after: after.el.value,
      options: { mode: mode.value, ignoreCase: ignoreCase.input.checked, ignoreWhitespace: ignoreSpace.input.checked }
    };
    meta.textContent = 'Comparing…';
    try {
      last = await runner.run(payload);
      status.clear();
      if (last.simplified) status.show('warn', 'These texts differ in so many places that the changed section is shown as one block. Try comparing by Lines, or compare smaller sections.');
      const unit = mode.value === 'lines' ? 'line' : mode.value === 'words' ? 'word' : 'character';
      const s = last.stats;
      meta.textContent = before.el.value || after.el.value
        ? `+${formatNumber(s.added)} added · −${formatNumber(s.removed)} removed (${unit}s)`
        : '';
      render();
    } catch (err) {
      if (err instanceof StaleRequest) return;
      last = null;
      meta.textContent = '';
      view.replaceChildren();
      if (err instanceof TimeoutError) status.show('error', 'This comparison took too long and was stopped. Try comparing by Lines, or split the text into smaller parts.');
      else if (err.name === 'RangeError') status.show('error', err.message);
      else status.show('error', 'Something went wrong while comparing. Please try again.');
    }
  }

  const schedule = debounce(update, 250);
  before.el.addEventListener('input', schedule);
  after.el.addEventListener('input', schedule);

  const swap = button({
    label: 'Swap sides',
    iconName: 'swap',
    variant: 'ghost',
    onClick: () => {
      [before.el.value, after.el.value] = [after.el.value, before.el.value];
      update();
      toast('Original and changed text swapped.');
    }
  });

  const patch = () => (last && !last.identical ? formatDiff(last) : '');

  container.append(
    h('div', { class: 'tool-stack' },
      mode.el,
      h('div', { class: 'options' }, ignoreCase.el, ignoreSpace.el, hideSame.el),
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({ title: 'Original', actions: actionBar(swap), children: [before.field] }),
        panel({ title: 'Changed', actions: actionBar(clearButton([before.el, after.el], { onChange: update, label: 'Clear both' })), children: [after.field] })
      ),
      examples(EXAMPLES, (ex) => { before.el.value = ex.before; after.el.value = ex.after; mode.set(ex.mode); update(); }),
      status.el,
      panel({
        title: 'Differences',
        meta,
        children: [
          h('p', { class: 'legend' }, h('span', { class: 'legend__add', text: '+ Added' }), h('span', { class: 'legend__del', text: '− Removed' })),
          view,
          actionBar(
            copyButton(patch, { label: 'Copy diff', emptyMessage: 'There are no differences to copy.' }),
            downloadButton(patch, { label: 'Download .diff', filename: 'changes.diff', emptyMessage: 'There are no differences to download.' })
          )
        ]
      })
    )
  );
  update();
}
