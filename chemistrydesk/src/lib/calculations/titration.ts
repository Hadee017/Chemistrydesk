// src/lib/calculations/titration.ts

export type TitrationSystemType = 
  | 'strong_acid_strong_base' 
  | 'weak_acid_strong_base' 
  | 'weak_base_strong_acid';

export interface ChemicalIndicator {
  name: string;
  pHRange: [number, number];
  colorChange: string;
  suitableFor: TitrationSystemType[];
}

export const COMMON_INDICATORS: ChemicalIndicator[] = [
  {
    name: 'Phenolphthalein',
    pHRange: [8.2, 10.0],
    colorChange: 'Colorless to Vivid Pink',
    suitableFor: ['strong_acid_strong_base', 'weak_acid_strong_base']
  },
  {
    name: 'Bromothymol Blue',
    pHRange: [6.0, 7.6],
    colorChange: 'Yellow to Blue',
    suitableFor: ['strong_acid_strong_base']
  },
  {
    name: 'Methyl Orange',
    pHRange: [3.1, 4.4],
    colorChange: 'Red to Orange-Yellow',
    suitableFor: ['weak_base_strong_acid']
  },
  {
    name: 'Methyl Red',
    pHRange: [4.4, 6.2],
    colorChange: 'Red to Yellow',
    suitableFor: ['weak_base_strong_acid', 'strong_acid_strong_base']
  }
];

export interface RawTitrationInput {
  systemType: TitrationSystemType;
  analyteConcentration: string | number; // Handles comma or dot decimals
  analyteVolume: string | number;        // in mL
  titrantConcentration: string | number; // in mol/L (M)
  pKa?: string | number;                 // For weak acid
  pKb?: string | number;                 // For weak base
  selectedIndicator?: string;
  analyteName?: string;
  titrantName?: string;
  pointsCount?: number;
}

export interface TitrationDataPoint {
  volumeAdded: number; // mL
  pH: number;
  derivative: number;  // dpH/dV
}

export interface IndicatorEvaluation {
  name: string;
  pHRange: [number, number];
  colorChange: string;
  isSuitable: boolean;
  statusNote: string;
}

export interface TitrationOutput {
  analyteName: string;
  titrantName: string;
  equivalenceVolume: number;        // V_eq in mL
  equivalencePH: number;            // pH at V_eq
  initialPH: number;                // pH at V = 0
  halfEquivalenceVolume?: number;   // V_1/2 in mL
  halfEquivalencePH?: number;       // pH at V_1/2 (pKa)
  bufferRange?: [number, number];   // pKa ± 1
  maxDerivativeVolume: number;      // Peak inflection volume in mL
  maxDerivativeValue: number;
  points: TitrationDataPoint[];
  indicator: IndicatorEvaluation;
  latexExport: string;              // Ready for Overleaf
  labSOPParagraph: string;          // 1-Click ELN Lab Notebook
  bibtexCitation: string;           // 1-Click Academic Citation
}

const KW = 1.0e-14;

// Safe decimal parser that normalizes commas to dots and blocks NaN
export function parseSanitizedFloat(val: string | number, fallback = 0): number {
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : val;
  }
  if (!val) return fallback;
  const sanitized = val.toString().trim().replace(',', '.');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
}

