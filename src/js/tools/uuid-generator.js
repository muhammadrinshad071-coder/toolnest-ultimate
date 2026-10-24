import { uuidV4, uuidV7, formatUuid, inspectUuid } from '../lib/uuid.js';
import { parseNumber } from '../lib/math.js';
import { h, panel, numberInput, checkbox, choiceGroup, textInput, actionBar, button, statusLine, resultRows, copyButton, downloadButton, setInvalid } from '../ui/toolkit.js';

const MAX = 1000;

export function mount(container) {
  const version = choiceGroup({
    legend: 'Version',
    options: [{ id: 'v4', label: 'v4 — random' }, { id: 'v7', label: 'v7 — time-ordered' }],
    value: 'v4',
    onChange: () => generate()
  });
  const count = numberInput({ label: 'How many', value: '5', hint: `Up to ${MAX.toLocaleString()} at once.` });
  const upper = checkbox({ label: 'UPPERCASE', onChange: () => reformat() });
  const hyphens = checkbox({ label: 'Hyphens', checked: true, onChange: () => reformat() });
  const braces = checkbox({ label: '{Braces}', onChange: () => reformat() });
  const list = h('pre', { class: 'mono-list', 'aria-live': 'polite' });
  const status = statusLine();
  let ids = [];

  const options = () => ({ uppercase: upper.input.checked, hyphens: hyphens.input.checked, braces: braces.input.checked });
  const reformat = () => { list.textContent = ids.map((id) => formatUuid(id, options())).join('\n'); };

  function generate() {
    status.clear();
    const n = parseNumber(count.el.value);
    const ok = Number.isInteger(n) && n >= 1 && n <= MAX;
    setInvalid(count.el, !ok);
    if (!ok) return status.show('error', `Enter a whole number from 1 to ${MAX.toLocaleString()}.`);
    if (version.value === 'v7') {
      // Increase the time by 1 ms per ID so a batch stays in creation order.
      const start = Date.now();
      ids = Array.from({ length: n }, (_, i) => uuidV7(start + i));
    } else {
      ids = Array.from({ length: n }, () => uuidV4());
    }
    reformat();
  }

  const inspect = textInput({ label: 'Paste a UUID to inspect', mono: true, placeholder: 'e.g. 0f8fad5b-d9cb-469f-a165-70867728950e' });
  const details = resultRows({ empty: 'Paste a UUID to see its version, variant and embedded time.' });
  inspect.el.addEventListener('input', () => {
    if (!inspect.el.value.trim()) { details.set([]); setInvalid(inspect.el, false); return; }
    const r = inspectUuid(inspect.el.value);
    setInvalid(inspect.el, !r.valid);
    if (!r.valid) return details.set([{ label: 'Not valid', value: r.error, mono: false, copy: false }]);
    details.set([
      { label: 'Valid UUID', value: r.normalized, emphasis: true },
      { label: 'Version', value: r.versionName, mono: false },
      { label: 'Variant', value: r.variant, mono: false },
      ...(r.timestamp ? [{ label: 'Created', value: r.timestamp.toISOString(), note: 'Time embedded in the UUID' }] : [])
    ]);
  });
  count.el.addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Generate',
        children: [
          version.el,
          count.field,
          h('div', { class: 'options' }, upper.el, hyphens.el, braces.el),
          actionBar(button({ label: 'Generate new', iconName: 'sparkle', variant: 'primary', size: 'md', onClick: generate })),
          status.el,
          h('p', { class: 'field__hint', text: 'v4 IDs are 122 random bits from your browser’s cryptographic generator. v7 IDs start with the current time, so they sort in creation order — good for database keys.' })
        ]
      }),
      panel({
        title: 'UUIDs',
        actions: actionBar(
          copyButton(() => list.textContent, { label: 'Copy all' }),
          downloadButton(() => list.textContent, { filename: 'uuids.txt' })
        ),
        children: [list, inspect.field, details.el]
      })
    )
  );
  generate();
}
