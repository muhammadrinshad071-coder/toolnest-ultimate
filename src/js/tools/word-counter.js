import { textStats, keywordDensity, formatDuration } from '../lib/text.js';
import {
  h, panel, textArea, textInput, selectField, checkbox, statGrid, progressBar, tableView,
  actionBar, clearButton, copyButton, downloadButton, examples, liveUpdater, formatNumber
} from '../ui/toolkit.js';

const SPEEDS = [
  { id: '200', label: 'Relaxed — 200 words/min' },
  { id: '238', label: 'Average — 238 words/min' },
  { id: '300', label: 'Fast — 300 words/min' }
];

const EXAMPLES = [
  {
    label: 'Short paragraph',
    value: 'The quick brown fox jumps over the lazy dog. It’s a well-known pangram — every letter of the English alphabet appears at least once! Typists have used it for decades.'
  },
  {
    label: 'Essay excerpt',
    value: 'Climate change is one of the defining challenges of our time. Rising temperatures affect weather patterns, sea levels and ecosystems around the world.\n\nScientists agree that human activity, e.g. burning fossil fuels, is the main cause. Reducing emissions requires action from governments, businesses and individuals.\n\nSmall changes add up. Choosing public transport, saving energy at home and reducing waste are simple steps anyone can take.'
  },
  { label: 'Mixed languages', value: 'Hello world! Bonjour le monde. こんにちは世界。 你好，世界！ ¡Hola mundo! 👋🏽' }
];

