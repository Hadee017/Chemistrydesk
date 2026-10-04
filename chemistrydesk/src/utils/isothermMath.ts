/**
 * src/utils/isothermMath.ts
 * ChemistryDesk Adsorption Isotherm Calculation Core
 * 
 * Pure mathematical routines:
 * 1. Batch mass balance conversion: qe = ((C0 - Ce) * V) / m
 * 2. Langmuir Isotherm (Linear Type 1 + Non-linear SSE + RL curve)
 * 3. Freundlich Isotherm (Log-Log linear + n heterogeneity index)
 * 4. Temkin Isotherm (Heat of sorption B + binding constant AT)
 * 5. Dubinin-Radushkevich Isotherm (Mean free energy E [kJ/mol] mechanism)
 * 6. Statistical diagnostics: R², Adjusted R², RMSE, Reduced Chi-Square (χ²)
 */

export interface IsothermPoint {
  id: string;
  c0?: number;     // Initial concentration
  ce: number;      // Equilibrium concentration (x-axis)
  qe: number;      // Adsorbent uptake at equilibrium (y-axis)
  v?: number;      // Volume in Liters
  m?: number;      // Mass in grams
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  adjR2: number;
}

export interface ModelFitResult {
  modelName: 'Langmuir' | 'Freundlich' | 'Temkin' | 'Dubinin-Radushkevich';
  r2: number;
  adjR2: number;
  rmse: number;
  chiSquare: number;
  parameters: Record<string, { value: number; unit: string; label: string }>;
  predictQe: (ce: number) => number;
  diagnosticVerdict: string;
}

export interface IsothermTournamentResult {
  bestModel: string;
  bestR2: number;
  adsorptionMechanism: string;
  langmuir: ModelFitResult;
  freundlich: ModelFitResult;
  temkin: ModelFitResult;
  dubininRadushkevich: ModelFitResult;
  rlCurve: Array<{ c0: number; rl: number; status: 'Favorable' | 'Unfavorable' | 'Linear' | 'Irreversible' }>;
}

// -------------------------------------------------------------
// 1. INPUT NORMALIZATION & FLOATING-POINT VALIDATION
// -------------------------------------------------------------

export function parseCleanNumber(input: string | number): number {
  if (typeof input === 'number') return isFinite(input) ? input : 0;
  if (!input) return 0;
  const clean = input.toString().trim().replace(',', '.');
  const val = parseFloat(clean);
  return isFinite(val) ? val : 0;
}

export function convertVolumeToLiters(vol: number, unit: 'L' | 'mL' | 'uL'): number {
  if (unit === 'mL') return vol / 1000;
  if (unit === 'uL') return vol / 1000000;
  return vol;
}

export function convertMassToGrams(mass: number, unit: 'g' | 'mg' | 'kg'): number {
  if (unit === 'mg') return mass / 1000;
  if (unit === 'kg') return mass * 1000;
  return mass;
}

export function calculateBatchQe(c0: number, ce: number, vLiters: number, mGrams: number): number {
  if (mGrams <= 0) return 0;
  const deltaC = c0 - ce;
  if (deltaC < 0) return 0;
  return (deltaC * vLiters) / mGrams;
}

// -------------------------------------------------------------
// 2. LINEAR REGRESSION & ERROR METRICS
// -------------------------------------------------------------

