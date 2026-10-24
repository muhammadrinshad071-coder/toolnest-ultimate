import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  words, countCharacters, countSentences, countParagraphs, textStats, keywordDensity, formatDuration,
  toTitleCase, toSentenceCase, convertCase, identifierWords, isAcronymLike,
  removeDuplicateLines, sortLines, firstNumber, cryptoRandomInt,
  escapeRegExp, buildPattern, findReplace, unescapeSequences, utf8Bytes
} from '../src/js/lib/text.js';

test('words: basic, contractions, hyphens and numbers', () => {
  assert.equal(words('').length, 0);
  assert.equal(words('   \n\t ').length, 0);
  assert.deepEqual(words("Don't stop, well-known 3.14 U.S.A. rocks"), ["Don't", 'stop', 'well-known', '3.14', 'U.S.A', 'rocks']);
  assert.equal(words('one—two – three').length, 3);
  assert.equal(words('café naïve résumé').length, 3);
});

test('words: CJK characters count individually, mixed scripts split', () => {
  assert.equal(words('漢字テスト').length, 5);
  assert.equal(words('abc漢字').length, 3);
  assert.equal(words('안녕하세요 세계').length, 2);
});

test('countCharacters counts graphemes', () => {
  assert.equal(countCharacters(''), 0);
  assert.equal(countCharacters('abc'), 3);
  assert.equal(countCharacters('👍🏽'), 1);
  assert.equal(countCharacters('é'), 1);
  assert.equal(countCharacters('👨‍👩‍👧'), 1);
});

test('utf8Bytes', () => {
  assert.equal(utf8Bytes('a'), 1);
  assert.equal(utf8Bytes('é'), 2);
  assert.equal(utf8Bytes('漢'), 3);
  assert.equal(utf8Bytes('😀'), 4);
});

test('countSentences handles terminators, abbreviations and line breaks', () => {
  assert.equal(countSentences(''), 0);
  assert.equal(countSentences('Hello'), 1);
  assert.equal(countSentences('Hello world. How are you? Fine!'), 3);
  assert.equal(countSentences('Dr. Smith arrived, e.g. at noon. Then left.'), 2);
  assert.equal(countSentences('Pi is 3.14 roughly. Yes.'), 2);
  assert.equal(countSentences('Wait... what?!'), 2);
  assert.equal(countSentences('Heading\nFirst line. Second line.'), 3);
  assert.equal(countSentences('"Quoted." And more.'), 2);
  assert.equal(countSentences('J. K. Rowling wrote it.'), 1);
  assert.equal(countSentences('...'), 0);
});

test('countParagraphs counts non-empty lines', () => {
  assert.equal(countParagraphs(''), 0);
  assert.equal(countParagraphs('a\n\n\nb\n  \nc'), 3);
  assert.equal(countParagraphs('a\r\nb'), 2);
});

test('textStats aggregates and computes reading time', () => {
  const s = textStats('The cat sat. The dog ran!');
  assert.equal(s.words, 6);
  assert.equal(s.sentences, 2);
  assert.equal(s.paragraphs, 1);
  assert.equal(s.lines, 1);
  assert.equal(s.characters, 25);
  assert.equal(s.charactersNoSpaces, 20);
  assert.equal(s.uniqueWords, 5);
  assert.equal(s.longestWord, 'The');
  const big = textStats(Array(238).fill('word').join(' '));
  assert.equal(Math.round(big.readingSeconds), 60);
  assert.equal(Math.round(textStats(Array(130).fill('w').join(' ')).speakingSeconds), 60);
  const empty = textStats('');
  assert.equal(empty.words, 0);
  assert.equal(empty.lines, 0);
  assert.equal(empty.averageWordLength, 0);
});

test('keywordDensity', () => {
  const k = keywordDensity('Apple banana apple. The apple and the banana!');
  assert.deepEqual(k[0], { word: 'apple', count: 3, percent: (3 / 8) * 100 });
  assert.equal(k[1].word, 'banana');
  assert.ok(!k.some((x) => x.word === 'the'));
  assert.ok(keywordDensity('the the', { excludeStopwords: false })[0].word === 'the');
  assert.deepEqual(keywordDensity(''), []);
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0 sec');
  assert.equal(formatDuration(-5), '0 sec');
  assert.equal(formatDuration(NaN), '0 sec');
  assert.equal(formatDuration(45), '45 sec');
  assert.equal(formatDuration(60), '1 min');
  assert.equal(formatDuration(95), '1 min 35 sec');
  assert.equal(formatDuration(3600), '1 hr');
  assert.equal(formatDuration(3720), '1 hr 2 min');
});

test('isAcronymLike', () => {
  assert.ok(isAcronymLike('NASA'));
  assert.ok(isAcronymLike('iPhone'));
  assert.ok(isAcronymLike('McDonald'));
  assert.ok(!isAcronymLike('Hello'));
  assert.ok(!isAcronymLike('hello'));
  assert.ok(!isAcronymLike('A'));
});

