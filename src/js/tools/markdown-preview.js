import { renderMarkdown, markdownDocument } from '../lib/markdown.js';
import { textStats, formatDuration } from '../lib/text.js';
import { store } from '../core/storage.js';
import {
  h, panel, textArea, checkbox, actionBar, statusLine,
  clearButton, copyButton, downloadButton, examples, liveUpdater, debounce, formatNumber
} from '../ui/toolkit.js';
import { toast } from '../ui/toast.js';

const DRAFT_KEY = 'draft:markdown-preview';
const DRAFT_ON_KEY = 'draft:markdown-preview:enabled';

const CHEAT_SHEET = `# Markdown cheat sheet

Write **bold**, *italic*, ~~strikethrough~~ and \`inline code\`.
End a line with two spaces
to force a line break.

## Lists

- Bullet item
- Another item
  - Nested item
1. Numbered
2. Steps

- [x] Finished task
- [ ] Open task

## Links and quotes

Visit [ToolNest](https://example.com "Example link") or paste a bare link: https://example.com

> Block quotes are great
> for highlighting text.

## Code

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Item     | Qty | Price |
|:---------|:---:|------:|
| Notebook |  2  |   ₹90 |
| Pen      |  5  |   ₹50 |

---

Raw HTML like <b>this</b> is shown as text for safety.
`;

const EXAMPLES = [
  { label: 'Cheat sheet', value: CHEAT_SHEET },
  { label: 'Meeting notes', value: '# Team meeting — 12 March\n\n**Attendees:** Asha, Ben, Carla\n\n## Decisions\n\n1. Launch moves to *April 2*.\n2. Budget approved.\n\n## Action items\n\n- [ ] Ben: update the roadmap\n- [ ] Carla: book the venue\n- [x] Asha: share the slides\n' },
  { label: 'README', value: '# My Project\n\nA short description of what this project does.\n\n## Install\n\n```bash\nnpm install my-project\n```\n\n## Usage\n\n```js\nimport { run } from "my-project";\nrun();\n```\n\n## License\n\nMIT\n' }
];

export function mount(container) {
  const input = textArea({ label: 'Markdown', placeholder: 'Write Markdown here…', rows: 22, mono: true, labelHidden: true });
  const preview = h('div', { class: 'md-preview', 'aria-label': 'Rendered preview', tabindex: '0' });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();
  let html = '';

  const draftOn = store.getJSON(DRAFT_ON_KEY, false) === true;
  const saveDraft = checkbox({ label: 'Save my draft in this browser', checked: draftOn, onChange: (on) => toggleDraft(on) });

  const persist = debounce(() => {
    if (!saveDraft.input.checked) return;
    const r = store.setJSON(DRAFT_KEY, input.el.value);
    if (!r.ok) status.show('warn', `Your draft could not be saved: ${r.error}`);
  }, 600);

  function toggleDraft(on) {
    if (on) {
      const r = store.setJSON(DRAFT_ON_KEY, true);
      if (!r.ok) {
        saveDraft.input.checked = false;
        toast(`Draft saving isn’t available: ${r.error}`, { type: 'error' });
        return;
      }
      persist();
      toast('Your draft will be saved in this browser as you type.');
    } else {
      store.remove(DRAFT_ON_KEY);
      store.remove(DRAFT_KEY);
      status.clear();
      toast('Draft saving is off, and the saved draft was deleted.');
    }
  }

  function render() {
    html = renderMarkdown(input.el.value);
    // Parse in an inert <template> so images don't load before we check them.
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    let blocked = 0;
    for (const img of tpl.content.querySelectorAll('img')) {
      blocked++;
      img.replaceWith(h('span', { class: 'badge badge--muted', text: `Image: ${img.alt || img.getAttribute('src')}` }));
    }
    if (input.el.value.trim()) preview.replaceChildren(tpl.content);
    else preview.replaceChildren(h('p', { class: 'muted', text: 'Your formatted document appears here.' }));

    if (blocked) status.show('info', 'Images are shown as labels in the preview so nothing is fetched from other websites. They appear normally in the downloaded HTML file.');
    else if (!saveDraft.input.checked) status.clear();

    const stats = textStats(input.el.value);
    meta.textContent = input.el.value ? `${formatNumber(stats.words)} words · ${formatDuration(stats.readingSeconds)} read` : '';
    persist();
  }

  const schedule = liveUpdater(render, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  const title = () => (input.el.value.match(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t#]*$/m)?.[1] || 'document')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'document';

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'action-bar' },
        copyButton(() => html, { label: 'Copy HTML', emptyMessage: 'Write some Markdown first.' }),
        downloadButton(() => (input.el.value ? markdownDocument(input.el.value) : ''), { label: 'Download .html', filename: () => `${title()}.html`, mime: 'text/html;charset=utf-8', emptyMessage: 'Write some Markdown first.' }),
        downloadButton(() => input.el.value, { label: 'Download .md', filename: () => `${title()}.md`, mime: 'text/markdown;charset=utf-8', emptyMessage: 'Write some Markdown first.' }),
        saveDraft.el),
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Markdown',
          actions: actionBar(clearButton([input.el], { onChange: render })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; render(); })]
        }),
        panel({ title: 'Preview', meta, children: [preview] })
      )
    )
  );

  if (draftOn) {
    const saved = store.getJSON(DRAFT_KEY, '');
    if (typeof saved === 'string' && saved) {
      input.el.value = saved;
      toast('Your saved draft was restored.');
    }
  }
  render();
}
