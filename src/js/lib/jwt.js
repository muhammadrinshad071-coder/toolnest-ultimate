/**
 * JWT viewer. This only DECODES a token — anyone can do that, because the
 * header and payload are just Base64. It does not and cannot verify the
 * signature, so decoded claims must never be trusted on their own.
 */
import { base64ToBytes, bytesToText } from './encoding.js';
import { relativeTime } from './time.js';

function decodeSegment(segment, label) {
  let bytes;
  try {
    ({ bytes } = base64ToBytes(segment));
  } catch {
    throw new SyntaxError(`The ${label} is not valid Base64URL.`);
  }
  const text = bytesToText(bytes);
  if (text === null) throw new SyntaxError(`The ${label} does not contain readable text.`);
  return text;
}

/**
 * @returns {{header: object, payload: object|null, payloadText: string, signature: string, parts: string[]}}
 */
export function decodeJwt(input) {
  const token = String(input ?? '').trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
  if (!token) throw new SyntaxError('Paste a JSON Web Token (JWT).');
  const parts = token.split('.');
  if (parts.length === 5) throw new SyntaxError('This is an encrypted token (JWE). Its contents can only be read with the decryption key.');
  if (parts.length !== 3) throw new SyntaxError(`A JWT has three parts separated by dots (header.payload.signature), but this has ${parts.length}.`);

  const headerText = decodeSegment(parts[0], 'header');
  let header;
  try {
    header = JSON.parse(headerText);
  } catch {
    throw new SyntaxError('The header is not valid JSON.');
  }
  if (!header || typeof header !== 'object' || Array.isArray(header)) throw new SyntaxError('The header must be a JSON object.');

  const payloadText = decodeSegment(parts[1], 'payload');
  let payload = null;
  try {
    const parsed = JSON.parse(payloadText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) payload = parsed;
  } catch { /* some tokens carry a non-JSON payload; show it as text */ }

  return { header, payload, payloadText, signature: parts[2], parts };
}

const CLAIM_NAMES = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not valid before',
  iat: 'Issued at',
  jti: 'Token ID',
  name: 'Name',
  email: 'Email',
  scope: 'Scope',
  azp: 'Authorized party',
  nonce: 'Nonce'
};

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat', 'auth_time', 'updated_at']);

/**
 * Human-readable claims and a time-based status. Status describes only the
 * timestamps — it says nothing about whether the token is authentic.
 */
export function describeClaims(payload, now = Date.now()) {
  if (!payload) return { claims: [], status: null };
  const claims = Object.entries(payload).map(([key, value]) => {
    const claim = { key, name: CLAIM_NAMES[key] || null, value };
    if (TIME_CLAIMS.has(key) && typeof value === 'number' && Number.isFinite(value)) {
      const ms = value * 1000;
      if (Math.abs(ms) <= 8.64e15) {
        claim.date = new Date(ms).toISOString().replace('.000Z', 'Z');
        claim.relative = relativeTime(ms, now);
      }
    }
    return claim;
  });
  let status = 'No expiry time (exp) — this token does not expire by itself.';
  let state = 'none';
  if (typeof payload.nbf === 'number' && payload.nbf * 1000 > now) {
    state = 'notyet';
    status = `Not valid yet — becomes valid ${relativeTime(payload.nbf * 1000, now)}.`;
  } else if (typeof payload.exp === 'number') {
    state = payload.exp * 1000 <= now ? 'expired' : 'active';
    status = state === 'expired' ? `Expired ${relativeTime(payload.exp * 1000, now)}.` : `Not expired — expires ${relativeTime(payload.exp * 1000, now)}.`;
  }
  return { claims, status, state };
}

export function describeAlgorithm(alg) {
  if (!alg) return 'No algorithm (“alg”) is set in the header.';
  if (alg === 'none') return 'alg “none” means the token is unsigned. Servers must reject such tokens unless they explicitly expect them.';
  if (/^HS/.test(alg)) return `${alg}: HMAC with a shared secret. Verifying it needs that secret.`;
  if (/^RS|^PS/.test(alg)) return `${alg}: RSA signature. Verifying it needs the issuer’s public key.`;
  if (/^ES/.test(alg)) return `${alg}: elliptic-curve signature. Verifying it needs the issuer’s public key.`;
  if (alg === 'EdDSA') return 'EdDSA: Edwards-curve signature. Verifying it needs the issuer’s public key.';
  return `${alg}: an uncommon or unknown algorithm.`;
}
