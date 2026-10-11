/**
 * src/utils/sigFigMath.ts
 * Pure mathematical core for Significant Figures counting, rounding,
 * visual digit anatomy classification, and multi-step expression evaluation.
 * Decoupled from UI elements for 100% testable, zero-latency client execution.
 */

export type DigitRole = 
  | 'leading_zero' 
  | 'captive_zero' 
  | 'trailing_zero_significant' 
  | 'trailing_zero_insignificant' 
  | 'nonzero_significant' 
  | 'decimal_point' 
  | 'sign' 
  | 'exponent';

export interface DigitDetail {
  char: string;
  role: DigitRole;
  isSignificant: boolean;
  explanation: string;
  colorHex: string;
}

export interface SigFigCountResult {
  rawInput: string;
  normalizedInput: string;
  totalSigFigs: number;
  digits: DigitDetail[];
  decimalsCount: number;
  scientificNotation: string;
  engineeringNotation: string;
  eNotation: string;
  firstSigDigitIndex: number;
  lastSigDigitIndex: number;
  rulesApplied: string[];
  isValid: boolean;
  errorMessage?: string;
}

export interface ArithmeticStep {
  description: string;
  rawIntermediate: number;
  intermediateRule: 'addition_subtraction' | 'multiplication_division';
  limitingFactor: string;
  intermediateRounded: string;
  sigFigs: number;
}

