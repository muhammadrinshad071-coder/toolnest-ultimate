import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, toSlug, addPrefixSuffix, removePrefixSuffix, numberLines, removeLineNumbers } from '../src/js/lib/text.js';
import { diffText, diffTokens, formatDiff, tokenize } from '../src/js/lib/diff.js';
import { escapeHtml, encodeNonAscii, decodeEntities, textToHtml, htmlToText } from '../src/js/lib/html.js';
import { renderMarkdown, markdownDocument, safeUrl } from '../src/js/lib/markdown.js';
import { generateLorem } from '../src/js/lib/lorem.js';
import { encodeUrl, decodeUrl } from '../src/js/lib/url.js';

/* ---------- cleanup ---------- */

test('cleanText defaults: trims, collapses spaces and blank lines, removes invisibles', () => {
  const r = cleanText('  Hello   world​  \n\n\n\nSecond line  ');
  assert.equal(r.output, 'Hello world\n\nSecond line');
  assert.equal(r.invisibleRemoved, 1);
  assert.ok(r.charactersRemoved > 0);
  assert.equal(r.linesRemoved, 2);
});

test('cleanText optional fixes', () => {
  assert.equal(cleanText('a\n\nb', { removeEmptyLines: true }).output, 'a\nb');
  assert.equal(cleanText('This is a\nbroken line.\n\nNext para\ncontinues', { joinLines: true }).output, 'This is a broken line.\n\nNext para continues');
  assert.equal(cleanText('“Hi” it’s', { straightQuotes: true }).output, '"Hi" it\'s');
  assert.equal(cleanText('word , other !', { spaceBeforePunctuation: true }).output, 'word, other!');
  assert.equal(cleanText('a\tb', { tabsToSpaces: true }).output, 'a b');
  assert.equal(cleanText('é').output, 'é');
  assert.equal(cleanText('  keep  ', { trimLines: false, collapseSpaces: false }).output, '  keep  ');
  assert.equal(cleanText('').output, '');
  assert.equal(cleanText('a\r\nb').output, 'a\nb');
});

/* ---------- slugs ---------- */

test('toSlug basics', () => {
  assert.equal(toSlug('Hello, World!'), 'hello-world');
  assert.equal(toSlug('  Café crème & Brûlée  '), 'cafe-creme-and-brulee');
  assert.equal(toSlug("Don't Stop Me Now"), 'dont-stop-me-now');
  assert.equal(toSlug('Straße in Łódź'), 'strasse-in-lodz');
  assert.equal(toSlug('Hello World', { separator: '_' }), 'hello_world');
  assert.equal(toSlug('Hello World', { lowercase: false }), 'Hello-World');
  assert.equal(toSlug('The Best Guide to the Galaxy', { removeStopwords: true }), 'best-guide-galaxy');
  assert.equal(toSlug('the and of', { removeStopwords: true }), 'the-and-of', 'never strips everything');
  assert.equal(toSlug(''), '');
});

test('toSlug max length cuts at a word boundary', () => {
  assert.equal(toSlug('one two three four', { maxLength: 9 }), 'one-two');
  assert.equal(toSlug('one two three', { maxLength: 7 }), 'one-two');
  assert.equal(toSlug('abcdefghij', { maxLength: 4 }), 'abcd');
});

test('toSlug non-Latin text', () => {
  assert.equal(toSlug('नमस्ते दुनिया'), '');
  assert.equal(toSlug('नमस्ते दुनिया', { keepUnicode: true }), 'नमस्ते-दुनिया');
  assert.equal(toSlug('Привет мир', { keepUnicode: true }), 'привет-мир');
});

/* ---------- prefix/suffix & numbering ---------- */

test('addPrefixSuffix and removePrefixSuffix', () => {
  assert.equal(addPrefixSuffix('a\n\nb', { prefix: "'", suffix: "'," }), "'a',\n\n'b',");
  assert.equal(addPrefixSuffix('a\n\nb', { prefix: '- ', skipEmpty: false }), '- a\n- \n- b');
  assert.equal(addPrefixSuffix('  a  ', { prefix: '[', suffix: ']', trim: true }), '[a]');
  assert.equal(addPrefixSuffix('', { prefix: 'x' }), '');
  assert.equal(removePrefixSuffix("'a',\n'b',\nc", { prefix: "'", suffix: "'," }), 'a\nb\nc');
});

