/**
 * Central tool registry — the single source of truth for categories and tools.
 *
 * Used both in the browser (search, navigation, related tools) and by the
 * Node build script (static pages, sitemap). Keep it free of browser APIs.
 *
 * status:
 *   'ready'   — implemented, tested, has its own page under tools/<id>/
 *   'planned' — on the roadmap; listed honestly as "planned", never linked
 */

export const SITE_NAME = 'ToolNest Ultimate';

export const categories = [
  { id: 'text', name: 'Text & Writing', short: 'Text', icon: 'type', description: 'Count, convert, clean up and transform text.' },
  { id: 'image', name: 'Image & Photo', short: 'Image', icon: 'image', description: 'Compress, resize, crop, convert and inspect images locally.' },
  { id: 'pdf', name: 'PDF & Documents', short: 'PDF', icon: 'file', description: 'Merge, split, rotate and build PDF files in your browser.' },
  { id: 'student', name: 'Student & Education', short: 'Student', icon: 'cap', description: 'Grades, GPA, flashcards, planners and study timers.' },
  { id: 'math', name: 'Math & Conversion', short: 'Math', icon: 'sigma', description: 'Calculators, statistics, number bases and unit converters.' },
  { id: 'developer', name: 'Developer Utilities', short: 'Developer', icon: 'code', description: 'Formatters, encoders, generators and inspectors for code.' },
  { id: 'design', name: 'Design & Color', short: 'Design', icon: 'droplet', description: 'Colors, gradients, shadows, contrast and typography.' },
  { id: 'security', name: 'Privacy & Security', short: 'Security', icon: 'shield', description: 'Passwords, hashing and encryption with Web Crypto.' },
  { id: 'social', name: 'Social Media & Content', short: 'Social', icon: 'hash', description: 'Format captions, bios, hashtags and content plans.' },
  { id: 'finance', name: 'Business & Finance', short: 'Finance', icon: 'wallet', description: 'GST, EMI, interest, margins, invoices and budgets.' },
  { id: 'productivity', name: 'Productivity', short: 'Productivity', icon: 'check-square', description: 'To-dos, notes, timers, planners and trackers.' },
  { id: 'datetime', name: 'Date & Time', short: 'Date & Time', icon: 'calendar', description: 'Ages, date differences, time zones and timestamps.' },
  { id: 'network', name: 'Internet & Networking', short: 'Network', icon: 'globe', description: 'Offline URL, IP and subnet tools plus references.' },
  { id: 'data', name: 'File & Data', short: 'Data', icon: 'database', description: 'CSV, JSON, Base64, hex and file inspection.' },
  { id: 'media', name: 'Audio & Video', short: 'Media', icon: 'film', description: 'Preview, inspect, trim and capture frames from media.' }
];


/**
 * Fully implemented tools. Only the fields needed on every page live here;
 * long help text (instructions, explanations, limitations) is in
 * tool-docs.js, which only the build script loads.
 */