export function runLinearRegression(x: number[], y: number[]): LinearRegressionResult {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0, adjR2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const denominator = (n * sumX2 - sumX * sumX);
  if (Math.abs(denominator) < 1e-12) {
    return { slope: 0, intercept: 0, r2: 0, adjR2: 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const ssTotal = sumY2 - (sumY * sumY) / n;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += Math.pow(y[i] - yPred, 2);
  }

  let r2 = ssTotal > 0 ? 1 - (ssRes / ssTotal) : 0;
  if (r2 < 0 || isNaN(r2)) r2 = 0;
  if (r2 > 1) r2 = 1;

  const adjR2 = n > 2 ? 1 - ((1 - r2) * (n - 1)) / (n - 2) : r2;

  return { slope, intercept, r2, adjR2 };
}

export function calculateNonlinearError(
  expCe: number[], 
  expQe: number[], 
  predictFn: (ce: number) => number,
  numParams: number = 2
): { rmse: number; chiSquare: number } {
  const n = expCe.length;
  if (n <= numParams) return { rmse: 0, chiSquare: 0 };

  let sse = 0;
  let chiSquareSum = 0;

  for (let i = 0; i < n; i++) {
    const qCalc = Math.max(predictFn(expCe[i]), 1e-6);
    const diff = expQe[i] - qCalc;
    sse += diff * diff;
    chiSquareSum += (diff * diff) / qCalc;
  }

  const rmse = Math.sqrt(sse / n);
  const reducedChiSquare = chiSquareSum / (n - numParams);

  return { 
    rmse: isFinite(rmse) ? rmse : 0, 
    chiSquare: isFinite(reducedChiSquare) ? reducedChiSquare : 0 
  };
}

// -------------------------------------------------------------
// 3. CORE ISOTHERM FITTING ROUTINES
// -------------------------------------------------------------

export function fitLangmuir(points: IsothermPoint[]): ModelFitResult {
  const valid = points.filter(p => p.ce > 0 && p.qe > 0);
  if (valid.length < 2) return getEmptyModelResult('Langmuir');

  const x = valid.map(p => p.ce);
  const y = valid.map(p => p.ce / p.qe);

  const reg = runLinearRegression(x, y);
  const qmax = reg.slope > 0 ? 1 / reg.slope : 0;
  const kL = (reg.slope > 0 && reg.intercept > 0) ? reg.slope / reg.intercept : 0;

  const predictQe = (ce: number) => {
    if (qmax <= 0 || kL <= 0 || ce <= 0) return 0;
    return (qmax * kL * ce) / (1 + kL * ce);
  };

  const err = calculateNonlinearError(valid.map(p => p.ce), valid.map(p => p.qe), predictQe, 2);

  return {
    modelName: 'Langmuir',
    r2: reg.r2,
    adjR2: reg.adjR2,
    rmse: err.rmse,
    chiSquare: err.chiSquare,
    parameters: {
      qmax: { value: qmax, unit: 'mg/g', label: 'Monolayer Maximum Capacity (qmax)' },
      kL: { value: kL, unit: 'L/mg', label: 'Langmuir Affinity Constant (KL)' }
    },
    predictQe,
    diagnosticVerdict: `Monolayer capacity of ${qmax.toFixed(2)} mg/g with affinity KL = ${kL.toFixed(4)} L/mg.`
  };
}

export function fitFreundlich(points: IsothermPoint[]): ModelFitResult {
  const valid = points.filter(p => p.ce > 0 && p.qe > 0);
  if (valid.length < 2) return getEmptyModelResult('Freundlich');

  const x = valid.map(p => Math.log(p.ce));
  const y = valid.map(p => Math.log(p.qe));

  const reg = runLinearRegression(x, y);
  const invN = reg.slope;
  const n = invN !== 0 ? 1 / invN : 0;
  const kF = Math.exp(reg.intercept);

  const predictQe = (ce: number) => {
    if (kF <= 0 || ce <= 0 || invN <= 0) return 0;
    return kF * Math.pow(ce, invN);
  };

  const err = calculateNonlinearError(valid.map(p => p.ce), valid.map(p => p.qe), predictQe, 2);

  const favorability = (n > 1 && n < 10) 
    ? 'Favorable heterogeneous adsorption (1 < n < 10)' 
    : (n === 1 ? 'Linear partition adsorption' : 'Unfavorable / poor intensity');

  return {
    modelName: 'Freundlich',
    r2: reg.r2,
    adjR2: reg.adjR2,
    rmse: err.rmse,
    chiSquare: err.chiSquare,
    parameters: {
      kF: { value: kF, unit: '(mg/g)(L/mg)^(1/n)', label: 'Freundlich Capacity Factor (KF)' },
      invN: { value: invN, unit: 'dimensionless', label: 'Heterogeneity Factor (1/n)' },
      n: { value: n, unit: 'dimensionless', label: 'Adsorption Intensity (n)' }
    },
    predictQe,
    diagnosticVerdict: `${favorability} with KF = ${kF.toFixed(3)} and n = ${n.toFixed(2)}.`
  };
}

export function fitTemkin(points: IsothermPoint[], tempKelvin: number = 298.15): ModelFitResult {
  const valid = points.filter(p => p.ce > 0 && p.qe > 0);
  if (valid.length < 2) return getEmptyModelResult('Temkin');

  const x = valid.map(p => Math.log(p.ce));
  const y = valid.map(p => p.qe);

  const reg = runLinearRegression(x, y);
  const B = reg.slope;
  const R = 8.31446;
  const bT = B > 0 ? (R * tempKelvin) / B : 0;
  const aT = B > 0 ? Math.exp(reg.intercept / B) : 0;

  const predictQe = (ce: number) => {
    if (B <= 0 || aT <= 0 || ce <= 0) return 0;
    const val = B * Math.log(Math.max(aT * ce, 1e-6));
    return Math.max(val, 0);
  };

  const err = calculateNonlinearError(valid.map(p => p.ce), valid.map(p => p.qe), predictQe, 2);

  return {
    modelName: 'Temkin',
    r2: reg.r2,
    adjR2: reg.adjR2,
    rmse: err.rmse,
    chiSquare: err.chiSquare,
    parameters: {
      aT: { value: aT, unit: 'L/mg', label: 'Temkin Equilibrium Binding Constant (AT)' },
      B: { value: B, unit: 'J/mol', label: 'Heat of Sorption Constant (B)' },
      bT: { value: bT / 1000, unit: 'kJ/mol', label: 'Temkin Energy Constant (bT)' }
    },
    predictQe,
    diagnosticVerdict: `Sorption heat B = ${B.toFixed(2)} J/mol; binding constant AT = ${aT.toFixed(3)} L/mg.`
  };
}

export function fitDubininRadushkevich(points: IsothermPoint[], tempKelvin: number = 298.15): ModelFitResult {
  const valid = points.filter(p => p.ce > 0 && p.qe > 0);
  if (valid.length < 2) return getEmptyModelResult('Dubinin-Radushkevich');

  const R = 8.31446;
  const x: number[] = [];
  const y: number[] = [];

  for (const p of valid) {
    const epsilon = R * tempKelvin * Math.log(1 + (1 / p.ce));
    x.push(Math.pow(epsilon, 2));
    y.push(Math.log(p.qe));
  }

  const reg = runLinearRegression(x, y);
  const qD = Math.exp(reg.intercept);
  const beta = -reg.slope;

  let E = 0;
  if (beta > 0) {
    E = 1 / Math.sqrt(2 * beta);
  }
  const EkJ = E / 1000;

  const predictQe = (ce: number) => {
    if (qD <= 0 || beta <= 0 || ce <= 0) return 0;
    const eps = R * tempKelvin * Math.log(1 + (1 / ce));
    return qD * Math.exp(-beta * Math.pow(eps, 2));
  };

  const err = calculateNonlinearError(valid.map(p => p.ce), valid.map(p => p.qe), predictQe, 2);

  let mechanism = 'Physical Adsorption (Physisorption, E < 8 kJ/mol)';
  if (EkJ >= 8 && EkJ <= 16) {
    mechanism = 'Ion-Exchange / Electrostatic Sorption (8 <= E <= 16 kJ/mol)';
  } else if (EkJ > 16) {
    mechanism = 'Chemical Adsorption (Chemisorption, E > 16 kJ/mol)';
  }

  return {
    modelName: 'Dubinin-Radushkevich',
    r2: reg.r2,
    adjR2: reg.adjR2,
    rmse: err.rmse,
    chiSquare: err.chiSquare,
    parameters: {
      qD: { value: qD, unit: 'mg/g', label: 'Theoretical Saturation Capacity (qD)' },
      beta: { value: beta, unit: 'mol²/J²', label: 'D-R Energy Activity Constant (β)' },
      E: { value: EkJ, unit: 'kJ/mol', label: 'Mean Free Energy of Adsorption (E)' }
    },
    predictQe,
    diagnosticVerdict: `${mechanism} with Mean Free Energy E = ${EkJ.toFixed(2)} kJ/mol.`
  };
}

// -------------------------------------------------------------
// 4. TOURNAMENT SOLVER & SEPARATION FACTOR (RL) ENGINE
// -------------------------------------------------------------

export function solveAdsorptionTournament(
  points: IsothermPoint[], 
  tempKelvin: number = 298.15
): IsothermTournamentResult {
  const langmuir = fitLangmuir(points);
  const freundlich = fitFreundlich(points);
  const temkin = fitTemkin(points, tempKelvin);
  const dubinin = fitDubininRadushkevich(points, tempKelvin);

  const models = [langmuir, freundlich, temkin, dubinin];
  models.sort((a, b) => b.r2 - a.r2);
  const best = models[0];

  const kL = langmuir.parameters.kL?.value || 0;
  const rlCurve: IsothermTournamentResult['rlCurve'] = [];

  points.forEach(p => {
    const c0 = p.c0 || p.ce;
    if (c0 > 0 && kL > 0) {
      const rl = 1 / (1 + kL * c0);
      let status: 'Favorable' | 'Unfavorable' | 'Linear' | 'Irreversible' = 'Favorable';
      if (rl === 0) status = 'Irreversible';
      else if (rl > 0 && rl < 1) status = 'Favorable';
      else if (rl === 1) status = 'Linear';
      else if (rl > 1) status = 'Unfavorable';
      rlCurve.push({ c0, rl, status });
    }
  });

  return {
    bestModel: best.modelName,
    bestR2: best.r2,
    adsorptionMechanism: dubinin.diagnosticVerdict,
    langmuir,
    freundlich,
    temkin,
    dubininRadushkevich: dubinin,
    rlCurve
  };
}

function getEmptyModelResult(name: any): ModelFitResult {
  return {
    modelName: name,
    r2: 0,
    adjR2: 0,
    rmse: 0,
    chiSquare: 0,
    parameters: {},
    predictQe: () => 0,
    diagnosticVerdict: 'Insufficient data points (minimum 2 valid data points required).'
  };
}