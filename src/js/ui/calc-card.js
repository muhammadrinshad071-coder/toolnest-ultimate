/**
 * A live calculator card: a sentence with inline number inputs and a
 * result that updates as you type. Used by the percentage, ratio and
 * similar calculators so they behave the same way.
 */
import { parseNumber } from '../lib/math.js';
import { h, card, setInvalid, copyText } from './toolkit.js';
import { toast } from './toast.js';

let uid = 0;

/**
 * @param {{title: string, description?: string, parts: Array<string|{key: string, label: string, value?: string, width?: string}|{select: string, label: string, options: Array<{id: string, label: string}>, value: string}>,
 *          compute: (values: object) => {result: string, formula?: string} | null}} spec
 * compute receives numbers for inputs and strings for selects; it may throw
 * an Error whose message is shown to the user.
 */
export function liveCard({ title, description, parts, compute }) {
  const inputs = new Map();
  const result = h('div', { class: 'big-result', 'aria-live': 'polite' });
  const formula = h('p', { class: 'formula' });
  const error = h('p', { class: 'field__hint', role: 'alert' });

  const sentence = h('div', { class: 'inline-sentence' }, parts.map((part) => {
    if (typeof part === 'string') return h('span', { text: part });
    const id = `calc-${++uid}`;
    if (part.select) {
      const el = h('select', { id, class: 'select', 'aria-label': part.label }, part.options.map((o) => h('option', { value: o.id, text: o.label })));
      el.value = part.value;
      el.addEventListener('change', update);
      inputs.set(part.select, { el, kind: 'select' });
      return el;
    }
    const el = h('input', { id, type: 'text', class: 'input', inputmode: 'decimal', autocomplete: 'off', 'aria-label': part.label, placeholder: part.placeholder || '0' });
    el.value = part.value ?? '';
    el.addEventListener('input', update);
    inputs.set(part.key, { el, kind: 'number' });
    return el;
  }));

  function update() {
    const values = {};
    let missing = false;
    let invalid = false;
    for (const [key, { el, kind }] of inputs) {
      if (kind === 'select') { values[key] = el.value; continue; }
      const n = parseNumber(el.value);
      setInvalid(el, Number.isNaN(n));
      if (n === null) missing = true;
      else if (Number.isNaN(n)) invalid = true;
      values[key] = n;
    }
    error.textContent = '';
    if (invalid) {
      result.textContent = '';
      formula.textContent = '';
      error.textContent = 'Use plain numbers, such as 250, 12.5 or 1,000.';
      return;
    }
    if (missing) {
      result.textContent = '—';
      formula.textContent = '';
      return;
    }
    try {
      const out = compute(values);
      result.textContent = out ? out.result : '—';
      formula.textContent = out?.formula || '';
    } catch (err) {
      result.textContent = '';
      formula.textContent = '';
      error.textContent = err.message;
    }
  }

  const copy = h('button', {
    type: 'button',
    class: 'btn btn--ghost btn--sm',
    onClick: async () => {
      const text = result.textContent;
      if (!text || text === '—') return toast('Nothing to copy yet.');
      if (await copyText(text)) toast('Result copied.', { type: 'success', duration: 1800 });
      else toast('Your browser blocked clipboard access.', { type: 'error' });
    }
  }, 'Copy result');

  const el = card({ title, description, children: [sentence, result, formula, error, h('div', { class: 'action-bar' }, copy)] });
  update();
  return { el, update };
}
