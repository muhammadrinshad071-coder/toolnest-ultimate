import { decodeJwt, describeClaims, describeAlgorithm } from '../lib/jwt.js';
import { textToBase64 } from '../lib/encoding.js';
import { h, panel, textArea, actionBar, statusLine, resultRows, clearButton, copyButton, examples, icon } from '../ui/toolkit.js';

const b64 = (obj) => textToBase64(JSON.stringify(obj), { urlSafe: true });

function sampleTokens() {
  const now = Math.floor(Date.now() / 1000);
  return [
    // The well-known public example token from jwt.io.
    { label: 'Classic example', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
    { label: 'Expired token', value: `${b64({ alg: 'RS256', typ: 'JWT', kid: 'demo-key' })}.${b64({ iss: 'https://login.example.com', sub: 'user-42', aud: 'my-app', iat: now - 7200, exp: now - 3600, scope: 'read write' })}.ZGVtby1zaWduYXR1cmUtbm90LXJlYWw` },
    { label: 'Unsigned (alg none)', value: `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'guest', admin: true, iat: now })}.` }
  ];
}

export function mount(container) {
  const input = textArea({ label: 'JWT', placeholder: 'Paste a token (eyJ…). “Bearer ” prefixes are removed automatically.', rows: 6, mono: true, labelHidden: true, spellcheck: false });
  const status = statusLine();
  const coloured = h('div', { class: 'jwt-token', 'aria-label': 'Token parts' });
  const header = h('pre', { class: 'code-block' });
  const payload = h('pre', { class: 'code-block' });
  const claims = resultRows({ empty: 'No claims to show.' });
  const sigInfo = h('p', { class: 'field__hint' });
  const results = h('div', { class: 'tool-stack' });

  function update() {
    status.clear();
    const value = input.el.value.trim();
    results.hidden = !value;
    if (!value) return;
    try {
      const t = decodeJwt(value);
      input.el.removeAttribute('aria-invalid');
      coloured.replaceChildren(
        h('span', { class: 'jwt-h', text: t.parts[0] }), '.',
        h('span', { class: 'jwt-p', text: t.parts[1] }), '.',
        h('span', { class: 'jwt-s', text: t.parts[2] }));
      header.textContent = JSON.stringify(t.header, null, 2);
      payload.textContent = t.payload ? JSON.stringify(t.payload, null, 2) : t.payloadText;
      const d = describeClaims(t.payload);
      claims.set(d.claims.map((c) => ({
        label: c.name ? `${c.name} (${c.key})` : c.key,
        value: typeof c.value === 'string' ? c.value : JSON.stringify(c.value),
        note: c.date ? `${c.date} · ${c.relative}` : ''
      })));
      if (d.status) status.show(d.state === 'expired' || d.state === 'notyet' ? 'warn' : 'info', `Time check: ${d.status} This says nothing about whether the token is genuine.`);
      sigInfo.textContent = `${describeAlgorithm(t.header.alg)} ${t.signature ? `Signature: ${t.signature.length} characters.` : 'There is no signature.'}`;
      results.hidden = false;
    } catch (err) {
      input.el.setAttribute('aria-invalid', 'true');
      results.hidden = true;
      status.show('error', err.message);
    }
  }

  input.el.addEventListener('input', update);

  container.append(
    h('div', { class: 'tool-stack' },
      h('div', { class: 'notice notice--warn' }, icon('alert', 18),
        h('p', { text: 'Decoding is not verification. Anyone can create a token with any claims; only checking the signature with the issuer’s key proves it is genuine. This tool does not verify signatures, so never trust decoded claims on their own.' })),
      panel({
        title: 'Token',
        actions: actionBar(clearButton([input.el], { onChange: update })),
        children: [input.field, examples(sampleTokens(), (ex) => { input.el.value = ex.value; update(); }), status.el]
      }),
      results
    )
  );

  results.append(
    coloured,
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({ title: 'Header', actions: actionBar(copyButton(() => header.textContent)), children: [header, sigInfo] }),
      panel({ title: 'Payload', actions: actionBar(copyButton(() => payload.textContent)), children: [payload] })
    ),
    panel({ title: 'Claims', children: [claims.el] })
  );
  update();
}