test('numberLines options', () => {
  assert.equal(numberLines('a\nb\nc'), '1. a\n2. b\n3. c');
  assert.equal(numberLines('a\n\nb', { skipEmpty: true }), '1. a\n\n2. b');
  assert.equal(numberLines('a\nb', { start: 10, step: 5, separator: ') ' }), '10) a\n15) b');
  const ten = Array.from({ length: 10 }, (_, i) => `l${i}`).join('\n');
  assert.ok(numberLines(ten, { pad: 'zeros' }).startsWith('01. l0'));
  assert.ok(numberLines(ten, { pad: 'spaces' }).startsWith(' 1. l0'));
  assert.ok(numberLines(ten, { pad: 'spaces' }).endsWith('10. l9'));
  assert.equal(numberLines('a\nb', { start: 0, separator: '\t' }), '0\ta\n1\tb');
  assert.equal(numberLines(''), '');
});

test('removeLineNumbers', () => {
  assert.equal(removeLineNumbers('1. a\n2) b\n(3) c\n4: d\n5 | e\n6\tf'), 'a\nb\nc\nd\ne\nf');
  assert.equal(removeLineNumbers('2024 was great\n3.14 is pi'), '2024 was great\n3.14 is pi');
  assert.equal(removeLineNumbers(numberLines('x\ny', { pad: 'spaces' })), 'x\ny');
});

/* ---------- diff ---------- */

test('diffTokens finds the minimal edit', () => {
  const { ops } = diffTokens('ABCABBA'.split(''), 'CBABAC'.split(''));
  const deleted = ops.filter((o) => o.type === 'delete').reduce((n, o) => n + o.tokens.length, 0);
  const inserted = ops.filter((o) => o.type === 'insert').reduce((n, o) => n + o.tokens.length, 0);
  assert.equal(deleted + inserted, 5, 'Myers classic example has edit distance 5');
  const rebuilt = ops.filter((o) => o.type !== 'delete').flatMap((o) => o.tokens).join('');
  assert.equal(rebuilt, 'CBABAC');
  const original = ops.filter((o) => o.type !== 'insert').flatMap((o) => o.tokens).join('');
  assert.equal(original, 'ABCABBA');
});

test('diffTokens edge cases', () => {
  assert.deepEqual(diffTokens([], []).ops, []);
  assert.deepEqual(diffTokens(['a'], []).ops, [{ type: 'delete', tokens: ['a'] }]);
  assert.deepEqual(diffTokens([], ['a']).ops, [{ type: 'insert', tokens: ['a'] }]);
  assert.deepEqual(diffTokens(['a', 'b'], ['a', 'b']).ops, [{ type: 'equal', tokens: ['a', 'b'] }]);
});

test('diffTokens falls back honestly when there are too many edits', () => {
  const a = Array.from({ length: 50 }, (_, i) => `a${i}`);
  const b = Array.from({ length: 50 }, (_, i) => `b${i}`);
  const r = diffTokens(['same', ...a, 'end'], ['same', ...b, 'end'], { maxEdits: 10 });
  assert.equal(r.simplified, true);
  assert.equal(r.ops[0].type, 'equal');
  assert.equal(r.ops.at(-1).type, 'equal');
});

test('diffText line mode with options', () => {
  const r = diffText('one\ntwo\nthree', 'one\n2\nthree\nfour');
  assert.deepEqual(r.stats, { added: 2, removed: 1, unchanged: 2 });
  assert.equal(formatDiff(r), '  one\n- two\n+ 2\n  three\n+ four');
  assert.ok(diffText('Hello  world', 'hello world', { ignoreCase: true, ignoreWhitespace: true }).identical);
  assert.ok(!diffText('Hello', 'hello').identical);
  assert.ok(diffText('', '').identical);
});

