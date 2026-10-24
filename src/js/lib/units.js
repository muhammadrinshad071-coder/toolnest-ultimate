/**
 * Unit conversion tables. Each unit stores how many base units it equals,
 * using exact international definitions wherever they exist (for example
 * 1 inch = 0.0254 m exactly, 1 lb = 0.45359237 kg exactly).
 * Temperature is affine, so it uses conversion functions instead.
 */

const u = (id, name, symbol, factor, note) => ({ id, name, symbol, factor, note });

export const UNIT_CATEGORIES = [
  {
    id: 'length',
    name: 'Length',
    base: 'm',
    units: [
      u('nm', 'Nanometre', 'nm', 1e-9),
      u('um', 'Micrometre', 'µm', 1e-6),
      u('mm', 'Millimetre', 'mm', 1e-3),
      u('cm', 'Centimetre', 'cm', 1e-2),
      u('m', 'Metre', 'm', 1),
      u('km', 'Kilometre', 'km', 1e3),
      u('in', 'Inch', 'in', 0.0254),
      u('ft', 'Foot', 'ft', 0.3048),
      u('yd', 'Yard', 'yd', 0.9144),
      u('mi', 'Mile', 'mi', 1609.344),
      u('nmi', 'Nautical mile', 'nmi', 1852),
      u('ly', 'Light-year', 'ly', 9460730472580800)
    ]
  },
  {
    id: 'mass',
    name: 'Weight & mass',
    base: 'kg',
    units: [
      u('mg', 'Milligram', 'mg', 1e-6),
      u('g', 'Gram', 'g', 1e-3),
      u('kg', 'Kilogram', 'kg', 1),
      u('t', 'Tonne (metric ton)', 't', 1000),
      u('q', 'Quintal', 'q', 100),
      u('ct', 'Carat', 'ct', 0.0002),
      u('tola', 'Tola', 'tola', 0.0116638038, 'Standard tola used for gold and silver in India (11.6638038 g).'),
      u('oz', 'Ounce', 'oz', 0.028349523125),
      u('lb', 'Pound', 'lb', 0.45359237),
      u('st', 'Stone', 'st', 6.35029318),
      u('ton-us', 'US ton (short ton)', 'ton', 907.18474),
      u('ton-uk', 'UK ton (long ton)', 'LT', 1016.0469088)
    ]
  },
  {
    id: 'temperature',
    name: 'Temperature',
    base: 'K',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v + 273.15, fromBase: (k) => k - 273.15 },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9 + 273.15, fromBase: (k) => ((k - 273.15) * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v, fromBase: (k) => k },
      { id: 'r', name: 'Rankine', symbol: '°R', toBase: (v) => (v * 5) / 9, fromBase: (k) => (k * 9) / 5 }
    ]
  },
  {
    id: 'area',
    name: 'Area',
    base: 'm²',
    units: [
      u('mm2', 'Square millimetre', 'mm²', 1e-6),
      u('cm2', 'Square centimetre', 'cm²', 1e-4),
      u('m2', 'Square metre', 'm²', 1),
      u('ha', 'Hectare', 'ha', 1e4),
      u('km2', 'Square kilometre', 'km²', 1e6),
      u('in2', 'Square inch', 'in²', 0.00064516),
      u('ft2', 'Square foot', 'ft²', 0.09290304),
      u('yd2', 'Square yard', 'yd²', 0.83612736),
      u('acre', 'Acre', 'ac', 4046.8564224),
      u('mi2', 'Square mile', 'mi²', 2589988.110336)
    ]
  },
  {
    id: 'volume',
    name: 'Volume',
    base: 'm³',
    units: [
      u('ml', 'Millilitre', 'mL', 1e-6),
      u('cl', 'Centilitre', 'cL', 1e-5),
      u('l', 'Litre', 'L', 1e-3),
      u('m3', 'Cubic metre', 'm³', 1),
      u('cm3', 'Cubic centimetre', 'cm³', 1e-6),
      u('in3', 'Cubic inch', 'in³', 1.6387064e-5),
      u('ft3', 'Cubic foot', 'ft³', 0.028316846592),
      u('tsp', 'Teaspoon (US)', 'tsp', 4.92892159375e-6),
      u('tbsp', 'Tablespoon (US)', 'tbsp', 1.478676478125e-5),
      u('floz', 'Fluid ounce (US)', 'fl oz', 2.95735295625e-5),
      u('cup', 'Cup (US customary)', 'cup', 2.365882365e-4, 'US customary cup (236.6 mL). Recipe “metric cups” are 250 mL.'),
      u('pt', 'Pint (US)', 'pt', 4.73176473e-4),
      u('qt', 'Quart (US)', 'qt', 9.46352946e-4),
      u('gal', 'Gallon (US)', 'gal', 3.785411784e-3),
      u('pt-uk', 'Pint (UK)', 'UK pt', 5.6826125e-4),
      u('gal-uk', 'Gallon (UK)', 'UK gal', 4.54609e-3)
    ]
  },
  {
    id: 'speed',
    name: 'Speed',
    base: 'm/s',
    units: [
      u('mps', 'Metres per second', 'm/s', 1),
      u('kmh', 'Kilometres per hour', 'km/h', 1 / 3.6),
      u('mph', 'Miles per hour', 'mph', 0.44704),
      u('fps', 'Feet per second', 'ft/s', 0.3048),
      u('kn', 'Knot', 'kn', 1852 / 3600)
    ]
  },
  {
    id: 'time',
    name: 'Time',
    base: 's',
    units: [
      u('ns', 'Nanosecond', 'ns', 1e-9),
      u('us', 'Microsecond', 'µs', 1e-6),
      u('ms', 'Millisecond', 'ms', 1e-3),
      u('s', 'Second', 's', 1),
      u('min', 'Minute', 'min', 60),
      u('h', 'Hour', 'h', 3600),
      u('d', 'Day', 'd', 86400),
      u('wk', 'Week', 'wk', 604800),
      u('mo', 'Month (average)', 'mo', 2629746, 'Average Gregorian month: 30.436875 days.'),
      u('yr', 'Year (average)', 'yr', 31556952, 'Average Gregorian year: 365.2425 days.'),
      u('dec', 'Decade', 'dec', 315569520),
      u('cen', 'Century', 'c', 3155695200)
    ]
  },
  {
    id: 'data',
    name: 'Digital storage',
    base: 'B',
    units: [
      u('bit', 'Bit', 'bit', 0.125),
      u('B', 'Byte', 'B', 1),
      u('kB', 'Kilobyte (1000 B)', 'kB', 1e3),
      u('MB', 'Megabyte (1000² B)', 'MB', 1e6),
      u('GB', 'Gigabyte (1000³ B)', 'GB', 1e9),
      u('TB', 'Terabyte (1000⁴ B)', 'TB', 1e12),
      u('PB', 'Petabyte (1000⁵ B)', 'PB', 1e15),
      u('KiB', 'Kibibyte (1024 B)', 'KiB', 1024),
      u('MiB', 'Mebibyte (1024² B)', 'MiB', 1024 ** 2),
      u('GiB', 'Gibibyte (1024³ B)', 'GiB', 1024 ** 3),
      u('TiB', 'Tebibyte (1024⁴ B)', 'TiB', 1024 ** 4),
      u('PiB', 'Pebibyte (1024⁵ B)', 'PiB', 1024 ** 5),
      u('kbit', 'Kilobit', 'kbit', 125),
      u('Mbit', 'Megabit', 'Mbit', 125000),
      u('Gbit', 'Gigabit', 'Gbit', 1.25e8)
    ]
  },
  {
    id: 'pressure',
    name: 'Pressure',
    base: 'Pa',
    units: [
      u('pa', 'Pascal', 'Pa', 1),
      u('kpa', 'Kilopascal', 'kPa', 1e3),
      u('mpa', 'Megapascal', 'MPa', 1e6),
      u('mbar', 'Millibar', 'mbar', 100),
      u('bar', 'Bar', 'bar', 1e5),
      u('atm', 'Standard atmosphere', 'atm', 101325),
      u('psi', 'Pound per square inch', 'psi', 6894.757293168361),
      u('mmhg', 'Millimetre of mercury', 'mmHg', 133.322387415),
      u('torr', 'Torr', 'Torr', 101325 / 760),
      u('inhg', 'Inch of mercury', 'inHg', 3386.388640341)
    ]
  },
  {
    id: 'energy',
    name: 'Energy',
    base: 'J',
    units: [
      u('j', 'Joule', 'J', 1),
      u('kj', 'Kilojoule', 'kJ', 1e3),
      u('mj', 'Megajoule', 'MJ', 1e6),
      u('cal', 'Calorie (thermochemical)', 'cal', 4.184),
      u('kcal', 'Kilocalorie (food Calorie)', 'kcal', 4184),
      u('wh', 'Watt-hour', 'Wh', 3600),
      u('kwh', 'Kilowatt-hour (electricity unit)', 'kWh', 3.6e6),
      u('ev', 'Electronvolt', 'eV', 1.602176634e-19),
      u('btu', 'British thermal unit (IT)', 'BTU', 1055.05585262),
      u('ftlbf', 'Foot-pound force', 'ft·lbf', 1.3558179483314004),
      u('erg', 'Erg', 'erg', 1e-7)
    ]
  }
];

