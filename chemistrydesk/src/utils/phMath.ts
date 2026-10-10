/**
 * src/utils/phMath.ts
 * Pure scientific calculation engine for pH, pOH, aqueous ion equilibrium,
 * and weak acid/base thermodynamic dissociation.
 * Decoupled from UI components for testability and zero-dependency execution.
 */

// Temperature-dependent autoionization of water (Kw)
export interface WaterKwPreset {
  tempC: number;
  Kw: number;
  pKw: number;
  neutralPH: number;
}

export const WATER_KW_DATA: Record<number, WaterKwPreset> = {
  0:  { tempC: 0,  Kw: 1.14e-15, pKw: 14.94, neutralPH: 7.47 },
  25: { tempC: 25, Kw: 1.00e-14, pKw: 14.00, neutralPH: 7.00 },
  37: { tempC: 37, Kw: 2.42e-14, pKw: 13.62, neutralPH: 6.81 }, // Physiological
  60: { tempC: 60, Kw: 9.61e-14, pKw: 13.02, neutralPH: 6.51 }
};

export type AcidBaseClass = 'strong_acid' | 'strong_base' | 'weak_acid' | 'weak_base';

export interface AcidBasePreset {
  id: string;
  name: string;
  formula: string;
  type: AcidBaseClass;
  K_val: number; // Ka or Kb
  pK_val: number;
  description: string;
}

export const COMMON_ACID_BASE_PRESETS: AcidBasePreset[] = [
  { id: 'hcl',      name: 'Hydrochloric Acid',  formula: 'HCl',      type: 'strong_acid', K_val: 1e6,     pK_val: -6.00, description: 'Monoprotic strong mineral acid (100% dissociation)' },
  { id: 'hno3',     name: 'Nitric Acid',        formula: 'HNO₃',     type: 'strong_acid', K_val: 1e1,     pK_val: -1.00, description: 'Strong oxidizing monoprotic mineral acid' },
  { id: 'h2so4',    name: 'Sulfuric Acid (1st)', formula: 'H₂SO₄',    type: 'strong_acid', K_val: 1e3,     pK_val: -3.00, description: 'Diprotic acid: 1st proton fully dissociated' },
  { id: 'naoh',     name: 'Sodium Hydroxide',   formula: 'NaOH',     type: 'strong_base', K_val: 1e6,     pK_val: -6.00, description: 'Strong caustic alkali (100% dissociation)' },
  { id: 'koh',      name: 'Potassium Hydroxide', formula: 'KOH',     type: 'strong_base', K_val: 1e6,     pK_val: -6.00, description: 'Strong monoprotic alkali' },
  { id: 'acetic',   name: 'Acetic Acid',        formula: 'CH₃COOH',  type: 'weak_acid',   K_val: 1.75e-5, pK_val: 4.76,  description: 'Standard carboxylic weak acid (vinegar active)' },
  { id: 'formic',   name: 'Formic Acid',        formula: 'HCOOH',    type: 'weak_acid',   K_val: 1.77e-4, pK_val: 3.75,  description: 'Moderately strong organic carboxylic acid' },
  { id: 'hf',       name: 'Hydrofluoric Acid',  formula: 'HF',       type: 'weak_acid',   K_val: 6.60e-4, pK_val: 3.18,  description: 'Weak halogen acid with strong H-F bond' },
  { id: 'benzoic',  name: 'Benzoic Acid',       formula: 'C₆H₅COOH', type: 'weak_acid',   K_val: 6.30e-5, pK_val: 4.20,  description: 'Aromatic carboxylic preservative' },
  { id: 'nh3',      name: 'Ammonia',            formula: 'NH₃',      type: 'weak_base',   K_val: 1.80e-5, pK_val: 4.74,  description: 'Standard volatile amine weak base' },
  { id: 'pyridine', name: 'Pyridine',           formula: 'C₅H₅N',    type: 'weak_base',   K_val: 1.70e-9, pK_val: 8.77,  description: 'Weak heterocyclic aromatic organic base' },
  { id: 'methylamine', name: 'Methylamine',     formula: 'CH₃NH₂',   type: 'weak_base',   K_val: 4.40e-4, pK_val: 3.36,  description: 'Primary aliphatic amine base' }
];