export function mount(container) {
  const input = textArea({ label: 'Your text', placeholder: 'Start typing or paste your text here…', rows: 14, labelHidden: true });

  const stats = statGrid([
    { key: 'words', label: 'Words', primary: true },
    { key: 'characters', label: 'Characters' },
    { key: 'charactersNoSpaces', label: 'Characters (no spaces)' },
    { key: 'sentences', label: 'Sentences' },
    { key: 'paragraphs', label: 'Paragraphs' },
    { key: 'reading', label: 'Reading time' },
    { key: 'speaking', label: 'Speaking time' },
    { key: 'lines', label: 'Lines' },
    { key: 'unique', label: 'Unique words' },
    { key: 'average', label: 'Avg. word length' },
    { key: 'bytes', label: 'Size (UTF-8 bytes)' },
    { key: 'longest', label: 'Longest word' }
  ]);

  const speed = selectField({ label: 'Reading speed', options: SPEEDS, value: '238', onChange: () => update() });
  const goal = textInput({ label: 'Word goal (optional)', type: 'number', placeholder: 'e.g. 500', attrs: { min: '1', max: '10000000', step: '1', inputmode: 'numeric' } });
  const goalBar = progressBar('Progress towards word goal');
  const goalText = h('p', { class: 'field__hint', 'aria-live': 'polite' });
  const goalWrap = h('div', { class: 'field', hidden: true }, goalBar.el, goalText);

  const excludeStop = checkbox({ label: 'Hide common words (the, and, of…)', checked: true, onChange: () => renderKeywords() });
  const keywordSlot = h('div', {});
  const keywords = h('details', { class: 'disclosure' },
    h('summary', { text: 'Top keywords' }),
    h('div', { class: 'disclosure__body tool-stack' }, excludeStop.el, keywordSlot));
  keywords.addEventListener('toggle', () => renderKeywords());

  let current = textStats('');

  function renderKeywords() {
    if (!keywords.open) return;
    const list = keywordDensity(input.el.value, { excludeStopwords: excludeStop.input.checked });
    keywordSlot.replaceChildren(list.length
      ? tableView(
        [{ key: 'word', label: 'Word', className: 'cell-text' }, { key: 'count', label: 'Count', num: true }, { key: 'percent', label: 'Density', num: true }],
        list.map((k) => ({ word: k.word, count: formatNumber(k.count), percent: `${formatNumber(k.percent, 1)}%` })))
      : h('p', { class: 'muted', text: 'Type or paste some text to see its most frequent words.' }));
  }

  function renderGoal() {
    const raw = goal.el.value.trim();
    if (!raw) {
      goal.el.removeAttribute('aria-invalid');
      goalWrap.hidden = true;
      return;
    }
    const target = Number(raw);
    if (!Number.isInteger(target) || target < 1) {
      goal.el.setAttribute('aria-invalid', 'true');
      goalWrap.hidden = false;
      goalBar.set(0);
      goalText.textContent = 'Enter a whole number greater than 0.';
      return;
    }
    goal.el.removeAttribute('aria-invalid');
    goalWrap.hidden = false;
    const pct = (current.words / target) * 100;
    goalBar.set(pct);
    goalText.textContent = current.words >= target
      ? `Goal reached: ${formatNumber(current.words)} of ${formatNumber(target)} words${current.words > target ? ` (${formatNumber(current.words - target)} over)` : ''}.`
      : `${formatNumber(current.words)} of ${formatNumber(target)} words (${formatNumber(pct, 0)}%) — ${formatNumber(target - current.words)} to go.`;
  }

  function update() {
    current = textStats(input.el.value, { readingWpm: Number(speed.el.value) });
    stats.update({
      words: formatNumber(current.words),
      characters: formatNumber(current.characters),
      charactersNoSpaces: formatNumber(current.charactersNoSpaces),
      sentences: formatNumber(current.sentences),
      paragraphs: formatNumber(current.paragraphs),
      reading: formatDuration(current.readingSeconds),
      speaking: formatDuration(current.speakingSeconds),
      lines: formatNumber(current.lines),
      unique: formatNumber(current.uniqueWords),
      average: current.words ? `${formatNumber(current.averageWordLength, 1)} chars` : '0',
      bytes: formatNumber(current.bytes),
      longest: current.longestWord ? (current.longestWord.length > 24 ? `${current.longestWord.slice(0, 24)}…` : current.longestWord) : '—'
    });
    renderGoal();
    renderKeywords();
  }

  function summary() {
    if (!input.el.value) return '';
    return [
      'Text statistics — ToolNest Word & Character Counter',
      `Words: ${current.words}`,
      `Characters: ${current.characters}`,
      `Characters (no spaces): ${current.charactersNoSpaces}`,
      `Sentences: ${current.sentences}`,
      `Paragraphs: ${current.paragraphs}`,
      `Lines: ${current.lines}`,
      `Unique words: ${current.uniqueWords}`,
      `Average word length: ${current.averageWordLength.toFixed(1)} characters`,
      `Reading time (${speed.el.value} wpm): ${formatDuration(current.readingSeconds)}`,
      `Speaking time (130 wpm): ${formatDuration(current.speakingSeconds)}`,
      `Size: ${current.bytes} bytes (UTF-8)`
    ].join('\n');
  }

  const schedule = liveUpdater(update, () => input.el.value.length);
  input.el.addEventListener('input', schedule);
  goal.el.addEventListener('input', renderGoal);

  container.append(
    h('div', { class: 'tool-grid tool-grid--split' },
      panel({
        title: 'Text',
        actions: actionBar(
          copyButton(() => input.el.value, { label: 'Copy text' }),
          clearButton([input.el], { onChange: update })
        ),
        children: [
          input.field,
          examples(EXAMPLES, (ex) => { input.el.value = ex.value; update(); input.el.focus(); })
        ]
      }),
      panel({
        title: 'Statistics',
        actions: actionBar(
          copyButton(summary, { label: 'Copy summary', emptyMessage: 'Add some text first.' }),
          downloadButton(summary, { filename: 'text-statistics.txt', emptyMessage: 'Add some text first.' })
        ),
        children: [
          stats.el,
          h('div', { class: 'input-row' }, speed.field, goal.field),
          goalWrap,
          keywords
        ]
      })
    )
  );
  update();
  input.el.focus({ preventScroll: true });
}
