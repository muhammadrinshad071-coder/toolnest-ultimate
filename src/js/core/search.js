/**
 * Local, dependency-free tool search. Pure functions — no DOM access —
 * so the same code runs in the browser and in Node tests.
 */

export function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function tokenize(value) {
  return normalize(value).split(/[^a-z0-9]+/).filter(Boolean);
}

const indexCache = new WeakMap();

function indexOf(item, categoryLookup) {
  let entry = indexCache.get(item);
  if (entry) return entry;
  const category = categoryLookup ? categoryLookup(item.category) : null;
  const tags = (item.tags || []).map(normalize);
  entry = {
    name: normalize(item.name),
    nameWords: tokenize(item.name),
    tags,
    tagWords: tags.flatMap((t) => t.split(/[^a-z0-9]+/).filter(Boolean)),
    category: category ? normalize(`${category.name} ${category.short || ''}`) : normalize(item.category),
    description: normalize(item.description)
  };
  indexCache.set(item, entry);
  return entry;
}

/** True when every character of `needle` appears in order in `haystack`. */
export function isSubsequence(needle, haystack) {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return needle.length === 0;
}

function tokenScore(token, idx) {
  if (idx.nameWords.some((w) => w.startsWith(token))) return 12;
  if (idx.name.includes(token)) return 7;
  if (idx.tagWords.some((w) => w.startsWith(token))) return 8;
  if (idx.tags.some((t) => t.includes(token))) return 5;
  if (idx.category.includes(token)) return 4;
  if (idx.description.includes(token)) return 2;
  if (token.length >= 3 && isSubsequence(token, idx.name.replace(/[^a-z0-9]/g, ''))) return 1;
  return 0;
}

/**
 * Rank `items` against `query`. Every query word must match somewhere.
 * @param {string} query
 * @param {Array} items tools from the registry
 * @param {{category?: string, categoryLookup?: Function, boost?: Function, limit?: number}} options
 * @returns {Array} matching items, best first
 */
export function searchTools(query, items, options = {}) {
  const { category, categoryLookup, boost, limit = Infinity } = options;
  const pool = category ? items.filter((t) => t.category === category) : items;
  const tokens = tokenize(query);

  if (tokens.length === 0) {
    if (!boost) return pool.slice(0, limit);
    return pool
      .map((item, i) => ({ item, score: boost(item), i }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, limit)
      .map((r) => r.item);
  }

  const phrase = normalize(query);
  const results = [];
  pool.forEach((item, i) => {
    const idx = indexOf(item, categoryLookup);
    let score = 0;
    for (const token of tokens) {
      const s = tokenScore(token, idx);
      if (s === 0) return;
      score += s;
    }
    if (idx.name.startsWith(phrase)) score += 25;
    else if (idx.name.includes(phrase)) score += 15;
    if (idx.tags.includes(phrase)) score += 12;
    if (boost) score += boost(item);
    results.push({ item, score, i });
  });

  return results
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((r) => r.item);
}