test('diffText word and character modes', () => {
  const w = diffText('the quick brown fox', 'the slow brown fox');
  assert.equal(w.mode, 'lines');
  const words = diffText('the quick brown fox', 'the slow brown fox', { mode: 'words' });
  assert.deepEqual(words.stats, { added: 1, removed: 1, unchanged: 3 });
  assert.equal(formatDiff(words), 'the [-quick-]{+slow+} brown fox');
  const chars = diffText('color', 'colour', { mode: 'chars' });
  assert.deepEqual(chars.stats, { added: 1, removed: 0, unchanged: 5 });
  assert.throws(() => diffText('x'.repeat(20001), 'y', { mode: 'chars' }), RangeError);
  assert.deepEqual(tokenize('a  b', 'words'), ['a', '  ', 'b']);
});

/* ---------- html ---------- */

test('escapeHtml, encodeNonAscii and decodeEntities', () => {
  assert.equal(escapeHtml('<a href="x">\'&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(encodeNonAscii('café 😀'), 'caf&#233; &#128512;');
  assert.equal(decodeEntities('&lt;p&gt; &amp;amp; &copy; &eacute; &hellip; &#8377; &#x1F600; &bogus; &#0;'), '<p> &amp; © é … ₹ 😀 &bogus; �');
  assert.equal(decodeEntities(escapeHtml('round <trip> & "back"')), 'round <trip> & "back"');
});

test('textToHtml', () => {
  assert.equal(textToHtml('Hello <world>\nline two\n\nNew para'), '<p>Hello &lt;world&gt;<br>\nline two</p>\n<p>New para</p>');
  assert.equal(textToHtml('a & b', { mode: 'escape' }), 'a &amp; b');
  assert.equal(textToHtml('See https://example.com/a?b=1&c=2.', { linkify: true }),
    '<p>See <a href="https://example.com/a?b=1&amp;c=2">https://example.com/a?b=1&amp;c=2</a>.</p>');
  assert.equal(textToHtml('naïve', { nonAscii: true }), '<p>na&#239;ve</p>');
  assert.equal(textToHtml(''), '');
});

test('htmlToText converts structure and strips unsafe parts', () => {
  const html = `<html><head><title>T</title><style>p{}</style></head><body>
    <h1>Title</h1><p>Hello <b>bold</b>&nbsp;and <a href="https://x.com">link</a>.</p>
    <script>alert(1)</script><!-- note -->
    <ul><li>One</li><li>Two<ul><li>Nested</li></ul></li></ul>
    <ol start="3"><li>Three</li></ol>
    <p>Line<br>break</p><img src="a.png" alt="A cat">
    <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
    <pre>  keep   spacing</pre></body></html>`;
  const text = htmlToText(html);
  assert.equal(text, 'Title\n\nHello bold and link (https://x.com).\n\n• One\n• Two\n  • Nested\n\n3. Three\n\nLine\nbreak\n\n[A cat]\n\nA\tB\n1\t2\n\n  keep   spacing');
  assert.doesNotMatch(text, /alert|note|p\{\}/);
  assert.equal(htmlToText('<a href="javascript:x()">click</a>'), 'click');
  assert.equal(htmlToText('<p>a</p>', { bullets: false }), 'a');
  assert.equal(htmlToText('<ul><li>x</li></ul>', { bullets: false }), 'x');
  assert.equal(htmlToText('<a href="https://x.com">https://x.com</a>'), 'https://x.com');
  assert.equal(htmlToText('<a href="https://x.com">x</a>', { keepLinks: false }), 'x');
  assert.equal(htmlToText(''), '');
});

/* ---------- markdown ---------- */

test('markdown blocks', () => {
  assert.equal(renderMarkdown('# Hello *World*'), '<h1 id="hello-world">Hello <em>World</em></h1>');
  assert.equal(renderMarkdown('Title\n===\n\nSub\n---'), '<h1 id="title">Title</h1>\n<h2 id="sub">Sub</h2>');
  assert.equal(renderMarkdown('a\nb\n\nc'), '<p>a\nb</p>\n<p>c</p>');
  assert.equal(renderMarkdown('line  \nnext'), '<p>line<br>\nnext</p>');
  assert.equal(renderMarkdown('***'), '<hr>');
  assert.equal(renderMarkdown('> quote\n> more'), '<blockquote>\n<p>quote\nmore</p>\n</blockquote>');
  assert.equal(renderMarkdown('```js\nconst a = "<b>";\n```'), '<pre><code class="language-js">const a = &quot;&lt;b&gt;&quot;;</code></pre>');
  assert.equal(renderMarkdown('## Same\n## Same'), '<h2 id="same">Same</h2>\n<h2 id="same-1">Same</h2>');
  assert.equal(renderMarkdown('#hashtag'), '<p>#hashtag</p>');
  assert.equal(renderMarkdown(''), '');
});

test('markdown lists', () => {
  assert.equal(renderMarkdown('- a\n- b'), '<ul>\n<li>a</li>\n<li>b</li>\n</ul>');
  assert.equal(renderMarkdown('3. x\n4. y'), '<ol start="3">\n<li>x</li>\n<li>y</li>\n</ol>');
  assert.equal(renderMarkdown('- a\n  - b\n- c'), '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul></li>\n<li>c</li>\n</ul>');
  assert.equal(renderMarkdown('1. a\n  - b'), '<ol>\n<li>a\n<ul>\n<li>b</li>\n</ul></li>\n</ol>');
  assert.equal(renderMarkdown('- [ ] todo\n- [x] done'), '<ul>\n<li class="task"><input type="checkbox" disabled> todo</li>\n<li class="task"><input type="checkbox" disabled checked> done</li>\n</ul>');
  assert.equal(renderMarkdown('- a\n\n- b'), '<ul>\n<li><p>a</p></li>\n<li><p>b</p></li>\n</ul>');
  assert.equal(renderMarkdown('- a\ncontinued'), '<ul>\n<li>a\ncontinued</li>\n</ul>');
  assert.equal(renderMarkdown('Text\n- item'), '<p>Text</p>\n<ul>\n<li>item</li>\n</ul>');
  assert.equal(renderMarkdown('1.5 apples'), '<p>1.5 apples</p>');
});

test('markdown inline', () => {
  assert.equal(renderMarkdown('**b** __b__ *i* _i_ ~~s~~ `c*d*`'), '<p><strong>b</strong> <strong>b</strong> <em>i</em> <em>i</em> <del>s</del> <code>c*d*</code></p>');
  assert.equal(renderMarkdown('snake_case_name and 2 * 3 * 4'), '<p>snake_case_name and 2 * 3 * 4</p>');
  assert.equal(renderMarkdown('\\*not italic\\*'), '<p>*not italic*</p>');
  assert.equal(renderMarkdown('[Site](https://example.com/a_b_c "Home")'), '<p><a href="https://example.com/a_b_c" title="Home">Site</a></p>');
  assert.equal(renderMarkdown('![Cat](cat.png)'), '<p><img src="cat.png" alt="Cat" loading="lazy"></p>');
  assert.equal(renderMarkdown('Go to https://example.com/x_y.'), '<p>Go to <a href="https://example.com/x_y">https://example.com/x_y</a>.</p>');
  assert.equal(renderMarkdown('<https://a.com>'), '<p><a href="https://a.com">https://a.com</a></p>');
});

test('markdown tables', () => {
  const html = renderMarkdown('| Name | Qty |\n|:-----|----:|\n| Pen | 2 |\n| Ink \\| blue | 1 |');
  assert.equal(html, '<table>\n<thead><tr><th align="left">Name</th><th align="right">Qty</th></tr></thead>\n<tbody>\n<tr><td align="left">Pen</td><td align="right">2</td></tr>\n<tr><td align="left">Ink | blue</td><td align="right">1</td></tr>\n</tbody>\n</table>');
});

test('markdown is safe against HTML and script URLs', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1)) [y](JaVa\u0000Script:alert(1)) ![z](data:image/svg+xml,abc) [ok](mailto:a@b.c)');
  assert.doesNotMatch(html, /<script|<img src=x|href="javascript|src="data/i);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /<a href="mailto:a@b.c">ok<\/a>/);
  assert.equal(safeUrl('java\tscript:alert(1)'), null);
  assert.equal(safeUrl('/relative/path'), '/relative/path');
  assert.equal(safeUrl('https://ok.com'), 'https://ok.com');
  assert.doesNotMatch(renderMarkdown('[a](x "t\\" onmouseover=\\"alert(1))'), /onmouseover="/);
});

