/*
 * Runs synchronously in <head> before first paint so the saved theme and
 * accent apply without a flash. Kept tiny, dependency-free and ES5-safe.
 * Only marks the page as scripted ("js" class) when the browser supports
 * ES modules — otherwise script-only controls stay hidden.
 */
(function () {
  var d = document.documentElement;
  if (!('noModule' in HTMLScriptElement.prototype)) return;
  d.classList.add('js');
  var s = {};
  try {
    s = JSON.parse(window.localStorage.getItem('toolnest:settings') || '{}') || {};
  } catch (e) { s = {}; }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = s.theme === 'light' || s.theme === 'dark' ? s.theme : (prefersDark ? 'dark' : 'light');
  d.setAttribute('data-theme', theme);
  d.setAttribute('data-accent', typeof s.accent === 'string' && /^[a-z]{2,20}$/.test(s.accent) ? s.accent : 'indigo');
  if (s.motion === 'reduce') d.setAttribute('data-motion', 'reduce');
})();
