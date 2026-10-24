import { percentOf, whatPercent, percentChange, percentDifference, increaseBy, decreaseBy, reversePercent, fmt } from '../lib/math.js';
import { liveCard } from '../ui/calc-card.js';
import { h } from '../ui/toolkit.js';

const pct = (x) => `${fmt(x, 10)}%`;

export function mount(container) {
  const cards = [
    liveCard({
      title: 'Percentage of a number',
      parts: ['What is', { key: 'p', label: 'Percent', value: '18' }, '% of', { key: 'x', label: 'Number', value: '2500' }, '?'],
      compute: ({ p, x }) => ({ result: fmt(percentOf(p, x)), formula: `${fmt(p)} ÷ 100 × ${fmt(x)}` })
    }),
    liveCard({
      title: 'What percent is it?',
      parts: [{ key: 'part', label: 'Part', value: '45' }, 'is what % of', { key: 'whole', label: 'Whole', value: '60' }, '?'],
      compute: ({ part, whole }) => ({ result: pct(whatPercent(part, whole)), formula: `${fmt(part)} ÷ ${fmt(whole)} × 100` })
    }),
    liveCard({
      title: 'Percentage change',
      description: 'Increase or decrease from an old value to a new one.',
      parts: ['From', { key: 'a', label: 'Old value', value: '80' }, 'to', { key: 'b', label: 'New value', value: '100' }],
      compute: ({ a, b }) => {
        const change = percentChange(a, b);
        const word = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change';
        return { result: change === 0 ? '0% (no change)' : `${pct(Math.abs(change))} ${word}`, formula: `(${fmt(b)} − ${fmt(a)}) ÷ |${fmt(a)}| × 100` };
      }
    }),
    liveCard({
      title: 'Percentage difference',
      description: 'Compares two values without treating either as the starting point.',
      parts: ['Between', { key: 'a', label: 'First value', value: '80' }, 'and', { key: 'b', label: 'Second value', value: '100' }],
      compute: ({ a, b }) => ({ result: pct(percentDifference(a, b)), formula: `|${fmt(a)} − ${fmt(b)}| ÷ ((|${fmt(a)}| + |${fmt(b)}|) ÷ 2) × 100` })
    }),
    liveCard({
      title: 'Add or subtract a percentage',
      description: 'For discounts, tax, salary rises and price changes.',
      parts: [{ select: 'dir', label: 'Increase or decrease', value: 'inc', options: [{ id: 'inc', label: 'Increase' }, { id: 'dec', label: 'Decrease' }] }, { key: 'x', label: 'Value', value: '1000' }, 'by', { key: 'p', label: 'Percent', value: '18' }, '%'],
      compute: ({ dir, x, p }) => {
        const r = dir === 'inc' ? increaseBy(x, p) : decreaseBy(x, p);
        return { result: fmt(r), formula: `${fmt(x)} ${dir === 'inc' ? '+' : '−'} ${fmt(Math.abs(r - x))} (${fmt(p)}% of ${fmt(x)})` };
      }
    }),
    liveCard({
      title: 'Original value before a percentage change',
      description: 'For example, the price before 18% GST was added.',
      parts: [{ key: 'final', label: 'Final value', value: '1180' }, 'after a', { key: 'p', label: 'Percent change', value: '18' }, '% change was'],
      compute: ({ final, p }) => ({ result: fmt(reversePercent(final, p)), formula: `${fmt(final)} ÷ (1 + ${fmt(p)} ÷ 100)` })
    })
  ];

  container.append(
    h('div', { class: 'tool-stack' },
      h('p', { class: 'field__hint', text: 'Every calculator updates as you type. Use a minus sign for decreases in the last calculator (for example −20 for a 20% discount).' }),
      h('div', { class: 'calc-grid' }, cards.map((c) => c.el)))
  );
}