test('markdownDocument wraps a complete page', () => {
  const doc = markdownDocument('# My <Notes>\n\nText');
  assert.match(doc, /^<!doctype html>/);
  assert.match(doc, /<title>My &lt;Notes&gt;<\/title>/);
  assert.match(doc, /<p>Text<\/p>/);
});

/* ---------- lorem ---------- */

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('generateLorem units and options', () => {
  const p = generateLorem({ unit: 'paragraphs', count: 3, random: seeded(1) });
  assert.equal(p.split('\n\n').length, 3);
  assert.ok(p.startsWith('Lorem ipsum dolor sit amet, consectetur adipiscing elit'));
  const s = generateLorem({ unit: 'sentences', count: 4, random: seeded(2) });
  assert.equal(s.match(/\./g).length, 4);
  const w = generateLorem({ unit: 'words', count: 25, random: seeded(3) });
  assert.equal(w.split(' ').length, 25);
  assert.equal(generateLorem({ unit: 'words', count: 3 }), 'Lorem ipsum dolor.');
  assert.ok(!generateLorem({ unit: 'sentences', count: 2, startWithLorem: false, random: seeded(4) }).startsWith('Lorem ipsum dolor'));
  const html = generateLorem({ unit: 'paragraphs', count: 2, format: 'html', random: seeded(5) });
  assert.equal(html.match(/<p>/g).length, 2);
  assert.equal(generateLorem({ count: 2, random: seeded(9) }), generateLorem({ count: 2, random: seeded(9) }));
});

