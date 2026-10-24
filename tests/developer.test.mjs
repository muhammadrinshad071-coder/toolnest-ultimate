import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJson, printJson, formatJson, jsonStats, JsonError } from '../src/js/lib/json.js';
import { textToBase64, base64ToBytes, bytesToText, bytesToBase64, sniffType, bytesToHex, formatBytes } from '../src/js/lib/encoding.js';
import { uuidV4, uuidV7, formatUuid, inspectUuid } from '../src/js/lib/uuid.js';
import { md5, digest, hmac, encodeText, formatDigest, sameDigest } from '../src/js/lib/hash.js';
import { parseTimeInput, describeInstant, zoneOffsetMinutes, isoInZone, relativeTime, calendarInfo, isLeapYear, formatOffset } from '../src/js/lib/time.js';
import { decodeJwt, describeClaims, describeAlgorithm } from '../src/js/lib/jwt.js';
import { runRegex, splitLiteral } from '../src/js/lib/regex.js';
import { parseColor, formatColor, toHex, rgbToHsl, hslToRgb, contrastRatio, wcagLevels, nearestNamedColor, rgbToOklch, oklchToRgb, rgbToCmyk } from '../src/js/lib/color.js';

/* ---------- JSON ---------- */

test('JSON: formats and minifies without changing numbers', () => {
  const src = '{"id":12345678901234567890,"price":1.10,"tags":["a","b"],"nested":{"ok":true,"none":null},"e":[],"o":{}}';
  const pretty = formatJson(src).output;
  assert.equal(pretty, '{\n  "id": 12345678901234567890,\n  "price": 1.10,\n  "tags": [\n    "a",\n    "b"\n  ],\n  "nested": {\n    "ok": true,\n    "none": null\n  },\n  "e": [],\n  "o": {}\n}');
  assert.equal(formatJson(pretty, { indent: '' }).output, src);
  assert.equal(formatJson('{"b":1,"a":{"d":1,"c":2}}', { indent: '', sortKeys: true }).output, '{"a":{"c":2,"d":1},"b":1}');
  assert.equal(formatJson('[1,2]', { indent: '\t' }).output, '[\n\t1,\n\t2\n]');
  assert.equal(formatJson('"caf\\u00e9 \\n"').output, '"café \\n"');
  assert.equal(formatJson('  -0.5e+10 ').output, '-0.5e+10');
});

test('JSON: precise error messages with line and column', () => {
  const err = (text, re, line, column) => assert.throws(() => parseJson(text), (e) => {
    assert.ok(e instanceof JsonError);
    assert.match(e.message, re);
    if (line) assert.equal(e.line, line);
    if (column) assert.equal(e.column, column);
    return true;
  });
  err('{"a": 1,}', /Trailing commas/, 1, 9);
  err('{\n  "a": 1\n  "b": 2\n}', /Expected “,” or “}”/, 3, 3);
  err("{'a': 1}", /double quotes/);
  err('{a: 1}', /Property names must be in double quotes/);
  err('[1, 2', /missing its closing “\]”/);
  err('{"a": undefined}', /undefined is not allowed/);
  err('{"a": NaN}', /NaN is not allowed/);
  err('[01]', /leading zeros/);
  err('[1.]', /Invalid number/);
  err('"abc', /never closed/);
  err('"a\nb"', /Line breaks inside strings/);
  err('"\\x"', /Invalid escape/);
  err('{} []', /after the end/);
  err('// note\n{}', /Comments are not allowed/);
  err('', /Unexpected end/);
  err('[tru]', /Unexpected word “tru”/);
  err('['.repeat(1002), /deeper than 1000/);
});

test('JSON: duplicate keys warn, stats count structure', () => {
  const { ast, warnings } = parseJson('{"a":1,"a":2,"b":[1,{"c":null}]}');
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Duplicate key “a”/);
  assert.deepEqual(jsonStats(ast), { objects: 2, arrays: 1, values: 4, depth: 3 });
  assert.equal(printJson(ast, { indent: '' }), '{"a":1,"a":2,"b":[1,{"c":null}]}');
});

