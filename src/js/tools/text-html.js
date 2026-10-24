import { textToHtml, htmlToText } from '../lib/html.js';
import {
  h, panel, textArea, checkbox, choiceGroup, selectField, actionBar, button,
  clearButton, copyButton, downloadButton, examples, liveUpdater, plural
} from '../ui/toolkit.js';
import { toast } from '../ui/toast.js';

const TEXT_MODES = [
  { id: 'paragraphs', label: 'Paragraphs and line breaks (<p>, <br>)' },
  { id: 'escape', label: 'Escape special characters only (< → &lt;)' }
];

const EXAMPLES = [
  { label: 'Plain text', direction: 'toHtml', value: 'Dear team,\nThe report is ready at https://example.com/report.\n\nPrices went up 5% & costs fell < 2%.\nThanks!' },
  { label: 'Web page HTML', direction: 'toText', value: '<h2>Weekly update</h2>\n<p>We shipped <b>3 features</b> &amp; fixed bugs. Details on <a href="https://example.com/blog">our blog</a>.</p>\n<ul><li>Faster search</li><li>Dark mode</li><li>New exports</li></ul>\n<script>trackVisitor()</script>\n<p>Thanks,<br>The team</p>' },
  { label: 'Code snippet', direction: 'toHtml', value: 'if (a < b && b > c) { return "ok"; }', escape: true }
];

export function mount(container) {
  const input = textArea({ label: 'Input', placeholder: 'Paste plain text or HTML…', rows: 12, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Result', rows: 12, mono: true, readOnly: true, labelHidden: true, placeholder: 'The converted result appears here.', spellcheck: false });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });

  const direction = choiceGroup({
    legend: 'Convert',
    options: [{ id: 'toHtml', label: 'Text → HTML' }, { id: 'toText', label: 'HTML → Text' }],
    value: 'toHtml',
    onChange: () => update()
  });

  const textMode = selectField({ label: 'Output', options: TEXT_MODES, value: 'paragraphs', onChange: () => update() });
  const linkify = checkbox({ label: 'Turn web addresses into links', checked: true, onChange: () => update() });
  const nonAscii = checkbox({ label: 'Encode non-ASCII characters (é → &#233;)', onChange: () => update() });
  const toHtmlOptions = h('div', { class: 'tool-stack' }, textMode.field, h('div', { class: 'options' }, linkify.el, nonAscii.el));

  const keepLinks = checkbox({ label: 'Keep link addresses', checked: true, onChange: () => update() });
  const bullets = checkbox({ label: 'Bullets and numbers for list items', checked: true, onChange: () => update() });
  const alt = checkbox({ label: 'Include image descriptions (alt text)', checked: true, onChange: () => update() });
  const toTextOptions = h('div', { class: 'options' }, keepLinks.el, bullets.el, alt.el);

  const preview = h('div', { class: 'md-preview', 'aria-label': 'Rendered preview' });
  const previewBox = h('details', { class: 'disclosure' }, h('summary', { text: 'Preview rendered HTML' }), h('div', { class: 'disclosure__body' }, preview));
  previewBox.addEventListener('toggle', () => renderPreview());

  function renderPreview() {
    // Safe: the HTML comes from textToHtml, which escapes every character of user text.
    if (previewBox.open && direction.value === 'toHtml') preview.innerHTML = output.el.value || '<p class="muted">Nothing to preview yet.</p>';
  }

  function update() {
    const toHtml = direction.value === 'toHtml';
    toHtmlOptions.hidden = !toHtml;
    toTextOptions.hidden = toHtml;
    previewBox.hidden = !toHtml;
    linkify.input.disabled = textMode.el.value === 'escape';
    output.el.value = toHtml
      ? textToHtml(input.el.value, { mode: textMode.el.value, linkify: linkify.input.checked, nonAscii: nonAscii.input.checked })
      : htmlToText(input.el.value, { keepLinks: keepLinks.input.checked, bullets: bullets.input.checked, imageAlt: alt.input.checked });
    meta.textContent = input.el.value ? plural([...output.el.value].length, 'character') : '';
    renderPreview();
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  const swap = button({
    label: 'Convert back',
    iconName: 'swap',
    variant: 'ghost',
    onClick: () => {
      if (!output.el.value) return toast('Nothing to convert back yet.');
      input.el.value = output.el.value;
      direction.set(direction.value === 'toHtml' ? 'toText' : 'toHtml');
      update();
      toast('Result moved to the input and direction switched.');
    }
  });

  container.append(
    h('div', { class: 'tool-stack' },
      direction.el,
      toHtmlOptions,
      toTextOptions,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Input',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => {
            input.el.value = ex.value;
            direction.set(ex.direction);
            textMode.el.value = ex.escape ? 'escape' : 'paragraphs';
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
              downloadButton(() => output.el.value, { filename: () => (direction.value === 'toHtml' ? 'converted.html' : 'converted.txt') }),
              swap
            )
          ]
        })
      ),
      previewBox
    )
  );
  update();
}
