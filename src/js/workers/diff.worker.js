/**
 * Compares texts off the main thread so large comparisons never freeze
 * the page. Input is never logged or stored.
 */
import { diffText } from '../lib/diff.js';
import { serveWorker } from '../ui/worker-runner.js';

serveWorker((p) => diffText(p.before, p.after, p.options));
