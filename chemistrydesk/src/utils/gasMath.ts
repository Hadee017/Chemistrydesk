/**
 * src/utils/gasMath.ts
 * Pure scientific calculation engine for Ideal & Real Gas Thermodynamics.
 * Decoupled from UI components for testability and zero-dependency execution.
 */

export const R_IDEAL_SI = 8.314462618; // J / (mol * K)  ==  Pa * m^3 / (mol * K)

// Supported Units
export type PressureUnit = 'atm' | 'bar' | 'kPa' | 'Pa' | 'psi' | 'torr';
export type VolumeUnit = 'L' | 'mL' | 'm3' | 'cm3';
export type TempUnit = 'C' | 'K' | 'F';
export type AmountUnit = 'mol' | 'mmol' | 'g' | 'mg' | 'kg';
export type SolveTarget = 'P' | 'V' | 'n' | 'T' | 'm';

export interface GasPreset {
  id: string;
  name: string;
  formula: string;
  molarMass: number; // g / mol
  vdw_a: number;    // bar * L^2 / mol^2
  vdw_b: number;    // L / mol
}

// Benchmark gas database with experimental Van der Waals constants
export const COMMON_GASES: Record<string, GasPreset> = {
  ideal: { id: 'ideal', name: 'Hypothetical Ideal Gas', formula: 'Ideal', molarMass: 28.97, vdw_a: 0.0, vdw_b: 0.0 },
  n2:    { id: 'n2',    name: 'Nitrogen',              formula: 'N₂',    molarMass: 28.0134, vdw_a: 1.370, vdw_b: 0.0387 },
  o2:    { id: 'o2',    name: 'Oxygen',                formula: 'O₂',    molarMass: 31.9988, vdw_a: 1.382, vdw_b: 0.0319 },
  co2:   { id: 'co2',   name: 'Carbon Dioxide',         formula: 'CO₂',   molarMass: 44.009,  vdw_a: 3.658, vdw_b: 0.0429 },
  ch4:   { id: 'ch4',   name: 'Methane',               formula: 'CH₄',   molarMass: 16.043,  vdw_a: 2.303, vdw_b: 0.0431 },
  he:    { id: 'he',    name: 'Helium',                formula: 'He',    molarMass: 4.0026,  vdw_a: 0.0346, vdw_b: 0.0238 },
  h2:    { id: 'h2',    name: 'Hydrogen',              formula: 'H₂',    molarMass: 2.016,   vdw_a: 0.245, vdw_b: 0.0265 },
  nh3:   { id: 'nh3',   name: 'Ammonia',               formula: 'NH₃',   molarMass: 17.031,  vdw_a: 4.225, vdw_b: 0.0371 },
  cl2:   { id: 'cl2',   name: 'Chlorine',              formula: 'Cl₂',   molarMass: 70.90,   vdw_a: 6.579, vdw_b: 0.0562 },
  h2o:   { id: 'h2o',   name: 'Water Vapor (Steam)',    formula: 'H₂O',   molarMass: 18.015,  vdw_a: 5.536, vdw_b: 0.0305 },
};

// Unit Conversion to SI Base (Pa, m^3, K, mol)
export function toPascals(value: number, unit: PressureUnit): number {
  switch (unit) {
    case 'atm':  return value * 101325;
    case 'bar':  return value * 100000;
    case 'kPa':  return value * 1000;
    case 'psi':  return value * 6894.75729;
    case 'torr': return value * 133.322368;
    case 'Pa':
    default:     return value;
  }
}

export function fromPascals(pascals: number, unit: PressureUnit): number {
  switch (unit) {
    case 'atm':  return pascals / 101325;
    case 'bar':  return pascals / 100000;
    case 'kPa':  return pascals / 1000;
    case 'psi':  return pascals / 6894.75729;
    case 'torr': return pascals / 133.322368;
    case 'Pa':
    default:     return pascals;
  }
}

export function toCubicMeters(value: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'L':   return value * 0.001;
    case 'mL':  return value * 1e-6;
    case 'cm3': return value * 1e-6;
    case 'm3':
    default:    return value;
  }
}

export function fromCubicMeters(m3: number, unit: VolumeUnit): number {
  switch (unit) {
    case 'L':   return m3 * 1000;
    case 'mL':  return m3 * 1e6;
    case 'cm3': return m3 * 1e6;
    case 'm3':
    default:    return m3;
  }
}

