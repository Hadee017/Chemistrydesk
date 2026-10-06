/**
 * src/utils/stoichiometryMath.ts
 * Pure Mathematical Engine for Chemical Equation Balancing & Stoichiometry
 */

// Atomic weights (IUPAC standard atomic weights)
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
  F: 18.998, Ne: 20.180, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974,
  S: 32.06, Cl: 35.45, Ar: 39.95, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867,
  V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546,
  Zn: 65.38, Ga: 69.723, Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798,
  Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Tc: 98,
  Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71,
  Sb: 121.76, Te: 127.60, I: 126.90, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91,
  Ce: 140.12, Pr: 140.91, Nd: 144.24, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93,
  Dy: 162.50, Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49,
  Ta: 180.95, W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97,
  Hg: 200.59, Tl: 204.38, Pb: 207.2, Bi: 208.98, Th: 232.04, Pa: 231.04, U: 238.03
};

export interface ChemicalSpecies {
  formula: string;
  elements: Record<string, number>;
  molarMass: number;
  coefficient: number;
  isProduct: boolean;
}

export interface BalancedReactionResult {
  balancedEquationString: string;
  reactants: ChemicalSpecies[];
  products: ChemicalSpecies[];
  isBalanced: boolean;
  errorMessage?: string;
}

export interface StoichiometryCalculationResult {
  limitingSpecies: string | null;
  speciesResults: Array<{
    formula: string;
    coefficient: number;
    isProduct: boolean;
    molarMass: number;
    initialMoles: number;
    initialMassG: number;
    reactedMoles: number;
    remainingMoles: number;
    producedMoles: number;
    producedMassG: number;
    isLimiting: boolean;
  }>;
  theoreticalYieldG: number;
  actualYieldG?: number;
  percentYield?: number;
}

// ----------------------------------------------------------------------------
// 1. Chemical Formula Parser
// ----------------------------------------------------------------------------

export function parseFormula(rawFormula: string): Record<string, number> {
  const formula = rawFormula.trim().replace(/\s+/g, '');
  if (!formula) return {};

  // Split crystal hydrate dot notation if present (e.g., CuSO4*5H2O or CuSO4.5H2O)
  if (formula.includes('*') || formula.includes('·')) {
    const parts = formula.split(/[*·]/);
    const mainCounts = parseSubFormula(parts[0]);
    if (parts.length > 1) {
      const match = parts[1].match(/^(\d+)?(.*)$/);
      const mult = match && match[1] ? parseInt(match[1], 10) : 1;
      const hydrateCounts = parseSubFormula(match ? match[2] : parts[1]);
      for (const el in hydrateCounts) {
        mainCounts[el] = (mainCounts[el] || 0) + hydrateCounts[el] * mult;
      }
    }
    return mainCounts;
  }

  return parseSubFormula(formula);
}

function parseSubFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const stack: Record<string, number>[] = [counts];
  const regex = /([A-Z][a-z]?|\(\vert{}\)|\[\vert{}\]|\d+)/g;
  const tokens = formula.match(regex);
  if (!tokens) return counts;

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '(' || token === '[') {
      const subGroup: Record<string, number> = {};
      stack.push(subGroup);
      i++;
    } else if (token === ')' || token === ']') {
      const completed = stack.pop() || {};
      let multiplier = 1;
      if (i + 1 < tokens.length && /^\d+$/.test(tokens[i + 1])) {
        multiplier = parseInt(tokens[i + 1], 10);
        i++;
      }
      const top = stack[stack.length - 1];
      for (const el in completed) {
        top[el] = (top[el] || 0) + completed[el] * multiplier;
      }
      i++;
    } else if (/^[A-Z][a-z]?$/.test(token)) {
      let count = 1;
      if (i + 1 < tokens.length && /^\d+$/.test(tokens[i + 1])) {
        count = parseInt(tokens[i + 1], 10);
        i++;
      }
      const top = stack[stack.length - 1];
      top[token] = (top[token] || 0) + count;
      i++;
    } else {
      i++;
    }
  }

  return counts;
}

export function computeMolarMass(elements: Record<string, number>): number {
  let mass = 0;
  for (const el in elements) {
    const weight = ATOMIC_WEIGHTS[el] || 0;
    mass += weight * elements[el];
  }
  return mass;
}