export interface ArithmeticResult {
  expression: string;
  exactValue: number;
  roundedValue: string;
  sigFigs: number;
  decimalPlaces: number;
  steps: ArithmeticStep[];
  scientificNotation: string;
  homeworkExplanation: string;
  latexBlock: string;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Normalizes input: handles comma/dot decimals, trim spaces.
 */
export function normalizeNumberString(str: string): string {
  if (!str) return '';
  return str.trim().replace(',', '.');
}

/**
 * Counts significant figures and categorizes every single character for the Visual Digit Anatomy bar.
 */
export function analyzeSigFigs(input: string): SigFigCountResult {
  const norm = normalizeNumberString(input);

  if (!norm) {
    return {
      rawInput: input,
      normalizedInput: '',
      totalSigFigs: 0,
      digits: [],
      decimalsCount: 0,
      scientificNotation: '',
      engineeringNotation: '',
      eNotation: '',
      firstSigDigitIndex: -1,
      lastSigDigitIndex: -1,
      rulesApplied: [],
      isValid: false,
      errorMessage: 'Please enter a valid number (e.g., 0.005020, 1200, 4.50e-3).'
    };
  }

  // Handle scientific notation e.g. 1.20e-4 or 1.20 * 10^-4
  let mantissaStr = norm;
  let exponentVal = 0;
  const sciMatch = norm.match(/^([+-]?[\d\.]+)[eE]([+-]?\d+)$/);
  if (sciMatch) {
    mantissaStr = sciMatch[1];
    exponentVal = parseInt(sciMatch[2], 10);
  }

  // Basic numeric validation
  const numCheck = parseFloat(mantissaStr);
  if (isNaN(numCheck) || !/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(mantissaStr)) {
    return {
      rawInput: input,
      normalizedInput: norm,
      totalSigFigs: 0,
      digits: [],
      decimalsCount: 0,
      scientificNotation: '',
      engineeringNotation: '',
      eNotation: '',
      firstSigDigitIndex: -1,
      lastSigDigitIndex: -1,
      rulesApplied: [],
      isValid: false,
      errorMessage: `"${input}" is not a valid recognized real number.`
    };
  }

  const hasDecimal = mantissaStr.includes('.');
  const rulesApplied: string[] = [];
  const digits: DigitDetail[] = [];

  // Break mantissa down character by character
  const cleanMantissa = mantissaStr.startsWith('+') || mantissaStr.startsWith('-') 
    ? mantissaStr.slice(1) 
    : mantissaStr;

  const signChar = mantissaStr.startsWith('+') || mantissaStr.startsWith('-') ? mantissaStr[0] : '';
  if (signChar) {
    digits.push({
      char: signChar,
      role: 'sign',
      isSignificant: false,
      explanation: 'Signs (+/-) do not carry significance in measurement counting.',
      colorHex: '#64748b'
    });
  }

  // Determine positions of non-zero digits
  let firstNonZeroIndex = -1;
  let lastNonZeroIndex = -1;

  for (let i = 0; i < cleanMantissa.length; i++) {
    const ch = cleanMantissa[i];
    if (ch >= '1' && ch <= '9') {
      if (firstNonZeroIndex === -1) firstNonZeroIndex = i;
      lastNonZeroIndex = i;
    }
  }

  // Case: The number is purely zero (e.g., "0", "0.0", "0.000")
  if (firstNonZeroIndex === -1) {
    if (hasDecimal) {
      rulesApplied.push('Zeros to the right of the decimal point are significant if preceded by zero or decimal.');
      for (let i = 0; i < cleanMantissa.length; i++) {
        const ch = cleanMantissa[i];
        if (ch === '.') {
          digits.push({
            char: '.',
            role: 'decimal_point',
            isSignificant: false,
            explanation: 'Decimal separator establishes precision place value.',
            colorHex: '#94a3b8'
          });
        } else {
          // In standard convention, 0.0 has 1 or 2 sig figs depending on context; standard chemistry treats 0.00 as 2/3 decimals, but standalone 0 is 1.
          const isSig = i > cleanMantissa.indexOf('.');
          digits.push({
            char: ch,
            role: isSig ? 'trailing_zero_significant' : 'leading_zero',
            isSignificant: isSig,
            explanation: isSig ? 'Trailing zero in decimal indicates measurement precision.' : 'Leading zero acts as a place-holder.',
            colorHex: isSig ? '#f59e0b' : '#94a3b8'
          });
        }
      }
    } else {
      rulesApplied.push('A single zero without a decimal has 1 significant figure.');
      digits.push({
        char: '0',
        role: 'trailing_zero_significant',
        isSignificant: true,
        explanation: 'Single zero represents a counted/measured zero value.',
        colorHex: '#f59e0b'
      });
    }

    const sigCount = digits.filter(d => d.isSignificant).length;
    return {
      rawInput: input,
      normalizedInput: norm,
      totalSigFigs: Math.max(1, sigCount),
      digits,
      decimalsCount: hasDecimal ? cleanMantissa.length - 1 - cleanMantissa.indexOf('.') : 0,
      scientificNotation: '0',
      engineeringNotation: '0',
      eNotation: '0',
      firstSigDigitIndex: 0,
      lastSigDigitIndex: 0,
      rulesApplied,
      isValid: true
    };
  }

  // Standard Non-Zero Number Analysis
  rulesApplied.push('All non-zero digits (1-9) are always significant.');

  let sigCount = 0;
  for (let i = 0; i < cleanMantissa.length; i++) {
    const ch = cleanMantissa[i];

    if (ch === '.') {
      digits.push({
        char: '.',
        role: 'decimal_point',
        isSignificant: false,
        explanation: 'Decimal separator establishing place value.',
        colorHex: '#64748b'
      });
      continue;
    }

    if (ch >= '1' && ch <= '9') {
      sigCount++;
      digits.push({
        char: ch,
        role: 'nonzero_significant',
        isSignificant: true,
        explanation: `Non-zero digit (${ch}) is inherently significant.`,
        colorHex: '#0284c7'
      });
    } else if (ch === '0') {
      if (i < firstNonZeroIndex) {
        // Leading zero
        digits.push({
          char: '0',
          role: 'leading_zero',
          isSignificant: false,
          explanation: 'Leading zero before the first non-zero digit is never significant (placeholder).',
          colorHex: '#94a3b8'
        });
      } else if (i > firstNonZeroIndex && i < lastNonZeroIndex) {
        // Captive zero
        sigCount++;
        digits.push({
          char: '0',
          role: 'captive_zero',
          isSignificant: true,
          explanation: 'Captive zero trapped between two non-zero digits is always significant.',
          colorHex: '#10b981'
        });
      } else if (i > lastNonZeroIndex) {
        // Trailing zero
        if (hasDecimal) {
          sigCount++;
          digits.push({
            char: '0',
            role: 'trailing_zero_significant',
            isSignificant: true,
            explanation: 'Trailing zero in a number WITH a decimal point is always significant.',
            colorHex: '#f59e0b'
          });
        } else {
          digits.push({
            char: '0',
            role: 'trailing_zero_insignificant',
            isSignificant: false,
            explanation: 'Trailing zero WITHOUT a decimal point is ambiguous/not significant (placeholder).',
            colorHex: '#ef4444'
          });
        }
      }
    }
  }

  // Record rules notes
  if (digits.some(d => d.role === 'captive_zero')) {
    rulesApplied.push('Captive zeros between non-zero digits are always significant.');
  }
  if (digits.some(d => d.role === 'leading_zero')) {
    rulesApplied.push('Leading zeros preceding the first non-zero digit are never significant.');
  }
  if (digits.some(d => d.role === 'trailing_zero_significant')) {
    rulesApplied.push('Trailing zeros after the decimal point are significant.');
  }
  if (digits.some(d => d.role === 'trailing_zero_insignificant')) {
    rulesApplied.push('Trailing zeros without a terminal decimal point are placeholders and not significant.');
  }

  // Add Exponent digits if present
  if (sciMatch) {
    digits.push({
      char: ` × 10^${exponentVal}`,
      role: 'exponent',
      isSignificant: false,
      explanation: 'Exponential powers of 10 represent order-of-magnitude scale and do not count toward significant figures.',
      colorHex: '#8b5cf6'
    });
    rulesApplied.push('In scientific notation (m × 10ⁿ), only the mantissa digits determine significant figures.');
  }

  const decCount = hasDecimal ? cleanMantissa.length - 1 - cleanMantissa.indexOf('.') : 0;
  const numVal = parseFloat(norm);

  // Format notations
  const scientific = numVal.toExponential(Math.max(0, sigCount - 1));
  const eNot = numVal.toExponential(Math.max(0, sigCount - 1)).replace('e', 'E');

  // Engineering notation (exponent multiple of 3)
  const expMatch = scientific.match(/e([+-]?\d+)/);
  let engNot = scientific;
  if (expMatch) {
    const rawExp = parseInt(expMatch[1], 10);
    const engExp = Math.floor(rawExp / 3) * 3;
    const diff = rawExp - engExp;
    const rawMantissa = parseFloat(scientific.split('e')[0]) * Math.pow(10, diff);
    engNot = `${rawMantissa.toFixed(Math.max(0, sigCount - 1 - diff))} × 10^${engExp}`;
  }

  return {
    rawInput: input,
    normalizedInput: norm,
    totalSigFigs: sigCount,
    digits,
    decimalsCount: decCount,
    scientificNotation: scientific.replace('e+', ' × 10^').replace('e-', ' × 10^-'),
    engineeringNotation: engNot,
    eNotation: eNot,
    firstSigDigitIndex: firstNonZeroIndex,
    lastSigDigitIndex: lastNonZeroIndex,
    rulesApplied,
    isValid: true
  };
}

/**
 * Rounds a given number to an exact number of significant figures.
 */
export function roundToSigFigs(val: number, sigFigs: number): string {
  if (isNaN(val) || !isFinite(val)) return 'NaN';
  if (val === 0) return (0).toFixed(Math.max(0, sigFigs - 1));

  const targetFigs = Math.max(1, Math.floor(sigFigs));
  const magnitude = Math.floor(Math.log10(Math.abs(val)));
  const scale = Math.pow(10, targetFigs - 1 - magnitude);
  const rounded = Math.round(val * scale) / scale;

  // Determine required decimal places to preserve trailing zeros
  const decimalPlaces = Math.max(0, targetFigs - 1 - magnitude);
  if (magnitude < targetFigs && magnitude >= 0) {
    return rounded.toFixed(decimalPlaces);
  } else if (magnitude < 0) {
    return rounded.toFixed(decimalPlaces);
  } else {
    // If rounded number has fewer digits than places, write in scientific or add dot
    return rounded.toPrecision(targetFigs);
  }
}

/**
 * Solves standard chemistry lab arithmetic expressions (+, -, *, /)
 * with strict propagation of significant figure & decimal place rules.
 */
export function evaluateSigFigExpression(expr: string): ArithmeticResult {
  const clean = expr.trim().replace(',', '.');
  if (!clean) {
    return {
      expression: expr,
      exactValue: 0,
      roundedValue: '0',
      sigFigs: 0,
      decimalPlaces: 0,
      steps: [],
      scientificNotation: '0',
      homeworkExplanation: '',
      latexBlock: '',
      isValid: false,
      errorMessage: 'Please enter an arithmetic calculation (e.g., 14.28 + 3.1 or (12.45 - 0.12) / 2.05).'
    };
  }

  // Tokenize numbers in expression to record their individual precision
  const numberTokens = clean.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!numberTokens || numberTokens.length === 0) {
    return {
      expression: expr,
      exactValue: 0,
      roundedValue: '0',
      sigFigs: 0,
      decimalPlaces: 0,
      steps: [],
      scientificNotation: '0',
      homeworkExplanation: '',
      latexBlock: '',
      isValid: false,
      errorMessage: 'No numerical quantities detected in the expression.'
    };
  }

