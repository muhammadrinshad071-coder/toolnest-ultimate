import { textToBase64, base64ToBytes, bytesToText, bytesToBase64, sniffType, formatBytes } from '../lib/encoding.js';
import {
  h, panel, textArea, checkbox, choiceGroup, actionBar, button, statusLine, fileDrop,
  clearButton, copyButton, downloadButton, useAsInputButton, examples, liveUpdater
} from '../ui/toolkit.js';
import { toast } from '../ui/toast.js';

const MAX_FILE = 50 * 1e6;

const EXAMPLES = [
  { label: 'Text', value: 'Hello, ToolNest! नमस्ते 👋', direction: 'encode' },
  { label: 'Encoded text', value: 'VG9vbE5lc3QgcnVucyBpbiB5b3VyIGJyb3dzZXIu', direction: 'decode' },
  { label: 'Tiny image', value: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAk0lEQVR4nJXK3QrBYAAG4PfqjDH789nmI0mSJEmSJEmSXKdtttmPbY5dw/scP9AbL1PxbcUXzcBpBZ4aSjUctd/jTjTRoqkWz7rxXE8WRrI0PiszBbXXVgpqb6wM1N7aGai96+Wg9l7koPZBFKD2sV+A2ifnC2qf3RLUvrglqH31KlD7NqhA7busQe2HrEHt5/D3BxXYq5gNxr4QAAAAAElFTkSuQmCC', direction: 'decode' }
];

export function mount(container) {
  const input = textArea({ label: 'Input', placeholder: 'Type text to encode, or paste Base64 to decode…', rows: 10, mono: true, labelHidden: true, spellcheck: false });
  const output = textArea({ label: 'Result', rows: 10, mono: true, readOnly: true, labelHidden: true, spellcheck: false, placeholder: 'The result appears here.' });
  const meta = h('span', { class: 'panel__meta', 'aria-live': 'polite' });
  const status = statusLine();
  const preview = h('div', { class: 'tool-stack' });
  let decoded = null;
  let previewUrl = null;

  const direction = choiceGroup({ legend: 'Direction', options: [{ id: 'encode', label: 'Encode to Base64' }, { id: 'decode', label: 'Decode Base64' }], value: 'encode', onChange: () => update() });
  const urlSafe = checkbox({ label: 'URL-safe (- and _ instead of + and /, no padding)', onChange: () => update() });
  const wrap = checkbox({ label: 'Wrap lines at 76 characters (email/MIME)', onChange: () => update() });

  const drop = fileDrop({
    label: 'Encode a file',
    hint: `or drop any file here (up to ${MAX_FILE / 1e6} MB)`,
    maxBytes: MAX_FILE,
    onFile: async (file) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const b64 = bytesToBase64(bytes, { urlSafe: urlSafe.input.checked, wrap: wrap.input.checked ? 76 : 0 });
      direction.set('encode');
      input.el.value = '';
      output.el.value = file.type && !urlSafe.input.checked && !wrap.input.checked ? `data:${file.type};base64,${b64}` : b64;
      meta.textContent = `${formatBytes(file.size)} file → ${formatBytes(output.el.value.length)} of text`;
      status.show('info', `Encoded “${file.name}”${file.type && !urlSafe.input.checked && !wrap.input.checked ? ' as a data URI you can use in HTML or CSS' : ''}. Base64 is about a third larger than the original file.`);
      preview.replaceChildren();
    }
  });

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    preview.replaceChildren();
  }

  function update() {
    status.clear();
    clearPreview();
    decoded = null;
    const encoding = direction.value === 'encode';
    urlSafe.el.hidden = !encoding;
    wrap.el.hidden = !encoding;
    const text = input.el.value;
    if (!text) { output.el.value = ''; meta.textContent = ''; return; }
    if (encoding) {
      output.el.value = textToBase64(text, { urlSafe: urlSafe.input.checked, wrap: wrap.input.checked ? 76 : 0 });
      meta.textContent = `${formatBytes(new TextEncoder().encode(text).length)} → ${formatBytes(output.el.value.length)}`;
      return;
    }
    try {
      const { bytes, mime } = base64ToBytes(text);
      decoded = { bytes, type: sniffType(bytes) || (mime ? { mime, ext: 'bin' } : null) };
      const asText = bytesToText(bytes);
      meta.textContent = `${formatBytes(bytes.length)} decoded`;
      if (asText !== null && !decoded.type?.mime.startsWith('image/')) {
        output.el.value = asText;
      } else {
        output.el.value = '';
        const kind = decoded.type ? `${decoded.type.mime} file` : 'binary data (not text)';
        status.show('info', `This decodes to ${kind}. Use “Download decoded file” to save it.`);
        if (decoded.type?.mime.startsWith('image/') && decoded.type.mime !== 'image/svg+xml') {
          previewUrl = URL.createObjectURL(new Blob([bytes], { type: decoded.type.mime }));
          preview.replaceChildren(h('p', { class: 'field__hint', text: 'Image preview:' }), h('img', { src: previewUrl, alt: 'Decoded image', class: 'decoded-image' }));
        }
      }
    } catch (err) {
      output.el.value = '';
      meta.textContent = '';
      status.show('error', err.message);
    }
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);

  const downloadDecoded = button({
    label: 'Download decoded file',
    iconName: 'download',
    onClick: () => {
      if (!decoded) return toast('Decode some Base64 first.');
      const blob = new Blob([decoded.bytes], { type: decoded.type?.mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: `decoded.${decoded.type?.ext || 'bin'}`, class: 'visually-hidden' });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });

  container.append(
    h('div', { class: 'tool-stack' },
      direction.el,
      h('div', { class: 'options' }, urlSafe.el, wrap.el),
      drop.el,
      status.el,
      h('div', { class: 'tool-grid tool-grid--split' },
        panel({
          title: 'Input',
          actions: actionBar(clearButton([input.el], { onChange: update })),
          children: [input.field, examples(EXAMPLES, (ex) => { input.el.value = ex.value; direction.set(ex.direction); update(); })]
        }),
        panel({
          title: 'Result',
          meta,
          children: [
            output.field,
            preview,
            actionBar(
              copyButton(() => output.el.value),
              downloadButton(() => output.el.value, { filename: () => (direction.value === 'encode' ? 'encoded.txt' : 'decoded.txt') }),
              downloadDecoded,
              useAsInputButton(output.el, input.el, () => { direction.set(direction.value === 'encode' ? 'decode' : 'encode'); update(); })
            )
          ]
        })
      )
    )
  );
  update();
}
