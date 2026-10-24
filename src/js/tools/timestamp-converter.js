import { parseTimeInput, describeInstant, TIMESTAMP_UNITS } from '../lib/time.js';
import { h, panel, textInput, selectField, actionBar, button, statusLine, resultRows, examples, copyText } from '../ui/toolkit.js';
import { toast } from '../ui/toast.js';

const COMMON_ZONES = ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney'];

const EXAMPLES = [
  { label: 'Seconds', value: '1700000000' },
  { label: 'Milliseconds', value: '1735689600000' },
  { label: 'ISO date', value: '2025-08-15T09:30:00+05:30' },
  { label: 'HTTP date', value: 'Tue, 14 Nov 2023 22:13:20 GMT' }
];

function zoneOptions(local) {
  const all = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : COMMON_ZONES;
  const ordered = [local, ...COMMON_ZONES.filter((z) => z !== local), ...all.filter((z) => z !== local && !COMMON_ZONES.includes(z))];
  return [...new Set(ordered)].map((z) => ({ id: z, label: z === local ? `${z.replace(/_/g, ' ')} (your time zone)` : z.replace(/_/g, ' ') }));
}

export function mount(container) {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const nowSeconds = h('div', { class: 'big-result' });
  const nowMs = h('p', { class: 'formula' });
  const input = textInput({ label: 'Timestamp or date', mono: true, placeholder: 'e.g. 1700000000 or 2025-08-15 14:30' });
  const unit = selectField({ label: 'Timestamp unit', options: TIMESTAMP_UNITS, value: 'auto', onChange: () => update() });
  const zone = selectField({ label: 'Show in time zone', options: zoneOptions(local), value: local, onChange: () => update() });
  const status = statusLine();
  const rows = resultRows({ empty: 'Enter a Unix timestamp or a date.' });

  const tick = () => {
    const now = Date.now();
    nowSeconds.textContent = String(Math.floor(now / 1000));
    nowMs.textContent = `${now} ms · ${new Date(now).toISOString()}`;
  };
  tick();
  // Each tool is its own page, so the clock stops when you navigate away.
  setInterval(() => { if (!document.hidden) tick(); }, 1000);

  function update() {
    status.clear();
    if (!input.el.value.trim()) { rows.set([]); input.el.removeAttribute('aria-invalid'); return; }
    try {
      const parsed = parseTimeInput(input.el.value, unit.el.value);
      input.el.removeAttribute('aria-invalid');
      const d = describeInstant(parsed.ms, { timeZone: zone.el.value });
      if (parsed.kind === 'timestamp' && unit.el.value === 'auto') {
        status.show('info', `Read as ${TIMESTAMP_UNITS.find((u) => u.id === parsed.unit).label.toLowerCase()} since 1 January 1970 UTC. Choose a unit if that’s wrong.`);
      } else if (parsed.assumed === 'local') {
        status.show('info', `No time zone was given, so this date was read in your local time zone (${local.replace(/_/g, ' ')}).`);
      }
      rows.set([
        { label: 'Unix time (seconds)', value: String(d.unixSeconds), emphasis: true },
        { label: 'Unix time (milliseconds)', value: String(d.unixMs) },
        { label: `In ${d.timeZone.replace(/_/g, ' ')}`, value: d.readable, mono: false, note: `UTC${d.offset}` },
        { label: 'ISO 8601 (with offset)', value: d.isoZoned },
        { label: 'ISO 8601 (UTC)', value: d.iso },
        { label: 'HTTP / RFC 7231', value: d.http },
        { label: 'Relative', value: d.relative, mono: false },
        { label: 'Day of year', value: `${d.dayOfYear}${d.leapYear ? ' (leap year)' : ''}`, mono: false },
        { label: 'ISO week', value: `Week ${d.isoWeek} of ${d.isoWeekYear}`, mono: false }
      ]);
    } catch (err) {
      input.el.setAttribute('aria-invalid', 'true');
      rows.set([]);
      status.show('error', err.message);
    }
  }

  input.el.addEventListener('input', update);

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      h('div', { class: 'tool-stack' },
        panel({
          title: 'Current Unix time',
          actions: actionBar(
            button({ label: 'Copy', iconName: 'copy', onClick: async () => { if (await copyText(nowSeconds.textContent)) toast('Current timestamp copied.', { type: 'success', duration: 1800 }); } }),
            button({ label: 'Use', iconName: 'arrowRight', variant: 'ghost', onClick: () => { input.el.value = nowSeconds.textContent; unit.el.value = 'auto'; update(); } })
          ),
          children: [nowSeconds, nowMs]
        }),
        panel({
          title: 'Convert',
          children: [input.field, h('div', { class: 'input-row' }, unit.field, zone.field), examples(EXAMPLES, (ex) => { input.el.value = ex.value; unit.el.value = 'auto'; update(); }), status.el]
        })
      ),
      panel({ title: 'Result', children: [rows.el] })
    )
  );
  update();
}