export function toKelvin(value: number, unit: TempUnit): number {
  switch (unit) {
    case 'C': return value + 273.15;
    case 'F': return (value - 32) * (5 / 9) + 273.15;
    case 'K':
    default:  return value;
  }
}

export function fromKelvin(kelvin: number, unit: TempUnit): number {
  switch (unit) {
    case 'C': return kelvin - 273.15;
    case 'F': return (kelvin - 273.15) * (9 / 5) + 32;
    case 'K':
    default:  return kelvin;
  }
}

export function toMoles(value: number, unit: AmountUnit, molarMass: number): number {
  switch (unit) {
    case 'mmol': return value / 1000;
    case 'g':    return molarMass > 0 ? value / molarMass : 0;
    case 'mg':   return molarMass > 0 ? (value / 1000) / molarMass : 0;
    case 'kg':   return molarMass > 0 ? (value * 1000) / molarMass : 0;
    case 'mol':
    default:     return value;
  }
}

export function fromMoles(moles: number, unit: AmountUnit, molarMass: number): number {
  switch (unit) {
    case 'mmol': return moles * 1000;
    case 'g':    return moles * molarMass;
    case 'mg':   return moles * molarMass * 1000;
    case 'kg':   return (moles * molarMass) / 1000;
    case 'mol':
    default:     return moles;
  }
}

export interface GasCalculationInput {
  solveFor: SolveTarget;
  P_val: number;
  P_unit: PressureUnit;
  V_val: number;
  V_unit: VolumeUnit;
  n_val: number;
  n_unit: AmountUnit;
  T_val: number;
  T_unit: TempUnit;
  molarMass: number; // g / mol
  vdw_a: number;     // bar * L^2 / mol^2
  vdw_b: number;     // L / mol
}

export interface GasCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  solvedValue: number;
  solvedUnit: string;
  // Standardized SI values for diagnostics
  P_Pa: number;
  V_m3: number;
  n_mol: number;
  T_K: number;
  // Target-aware Real Gas Output
  realSolvedValue?: number;
  realSolvedUnit: string;
  realSolvedLabel: string;
  realP_Pa?: number;
  compressibilityFactor_Z: number;
  density_g_L: number;
  densityFormatted: string;
  molarVolume_L_mol: number;
  percentNonIdeality: number;
  // Multi-unit equivalent readout map
  unitEquivalents: { label: string; val: string }[];
}