/* ---------- Base64 ---------- */

test('Base64: RFC 4648 vectors, UTF-8 and URL-safe', () => {
  const vectors = [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']];
  for (const [plain, encoded] of vectors) {
    assert.equal(textToBase64(plain), encoded);
    assert.equal(bytesToText(base64ToBytes(encoded).bytes), plain);
  }
  assert.equal(textToBase64('नमस्ते 👋'), '4KSo4KSu4KS44KWN4KSk4KWHIPCfkYs=');
  assert.equal(bytesToText(base64ToBytes('4KSo4KSu4KS44KWN4KSk4KWHIPCfkYs=').bytes), 'नमस्ते 👋');
  assert.equal(textToBase64('??>', { urlSafe: true }), 'Pz8-');
  assert.equal(bytesToText(base64ToBytes('Pz8-').bytes), '??>');
  assert.equal(bytesToText(base64ToBytes('Zm9v\nYmFy').bytes), 'foobar');
  assert.equal(textToBase64('a'.repeat(60), { wrap: 76 }).split('\n').length, 2);
});

test('Base64: data URIs, errors, binary detection and sniffing', () => {
  const r = base64ToBytes('data:image/png;base64,iVBORw0KGgo=');
  assert.equal(r.mime, 'image/png');
  assert.deepEqual(sniffType(r.bytes), { mime: 'image/png', ext: 'png' });
  assert.equal(bytesToText(r.bytes), null);
  assert.throws(() => base64ToBytes('ab$c'), /not a Base64 character/);
  assert.throws(() => base64ToBytes('abcde'), /wrong length/);
  assert.throws(() => base64ToBytes('data:text/plain,hello'), /not Base64-encoded/);
  assert.deepEqual(sniffType(encodeText('%PDF-1.7')), { mime: 'application/pdf', ext: 'pdf' });
  assert.deepEqual(sniffType(encodeText('<svg xmlns="x"></svg>')), { mime: 'image/svg+xml', ext: 'svg' });
  assert.equal(sniffType(encodeText('hello')), null);
  assert.equal(bytesToBase64(new Uint8Array(100000).fill(255)).length, 133336);
  assert.equal(bytesToHex(new Uint8Array([0, 15, 255])), '000fff');
  assert.equal(formatBytes(999), '999 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(2.5e9), '2.5 GB');
});

/* ---------- UUID ---------- */

test('UUID v4 and v7 structure', () => {
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-([47])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const ids = new Set();
  for (let i = 0; i < 1000; i++) {
    const v4 = uuidV4();
    assert.match(v4, re);
    assert.equal(v4[14], '4');
    ids.add(v4);
  }
  assert.equal(ids.size, 1000);
  const t = Date.UTC(2025, 0, 2, 3, 4, 5, 678);
  const v7 = uuidV7(t);
  assert.match(v7, re);
  assert.equal(v7[14], '7');
  assert.equal(inspectUuid(v7).timestamp.getTime(), t);
  const a = uuidV7(1000);
  const b = uuidV7(2000);
  assert.ok(a < b, 'v7 sorts by time');
  assert.equal(formatUuid('0f8fad5b-d9cb-469f-a165-70867728950e', { uppercase: true, hyphens: false, braces: true }), '{0F8FAD5BD9CB469FA16570867728950E}');
});

test('UUID inspection', () => {
  const v4 = inspectUuid('{0F8FAD5B-D9CB-469F-A165-70867728950E}');
  assert.equal(v4.valid, true);
  assert.equal(v4.version, 4);
  assert.equal(v4.normalized, '0f8fad5b-d9cb-469f-a165-70867728950e');
  assert.equal(v4.variant, 'RFC 9562 (standard)');
  const v1 = inspectUuid('c232ab00-9414-11ec-b3c8-9f6bdeced846');
  assert.equal(v1.version, 1);
  assert.equal(v1.timestamp.toISOString(), '2022-02-22T19:22:22.000Z');
  assert.equal(inspectUuid('00000000-0000-0000-0000-000000000000').versionName, 'Nil UUID (all zeros)');
  assert.equal(inspectUuid('urn:uuid:0f8fad5bd9cb469fa16570867728950e').valid, true);
  assert.equal(inspectUuid('not-a-uuid').valid, false);
  assert.equal(inspectUuid('0f8fad5b-d9cb469f-a165-70867728950e').valid, false);
});

/* ---------- hashes ---------- */

test('MD5 matches RFC 1321 test vectors', async () => {
  const vectors = {
    '': 'd41d8cd98f00b204e9800998ecf8427e',
    a: '0cc175b9c0f1b6a831c399e269772661',
    abc: '900150983cd24fb0d6963f7d28e17f72',
    'message digest': 'f96b697d7cb7938d525a2f31aaf161d0',
    abcdefghijklmnopqrstuvwxyz: 'c3fcd3d76192e4007dfb496cca67e13b',
    '12345678901234567890123456789012345678901234567890123456789012345678901234567890': '57edf4a22be3c955ac49da2e2107b67a'
  };
  for (const [input, expected] of Object.entries(vectors)) assert.equal(bytesToHex(md5(encodeText(input))), expected, `md5("${input}")`);
  assert.equal(bytesToHex(md5(encodeText('a'.repeat(1000)))), 'cabe45dcc9ae5b66ba86600cca6b8ba8');
  assert.equal(bytesToHex(md5(encodeText('a'.repeat(1000000)))), '7707d6ae4e027c70eea2a935c2296f21');
  // Cross-check random lengths, including padding boundaries, against Node's own MD5.
  const { createHash } = await import('node:crypto');
  for (const len of [55, 56, 57, 63, 64, 65, 119, 120, 1023, 4096]) {
    const data = Buffer.from(Array.from({ length: len }, (_, i) => (i * 31 + 7) % 256));
    assert.equal(bytesToHex(md5(new Uint8Array(data))), createHash('md5').update(data).digest('hex'), `length ${len}`);
  }
});

test('SHA family and HMAC match published vectors', async () => {
  const hex = async (alg, s) => formatDigest(await digest(alg, encodeText(s)));
  assert.equal(await hex('SHA-1', 'abc'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(await hex('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await hex('SHA-256', ''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal((await hex('SHA-512', 'abc')).slice(0, 32), 'ddaf35a193617abacc417349ae204131');
  const mac = await hmac('SHA-256', 'Jefe', encodeText('what do ya want for nothing?'));
  assert.equal(formatDigest(mac), '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  await assert.rejects(() => hmac('MD5', 'k', encodeText('x')));
  const d = md5(encodeText('abc'));
  assert.equal(formatDigest(d, 'HEX'), '900150983CD24FB0D6963F7D28E17F72');
  assert.equal(formatDigest(d, 'base64'), 'kAFQmDzST7DWlj99KOF/cg==');
  assert.equal(sameDigest(' 900150983CD24FB0D6963F7D28E17F72 ', d), true);
  assert.equal(sameDigest('kAFQmDzST7DWlj99KOF/cg==', d), true);
  assert.equal(sameDigest('deadbeef', d), false);
  assert.equal(sameDigest('', d), null);
});

/* ---------- time ---------- */

test('timestamps: unit detection and date parsing', () => {
  assert.deepEqual(parseTimeInput('1700000000'), { ms: 1700000000000, kind: 'timestamp', unit: 's' });
  assert.equal(parseTimeInput('1700000000000').unit, 'ms');
  assert.equal(parseTimeInput('1700000000000000').unit, 'us');
  assert.equal(parseTimeInput('1700000000000000000').unit, 'ns');
  assert.equal(parseTimeInput('1700000000123', 'ms').ms, 1700000000123);
  assert.equal(parseTimeInput('-86400').ms, -86400000);
  assert.equal(parseTimeInput('0').ms, 0);
  assert.equal(parseTimeInput('1700000000.5').ms, 1700000000500);
  assert.equal(parseTimeInput('2024-03-15T10:30:00Z').ms, Date.UTC(2024, 2, 15, 10, 30));
  assert.equal(parseTimeInput('2024-03-15 10:30+05:30').ms, Date.UTC(2024, 2, 15, 5, 0));
  assert.equal(parseTimeInput('2024-03-15T10:30:00+0530').assumed, 'explicit');
  assert.equal(parseTimeInput('2024-03-15').assumed, 'local');
  assert.equal(parseTimeInput('Fri, 15 Mar 2024 10:30:00 GMT').ms, Date.UTC(2024, 2, 15, 10, 30));
  assert.throws(() => parseTimeInput('2024-02-30'), /not a real date/);
  assert.throws(() => parseTimeInput('banana'), SyntaxError);
  assert.throws(() => parseTimeInput(''), SyntaxError);
  assert.throws(() => parseTimeInput('99999999999999999999999'), RangeError);
});

test('time zones and daylight saving', () => {
  const t = Date.UTC(2024, 2, 15, 10, 30);
  assert.equal(zoneOffsetMinutes(t, 'Asia/Kolkata'), 330);
  assert.equal(isoInZone(t, 'Asia/Kolkata'), '2024-03-15T16:00:00+05:30');
  assert.equal(isoInZone(t, 'UTC'), '2024-03-15T10:30:00+00:00');
  assert.equal(zoneOffsetMinutes(Date.UTC(2024, 0, 15), 'America/New_York'), -300);
  assert.equal(zoneOffsetMinutes(Date.UTC(2024, 6, 15), 'America/New_York'), -240, 'EDT in summer');
  assert.equal(zoneOffsetMinutes(Date.UTC(2024, 6, 15), 'Europe/London'), 60);
  assert.equal(zoneOffsetMinutes(Date.UTC(2024, 0, 15), 'Asia/Kathmandu'), 345);
  assert.equal(formatOffset(-210), '-03:30');
  const info = describeInstant(1700000000000, { timeZone: 'UTC', now: 1700000000000 });
  assert.equal(info.iso, '2023-11-14T22:13:20.000Z');
  assert.equal(info.unixSeconds, 1700000000);
  assert.equal(info.http, 'Tue, 14 Nov 2023 22:13:20 GMT');
  assert.equal(info.relative, 'now');
  assert.equal(info.dayOfYear, 318);
  assert.equal(info.isoWeek, 46);
  assert.equal(describeInstant(-1, { timeZone: 'UTC' }).unixSeconds, -1);
});

test('relative time, ISO weeks and leap years', () => {
  const now = Date.UTC(2024, 0, 1);
  assert.equal(relativeTime(now + 3 * 86400000, now), 'in 3 days');
  assert.equal(relativeTime(now - 2 * 3600000, now), '2 hours ago');
  assert.equal(relativeTime(now - 86400000, now), 'yesterday');
  assert.deepEqual(calendarInfo(2021, 1, 3), { dayOfYear: 3, isoWeek: 53, isoWeekYear: 2020, weekday: 7 });
  assert.equal(calendarInfo(2024, 12, 30).isoWeek, 1);
  assert.equal(calendarInfo(2024, 12, 31).dayOfYear, 366);
  assert.ok(isLeapYear(2024) && isLeapYear(2000) && !isLeapYear(1900) && !isLeapYear(2023));
});

/* ---------- JWT ---------- */

const b64url = (obj) => textToBase64(JSON.stringify(obj), { urlSafe: true });

test('JWT decoding and claims', () => {
  const sample = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const t = decodeJwt(`Bearer ${sample}`);
  assert.deepEqual(t.header, { alg: 'HS256', typ: 'JWT' });
  assert.deepEqual(t.payload, { sub: '1234567890', name: 'John Doe', iat: 1516239022 });
  const { claims, state } = describeClaims(t.payload, Date.UTC(2024, 0, 1));
  assert.equal(claims.find((c) => c.key === 'iat').date, '2018-01-18T01:30:22Z');
  assert.equal(state, 'none');

  const now = Date.UTC(2024, 0, 1);
  const expired = `${b64url({ alg: 'RS256' })}.${b64url({ exp: now / 1000 - 3600 })}.sig`;
  assert.equal(describeClaims(decodeJwt(expired).payload, now).state, 'expired');
  const future = `${b64url({ alg: 'RS256' })}.${b64url({ nbf: now / 1000 + 60, exp: now / 1000 + 3600 })}.sig`;
  assert.equal(describeClaims(decodeJwt(future).payload, now).state, 'notyet');
  const active = `${b64url({ alg: 'ES256' })}.${b64url({ exp: now / 1000 + 3600 })}.sig`;
  const d = describeClaims(decodeJwt(active).payload, now);
  assert.equal(d.state, 'active');
  assert.match(d.status, /in 1 hour/);
  assert.match(describeAlgorithm('none'), /unsigned/);
  assert.match(describeAlgorithm('HS256'), /shared secret/);
});

test('JWT errors', () => {
  assert.throws(() => decodeJwt(''), /Paste a JSON Web Token/);
  assert.throws(() => decodeJwt('a.b'), /three parts/);
  assert.throws(() => decodeJwt('a.b.c.d.e'), /encrypted token/);
  assert.throws(() => decodeJwt('!!!.e30.x'), /header is not valid Base64URL/);
  assert.throws(() => decodeJwt(`${textToBase64('not json', { urlSafe: true })}.e30.x`), /header is not valid JSON/);
  const textPayload = decodeJwt(`${b64url({ alg: 'HS256' })}.${textToBase64('hello', { urlSafe: true })}.x`);
  assert.equal(textPayload.payload, null);
  assert.equal(textPayload.payloadText, 'hello');
});

/* ---------- regex ---------- */

test('regex runner: matches, groups, flags and replacement', () => {
  const r = runRegex('(?<year>\\d{4})-(\\d{2})', 'g', 'Dates: 2024-03 and 2025-11.');
  assert.equal(r.total, 2);
  assert.equal(r.groupCount, 2);
  assert.deepEqual(r.matches[0], { index: 7, end: 14, text: '2024-03', groups: ['2024', '03'], named: { year: '2024' } });
  assert.equal(runRegex('a', '', 'banana').total, 1, 'without g only the first match');
  assert.equal(runRegex('A', 'gi', 'banana').total, 3);
  assert.equal(runRegex('^b', 'gm', 'ab\nbc').total, 1);
  assert.equal(runRegex('x*', 'g', 'abc').total, 4, 'empty matches advance');
  assert.equal(runRegex('(\\w+)@(\\w+)', 'g', 'a@b c@d', { replacement: '$2 at $1' }).output, 'b at a d at c');
  assert.equal(runRegex(',', 'g', 'a,b', { replacement: '\\n' }).output, 'a\nb');
  assert.equal(runRegex('z(x)?', 'g', 'abc').groupCount, 1);
  const capped = runRegex('a', 'g', 'a'.repeat(50), { maxMatches: 10 });
  assert.equal(capped.matches.length, 10);
  assert.ok(capped.truncated);
  assert.throws(() => runRegex('(', 'g', ''), SyntaxError);
  assert.throws(() => runRegex('a', 'q', ''), SyntaxError);
  assert.deepEqual(splitLiteral('/ab+c/gi'), { pattern: 'ab+c', flags: 'gi' });
  assert.equal(splitLiteral('abc'), null);
});

/* ---------- colour ---------- */

test('colour parsing accepts CSS syntaxes', () => {
  const same = (a, b) => assert.equal(toHex(parseColor(a)), b, a);
  same('#f63', '#ff6633');
  same('ff6347', '#ff6347');
  same('tomato', '#ff6347');
  same('rgb(255, 99, 71)', '#ff6347');
  same('rgb(255 99 71)', '#ff6347');
  same('rgb(100% 0% 0%)', '#ff0000');
  same('hsl(9, 100%, 63.9%)', '#ff6347');
  same('hsl(9deg 100% 63.9%)', '#ff6347');
  same('hsl(0.025turn 100% 63.9%)', '#ff6347');
  same('hwb(0 0% 0%)', '#ff0000');
  same('hwb(0 60% 60%)', '#808080');
  same('oklch(62.8% 0.2577 29.23)', '#ff0000');
  same('REBECCAPURPLE', '#663399');
  assert.deepEqual(parseColor('#ff000080'), { r: 255, g: 0, b: 0, a: 0.502 });
  assert.equal(parseColor('rgba(0, 0, 0, 0.5)').a, 0.5);
  assert.equal(parseColor('rgb(0 0 0 / 25%)').a, 0.25);
  assert.equal(parseColor('transparent').a, 0);
  assert.throws(() => parseColor('notacolour'), SyntaxError);
  assert.throws(() => parseColor('rgb(1, 2)'), /three values/);
  assert.throws(() => parseColor(''), SyntaxError);
});

test('colour conversions and formats', () => {
  const f = formatColor(parseColor('#ff6347'));
  assert.equal(f.hex, '#ff6347');
  assert.equal(f.rgb, 'rgb(255, 99, 71)');
  assert.equal(f.hsl, 'hsl(9.1, 100%, 63.9%)');
  assert.equal(f.hsv, 'hsv(9.1°, 72.2%, 100%)');
  assert.equal(f.cmyk, 'cmyk(0%, 61%, 72%, 0%)');
  assert.match(f.oklch, /^oklch\(69\.\d% 0\.19\d 3\d\.\d\)$/);
  assert.equal(formatColor(parseColor('rgba(255,0,0,0.5)')).hex, '#ff000080');
  for (const hex of ['#000000', '#ffffff', '#123456', '#abcdef', '#ff8800', '#00ff7f']) {
    const c = parseColor(hex);
    assert.equal(toHex({ ...hslToRgb(rgbToHsl(c)), a: 1 }), hex, `HSL round-trip ${hex}`);
    const back = oklchToRgb(rgbToOklch(c));
    assert.equal(toHex({ ...back, a: 1 }), hex, `OKLCH round-trip ${hex}`);
    assert.ok(back.inGamut);
  }
  assert.equal(oklchToRgb({ L: 0.7, C: 0.4, h: 140 }).inGamut, false);
  assert.deepEqual(rgbToCmyk({ r: 0, g: 0, b: 0 }), { c: 0, m: 0, y: 0, k: 100 });
});

test('WCAG contrast and nearest named colour', () => {
  const black = parseColor('#000');
  const white = parseColor('#fff');
  assert.equal(contrastRatio(black, white), 21);
  assert.equal(contrastRatio(white, white), 1);
  assert.equal(Number(contrastRatio(parseColor('#767676'), white).toFixed(2)), 4.54);
  assert.deepEqual(wcagLevels(4.54), { normalAA: true, normalAAA: false, largeAA: true, largeAAA: true });
  assert.equal(nearestNamedColor(parseColor('#ff6347')).name, 'tomato');
  assert.ok(nearestNamedColor(parseColor('#ff6347')).exact);
  assert.equal(nearestNamedColor(parseColor('#fe0002')).name, 'red');
  assert.ok(!nearestNamedColor(parseColor('#fe0002')).exact);
});
