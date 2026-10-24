/**
 * Runs a job in a module Web Worker with a time limit.
 *
 * - A newer request cancels one that is still running (the worker is
 *   terminated and restarted), so slow jobs never queue up while typing.
 * - A job over the time limit is stopped and rejected with TimeoutError,
 *   which keeps the page responsive even for pathological input.
 * - If the browser can't start module workers, jobs run on the main thread.
 *
 * The worker must reply to { id, payload } with { id, ok: true, result }
 * or { id, ok: false, name, message }.
 */

export class StaleRequest extends Error {}
export class TimeoutError extends Error {}

export function createWorkerRunner(workerUrl, runLocally, { timeoutMs = 2000 } = {}) {
  let worker = null;
  let supported = typeof Worker !== 'undefined';
  let pending = null;
  let seq = 0;

  function kill() {
    if (worker) worker.terminate();
    worker = null;
  }

  function settle(fn) {
    const p = pending;
    pending = null;
    clearTimeout(p.timer);
    fn(p);
  }

  function spawn() {
    try {
      worker = new Worker(workerUrl, { type: 'module' });
    } catch {
      supported = false;
      worker = null;
      return;
    }
    worker.onmessage = (e) => {
      if (!pending || e.data.id !== pending.id) return;
      settle((p) => (e.data.ok
        ? p.resolve(e.data.result)
        : p.reject(Object.assign(new Error(e.data.message), { name: e.data.name }))));
    };
    worker.onerror = (e) => {
      // The worker script failed to load: use the main thread from now on.
      e.preventDefault();
      supported = false;
      kill();
      if (pending) settle((p) => { try { p.resolve(runLocally(p.payload)); } catch (err) { p.reject(err); } });
    };
  }

  return {
    run(payload) {
      if (pending) {
        settle((p) => p.reject(new StaleRequest()));
        kill();
      }
      if (supported && !worker) spawn();
      if (!supported) return new Promise((resolve) => resolve(runLocally(payload)));
      return new Promise((resolve, reject) => {
        const id = ++seq;
        pending = {
          id,
          payload,
          resolve,
          reject,
          timer: setTimeout(() => {
            if (pending && pending.id === id) {
              settle((p) => p.reject(new TimeoutError()));
              kill();
            }
          }, timeoutMs)
        };
        worker.postMessage({ id, payload });
      });
    }
  };
}

/** Worker-side helper: answer each message with fn(payload). */
export function serveWorker(fn) {
  self.onmessage = (event) => {
    const { id, payload } = event.data;
    try {
      self.postMessage({ id, ok: true, result: fn(payload) });
    } catch (err) {
      self.postMessage({ id, ok: false, name: err.name, message: err.message });
    }
  };
}
