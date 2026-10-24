import { parseColor, formatColor, toHex, contrastRatio, wcagLevels, nearestNamedColor } from '../lib/color.js';
import { h, panel, textInput, resultRows, statusLine, examples } from '../ui/toolkit.js';

const EXAMPLES = [
  { label: 'Tomato', value: 'tomato' },
  { label: 'Brand indigo', value: '#4f46e5' },
  { label: 'rgb() with alpha', value: 'rgb(16 185 129 / 60%)' },
  { label: 'HSL', value: 'hsl(210, 90%, 45%)' },
  { label: 'OKLCH', value: 'oklch(70% 0.15 145)' }
];

const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const BLACK = { r: 0, g: 0, b: 0, a: 1 };

function contrastBox(label, bg, fg, ratio) {
  const levels = wcagLevels(ratio);
  const badge = (ok, text) => h('span', { class: `badge ${ok ? 'badge--pass' : 'badge--fail'}`, text: `${ok ? '✓' : '✗'} ${text}` });
  const sample = h('div', {});
  sample.style.backgroundColor = toHex(bg);
  sample.style.color = toHex(fg);
  sample.append(
    h('strong', { text: label }),
    h('span', { text: `Contrast ${ratio.toFixed(2)} : 1` }),
    h('div', { class: 'badge-row' }, badge(levels.normalAA, 'AA text'), badge(levels.normalAAA, 'AAA text'), badge(levels.largeAA, 'AA large')));
  return sample;
}

export function mount(container) {
  const input = textInput({ label: 'Colour', value: '#ff6347', mono: true, placeholder: 'HEX, rgb(), hsl(), hwb(), oklch() or a CSS name' });
  const picker = h('input', { type: 'color', value: '#ff6347', 'aria-label': 'Pick a colour' });
  const swatch = h('span', {});
  const swatchBox = h('div', { class: 'swatch-big', role: 'img', 'aria-label': 'Colour preview' }, swatch);
  const name = h('p', { class: 'field__hint' });
  const status = statusLine();
  const rows = resultRows({ empty: 'Enter a colour.' });
  const contrast = h('div', { class: 'contrast-sample' });

  function update(fromPicker = false) {
    status.clear();
    if (!input.el.value.trim()) {
      rows.set([]);
      contrast.replaceChildren();
      return;
    }
    let c;
    try {
      c = parseColor(input.el.value);
      input.el.removeAttribute('aria-invalid');
    } catch (err) {
      input.el.setAttribute('aria-invalid', 'true');
      status.show('error', err.message);
      return;
    }
    const f = formatColor(c);
    swatch.style.backgroundColor = f.rgb;
    swatchBox.setAttribute('aria-label', `Colour preview: ${f.hex}`);
    if (!fromPicker) picker.value = toHex({ ...c, a: 1 });
    const near = nearestNamedColor(c);
    name.textContent = near.exact ? `CSS name: ${near.name}` : `Closest CSS name: ${near.name} (${near.hex})`;
    rows.set([
      { label: 'HEX', value: f.hex, emphasis: true },
      { label: 'RGB', value: f.rgb },
      { label: 'HSL', value: f.hsl },
      { label: 'HWB', value: f.hwb },
      { label: 'OKLCH', value: f.oklch, note: 'Perceptual colour space supported by modern CSS' },
      { label: 'HSV / HSB', value: f.hsv, note: 'Used by design apps; not a CSS format' },
      { label: 'CMYK', value: f.cmyk, note: 'Approximate — real print colours depend on the printer profile' }
    ]);
    const solid = { ...c, a: 1 };
    contrast.replaceChildren(
      contrastBox('White text on this colour', solid, WHITE, contrastRatio(solid, WHITE)),
      contrastBox('Black text on this colour', solid, BLACK, contrastRatio(solid, BLACK)));
    if (c.a < 1) status.show('info', 'Contrast is calculated for the solid colour; transparency makes the result depend on what is behind it.');
  }

  input.el.addEventListener('input', () => update());
  picker.addEventListener('input', () => { input.el.value = picker.value; update(true); });

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Colour',
        children: [
          h('div', { class: 'color-preview' }, swatchBox, h('div', { class: 'tool-stack' }, h('div', { class: 'color-input-row' }, input.field, picker), name)),
          examples(EXAMPLES, (ex) => { input.el.value = ex.value; update(); }),
          status.el,
          h('h3', { class: 'panel__title', text: 'Readability (WCAG 2)' }),
          contrast
        ]
      }),
      panel({ title: 'All formats', children: [rows.el] })
    )
  );
  update();
}
