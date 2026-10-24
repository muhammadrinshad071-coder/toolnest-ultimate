import { parseInBase, toBase, groupDigits, twosComplement } from '../lib/math.js';
import { h, panel, textInput, selectField, numberInput, resultRows, statusLine, examples, setInvalid } from '../ui/toolkit.js';

const BASES = [
  { id: '10', label: 'Decimal (base 10)' },
  { id: '2', label: 'Binary (base 2)' },
  { id: '8', label: 'Octal (base 8)' },
  { id: '16', label: 'Hexadecimal (base 16)' },
  { id: 'custom', label: 'Other base (2–36)…' }
];

const EXAMPLES = [
  { label: '255 in decimal', value: '255', base: '10' },
  { label: 'Hex colour FF8800', value: 'FF8800', base: '16' },
  { label: 'Binary byte', value: '1010 1100', base: '2' },
  { label: 'Negative number', value: '-42', base: '10' }
];

export function mount(container) {
  const value = textInput({ label: 'Number', value: '255', mono: true, placeholder: 'e.g. 255, ff or 1010' });
  const from = selectField({ label: 'Its base', options: BASES, value: '10', onChange: () => update() });
  const custom = numberInput({ label: 'Custom base', value: '36' });
  const target = numberInput({ label: 'Also convert to base', value: '36', hint: 'Any base from 2 to 36 (digits 0–9 then a–z).' });
  const status = statusLine();
  const rows = resultRows({ empty: 'Enter a whole number.' });

  function readBase(field) {
    const b = Number(field.el.value);
    const ok = Number.isInteger(b) && b >= 2 && b <= 36;
    setInvalid(field.el, !ok);
    return ok ? b : null;
  }

  function update() {
    custom.field.hidden = from.el.value !== 'custom';
    status.clear();
    setInvalid(value.el, false);
    if (!value.el.value.trim()) { rows.set([]); return; }
    const base = from.el.value === 'custom' ? readBase(custom) : Number(from.el.value);
    const other = readBase(target);
    if (!base) { rows.set([]); status.show('error', 'The base must be a whole number from 2 to 36.'); return; }
    let n;
    try {
      n = parseInBase(value.el.value, base);
    } catch (err) {
      setInvalid(value.el, true);
      rows.set([]);
      status.show('error', err.message);
      return;
    }
    const bin = toBase(n, 2);
    const out = [
      { label: 'Decimal', value: groupDigits(n.toString(), 3, ','), emphasis: base !== 10, note: n.toString().length > 3 ? `Without separators: ${n}` : '' },
      { label: 'Binary', value: groupDigits(bin, 4), note: `${bin.replace('-', '').length} bits` },
      { label: 'Octal', value: toBase(n, 8) },
      { label: 'Hexadecimal', value: toBase(n, 16).toUpperCase(), note: n >= 0n ? `0x${toBase(n, 16).toUpperCase()}` : '' }
    ];
    if (other) out.push({ label: `Base ${other}`, value: toBase(n, other) });
    if (n < 0n) {
      for (const bits of [8, 16, 32, 64]) {
        const pattern = twosComplement(n, bits);
        if (pattern) out.push({ label: `${bits}-bit two’s complement`, value: groupDigits(pattern, 4), note: `Hex 0x${BigInt(`0b${pattern}`).toString(16).toUpperCase()}` });
      }
    }
    rows.set(out);
  }

  for (const f of [value, custom, target]) f.el.addEventListener('input', update);

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Input',
        children: [
          value.field,
          h('div', { class: 'input-row' }, from.field, custom.field),
          target.field,
          examples(EXAMPLES, (ex) => { value.el.value = ex.value; from.el.value = ex.base; update(); }),
          status.el
        ]
      }),
      panel({
        title: 'Converted',
        children: [rows.el, h('p', { class: 'field__hint', text: 'Whole numbers of any size are converted exactly. Prefixes such as 0x, 0b and 0o, spaces and underscores are accepted.' })]
      })
    )
  );
  update();
}
