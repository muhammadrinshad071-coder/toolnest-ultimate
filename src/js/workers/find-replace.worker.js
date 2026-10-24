/**
 * Runs find & replace off the main thread. The page terminates this worker
 * if a pattern takes too long (catastrophic backtracking), so the UI never
 * freezes. Input is never logged or stored.
 */
import { findReplace } from '../lib/text.js';
import { serveWorker } from '../ui/worker-runner.js';

serveWorker((p) => findReplace(p.text, p.find, p.replace, p.options));
