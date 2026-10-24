/**
 * Long-form help text for each tool: SEO description, how-to steps,
 * explanation, limitations and privacy note. Used only by the build script
 * to write each tool page, so browsers never download it as JavaScript.
 */

export const DEFAULT_PRIVACY = 'Your text is processed entirely in this browser tab. Nothing is uploaded, logged or saved by this tool.';

export const toolDocs = {
  'word-counter': {
    seoDescription: 'Free word counter that also counts characters, sentences, paragraphs, bytes and reading time. Runs privately in your browser with no sign-up.',
    instructions: ['Type or paste your text into the input box.', 'Statistics update instantly as you type.', 'Optionally set a word goal to track progress, or change the reading speed.', 'Use “Copy summary” or “Download” to keep a record of the statistics.'],
    about: 'Words are runs of letters or digits; apostrophes and hyphens inside a word (don’t, well-known) keep it as one word. Chinese and Japanese characters count as one word each. Characters are counted as visible symbols (an emoji counts as one). Sentences end at . ! ? or a line break, with common abbreviations such as “e.g.” and “Dr.” ignored. Paragraphs are non-empty lines. Reading time assumes 238 words per minute and speaking time 130 words per minute, which are typical adult averages — your own speed may differ.',
    limitations: ['Sentence detection uses simple rules and can miscount unusual abbreviations or decimal-heavy text.', 'Very large inputs (several megabytes) may update more slowly on low-end devices.']
  },
  'case-converter': {
    seoDescription: 'Convert text between uppercase, lowercase, title case, sentence case, camelCase, PascalCase, snake_case and kebab-case. Free and private.',
    instructions: ['Paste or type text into the input box.', 'Choose a case style — the result appears immediately.', 'Keep “Preserve acronyms” on to leave words like NASA or iPhone untouched in Title and Sentence case.', 'Copy or download the converted text.'],
    about: 'Title Case follows a common headline style: small words such as “a”, “and”, “of” and “the” stay lowercase unless they are the first or last word or follow a colon. Sentence case lowercases text and capitalises the first letter of each sentence and line, and the pronoun “I”. Programming cases (camelCase, snake_case and so on) are applied line by line so you can convert lists of names at once.',
    limitations: ['Proper nouns are not detected automatically in Sentence case — “london” stays lowercase unless it was an acronym.', 'Title Case rules vary between style guides (APA, Chicago, AP); this tool uses a general headline style.']
  },
  'remove-duplicate-lines': {
    seoDescription: 'Remove duplicate lines from text or lists, keeping the first or last occurrence. Ignore case or whitespace and see which lines repeated. Runs in your browser.',
    instructions: ['Paste a list with one item per line.', 'Pick options such as ignoring letter case or surrounding spaces.', 'The cleaned list appears on the right with a count of removed lines.', 'Open the duplicate report to see which lines repeated and how often.'],
    about: 'Lines are compared exactly unless you ask the tool to ignore case or leading and trailing spaces. The original order is kept; you can choose whether the first or the last copy of each line survives. Empty lines can be removed at the same time.',
    limitations: ['Line endings are normalised to a single line feed (\\n) in the output.']
  },
  'sort-lines': {
    seoDescription: 'Sort lines of text A to Z, Z to A, in natural number order, by length or numeric value, or shuffle them randomly. Free, private, no sign-up.',
    instructions: ['Paste text with one item per line.', 'Choose a sort order such as A → Z or Natural.', 'Optionally ignore case, trim spaces, drop empty lines or remove duplicates.', 'Copy or download the sorted result.'],
    about: 'Alphabetical sorting uses your browser’s language-aware collation, so accented letters sort sensibly. Natural order treats digits as numbers (“item 2” before “item 10”). Numeric order sorts by the first number found in each line; lines without a number go last. Shuffle uses the browser’s cryptographic random number generator for an unbiased order.',
    limitations: ['Collation can differ slightly between browsers and languages.']
  },
  'find-replace': {
    seoDescription: 'Find and replace text online with live match highlighting, case-sensitive and whole-word options, and regular expression support. Private and free.',
    instructions: ['Paste your text and type what to find.', 'Matches are highlighted and counted as you type.', 'Enter the replacement and choose options such as Match case or Whole words.', 'Turn on “Regular expression” for patterns; use $1, $2 for captured groups and \\n for a new line.', 'Copy or download the result, or move it back to the input for another pass.'],
    about: 'In normal mode your search text is matched literally, so symbols such as . or * have no special meaning. In regular-expression mode the JavaScript regex syntax is used. Searches run in a background worker with a time limit, so a pattern that would take too long is stopped instead of freezing the page.',
    limitations: ['Regular expressions use JavaScript syntax, which differs slightly from PCRE, Python or .NET.', 'The highlighted preview shows the first 2,000 matches; the replacement always applies to all matches.']
  },
  'text-diff': {
    seoDescription: 'Compare two versions of a text and see added and removed lines, words or characters highlighted. Free online diff checker that runs privately in your browser.',
    instructions: ['Paste the original text on the left and the changed text on the right.', 'Choose whether to compare by lines, words or characters.', 'Added parts are shown in green and removed parts in red; turn on “Hide unchanged lines” to focus on the changes.', 'Copy or download the differences as a plain-text diff.'],
    about: 'The comparison uses the Myers difference algorithm, the same approach used by Git, to find the smallest set of additions and removals. It runs in a background worker, so long texts don’t freeze the page. “Lines” suits code and lists, “Words” suits edited prose, and “Characters” shows spelling-level changes.',
    limitations: ['When two long texts have thousands of separate differences, the changed region is shown as a single block to stay fast.', 'Character mode accepts up to 20,000 characters per side.', 'Moved paragraphs appear as one removal and one addition; the tool does not detect moves.']
  },
  'markdown-preview': {
    seoDescription: 'Free online Markdown editor with live preview. Supports tables, task lists and code blocks, and exports clean HTML. Runs privately in your browser.',
    instructions: ['Type or paste Markdown on the left; the formatted preview updates as you type.', 'Use “Cheat sheet” for a quick reference of the supported syntax.', 'Copy the generated HTML, or download a complete .html page or the .md source.', 'Turn on “Save my draft in this browser” if you want to continue later on this device.'],
    about: 'Supports headings, bold, italic, strikethrough, inline code, fenced code blocks, block quotes, nested lists, task lists, tables, links, images and horizontal rules (a common subset of CommonMark and GitHub-Flavoured Markdown). For safety, raw HTML is shown as text, and only web, email and relative links are allowed.',
    limitations: ['Raw HTML, footnotes, reference-style links and indented (4-space) code blocks are not supported yet.', 'Images are not loaded in the preview, so nothing is fetched from other sites; they work in the downloaded HTML.', 'There is no syntax highlighting inside code blocks.'],
    privacy: 'Your text is processed entirely in this browser tab. It is saved only if you turn on draft saving, and then only in this browser; turning it off deletes the draft.'
  },
  'text-cleanup': {
    seoDescription: 'Clean up messy text: remove extra spaces, empty lines and invisible characters, fix line breaks from PDFs and straighten quotes. Free and private.',
    instructions: ['Paste the text you want to tidy.', 'Tick the clean-up steps you need — sensible ones are on by default.', 'Use “Join broken lines” for text copied from PDFs, where every line ends early.', 'Copy or download the cleaned text.'],
    about: 'Each step is a simple, predictable rule. Invisible characters such as zero-width spaces, byte-order marks and soft hyphens often sneak in from web pages and documents and break searches or passwords; this tool removes them and tells you how many it found. Unicode normalization makes letters such as “é” typed in different ways identical.',
    limitations: ['“Join broken lines” treats a blank line as a paragraph break, so headings without a blank line after them are joined to the next line.']
  },
  'prefix-suffix': {
    seoDescription: 'Add a prefix and suffix to every line of text, or remove them. Wrap lines in quotes, tags or bullets for SQL, HTML and Markdown. Free and private.',
    instructions: ['Paste a list with one item per line.', 'Type the prefix (added to the start) and/or suffix (added to the end).', 'Choose “Remove from each line” to strip a prefix or suffix instead.', 'Copy or download the result.'],
    about: 'The prefix and suffix are added exactly as typed. Turn on “Understand \\t and \\n” to insert tabs or line breaks. Empty lines are skipped by default so blank separators stay blank.',
    limitations: ['Removal only strips text that matches exactly at the very start or end of a line.']
  },
  'line-numbers': {
    seoDescription: 'Add line numbers to text with a custom start, step, separator and padding, or remove existing line numbers. Free online tool that runs in your browser.',
    instructions: ['Paste the text to number.', 'Set the starting number, the step, the format (such as “1.” or “1)”) and optional padding.', 'Switch to “Remove line numbers” to strip numbering from a list.', 'Copy or download the result.'],
    about: 'Padding keeps numbers aligned: zeros give 01, 02 … 10, and spaces right-align the numbers, which suits code. Removal recognises formats such as “1.”, “2)”, “(3)”, “4:”, “5 |” and a number followed by a tab.',
    limitations: ['Removal needs punctuation or a tab after the number, so lines such as “2024 was a good year” are left alone — but so is “1 item”.']
  },
  'slug-generator': {
    seoDescription: 'Convert titles into SEO-friendly URL slugs. Handles accents, symbols, separators, maximum length and non-Latin scripts. Free and private.',
    instructions: ['Type a title, or paste several titles — one per line.', 'Choose the separator and whether to lowercase or drop common words.', 'Set a maximum length if your website needs one; slugs are cut at a word boundary.', 'Copy or download the slugs.'],
    about: 'Accented letters are converted to plain ones (é → e, ß → ss), “&” becomes “and”, and apostrophes are removed so “don’t” becomes “dont”. Scripts such as Devanagari or Cyrillic can be kept as they are, since modern browsers and search engines support them in URLs.',
    limitations: ['Non-Latin scripts are not transliterated to English letters — they are either kept or removed.']
  },
  'lorem-ipsum': {
    seoDescription: 'Generate lorem ipsum placeholder text by paragraphs, sentences or words, as plain text or HTML. Free dummy text generator for designs and mock-ups.',
    instructions: ['Choose how many paragraphs, sentences or words you need.', 'Pick plain text or HTML paragraphs.', 'Press “Generate again” for a different variation.', 'Copy or download the text.'],
    about: 'The text is assembled from the traditional Latin-like lorem ipsum vocabulary with varied sentence and paragraph lengths, so layouts look realistic. It is not real Latin and has no meaning, which keeps attention on the design.',
    limitations: ['Up to 100 paragraphs, 500 sentences or 5,000 words at a time.'],
    privacy: 'Text is generated entirely in this browser tab. Nothing is uploaded or saved.'
  },
  'text-html': {
    seoDescription: 'Convert plain text to HTML paragraphs and line breaks, escape special characters, or strip HTML tags to get clean readable text. Free and private.',
    instructions: ['Choose a direction: Text → HTML or HTML → Text.', 'Paste your input; the result updates instantly.', 'For Text → HTML, choose full paragraphs or escaping only, and open the preview to check the result.', 'For HTML → Text, choose whether to keep link addresses, list bullets and image descriptions.'],
    about: 'Text → HTML escapes characters such as < and & so they display correctly, wraps paragraphs in <p> and turns single line breaks into <br>. HTML → Text works on the HTML as text — it is never loaded as a web page, so scripts and tracking code in it can’t run. Scripts, styles and comments are removed, block elements become line breaks, and entities such as &amp; are decoded.',
    limitations: ['HTML → Text decodes common named entities (such as &nbsp; and &eacute;) and all numeric ones; rare named entities are left as they are.', 'Complex layouts (multi-column pages, nested tables) are flattened in reading order and may need tidying.']
  },
  'url-encoder': {
    seoDescription: 'Encode or decode URLs and query strings online. Supports component, full-URL and form encoding, and handles malformed input safely. Free and private.',
    instructions: ['Choose Encode or Decode.', 'Pick the encoding style: Component for query values, Full URL to keep the address structure, or Form data for spaces as +.', 'Paste your text; the result updates instantly.', 'Copy or download the result.'],
    about: 'Encoding uses the browser’s standard functions (encodeURIComponent, encodeURI and URLSearchParams), so the result matches what web servers expect. Decoding is forgiving: if part of the input is malformed, such as a lone “%”, that part is left unchanged and the rest is still decoded.',
    limitations: ['Full-URL mode does not encode characters that have a meaning in URLs (: / ? # & =). Use Component mode for values inside a URL.']
  },
  'scientific-calculator': {
    seoDescription: 'Free online scientific calculator with sin, cos, tan, logs, powers, roots, factorials and nCr. Type or tap, with history. Runs in your browser.',
    instructions: ['Type a calculation such as 2(3+4)^2 or sin(30), or use the keypad.', 'Press Enter or = to calculate; the answer is kept as “ans” for the next step.', 'Switch between degrees and radians for trigonometry.', 'Select a past calculation in the history to reuse it.'],
    about: 'Expressions are read by a purpose-built parser that follows the usual order of operations (brackets, powers, multiplication and division, then addition and subtraction), so typed text is never run as code. Powers are right-associative (2^3^2 = 2^9) and −2^2 = −4, matching mathematical convention. Results are rounded to 12 significant digits to hide floating-point noise, so 0.1 + 0.2 shows 0.3.',
    limitations: ['Uses double-precision numbers: about 15–16 significant digits, and factorials only up to 170! (use the Factorial Calculator for exact large values).', 'Complex numbers are not supported, so roots of negative numbers are reported as errors.', 'History is kept only until you leave the page.']
  },
  'percentage-calculator': {
    seoDescription: 'Calculate percentages online: X% of Y, what percent, percentage increase or decrease, percentage difference and reverse percentages. Free and instant.',
    instructions: ['Pick the calculator that matches your question.', 'Type the numbers into the sentence — the answer updates instantly.', 'The formula used is shown under each answer.', 'Use “Copy result” to copy an answer.'],
    about: 'Percentage change compares a new value with an old one, relative to the old value: (new − old) ÷ |old| × 100. Percentage difference compares two values without picking a starting point, relative to their average. The reverse calculator finds the value before a percentage was added — for example the price before tax.',
    limitations: ['A percentage change from zero is undefined, so it is reported as an error rather than shown as infinity.']
  },
  'fraction-calculator': {
    seoDescription: 'Free fraction calculator: add, subtract, multiply and divide fractions and mixed numbers, simplify fractions and convert decimals to fractions exactly.',
    instructions: ['Type fractions like 3/4, mixed numbers like 1 1/2, or decimals.', 'Choose an operation to see the simplified result, mixed number and decimal.', 'Use “Simplify a fraction” to reduce a fraction to lowest terms.', 'Use “Decimal to fraction” to find exact and closest simple fractions.'],
    about: 'All fraction arithmetic is exact — numerators and denominators are whole numbers of any size, never rounded. Repeating decimals are shown with the repeating digits in brackets, so 1/7 = 0.(142857). The closest simple fraction uses continued fractions, the standard way to find the best approximation with a limited denominator.',
    limitations: ['Decimal expansions are shown up to 60 digits.']
  },
  'ratio-calculator': {
    seoDescription: 'Simplify ratios, solve proportions (a:b = c:x) and split an amount in any ratio. Works with decimals and three-part ratios. Free online ratio calculator.',
    instructions: ['Simplify a ratio by typing it with colons, such as 1920:1080.', 'Solve a proportion by filling in three of the four values.', 'Split an amount by entering the total and a ratio such as 2:3.'],
    about: 'Ratios with decimals are scaled to whole numbers and divided by their greatest common divisor, so 1.5:2.5 becomes 3:5. Proportions are solved by cross-multiplication: if a:b = c:x then x = b × c ÷ a.',
    limitations: ['Ratios use non-negative numbers.']
  },
  'statistics-calculator': {
    seoDescription: 'Calculate mean, median, mode, range, standard deviation, variance and quartiles from a list of numbers. Paste data from a spreadsheet. Free and private.',
    instructions: ['Paste or type numbers separated by commas, spaces or new lines — a spreadsheet column works.', 'All statistics update instantly.', 'Pick the sample or population standard deviation to suit your data.', 'Copy all results at once with “Copy all”.'],
    about: 'Sample standard deviation divides by n − 1 and is the right choice when your numbers are a sample from a larger group; population standard deviation divides by n. Sums use compensated (Kahan) summation for accuracy with long lists, and quartiles use linear interpolation like Excel’s QUARTILE.INC.',
    limitations: ['Anything that isn’t a number is skipped and listed so you can check it.']
  },
  'prime-checker': {
    seoDescription: 'Check if a number is prime, find its prime factorization and divisors, get the next and previous primes, and list primes in a range. Free online.',
    instructions: ['Type a whole number to see whether it is prime and how it factors.', 'Enter a range and press “List primes” to list every prime in it.', 'Copy or download the list of primes.'],
    about: 'Primality is checked with the deterministic Miller–Rabin test using the first twelve primes as witnesses, which gives a proven-correct answer for every number below 3.3 × 10²⁴. Factorization combines trial division with Pollard’s rho algorithm, and ranges use the sieve of Eratosthenes.',
    limitations: ['Prime checks work up to 10²⁴; factorization is shown up to 10¹⁸ so the page stays responsive.', 'Ranges can go up to 10,000,000.']
  },
  'gcd-lcm-calculator': {
    seoDescription: 'Find the GCD (HCF) and LCM of two or more whole numbers, with step-by-step Euclidean algorithm working. Handles very large numbers. Free online.',
    instructions: ['Type two or more whole numbers separated by commas or spaces.', 'The GCD and LCM appear instantly.', 'For two numbers, open the step-by-step working to see Euclid’s algorithm.'],
    about: 'The GCD is found with Euclid’s algorithm, which repeatedly replaces the larger number with the remainder of dividing it by the smaller one. The LCM is then |a × b| ÷ GCD. Whole numbers of any size are handled exactly.',
    limitations: ['Up to 100 numbers at once.']
  },
  'factorial-calculator': {
    seoDescription: 'Calculate exact factorials (n!) up to 10,000! with every digit, plus the number of digits, trailing zeros and scientific notation. Free online.',
    instructions: ['Type a whole number from 0 to 10,000.', 'See the size, digit count and trailing zeros instantly.', 'Copy or download the exact value with every digit.'],
    about: 'n! is the product of all whole numbers from 1 to n, and 0! is 1 by definition. The calculation uses arbitrary-precision integers, so every digit is exact. Trailing zeros are counted with Legendre’s formula (the number of factors of 5).',
    limitations: ['The limit is 10,000! (35,660 digits) to keep the page responsive on modest devices.']
  },
  'random-number-generator': {
    seoDescription: 'Generate fair random numbers in any range, with or without repeats, as whole numbers or decimals. Dice, lottery and PIN presets. Uses secure randomness.',
    instructions: ['Set the minimum, maximum and how many numbers you want.', 'Choose whole numbers or decimals, and whether repeats are allowed.', 'Press Generate, or try a preset such as a dice roll.', 'Copy or download the results.'],
    about: 'Numbers come from crypto.getRandomValues, the browser’s cryptographic random generator. Rejection sampling removes the small bias that the common “random % range” shortcut introduces, so every value is equally likely.',
    limitations: ['Up to 10,000 numbers at a time.', 'This is for games, sampling and decisions — not for official lotteries or regulated draws.'],
    privacy: 'Numbers are generated in this browser tab. Nothing is uploaded or saved.'
  },
  'number-base-converter': {
    seoDescription: 'Convert numbers between binary, octal, decimal, hexadecimal and any base 2–36, exactly and at any size. Shows two’s complement for negatives. Free.',
    instructions: ['Type a number and choose the base it is written in.', 'See it in binary, octal, decimal and hexadecimal instantly.', 'Pick any other base from 2 to 36 for an extra result.'],
    about: 'Conversion uses arbitrary-precision integers, so very large numbers convert exactly. For negative numbers the two’s-complement bit patterns used by computers are shown for 8, 16, 32 and 64 bits.',
    limitations: ['Whole numbers only — fractional parts are not converted.']
  },
  'roman-numeral-converter': {
    seoDescription: 'Convert numbers to Roman numerals and Roman numerals to numbers (1–3,999). Checks that numerals are written in standard form. Free and instant.',
    instructions: ['Type a number from 1 to 3,999 to see it in Roman numerals.', 'Or type a Roman numeral to see its value.', 'Copy either result with its copy button.'],
    about: 'Standard Roman numerals use subtraction for 4s and 9s (IV, IX, XL, XC, CD, CM) and never repeat a symbol more than three times. The checker rejects non-standard forms such as IIII or VX so you can trust the result.',
    limitations: ['Only the standard range 1–3,999 is supported (no vinculum notation for larger numbers).']
  },
  'unit-converter': {
    seoDescription: 'Convert units of length, weight, temperature, area, volume, speed, time, digital storage, pressure and energy using exact standard definitions. Free.',
    instructions: ['Choose what you are converting, such as length or temperature.', 'Enter a value and pick the units to convert from and to.', 'The result, the conversion factor and the value in every other unit appear instantly.', 'Use “Swap units” to convert the other way.'],
    about: 'Conversions use exact international definitions where they exist — for example 1 inch = 2.54 cm and 1 pound = 0.45359237 kg exactly. Digital storage shows both decimal units (1 GB = 1,000,000,000 bytes, used by drive makers) and binary units (1 GiB = 1,073,741,824 bytes, often used by operating systems). The page address remembers your choice, so you can bookmark a conversion.',
    limitations: ['Months and years use Gregorian averages (30.436875 and 365.2425 days).', 'US and UK gallons, pints and tons differ; both are listed separately.', 'Regional units such as bigha vary from place to place and are not included.']
  },
  'json-formatter': {
    seoDescription: 'Format, beautify, minify and validate JSON online with clear error messages, line and column numbers, key sorting and exact large numbers. Private.',
    instructions: ['Paste JSON into the input box.', 'Valid JSON is formatted instantly; problems are reported with a line, column and pointer.', 'Choose pretty or minified output, the indent, and whether to sort keys.', 'Copy or download the result.'],
    about: 'A strict parser written for this tool gives the same clear messages in every browser — for example trailing commas, single quotes and comments, which are common in JavaScript but not allowed in JSON. Numbers keep their exact original digits, so IDs like 12345678901234567890 are never rounded (JSON.parse would change them). Duplicate keys produce a warning.',
    limitations: ['Very large files (tens of megabytes) may take a moment to format on low-end devices.', 'JSON5 and JSON with comments are reported as errors, by design.']
  },
  'base64-converter': {
    seoDescription: 'Encode text and files to Base64 or decode Base64 to text, images and files. Supports UTF-8, URL-safe Base64 and data URIs. Runs privately in your browser.',
    instructions: ['Choose Encode or Decode.', 'Type text, paste Base64, or drop a file to encode it.', 'Decoded images are previewed, and any decoded file can be downloaded.', 'Copy or download the result.'],
    about: 'Text is encoded as UTF-8, so emoji and every script round-trip correctly. Decoding accepts standard and URL-safe Base64, missing padding, line breaks and data: URIs. The file type of decoded data is detected from its first bytes (for example PNG, JPEG, PDF or ZIP).',
    limitations: ['Files up to 50 MB.', 'Base64 output is about a third larger than the original data.'],
    privacy: 'Text and files are processed entirely in this browser tab. Nothing is uploaded or saved.'
  },
  'uuid-generator': {
    seoDescription: 'Generate UUID v4 and v7 (GUID) online in bulk with uppercase, hyphen and brace options, and inspect a UUID’s version and timestamp. Secure and free.',
    instructions: ['Choose version 4 (random) or version 7 (time-ordered).', 'Set how many you need and the format options.', 'Press “Generate new”, then copy or download the list.', 'Paste any UUID into the inspector to see its version, variant and embedded time.'],
    about: 'UUIDs follow RFC 9562. Version 4 uses 122 random bits from the browser’s cryptographic generator. Version 7 starts with a 48-bit millisecond timestamp, so IDs sort by creation time, which keeps database indexes efficient.',
    limitations: ['Up to 1,000 UUIDs at a time.'],
    privacy: 'UUIDs are generated in this browser tab. Nothing is uploaded or saved.'
  },
  'hash-generator': {
    seoDescription: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes and HMACs of text or files, and verify download checksums. Files never leave your device.',
    instructions: ['Choose text or a file.', 'All hashes are calculated together; pick hex, HEX or Base64 output.', 'Add a secret key to create HMAC signatures instead.', 'Paste an expected checksum to check a download — the matching hash is highlighted.'],
    about: 'SHA hashes and HMACs use the browser’s built-in Web Crypto API. MD5 is computed by this tool in JavaScript because browsers don’t provide it. Text is hashed as UTF-8, matching most command-line tools such as sha256sum when the text has no trailing newline.',
    limitations: ['Files up to 500 MB are read into memory at once.', 'MD5 and SHA-1 are broken for security purposes; use them only to compare checksums.', 'Hashes need a secure (https) page or localhost, which GitHub Pages provides.'],
    privacy: 'Text and files are hashed entirely in this browser tab and are never uploaded. HMAC keys are not saved.'
  },
  'timestamp-converter': {
    seoDescription: 'Convert Unix timestamps (seconds, milliseconds, microseconds) to readable dates in any time zone, and dates back to epoch time. Live current timestamp.',
    instructions: ['Paste a Unix timestamp or a date such as 2025-08-15 14:30.', 'Seconds, milliseconds, microseconds and nanoseconds are detected automatically — or choose the unit.', 'Pick a time zone to see the local date and offset there.', 'The live clock shows the current Unix time; press Use to convert it.'],
    about: 'Unix time counts seconds since 1 January 1970 UTC. Time-zone conversions use your browser’s built-in time-zone database, so daylight-saving changes and offsets such as India’s +05:30 or Nepal’s +05:45 are handled correctly. Dates typed without a time zone are read in your local zone.',
    limitations: ['Leap seconds are not counted, matching Unix time.', 'Very old historical dates use the modern Gregorian calendar.']
  },
  'jwt-decoder': {
    seoDescription: 'Decode a JSON Web Token (JWT) to view its header, payload and claims with readable dates and expiry status. Decodes only — does not verify signatures.',
    instructions: ['Paste a token (with or without the “Bearer ” prefix).', 'See the header, payload and each claim, with timestamps shown as dates.', 'Check the expiry status — remembering it says nothing about authenticity.'],
    about: 'A JWT’s header and payload are only Base64URL-encoded JSON, so anyone can read them. Its signature proves who issued it, but checking it requires the issuer’s secret or public key. This tool deliberately only decodes, and it never sends your token anywhere.',
    limitations: ['Signatures are not verified — never trust decoded claims on their own.', 'Encrypted tokens (JWE) cannot be read without their key.'],
    privacy: 'Tokens are decoded entirely in this browser tab and are never uploaded or saved. Still, avoid pasting live production tokens into any website you do not control.'
  },
  'regex-tester': {
    seoDescription: 'Test JavaScript regular expressions online with live match highlighting, capture and named groups, flags and replacement preview. Safe timeout for slow patterns.',
    instructions: ['Type a pattern, or paste one in /pattern/flags form.', 'Tick the flags you need; matches in the test text are highlighted as you type.', 'The match table lists each match with its position and groups.', 'Add a replacement to preview the replaced text, using $1 or $<name>.'],
    about: 'Patterns use JavaScript regular-expression syntax. Matching runs in a background worker with a two-second limit, so patterns with catastrophic backtracking are stopped instead of freezing the page.',
    limitations: ['JavaScript syntax differs slightly from PCRE, Python and .NET (for example, no possessive quantifiers).', 'The table shows the first 200 matches.']
  },
  'color-converter': {
    seoDescription: 'Convert colours between HEX, RGB, HSL, HWB, OKLCH, HSV and CMYK. Includes a colour picker, nearest CSS name and WCAG contrast check. Free.',
    instructions: ['Type a colour in any CSS format, or use the colour picker.', 'Every format updates instantly, each with a copy button.', 'Check how readable white and black text are on the colour.'],
    about: 'The tool understands HEX (3, 4, 6 and 8 digits), rgb(), hsl(), hwb(), oklch() and all 148 CSS colour names. The nearest name is found in the perceptual OKLab space. Contrast follows WCAG 2: 4.5:1 for normal text and 3:1 for large text at level AA.',
    limitations: ['CMYK values are a simple approximation; real print colours depend on the printer and paper profile.', 'Contrast for semi-transparent colours depends on the background behind them.'],
    privacy: 'Colours are converted entirely in this browser tab. Nothing is uploaded or saved.'
  }
};

/** Help text for a tool, with the default privacy note filled in. */
export function docsFor(id) {
  const docs = toolDocs[id];
  if (!docs) throw new Error(`No documentation for tool "${id}" in tool-docs.js`);
  return { privacy: DEFAULT_PRIVACY, limitations: [], ...docs };
}
