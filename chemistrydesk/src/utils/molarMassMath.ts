/**
 * src/utils/molarMassMath.ts
 * Pure chemical formula tokenizer, recursive bracket evaluator,
 * and IUPAC CIAAW standard atomic weight database.
 * Decoupled from UI components for testability and zero-dependency execution.
 */

export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  weight: number;
  category: string;
  colorHex: string;
}

// Complete IUPAC CIAAW Standard Atomic Weights (Elements 1-118)
export const PERIODIC_ELEMENTS: Record<string, ElementData> = {
  H:   { number: 1,   symbol: 'H',   name: 'Hydrogen',     weight: 1.008,     category: 'nonmetal',         colorHex: '#38bdf8' },
  He:  { number: 2,   symbol: 'He',  name: 'Helium',       weight: 4.0026,    category: 'noble_gas',        colorHex: '#c084fc' },
  Li:  { number: 3,   symbol: 'Li',  name: 'Lithium',      weight: 6.94,      category: 'alkali_metal',     colorHex: '#f87171' },
  Be:  { number: 4,   symbol: 'Be',  name: 'Beryllium',    weight: 9.0122,    category: 'alkaline_earth',   colorHex: '#fb923c' },
  B:   { number: 5,   symbol: 'B',   name: 'Boron',        weight: 10.81,     category: 'metalloid',        colorHex: '#34d399' },
  C:   { number: 6,   symbol: 'C',   name: 'Carbon',       weight: 12.011,    category: 'nonmetal',         colorHex: '#38bdf8' },
  N:   { number: 7,   symbol: 'N',   name: 'Nitrogen',     weight: 14.007,    category: 'nonmetal',         colorHex: '#38bdf8' },
  O:   { number: 8,   symbol: 'O',   name: 'Oxygen',       weight: 15.999,    category: 'nonmetal',         colorHex: '#38bdf8' },
  F:   { number: 9,   symbol: 'F',   name: 'Fluorine',     weight: 18.998,    category: 'halogen',          colorHex: '#22d3ee' },
  Ne:  { number: 10,  symbol: 'Ne',  name: 'Neon',         weight: 20.180,    category: 'noble_gas',        colorHex: '#c084fc' },
  Na:  { number: 11,  symbol: 'Na',  name: 'Sodium',       weight: 22.990,    category: 'alkali_metal',     colorHex: '#f87171' },
  Mg:  { number: 12,  symbol: 'Mg',  name: 'Magnesium',    weight: 24.305,    category: 'alkaline_earth',   colorHex: '#fb923c' },
  Al:  { number: 13,  symbol: 'Al',  name: 'Aluminium',    weight: 26.982,    category: 'post_transition',  colorHex: '#94a3b8' },
  Si:  { number: 14,  symbol: 'Si',  name: 'Silicon',      weight: 28.085,    category: 'metalloid',        colorHex: '#34d399' },
  P:   { number: 15,  symbol: 'P',   name: 'Phosphorus',   weight: 30.974,    category: 'nonmetal',         colorHex: '#38bdf8' },
  S:   { number: 16,  symbol: 'S',   name: 'Sulfur',       weight: 32.06,     category: 'nonmetal',         colorHex: '#38bdf8' },
  Cl:  { number: 17,  symbol: 'Cl',  name: 'Chlorine',     weight: 35.45,     category: 'halogen',          colorHex: '#22d3ee' },
  Ar:  { number: 18,  symbol: 'Ar',  name: 'Argon',        weight: 39.95,     category: 'noble_gas',        colorHex: '#c084fc' },
  K:   { number: 19,  symbol: 'K',   name: 'Potassium',    weight: 39.098,    category: 'alkali_metal',     colorHex: '#f87171' },
  Ca:  { number: 20,  symbol: 'Ca',  name: 'Calcium',      weight: 40.078,    category: 'alkaline_earth',   colorHex: '#fb923c' },
  Sc:  { number: 21,  symbol: 'Sc',  name: 'Scandium',     weight: 44.956,    category: 'transition_metal', colorHex: '#818cf8' },
  Ti:  { number: 22,  symbol: 'Ti',  name: 'Titanium',     weight: 47.867,    category: 'transition_metal', colorHex: '#818cf8' },
  V:   { number: 23,  symbol: 'V',   name: 'Vanadium',     weight: 50.942,    category: 'transition_metal', colorHex: '#818cf8' },
  Cr:  { number: 24,  symbol: 'Cr',  name: 'Chromium',     weight: 51.996,    category: 'transition_metal', colorHex: '#818cf8' },
  Mn:  { number: 25,  symbol: 'Mn',  name: 'Manganese',    weight: 54.938,    category: 'transition_metal', colorHex: '#818cf8' },
  Fe:  { number: 26,  symbol: 'Fe',  name: 'Iron',         weight: 55.845,    category: 'transition_metal', colorHex: '#818cf8' },
  Co:  { number: 27,  symbol: 'Co',  name: 'Cobalt',       weight: 58.933,    category: 'transition_metal', colorHex: '#818cf8' },
  Ni:  { number: 28,  symbol: 'Ni',  name: 'Nickel',       weight: 58.693,    category: 'transition_metal', colorHex: '#818cf8' },
  Cu:  { number: 29,  symbol: 'Cu',  name: 'Copper',       weight: 63.546,    category: 'transition_metal', colorHex: '#818cf8' },
  Zn:  { number: 30,  symbol: 'Zn',  name: 'Zinc',         weight: 65.38,     category: 'transition_metal', colorHex: '#818cf8' },
  Ga:  { number: 31,  symbol: 'Ga',  name: 'Gallium',      weight: 69.723,    category: 'post_transition',  colorHex: '#94a3b8' },
  Ge:  { number: 32,  symbol: 'Ge',  name: 'Germanium',    weight: 72.630,    category: 'metalloid',        colorHex: '#34d399' },
  As:  { number: 33,  symbol: 'As',  name: 'Arsenic',      weight: 74.922,    category: 'metalloid',        colorHex: '#34d399' },
  Se:  { number: 34,  symbol: 'Se',  name: 'Selenium',     weight: 78.971,    category: 'nonmetal',         colorHex: '#38bdf8' },
  Br:  { number: 35,  symbol: 'Br',  name: 'Bromine',      weight: 79.904,    category: 'halogen',          colorHex: '#22d3ee' },
  Kr:  { number: 36,  symbol: 'Kr',  name: 'Krypton',      weight: 83.798,    category: 'noble_gas',        colorHex: '#c084fc' },
  Rb:  { number: 37,  symbol: 'Rb',  name: 'Rubidium',     weight: 85.468,    category: 'alkali_metal',     colorHex: '#f87171' },
  Sr:  { number: 38,  symbol: 'Sr',  name: 'Strontium',    weight: 87.62,     category: 'alkaline_earth',   colorHex: '#fb923c' },
  Y:   { number: 39,  symbol: 'Y',   name: 'Yttrium',      weight: 88.906,    category: 'transition_metal', colorHex: '#818cf8' },
  Zr:  { number: 40,  symbol: 'Zr',  name: 'Zirconium',    weight: 91.222,    category: 'transition_metal', colorHex: '#818cf8' },
  Nb:  { number: 41,  symbol: 'Nb',  name: 'Niobium',      weight: 92.906,    category: 'transition_metal', colorHex: '#818cf8' },
  Mo:  { number: 42,  symbol: 'Mo',  name: 'Molybdenum',   weight: 95.95,     category: 'transition_metal', colorHex: '#818cf8' },
  Tc:  { number: 43,  symbol: 'Tc',  name: 'Technetium',   weight: 98.0,      category: 'transition_metal', colorHex: '#818cf8' },
  Ru:  { number: 44,  symbol: 'Ru',  name: 'Ruthenium',    weight: 101.07,    category: 'transition_metal', colorHex: '#818cf8' },
  Rh:  { number: 45,  symbol: 'Rh',  name: 'Rhodium',      weight: 102.91,    category: 'transition_metal', colorHex: '#818cf8' },
  Pd:  { number: 46,  symbol: 'Pd',  name: 'Palladium',    weight: 106.42,    category: 'transition_metal', colorHex: '#818cf8' },
  Ag:  { number: 47,  symbol: 'Ag',  name: 'Silver',       weight: 107.87,    category: 'transition_metal', colorHex: '#818cf8' },
  Cd:  { number: 48,  symbol: 'Cd',  name: 'Cadmium',      weight: 112.41,    category: 'transition_metal', colorHex: '#818cf8' },
  In:  { number: 49,  symbol: 'In',  name: 'Indium',       weight: 114.82,    category: 'post_transition',  colorHex: '#94a3b8' },
  Sn:  { number: 50,  symbol: 'Sn',  name: 'Tin',          weight: 118.71,    category: 'post_transition',  colorHex: '#94a3b8' },
  Sb:  { number: 51,  symbol: 'Sb',  name: 'Antimony',     weight: 121.76,    category: 'metalloid',        colorHex: '#34d399' },
  Te:  { number: 52,  symbol: 'Te',  name: 'Tellurium',    weight: 127.60,    category: 'metalloid',        colorHex: '#34d399' },
  I:   { number: 53,  symbol: 'I',   name: 'Iodine',       weight: 126.90,    category: 'halogen',          colorHex: '#22d3ee' },
  Xe:  { number: 54,  symbol: 'Xe',  name: 'Xenon',        weight: 131.29,    category: 'noble_gas',        colorHex: '#c084fc' },
  Cs:  { number: 55,  symbol: 'Cs',  name: 'Caesium',      weight: 132.91,    category: 'alkali_metal',     colorHex: '#f87171' },
  Ba:  { number: 56,  symbol: 'Ba',  name: 'Barium',       weight: 137.33,    category: 'alkaline_earth',   colorHex: '#fb923c' },
  La:  { number: 57,  symbol: 'La',  name: 'Lanthanum',    weight: 138.91,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Ce:  { number: 58,  symbol: 'Ce',  name: 'Cerium',       weight: 140.12,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Pr:  { number: 59,  symbol: 'Pr',  name: 'Praseodymium', weight: 140.91,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Nd:  { number: 60,  symbol: 'Nd',  name: 'Neodymium',    weight: 144.24,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Pm:  { number: 61,  symbol: 'Pm',  name: 'Promethium',   weight: 145.0,     category: 'lanthanide',       colorHex: '#a78bfa' },
  Sm:  { number: 62,  symbol: 'Sm',  name: 'Samarium',     weight: 150.36,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Eu:  { number: 63,  symbol: 'Eu',  name: 'Europium',     weight: 151.96,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Gd:  { number: 64,  symbol: 'Gd',  name: 'Gadolinium',   weight: 157.25,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Tb:  { number: 65,  symbol: 'Tb',  name: 'Terbium',      weight: 158.93,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Dy:  { number: 66,  symbol: 'Dy',  name: 'Dysprosium',   weight: 162.50,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Ho:  { number: 67,  symbol: 'Ho',  name: 'Holmium',      weight: 164.93,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Er:  { number: 68,  symbol: 'Er',  name: 'Erbium',       weight: 167.26,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Tm:  { number: 69,  symbol: 'Tm',  name: 'Thulium',      weight: 168.93,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Yb:  { number: 70,  symbol: 'Yb',  name: 'Ytterbium',    weight: 173.05,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Lu:  { number: 71,  symbol: 'Lu',  name: 'Lutetium',     weight: 174.97,    category: 'lanthanide',       colorHex: '#a78bfa' },
  Hf:  { number: 72,  symbol: 'Hf',  name: 'Hafnium',      weight: 178.49,    category: 'transition_metal', colorHex: '#818cf8' },
  Ta:  { number: 73,  symbol: 'Ta',  name: 'Tantalum',     weight: 180.95,    category: 'transition_metal', colorHex: '#818cf8' },
  W:   { number: 74,  symbol: 'W',   name: 'Tungsten',     weight: 183.84,    category: 'transition_metal', colorHex: '#818cf8' },
  Re:  { number: 75,  symbol: 'Re',  name: 'Rhenium',      weight: 186.21,    category: 'transition_metal', colorHex: '#818cf8' },
  Os:  { number: 76,  symbol: 'Os',  name: 'Osmium',       weight: 190.23,    category: 'transition_metal', colorHex: '#818cf8' },
  Ir:  { number: 77,  symbol: 'Ir',  name: 'Iridium',      weight: 192.22,    category: 'transition_metal', colorHex: '#818cf8' },
  Pt:  { number: 78,  symbol: 'Pt',  name: 'Platinum',     weight: 195.08,    category: 'transition_metal', colorHex: '#818cf8' },
  Au:  { number: 79,  symbol: 'Au',  name: 'Gold',         weight: 196.97,    category: 'transition_metal', colorHex: '#818cf8' },
  Hg:  { number: 80,  symbol: 'Hg',  name: 'Mercury',      weight: 200.59,    category: 'transition_metal', colorHex: '#818cf8' },
  Tl:  { number: 81,  symbol: 'Tl',  name: 'Thallium',     weight: 204.38,    category: 'post_transition',  colorHex: '#94a3b8' },
  Pb:  { number: 82,  symbol: 'Pb',  name: 'Lead',         weight: 207.2,     category: 'post_transition',  colorHex: '#94a3b8' },
  Bi:  { number: 83,  symbol: 'Bi',  name: 'Bismuth',      weight: 208.98,    category: 'post_transition',  colorHex: '#94a3b8' },
  Po:  { number: 84,  symbol: 'Po',  name: 'Polonium',     weight: 209.0,     category: 'post_transition',  colorHex: '#94a3b8' },
  At:  { number: 85,  symbol: 'At',  name: 'Astatine',     weight: 210.0,     category: 'halogen',          colorHex: '#22d3ee' },
  Rn:  { number: 86,  symbol: 'Rn',  name: 'Radon',        weight: 222.0,     category: 'noble_gas',        colorHex: '#c084fc' },
  Fr:  { number: 87,  symbol: 'Fr',  name: 'Francium',     weight: 223.0,     category: 'alkali_metal',     colorHex: '#f87171' },
  Ra:  { number: 88,  symbol: 'Ra',  name: 'Radium',       weight: 226.0,     category: 'alkaline_earth',   colorHex: '#fb923c' },
  Ac:  { number: 89,  symbol: 'Ac',  name: 'Actinium',     weight: 227.0,     category: 'actinide',         colorHex: '#f472b6' },
  Th:  { number: 90,  symbol: 'Th',  name: 'Thorium',      weight: 232.04,    category: 'actinide',         colorHex: '#f472b6' },
  Pa:  { number: 91,  symbol: 'Pa',  name: 'Protactinium', weight: 231.04,    category: 'actinide',         colorHex: '#f472b6' },
  U:   { number: 92,  symbol: 'U',   name: 'Uranium',      weight: 238.03,    category: 'actinide',         colorHex: '#f472b6' },
  Np:  { number: 93,  symbol: 'Np',  name: 'Neptunium',    weight: 237.0,     category: 'actinide',         colorHex: '#f472b6' },
  Pu:  { number: 94,  symbol: 'Pu',  name: 'Plutonium',    weight: 244.0,     category: 'actinide',         colorHex: '#f472b6' },
  Am:  { number: 95,  symbol: 'Am',  name: 'Americium',    weight: 243.0,     category: 'actinide',         colorHex: '#f472b6' },
  Cm:  { number: 96,  symbol: 'Cm',  name: 'Curium',       weight: 247.0,     category: 'actinide',         colorHex: '#f472b6' },
  Bk:  { number: 97,  symbol: 'Bk',  name: 'Berkelium',    weight: 247.0,     category: 'actinide',         colorHex: '#f472b6' },
  Cf:  { number: 98,  symbol: 'Cf',  name: 'Californium',  weight: 251.0,     category: 'actinide',         colorHex: '#f472b6' },
  Es:  { number: 99,  symbol: 'Es',  name: 'Einsteinium',  weight: 252.0,     category: 'actinide',         colorHex: '#f472b6' },
  Fm:  { number: 100, symbol: 'Fm',  name: 'Fermium',      weight: 257.0,     category: 'actinide',         colorHex: '#f472b6' },
  Md:  { number: 101, symbol: 'Md',  name: 'Mendelevium',  weight: 258.0,     category: 'actinide',         colorHex: '#f472b6' },
  No:  { number: 102, symbol: 'No',  name: 'Nobelium',     weight: 259.0,     category: 'actinide',         colorHex: '#f472b6' },
  Lr:  { number: 103, symbol: 'Lr',  name: 'Lawrencium',   weight: 266.0,     category: 'actinide',         colorHex: '#f472b6' },
  Rf:  { number: 104, symbol: 'Rf',  name: 'Rutherfordium', weight: 267.0,    category: 'transition_metal', colorHex: '#818cf8' },
  Db:  { number: 105, symbol: 'Db',  name: 'Dubnium',      weight: 268.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Sg:  { number: 106, symbol: 'Sg',  name: 'Seaborgium',   weight: 269.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Bh:  { number: 107, symbol: 'Bh',  name: 'Bohrium',      weight: 270.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Hs:  { number: 108, symbol: 'Hs',  name: 'Hassium',      weight: 277.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Mt:  { number: 109, symbol: 'Mt',  name: 'Meitnerium',   weight: 278.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Ds:  { number: 110, symbol: 'Ds',  name: 'Darmstadtium', weight: 281.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Rg:  { number: 111, symbol: 'Rg',  name: 'Roentgenium',  weight: 282.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Cn:  { number: 112, symbol: 'Cn',  name: 'Copernicium',  weight: 285.0,     category: 'transition_metal', colorHex: '#818cf8' },
  Nh:  { number: 113, symbol: 'Nh',  name: 'Nihonium',     weight: 286.0,     category: 'post_transition',  colorHex: '#94a3b8' },
  Fl:  { number: 114, symbol: 'Fl',  name: 'Flerovium',    weight: 289.0,     category: 'post_transition',  colorHex: '#94a3b8' },
  Mc:  { number: 115, symbol: 'Mc',  name: 'Moscovium',    weight: 290.0,     category: 'post_transition',  colorHex: '#94a3b8' },
  Lv:  { number: 116, symbol: 'Lv',  name: 'Livermorium',  weight: 293.0,     category: 'post_transition',  colorHex: '#94a3b8' },
  Ts:  { number: 117, symbol: 'Ts',  name: 'Tennessine',   weight: 294.0,     category: 'halogen',          colorHex: '#22d3ee' },
  Og:  { number: 118, symbol: 'Og',  name: 'Oganesson',    weight: 294.0,     category: 'noble_gas',        colorHex: '#c084fc' }
};

export interface ElementComposition {
  symbol: string;
  name: string;
  atomicWeight: number;
  atomCount: number;
  subtotalMass: number;
  massPercent: number;
  colorHex: string;
}

export interface MolarMassResult {
  rawFormula: string;
  normalizedFormula: string;
  totalMolarMass: number; // g/mol
  elements: ElementComposition[];
  totalAtomCount: number;
  hillFormula: string;
  isValid: boolean;
  errorMessage?: string;
  homeworkSteps: string;
  latexBlock: string;
}

/**
 * Normalizes input: handles hydrates (·, *, .), standardizes brackets [], {} to (),
 * and auto-capitalizes lowercase inputs (e.g., c6h12o6 -> C6H12O6, nacl -> NaCl).
 */
export function normalizeChemicalFormula(input: string): string {
  if (!input) return '';
  let str = input.trim();

  // Normalize hydrate symbols to a standard dot '·'
  str = str.replace(/(\*|\s*\.\s*)/g, '·');

  // Convert square brackets and curly braces to standard parentheses
  str = str.replace(/[\[\{]/g, '(').replace(/[\]\}]/g, ')');

  // If the user typed purely lowercase/mixed without standard IUPAC element cases
  // (e.g. "nacl" or "c6h12o6"), intelligently auto-capitalize elements
  if (/^[a-z0-9()·]+$/.test(str)) {
    // Greedy match 2-letter elements first, then single letter
    const allSymbols = Object.keys(PERIODIC_ELEMENTS);
    const twoLetter = allSymbols.filter(s => s.length === 2).map(s => s.toLowerCase());
    const oneLetter = allSymbols.filter(s => s.length === 1).map(s => s.toLowerCase());

    let rebuilt = '';
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (/[0-9()·]/.test(ch)) {
        rebuilt += ch;
        i++;
        continue;
      }
      const pair = str.slice(i, i + 2);
      if (pair.length === 2 && twoLetter.includes(pair)) {
        rebuilt += pair[0].toUpperCase() + pair[1].toLowerCase();
        i += 2;
        continue;
      }
      if (oneLetter.includes(ch)) {
        rebuilt += ch.toUpperCase();
        i++;
        continue;
      }
      rebuilt += ch;
      i++;
    }
    str = rebuilt;
  }

  return str;
}

/**
 * Recursive descent parser for chemical formulas with arbitrary nested parentheses.
 */
function parseFormulaSegment(segment: string): Record<string, number> {
  const counts: Record<string, number> = {};
  let i = 0;

  function parseSub(): Record<string, number> {
    const subCounts: Record<string, number> = {};

    while (i < segment.length) {
      const char = segment[i];

      if (char === '(') {
        i++; // skip '('
        const inner = parseSub();
        // Check for multiplier after ')'
        let multStr = '';
        while (i < segment.length && /[0-9]/.test(segment[i])) {
          multStr += segment[i];
          i++;
        }
        const mult = multStr ? parseInt(multStr, 10) : 1;
        for (const [sym, count] of Object.entries(inner)) {
          subCounts[sym] = (subCounts[sym] || 0) + count * mult;
        }
      } else if (char === ')') {
        i++; // close bracket
        return subCounts;
      } else if (/[A-Z]/.test(char)) {
        let sym = char;
        i++;
        if (i < segment.length && /[a-z]/.test(segment[i])) {
          sym += segment[i];
          i++;
        }
        let numStr = '';
        while (i < segment.length && /[0-9]/.test(segment[i])) {
          numStr += segment[i];
          i++;
        }
        const count = numStr ? parseInt(numStr, 10) : 1;
        subCounts[sym] = (subCounts[sym] || 0) + count;
      } else {
        i++; // bypass unknown
      }
    }

    return subCounts;
  }

  return parseSub();
}

/**
 * Generate standard Hill system formula notation (C first, then H, then alphabetical).
 */
function toHillFormula(counts: Record<string, number>): string {
  const keys = Object.keys(counts);
  if (keys.length === 0) return '';

  let result = '';
  const hasC = keys.includes('C');

  if (hasC) {
    result += `C${counts['C'] > 1 ? counts['C'] : ''}`;
    if (keys.includes('H')) {
      result += `H${counts['H'] > 1 ? counts['H'] : ''}`;
    }
  }

  const remaining = keys
    .filter(k => (hasC ? k !== 'C' && k !== 'H' : true))
    .sort();

  for (const sym of remaining) {
    const c = counts[sym];
    result += `${sym}${c > 1 ? c : ''}`;
  }

  return result;
}

/**
 * Universal Molar Mass Calculator & Decomposition Engine.
 */
export function calculateMolarMass(formulaInput: string): MolarMassResult {
  const norm = normalizeChemicalFormula(formulaInput);

  if (!norm) {
    return {
      rawFormula: formulaInput,
      normalizedFormula: '',
      totalMolarMass: 0,
      elements: [],
      totalAtomCount: 0,
      hillFormula: '',
      isValid: false,
      errorMessage: 'Please enter a chemical formula (e.g. NaCl, C6H12O6, CuSO4·5H2O)',
      homeworkSteps: '',
      latexBlock: ''
    };
  }

  try {
    // Split into main salt and hydrate parts if '·' is present
    const parts = norm.split('·');
    const aggregatedCounts: Record<string, number> = {};

    // 1. Process Main Compound
    const mainCounts = parseFormulaSegment(parts[0]);
    for (const [sym, count] of Object.entries(mainCounts)) {
      aggregatedCounts[sym] = (aggregatedCounts[sym] || 0) + count;
    }

    // 2. Process Hydrate Portions (e.g. 5H2O)
    for (let p = 1; p < parts.length; p++) {
      const part = parts[p].trim();
      const match = part.match(/^([0-9]*)(.*)$/);
      if (match) {
        const hydrateMultiplier = match[1] ? parseInt(match[1], 10) : 1;
        const hydrateSegment = match[2] || 'H2O';
        const hydrateCounts = parseFormulaSegment(hydrateSegment);
        for (const [sym, count] of Object.entries(hydrateCounts)) {
          aggregatedCounts[sym] = (aggregatedCounts[sym] || 0) + count * hydrateMultiplier;
        }
      }
    }

    // Verify all symbols exist in the periodic table
    for (const sym of Object.keys(aggregatedCounts)) {
      if (!PERIODIC_ELEMENTS[sym]) {
        return {
          rawFormula: formulaInput,
          normalizedFormula: norm,
          totalMolarMass: 0,
          elements: [],
          totalAtomCount: 0,
          hillFormula: '',
          isValid: false,
          errorMessage: `Unrecognized chemical element symbol "${sym}". Check spelling or valence brackets.`,
          homeworkSteps: '',
          latexBlock: ''
        };
      }
    }

    // Calculate total molar mass
    let totalMass = 0;
    let totalAtoms = 0;
    const elementsList: ElementComposition[] = [];

    for (const [sym, count] of Object.entries(aggregatedCounts)) {
      const el = PERIODIC_ELEMENTS[sym];
      const subtotal = el.weight * count;
      totalMass += subtotal;
      totalAtoms += count;
    }

    // Build composition percentages
    for (const [sym, count] of Object.entries(aggregatedCounts)) {
      const el = PERIODIC_ELEMENTS[sym];
      const subtotal = el.weight * count;
      const pct = totalMass > 0 ? (subtotal / totalMass) * 100 : 0;

      elementsList.push({
        symbol: el.symbol,
        name: el.name,
        atomicWeight: el.weight,
        atomCount: count,
        subtotalMass: subtotal,
        massPercent: pct,
        colorHex: el.colorHex
      });
    }

    // Sort by mass percent descending
    elementsList.sort((a, b) => b.subtotalMass - a.subtotalMass);

    // Homework steps string
    let homeworkSteps = `Molar Mass Calculation for ${norm}:\n`;
    for (const item of elementsList) {
      homeworkSteps += `• ${item.name} (${item.symbol}): ${item.atomCount} × ${item.atomicWeight.toFixed(3)} g/mol = ${item.subtotalMass.toFixed(3)} g/mol (${item.massPercent.toFixed(2)}%)\n`;
    }
    homeworkSteps += `--------------------------------------------------\n`;
    homeworkSteps += `Total Molecular Weight = ${totalMass.toFixed(3)} g/mol (amu)`;

    // LaTeX derivation block
    let latexBlock = `\\begin{aligned}\n`;
    latexBlock += `  \\text{Formula: } &\\text{${norm}} \\\\\n`;
    for (const item of elementsList) {
      latexBlock += `  \\text{${item.symbol}: } &${item.atomCount} \\times ${item.atomicWeight.toFixed(3)} = ${item.subtotalMass.toFixed(3)}\\text{ g/mol } (${item.massPercent.toFixed(2)}\\%) \\\\\n`;
    }
    latexBlock += `  \\hline\n`;
    latexBlock += `  \\mathbf{M} &= \\mathbf{${totalMass.toFixed(3)}}\\text{ \\textbf{g/mol}}\n`;
    latexBlock += `\\end{aligned}`;

    return {
      rawFormula: formulaInput,
      normalizedFormula: norm,
      totalMolarMass: totalMass,
      elements: elementsList,
      totalAtomCount: totalAtoms,
      hillFormula: toHillFormula(aggregatedCounts),
      isValid: true,
      homeworkSteps,
      latexBlock
    };
  } catch (err: any) {
    return {
      rawFormula: formulaInput,
      normalizedFormula: norm,
      totalMolarMass: 0,
      elements: [],
      totalAtomCount: 0,
      hillFormula: '',
      isValid: false,
      errorMessage: err?.message || 'Syntax error in chemical formula notation.',
      homeworkSteps: '',
      latexBlock: ''
    };
  }
}

/**
 * Two-way conversion between mass, moles, and molecule count.
 */
export function convertMassMoles(
  molarMass: number,
  mode: 'mass_to_moles' | 'moles_to_mass',
  val: number
): { massGrams: number; moles: number; molecules: number } {
  const NA = 6.02214076e23; // Avogadro's constant
  const M = Math.max(1e-6, molarMass);

  if (mode === 'mass_to_moles') {
    const mass = Math.max(0, val);
    const moles = mass / M;
    const molecules = moles * NA;
    return { massGrams: mass, moles, molecules };
  } else {
    const moles = Math.max(0, val);
    const mass = moles * M;
    const molecules = moles * NA;
    return { massGrams: mass, moles, molecules };
  }
}