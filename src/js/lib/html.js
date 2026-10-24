/**
 * HTML escaping, entity decoding, and conversion between plain text and HTML.
 * Pure string functions: HTML input is never parsed by the browser, so
 * scripts or event handlers in it can't run.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Replace every non-ASCII character with a numeric entity, e.g. é → &#233;. */
export function encodeNonAscii(text) {
  return String(text).replace(/[^\x00-\x7F]/gu, (c) => `&#${c.codePointAt(0)};`);
}

/* ------------------------------------------------------------------ */
/* Entities                                                            */
/* ------------------------------------------------------------------ */

// Latin-1 named entities for code points 160–255, in order.
const LATIN1 = ('nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest '
  + 'Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig '
  + 'agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml').split(' ');

const NAMED = {
  amp: 38, lt: 60, gt: 62, quot: 34, apos: 39,
  OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732,
  ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207,
  ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222,
  dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243,
  lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364, trade: 8482,
  larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596,
  minus: 8722, infin: 8734, asymp: 8776, ne: 8800, le: 8804, ge: 8805,
  spades: 9824, clubs: 9827, hearts: 9829, diams: 9830
};
LATIN1.forEach((name, i) => { NAMED[name] = 160 + i; });

function fromCodePoint(n) {
  if (!Number.isFinite(n) || n <= 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return '�';
  return String.fromCodePoint(n);
}

/** Decode named (common set) and numeric entities. Unknown names are left unchanged. */
export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (match, body) => {
    if (body[0] === '#') {
      return fromCodePoint(body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10));
    }
    return Object.hasOwn(NAMED, body) ? String.fromCodePoint(NAMED[body]) : match;
  });
}

/* ------------------------------------------------------------------ */
/* Text → HTML                                                         */
/* ------------------------------------------------------------------ */

const URL_RE = /\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;

/**
 * mode 'paragraphs': blank lines become <p> blocks, single line breaks become <br>.
 * mode 'escape': only escape special characters.
 */
export function textToHtml(text, { mode = 'paragraphs', linkify = false, nonAscii = false } = {}) {
  const s = String(text ?? '').replace(/\r\n|\r/g, '\n');
  const finish = (html) => (nonAscii ? encodeNonAscii(html) : html);
  if (mode === 'escape') return finish(escapeHtml(s));
  const paragraphs = s.split(/\n[ \t]*\n+/).map((p) => p.trim()).filter(Boolean);
  return finish(paragraphs.map((p) => {
    let html = escapeHtml(p);
    if (linkify) html = html.replace(URL_RE, (url) => `<a href="${url}">${url}</a>`);
    return `<p>${html.replace(/\n/g, '<br>\n')}</p>`;
  }).join('\n'));
}

/* ------------------------------------------------------------------ */
/* HTML → text                                                         */
/* ------------------------------------------------------------------ */

const BLOCK = new Set('address article aside blockquote dd details div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section summary table tbody thead tfoot tr ul'.split(' '));
const SPACED = new Set('blockquote dl figure h1 h2 h3 h4 h5 h6 ol p pre table ul'.split(' '));
const DROP = /<(script|style|head|template|noscript|svg|iframe|object|title)\b[\s\S]*?<\/\1\s*>/gi;

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? '') : '';
}

/**
 * Convert HTML to readable plain text with sensible line breaks.
 */
export function htmlToText(html, { keepLinks = true, bullets = true, imageAlt = true } = {}) {
  const src = String(html ?? '').replace(/<!--[\s\S]*?-->/g, '').replace(DROP, '');
  let out = '';
  let pre = 0;
  const lists = [];
  const links = [];

  const ensureBreaks = (n) => {
    if (!out) return;
    out = out.replace(/[ \t]+$/, '');
    const have = out.match(/\n*$/)[0].length;
    if (have < n) out += '\n'.repeat(n - have);
  };
  const addText = (raw) => {
    let t = decodeEntities(raw);
    if (!pre) {
      t = t.replace(/[ \t\n\r\f]+/g, ' ');
      if (out === '' || /\n$/.test(out) || / $/.test(out)) t = t.replace(/^ /, '');
    }
    out += t;
  };

  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)\b[^>]*>/g;
  let last = 0;
  let m;
  while ((m = tagRe.exec(src))) {
    addText(src.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    const tag = m[0];

    if (name === 'br') { out = out.replace(/ $/, ''); out += '\n'; continue; }
    if (name === 'hr') { ensureBreaks(2); out += '----'; ensureBreaks(2); continue; }
    if (name === 'img') {
      const alt = attr(tag, 'alt');
      if (imageAlt && alt) out += `[${alt}]`;
      continue;
    }
    if (name === 'pre') pre += closing ? -1 : 1;
    if (name === 'td' || name === 'th') {
      if (!closing && !/(\n|^)$/.test(out)) out += '\t';
      continue;
    }
    if (name === 'a') {
      if (!closing) links.push(attr(tag, 'href'));
      else {
        const href = links.pop();
        if (keepLinks && href && /^(https?:|mailto:)/i.test(href) && !out.endsWith(href)) out += ` (${href.replace(/^mailto:/i, '')})`;
      }
      continue;
    }
    if (name === 'ul' || name === 'ol') {
      if (!closing) lists.push({ ordered: name === 'ol', n: Number(attr(tag, 'start')) || 1 });
      else lists.pop();
    }
    if (name === 'li' && !closing) {
      ensureBreaks(1);
      const list = lists[lists.length - 1];
      const indent = '  '.repeat(Math.max(0, lists.length - 1));
      if (bullets) out += indent + (list && list.ordered ? `${list.n++}. ` : '• ');
      continue;
    }
    if (BLOCK.has(name)) {
      // Nested lists sit directly under their parent item; other spaced blocks get a blank line.
      const nestedList = (name === 'ul' || name === 'ol') && lists.length > (closing ? 0 : 1);
      ensureBreaks(nestedList ? 1 : SPACED.has(name) ? 2 : 1);
    }
  }
  addText(src.slice(last));

  return out
    .split('\n').map((l) => l.replace(/[ \t]+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
