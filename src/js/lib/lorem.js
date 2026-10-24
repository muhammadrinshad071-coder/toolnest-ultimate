/**
 * Lorem ipsum placeholder text. Randomness is only for variety, so
 * Math.random is fine; tests pass a seeded generator.
 */

const OPENING = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];

const VOCABULARY = ('a ac accumsan aenean aliquam aliquet ante arcu at auctor augue bibendum blandit commodo condimentum congue consequat convallis cras curabitur cursus dapibus diam dictum dignissim donec dui duis egestas eget eleifend elementum enim erat eros est et etiam eu euismod facilisis fames faucibus felis fermentum feugiat finibus fringilla fusce gravida habitant hendrerit iaculis id imperdiet in integer interdum ipsum justo lacinia lacus laoreet lectus leo libero ligula lobortis luctus maecenas magna malesuada massa mattis mauris maximus metus mi molestie mollis morbi nam nec neque nibh nisi nisl non nulla nullam nunc odio orci ornare pellentesque pharetra phasellus placerat porta porttitor posuere praesent pretium proin pulvinar purus quam quis quisque rhoncus risus rutrum sagittis sapien scelerisque sed sem semper sodales sollicitudin suscipit suspendisse tellus tempor tempus tincidunt tortor tristique turpis ullamcorper ultrices ultricies urna ut varius vehicula vel velit venenatis vestibulum vitae vivamus viverra volutpat vulputate').split(' ');

export const LOREM_LIMITS = { paragraphs: 100, sentences: 500, words: 5000 };

const between = (random, min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (random) => VOCABULARY[Math.floor(random() * VOCABULARY.length)];
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function sentence(random, opening = false) {
  const length = between(random, 7, 15);
  const words = opening ? [...OPENING] : [];
  while (words.length < length) words.push(pick(random));
  // An occasional comma makes the text look more natural.
  if (opening) words[4] = 'amet,';
  else if (length > 9 && random() < 0.6) words[between(random, 3, length - 4)] += ',';
  return `${capitalize(words.join(' '))}.`;
}

/**
 * @param {{unit: 'paragraphs'|'sentences'|'words', count: number, startWithLorem?: boolean, format?: 'text'|'html', random?: () => number}} options
 */
export function generateLorem({ unit = 'paragraphs', count = 3, startWithLorem = true, format = 'text', random = Math.random } = {}) {
  const limit = LOREM_LIMITS[unit];
  if (!limit) throw new Error(`Unknown unit: ${unit}`);
  if (!Number.isInteger(count) || count < 1 || count > limit) {
    throw new RangeError(`Choose a whole number of ${unit} from 1 to ${limit}.`);
  }

  let paragraphs;
  if (unit === 'words') {
    const words = startWithLorem ? OPENING.slice(0, count) : [];
    while (words.length < count) words.push(pick(random));
    paragraphs = [`${capitalize(words.join(' '))}.`];
  } else if (unit === 'sentences') {
    const sentences = Array.from({ length: count }, (_, i) => sentence(random, startWithLorem && i === 0));
    paragraphs = [sentences.join(' ')];
  } else {
    paragraphs = Array.from({ length: count }, (_, p) => {
      const n = between(random, 4, 7);
      return Array.from({ length: n }, (_, i) => sentence(random, startWithLorem && p === 0 && i === 0)).join(' ');
    });
  }
  return format === 'html' ? paragraphs.map((p) => `<p>${p}</p>`).join('\n') : paragraphs.join('\n\n');
}
