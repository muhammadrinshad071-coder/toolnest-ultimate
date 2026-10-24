/**
 * Unix timestamps and dates. Time-zone conversions use the browser's
 * built-in Intl time-zone database, so daylight-saving changes are handled.
 */

export const TIMESTAMP_UNITS = [
  { id: 'auto', label: 'Detect automatically' },
  { id: 's', label: 'Seconds' },
  { id: 'ms', label: 'Milliseconds' },
  { id: 'us', label: 'Microseconds' },
  { id: 'ns', label: 'Nanoseconds' }
];

const TO_MS = { s: 1000, ms: 1, us: 1e-3, ns: 1e-6 };
const MAX_MS = 8.64e15; // the range of JavaScript dates: ±100 million days from 1970

function detectUnit(intDigits) {
  if (intDigits <= 11) return 's';
  if (intDigits <= 14) return 'ms';
  if (intDigits <= 17) return 'us';
  return 'ns';
}

/**
 * Read a Unix timestamp or a date string.
 * @returns {{ms: number, kind: 'timestamp'|'date', unit?: string, assumed?: 'local'|'utc'|'explicit'}}
 */
export function parseTimeInput(input, unit = 'auto') {
  const s = String(input ?? '').trim();
  if (!s) throw new SyntaxError('Enter a Unix timestamp or a date.');

  if (/^[-+]?\d+(\.\d+)?$/.test(s)) {
    const digits = s.replace(/^[-+]/, '').split('.')[0].replace(/^0+(?=\d)/, '').length;
    const used = unit === 'auto' ? detectUnit(digits) : unit;
    const ms = Number(s) * TO_MS[used];
    if (Math.abs(ms) > MAX_MS) throw new RangeError('That timestamp is outside the range a computer calendar can show (about ±275,000 years).');
    return { ms, kind: 'timestamp', unit: used };
  }

  const iso = s.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?))?\s*(Z|[+-]\d{2}:?\d{2})?$/i);
  if (iso) {
    const [, date, time, zone] = iso;
    const text = `${date}T${(time || '00:00').replace(',', '.')}${zone ? zone.toUpperCase().replace(/^([+-]\d{2})(\d{2})$/, '$1:$2') : ''}`;
    const ms = Date.parse(text);
    if (Number.isNaN(ms)) throw new RangeError(`“${s}” is not a real date.`);
    const [y, m, d] = date.split('-').map(Number);
    const check = new Date(Date.UTC(y, m - 1, d));
    if (check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) throw new RangeError(`“${date}” is not a real date.`);
    return { ms, kind: 'date', assumed: zone ? 'explicit' : 'local' };
  }

  const ms = Date.parse(s);
  if (Number.isNaN(ms)) throw new SyntaxError('Use a Unix timestamp (like 1700000000) or a date such as 2024-03-15, 2024-03-15 14:30 or 2024-03-15T14:30:00Z.');
  return { ms, kind: 'date', assumed: /(?:Z|GMT|UTC|[+-]\d{2}:?\d{2})\s*$/i.test(s) ? 'explicit' : 'local' };
}

/** Calendar fields of an instant in a time zone. */
export function zonedParts(ms, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', era: 'short'
  }).formatToParts(new Date(ms));
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  const era = parts.find((p) => p.type === 'era')?.value;
  const year = era === 'BC' || era === 'B' ? 1 - get('year') : get('year');
  return { year, month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Offset of a time zone from UTC at an instant, in minutes (e.g. +330 for India). */
export function zoneOffsetMinutes(ms, timeZone) {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

const pad = (n, w = 2) => String(Math.abs(n)).padStart(w, '0');

export function formatOffset(minutes) {
  const sign = minutes < 0 ? '-' : '+';
  return `${sign}${pad(Math.floor(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`;
}

/** ISO 8601 with the zone's offset, e.g. 2024-03-15T16:00:00+05:30. */
export function isoInZone(ms, timeZone) {
  const p = zonedParts(ms, timeZone);
  const frac = ((ms % 1000) + 1000) % 1000;
  const year = p.year < 0 || p.year > 9999 ? `${p.year < 0 ? '-' : '+'}${pad(p.year, 6)}` : pad(p.year, 4);
  return `${year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}${frac ? `.${pad(Math.floor(frac), 3)}` : ''}${formatOffset(zoneOffsetMinutes(ms, timeZone))}`;
}

const UNITS = [['year', 31557600000], ['month', 2629800000], ['week', 604800000], ['day', 86400000], ['hour', 3600000], ['minute', 60000], ['second', 1000]];

/** "in 3 days", "2 hours ago", "now". */
export function relativeTime(ms, now = Date.now(), locale = 'en') {
  const diff = ms - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') return rtf.format(Math.round(diff / size), unit);
  }
  return '';
}

/** ISO 8601 week number and day of the year for a calendar date. */
export function calendarInfo(year, month, day) {
  const date = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.round((date - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const weekday = new Date(date).getUTCDay() || 7; // Monday = 1 … Sunday = 7
  const thursday = new Date(date + (4 - weekday) * 86400000);
  const weekYear = thursday.getUTCFullYear();
  const week = Math.floor((thursday - Date.UTC(weekYear, 0, 1)) / 604800000) + 1;
  return { dayOfYear, isoWeek: week, isoWeekYear: weekYear, weekday };
}

export function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** Everything the timestamp converter shows for an instant. */
export function describeInstant(ms, { timeZone, now = Date.now() } = {}) {
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = new Date(ms);
  const p = zonedParts(ms, zone);
  const cal = calendarInfo(p.year, p.month, p.day);
  return {
    unixSeconds: Math.floor(ms / 1000),
    unixMs: Math.floor(ms),
    iso: date.toISOString(),
    isoZoned: isoInZone(ms, zone),
    http: date.toUTCString(),
    readable: new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle: 'full', timeStyle: 'long' }).format(date),
    relative: relativeTime(ms, now),
    offset: formatOffset(zoneOffsetMinutes(ms, zone)),
    timeZone: zone,
    ...cal,
    leapYear: isLeapYear(p.year)
  };
}
