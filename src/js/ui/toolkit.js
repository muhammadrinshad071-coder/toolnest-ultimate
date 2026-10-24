/**
 * Reusable building blocks for tool interfaces.
 *
 * All user-provided content is inserted with textContent (never innerHTML),
 * so pasted text can't inject markup. innerHTML is used only for the
 * built-in icon strings.
 */
import { iconSvg } from '../core/icons.js';
import { toast } from './toast.js';

let uid = 0;
export const nextId = (prefix = 'tn') => `${prefix}-${++uid}`;

/** Create an element: h('div', { class: 'x', onClick: fn }, child, 'text') */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'value' || key === 'checked' || key === 'readOnly' || key === 'disabled') el[key] = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function icon(name, size = 18) {
  const t = document.createElement('template');
  t.innerHTML = iconSvg(name, { size });
  return t.content.firstElementChild;
}

export function debounce(fn, ms) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

const numberFormat = new Intl.NumberFormat();
export function formatNumber(n, maxFractionDigits = 0) {
  if (!Number.isFinite(n)) return '—';
  if (maxFractionDigits === 0) return numberFormat.format(Math.round(n));
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits }).format(n);
}

export function plural(n, one, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

/* ------------------------------------------------------------------ */
/* Buttons & actions                                                   */
/* ------------------------------------------------------------------ */

export function button({ label, iconName, variant = 'secondary', size = 'sm', onClick, title, ariaLabel, type = 'button' }) {
  return h('button', {
    type,
    class: `btn btn--${variant}${size === 'sm' ? ' btn--sm' : ''}`,
    title,
    'aria-label': ariaLabel,
    onClick
  }, iconName ? icon(iconName, 16) : null, label ? h('span', { text: label }) : null);
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall back below */ }
  // Fallback for non-secure contexts and older browsers.
  const ta = h('textarea', { 'aria-hidden': 'true', class: 'visually-hidden', readonly: true });
  ta.value = text;
  document.body.append(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}

export function copyButton(getText, { label = 'Copy', emptyMessage = 'Nothing to copy yet.' } = {}) {
  const btn = button({ label, iconName: 'copy' });
  btn.addEventListener('click', async () => {
    const text = getText();
    if (!text) {
      toast(emptyMessage);
      return;
    }
    if (await copyText(text)) {
      toast('Copied to clipboard.', { type: 'success', duration: 2000 });
      const span = btn.querySelector('span');
      if (span) {
        span.textContent = 'Copied';
        setTimeout(() => { span.textContent = label; }, 1500);
      }
    } else {
      toast('Your browser blocked clipboard access. Select the text and press Ctrl+C instead.', { type: 'error' });
    }
  });
  return btn;
}

export function downloadText(text, filename, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename, class: 'visually-hidden' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadButton(getText, { filename, mime, label = 'Download', emptyMessage = 'Nothing to download yet.' }) {
  return button({
    label,
    iconName: 'download',
    onClick: () => {
      const text = getText();
      if (!text) {
        toast(emptyMessage);
        return;
      }
      downloadText(text, typeof filename === 'function' ? filename() : filename, mime);
    }
  });
}

/**
 * Clears the given inputs, keeping a copy so the user can undo.
 * This is the "prevent accidental data loss" safety net for every tool.
 */
export function clearButton(inputs, { onChange, label = 'Clear' } = {}) {
  return button({
    label,
    iconName: 'eraser',
    variant: 'ghost',
    onClick: () => {
      const saved = inputs.map((el) => el.value);
      if (saved.every((v) => v === '')) {
        toast('Already empty.');
        return;
      }
      inputs.forEach((el) => { el.value = ''; });
      onChange?.();
      inputs[0]?.focus();
      toast('Cleared.', {
        action: {
          label: 'Undo',
          onClick: () => {
            inputs.forEach((el, i) => { el.value = saved[i]; });
            onChange?.();
          }
        }
      });
    }
  });
}

/** Moves a result back into the input for another pass (with undo). */
export function useAsInputButton(output, input, onChange) {
  return button({
    label: 'Use as input',
    iconName: 'swap',
    variant: 'ghost',
    onClick: () => {
      if (!output.value) {
        toast('Nothing to move yet.');
        return;
      }
      const previous = input.value;
      input.value = output.value;
      onChange?.();
      toast('Result moved to the input.', {
        action: { label: 'Undo', onClick: () => { input.value = previous; onChange?.(); } }
      });
    }
  });
}

export function actionBar(...buttons) {
  return h('div', { class: 'action-bar' }, buttons);
}

export function examples(list, onPick) {
  return h('div', { class: 'examples' },
    h('span', { text: 'Try an example:' }),
    list.map((ex) => button({ label: ex.label, variant: 'ghost', onClick: () => onPick(ex) }))
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export function textArea({ label, placeholder = '', rows = 10, value = '', mono = false, readOnly = false, hint, spellcheck = true, labelHidden = false }) {
  const id = nextId('ta');
  const hintId = hint ? `${id}-hint` : null;
  const el = h('textarea', {
    id,
    class: `textarea${mono ? ' textarea--mono' : ''}`,
    rows,
    placeholder,
    readOnly,
    spellcheck: spellcheck ? 'true' : 'false',
    'aria-describedby': hintId,
    autocomplete: 'off',
    autocapitalize: 'off'
  });
  el.value = value;
  const field = h('div', { class: 'field' },
    h('label', { class: labelHidden ? 'visually-hidden' : 'field__label', for: id, text: label }),
    el,
    hint ? h('p', { class: 'field__hint', id: hintId, text: hint }) : null
  );
  return { field, el };
}

export function textInput({ label, placeholder = '', value = '', mono = false, type = 'text', hint, attrs = {} }) {
  const id = nextId('in');
  const hintId = hint ? `${id}-hint` : null;
  const el = h('input', { id, type, class: `input${mono ? ' input--mono' : ''}`, placeholder, autocomplete: 'off', spellcheck: 'false', 'aria-describedby': hintId, ...attrs });
  el.value = value;
  const field = h('div', { class: 'field' },
    h('label', { class: 'field__label', for: id, text: label }),
    el,
    hint ? h('p', { class: 'field__hint', id: hintId, text: hint }) : null
  );
  return { field, el };
}

export function checkbox({ label, checked = false, onChange }) {
  const input = h('input', { type: 'checkbox', checked });
  if (onChange) input.addEventListener('change', () => onChange(input.checked));
  return { el: h('label', { class: 'check' }, input, h('span', { text: label })), input };
}

/** A group of radio buttons styled as chips. */
export function choiceGroup({ legend, options, value, onChange, legendHidden = false }) {
  const name = nextId('choice');
  const inputs = [];
  const el = h('fieldset', { class: 'choice-group' },
    h('legend', { class: legendHidden ? 'visually-hidden' : '', text: legend }),
    h('div', { class: 'choices' }, options.map((opt) => {
      const input = h('input', { type: 'radio', name, value: opt.id, checked: opt.id === value });
      input.addEventListener('change', () => { if (input.checked) onChange?.(opt.id); });
      inputs.push(input);
      return h('label', { class: 'choice' }, input, h('span', { text: opt.label }));
    }))
  );
  return {
    el,
    get value() { return inputs.find((i) => i.checked)?.value; },
    set(v) { inputs.forEach((i) => { i.checked = i.value === v; }); }
  };
}

export function selectField({ label, options, value, onChange }) {
  const id = nextId('sel');
  const el = h('select', { id, class: 'select' }, options.map((o) => h('option', { value: o.id, text: o.label })));
  el.value = value;
  if (onChange) el.addEventListener('change', () => onChange(el.value));
  return { field: h('div', { class: 'field' }, h('label', { class: 'field__label', for: id, text: label }), el), el };
}

/* ------------------------------------------------------------------ */
/* Layout & feedback                                                   */
/* ------------------------------------------------------------------ */

export function panel({ title, meta, actions, children = [] }) {
  const metaEl = meta instanceof Node ? meta : meta ? h('span', { class: 'panel__meta', text: meta }) : null;
  return h('div', { class: 'panel' },
    title || metaEl || actions ? h('div', { class: 'panel__head' }, title ? h('h2', { class: 'panel__title', text: title }) : null, metaEl, actions || null) : null,
    children
  );
}

/** An inline notice for validation errors and warnings. Empty = hidden. */
export function statusLine() {
  const el = h('div', { class: 'status-line', 'aria-live': 'polite' });
  return {
    el,
    show(type, message) {
      el.replaceChildren(h('div', { class: `notice notice--${type}` },
        icon(type === 'error' ? 'alert' : type === 'success' ? 'check' : type === 'warn' ? 'alert' : 'info', 18),
        h('p', { text: message })));
    },
    clear() { el.replaceChildren(); }
  };
}

/**
 * Grid of statistic tiles. defs: [{ key, label, primary? }]
 * update(values) where values[key] is the already-formatted string.
 */
export function statGrid(defs) {
  const cells = new Map();
  const el = h('div', { class: 'stat-grid' }, defs.map((d) => {
    const value = h('span', { class: 'stat__value', text: '0' });
    cells.set(d.key, value);
    return h('div', { class: `stat${d.primary ? ' stat--primary' : ''}` }, value, h('span', { class: 'stat__label', text: d.label }));
  }));
  return {
    el,
    update(values) {
      for (const [key, node] of cells) if (key in values) node.textContent = values[key];
    }
  };
}

export function progressBar(label) {
  const bar = h('div', { class: 'progress__bar' });
  const el = h('div', { class: 'progress', role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, bar);
  return {
    el,
    set(percent) {
      const p = Math.max(0, Math.min(100, percent));
      bar.style.width = `${p}%`;
      el.setAttribute('aria-valuenow', String(Math.round(p)));
      el.classList.toggle('progress--done', p >= 100);
    }
  };
}

/** Schedules expensive updates: immediate for small inputs, debounced for large ones. */
export function liveUpdater(fn, sizeOf) {
  let frame = 0;
  const slow = debounce(fn, 250);
  return () => {
    if (sizeOf() > 150000) {
      slow();
      return;
    }
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fn);
  };
}

export function tableView(columns, rows) {
  return h('div', { class: 'table-wrap' },
    h('table', { class: 'table' },
      h('thead', {}, h('tr', {}, columns.map((c) => h('th', { scope: 'col', class: c.num ? 'num' : '', text: c.label })))),
      h('tbody', {}, rows.map((r) => h('tr', {}, columns.map((c) => h('td', { class: c.num ? 'num' : c.className || '', text: r[c.key] })))))
    )
  );
}

/* ------------------------------------------------------------------ */
/* Calculators & results                                               */
/* ------------------------------------------------------------------ */

/** A text input tuned for numbers (keeps the full keyboard so "-" and "," work everywhere). */
export function numberInput({ label, value = '', placeholder = '', hint, suffix }) {
  const field = textInput({ label, value, placeholder, hint, attrs: { inputmode: 'decimal', autocomplete: 'off' } });
  if (suffix) {
    field.el.after(h('span', { class: 'input-suffix', 'aria-hidden': 'true', text: suffix }));
    field.el.parentElement.classList.add('field--suffix');
  }
  return field;
}

/** A small self-contained calculator section. */
export function card({ title, description, children = [] }) {
  return h('section', { class: 'calc-card' },
    h('h2', { class: 'calc-card__title', text: title }),
    description ? h('p', { class: 'calc-card__desc', text: description }) : null,
    children);
}

/**
 * Label/value rows, each with its own copy button.
 * set([{ label, value, note?, emphasis?, mono? }])
 */
export function resultRows({ empty = 'Results appear here.' } = {}) {
  const el = h('dl', { class: 'result-rows', 'aria-live': 'polite' });
  const set = (rows) => {
    if (!rows || !rows.length) {
      el.replaceChildren(h('div', { class: 'result-rows__empty', text: empty }));
      return;
    }
    el.replaceChildren(...rows.map((row) => {
      const value = String(row.value);
      return h('div', { class: `result-row${row.emphasis ? ' result-row--main' : ''}` },
        h('dt', { text: row.label }),
        h('dd', {},
          h('span', { class: `result-row__value${row.mono === false ? '' : ' result-row__value--mono'}`, text: value }),
          row.note ? h('span', { class: 'result-row__note', text: row.note }) : null),
        row.copy === false || value === '—' ? h('span', {}) : h('button', {
          type: 'button',
          class: 'icon-btn icon-btn--sm',
          'aria-label': `Copy ${row.label}`,
          title: 'Copy',
          onClick: async () => {
            if (await copyText(value)) toast(`${row.label} copied.`, { type: 'success', duration: 1800 });
            else toast('Your browser blocked clipboard access. Select the text and press Ctrl+C instead.', { type: 'error' });
          }
        }, icon('copy', 16)));
    }));
  };
  set([]);
  return { el, set };
}

/**
 * Drag-and-drop file picker that also works with keyboard and touch.
 * onFile(file) is called after the size check.
 */
export function fileDrop({ label = 'Choose a file', hint = 'or drag and drop it here', accept = '', maxBytes = Infinity, onFile }) {
  const input = h('input', { type: 'file', class: 'visually-hidden', accept: accept || null, tabindex: '-1', 'aria-hidden': 'true' });
  const name = h('span', { class: 'dropzone__file' });
  const el = h('div', { class: 'dropzone' },
    icon('upload', 24),
    h('button', { type: 'button', class: 'btn btn--secondary btn--sm', onClick: () => input.click() }, h('span', { text: label })),
    h('span', { class: 'dropzone__hint', text: hint }),
    name,
    input);
  const take = (file) => {
    if (!file) return;
    if (file.size > maxBytes) {
      const mb = Math.round(maxBytes / 1e6);
      toast(`That file is ${Math.round(file.size / 1e6)} MB. The limit here is ${mb} MB to keep your browser responsive.`, { type: 'error' });
      return;
    }
    name.textContent = file.name;
    onFile(file);
  };
  input.addEventListener('change', () => { take(input.files[0]); input.value = ''; });
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('is-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('is-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('is-over');
    take(e.dataTransfer?.files?.[0]);
  });
  return { el, reset: () => { name.textContent = ''; } };
}

/** Marks an input invalid (or valid) for assistive tech and styling. */
export function setInvalid(el, invalid) {
  if (invalid) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
}
