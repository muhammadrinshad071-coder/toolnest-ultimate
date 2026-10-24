/**
 * Small, safe Markdown renderer (CommonMark/GFM subset).
 *
 * Supported: ATX and setext headings, paragraphs, hard line breaks,
 * emphasis, strong, strikethrough, inline code, fenced code blocks,
 * block quotes, nested ordered/unordered lists, task lists, tables,
 * horizontal rules, links, images, and autolinks.
 *
 * Safety: every piece of user text is HTML-escaped, so raw HTML is shown
 * as text and the output only contains tags this file creates. Link and
 * image URLs are limited to http(s), mailto, tel, and relative addresses.
 */
import { escapeHtml } from './html.js';
import { toSlug } from './text.js';

const PH = '\u0000';

const RE = {
  fence: /^ {0,3}(`{3,}|~{3,})[ \t]*([^`\s]*)[^`]*$/,
  heading: /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
  setext: /^ {0,3}(=+|-+)[ \t]*$/,
  hr: /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/,
  quote: /^ {0,3}> ?/,
  list: /^( *)([-*+]|\d{1,9}[.)])(?:[ \t]+(.*))?$/,
  tableSep: /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/
};

/** Allow relative URLs and a small set of safe schemes. */
export function safeUrl(url) {
  const cleaned = String(url).replace(/[\u0000- \u007F]/g, '');
  const scheme = cleaned.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme && !/^(https?|mailto|tel)$/i.test(scheme[1])) return null;
  return cleaned;
}

function emphasis(s) {
  return s
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\p{L}\p{N}_])__(?=\S)([\s\S]*?\S)__(?![\p{L}\p{N}_])/gu, '$1<strong>$2</strong>')
    .replace(/\*(?=\S)([\s\S]*?\S)\*/g, '<em>$1</em>')
    .replace(/(^|[^\p{L}\p{N}_])_(?=\S)([\s\S]*?\S)_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');
}

function renderInline(src, ctx) {
  const store = ctx.store;
  const hold = (html) => `${PH}${store.push(html) - 1}${PH}`;
  let s = String(src).replace(/\u0000/g, '');

  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, _t, code) => hold(`<code>${escapeHtml(code.replace(/^ ([\s\S]*) $/, '$1'))}</code>`));
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!|~<>"'])/g, (_, c) => hold(escapeHtml(c)));
  s = s.replace(/(?: {2,}|\\)\n/g, () => hold('<br>\n'));
  s = s.replace(/<((?:https?:\/\/|mailto:)[^\s<>]+)>/gi, (m, url) => {
    const href = safeUrl(url);
    return href ? hold(`<a href="${escapeHtml(href)}">${escapeHtml(url.replace(/^mailto:/i, ''))}</a>`) : m;
  });

  s = escapeHtml(s);

  // URLs may contain one level of balanced parentheses, e.g. Wikipedia's /wiki/Bat_(animal).
  s = s.replace(/!\[([^\]]*)\]\(\s*((?:[^\s()]|\([^\s()]*\))+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, alt, url, title) => {
    const src2 = safeUrl(url);
    if (!src2) return alt;
    return hold(`<img src="${src2}" alt="${alt}"${title ? ` title="${title}"` : ''} loading="lazy">`);
  });
  s = s.replace(/\[([^\]]+)\]\(\s*((?:[^\s()]|\([^\s()]*\))+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, text, url, title) => {
    const href = safeUrl(url);
    if (!href) return emphasis(text);
    return hold(`<a href="${href}"${title ? ` title="${title}"` : ''}>${emphasis(text)}</a>`);
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'*_~])/g, (_, pre, url) => `${pre}${hold(`<a href="${url}">${url}</a>`)}`);

  s = emphasis(s);
  while (s.includes(PH)) s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => store[Number(i)]);
  return s;
}

function headingId(ctx, text) {
  const base = toSlug(text.replace(/[*_`~[\]()!\\]/g, ''), { keepUnicode: true }) || 'section';
  const n = ctx.ids.get(base) || 0;
  ctx.ids.set(base, n + 1);
  return n ? `${base}-${n}` : base;
}

function isListStart(line) {
  const m = line.match(RE.list);
  return Boolean(m) && (!/\d/.test(m[2]) || /^1[.)]$/.test(m[2]));
}

function startsBlock(line) {
  return RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) || RE.quote.test(line) || isListStart(line);
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

function parseTable(lines, i, ctx) {
  const header = splitRow(lines[i]);
  const aligns = splitRow(lines[i + 1]).map((c) => {
    if (c.startsWith(':') && c.endsWith(':')) return 'center';
    if (c.endsWith(':')) return 'right';
    if (c.startsWith(':')) return 'left';
    return '';
  });
  if (header.length !== aligns.length) return null;
  let j = i + 2;
  const rows = [];
  while (j < lines.length && lines[j].trim() && lines[j].includes('|')) rows.push(splitRow(lines[j++]));
  const cell = (tag, text, k) => `<${tag}${aligns[k] ? ` align="${aligns[k]}"` : ''}>${renderInline(text ?? '', ctx)}</${tag}>`;
  const head = `<tr>${header.map((c, k) => cell('th', c, k)).join('')}</tr>`;
  const body = rows.map((r) => `<tr>${header.map((_, k) => cell('td', r[k], k)).join('')}</tr>`).join('\n');
  return { html: `<table>\n<thead>${head}</thead>\n${rows.length ? `<tbody>\n${body}\n</tbody>\n` : ''}</table>`, next: j };
}