const readyTools = [
  {
    id: 'word-counter',
    name: 'Word & Character Counter',
    category: 'text',
    icon: 'letters',
    description: 'Count words, characters, sentences and paragraphs, and estimate reading and speaking time.',
    tags: ['word count', 'character count', 'letter count', 'sentence counter', 'paragraph counter', 'reading time', 'speaking time', 'text statistics', 'keyword density', 'essay length', 'assignment word count', 'chars'],
    related: ['case-converter', 'remove-duplicate-lines', 'find-replace']
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    category: 'text',
    icon: 'case',
    description: 'Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case and more.',
    tags: ['uppercase', 'lowercase', 'title case', 'sentence case', 'capitalize', 'camelcase', 'pascalcase', 'snake case', 'kebab case', 'constant case', 'caps', 'change case', 'upper', 'lower'],
    related: ['word-counter', 'find-replace', 'sort-lines']
  },
  {
    id: 'remove-duplicate-lines',
    name: 'Remove Duplicate Lines',
    category: 'text',
    icon: 'dedupe',
    description: 'Delete repeated lines from a list while keeping the original order, with a duplicate report.',
    tags: ['dedupe', 'deduplicate', 'unique lines', 'remove duplicates', 'distinct', 'duplicate finder', 'list cleaner', 'remove repeated lines', 'email list'],
    related: ['sort-lines', 'find-replace', 'word-counter']
  },
  {
    id: 'sort-lines',
    name: 'Sort Lines',
    category: 'text',
    icon: 'sort',
    description: 'Sort lines alphabetically, naturally, by length or by number — or reverse and shuffle them.',
    tags: ['alphabetize', 'alphabetical order', 'sort list', 'a-z', 'z-a', 'natural sort', 'sort by length', 'numeric sort', 'shuffle lines', 'randomize list', 'reverse lines', 'order lines'],
    related: ['remove-duplicate-lines', 'case-converter', 'find-replace']
  },
  {
    id: 'find-replace',
    name: 'Find & Replace',
    category: 'text',
    icon: 'replace',
    description: 'Find and replace text with match highlighting, whole-word matching and optional regular expressions.',
    tags: ['search and replace', 'replace all', 'regex', 'regular expression', 'substitute', 'text replace', 'bulk replace', 'highlight matches'],
    related: ['word-counter', 'case-converter', 'remove-duplicate-lines']
  },
  {
    id: 'text-diff',
    name: 'Text Diff',
    category: 'text',
    icon: 'diff',
    description: 'Compare two texts and highlight what was added, removed or changed — by line, word or character.',
    tags: ['compare text', 'diff checker', 'text comparison', 'difference', 'changes', 'compare documents', 'compare files', 'track changes', 'what changed', 'versions'],
    related: ['find-replace', 'text-cleanup', 'word-counter']
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Editor & Preview',
    category: 'text',
    icon: 'markdown',
    description: 'Write Markdown with a live preview, then copy the HTML or download an HTML or .md file.',
    tags: ['markdown to html', 'md editor', 'markdown viewer', 'readme', 'gfm', 'github markdown', 'notes', 'formatting', 'md to html', 'live preview'],
    related: ['text-html', 'word-counter', 'text-cleanup']
  },
  {
    id: 'text-cleanup',
    name: 'Text Cleanup',
    category: 'text',
    icon: 'wand',
    description: 'Remove extra spaces, empty lines, broken line breaks and invisible characters in one step.',
    tags: ['remove extra spaces', 'remove empty lines', 'remove line breaks', 'remove blank lines', 'fix pdf text', 'trim whitespace', 'invisible characters', 'zero width space', 'non-breaking space', 'curly quotes', 'normalize', 'tidy text'],
    related: ['remove-duplicate-lines', 'find-replace', 'text-diff']
  },
  {
    id: 'prefix-suffix',
    name: 'Add Prefix & Suffix',
    category: 'text',
    icon: 'brackets',
    description: 'Add or remove text at the start and end of every line — for quotes, bullets, HTML tags or SQL lists.',
    tags: ['add text to each line', 'prepend', 'append', 'wrap lines', 'quote each line', 'sql in list', 'bullet list', 'line prefix', 'line suffix', 'surround text'],
    related: ['line-numbers', 'sort-lines', 'find-replace']
  },
  {
    id: 'line-numbers',
    name: 'Line Numbers',
    category: 'text',
    icon: 'listOrdered',
    description: 'Number every line with your choice of start, step, format and padding — or remove existing numbers.',
    tags: ['number lines', 'add line numbers', 'remove line numbers', 'numbered list', 'line numbering', 'enumerate', 'code line numbers'],
    related: ['prefix-suffix', 'sort-lines', 'remove-duplicate-lines']
  },
  {
    id: 'slug-generator',
    name: 'Slug Generator',
    category: 'text',
    icon: 'link',
    description: 'Turn titles into clean, URL-friendly slugs, one per line, with accent and length handling.',
    tags: ['url slug', 'permalink', 'seo url', 'slugify', 'friendly url', 'kebab case url', 'blog post url', 'filename'],
    related: ['case-converter', 'url-encoder', 'text-cleanup']
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    category: 'text',
    icon: 'pilcrow',
    description: 'Generate placeholder paragraphs, sentences or words as plain text or HTML.',
    tags: ['placeholder text', 'dummy text', 'filler text', 'lipsum', 'sample text', 'mockup text', 'design placeholder'],
    related: ['word-counter', 'markdown-preview', 'text-html']
  },
  {
    id: 'text-html',
    name: 'Text ↔ HTML Converter',
    category: 'text',
    icon: 'textHtml',
    description: 'Turn plain text into HTML paragraphs, or extract clean, readable text from HTML.',
    tags: ['text to html', 'html to text', 'strip html', 'remove html tags', 'html escape', 'html entities', 'escape html', 'plain text', 'extract text from html', 'html cleaner'],
    related: ['markdown-preview', 'url-encoder', 'text-cleanup']
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder & Decoder',
    category: 'developer',
    icon: 'percent',
    description: 'Percent-encode text for URLs and query strings, or decode encoded links back to readable text.',
    tags: ['url encode', 'url decode', 'percent encoding', 'encodeuricomponent', 'query string', 'urlencode', 'urldecode', 'escape url', '%20'],
    related: ['text-html', 'slug-generator', 'find-replace']
  },
  {
    id: 'scientific-calculator',
    name: 'Scientific Calculator',
    category: 'math',
    icon: 'calculator',
    description: 'A full scientific calculator with trigonometry, logs, powers, factorials, history and keyboard input.',
    tags: ['calculator', 'basic calculator', 'scientific', 'trigonometry', 'sin cos tan', 'logarithm', 'square root', 'exponent', 'power', 'ncr', 'npr', 'combinations', 'maths'],
    related: ['percentage-calculator', 'fraction-calculator', 'unit-converter']
  },
  {
    id: 'percentage-calculator',
    name: 'Percentage Calculator',
    category: 'math',
    icon: 'percent',
    description: 'Percent of a number, percentage change and difference, increases, discounts and reverse percentages.',
    tags: ['percent', 'percentage change', 'percentage difference', 'percent increase', 'percent decrease', 'discount', 'markup', 'reverse percentage', 'gst inclusive', 'marks percentage'],
    related: ['scientific-calculator', 'ratio-calculator', 'statistics-calculator']
  },
  {
    id: 'fraction-calculator',
    name: 'Fraction Calculator',
    category: 'math',
    icon: 'divide',
    description: 'Add, subtract, multiply and divide fractions and mixed numbers, simplify them and convert decimals to fractions.',
    tags: ['fractions', 'mixed numbers', 'simplify fraction', 'reduce fraction', 'decimal to fraction', 'fraction to decimal', 'repeating decimal', 'lowest terms'],
    related: ['ratio-calculator', 'percentage-calculator', 'scientific-calculator']
  },
  {
    id: 'ratio-calculator',
    name: 'Ratio & Proportion Calculator',
    category: 'math',
    icon: 'ratio',
    description: 'Simplify ratios, solve proportions such as a:b = c:x, and divide an amount in a given ratio.',
    tags: ['ratio', 'proportion', 'simplify ratio', 'aspect ratio', 'scale', 'split amount', 'divide in ratio', 'cross multiplication', 'rule of three'],
    related: ['fraction-calculator', 'percentage-calculator', 'gcd-lcm-calculator']
  },
  {
    id: 'statistics-calculator',
    name: 'Statistics Calculator',
    category: 'math',
    icon: 'chart',
    description: 'Mean, median, mode, standard deviation, variance, quartiles and more for a list of numbers.',
    tags: ['mean', 'median', 'mode', 'average', 'standard deviation', 'variance', 'quartiles', 'range', 'descriptive statistics', 'iqr', 'geometric mean'],
    related: ['percentage-calculator', 'random-number-generator', 'scientific-calculator']
  },
  {
    id: 'prime-checker',
    name: 'Prime Number Checker',
    category: 'math',
    icon: 'prime',
    description: 'Check whether a number is prime, see its prime factors, and list the primes in a range.',
    tags: ['prime', 'is it prime', 'prime factorization', 'factors', 'divisors', 'next prime', 'list of primes', 'sieve', 'composite'],
    related: ['gcd-lcm-calculator', 'factorial-calculator', 'number-base-converter']
  },
  {
    id: 'gcd-lcm-calculator',
    name: 'GCD & LCM Calculator',
    category: 'math',
    icon: 'venn',
    description: 'Find the greatest common divisor (HCF) and least common multiple of two or more numbers, with steps.',
    tags: ['gcd', 'hcf', 'gcf', 'lcm', 'greatest common divisor', 'highest common factor', 'least common multiple', 'euclidean algorithm', 'common factor'],
    related: ['prime-checker', 'fraction-calculator', 'ratio-calculator']
  },
  {
    id: 'factorial-calculator',
    name: 'Factorial Calculator',
    category: 'math',
    icon: 'factorial',
    description: 'Exact factorials up to 10,000! with digit counts, trailing zeros and scientific notation.',
    tags: ['factorial', 'n!', 'permutations', 'big numbers', 'trailing zeros', 'exact value'],
    related: ['scientific-calculator', 'prime-checker', 'gcd-lcm-calculator']
  },
  {
    id: 'random-number-generator',
    name: 'Random Number Generator',
    category: 'math',
    icon: 'dice',
    description: 'Fair random whole numbers or decimals in any range, with no-repeat and sort options.',
    tags: ['random number', 'rng', 'random picker', 'dice roller', 'lottery numbers', 'random integer', 'number generator', 'pick a number'],
    related: ['uuid-generator', 'statistics-calculator', 'sort-lines']
  },
  {
    id: 'number-base-converter',
    name: 'Number Base Converter',
    category: 'math',
    icon: 'binary',
    description: 'Convert between binary, octal, decimal, hexadecimal and any base from 2 to 36.',
    tags: ['binary', 'hexadecimal', 'hex', 'octal', 'decimal', 'base converter', 'binary to decimal', 'decimal to binary', 'hex to decimal', 'radix', 'twos complement'],
    related: ['roman-numeral-converter', 'base64-converter', 'color-converter']
  },
  {
    id: 'roman-numeral-converter',
    name: 'Roman Numeral Converter',
    category: 'math',
    icon: 'roman',
    description: 'Convert numbers to Roman numerals and back, with checks for correctly written numerals.',
    tags: ['roman numerals', 'roman numbers', 'mcmxciv', 'convert to roman', 'roman to number', 'year in roman numerals'],
    related: ['number-base-converter', 'scientific-calculator', 'case-converter']
  },
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    category: 'math',
    icon: 'ruler',
    description: 'Convert length, weight, temperature, area, volume, speed, time, data, pressure and energy units.',
    tags: ['length converter', 'weight converter', 'temperature converter', 'area converter', 'volume converter', 'speed converter', 'time converter', 'data storage', 'pressure converter', 'energy converter', 'cm to inches', 'kg to lbs', 'celsius to fahrenheit', 'mb to gb', 'km to miles', 'acres'],
    related: ['percentage-calculator', 'scientific-calculator', 'timestamp-converter']
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter & Validator',
    category: 'developer',
    icon: 'braces',
    description: 'Format, minify and validate JSON with exact error locations — without changing large numbers.',
    tags: ['json', 'json formatter', 'json validator', 'json beautifier', 'pretty print', 'minify json', 'json lint', 'json viewer', 'sort json keys'],
    related: ['base64-converter', 'jwt-decoder', 'text-diff']
  },
  {
    id: 'base64-converter',
    name: 'Base64 Encoder & Decoder',
    category: 'developer',
    icon: 'encode',
    description: 'Encode text or files to Base64 and decode Base64 back to text, images or files.',
    tags: ['base64', 'base64 encode', 'base64 decode', 'data uri', 'base64url', 'image to base64', 'file to base64', 'base64 to image', 'atob', 'btoa'],
    related: ['hash-generator', 'url-encoder', 'jwt-decoder']
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    category: 'developer',
    icon: 'idcard',
    description: 'Generate random (v4) or time-ordered (v7) UUIDs in bulk, and inspect any UUID.',
    tags: ['uuid', 'guid', 'uuid v4', 'uuid v7', 'unique id', 'random id', 'generate uuid', 'bulk uuid'],
    related: ['random-number-generator', 'hash-generator', 'timestamp-converter']
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    category: 'developer',
    icon: 'hash',
    description: 'MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes and HMACs for text or files, with checksum comparison.',
    tags: ['hash', 'md5', 'sha1', 'sha256', 'sha-256', 'sha512', 'checksum', 'hmac', 'file hash', 'verify download', 'text hashing', 'file hashing', 'digest'],
    related: ['base64-converter', 'uuid-generator', 'jwt-decoder']
  },
  {
    id: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    category: 'developer',
    icon: 'clock',
    description: 'Convert Unix timestamps to dates and dates to timestamps in any time zone.',
    tags: ['unix timestamp', 'epoch', 'epoch converter', 'timestamp to date', 'date to timestamp', 'iso 8601', 'utc', 'time zone', 'milliseconds', 'posix time'],
    related: ['uuid-generator', 'jwt-decoder', 'unit-converter']
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    category: 'developer',
    icon: 'key',
    description: 'Read the header and payload of a JSON Web Token, with readable dates and expiry status.',
    tags: ['jwt', 'json web token', 'jwt decoder', 'decode jwt', 'bearer token', 'jwt claims', 'jwt expiry', 'oauth', 'id token'],
    related: ['base64-converter', 'json-formatter', 'timestamp-converter']
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    category: 'developer',
    icon: 'regex',
    description: 'Test regular expressions with live highlighting, capture groups, flags and replacement preview.',
    tags: ['regex', 'regular expression', 'regex tester', 'regexp', 'pattern matching', 'capture groups', 'named groups', 'regex replace', 'validate email regex'],
    related: ['find-replace', 'text-cleanup', 'json-formatter']
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    category: 'design',
    icon: 'droplet',
    description: 'Convert colours between HEX, RGB, HSL, HWB, OKLCH, HSV and CMYK, with a picker and contrast check.',
    tags: ['color converter', 'colour converter', 'hex to rgb', 'rgb to hex', 'hsl', 'oklch', 'cmyk', 'color picker', 'css colors', 'contrast', 'wcag', 'named colors'],
    related: ['number-base-converter', 'hash-generator', 'unit-converter']
  }
];

