import { evaluate, CalcError } from '../lib/expression.js';
import { fmt } from '../lib/math.js';
import { h, panel, choiceGroup, actionBar, button, statusLine, copyButton, debounce } from '../ui/toolkit.js';

const KEYS = [
  ['sin(', 'fn'], ['cos(', 'fn'], ['tan(', 'fn'], ['ln(', 'fn'], ['log(', 'fn'],
  ['asin(', 'fn'], ['acos(', 'fn'], ['atan(', 'fn'], ['√', 'fn'], ['^', 'op'],
  ['(', 'op'], [')', 'op'], ['π', 'fn'], ['e', 'fn'], ['!', 'op'],
  ['7'], ['8'], ['9'], ['÷', 'op'], ['⌫', 'fn', 'Delete'],
  ['4'], ['5'], ['6'], ['×', 'op'], ['AC', 'fn', 'Clear all'],
  ['1'], ['2'], ['3'], ['−', 'op'], ['%', 'op'],
  ['0'], ['.'], ['ans', 'fn', 'Previous answer'], ['+', 'op'], ['=', 'eq', 'Calculate']
];

const HISTORY_MAX = 20;

export function mount(container) {
  const input = h('input', {
    type: 'text', class: 'input', inputmode: 'text', autocomplete: 'off', spellcheck: 'false',
    'aria-label': 'Expression', placeholder: 'e.g. 2(3+4)^2'
  });
  const result = h('div', { class: 'big-result calc-display__result', 'aria-live': 'polite' });
  const status = statusLine();
  const historyList = h('ol', { class: 'history', 'aria-label': 'History' });
  let ans = 0;
  let lastAnswer = '';
  const history = [];

  const angle = choiceGroup({
    legend: 'Angles',
    options: [{ id: 'deg', label: 'Degrees' }, { id: 'rad', label: 'Radians' }],
    value: 'deg',
    onChange: () => preview()
  });

  function tryEval() {
    return evaluate(input.value, { angle: angle.value, ans });
  }

  function preview() {
    status.clear();
    input.removeAttribute('aria-invalid');
    if (!input.value.trim()) {
      result.className = 'big-result calc-display__result big-result--muted';
      result.textContent = lastAnswer ? `ans = ${lastAnswer}` : '';
      return;
    }
    try {
      const v = tryEval();
      result.className = 'big-result calc-display__result big-result--muted';
      result.textContent = `= ${fmt(v)}`;
    } catch {
      result.textContent = '';
    }
  }

  function renderHistory() {
    historyList.replaceChildren(...history.map((item) => h('li', {},
      h('button', {
        type: 'button',
        title: 'Use this calculation again',
        onClick: () => { input.value = item.expr; input.focus(); preview(); }
      }, h('span', { class: 'history__expr', text: item.expr }), h('span', { text: `= ${item.value}` })))));
    if (!history.length) historyList.replaceChildren(h('li', { class: 'muted', text: 'Your calculations appear here for this visit only.' }));
  }

  // Declared before use: a preview still pending from the last keystroke must not overwrite the answer.
  let schedulePreview = null;

  function calculate() {
    schedulePreview?.cancel();
    if (!input.value.trim()) return;
    try {
      const v = tryEval();
      ans = v;
      lastAnswer = fmt(v);
      history.unshift({ expr: input.value.trim(), value: lastAnswer });
      history.length = Math.min(history.length, HISTORY_MAX);
      renderHistory();
      result.className = 'big-result calc-display__result';
      result.textContent = lastAnswer;
      status.clear();
      input.value = '';
      input.placeholder = `ans = ${lastAnswer}`;
    } catch (err) {
      if (!(err instanceof CalcError)) throw err;
      input.setAttribute('aria-invalid', 'true');
      status.show('error', err.message);
      if (Number.isInteger(err.position)) input.setSelectionRange(err.position, err.position + 1);
      input.focus();
    }
  }

  function insert(text) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    // After "=", an operator continues from the previous answer.
    const continuing = !input.value && lastAnswer && /^[+×÷^%!−]$/.test(text);
    const piece = continuing ? `ans${text}` : text;
    input.value = input.value.slice(0, start) + piece + input.value.slice(end);
    const caret = start + piece.length;
    input.setSelectionRange(caret, caret);
    preview();
  }

  function press(key) {
    if (key === '=') calculate();
    else if (key === 'AC') { input.value = ''; preview(); }
    else if (key === '⌫') {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      if (start !== end) input.value = input.value.slice(0, start) + input.value.slice(end);
      else if (start > 0) { input.value = input.value.slice(0, start - 1) + input.value.slice(start); input.setSelectionRange(start - 1, start - 1); }
      preview();
    } else insert(key);
  }

  // Function keys insert "sin(" but are labelled "sin"; the bracket key itself stays "(".
  const keyText = (key) => (key.length > 1 && key.endsWith('(') ? key.slice(0, -1) : key);
  const keypad = h('div', { class: 'keypad', role: 'group', 'aria-label': 'Calculator keys' },
    KEYS.map(([key, kind, label]) => h('button', {
      type: 'button',
      class: `key${kind ? ` key--${kind}` : ''}`,
      'aria-label': label || keyText(key),
      // Keep focus (and the caret) in the expression field.
      onMousedown: (e) => e.preventDefault(),
      onClick: () => { press(key); if (window.matchMedia('(hover: hover)').matches) input.focus(); }
    }, keyText(key))));

  schedulePreview = debounce(preview, 80);
  input.addEventListener('input', schedulePreview);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || (e.key === '=' && !e.shiftKey)) { e.preventDefault(); calculate(); }
    else if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; preview(); }
  });

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      h('div', { class: 'tool-stack' },
        h('div', { class: 'calc-display' }, input, result),
        status.el,
        angle.el,
        keypad),
      panel({
        title: 'History',
        actions: actionBar(
          copyButton(() => lastAnswer, { label: 'Copy answer', emptyMessage: 'Calculate something first.' }),
          button({ label: 'Clear', iconName: 'trash', variant: 'ghost', onClick: () => { history.length = 0; renderHistory(); } })
        ),
        children: [
          historyList,
          h('details', { class: 'disclosure' },
            h('summary', { text: 'Supported functions' }),
            h('div', { class: 'disclosure__body' },
              h('p', { class: 'field__hint', text: 'Operators: + − × ÷ ^ (power), ! (factorial), % (percent: 50% = 0.5), mod. Brackets and implicit multiplication like 2π or 3(4+1) work.' }),
              h('p', { class: 'field__hint', text: 'Functions: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, sqrt, cbrt, ln, log (base 10), log(x, base), log2, exp, abs, round(x, places), floor, ceil, min, max, nCr(n, k), nPr(n, k).' }),
              h('p', { class: 'field__hint', text: 'Constants: π (pi), e, tau, phi, and ans for the previous answer. Press Enter to calculate and Esc to clear.' })))
        ]
      })
    )
  );
  renderHistory();
  preview();
  input.focus({ preventScroll: true });
}
