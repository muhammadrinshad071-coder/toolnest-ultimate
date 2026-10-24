import { HASH_ALGORITHMS, digest, hmac, encodeText, formatDigest, sameDigest } from '../lib/hash.js';
import { formatBytes } from '../lib/encoding.js';
import { h, panel, textArea, textInput, selectField, choiceGroup, actionBar, button, statusLine, resultRows, fileDrop, clearButton, debounce } from '../ui/toolkit.js';

const MAX_FILE = 500 * 1e6;
const FORMATS = [{ id: 'hex', label: 'hex (lowercase)' }, { id: 'HEX', label: 'HEX (uppercase)' }, { id: 'base64', label: 'Base64' }];

export function mount(container) {
  const source = choiceGroup({ legend: 'Hash', options: [{ id: 'text', label: 'Text' }, { id: 'file', label: 'A file' }], value: 'text', onChange: () => switchSource() });
  const input = textArea({ label: 'Text to hash', placeholder: 'Type or paste text…', rows: 6, labelHidden: true, spellcheck: false });
  const status = statusLine();
  const format = selectField({ label: 'Output format', options: FORMATS, value: 'hex', onChange: () => render() });
  const key = textInput({ label: 'HMAC secret key (optional)', placeholder: 'Leave empty for a plain hash', hint: 'With a key, SHA results become HMAC signatures. The key never leaves this page.', attrs: { type: 'password', autocomplete: 'off' } });
  const expected = textInput({ label: 'Compare with an expected hash (optional)', mono: true, placeholder: 'Paste a checksum to verify a download' });
  const rows = resultRows({ empty: 'Enter text or choose a file.' });
  let fileBytes = null;
  let fileName = '';
  let results = null;
  let run = 0;

  const drop = fileDrop({
    label: 'Choose a file',
    hint: `or drop it here (up to ${MAX_FILE / 1e6} MB) — it is read on this device only`,
    maxBytes: MAX_FILE,
    onFile: async (file) => {
      status.show('info', `Reading “${file.name}” (${formatBytes(file.size)})…`);
      fileBytes = new Uint8Array(await file.arrayBuffer());
      fileName = file.name;
      compute();
    }
  });

  function switchSource() {
    const isFile = source.value === 'file';
    input.field.hidden = isFile;
    drop.el.hidden = !isFile;
    compute();
  }

  async function compute() {
    const id = ++run;
    status.clear();
    const bytes = source.value === 'file' ? fileBytes : encodeText(input.el.value);
    if (!bytes || (source.value === 'text' && !input.el.value)) {
      results = null;
      rows.set([]);
      return;
    }
    if (bytes.length > 20e6) status.show('info', 'Hashing…');
    try {
      const secret = key.el.value;
      const out = [];
      for (const alg of HASH_ALGORITHMS) {
        if (secret && alg.id === 'MD5') {
          out.push({ alg, bytes: null, note: 'HMAC-MD5 is not offered — use an SHA algorithm.' });
          continue;
        }
        out.push({ alg, bytes: secret ? await hmac(alg.id, secret, bytes) : await digest(alg.id, bytes) });
      }
      if (id !== run) return;
      results = { out, secret: Boolean(secret), size: bytes.length };
      status.clear();
      render();
    } catch (err) {
      if (id !== run) return;
      results = null;
      rows.set([]);
      status.show('error', err.message);
    }
  }

  function render() {
    if (!results) return;
    const want = expected.el.value;
    let matched = null;
    rows.set(results.out.map(({ alg, bytes, note }) => {
      if (!bytes) return { label: alg.label, value: '—', note, copy: false };
      const same = sameDigest(want, bytes);
      if (same) matched = alg.label;
      return {
        label: `${results.secret ? 'HMAC-' : ''}${alg.label}`,
        value: formatDigest(bytes, format.el.value),
        note: [same ? '✓ Matches the expected hash' : '', alg.note || ''].filter(Boolean).join(' · '),
        emphasis: Boolean(same)
      };
    }));
    if (want.trim()) {
      if (matched) status.show('success', `Match: the expected hash equals the ${matched} result${source.value === 'file' ? ` of “${fileName}”` : ''}.`);
      else status.show('error', 'No match: the expected hash differs from every result. Check that you chose the right file and algorithm.');
    } else if (source.value === 'file' && fileName) {
      status.show('info', `Hashes of “${fileName}” (${formatBytes(results.size)}).`);
    }
  }

  input.el.addEventListener('input', debounce(compute, 150));
  key.el.addEventListener('input', debounce(compute, 200));
  expected.el.addEventListener('input', render);

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Input',
        actions: actionBar(clearButton([input.el, key.el, expected.el], { onChange: compute, label: 'Clear' })),
        children: [source.el, input.field, drop.el, key.field, expected.field]
      }),
      panel({
        title: 'Hashes',
        children: [format.field, status.el, rows.el, h('p', { class: 'field__hint', text: 'Text is hashed as UTF-8. SHA hashes use your browser’s Web Crypto API; MD5 is computed in JavaScript. Use SHA-256 or stronger for anything security-related.' })]
      })
    )
  );
  switchSource();
}