/**
 * Roadmap items per category. These are NOT implemented yet and are shown
 * only with a clear "Planned" label. Features already covered by a ready
 * tool (for example "Character counter" in the Word & Character Counter)
 * are listed in that tool's tags instead.
 */
const roadmap = {
  text: ['Reverse text', 'Text templates', 'Text to speech', 'Speech to text', 'Basic spelling check'],
  image: ['Image compressor', 'Image resizer', 'Image cropper', 'Rotate & flip image', 'Image format converter', 'Image filters', 'Watermark image', 'Image dimension inspector', 'Image to Base64', 'Base64 to image', 'Favicon generator', 'Thumbnail creator', 'Social image resizer', 'Color palette extractor', 'Image comparison'],
  pdf: ['Merge PDF', 'Split PDF', 'Reorder PDF pages', 'Rotate PDF pages', 'Extract PDF pages', 'PDF metadata viewer', 'Images to PDF', 'PDF to images', 'Add page numbers', 'PDF text watermark', 'PDF compression', 'Text to PDF', 'Document text counter'],
  student: ['Marks & percentage calculator', 'Grade calculator', 'GPA calculator', 'CGPA calculator', 'Flashcards', 'Quiz creator', 'Revision planner', 'Timetable creator', 'Exam countdown', 'Pomodoro timer', 'Citation formatter', 'Math practice', 'Study progress tracker'],
  math: [],
  developer: ['XML formatter', 'HTML entity encoder', 'Cron expression helper', 'HTML preview sandbox', 'JavaScript formatter', 'SQL formatter', 'QR code generator', 'Test data generator', 'Character encoding inspector'],
  design: ['Gradient generator', 'Palette generator', 'Contrast checker', 'Box-shadow generator', 'Border-radius preview', 'CSS button generator', 'Typography preview', 'SVG viewer'],
  security: ['Password generator', 'Passphrase generator', 'Password strength estimator', 'Text encryption (AES-GCM)', 'Random token generator', 'File metadata inspector'],
  social: ['Caption formatter', 'Hashtag organizer', 'Bio formatter', 'Unicode text styler', 'Username ideas', 'YouTube description formatter', 'Social image size guide', 'Content calendar', 'Content checklist'],
  finance: ['GST calculator', 'Discount calculator', 'Profit margin & markup', 'Simple & compound interest', 'Loan EMI calculator', 'Budget planner', 'Expense tracker', 'Break-even calculator', 'Sales tax calculator', 'Invoice generator', 'Quotation generator', 'Manual-rate currency converter'],
  productivity: ['To-do list', 'Notes', 'Stopwatch', 'Countdown timer', 'Habit tracker', 'Daily & weekly planner', 'Goal tracker', 'Meeting agenda builder', 'Checklist builder', 'Reading list', 'Bookmark organizer', 'Text snippets'],
  datetime: ['Age calculator', 'Date difference', 'Add or subtract days', 'Leap year checker', 'Working days calculator', 'Time zone converter', 'Calendar generator', 'Date formatter', 'Day of week finder'],
  network: ['URL parser', 'Domain validator', 'IPv4 & IPv6 validator', 'CIDR subnet calculator', 'IP to binary', 'User-agent inspector', 'Browser info', 'HTTP status codes', 'MIME types', 'Common ports', 'DNS record guide', 'Query string parser'],
  data: ['CSV viewer', 'CSV ↔ JSON', 'TSV to CSV', 'Text file viewer', 'Text ↔ hex', 'Data URI inspector', 'File size calculator'],
  media: ['Audio player & inspector', 'Audio trimmer', 'Volume adjuster', 'Audio to WAV', 'Video player & inspector', 'Video frame capture']
};

