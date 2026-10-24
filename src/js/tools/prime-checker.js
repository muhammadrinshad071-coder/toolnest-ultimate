import { parseInteger, isPrime, factorize, divisorCount, nextPrime, previousPrime, primesBetween, PRIME_LIMIT, SIEVE_LIMIT, parseNumber } from '../lib/math.js';
import { h, card, textInput, numberInput, resultRows, actionBar, button, statusLine, copyButton, downloadButton, debounce, formatNumber, setInvalid } from '../ui/toolkit.js';

const SUPERSCRIPT = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = (n) => String(n).replace(/\d/g, (d) => SUPERSCRIPT[d]);
const SHOW_LIMIT = 10000;
const FACTOR_LIMIT = 10n ** 18n;

export function mount(container) {
  // Check a number
  const n = textInput({ label: 'Number', value: '360', placeholder: 'e.g. 97 or 1000000007', attrs: { inputmode: 'numeric' } });
  const rows = resultRows({ empty: 'Enter a whole number.' });
  const check = () => {
    const raw = n.el.value.trim();
    if (!raw) { rows.set([]); setInvalid(n.el, false); return; }
    const v = parseInteger(raw);
    if (v === null) {
      setInvalid(n.el, true);
      rows.set([{ label: 'Problem', value: 'Enter a whole number without decimals.', mono: false, copy: false }]);
      return;
    }
    const abs = v < 0n ? -v : v;
    if (abs > PRIME_LIMIT) {
      setInvalid(n.el, true);
      rows.set([{ label: 'Problem', value: 'Numbers up to 10²⁴ (a 1 followed by 24 zeros) are supported.', mono: false, copy: false }]);
      return;
    }
    setInvalid(n.el, false);
    const prime = isPrime(v);
    // Factoring huge numbers can take seconds, so it stops at 10^18 (the prime test itself is instant).
    const canFactor = abs <= FACTOR_LIMIT;
    const factors = canFactor ? factorize(abs) : [];
    const out = [{
      label: 'Is it prime?',
      value: prime ? `Yes — ${v} is prime` : `No — ${v} is not prime`,
      mono: false,
      emphasis: true,
      note: v < 2n ? 'Prime numbers are whole numbers greater than 1.' : (!prime && factors.length ? `Divisible by ${factors[0].prime}` : '')
    }];
    if (abs >= 2n && canFactor) {
      out.push({ label: 'Prime factors', value: factors.map((f) => `${f.prime}${f.power > 1 ? sup(f.power) : ''}`).join(' × ') });
      out.push({ label: 'Number of divisors', value: formatNumber(divisorCount(factors)) });
    } else if (!canFactor && !prime) {
      out.push({ label: 'Prime factors', value: 'Shown for numbers up to 10¹⁸.', mono: false, copy: false });
    }
    const next = nextPrime(v < 0n ? 0n : v);
    const prev = v > 2n ? previousPrime(v) : null;
    if (prev) out.push({ label: 'Previous prime', value: prev.toString() });
    out.push({ label: 'Next prime', value: next.toString() });
    rows.set(out);
  };
  n.el.addEventListener('input', debounce(check, 150));

  // List primes in a range
  const from = numberInput({ label: 'From', value: '1' });
  const to = numberInput({ label: 'To', value: '100' });
  const status = statusLine();
  const list = h('pre', { class: 'mono-list', 'aria-live': 'polite' });
  const meta = h('p', { class: 'field__hint' });
  let all = [];
  const listPrimes = () => {
    status.clear();
    const a = parseNumber(from.el.value);
    const b = parseNumber(to.el.value);
    const bad = (x) => x === null || Number.isNaN(x) || !Number.isInteger(x) || x < 0;
    setInvalid(from.el, bad(a));
    setInvalid(to.el, bad(b));
    if (bad(a) || bad(b)) return status.show('error', 'Use whole numbers of 0 or more.');
    if (b > SIEVE_LIMIT) return status.show('error', `The range can go up to ${formatNumber(SIEVE_LIMIT)}.`);
    all = primesBetween(a, b);
    meta.textContent = `${formatNumber(all.length)} prime${all.length === 1 ? '' : 's'} between ${formatNumber(a)} and ${formatNumber(b)}${all.length > SHOW_LIMIT ? ` — showing the first ${formatNumber(SHOW_LIMIT)}; copy or download for all` : ''}.`;
    list.textContent = all.slice(0, SHOW_LIMIT).join(', ') || 'No primes in this range.';
  };

  container.append(
    h('div', { class: 'calc-grid' },
      card({
        title: 'Check a number',
        description: 'Primality is checked with the deterministic Miller–Rabin test, which is exact for every number in the supported range.',
        children: [n.field, rows.el]
      }),
      card({
        title: 'List primes in a range',
        children: [
          h('div', { class: 'input-row' }, from.field, to.field),
          actionBar(
            button({ label: 'List primes', variant: 'primary', onClick: listPrimes }),
            copyButton(() => all.join(', '), { emptyMessage: 'List some primes first.' }),
            downloadButton(() => all.join('\n'), { filename: 'primes.txt', emptyMessage: 'List some primes first.' })
          ),
          status.el,
          meta,
          list
        ]
      })
    )
  );
  check();
  listPrimes();
}
