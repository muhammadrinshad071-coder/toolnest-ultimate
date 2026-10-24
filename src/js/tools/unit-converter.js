import { UNIT_CATEGORIES, getUnitCategory, convertUnit, conversionFactor } from '../lib/units.js';
import { parseNumber, fmt } from '../lib/math.js';
import { h, panel, selectField, numberInput, button, statusLine, resultRows, setInvalid } from '../ui/toolkit.js';

const DEFAULTS = {
  length: ['ft', 'm'], mass: ['kg', 'lb'], temperature: ['c', 'f'], area: ['acre', 'm2'], volume: ['l', 'gal'],
  speed: ['kmh', 'mph'], time: ['h', 'min'], data: ['GB', 'GiB'], pressure: ['bar', 'psi'], energy: ['kwh', 'mj']
};

export function mount(container) {
  const params = new URLSearchParams(window.location.search);
  const startCategory = getUnitCategory(params.get('type')) ? params.get('type') : 'length';

  const category = selectField({ label: 'What are you converting?', options: UNIT_CATEGORIES.map((c) => ({ id: c.id, label: c.name })), value: startCategory, onChange: () => setCategory(true) });
  const value = numberInput({ label: 'Value', value: '1' });
  const from = selectField({ label: 'From', options: [], value: '', onChange: () => update() });
  const to = selectField({ label: 'To', options: [], value: '', onChange: () => update() });
  const result = h('div', { class: 'big-result', 'aria-live': 'polite' });
  const formula = h('p', { class: 'formula' });
  const note = h('p', { class: 'field__hint' });
  const status = statusLine();
  const all = resultRows({ empty: 'Enter a value to see it in every unit.' });

  const fill = (select, units, selected) => {
    select.el.replaceChildren(...units.map((u) => h('option', { value: u.id, text: `${u.name} (${u.symbol})` })));
    select.el.value = selected;
  };

  function setCategory(fromUser) {
    const cat = getUnitCategory(category.el.value);
    const [a, b] = DEFAULTS[cat.id];
    fill(from, cat.units, fromUser || !params.get('from') ? a : params.get('from'));
    fill(to, cat.units, fromUser || !params.get('to') ? b : params.get('to'));
    if (!from.el.value) from.el.value = a;
    if (!to.el.value) to.el.value = b;
    update();
  }

  function update() {
    const cat = getUnitCategory(category.el.value);
    const v = parseNumber(value.el.value);
    status.clear();
    setInvalid(value.el, Number.isNaN(v));
    const url = new URLSearchParams({ type: cat.id, from: from.el.value, to: to.el.value });
    window.history.replaceState(null, '', `?${url}`);
    const fromUnit = cat.units.find((u) => u.id === from.el.value);
    const toUnit = cat.units.find((u) => u.id === to.el.value);
    note.textContent = [fromUnit.note, toUnit.note].filter(Boolean).filter((n, i, arr) => arr.indexOf(n) === i).join(' ');
    const factor = conversionFactor(cat.id, fromUnit.id, toUnit.id);
    formula.textContent = factor === null
      ? temperatureFormula(fromUnit.id, toUnit.id)
      : `1 ${fromUnit.symbol} = ${fmt(factor)} ${toUnit.symbol}`;
    if (v === null || Number.isNaN(v)) {
      result.textContent = '';
      all.set([]);
      if (Number.isNaN(v)) status.show('error', 'Enter a number, such as 12, 3.5 or 1,500.');
      return;
    }
    try {
      const r = convertUnit(v, cat.id, fromUnit.id, toUnit.id);
      result.textContent = `${fmt(v)} ${fromUnit.symbol} = ${fmt(r)} ${toUnit.symbol}`;
      all.set(cat.units.filter((u) => u.id !== fromUnit.id).map((u) => ({
        label: u.name,
        value: `${fmt(convertUnit(v, cat.id, fromUnit.id, u.id))} ${u.symbol}`,
        emphasis: u.id === toUnit.id
      })));
    } catch (err) {
      result.textContent = '';
      all.set([]);
      status.show('error', err.message);
    }
  }

  value.el.addEventListener('input', update);

  const swap = button({
    label: 'Swap units',
    iconName: 'swap',
    variant: 'ghost',
    onClick: () => {
      [from.el.value, to.el.value] = [to.el.value, from.el.value];
      update();
    }
  });

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'input-row' }, category.field, value.field),
      h('div', { class: 'input-row' }, from.field, to.field),
      h('div', { class: 'action-bar' }, swap),
      status.el,
      panel({ title: 'Result', children: [result, formula, note] }),
      panel({ title: 'In every unit', children: [all.el] })
    )
  );
  setCategory(false);
}

function temperatureFormula(a, b) {
  const f = {
    'c>f': '°F = °C × 9/5 + 32', 'f>c': '°C = (°F − 32) × 5/9', 'c>k': 'K = °C + 273.15', 'k>c': '°C = K − 273.15',
    'f>k': 'K = (°F − 32) × 5/9 + 273.15', 'k>f': '°F = (K − 273.15) × 9/5 + 32', 'r>k': 'K = °R × 5/9', 'k>r': '°R = K × 9/5',
    'f>r': '°R = °F + 459.67', 'r>f': '°F = °R − 459.67', 'c>r': '°R = (°C + 273.15) × 9/5', 'r>c': '°C = (°R − 491.67) × 5/9'
  };
  return a === b ? 'Same unit' : f[`${a}>${b}`] || '';
}