export function slugify(input) {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const tools = readyTools.map((t) => ({
  ...t,
  status: 'ready',
  route: `tools/${t.id}/`
}));

export const plannedTools = Object.entries(roadmap).flatMap(([category, names]) =>
  names.map((name) => ({ id: `planned-${category}-${slugify(name)}`, name, category, status: 'planned' }))
);

const toolMap = new Map(tools.map((t) => [t.id, t]));
const categoryMap = new Map(categories.map((c) => [c.id, c]));

export const getTool = (id) => toolMap.get(id);
export const getCategory = (id) => categoryMap.get(id);
export const toolsInCategory = (id) => tools.filter((t) => t.category === id);
export const plannedInCategory = (id) => plannedTools.filter((t) => t.category === id);

/** Editorial recommendations — clearly labelled as such in the UI. */
export const editorsPicks = ['word-counter', 'unit-converter', 'json-formatter', 'markdown-preview'];

export function relatedTools(id, limit = 4) {
  const tool = getTool(id);
  if (!tool) return [];
  const picked = (tool.related || []).map(getTool).filter(Boolean);
  for (const t of toolsInCategory(tool.category)) {
    if (picked.length >= limit) break;
    if (t.id !== id && !picked.includes(t)) picked.push(t);
  }
  return picked.slice(0, limit);
}