export function calculateTitration(input: RawTitrationInput): TitrationOutput {
  // 1. Sanitize & Normalize Inputs to Safe SI Base Values
  const Ca = Math.max(1e-6, parseSanitizedFloat(input.analyteConcentration, 0.1));
  const Va_mL = Math.max(0.1, parseSanitizedFloat(input.analyteVolume, 25.0));
  const Cb = Math.max(1e-6, parseSanitizedFloat(input.titrantConcentration, 0.1));
  const pKa = parseSanitizedFloat(input.pKa ?? 4.76, 4.76);
  const pKb = parseSanitizedFloat(input.pKb ?? 4.75, 4.75);

  const analyteName = input.analyteName?.trim() || (input.systemType === 'weak_base_strong_acid' ? 'Weak Base' : 'Acid Analyte');
  const titrantName = input.titrantName?.trim() || (input.systemType === 'weak_base_strong_acid' ? 'HCl Titrant' : 'NaOH Titrant');

  const Va_L = Va_mL / 1000.0;
  const molesAnalyte = Ca * Va_L;

  // 2. Fundamental Stoichiometric Equivalence Point: V_eq = (Ca * Va) / Cb
  const Veq_mL = (molesAnalyte / Cb) * 1000.0;
  const maxV_mL = Veq_mL * 2.0; // Standard 2x volume expansion to view full sigmoid curve
  const steps = input.pointsCount ?? 160;
  const dV = maxV_mL / steps;

  const points: TitrationDataPoint[] = [];

  // Internal Equilibrium Solver for pH at volume V (mL)
  const computePHAtVolume = (V_mL: number): number => {
    const V_L = V_mL / 1000.0;
    const totalVol_L = Va_L + V_L;
    const molesTitrant = Cb * V_L;

    // SYSTEM 1: Strong Acid + Strong Base (HCl + NaOH)
    if (input.systemType === 'strong_acid_strong_base') {
      if (V_mL < Veq_mL - 1e-5) {
        const excessMolesH = molesAnalyte - molesTitrant;
        const concH = excessMolesH / totalVol_L;
        return -Math.log10(Math.max(1e-14, concH));
      } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
        return 7.00;
      } else {
        const excessMolesOH = molesTitrant - molesAnalyte;
        const concOH = excessMolesOH / totalVol_L;
        const pOH = -Math.log10(Math.max(1e-14, concOH));
        return Math.min(14.0, 14.0 - pOH);
      }
    }

    // SYSTEM 2: Weak Acid + Strong Base (CH3COOH + NaOH)
    if (input.systemType === 'weak_acid_strong_base') {
      const Ka = Math.pow(10, -pKa);

      if (V_mL <= 0.001) {
        // Initial weak acid equilibrium: [H+] = sqrt(Ka * Ca)
        const concH = Math.sqrt(Ka * Ca);
        return -Math.log10(Math.max(1e-14, concH));
      } else if (V_mL < Veq_mL - 1e-5) {
        // Buffer Plateau: Henderson-Hasselbalch equation pH = pKa + log([A-]/[HA])
        const molesA_minus = molesTitrant;
        const molesHA = molesAnalyte - molesTitrant;
        const ratio = Math.max(1e-6, molesA_minus / molesHA);
        return Math.max(0.0, Math.min(14.0, pKa + Math.log10(ratio)));
      } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
        // Equivalence Point: Conjugate base hydrolysis: A- + H2O <=> HA + OH-
        const concA_minus = molesAnalyte / totalVol_L;
        const Kb = KW / Ka;
        const concOH = Math.sqrt(Kb * concA_minus);
        const pOH = -Math.log10(Math.max(1e-14, concOH));
        return Math.min(14.0, 14.0 - pOH);
      } else {
        // Excess Titrant Zone: Dominated by unreacted strong base
        const excessMolesOH = molesTitrant - molesAnalyte;
        const concOH = excessMolesOH / totalVol_L;
        const pOH = -Math.log10(Math.max(1e-14, concOH));
        return Math.min(14.0, 14.0 - pOH);
      }
    }

    // SYSTEM 3: Weak Base + Strong Acid (NH3 + HCl)
    if (input.systemType === 'weak_base_strong_acid') {
      const Kb = Math.pow(10, -pKb);
      const effectivePKa = 14.0 - pKb;

      if (V_mL <= 0.001) {
        // Initial weak base equilibrium: [OH-] = sqrt(Kb * Ca)
        const concOH = Math.sqrt(Kb * Ca);
        const pOH = -Math.log10(Math.max(1e-14, concOH));
        return Math.min(14.0, 14.0 - pOH);
      } else if (V_mL < Veq_mL - 1e-5) {
        // Buffer Plateau: pH = pKa + log([B]/[BH+])
        const molesB = molesAnalyte - molesTitrant;
        const molesBH_plus = molesTitrant;
        const ratio = Math.max(1e-6, molesB / molesBH_plus);
        return Math.max(0.0, Math.min(14.0, effectivePKa + Math.log10(ratio)));
      } else if (Math.abs(V_mL - Veq_mL) <= 1e-5) {
        // Equivalence Point: Conjugate acid hydrolysis: BH+ <=> B + H+
        const Ka = KW / Kb;
        const concBH_plus = molesAnalyte / totalVol_L;
        const concH = Math.sqrt(Ka * concBH_plus);
        return Math.max(0.0, -Math.log10(Math.max(1e-14, concH)));
      } else {
        // Excess Titrant Zone: Dominated by unreacted strong acid
        const excessMolesH = molesTitrant - molesAnalyte;
        const concH = excessMolesH / totalVol_L;
        return Math.max(0.0, -Math.log10(Math.max(1e-14, concH)));
      }
    }

    return 7.00;
  };

  // 3. Generate High-Resolution Curve Points
  for (let i = 0; i <= steps; i++) {
    const v = i * dV;
    const ph = computePHAtVolume(v);
    points.push({
      volumeAdded: Number(v.toFixed(3)),
      pH: Number(ph.toFixed(2)),
      derivative: 0.0
    });
  }

  // 4. Numerical Central First-Derivative (dpH / dV) Inflection Detection
  let maxDerivVal = -1;
  let maxDerivVol = Veq_mL;

  for (let i = 1; i < points.length - 1; i++) {
    const deltaV = points[i + 1].volumeAdded - points[i - 1].volumeAdded;
    const deltaPH = Math.abs(points[i + 1].pH - points[i - 1].pH);
    const deriv = deltaV > 0 ? deltaPH / deltaV : 0;
    points[i].derivative = Number(deriv.toFixed(3));

    if (deriv > maxDerivVal) {
      maxDerivVal = deriv;
      maxDerivVol = points[i].volumeAdded;
    }
  }

  // Boundary derivative values
  if (points.length > 1) {
    points[0].derivative = points[1].derivative;
    points[points.length - 1].derivative = points[points.length - 2].derivative;
  }

  // 5. Analytics & Indicators
  const initialPH = points[0]?.pH ?? 7.00;
  const eqPH = Number(computePHAtVolume(Veq_mL).toFixed(2));
  const halfV = Number((Veq_mL / 2.0).toFixed(2));
  const halfPH = Number(computePHAtVolume(halfV).toFixed(2));

  const targetIndicatorName = input.selectedIndicator || 'Phenolphthalein';
  const foundIndicator = COMMON_INDICATORS.find(
    (ind) => ind.name.toLowerCase() === targetIndicatorName.toLowerCase()
  ) || COMMON_INDICATORS[0];

  const isSuitable = eqPH >= foundIndicator.pHRange[0] - 0.5 && eqPH <= foundIndicator.pHRange[1] + 0.5;
  const statusNote = isSuitable
    ? `Indicator transition (${foundIndicator.pHRange[0]}–${foundIndicator.pHRange[1]}) cleanly brackets the inflection pH (${eqPH}).`
    : `Warning: Transition range (${foundIndicator.pHRange[0]}–${foundIndicator.pHRange[1]}) departs from inflection pH (${eqPH}). End-point titration error likely.`;

  const bufferRange: [number, number] | undefined = 
    input.systemType === 'weak_acid_strong_base'
      ? [Number((pKa - 1).toFixed(2)), Number((pKa + 1).toFixed(2))]
      : input.systemType === 'weak_base_strong_acid'
      ? [Number((14.0 - pKb - 1).toFixed(2)), Number((14.0 - pKb + 1).toFixed(2))]
      : undefined;

  // 6. 1-Click Overleaf / LaTeX Code Export
  const latexExport = `% Titration Calculation generated by ChemistryCal (https://chemistrycal.com/titration)
\\begin{align}
  V_{\\text{eq}} &= \\frac{C_a \\times V_a}{C_b} = \\frac{${Ca.toFixed(4)}\\text{ M} \\times ${Va_mL.toFixed(2)}\\text{ mL}}{${Cb.toFixed(4)}\\text{ M}} = ${Veq_mL.toFixed(2)}\\text{ mL} \\\\[6pt]
  \\text{pH}_{\\text{initial}} &= ${initialPH.toFixed(2)}, \\quad \\text{pH}_{\\text{equivalence}} = ${eqPH.toFixed(2)} \\\\[6pt]
  ${bufferRange ? `\\text{Buffer Zone} &= pK_a \\pm 1 = [${bufferRange[0]},${bufferRange[1]}]` : `\\text{Type} &= \\text{Strong Electrolyte Inflection}`}
\\end{align}`;

  // 7. 1-Click Benchtop Electronic Lab Notebook (ELN) SOP Recipe
  const labSOPParagraph = `Titration Protocol: Pipette ${Va_mL.toFixed(2)} mL of ${analyteName} (nominal concentration ${Ca.toFixed(4)} M) into a clean 150 mL Erlenmeyer flask. Add 2-3 drops of ${foundIndicator.name} indicator (${foundIndicator.colorChange}). Fill a standardized 50 mL Class-A burette with ${titrantName} (${Cb.toFixed(4)} M). Titrate under magnetic stirring until the transition inflection is reached at ${Veq_mL.toFixed(2)} mL (equivalence pH: ${eqPH.toFixed(2)}). Buffer maximum observed at half-equivalence volume ${halfV.toFixed(2)} mL.`;

  // 8. 1-Click Academic BibTeX Citation Block
  const bibtexCitation = `@software{ChemistryCal_Titration_2026,
  author = {Khan, Bilal},
  title = {ChemistryCal Analytical Suite: Acid-Base Dynamic Inflection & Derivative Engine},
  year = {2026},
  url = {https://chemistrycal.com/titration},
  note = {Universal client-side equilibrium simulator and buffer capacity analyzer}
}`;

  return {
    analyteName,
    titrantName,
    equivalenceVolume: Number(Veq_mL.toFixed(2)),
    equivalencePH: eqPH,
    initialPH,
    halfEquivalenceVolume: halfV,
    halfEquivalencePH: halfPH,
    bufferRange,
    maxDerivativeVolume: Number(maxDerivVol.toFixed(2)),
    maxDerivativeValue: Number(maxDerivVal.toFixed(2)),
    points,
    indicator: {
      name: foundIndicator.name,
      pHRange: foundIndicator.pHRange,
      colorChange: foundIndicator.colorChange,
      isSuitable,
      statusNote
    },
    latexExport,
    labSOPParagraph,
    bibtexCitation
  };
}