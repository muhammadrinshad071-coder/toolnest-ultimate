/**
 * Runs regular expressions off the main thread so a slow pattern can be
 * stopped without freezing the page. Input is never logged or stored.
 */
import { runRegex } from '../lib/regex.js';
import { serveWorker } from '../ui/worker-runner.js';

serveWorker((p) => runRegex(p.pattern, p.flags, p.text, { replacement: p.replacement }));