export interface IndicatorState {
  name: string;
  colorName: string;
  hexCode: string;
  stateText: string;
}

/**
 * Normalizes user input handling commas, trailing spaces, and exponential notations (e.g. 1,8e-5).
 */
export function parseScientificNumber(val: string | number): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const clean = val.toString().replace(',', '.').trim();
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats small numbers into standard HTML exponential superscripts (e.g., 1.80 × 10⁻⁵).
 */
export function formatExponentialHtml(num: number, digits: number = 3): string {
  if (!Number.isFinite(num) || num === 0) return '0';
  if (Math.abs(num) >= 0.01 && Math.abs(num) < 1000) {
    return num.toFixed(digits);
  }
  const expStr = num.toExponential(digits);
  const parts = expStr.split('e');
  return `${parseFloat(parts[0]).toFixed(digits)} &times; 10<sup>${parseInt(parts[1], 10)}</sup>`;
}

/**
 * Formats values for pure LaTeX report blocks.
 */
export function formatLatexNumber(num: number, digits: number = 3): string {
  if (!Number.isFinite(num) || num === 0) return '0';
  if (Math.abs(num) >= 0.01 && Math.abs(num) < 1000) {
    return num.toFixed(digits);
  }
  const expStr = num.toExponential(digits);
  const parts = expStr.split('e');
  return `${parseFloat(parts[0]).toFixed(digits)} \\times 10^{${parseInt(parts[1], 10)}}`;
}

export interface CircularPhState {
  ph: number;
  poh: number;
  hConc: number; // mol/L
  ohConc: number; // mol/L
  pKw: number;
  Kw: number;
  neutralPH: number;
  universalColor: string;
  universalHex: string;
  indicators: IndicatorState[];
}

/**
 * Evaluates indicator colors corresponding to an exact pH value.
 */
export function getIndicatorStates(ph: number): IndicatorState[] {
  // Phenolphthalein (8.2 - 10.0)
  let phph: IndicatorState = { name: 'Phenolphthalein', colorName: 'Colorless', hexCode: '#f8fafc', stateText: 'Colorless (Acidic / Neutral)' };
  if (ph > 10.0) {
    phph = { name: 'Phenolphthalein', colorName: 'Vibrant Magenta', hexCode: '#e11d48', stateText: 'Deep Pink / Magenta (Basic)' };
  } else if (ph >= 8.2) {
    phph = { name: 'Phenolphthalein', colorName: 'Faint Pale Pink', hexCode: '#fda4af', stateText: 'Transition Pale Pink' };
  }

  // Bromothymol Blue (6.0 - 7.6)
  let btb: IndicatorState = { name: 'Bromothymol Blue', colorName: 'Yellow', hexCode: '#eab308', stateText: 'Yellow (pH < 6.0)' };
  if (ph > 7.6) {
    btb = { name: 'Bromothymol Blue', colorName: 'Deep Blue', hexCode: '#2563eb', stateText: 'Blue (pH > 7.6)' };
  } else if (ph >= 6.0) {
    btb = { name: 'Bromothymol Blue', colorName: 'Emerald Green', hexCode: '#10b981', stateText: 'Green (Neutral Transition)' };
  }

  // Methyl Orange (3.1 - 4.4)
  let mo: IndicatorState = { name: 'Methyl Orange', colorName: 'Red', hexCode: '#ef4444', stateText: 'Red (pH < 3.1)' };
  if (ph > 4.4) {
    mo = { name: 'Methyl Orange', colorName: 'Yellow', hexCode: '#facc15', stateText: 'Yellow (pH > 4.4)' };
  } else if (ph >= 3.1) {
    mo = { name: 'Methyl Orange', colorName: 'Orange', hexCode: '#f97316', stateText: 'Orange (Transition)' };
  }

  return [phph, btb, mo];
}