export function calculateGasSystem(inp: GasCalculationInput): GasCalculationResult {
  let P_Pa = toPascals(inp.P_val, inp.P_unit);
  let V_m3 = toCubicMeters(inp.V_val, inp.V_unit);
  let n_mol = toMoles(inp.n_val, inp.n_unit, inp.molarMass);
  let T_K = toKelvin(inp.T_val, inp.T_unit);
  const mm = inp.molarMass > 0 ? inp.molarMass : 28.97;

  // Validation Checks
  if (inp.solveFor !== 'T' && T_K <= 0) {
    return { isValid: false, errorMessage: 'Temperature must be above absolute zero (0 K).', solvedValue: 0, solvedUnit: '', P_Pa: 0, V_m3: 0, n_mol: 0, T_K: 0, realSolvedUnit: '', realSolvedLabel: '', compressibilityFactor_Z: 1, density_g_L: 0, densityFormatted: '0.000 g/L', molarVolume_L_mol: 0, percentNonIdeality: 0, unitEquivalents: [] };
  }
  if (inp.solveFor !== 'P' && P_Pa <= 0) {
    return { isValid: false, errorMessage: 'Pressure must be greater than zero.', solvedValue: 0, solvedUnit: '', P_Pa: 0, V_m3: 0, n_mol: 0, T_K: 0, realSolvedUnit: '', realSolvedLabel: '', compressibilityFactor_Z: 1, density_g_L: 0, densityFormatted: '0.000 g/L', molarVolume_L_mol: 0, percentNonIdeality: 0, unitEquivalents: [] };
  }
  if (inp.solveFor !== 'V' && V_m3 <= 0) {
    return { isValid: false, errorMessage: 'Volume must be greater than zero.', solvedValue: 0, solvedUnit: '', P_Pa: 0, V_m3: 0, n_mol: 0, T_K: 0, realSolvedUnit: '', realSolvedLabel: '', compressibilityFactor_Z: 1, density_g_L: 0, densityFormatted: '0.000 g/L', molarVolume_L_mol: 0, percentNonIdeality: 0, unitEquivalents: [] };
  }
  if (inp.solveFor !== 'n' && inp.solveFor !== 'm' && n_mol <= 0) {
    return { isValid: false, errorMessage: 'Quantity of gas must be greater than zero.', solvedValue: 0, solvedUnit: '', P_Pa: 0, V_m3: 0, n_mol: 0, T_K: 0, realSolvedUnit: '', realSolvedLabel: '', compressibilityFactor_Z: 1, density_g_L: 0, densityFormatted: '0.000 g/L', molarVolume_L_mol: 0, percentNonIdeality: 0, unitEquivalents: [] };
  }

  let solvedValue = 0;
  let solvedUnit = '';

  // Solve Ideal Gas Law: P * V = n * R * T
  switch (inp.solveFor) {
    case 'P':
      P_Pa = (n_mol * R_IDEAL_SI * T_K) / V_m3;
      solvedValue = fromPascals(P_Pa, inp.P_unit);
      solvedUnit = inp.P_unit;
      break;

    case 'V':
      V_m3 = (n_mol * R_IDEAL_SI * T_K) / P_Pa;
      solvedValue = fromCubicMeters(V_m3, inp.V_unit);
      solvedUnit = inp.V_unit;
      break;

    case 'n':
      n_mol = (P_Pa * V_m3) / (R_IDEAL_SI * T_K);
      solvedValue = fromMoles(n_mol, inp.n_unit, mm);
      solvedUnit = inp.n_unit;
      break;

    case 'm':
      n_mol = (P_Pa * V_m3) / (R_IDEAL_SI * T_K);
      solvedValue = n_mol * mm; // grams
      solvedUnit = 'g';
      break;

    case 'T':
      T_K = (P_Pa * V_m3) / (n_mol * R_IDEAL_SI);
      solvedValue = fromKelvin(T_K, inp.T_unit);
      solvedUnit = inp.T_unit === 'C' ? '°C' : inp.T_unit === 'F' ? '°F' : 'K';
      break;
  }

  // Real Gas Van der Waals Calculation:
  // (P + a*(n/V)^2) * (V - n*b) = n * R * T
  const a_SI = inp.vdw_a * 0.1; // bar*L^2/mol^2 -> Pa*m^6/mol^2
  const b_SI = inp.vdw_b * 1e-3; // L/mol -> m^3/mol

  let realP_Pa: number | undefined = undefined;
  let realSolvedValue: number | undefined = undefined;
  let realSolvedUnit = solvedUnit;
  let realSolvedLabel = 'Van der Waals Real Gas Output';
  let percentNonIdeality = 0;

  // Real Gas Target-Aware Resolution
  if (inp.solveFor === 'P') {
    if (V_m3 > n_mol * b_SI) {
      const term1 = (n_mol * R_IDEAL_SI * T_K) / (V_m3 - n_mol * b_SI);
      const term2 = (a_SI * Math.pow(n_mol, 2)) / Math.pow(V_m3, 2);
      realP_Pa = term1 - term2;
      realSolvedValue = fromPascals(realP_Pa, inp.P_unit);
      percentNonIdeality = Math.abs((realP_Pa - P_Pa) / P_Pa) * 100;
      realSolvedLabel = 'Van der Waals Real Pressure';
    }
  } else if (inp.solveFor === 'T') {
    // T_real = [ (P + an^2/V^2) * (V - nb) ] / (n * R)
    if (V_m3 > n_mol * b_SI) {
      const pEffective = P_Pa + (a_SI * Math.pow(n_mol, 2)) / Math.pow(V_m3, 2);
      const vEffective = V_m3 - n_mol * b_SI;
      const realT_K = (pEffective * vEffective) / (n_mol * R_IDEAL_SI);
      realSolvedValue = fromKelvin(realT_K, inp.T_unit);
      percentNonIdeality = Math.abs((realT_K - T_K) / T_K) * 100;
      realSolvedLabel = 'Van der Waals Real Temperature';
    }
  } else if (inp.solveFor === 'V') {
    // Real Volume cubic solve: V^3 - (nb + nRT/P)V^2 + (an^2/P)V - (a*b*n^3/P) = 0
    // Newton-Raphson approximation starting from ideal V
    let vGuess = V_m3;
    const RT_P = (R_IDEAL_SI * T_K) / P_Pa;
    const aP = a_SI / P_Pa;
    const n = n_mol;
    for (let iter = 0; iter < 12; iter++) {
      const f = Math.pow(vGuess, 3) - (n * b_SI + n * RT_P) * Math.pow(vGuess, 2) + (aP * Math.pow(n, 2)) * vGuess - (aP * b_SI * Math.pow(n, 3));
      const df = 3 * Math.pow(vGuess, 2) - 2 * (n * b_SI + n * RT_P) * vGuess + (aP * Math.pow(n, 2));
      if (Math.abs(df) < 1e-15) break;
      const vNext = vGuess - f / df;
      if (Math.abs(vNext - vGuess) < 1e-9) { vGuess = vNext; break; }
      vGuess = vNext;
    }
    if (vGuess > n_mol * b_SI) {
      realSolvedValue = fromCubicMeters(vGuess, inp.V_unit);
      percentNonIdeality = Math.abs((vGuess - V_m3) / V_m3) * 100;
      realSolvedLabel = 'Van der Waals Real Volume';
    }
  } else {
    // Moles / Mass target: provide real pressure deviation check
    if (V_m3 > n_mol * b_SI) {
      const term1 = (n_mol * R_IDEAL_SI * T_K) / (V_m3 - n_mol * b_SI);
      const term2 = (a_SI * Math.pow(n_mol, 2)) / Math.pow(V_m3, 2);
      realP_Pa = term1 - term2;
      percentNonIdeality = Math.abs((realP_Pa - P_Pa) / P_Pa) * 100;
      realSolvedLabel = 'Van der Waals Pressure Shift';
      realSolvedValue = fromPascals(realP_Pa, inp.P_unit);
      realSolvedUnit = inp.P_unit;
    }
  }

  // Diagnostics
  const Z = (P_Pa * V_m3) / (n_mol * R_IDEAL_SI * T_K);
  const V_L = V_m3 * 1000;
  const mass_g = n_mol * mm;
  const density_g_L = V_L > 0 ? mass_g / V_L : 0;
  const molarVolume_L_mol = n_mol > 0 ? V_L / n_mol : 0;

  // Adaptive Non-Truncating Density String
  let densityFormatted = '0.000 g/L';
  if (density_g_L > 0 && density_g_L < 0.001) {
    densityFormatted = density_g_L.toExponential(3) + ' g/L';
  } else if (density_g_L >= 1000) {
    densityFormatted = density_g_L.toFixed(1) + ' g/L';
  } else {
    densityFormatted = density_g_L.toFixed(3) + ' g/L';
  }

  // Multi-unit equivalent readouts
  const unitEquivalents: { label: string; val: string }[] = [];
  if (inp.solveFor === 'P') {
    unitEquivalents.push({ label: 'atm', val: fromPascals(P_Pa, 'atm').toFixed(3) });
    unitEquivalents.push({ label: 'bar', val: fromPascals(P_Pa, 'bar').toFixed(3) });
    unitEquivalents.push({ label: 'kPa', val: fromPascals(P_Pa, 'kPa').toFixed(2) });
    unitEquivalents.push({ label: 'Torr', val: fromPascals(P_Pa, 'torr').toFixed(1) });
    unitEquivalents.push({ label: 'psi', val: fromPascals(P_Pa, 'psi').toFixed(2) });
  } else if (inp.solveFor === 'T') {
    unitEquivalents.push({ label: 'K', val: T_K.toFixed(2) });
    unitEquivalents.push({ label: '°C', val: fromKelvin(T_K, 'C').toFixed(2) });
    unitEquivalents.push({ label: '°F', val: fromKelvin(T_K, 'F').toFixed(2) });
  } else if (inp.solveFor === 'V') {
    unitEquivalents.push({ label: 'L', val: (V_m3 * 1000).toFixed(3) });
    unitEquivalents.push({ label: 'mL', val: (V_m3 * 1e6).toFixed(1) });
    unitEquivalents.push({ label: 'm³', val: V_m3.toExponential(4) });
  } else if (inp.solveFor === 'n' || inp.solveFor === 'm') {
    unitEquivalents.push({ label: 'mol', val: n_mol.toFixed(4) });
    unitEquivalents.push({ label: 'mmol', val: (n_mol * 1000).toFixed(2) });
    unitEquivalents.push({ label: 'grams (m)', val: (n_mol * mm).toFixed(3) });
  }

  return {
    isValid: true,
    solvedValue,
    solvedUnit,
    P_Pa,
    V_m3,
    n_mol,
    T_K,
    realSolvedValue,
    realSolvedUnit,
    realSolvedLabel,
    realP_Pa,
    compressibilityFactor_Z: Z,
    density_g_L,
    densityFormatted,
    molarVolume_L_mol,
    percentNonIdeality,
    unitEquivalents
  };
}