// ----------------------------------------------------------------------------
// 2. Linear Algebra Solver for Balancing Chemical Equations
// ----------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export function balanceChemicalEquation(rawEquation: string): BalancedReactionResult {
  const parts = rawEquation.split(/->|=|→|⇌/);
  if (parts.length !== 2) {
    return {
      balancedEquationString: '',
      reactants: [],
      products: [],
      isBalanced: false,
      errorMessage: 'Equation must contain an arrow (-> or =) separating reactants and products.'
    };
  }

  const parseMolecules = (str: string, isProduct: boolean): ChemicalSpecies[] => {
    return str
      .split('+')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(formula => {
        const cleanFormula = formula.replace(/^\d+/, ''); // strip leading manual coefficient
        const elements = parseFormula(cleanFormula);
        return {
          formula: cleanFormula,
          elements,
          molarMass: computeMolarMass(elements),
          coefficient: 1,
          isProduct
        };
      });
  };

  const reactants = parseMolecules(parts[0], false);
  const products = parseMolecules(parts[1], true);

  if (reactants.length === 0 || products.length === 0) {
    return {
      balancedEquationString: '',
      reactants: [],
      products: [],
      isBalanced: false,
      errorMessage: 'Both reactants and products must contain valid chemical formulas.'
    };
  }

  const allSpecies = [...reactants, ...products];
  const allElementsSet = new Set<string>();
  allSpecies.forEach(sp => {
    Object.keys(sp.elements).forEach(el => allElementsSet.add(el));
  });
  const elements = Array.from(allElementsSet);

  // Form stoichiometric conservation matrix: rows = elements, cols = species
  const rows = elements.length;
  const cols = allSpecies.length;
  const matrix: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const el = elements[r];
    matrix[r] = [];
    for (let c = 0; c < cols; c++) {
      const sp = allSpecies[c];
      const count = sp.elements[el] || 0;
      matrix[r][c] = sp.isProduct ? -count : count;
    }
  }

  // Gaussian elimination with exact fractional representation
  interface Fraction {
    n: number;
    d: number;
  }

  const fMatrix: Fraction[][] = matrix.map(row =>
    row.map(val => ({ n: val, d: 1 }))
  );

  const addFrac = (a: Fraction, b: Fraction): Fraction => {
    const num = a.n * b.d + b.n * a.d;
    const den = a.d * b.d;
    const g = gcd(num, den);
    return { n: num / g, d: den / g };
  };

  const multFrac = (a: Fraction, b: Fraction): Fraction => {
    const num = a.n * b.n;
    const den = a.d * b.d;
    const g = gcd(num, den);
    return { n: num / g, d: den / g };
  };

  const divFrac = (a: Fraction, b: Fraction): Fraction => {
    if (b.n === 0) return { n: 0, d: 1 };
    const num = a.n * b.d;
    const den = a.d * b.n;
    const g = gcd(num, den);
    const sign = den < 0 ? -1 : 1;
    return { n: (num / g) * sign, d: Math.abs(den / g) };
  };

  let lead = 0;
  for (let r = 0; r < rows; r++) {
    if (lead >= cols - 1) break;
    let i = r;
    while (fMatrix[i][lead].n === 0) {
      i++;
      if (i === rows) {
        i = r;
        lead++;
        if (lead >= cols - 1) break;
      }
    }
    if (lead >= cols - 1) break;

    // Swap rows
    const temp = fMatrix[i];
    fMatrix[i] = fMatrix[r];
    fMatrix[r] = temp;

    // Normalize pivot row
    const pivot = fMatrix[r][lead];
    for (let j = 0; j < cols; j++) {
      fMatrix[r][j] = divFrac(fMatrix[r][j], pivot);
    }

    // Eliminate other rows
    for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
      if (rowIdx !== r) {
        const factor = fMatrix[rowIdx][lead];
        for (let j = 0; j < cols; j++) {
          const sub = multFrac(factor, fMatrix[r][j]);
          fMatrix[rowIdx][j] = addFrac(fMatrix[rowIdx][j], { n: -sub.n, d: sub.d });
        }
      }
    }
    lead++;
  }

  // Back substitution assuming last coefficient = 1
  const coeffs: Fraction[] = new Array(cols).fill(null).map(() => ({ n: 1, d: 1 }));
  coeffs[cols - 1] = { n: 1, d: 1 };

  for (let r = rows - 1; r >= 0; r--) {
    let pivotCol = -1;
    for (let c = 0; c < cols - 1; c++) {
      if (fMatrix[r][c].n !== 0) {
        pivotCol = c;
        break;
      }
    }
    if (pivotCol !== -1) {
      let sum: Fraction = { n: 0, d: 1 };
      for (let c = pivotCol + 1; c < cols; c++) {
        sum = addFrac(sum, multFrac(fMatrix[r][c], coeffs[c]));
      }
      coeffs[pivotCol] = { n: -sum.n, d: sum.d };
    }
  }

  // Clear common denominators to obtain lowest integer coefficients
  let overallLcm = 1;
  coeffs.forEach(c => {
    overallLcm = lcm(overallLcm, c.d);
  });

  const intCoeffs = coeffs.map(c => Math.abs(Math.round((c.n * overallLcm) / c.d)));
  let overallGcd = intCoeffs[0] || 1;
  intCoeffs.forEach(val => {
    overallGcd = gcd(overallGcd, val);
  });

  const normalizedCoeffs = intCoeffs.map(c => Math.max(1, Math.round(c / overallGcd)));

  // Assign resolved coefficients
  reactants.forEach((r, idx) => {
    r.coefficient = normalizedCoeffs[idx];
  });
  products.forEach((p, idx) => {
    p.coefficient = normalizedCoeffs[reactants.length + idx];
  });

  // Verify atomic balance
  for (const el of elements) {
    let rSum = 0;
    let pSum = 0;
    reactants.forEach(r => (rSum += (r.elements[el] || 0) * r.coefficient));
    products.forEach(p => (pSum += (p.elements[el] || 0) * p.coefficient));
    if (rSum !== pSum || rSum === 0) {
      return {
        balancedEquationString: '',
        reactants,
        products,
        isBalanced: false,
        errorMessage: `Element balance failed for ${el}. Please verify formula charges or reaction validity.`
      };
    }
  }

  const formatSide = (speciesList: ChemicalSpecies[]) =>
    speciesList
      .map(sp => (sp.coefficient > 1 ? `${sp.coefficient} ` : '') + sp.formula)
      .join(' + ');

  const balancedEquationString = `${formatSide(reactants)} → ${formatSide(products)}`;

  return {
    balancedEquationString,
    reactants,
    products,
    isBalanced: true
  };
}