/**
 * Maps universal indicator pH spectrum to hex color codes.
 */
export function getUniversalIndicatorHex(ph: number): { name: string; hex: string } {
  if (ph <= 1)  return { name: 'Cherry Red', hex: '#dc2626' };
  if (ph <= 2)  return { name: 'Bright Red', hex: '#ef4444' };
  if (ph <= 3)  return { name: 'Orange-Red', hex: '#f97316' };
  if (ph <= 4)  return { name: 'Deep Orange', hex: '#fb923c' };
  if (ph <= 5)  return { name: 'Yellow-Orange', hex: '#f59e0b' };
  if (ph <= 6)  return { name: 'Yellow', hex: '#eab308' };
  if (ph <= 7.2) return { name: 'Neutral Green', hex: '#22c55e' };
  if (ph <= 8)  return { name: 'Teal Green', hex: '#14b8a6' };
  if (ph <= 9)  return { name: 'Cyan Blue', hex: '#06b6d4' };
  if (ph <= 10) return { name: 'Cobalt Blue', hex: '#3b82f6' };
  if (ph <= 11) return { name: 'Navy Blue', hex: '#1d4ed8' };
  if (ph <= 12) return { name: 'Violet', hex: '#6366f1' };
  if (ph <= 13) return { name: 'Purple', hex: '#7c3aed' };
  return { name: 'Deep Indigo', hex: '#4c1d95' };
}

/**
 * 4-Way Circular Rebalancing Engine:
 * Synchronizes pH, pOH, [H+], and [OH-] simultaneously for any updated input.
 */
export function solvePhFourWay(
  source: 'ph' | 'poh' | 'h' | 'oh',
  val: number,
  tempC: number = 25
): CircularPhState {
  const kwEntry = WATER_KW_DATA[tempC] || WATER_KW_DATA[25];
  const Kw = kwEntry.Kw;
  const pKw = kwEntry.pKw;

  let ph = 7;
  let poh = 7;
  let hConc = 1e-7;
  let ohConc = 1e-7;

  if (source === 'ph') {
    ph = Math.max(-2, Math.min(16, val));
    poh = pKw - ph;
    hConc = Math.pow(10, -ph);
    ohConc = Kw / hConc;
  } else if (source === 'poh') {
    poh = Math.max(-2, Math.min(16, val));
    ph = pKw - poh;
    ohConc = Math.pow(10, -poh);
    hConc = Kw / ohConc;
  } else if (source === 'h') {
    hConc = Math.max(1e-16, val);
    ph = -Math.log10(hConc);
    poh = pKw - ph;
    ohConc = Kw / hConc;
  } else if (source === 'oh') {
    ohConc = Math.max(1e-16, val);
    poh = -Math.log10(ohConc);
    ph = pKw - poh;
    hConc = Kw / ohConc;
  }

  const universal = getUniversalIndicatorHex(ph);
  const indicators = getIndicatorStates(ph);

  return {
    ph,
    poh,
    hConc,
    ohConc,
    pKw,
    Kw,
    neutralPH: kwEntry.neutralPH,
    universalColor: universal.name,
    universalHex: universal.hex,
    indicators
  };
}

export interface EquilibriumResult {
  ph: number;
  poh: number;
  hConc: number;
  ohConc: number;
  alphaPercent: number; // Degree of dissociation %
  isApproximationValid: boolean; // 5% rule check
  approxAlphaPercent: number; // What the shortcut yields
  approxErrorPercent: number; // Quantified error introduced by 5% assumption
  solutionClassification: 'Strongly Acidic' | 'Weakly Acidic' | 'Neutral' | 'Weakly Basic' | 'Strongly Basic';
  latexIceBlock: string;
  benchtopExplanation: string;
}