/**
 * Two-State Combined Gas Law Solver (P1*V1/T1 = P2*V2/T2)
 * Supports Boyle's, Charles's, and Gay-Lussac's conditions.
 */
export type TwoStateTarget = 'P2' | 'V2' | 'T2';

export interface TwoStateInput {
  target: TwoStateTarget;
  P1: number; P1_unit: PressureUnit;
  V1: number; V1_unit: VolumeUnit;
  T1: number; T1_unit: TempUnit;
  P2?: number; P2_unit: PressureUnit;
  V2?: number; V2_unit: VolumeUnit;
  T2?: number; T2_unit: TempUnit;
}

export function solveTwoStateGas(inp: TwoStateInput): { val: number; unit: string; lawName: string } {
  const p1 = toPascals(inp.P1, inp.P1_unit);
  const v1 = toCubicMeters(inp.V1, inp.V1_unit);
  const t1 = toKelvin(inp.T1, inp.T1_unit);

  let p2 = inp.P2 !== undefined ? toPascals(inp.P2, inp.P2_unit) : 0;
  let v2 = inp.V2 !== undefined ? toCubicMeters(inp.V2, inp.V2_unit) : 0;
  let t2 = inp.T2 !== undefined ? toKelvin(inp.T2, inp.T2_unit) : 0;

  let lawName = 'Combined Gas Law';
  if (t1 === t2) lawName = "Boyle's Law (Isothermal: P₁V₁ = P₂V₂)";
  else if (p1 === p2) lawName = "Charles's Law (Isobaric: V₁/T₁ = V₂/T₂)";
  else if (v1 === v2) lawName = "Gay-Lussac's Law (Isochoric: P₁/T₁ = P₂/T₂)";

  let solved = 0;
  let unit = '';

  if (inp.target === 'P2') {
    // P2 = (P1 * V1 * T2) / (T1 * V2)
    const p2_Pa = (p1 * v1 * t2) / (t1 * v2);
    solved = fromPascals(p2_Pa, inp.P2_unit);
    unit = inp.P2_unit;
  } else if (inp.target === 'V2') {
    // V2 = (P1 * V1 * T2) / (T1 * P2)
    const v2_m3 = (p1 * v1 * t2) / (t1 * p2);
    solved = fromCubicMeters(v2_m3, inp.V2_unit);
    unit = inp.V2_unit;
  } else if (inp.target === 'T2') {
    // T2 = (P2 * V2 * T1) / (P1 * V1)
    const t2_K = (p2 * v2 * t1) / (p1 * v1);
    solved = fromKelvin(t2_K, inp.T2_unit);
    unit = inp.T2_unit === 'C' ? '°C' : inp.T2_unit === 'F' ? '°F' : 'K';
  }

  return { val: solved, unit, lawName };
}

/**
 * Generate points for the live P vs V Isotherm SVG curve
 */
export function generateIsothermPoints(n_mol: number, T_K: number, currentV_L: number): { v: number; p_ideal: number }[] {
  const points: { v: number; p_ideal: number }[] = [];
  const minV = Math.max(0.5, currentV_L * 0.2);
  const maxV = Math.max(10, currentV_L * 2.5);
  const steps = 30;
  const stepSize = (maxV - minV) / steps;

  for (let i = 0; i <= steps; i++) {
    const v_L = minV + i * stepSize;
    const v_m3 = v_L * 1e-3;
    const p_Pa = (n_mol * R_IDEAL_SI * T_K) / v_m3;
    const p_atm = p_Pa / 101325;
    points.push({ v: v_L, p_ideal: p_atm });
  }

  return points;
}