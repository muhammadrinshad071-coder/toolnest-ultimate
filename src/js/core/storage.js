/**
 * Safe key/value storage for small settings.
 *
 * localStorage can be missing (privacy modes, blocked site data), throw on
 * access, or run out of quota. Every call here is wrapped so the app keeps
 * working; values then live in memory for the current page only, and
 * callers get an honest `{ ok: false }` instead of a false "saved".
 */

export const PREFIX = 'toolnest:';

export function createStore(getBackend) {
  const memory = new Map();
  let backend = null;
  let persistent = false;

  try {
    const candidate = getBackend();
    if (candidate) {
      const probe = `${PREFIX}__probe__`;
      candidate.setItem(probe, '1');
      candidate.removeItem(probe);
      backend = candidate;
      persistent = true;
    }
  } catch {
    backend = null;
    persistent = false;
  }

  function read(key) {
    const full = PREFIX + key;
    if (backend) {
      try {
        const raw = backend.getItem(full);
        if (raw !== null) return raw;
      } catch { /* fall through to memory */ }
    }
    return memory.has(full) ? memory.get(full) : null;
  }

  return {
    get isPersistent() {
      return persistent;
    },

    getJSON(key, fallback) {
      const raw = read(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },

    /** @returns {{ok: boolean, error?: string}} */
    setJSON(key, value) {
      const full = PREFIX + key;
      const raw = JSON.stringify(value);
      memory.set(full, raw);
      if (!backend) return { ok: false, error: 'Browser storage is unavailable, so this lasts only until you leave the page.' };
      try {
        backend.setItem(full, raw);
        return { ok: true };
      } catch (err) {
        const quota = err && (err.name === 'QuotaExceededError' || err.code === 22);
        return { ok: false, error: quota ? 'Browser storage is full. Free some space or export and clear old data.' : 'The browser refused to save this data.' };
      }
    },

    remove(key) {
      const full = PREFIX + key;
      memory.delete(full);
      if (!backend) return;
      try { backend.removeItem(full); } catch { /* ignore */ }
    },

    /** Remove every key this app owns. Returns how many were removed. */
    clearAll() {
      let count = 0;
      for (const k of [...memory.keys()]) { memory.delete(k); count++; }
      if (backend) {
        try {
          const owned = [];
          for (let i = 0; i < backend.length; i++) {
            const k = backend.key(i);
            if (k && k.startsWith(PREFIX)) owned.push(k);
          }
          owned.forEach((k) => backend.removeItem(k));
          count = Math.max(count, owned.length);
        } catch { /* ignore */ }
      }
      return count;
    }
  };
}

export const store = createStore(() => globalThis.window && globalThis.window.localStorage);