function parseList(lines, start, ctx) {
  const first = lines[start].match(RE.list);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const isSibling = (line) => {
    const m = line.match(RE.list);
    return m && m[1].length <= baseIndent + 1 && /\d/.test(m[2]) === ordered && !RE.hr.test(line) ? m : null;
  };
  const items = [];
  let loose = false;
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    const sib = isSibling(line);
    if (sib) {
      items.push({ lines: [sib[3] || ''] });
      i++;
      continue;
    }
    const current = items[items.length - 1];
    const indent = line.match(/^ */)[0].length;
    if (!line.trim()) {
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j >= lines.length) break;
      const nextIndent = lines[j].match(/^ */)[0].length;
      if (nextIndent > baseIndent + 1 || isSibling(lines[j])) {
        loose = true;
        for (let k = i; k < j; k++) current.lines.push('');
        i = j;
        continue;
      }
      break;
    }
    if (indent > baseIndent + 1) {
      current.lines.push(line.slice(Math.min(indent, baseIndent + 2 + (ordered ? 1 : 0))));
      i++;
      continue;
    }
    if (RE.list.test(line) || startsBlock(line)) break;
    if (current.lines[current.lines.length - 1].trim()) {
      current.lines.push(line.trim());
      i++;
      continue;
    }
    break;
  }

  const tag = ordered ? 'ol' : 'ul';
  const lis = items.map((item) => {
    let content = item.lines;
    let prefix = '';
    const task = content[0].match(/^\[([ xX])\][ \t]+(.*)$/);
    if (task) {
      prefix = `<input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}> `;
      content = [task[2], ...content.slice(1)];
    }
    let blocks = parseBlocks(content, ctx);
    if (!loose) blocks = blocks.map((b) => b.replace(/^<p>([\s\S]*)<\/p>$/, '$1'));
    return `<li${task ? ' class="task"' : ''}>${prefix}${blocks.join('\n')}</li>`;
  });
  const attrs = ordered && startNum !== 1 ? ` start="${startNum}"` : '';
  return { html: `<${tag}${attrs}>\n${lis.join('\n')}\n</${tag}>`, next: i };
}

function parseBlocks(lines, ctx) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;

    if ((m = line.match(RE.fence))) {
      const fence = m[1];
      const close = new RegExp(`^ {0,3}${fence[0] === '`' ? '`' : '~'}{${fence.length},}[ \\t]*$`);
      const body = [];
      i++;
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
      i++;
      const lang = m[2].replace(/[^\w+#.-]/g, '');
      out.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    if ((m = line.match(RE.heading))) {
      const text = (m[2] || '').trim();
      const level = m[1].length;
      out.push(`<h${level} id="${headingId(ctx, text)}">${renderInline(text, ctx)}</h${level}>`);
      i++;
      continue;
    }
    if (RE.hr.test(line)) { out.push('<hr>'); i++; continue; }
    if (RE.quote.test(line)) {
      const body = [];
      while (i < lines.length && lines[i].trim() && (RE.quote.test(lines[i]) || !startsBlock(lines[i]))) {
        body.push(lines[i].replace(RE.quote, ''));
        i++;
      }
      out.push(`<blockquote>\n${parseBlocks(body, ctx).join('\n')}\n</blockquote>`);
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && RE.tableSep.test(lines[i + 1])) {
      const table = parseTable(lines, i, ctx);
      if (table) { out.push(table.html); i = table.next; continue; }
    }
    if (RE.list.test(line)) {
      const list = parseList(lines, i, ctx);
      out.push(list.html);
      i = list.next;
      continue;
    }

    const para = [line.replace(/^ +/, '')];
    i++;
    let setext = 0;
    while (i < lines.length && lines[i].trim()) {
      const sm = lines[i].match(RE.setext);
      if (sm) { setext = sm[1][0] === '=' ? 1 : 2; i++; break; }
      if (startsBlock(lines[i])) break;
      if (lines[i].includes('|') && RE.tableSep.test(lines[i + 1] || '') && (lines[i + 1] || '').includes('-')) break;
      para.push(lines[i].replace(/^ +/, ''));
      i++;
    }
    const text = para.join('\n');
    out.push(setext
      ? `<h${setext} id="${headingId(ctx, text)}">${renderInline(text.trim(), ctx)}</h${setext}>`
      : `<p>${renderInline(text.replace(/[ \t]+$/, ''), ctx)}</p>`);
  }
  return out;
}

export function renderMarkdown(source) {
  const ctx = { store: [], ids: new Map() };
  const lines = String(source ?? '').replace(/\r\n|\r/g, '\n').replace(/\t/g, '    ').split('\n');
  return parseBlocks(lines, ctx).join('\n');
}

/** A complete, self-contained HTML document for download. */
export function markdownDocument(source, title = 'Document') {
  const body = renderMarkdown(source);
  const heading = String(source).match(/^ {0,3}#{1,6}[ \t]+(.+?)[ \t#]*$/m);
  const docTitle = escapeHtml(heading ? heading[1].replace(/[*_`~]/g, '') : title);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${docTitle}</title>
<style>
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:46rem;margin:2rem auto;padding:0 1rem;line-height:1.65;color:#1b1d26}
h1,h2,h3{line-height:1.25}a{color:#4338ca}img{max-width:100%}hr{border:0;border-top:1px solid #ddd;margin:2rem 0}
code{font-family:Consolas,"SF Mono",monospace;font-size:.92em;background:#f3f4f7;padding:.1em .3em;border-radius:4px}
pre{background:#f3f4f7;padding:1rem;overflow:auto;border-radius:8px}pre code{background:none;padding:0}
blockquote{margin:1rem 0;padding:.2rem 1rem;border-left:4px solid #c7cad6;color:#4a4f60}
table{border-collapse:collapse;margin:1rem 0}th,td{border:1px solid #d5d8e1;padding:.45rem .7rem}th{background:#f3f4f7}
li.task{list-style:none}li.task input{margin-right:.4rem}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}