  try {
    // Sanitize for safe client math evaluation (only digits, operators, parens, decimal)
    if (!/^[0-9+\-*/().\s^eE]+$/.test(clean)) {
      throw new Error('Expression contains invalid characters. Use +, -, *, /, and parentheses.');
    }

    // Evaluate exact algebraic result
    // Replace '^' with '**' for powers if typed
    const jsExpr = clean.replace(/\^/g, '**');
    // eslint-disable-next-line no-eval
    const exact = Function(`"use strict"; return (${jsExpr})`)();

    if (isNaN(exact) || !isFinite(exact)) {
      throw new Error('Calculation resulted in undefined (division by zero or overflow).');
    }

    const steps: ArithmeticStep[] = [];
    const isOnlyAddSub = !/[*/]/.test(clean);
    const isOnlyMulDiv = !/[+\-]/.test(clean.replace(/^[+\-]/, '').replace(/[eE][+\-]/g, ''));

    let finalSigFigs = 0;
    let finalDecimals = 0;
    let homework = `Step-by-Step Significant Figure Analysis:\nExpression: ${clean}\n\n`;

    if (isOnlyAddSub) {
      // Rule 1: Addition/Subtraction -> Limited by LEAST NUMBER OF DECIMAL PLACES
      let minDecimals = Infinity;
      let limitingStr = '';

      numberTokens.forEach(t => {
        const decs = t.includes('.') ? t.split('.')[1].length : 0;
        if (decs < minDecimals) {
          minDecimals = decs;
          limitingStr = `${t} (${decs} decimal place${decs === 1 ? '' : 's'})`;
        }
      });

      if (minDecimals === Infinity) minDecimals = 0;
      finalDecimals = minDecimals;

      const rounded = exact.toFixed(minDecimals);
      finalSigFigs = analyzeSigFigs(rounded).totalSigFigs;

      steps.push({
        description: `Addition/Subtraction operation evaluated across ${numberTokens.length} terms.`,
        rawIntermediate: exact,
        intermediateRule: 'addition_subtraction',
        limitingFactor: `Least decimal precision is governed by ${limitingStr}.`,
        intermediateRounded: rounded,
        sigFigs: finalSigFigs
      });

      homework += `1. Identify Operation: Addition/Subtraction.\n`;
      homework += `2. Rule: Final answer is limited by the term with the fewest decimal places.\n`;
      homework += `3. Limiting Term: ${limitingStr}.\n`;
      homework += `4. Raw Exact Sum: ${exact}\n`;
      homework += `5. Rounded Result: ${rounded} (${minDecimals} decimal place${minDecimals === 1 ? '' : 's'}, ${finalSigFigs} sig figs).\n`;

      return {
        expression: clean,
        exactValue: exact,
        roundedValue: rounded,
        sigFigs: finalSigFigs,
        decimalPlaces: finalDecimals,
        steps,
        scientificNotation: parseFloat(rounded).toExponential(),
        homeworkExplanation: homework,
        latexBlock: `\\begin{aligned} \\text{Raw: } &${clean} = ${exact} \\\\ \\text{Limiting: } &\\text{${minDecimals} decimal places} \\\\ \\mathbf{Answer: } &\\mathbf{${rounded}} \\end{aligned}`,
        isValid: true
      };
    } else if (isOnlyMulDiv) {
      // Rule 2: Multiplication/Division -> Limited by LEAST NUMBER OF TOTAL SIG FIGS
      let minSigFigs = Infinity;
      let limitingStr = '';

      numberTokens.forEach(t => {
        const sf = analyzeSigFigs(t).totalSigFigs;
        if (sf < minSigFigs && sf > 0) {
          minSigFigs = sf;
          limitingStr = `${t} (${sf} sig figs)`;
        }
      });

      if (minSigFigs === Infinity) minSigFigs = 1;
      finalSigFigs = minSigFigs;

      const rounded = roundToSigFigs(exact, finalSigFigs);
      steps.push({
        description: `Multiplication/Division operation evaluated across ${numberTokens.length} terms.`,
        rawIntermediate: exact,
        intermediateRule: 'multiplication_division',
        limitingFactor: `Lowest total significant figures governed by ${limitingStr}.`,
        intermediateRounded: rounded,
        sigFigs: finalSigFigs
      });

      homework += `1. Identify Operation: Multiplication/Division.\n`;
      homework += `2. Rule: Final answer is limited by the term with the fewest total significant figures.\n`;
      homework += `3. Limiting Term: ${limitingStr}.\n`;
      homework += `4. Raw Product/Quotient: ${exact}\n`;
      homework += `5. Rounded Result: ${rounded} (${finalSigFigs} significant figures).\n`;

      return {
        expression: clean,
        exactValue: exact,
        roundedValue: rounded,
        sigFigs: finalSigFigs,
        decimalPlaces: rounded.includes('.') ? rounded.split('.')[1].length : 0,
        steps,
        scientificNotation: parseFloat(rounded).toExponential(),
        homeworkExplanation: homework,
        latexBlock: `\\begin{aligned} \\text{Raw: } &${clean} = ${exact} \\\\ \\text{Limiting: } &\\text{${finalSigFigs} sig figs} \\\\ \\mathbf{Answer: } &\\mathbf{${rounded}} \\end{aligned}`,
        isValid: true
      };
    } else {
      // Rule 3: Mixed Operations (Parentheses, Add/Sub combined with Mul/Div)
      // Evaluate least sig fig term as safe lab boundary
      let minSigFigs = Infinity;
      let limitingStr = '';

      numberTokens.forEach(t => {
        const sf = analyzeSigFigs(t).totalSigFigs;
        if (sf < minSigFigs && sf > 0) {
          minSigFigs = sf;
          limitingStr = `${t} (${sf} sig figs)`;
        }
      });

      finalSigFigs = Math.max(1, minSigFigs);
      const rounded = roundToSigFigs(exact, finalSigFigs);

      steps.push({
        description: 'Multi-step mixed arithmetic evaluated following order of operations (PEMDAS).',
        rawIntermediate: exact,
        intermediateRule: 'multiplication_division',
        limitingFactor: `Dominant uncertainty propagation governed by least precise measurement: ${limitingStr}.`,
        intermediateRounded: rounded,
        sigFigs: finalSigFigs
      });

      homework += `1. Mixed Operation Procedure: Evaluate innermost terms following PEMDAS.\n`;
      homework += `2. Add/Sub components maintain decimal place tracking, while outer Mul/Div steps constrain total sig figs.\n`;
      homework += `3. Limiting Precision Term: ${limitingStr}.\n`;
      homework += `4. Raw Unrounded Value: ${exact}\n`;
      homework += `5. Final Standard Laboratory Output: ${rounded} (${finalSigFigs} sig figs).\n`;

      return {
        expression: clean,
        exactValue: exact,
        roundedValue: rounded,
        sigFigs: finalSigFigs,
        decimalPlaces: rounded.includes('.') ? rounded.split('.')[1].length : 0,
        steps,
        scientificNotation: parseFloat(rounded).toExponential(),
        homeworkExplanation: homework,
        latexBlock: `\\begin{aligned} \\text{Expression: } &${clean} \\\\ \\text{Raw Value: } &${exact} \\\\ \\mathbf{Final (\\le ${finalSigFigs} \\text{ sig figs}): } &\\mathbf{${rounded}} \\end{aligned}`,
        isValid: true
      };
    }
  } catch (err: any) {
    return {
      expression: clean,
      exactValue: 0,
      roundedValue: '0',
      sigFigs: 0,
      decimalPlaces: 0,
      steps: [],
      scientificNotation: '0',
      homeworkExplanation: '',
      latexBlock: '',
      isValid: false,
      errorMessage: err?.message || 'Error evaluating algebraic expression.'
    };
  }
}