const categoryMap = new Map(UNIT_CATEGORIES.map((c) => [c.id, c]));

export const getUnitCategory = (id) => categoryMap.get(id);

export function getUnit(categoryId, unitId) {
  const unit = getUnitCategory(categoryId)?.units.find((x) => x.id === unitId);
  if (!unit) throw new Error(`Unknown unit ${categoryId}/${unitId}`);
  return unit;
}

const ABSOLUTE_ZERO_K = 0;

/** Convert a value between two units of the same category. */
export function convertUnit(value, categoryId, fromId, toId) {
  const from = getUnit(categoryId, fromId);
  const to = getUnit(categoryId, toId);
  if (!Number.isFinite(value)) throw new RangeError('Enter a number.');
  if (from.toBase) {
    const kelvin = from.toBase(value);
    if (kelvin < ABSOLUTE_ZERO_K - 1e-9) throw new RangeError('That is below absolute zero (−273.15 °C), the lowest possible temperature.');
    return to.fromBase(kelvin);
  }
  if (from.id === to.id) return value;
  return (value * from.factor) / to.factor;
}

/** "1 ft = 0.3048 m" style explanation for linear units. */
export function conversionFactor(categoryId, fromId, toId) {
  const from = getUnit(categoryId, fromId);
  const to = getUnit(categoryId, toId);
  if (from.toBase) return null;
  return from.factor / to.factor;
}