test('toTitleCase follows headline rules', () => {
  assert.equal(toTitleCase('the lord of the rings'), 'The Lord of the Rings');
  assert.equal(toTitleCase('what is it for'), 'What Is It For');
  assert.equal(toTitleCase('star wars: a new hope'), 'Star Wars: A New Hope');
  assert.equal(toTitleCase('a well-known NASA mission on the iPhone'), 'A Well-Known NASA Mission on the iPhone');
  assert.equal(toTitleCase('HELLO WORLD OF CODE'), 'Hello World of Code');
  assert.equal(toTitleCase('first line\nsecond of two'), 'First Line\nSecond of Two');
  assert.equal(toTitleCase('NASA rocks', { preserveAcronyms: false }), 'Nasa Rocks');
  assert.equal(toTitleCase(''), '');
});

test('toSentenceCase', () => {
  assert.equal(toSentenceCase('HELLO WORLD. HOW ARE YOU? i am fine!'), 'Hello world. How are you? I am fine!');
  assert.equal(toSentenceCase('i think i\'m right, i.e. correct.'), 'I think I\'m right, i.e. correct.');
  assert.equal(toSentenceCase('the NASA team.\nnext line'), 'The NASA team.\nNext line');
  assert.equal(toSentenceCase('"quoted start." then'), '"Quoted start." Then');
});

test('identifierWords and programming cases', () => {
  assert.deepEqual(identifierWords('parseHTTPResponse v2'), ['parse', 'http', 'response', 'v2']);
  assert.deepEqual(identifierWords('user_first-name'), ['user', 'first', 'name']);
  assert.equal(convertCase('Hello big World', 'camel'), 'helloBigWorld');
  assert.equal(convertCase('hello big world', 'pascal'), 'HelloBigWorld');
  assert.equal(convertCase('helloBigWorld', 'snake'), 'hello_big_world');
  assert.equal(convertCase('Hello Big World', 'kebab'), 'hello-big-world');
  assert.equal(convertCase('hello big world', 'constant'), 'HELLO_BIG_WORLD');
  assert.equal(convertCase('first item\n\nsecond item', 'snake'), 'first_item\n\nsecond_item');
});

test('convertCase simple modes', () => {
  assert.equal(convertCase('Hello', 'upper'), 'HELLO');
  assert.equal(convertCase('Hello', 'lower'), 'hello');
  assert.equal(convertCase('hello wide-world', 'capitalize'), 'Hello Wide-World');
  assert.equal(convertCase('Hello', 'invert'), 'hELLO');
  assert.equal(convertCase('', 'title'), '');
  assert.throws(() => convertCase('x', 'nope'));
});

test('removeDuplicateLines keeps first occurrence and reports duplicates', () => {
  const r = removeDuplicateLines('apple\nbanana\napple\ncherry\nbanana\napple');
  assert.equal(r.output, 'apple\nbanana\ncherry');
  assert.equal(r.total, 6);
  assert.equal(r.kept, 3);
  assert.equal(r.removed, 3);
  assert.deepEqual(r.duplicates, [{ line: 'apple', count: 3 }, { line: 'banana', count: 2 }]);
});

test('removeDuplicateLines options', () => {
  assert.equal(removeDuplicateLines('A\na\n A ').output, 'A\na');
  assert.equal(removeDuplicateLines('A\na\n A ', { ignoreCase: true }).output, 'A');
  assert.equal(removeDuplicateLines('a\n a', { trim: false }).output, 'a\n a');
  assert.equal(removeDuplicateLines('x\ny\nx', { keep: 'last' }).output, 'y\nx');
  assert.equal(removeDuplicateLines('x\n\ny\n\n', { removeEmpty: true }).output, 'x\ny');
  assert.equal(removeDuplicateLines('x\r\nx\r\ny').output, 'x\ny');
  assert.deepEqual(removeDuplicateLines(''), { output: '', total: 0, kept: 0, removed: 0, duplicates: [] });
});