/**
 * Exact Quadratic Analytical Equilibrium Engine:
 * Computes exact roots without assuming x << C.
 * For weak acid: x^2 + Ka*x - Ka*C = 0 => x = (-Ka + sqrt(Ka^2 + 4*Ka*C)) / 2
 * For weak base: x^2 + Kb*x - Kb*C = 0 => x = (-Kb + sqrt(Kb^2 + 4*Kb*C)) / 2
 */
export function solveEquilibrium(
  type: AcidBaseClass,
  concentrationM: number,
  K_val: number,
  tempC: number = 25
): EquilibriumResult {
  const kwEntry = WATER_KW_DATA[tempC] || WATER_KW_DATA[25];
  const Kw = kwEntry.Kw;
  const pKw = kwEntry.pKw;
  const C = Math.max(0, concentrationM);

  let hConc = 1e-7;
  let ohConc = 1e-7;
  let alpha = 0;
  let approxAlpha = 0;
  let approxValid = true;
  let approxError = 0;
  let latexBlock = '';
  let explanation = '';

  if (type === 'strong_acid') {
    hConc = C;
    ohConc = Kw / (hConc > 0 ? hConc : 1e-14);
    alpha = 100;
    approxAlpha = 100;
    approxValid = true;
    latexBlock = `\\begin{aligned}
      \\text{Strong Acid: } &[\\text{HA}] \\rightarrow [\\text{H}^+] + [\\text{A}^-] \\\\
      [\\text{H}^+] &= C_0 = ${formatLatexNumber(C)}\\text{ M} \\\\
      \\text{pH} &= -\\log_{10}[\\text{H}^+] = ${(-Math.log10(hConc > 0 ? hConc : 1e-14)).toFixed(3)}
    \\end{aligned}`;
    explanation = `100% complete ionization. [H⁺] equals analytical acid concentration (${C.toFixed(4)} M).`;
  } else if (type === 'strong_base') {
    ohConc = C;
    hConc = Kw / (ohConc > 0 ? ohConc : 1e-14);
    alpha = 100;
    approxAlpha = 100;
    approxValid = true;
    const pohVal = -Math.log10(ohConc > 0 ? ohConc : 1e-14);
    latexBlock = `\\begin{aligned}
      \\text{Strong Base: } &[\\text{BOH}] \\rightarrow [\\text{B}^+] + [\\text{OH}^-] \\\\
      [\\text{OH}^-] &= C_0 = ${formatLatexNumber(C)}\\text{ M} \\\\
      \\text{pOH} &= -\\log_{10}[\\text{OH}^-] = ${pohVal.toFixed(3)} \\\\
      \\text{pH} &= \\text{pK}_w - \\text{pOH} = ${(pKw - pohVal).toFixed(3)}
    \\end{aligned}`;
    explanation = `100% complete ionization. [OH⁻] equals analytical base concentration (${C.toFixed(4)} M).`;
  } else if (type === 'weak_acid') {
    const Ka = Math.max(1e-16, K_val);
    // Exact analytical root: x^2 + Ka*x - Ka*C = 0
    const discriminant = Math.pow(Ka, 2) + 4 * Ka * C;
    hConc = (-Ka + Math.sqrt(discriminant)) / 2;
    ohConc = Kw / hConc;
    alpha = C > 0 ? (hConc / C) * 100 : 0;

    // What the 5% approximation shortcut assumes: x = sqrt(Ka * C)
    const approxRoot = Math.sqrt(Ka * C);
    approxAlpha = C > 0 ? (approxRoot / C) * 100 : 0;
    approxValid = alpha <= 5.0;
    approxError = Math.abs((approxRoot - hConc) / hConc) * 100;

    latexBlock = `\\begin{aligned}
      \\text{ICE Equilibrium: } &K_a = \\frac{x^2}{C_0 - x} \\implies x^2 + K_a x - K_a C_0 = 0 \\\\
      x = [\\text{H}^+] &= \\frac{-K_a + \\sqrt{K_a^2 + 4K_a C_0}}{2} = ${formatLatexNumber(hConc)}\\text{ M} \\\\
      \\text{Dissociation (}\\alpha\\text{)} &= \\frac{[\\text{H}^+]}{C_0} \\times 100\\% = ${alpha.toFixed(2)}\\% \\\\
      \\text{5\\% Rule Verdict: } &${approxValid ? '\\text{Valid (}\\alpha \\le 5\\%\\text{)}' : '\\text{INVALID (}\\alpha > 5\\%\\text{, exact quadratic required)}'}
    \\end{aligned}`;

    explanation = approxValid
      ? `Degree of ionization is ${alpha.toFixed(2)}% (≤ 5%). The simplified shortcut x = √(Ka·C) holds with only a ${approxError.toFixed(2)}% discrepancy.`
      : `Degree of ionization is ${alpha.toFixed(2)}% (> 5%). The simplified shortcut x = √(Ka·C) FAILS by ${approxError.toFixed(1)}% error. The exact quadratic root is required.`;
  } else if (type === 'weak_base') {
    const Kb = Math.max(1e-16, K_val);
    // Exact analytical root: x^2 + Kb*x - Kb*C = 0
    const discriminant = Math.pow(Kb, 2) + 4 * Kb * C;
    ohConc = (-Kb + Math.sqrt(discriminant)) / 2;
    hConc = Kw / ohConc;
    alpha = C > 0 ? (ohConc / C) * 100 : 0;

    const approxRoot = Math.sqrt(Kb * C);
    approxAlpha = C > 0 ? (approxRoot / C) * 100 : 0;
    approxValid = alpha <= 5.0;
    approxError = Math.abs((approxRoot - ohConc) / ohConc) * 100;

    latexBlock = `\\begin{aligned}
      \\text{ICE Equilibrium: } &K_b = \\frac{x^2}{C_0 - x} \\implies x^2 + K_b x - K_b C_0 = 0 \\\\
      x = [\\text{OH}^-] &= \\frac{-K_b + \\sqrt{K_b^2 + 4K_b C_0}}{2} = ${formatLatexNumber(ohConc)}\\text{ M} \\\\
      \\text{Dissociation (}\\alpha\\text{)} &= \\frac{[\\text{OH}^-]}{C_0} \\times 100\\% = ${alpha.toFixed(2)}\\% \\\\
      \\text{5\\% Rule Verdict: } &${approxValid ? '\\text{Valid (}\\alpha \\le 5\\%\\text{)}' : '\\text{INVALID (}\\alpha > 5\\%\\text{, exact quadratic required)}'}
    \\end{aligned}`;

    explanation = approxValid
      ? `Degree of ionization is ${alpha.toFixed(2)}% (≤ 5%). The simplified shortcut x = √(Kb·C) holds with only a ${approxError.toFixed(2)}% discrepancy.`
      : `Degree of ionization is ${alpha.toFixed(2)}% (> 5%). The simplified shortcut x = √(Kb·C) FAILS by ${approxError.toFixed(1)}% error. The exact quadratic root is required.`;
  }

  const ph = -Math.log10(hConc > 0 ? hConc : 1e-14);
  const poh = pKw - ph;

  let solutionClassification: EquilibriumResult['solutionClassification'] = 'Neutral';
  if (ph < 3.0) solutionClassification = 'Strongly Acidic';
  else if (ph < kwEntry.neutralPH - 0.05) solutionClassification = 'Weakly Acidic';
  else if (ph <= kwEntry.neutralPH + 0.05) solutionClassification = 'Neutral';
  else if (ph <= 11.0) solutionClassification = 'Weakly Basic';
  else solutionClassification = 'Strongly Basic';

  return {
    ph,
    poh,
    hConc,
    ohConc,
    alphaPercent: alpha,
    isApproximationValid: approxValid,
    approxAlphaPercent: approxAlpha,
    approxErrorPercent: approxError,
    solutionClassification,
    latexIceBlock: latexBlock,
    benchtopExplanation: explanation
  };
}