test('generateLorem validates counts', () => {
  assert.throws(() => generateLorem({ unit: 'paragraphs', count: 0 }), RangeError);
  assert.throws(() => generateLorem({ unit: 'paragraphs', count: 101 }), RangeError);
  assert.throws(() => generateLorem({ unit: 'words', count: 2.5 }), RangeError);
  assert.throws(() => generateLorem({ unit: 'pages', count: 1 }));
});

/* ---------- url ---------- */

test('encodeUrl modes', () => {
  assert.equal(encodeUrl('a b&c=d/é').output, 'a%20b%26c%3Dd%2F%C3%A9');
  assert.equal(encodeUrl('https://x.com/a b?q=1&r=é', { mode: 'uri' }).output, 'https://x.com/a%20b?q=1&r=%C3%A9');
  assert.equal(encodeUrl('a b+c*', { mode: 'form' }).output, 'a+b%2Bc*');
  assert.equal(encodeUrl('a b\nc d', { perLine: true }).output, 'a%20b\nc%20d');
  assert.equal(encodeUrl('a\nb').output, 'a%0Ab');
  assert.ok(encodeUrl('\uD800').error);
});

test('decodeUrl, including malformed input', () => {
  assert.deepEqual(decodeUrl('a%20b%C3%A9'), { output: 'a bé', invalid: 0 });
  assert.deepEqual(decodeUrl('a+b%2B', { plusAsSpace: true }), { output: 'a b+', invalid: 0 });
  assert.deepEqual(decodeUrl('a+b'), { output: 'a+b', invalid: 0 });
  assert.deepEqual(decodeUrl('%E0%A4%A x %ZZ 100%'), { output: '%E0%A4%A x %ZZ 100%', invalid: 2 });
  assert.deepEqual(decodeUrl('ok%20%FF%20ok'), { output: 'ok %FF ok', invalid: 1 });
  assert.equal(decodeUrl('%3Fa%3D1', { mode: 'uri' }).output, '%3Fa%3D1');
  const original = 'Hello, wörld! 50% off?';
  assert.equal(decodeUrl(encodeUrl(original).output).output, original);
});

test('markdown links may contain balanced parentheses', () => {
  assert.equal(renderMarkdown('[Bat](https://en.wikipedia.org/wiki/Bat_(animal))'), '<p><a href="https://en.wikipedia.org/wiki/Bat_(animal)">Bat</a></p>');
  assert.equal(renderMarkdown('[x](javascript:alert(1))'), '<p>x</p>');
});