test('sortLines modes', () => {
  const t = 'banana\nApple\ncherry\n\napple';
  assert.equal(sortLines(t, { locale: 'en' }).output, 'Apple\napple\nbanana\ncherry');
  assert.equal(sortLines(t, { locale: 'en', mode: 'za' }).output, 'cherry\nbanana\nApple\napple');
  assert.equal(sortLines(t, { locale: 'en', unique: true }).output, 'Apple\nbanana\ncherry');
  assert.equal(sortLines('a\n\nb', { removeEmpty: false, locale: 'en' }).output, '\na\nb');
  assert.equal(sortLines('item 10\nitem 2\nitem 1', { mode: 'natural', locale: 'en' }).output, 'item 1\nitem 2\nitem 10');
  assert.equal(sortLines('item 10\nitem 2\nitem 1', { mode: 'az', locale: 'en' }).output, 'item 1\nitem 10\nitem 2');
  assert.equal(sortLines('ccc\na\nbb', { mode: 'length-asc' }).output, 'a\nbb\nccc');
  assert.equal(sortLines('ccc\na\nbb', { mode: 'length-desc' }).output, 'ccc\nbb\na');
  assert.equal(sortLines('x 1,000\nno number\ny -5\nz 20.5', { mode: 'numeric-asc', locale: 'en' }).output, 'y -5\nz 20.5\nx 1,000\nno number');
  assert.equal(sortLines('a 1\nb 3\nc 2', { mode: 'numeric-desc' }).output, 'b 3\nc 2\na 1');
  assert.equal(sortLines('1\n2\n3', { mode: 'reverse' }).output, '3\n2\n1');
  assert.equal(sortLines('  b\na', { trim: true, locale: 'en' }).output, 'a\nb');
  assert.deepEqual(sortLines(''), { output: '', count: 0 });
});

test('sortLines shuffle is a permutation and uses the given RNG', () => {
  const input = 'a\nb\nc\nd';
  const out = sortLines(input, { mode: 'shuffle', randomInt: () => 0 }).output;
  assert.equal(out, 'b\nc\nd\na');
  const real = sortLines(input, { mode: 'shuffle' }).output.split('\n').sort();
  assert.deepEqual(real, ['a', 'b', 'c', 'd']);
});

test('cryptoRandomInt stays in range', () => {
  for (let i = 0; i < 500; i++) {
    const v = cryptoRandomInt(7);
    assert.ok(v >= 0 && v < 7 && Number.isInteger(v));
  }
  assert.equal(cryptoRandomInt(1), 0);
});

test('firstNumber', () => {
  assert.equal(firstNumber('abc 42 def 7'), 42);
  assert.equal(firstNumber('-3.5 kg'), -3.5);
  assert.equal(firstNumber('1,234,567 people'), 1234567);
  assert.ok(Number.isNaN(firstNumber('none')));
});

test('escapeRegExp and unescapeSequences', () => {
  assert.equal(escapeRegExp('a.b*c(d)'), 'a\\.b\\*c\\(d\\)');
  assert.ok(new RegExp(escapeRegExp('[x]+?')).test('[x]+?'));
  assert.equal(unescapeSequences('a\\nb\\tc\\\\n'), 'a\nb\tc\\n');
});

test('findReplace: literal mode', () => {
  const r = findReplace('Cat cat CAT category', 'cat', 'dog');
  assert.equal(r.count, 4);
  assert.equal(r.output, 'dog dog dog dogegory');
  assert.equal(findReplace('a.b.c', '.', '-').output, 'a-b-c');
  assert.equal(findReplace('price $5', '$5', '$$10').output, 'price $$10');
  assert.equal(findReplace('Cat cat', 'cat', 'x', { matchCase: true }).output, 'Cat x');
  assert.equal(findReplace('cat category bobcat', 'cat', 'X', { wholeWord: true }).output, 'X category bobcat');
  assert.equal(findReplace('café cafés', 'café', 'X', { wholeWord: true }).output, 'X cafés');
  assert.deepEqual(findReplace('abc', '', 'x'), { output: 'abc', count: 0, matches: [], truncated: false });
});

test('findReplace: regex mode with groups and escapes', () => {
  const r = findReplace('2024-01-15 and 2023-12-31', '(\\d{4})-(\\d{2})-(\\d{2})', '$3/$2/$1', { regex: true });
  assert.equal(r.output, '15/01/2024 and 31/12/2023');
  assert.equal(r.count, 2);
  assert.deepEqual(r.matches, [[0, 10], [15, 25]]);
  assert.equal(findReplace('a,b,c', ',', '\\n', { regex: true }).output, 'a\nb\nc');
  assert.equal(findReplace('a,b', ',', '\\n').output, 'a\\nb');
  assert.equal(findReplace('one\ntwo', '^', '> ', { regex: true }).output, '> one\n> two');
  assert.equal(findReplace('x\\-y', '\\\\-', '+', { regex: true, wholeWord: false }).output, 'x+y');
  assert.throws(() => findReplace('abc', '(', 'x', { regex: true }), SyntaxError);
});

test('findReplace caps highlighted matches but replaces all', () => {
  const text = 'a'.repeat(50);
  const r = findReplace(text, 'a', 'b', {}, { maxMatches: 10 });
  assert.equal(r.count, 50);
  assert.equal(r.matches.length, 10);
  assert.ok(r.truncated);
  assert.equal(r.output, 'b'.repeat(50));
});

test('buildPattern whole word falls back for non-unicode patterns', () => {
  const re = buildPattern('a\\-b', { regex: true, wholeWord: true });
  assert.ok(re.test('x a-b y'));
});