// ----------------------------------------------------------------------------
// 3. Stoichiometry & Limiting Reagent Calculation Solver
// ----------------------------------------------------------------------------

export function solveStoichiometry(
  reactants: ChemicalSpecies[],
  products: ChemicalSpecies[],
  inputQuantities: Record<string, { value: number; unit: 'g' | 'mg' | 'mol' | 'mmol' }>,
  actualProductYieldG?: number
): StoichiometryCalculationResult {
  // Convert input quantities to standard moles
  const molarInputs: Record<string, number> = {};

  reactants.forEach(r => {
    const inp = inputQuantities[r.formula];
    if (inp && inp.value > 0) {
      if (inp.unit === 'g') {
        molarInputs[r.formula] = inp.value / (r.molarMass || 1);
      } else if (inp.unit === 'mg') {
        molarInputs[r.formula] = (inp.value / 1000) / (r.molarMass || 1);
      } else if (inp.unit === 'mmol') {
        molarInputs[r.formula] = inp.value / 1000;
      } else {
        molarInputs[r.formula] = inp.value;
      }
    } else {
      molarInputs[r.formula] = 0;
    }
  });

  // Identify limiting reagent via reaction extent (moles / coefficient)
  let minExtent = Infinity;
  let limitingFormula: string | null = null;

  reactants.forEach(r => {
    const moles = molarInputs[r.formula] || 0;
    if (moles > 0) {
      const extent = moles / r.coefficient;
      if (extent < minExtent) {
        minExtent = extent;
        limitingFormula = r.formula;
      }
    }
  });

  if (minExtent === Infinity) {
    minExtent = 0;
  }

  // Compute final moles, masses, and theoretical yields
  const speciesResults: StoichiometryCalculationResult['speciesResults'] = [];

  reactants.forEach(r => {
    const initMoles = molarInputs[r.formula] || 0;
    const reactedMoles = minExtent * r.coefficient;
    const remainingMoles = Math.max(0, initMoles - reactedMoles);

    speciesResults.push({
      formula: r.formula,
      coefficient: r.coefficient,
      isProduct: false,
      molarMass: r.molarMass,
      initialMoles: initMoles,
      initialMassG: initMoles * r.molarMass,
      reactedMoles,
      remainingMoles,
      producedMoles: 0,
      producedMassG: 0,
      isLimiting: r.formula === limitingFormula
    });
  });

  let theoreticalYieldG = 0;

  products.forEach(p => {
    const producedMoles = minExtent * p.coefficient;
    const producedMassG = producedMoles * p.molarMass;
    theoreticalYieldG += producedMassG;

    speciesResults.push({
      formula: p.formula,
      coefficient: p.coefficient,
      isProduct: true,
      molarMass: p.molarMass,
      initialMoles: 0,
      initialMassG: 0,
      reactedMoles: 0,
      remainingMoles: 0,
      producedMoles,
      producedMassG,
      isLimiting: false
    });
  });

  let percentYield: number | undefined;
  if (actualProductYieldG !== undefined && theoreticalYieldG > 0) {
    percentYield = (actualProductYieldG / theoreticalYieldG) * 100;
  }

  return {
    limitingSpecies: limitingFormula,
    speciesResults,
    theoreticalYieldG,
    actualYieldG: actualProductYieldG,
    percentYield
  };
}