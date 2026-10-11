/**
 * src/utils/electronConfigMath.ts
 * Core engine for Tool #15: Electron Configuration & Orbital Physics Studio.
 * Computes ground-state and ionic electron configurations, Hund's rule orbital
 * box occupations, quantum numbers, Slater's Z_eff, ionization energies,
 * electron affinities, crystal structures, and spectroscopic term symbols.
 */

export interface SubshellConfig {
  n: number;
  l: number; // 0=s, 1=p, 2=d, 3=f
  subshell: string; // e.g. "1s", "3d"
  electrons: number;
  capacity: number;
  boxes: Array<{
    ml: number;
    up: boolean;
    down: boolean;
  }>;
}

export interface QuantumNumbers {
  n: number;
  l: number;
  ml: number;
  ms: string; // "+1/2" or "-1/2"
  orbitalDesignation: string; // e.g. "3d"
}

export interface ElementData {
  z: number;
  symbol: string;
  name: string;
  atomicMass: number;
  period: number;
  group: number;
  block: 's' | 'p' | 'd' | 'f';
  standardConfig: string; // Neutral ground state override if anomalous
  nobleCore: string;
  ie1: number | null; // kJ/mol
  ie2: number | null; // kJ/mol
  ie3: number | null; // kJ/mol
  electronAffinity: number | null; // kJ/mol
  electronegativity: number | null; // Pauling
  covalentRadius: number | null; // pm
  crystalStructure: string;
  coordinationNumber: number | null;
  groundTermSymbol: string;
}

export interface ConfigResult {
  z: number;
  symbol: string;
  name: string;
  charge: number;
  totalElectrons: number;
  fullConfigString: string;
  nobleConfigString: string;
  nobleCoreUsed: string;
  isIon: boolean;
  subshells: SubshellConfig[];
  unpairedElectrons: number;
  magneticState: 'Diamagnetic' | 'Paramagnetic';
  magneticMomentBM: number; // Bohr Magnetons: sqrt(n(n+2))
  valenceElectrons: number;
  coreElectrons: number;
  differentiatingQuantumNumbers: QuantumNumbers | null;
  slaterScreeningS: number;
  effectiveNuclearChargeZeff: number;
  ionizationEnergies: {
    ie1: number | null;
    ie2: number | null;
    ie3: number | null;
  };
  electronAffinity: number | null;
  electronegativity: number | null;
  covalentRadius: number | null;
  crystalStructure: string;
  coordinationNumber: number | null;
  groundTermSymbol: string;
  aufbauExceptionsNoted: string[];
  homeworkSteps: string[];
  latexBlock: string;
  isValid: boolean;
  errorMessage?: string;
}

// Subshell standard energy filling order (Madelung / Aufbau Rule)
export const AUFBAU_ORDER: Array<{ n: number; l: number; label: string; capacity: number }> = [
  { n: 1, l: 0, label: '1s', capacity: 2 },
  { n: 2, l: 0, label: '2s', capacity: 2 },
  { n: 2, l: 1, label: '2p', capacity: 6 },
  { n: 3, l: 0, label: '3s', capacity: 2 },
  { n: 3, l: 1, label: '3p', capacity: 6 },
  { n: 4, l: 0, label: '4s', capacity: 2 },
  { n: 3, l: 2, label: '3d', capacity: 10 },
  { n: 4, l: 1, label: '4p', capacity: 6 },
  { n: 5, l: 0, label: '5s', capacity: 2 },
  { n: 4, l: 2, label: '4d', capacity: 10 },
  { n: 5, l: 1, label: '5p', capacity: 6 },
  { n: 6, l: 0, label: '6s', capacity: 2 },
  { n: 4, l: 3, label: '4f', capacity: 14 },
  { n: 5, l: 2, label: '5d', capacity: 10 },
  { n: 6, l: 1, label: '6p', capacity: 6 },
  { n: 7, l: 0, label: '7s', capacity: 2 },
  { n: 5, l: 3, label: '5f', capacity: 14 },
  { n: 6, l: 2, label: '6d', capacity: 10 },
  { n: 7, l: 1, label: '7p', capacity: 6 }
];

export const NOBLE_GAS_CORES: Array<{ symbol: string; z: number; subshells: string[] }> = [
  { symbol: 'Og', z: 118, subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'] },
  { symbol: 'Rn', z: 86,  subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p'] },
  { symbol: 'Xe', z: 54,  subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p'] },
  { symbol: 'Kr', z: 36,  subshells: ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'] },
  { symbol: 'Ar', z: 18,  subshells: ['1s', '2s', '2p', '3s', '3p'] },
  { symbol: 'Ne', z: 10,  subshells: ['1s', '2s', '2p'] },
  { symbol: 'He', z: 2,   subshells: ['1s'] }
];

// Comprehensive 118-Element Physical & Thermodynamic Database
export const ELEMENTS_DB: Record<string, ElementData> = {
  H:   { z: 1,   symbol: 'H',   name: 'Hydrogen',     atomicMass: 1.008,    period: 1, group: 1,  block: 's', standardConfig: '1s1', nobleCore: '', ie1: 1312.0, ie2: null, ie3: null, electronAffinity: 72.8,  electronegativity: 2.20, covalentRadius: 31, crystalStructure: 'Hexagonal (H₂ molecular)', coordinationNumber: 1, groundTermSymbol: '²S₁/₂' },
  He:  { z: 2,   symbol: 'He',  name: 'Helium',       atomicMass: 4.0026,   period: 1, group: 18, block: 's', standardConfig: '1s2', nobleCore: '', ie1: 2372.3, ie2: 5250.5, ie3: null, electronAffinity: -48.0, electronegativity: null, covalentRadius: 28, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Li:  { z: 3,   symbol: 'Li',  name: 'Lithium',      atomicMass: 6.94,     period: 2, group: 1,  block: 's', standardConfig: '[He] 2s1', nobleCore: 'He', ie1: 520.2, ie2: 7298.1, ie3: 11815.0, electronAffinity: 59.6, electronegativity: 0.98, covalentRadius: 128, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Be:  { z: 4,   symbol: 'Be',  name: 'Beryllium',    atomicMass: 9.0122,   period: 2, group: 2,  block: 's', standardConfig: '[He] 2s2', nobleCore: 'He', ie1: 899.5, ie2: 1757.1, ie3: 14848.7, electronAffinity: -50.0, electronegativity: 1.57, covalentRadius: 96, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  B:   { z: 5,   symbol: 'B',   name: 'Boron',        atomicMass: 10.81,    period: 2, group: 13, block: 'p', standardConfig: '[He] 2s2 2p1', nobleCore: 'He', ie1: 800.6, ie2: 2427.1, ie3: 3659.7, electronAffinity: 26.7, electronegativity: 2.04, covalentRadius: 84, crystalStructure: 'Rhombohedral', coordinationNumber: 6, groundTermSymbol: '²P₁/₂' },
  C:   { z: 6,   symbol: 'C',   name: 'Carbon',       atomicMass: 12.011,   period: 2, group: 14, block: 'p', standardConfig: '[He] 2s2 2p2', nobleCore: 'He', ie1: 1086.5, ie2: 2352.6, ie3: 4620.5, electronAffinity: 122.0, electronegativity: 2.55, covalentRadius: 76, crystalStructure: 'Hexagonal (Graphite) / Diamond Cubic', coordinationNumber: 4, groundTermSymbol: '³P₀' },
  N:   { z: 7,   symbol: 'N',   name: 'Nitrogen',     atomicMass: 14.007,   period: 2, group: 15, block: 'p', standardConfig: '[He] 2s2 2p3', nobleCore: 'He', ie1: 1402.3, ie2: 2856.0, ie3: 4578.1, electronAffinity: -6.8, electronegativity: 3.04, covalentRadius: 71, crystalStructure: 'Hexagonal (N₂ molecular)', coordinationNumber: 3, groundTermSymbol: '⁴S₃/₂' },
  O:   { z: 8,   symbol: 'O',   name: 'Oxygen',       atomicMass: 15.999,   period: 2, group: 16, block: 'p', standardConfig: '[He] 2s2 2p4', nobleCore: 'He', ie1: 1313.9, ie2: 3388.3, ie3: 5300.5, electronAffinity: 141.0, electronegativity: 3.44, covalentRadius: 66, crystalStructure: 'Base-Centered Monoclinic (O₂)', coordinationNumber: 2, groundTermSymbol: '³P₂' },
  F:   { z: 9,   symbol: 'F',   name: 'Fluorine',     atomicMass: 18.998,   period: 2, group: 17, block: 'p', standardConfig: '[He] 2s2 2p5', nobleCore: 'He', ie1: 1681.0, ie2: 3374.2, ie3: 6050.4, electronAffinity: 328.0, electronegativity: 3.98, covalentRadius: 57, crystalStructure: 'Monoclinic (F₂ molecular)', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Ne:  { z: 10,  symbol: 'Ne',  name: 'Neon',         atomicMass: 20.180,   period: 2, group: 18, block: 'p', standardConfig: '[He] 2s2 2p6', nobleCore: 'He', ie1: 2080.7, ie2: 3952.3, ie3: 6122.0, electronAffinity: -116.0, electronegativity: null, covalentRadius: 58, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Na:  { z: 11,  symbol: 'Na',  name: 'Sodium',       atomicMass: 22.990,   period: 3, group: 1,  block: 's', standardConfig: '[Ne] 3s1', nobleCore: 'Ne', ie1: 495.8, ie2: 4562.4, ie3: 6910.3, electronAffinity: 52.8, electronegativity: 0.93, covalentRadius: 166, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Mg:  { z: 12,  symbol: 'Mg',  name: 'Magnesium',    atomicMass: 24.305,   period: 3, group: 2,  block: 's', standardConfig: '[Ne] 3s2', nobleCore: 'Ne', ie1: 737.7, ie2: 1450.7, ie3: 7732.7, electronAffinity: -40.0, electronegativity: 1.31, covalentRadius: 141, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Al:  { z: 13,  symbol: 'Al',  name: 'Aluminium',    atomicMass: 26.982,   period: 3, group: 13, block: 'p', standardConfig: '[Ne] 3s2 3p1', nobleCore: 'Ne', ie1: 577.5, ie2: 1816.7, ie3: 2744.8, electronAffinity: 42.5, electronegativity: 1.61, covalentRadius: 121, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²P₁/₂' },
  Si:  { z: 14,  symbol: 'Si',  name: 'Silicon',      atomicMass: 28.085,   period: 3, group: 14, block: 'p', standardConfig: '[Ne] 3s2 3p2', nobleCore: 'Ne', ie1: 786.5, ie2: 1577.1, ie3: 3231.6, electronAffinity: 134.1, electronegativity: 1.90, covalentRadius: 111, crystalStructure: 'Diamond Cubic', coordinationNumber: 4, groundTermSymbol: '³P₀' },
  P:   { z: 15,  symbol: 'P',   name: 'Phosphorus',   atomicMass: 30.974,   period: 3, group: 15, block: 'p', standardConfig: '[Ne] 3s2 3p3', nobleCore: 'Ne', ie1: 1011.8, ie2: 1907.0, ie3: 2914.1, electronAffinity: 72.0, electronegativity: 2.19, covalentRadius: 107, crystalStructure: 'Orthorhombic / White P₄ Cubic', coordinationNumber: 3, groundTermSymbol: '⁴S₃/₂' },
  S:   { z: 16,  symbol: 'S',   name: 'Sulfur',       atomicMass: 32.06,    period: 3, group: 16, block: 'p', standardConfig: '[Ne] 3s2 3p4', nobleCore: 'Ne', ie1: 999.6, ie2: 2252.0, ie3: 3357.0, electronAffinity: 200.4, electronegativity: 2.58, covalentRadius: 105, crystalStructure: 'Orthorhombic (S₈ rings)', coordinationNumber: 2, groundTermSymbol: '³P₂' },
  Cl:  { z: 17,  symbol: 'Cl',  name: 'Chlorine',     atomicMass: 35.45,    period: 3, group: 17, block: 'p', standardConfig: '[Ne] 3s2 3p5', nobleCore: 'Ne', ie1: 1251.2, ie2: 2298.0, ie3: 3822.0, electronAffinity: 349.0, electronegativity: 3.16, covalentRadius: 102, crystalStructure: 'Orthorhombic (Cl₂ molecular)', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Ar:  { z: 18,  symbol: 'Ar',  name: 'Argon',        atomicMass: 39.948,   period: 3, group: 18, block: 'p', standardConfig: '[Ne] 3s2 3p6', nobleCore: 'Ne', ie1: 1520.6, ie2: 2665.8, ie3: 3931.0, electronAffinity: -96.0, electronegativity: null, covalentRadius: 106, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  K:   { z: 19,  symbol: 'K',   name: 'Potassium',    atomicMass: 39.098,   period: 4, group: 1,  block: 's', standardConfig: '[Ar] 4s1', nobleCore: 'Ar', ie1: 418.8, ie2: 3052.0, ie3: 4420.0, electronAffinity: 48.4, electronegativity: 0.82, covalentRadius: 203, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Ca:  { z: 20,  symbol: 'Ca',  name: 'Calcium',      atomicMass: 40.078,   period: 4, group: 2,  block: 's', standardConfig: '[Ar] 4s2', nobleCore: 'Ar', ie1: 589.8, ie2: 1145.4, ie3: 4912.4, electronAffinity: 2.4, electronegativity: 1.00, covalentRadius: 176, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Sc:  { z: 21,  symbol: 'Sc',  name: 'Scandium',     atomicMass: 44.956,   period: 4, group: 3,  block: 'd', standardConfig: '[Ar] 3d1 4s2', nobleCore: 'Ar', ie1: 633.1, ie2: 1235.0, ie3: 2388.6, electronAffinity: 18.0, electronegativity: 1.36, covalentRadius: 170, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²D₃/₂' },
  Ti:  { z: 22,  symbol: 'Ti',  name: 'Titanium',     atomicMass: 47.867,   period: 4, group: 4,  block: 'd', standardConfig: '[Ar] 3d2 4s2', nobleCore: 'Ar', ie1: 658.8, ie2: 1309.8, ie3: 2652.5, electronAffinity: 7.6, electronegativity: 1.54, covalentRadius: 160, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³F₂' },
  V:   { z: 23,  symbol: 'V',   name: 'Vanadium',     atomicMass: 50.942,   period: 4, group: 5,  block: 'd', standardConfig: '[Ar] 3d3 4s2', nobleCore: 'Ar', ie1: 650.9, ie2: 1414.0, ie3: 2830.0, electronAffinity: 50.6, electronegativity: 1.63, covalentRadius: 153, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁴F₃/₂' },
  Cr:  { z: 24,  symbol: 'Cr',  name: 'Chromium',     atomicMass: 51.996,   period: 4, group: 6,  block: 'd', standardConfig: '[Ar] 3d5 4s1', nobleCore: 'Ar', ie1: 652.9, ie2: 1590.6, ie3: 2987.0, electronAffinity: 64.3, electronegativity: 1.66, covalentRadius: 139, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁷S₃' },
  Mn:  { z: 25,  symbol: 'Mn',  name: 'Manganese',    atomicMass: 54.938,   period: 4, group: 7,  block: 'd', standardConfig: '[Ar] 3d5 4s2', nobleCore: 'Ar', ie1: 717.3, ie2: 1509.0, ie3: 3248.0, electronAffinity: -50.0, electronegativity: 1.55, covalentRadius: 139, crystalStructure: 'Cubic (Complex α-Mn)', coordinationNumber: 12, groundTermSymbol: '⁶S₅/₂' },
  Fe:  { z: 26,  symbol: 'Fe',  name: 'Iron',         atomicMass: 55.845,   period: 4, group: 8,  block: 'd', standardConfig: '[Ar] 3d6 4s2', nobleCore: 'Ar', ie1: 762.5, ie2: 1561.9, ie3: 2957.0, electronAffinity: 15.7, electronegativity: 1.83, covalentRadius: 132, crystalStructure: 'Body-Centered Cubic (α-Fe)', coordinationNumber: 8, groundTermSymbol: '⁵D₄' },
  Co:  { z: 27,  symbol: 'Co',  name: 'Cobalt',       atomicMass: 58.933,   period: 4, group: 9,  block: 'd', standardConfig: '[Ar] 3d7 4s2', nobleCore: 'Ar', ie1: 760.4, ie2: 1648.0, ie3: 3232.0, electronAffinity: 63.7, electronegativity: 1.88, covalentRadius: 126, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁴F₉/₂' },
  Ni:  { z: 28,  symbol: 'Ni',  name: 'Nickel',       atomicMass: 58.693,   period: 4, group: 10, block: 'd', standardConfig: '[Ar] 3d8 4s2', nobleCore: 'Ar', ie1: 737.1, ie2: 1753.0, ie3: 3395.0, electronAffinity: 112.0, electronegativity: 1.91, covalentRadius: 124, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³F₄' },
  Cu:  { z: 29,  symbol: 'Cu',  name: 'Copper',       atomicMass: 63.546,   period: 4, group: 11, block: 'd', standardConfig: '[Ar] 3d10 4s1', nobleCore: 'Ar', ie1: 745.5, ie2: 1957.9, ie3: 3555.0, electronAffinity: 118.4, electronegativity: 1.90, covalentRadius: 132, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²S₁/₂' },
  Zn:  { z: 30,  symbol: 'Zn',  name: 'Zinc',         atomicMass: 65.38,    period: 4, group: 12, block: 'd', standardConfig: '[Ar] 3d10 4s2', nobleCore: 'Ar', ie1: 906.4, ie2: 1733.3, ie3: 3833.0, electronAffinity: -58.0, electronegativity: 1.65, covalentRadius: 122, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Ga:  { z: 31,  symbol: 'Ga',  name: 'Gallium',      atomicMass: 69.723,   period: 4, group: 13, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p1', nobleCore: 'Ar', ie1: 578.8, ie2: 1979.3, ie3: 2963.0, electronAffinity: 28.9, electronegativity: 1.81, covalentRadius: 122, crystalStructure: 'Orthorhombic', coordinationNumber: 7, groundTermSymbol: '²P₁/₂' },
  Ge:  { z: 32,  symbol: 'Ge',  name: 'Germanium',    atomicMass: 72.630,   period: 4, group: 14, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p2', nobleCore: 'Ar', ie1: 762.0, ie2: 1537.5, ie3: 3302.1, electronAffinity: 119.0, electronegativity: 2.01, covalentRadius: 120, crystalStructure: 'Diamond Cubic', coordinationNumber: 4, groundTermSymbol: '³P₀' },
  As:  { z: 33,  symbol: 'As',  name: 'Arsenic',      atomicMass: 74.922,   period: 4, group: 15, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p3', nobleCore: 'Ar', ie1: 947.0, ie2: 1798.0, ie3: 2735.0, electronAffinity: 78.2, electronegativity: 2.18, covalentRadius: 119, crystalStructure: 'Rhombohedral', coordinationNumber: 3, groundTermSymbol: '⁴S₃/₂' },
  Se:  { z: 34,  symbol: 'Se',  name: 'Selenium',     atomicMass: 78.971,   period: 4, group: 16, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p4', nobleCore: 'Ar', ie1: 941.0, ie2: 2045.0, ie3: 2974.0, electronAffinity: 195.0, electronegativity: 2.55, covalentRadius: 120, crystalStructure: 'Hexagonal', coordinationNumber: 2, groundTermSymbol: '³P₂' },
  Br:  { z: 35,  symbol: 'Br',  name: 'Bromine',      atomicMass: 79.904,   period: 4, group: 17, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p5', nobleCore: 'Ar', ie1: 1139.9, ie2: 2103.0, ie3: 3470.0, electronAffinity: 324.6, electronegativity: 2.96, covalentRadius: 120, crystalStructure: 'Orthorhombic (Br₂)', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Kr:  { z: 36,  symbol: 'Kr',  name: 'Krypton',      atomicMass: 83.798,   period: 4, group: 18, block: 'p', standardConfig: '[Ar] 3d10 4s2 4p6', nobleCore: 'Ar', ie1: 1350.8, ie2: 2350.4, ie3: 3565.0, electronAffinity: -96.0, electronegativity: 3.00, covalentRadius: 116, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Rb:  { z: 37,  symbol: 'Rb',  name: 'Rubidium',     atomicMass: 85.468,   period: 5, group: 1,  block: 's', standardConfig: '[Kr] 5s1', nobleCore: 'Kr', ie1: 403.0, ie2: 2632.1, ie3: 3860.0, electronAffinity: 46.9, electronegativity: 0.82, covalentRadius: 220, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Sr:  { z: 38,  symbol: 'Sr',  name: 'Strontium',    atomicMass: 87.62,    period: 5, group: 2,  block: 's', standardConfig: '[Kr] 5s2', nobleCore: 'Kr', ie1: 549.5, ie2: 1064.2, ie3: 4138.0, electronAffinity: 5.0, electronegativity: 0.95, covalentRadius: 195, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Y:   { z: 39,  symbol: 'Y',   name: 'Yttrium',      atomicMass: 88.906,   period: 5, group: 3,  block: 'd', standardConfig: '[Kr] 4d1 5s2', nobleCore: 'Kr', ie1: 600.0, ie2: 1180.0, ie3: 1980.0, electronAffinity: 29.6, electronegativity: 1.22, covalentRadius: 190, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²D₃/₂' },
  Zr:  { z: 40,  symbol: 'Zr',  name: 'Zirconium',    atomicMass: 91.224,   period: 5, group: 4,  block: 'd', standardConfig: '[Kr] 4d2 5s2', nobleCore: 'Kr', ie1: 640.1, ie2: 1270.0, ie3: 2218.0, electronAffinity: 41.1, electronegativity: 1.33, covalentRadius: 175, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³F₂' },
  Nb:  { z: 41,  symbol: 'Nb',  name: 'Niobium',      atomicMass: 92.906,   period: 5, group: 5,  block: 'd', standardConfig: '[Kr] 4d4 5s1', nobleCore: 'Kr', ie1: 652.1, ie2: 1380.0, ie3: 2416.0, electronAffinity: 86.1, electronegativity: 1.60, covalentRadius: 164, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁶D₁/₂' },
  Mo:  { z: 42,  symbol: 'Mo',  name: 'Molybdenum',   atomicMass: 95.95,    period: 5, group: 6,  block: 'd', standardConfig: '[Kr] 4d5 5s1', nobleCore: 'Kr', ie1: 684.3, ie2: 1560.0, ie3: 2618.0, electronAffinity: 71.9, electronegativity: 2.16, covalentRadius: 154, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁷S₃' },
  Tc:  { z: 43,  symbol: 'Tc',  name: 'Technetium',   atomicMass: 98.0,     period: 5, group: 7,  block: 'd', standardConfig: '[Kr] 4d5 5s2', nobleCore: 'Kr', ie1: 702.0, ie2: 1470.0, ie3: 2850.0, electronAffinity: 53.0, electronegativity: 1.90, covalentRadius: 147, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁶S₅/₂' },
  Ru:  { z: 44,  symbol: 'Ru',  name: 'Ruthenium',    atomicMass: 101.07,   period: 5, group: 8,  block: 'd', standardConfig: '[Kr] 4d7 5s1', nobleCore: 'Kr', ie1: 710.2, ie2: 1620.0, ie3: 2750.0, electronAffinity: 101.3, electronegativity: 2.20, covalentRadius: 146, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁵F₅' },
  Rh:  { z: 45,  symbol: 'Rh',  name: 'Rhodium',      atomicMass: 102.91,   period: 5, group: 9,  block: 'd', standardConfig: '[Kr] 4d8 5s1', nobleCore: 'Kr', ie1: 719.7, ie2: 1740.0, ie3: 2997.0, electronAffinity: 109.7, electronegativity: 2.28, covalentRadius: 142, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '⁴F₉/₂' },
  Pd:  { z: 46,  symbol: 'Pd',  name: 'Palladium',    atomicMass: 106.42,   period: 5, group: 10, block: 'd', standardConfig: '[Kr] 4d10',    nobleCore: 'Kr', ie1: 804.4, ie2: 1870.0, ie3: 3177.0, electronAffinity: 53.7, electronegativity: 2.20, covalentRadius: 139, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Ag:  { z: 47,  symbol: 'Ag',  name: 'Silver',       atomicMass: 107.87,   period: 5, group: 11, block: 'd', standardConfig: '[Kr] 4d10 5s1', nobleCore: 'Kr', ie1: 731.0, ie2: 2070.0, ie3: 3361.0, electronAffinity: 125.6, electronegativity: 1.93, covalentRadius: 145, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²S₁/₂' },
  Cd:  { z: 48,  symbol: 'Cd',  name: 'Cadmium',      atomicMass: 112.41,   period: 5, group: 12, block: 'd', standardConfig: '[Kr] 4d10 5s2', nobleCore: 'Kr', ie1: 867.8, ie2: 1631.4, ie3: 3616.0, electronAffinity: -68.0, electronegativity: 1.69, covalentRadius: 144, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  In:  { z: 49,  symbol: 'In',  name: 'Indium',       atomicMass: 114.82,   period: 5, group: 13, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p1', nobleCore: 'Kr', ie1: 558.3, ie2: 1820.7, ie3: 2704.0, electronAffinity: 38.9, electronegativity: 1.78, covalentRadius: 142, crystalStructure: 'Tetragonal', coordinationNumber: 12, groundTermSymbol: '²P₁/₂' },
  Sn:  { z: 50,  symbol: 'Sn',  name: 'Tin',          atomicMass: 118.71,   period: 5, group: 14, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p2', nobleCore: 'Kr', ie1: 708.6, ie2: 1411.8, ie3: 2943.0, electronAffinity: 107.3, electronegativity: 1.96, covalentRadius: 139, crystalStructure: 'Tetragonal (White β-Sn) / Diamond Cubic (α-Sn)', coordinationNumber: 6, groundTermSymbol: '³P₀' },
  Sb:  { z: 51,  symbol: 'Sb',  name: 'Antimony',     atomicMass: 121.76,   period: 5, group: 15, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p3', nobleCore: 'Kr', ie1: 834.0, ie2: 1594.9, ie3: 2440.0, electronAffinity: 103.2, electronegativity: 2.05, covalentRadius: 139, crystalStructure: 'Rhombohedral', coordinationNumber: 3, groundTermSymbol: '⁴S₃/₂' },
  Te:  { z: 52,  symbol: 'Te',  name: 'Tellurium',    atomicMass: 127.60,   period: 5, group: 16, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p4', nobleCore: 'Kr', ie1: 869.3, ie2: 1790.0, ie3: 2698.0, electronAffinity: 190.2, electronegativity: 2.10, covalentRadius: 138, crystalStructure: 'Hexagonal', coordinationNumber: 2, groundTermSymbol: '³P₂' },
  I:   { z: 53,  symbol: 'I',   name: 'Iodine',       atomicMass: 126.90,   period: 5, group: 17, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p5', nobleCore: 'Kr', ie1: 1008.4, ie2: 1845.9, ie3: 3180.0, electronAffinity: 295.2, electronegativity: 2.66, covalentRadius: 139, crystalStructure: 'Orthorhombic (I₂)', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Xe:  { z: 54,  symbol: 'Xe',  name: 'Xenon',        atomicMass: 131.29,   period: 5, group: 18, block: 'p', standardConfig: '[Kr] 4d10 5s2 5p6', nobleCore: 'Kr', ie1: 1170.4, ie2: 2046.4, ie3: 3099.4, electronAffinity: -77.0, electronegativity: 2.60, covalentRadius: 140, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Cs:  { z: 55,  symbol: 'Cs',  name: 'Caesium',      atomicMass: 132.91,   period: 6, group: 1,  block: 's', standardConfig: '[Xe] 6s1', nobleCore: 'Xe', ie1: 375.7, ie2: 2234.3, ie3: 3400.0, electronAffinity: 45.5, electronegativity: 0.79, covalentRadius: 244, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Ba:  { z: 56,  symbol: 'Ba',  name: 'Barium',       atomicMass: 137.33,   period: 6, group: 2,  block: 's', standardConfig: '[Xe] 6s2', nobleCore: 'Xe', ie1: 502.9, ie2: 965.2,  ie3: 3600.0, electronAffinity: 13.95, electronegativity: 0.89, covalentRadius: 215, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '¹S₀' },
  La:  { z: 57,  symbol: 'La',  name: 'Lanthanum',    atomicMass: 138.91,   period: 6, group: 3,  block: 'd', standardConfig: '[Xe] 5d1 6s2', nobleCore: 'Xe', ie1: 538.1, ie2: 1067.0, ie3: 1850.3, electronAffinity: 48.0, electronegativity: 1.10, covalentRadius: 207, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '²D₃/₂' },
  Ce:  { z: 58,  symbol: 'Ce',  name: 'Cerium',       atomicMass: 140.12,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f1 5d1 6s2', nobleCore: 'Xe', ie1: 534.4, ie2: 1050.0, ie3: 1949.0, electronAffinity: 55.0, electronegativity: 1.12, covalentRadius: 204, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹G₄' },
  Pr:  { z: 59,  symbol: 'Pr',  name: 'Praseodymium', atomicMass: 140.91,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f3 6s2', nobleCore: 'Xe', ie1: 527.0, ie2: 1020.0, ie3: 2086.0, electronAffinity: 50.0, electronegativity: 1.13, covalentRadius: 203, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁴I₉/₂' },
  Nd:  { z: 60,  symbol: 'Nd',  name: 'Neodymium',    atomicMass: 144.24,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f4 6s2', nobleCore: 'Xe', ie1: 533.1, ie2: 1040.0, ie3: 2130.0, electronAffinity: 50.0, electronegativity: 1.14, covalentRadius: 201, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁵I₄' },
  Pm:  { z: 61,  symbol: 'Pm',  name: 'Promethium',   atomicMass: 145.0,    period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f5 6s2', nobleCore: 'Xe', ie1: 540.0, ie2: 1050.0, ie3: 2150.0, electronAffinity: 50.0, electronegativity: 1.13, covalentRadius: 199, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁶H₅/₂' },
  Sm:  { z: 62,  symbol: 'Sm',  name: 'Samarium',     atomicMass: 150.36,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f6 6s2', nobleCore: 'Xe', ie1: 544.5, ie2: 1070.0, ie3: 2260.0, electronAffinity: 50.0, electronegativity: 1.17, covalentRadius: 198, crystalStructure: 'Rhombohedral', coordinationNumber: 12, groundTermSymbol: '⁷F₀' },
  Eu:  { z: 63,  symbol: 'Eu',  name: 'Europium',     atomicMass: 151.96,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f7 6s2', nobleCore: 'Xe', ie1: 547.1, ie2: 1085.0, ie3: 2404.0, electronAffinity: 50.0, electronegativity: 1.20, covalentRadius: 198, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁸S₇/₂' },
  Gd:  { z: 64,  symbol: 'Gd',  name: 'Gadolinium',   atomicMass: 157.25,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f7 5d1 6s2', nobleCore: 'Xe', ie1: 593.4, ie2: 1170.0, ie3: 1990.0, electronAffinity: 50.0, electronegativity: 1.20, covalentRadius: 196, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁹D₂' },
  Tb:  { z: 65,  symbol: 'Tb',  name: 'Terbium',      atomicMass: 158.93,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f9 6s2', nobleCore: 'Xe', ie1: 565.8, ie2: 1110.0, ie3: 2114.0, electronAffinity: 50.0, electronegativity: 1.20, covalentRadius: 194, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁶H₁₅/₂' },
  Dy:  { z: 66,  symbol: 'Dy',  name: 'Dysprosium',   atomicMass: 162.50,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f10 6s2', nobleCore: 'Xe', ie1: 573.0, ie2: 1130.0, ie3: 2200.0, electronAffinity: 50.0, electronegativity: 1.22, covalentRadius: 192, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁵I₈' },
  Ho:  { z: 67,  symbol: 'Ho',  name: 'Holmium',      atomicMass: 164.93,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f11 6s2', nobleCore: 'Xe', ie1: 581.0, ie2: 1140.0, ie3: 2204.0, electronAffinity: 50.0, electronegativity: 1.23, covalentRadius: 192, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁴I₁₅/₂' },
  Er:  { z: 68,  symbol: 'Er',  name: 'Erbium',       atomicMass: 167.26,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f12 6s2', nobleCore: 'Xe', ie1: 589.3, ie2: 1150.0, ie3: 2194.0, electronAffinity: 50.0, electronegativity: 1.24, covalentRadius: 189, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³H₆' },
  Tm:  { z: 69,  symbol: 'Tm',  name: 'Thulium',      atomicMass: 168.93,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f13 6s2', nobleCore: 'Xe', ie1: 596.7, ie2: 1160.0, ie3: 2285.0, electronAffinity: 99.0, electronegativity: 1.25, covalentRadius: 190, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²F₇/₂' },
  Yb:  { z: 70,  symbol: 'Yb',  name: 'Ytterbium',    atomicMass: 173.05,   period: 6, group: 3,  block: 'f', standardConfig: '[Xe] 4f14 6s2', nobleCore: 'Xe', ie1: 603.4, ie2: 1174.8, ie3: 2417.0, electronAffinity: -2.0, electronegativity: 1.10, covalentRadius: 187, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Lu:  { z: 71,  symbol: 'Lu',  name: 'Lutetium',     atomicMass: 174.97,   period: 6, group: 3,  block: 'd', standardConfig: '[Xe] 4f14 5d1 6s2', nobleCore: 'Xe', ie1: 523.5, ie2: 1340.0, ie3: 2022.3, electronAffinity: 33.4, electronegativity: 1.27, covalentRadius: 187, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²D₃/₂' },
  Hf:  { z: 72,  symbol: 'Hf',  name: 'Hafnium',      atomicMass: 178.49,   period: 6, group: 4,  block: 'd', standardConfig: '[Xe] 4f14 5d2 6s2', nobleCore: 'Xe', ie1: 658.5, ie2: 1440.0, ie3: 2250.0, electronAffinity: 17.0, electronegativity: 1.30, covalentRadius: 175, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³F₂' },
  Ta:  { z: 73,  symbol: 'Ta',  name: 'Tantalum',     atomicMass: 180.95,   period: 6, group: 5,  block: 'd', standardConfig: '[Xe] 4f14 5d3 6s2', nobleCore: 'Xe', ie1: 761.0, ie2: 1500.0, ie3: 2100.0, electronAffinity: 31.0, electronegativity: 1.50, covalentRadius: 170, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁴F₃/₂' },
  W:   { z: 74,  symbol: 'W',   name: 'Tungsten',     atomicMass: 183.84,   period: 6, group: 6,  block: 'd', standardConfig: '[Xe] 4f14 5d4 6s2', nobleCore: 'Xe', ie1: 770.0, ie2: 1700.0, ie3: 2300.0, electronAffinity: 78.6, electronegativity: 2.36, covalentRadius: 162, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁵D₀' },
  Re:  { z: 75,  symbol: 'Re',  name: 'Rhenium',      atomicMass: 186.21,   period: 6, group: 7,  block: 'd', standardConfig: '[Xe] 4f14 5d5 6s2', nobleCore: 'Xe', ie1: 760.0, ie2: 1260.0, ie3: 2510.0, electronAffinity: 14.5, electronegativity: 1.90, covalentRadius: 151, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁶S₅/₂' },
  Os:  { z: 76,  symbol: 'Os',  name: 'Osmium',       atomicMass: 190.23,   period: 6, group: 8,  block: 'd', standardConfig: '[Xe] 4f14 5d6 6s2', nobleCore: 'Xe', ie1: 840.0, ie2: 1600.0, ie3: 2400.0, electronAffinity: 106.1, electronegativity: 2.20, covalentRadius: 144, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁵D₄' },
  Ir:  { z: 77,  symbol: 'Ir',  name: 'Iridium',      atomicMass: 192.22,   period: 6, group: 9,  block: 'd', standardConfig: '[Xe] 4f14 5d7 6s2', nobleCore: 'Xe', ie1: 880.0, ie2: 1600.0, ie3: 2600.0, electronAffinity: 151.0, electronegativity: 2.20, covalentRadius: 141, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '⁴F₉/₂' },
  Pt:  { z: 78,  symbol: 'Pt',  name: 'Platinum',     atomicMass: 195.08,   period: 6, group: 10, block: 'd', standardConfig: '[Xe] 4f14 5d9 6s1', nobleCore: 'Xe', ie1: 870.0, ie2: 1791.0, ie3: 2800.0, electronAffinity: 205.3, electronegativity: 2.28, covalentRadius: 136, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³D₃' },
  Au:  { z: 79,  symbol: 'Au',  name: 'Gold',         atomicMass: 196.97,   period: 6, group: 11, block: 'd', standardConfig: '[Xe] 4f14 5d10 6s1', nobleCore: 'Xe', ie1: 890.1, ie2: 1980.0, ie3: 2900.0, electronAffinity: 222.8, electronegativity: 2.54, covalentRadius: 136, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²S₁/₂' },
  Hg:  { z: 80,  symbol: 'Hg',  name: 'Mercury',      atomicMass: 200.59,   period: 6, group: 12, block: 'd', standardConfig: '[Xe] 4f14 5d10 6s2', nobleCore: 'Xe', ie1: 1007.1, ie2: 1810.0, ie3: 3300.0, electronAffinity: -48.0, electronegativity: 2.00, covalentRadius: 132, crystalStructure: 'Rhombohedral (Liquid at RT)', coordinationNumber: 6, groundTermSymbol: '¹S₀' },
  Tl:  { z: 81,  symbol: 'Tl',  name: 'Thallium',     atomicMass: 204.38,   period: 6, group: 13, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p1', nobleCore: 'Xe', ie1: 589.4, ie2: 1971.0, ie3: 2878.0, electronAffinity: 36.4, electronegativity: 1.62, covalentRadius: 145, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²P₁/₂' },
  Pb:  { z: 82,  symbol: 'Pb',  name: 'Lead',         atomicMass: 207.2,    period: 6, group: 14, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p2', nobleCore: 'Xe', ie1: 715.6, ie2: 1450.5, ie3: 3081.5, electronAffinity: 35.1, electronegativity: 2.33, covalentRadius: 146, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³P₀' },
  Bi:  { z: 83,  symbol: 'Bi',  name: 'Bismuth',      atomicMass: 208.98,   period: 6, group: 15, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p3', nobleCore: 'Xe', ie1: 703.0, ie2: 1610.0, ie3: 2466.0, electronAffinity: 91.2, electronegativity: 2.02, covalentRadius: 148, crystalStructure: 'Rhombohedral', coordinationNumber: 3, groundTermSymbol: '⁴S₃/₂' },
  Po:  { z: 84,  symbol: 'Po',  name: 'Polonium',     atomicMass: 209.0,    period: 6, group: 16, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p4', nobleCore: 'Xe', ie1: 812.1, ie2: 1800.0, ie3: 2690.0, electronAffinity: 183.3, electronegativity: 2.00, covalentRadius: 140, crystalStructure: 'Simple Cubic (α-Po)', coordinationNumber: 6, groundTermSymbol: '³P₂' },
  At:  { z: 85,  symbol: 'At',  name: 'Astatine',     atomicMass: 210.0,    period: 6, group: 17, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p5', nobleCore: 'Xe', ie1: 899.0, ie2: 1600.0, ie3: 2900.0, electronAffinity: 270.1, electronegativity: 2.20, covalentRadius: 150, crystalStructure: 'Face-Centered Cubic', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Rn:  { z: 86,  symbol: 'Rn',  name: 'Radon',        atomicMass: 222.0,    period: 6, group: 18, block: 'p', standardConfig: '[Xe] 4f14 5d10 6s2 6p6', nobleCore: 'Xe', ie1: 1037.0, ie2: 1900.0, ie3: 2840.0, electronAffinity: -68.0, electronegativity: 2.20, covalentRadius: 150, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Fr:  { z: 87,  symbol: 'Fr',  name: 'Francium',     atomicMass: 223.0,    period: 7, group: 1,  block: 's', standardConfig: '[Rn] 7s1', nobleCore: 'Rn', ie1: 380.0, ie2: 2100.0, ie3: 3100.0, electronAffinity: 44.0, electronegativity: 0.70, covalentRadius: 260, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²S₁/₂' },
  Ra:  { z: 88,  symbol: 'Ra',  name: 'Radium',       atomicMass: 226.0,    period: 7, group: 2,  block: 's', standardConfig: '[Rn] 7s2', nobleCore: 'Rn', ie1: 509.3, ie2: 979.0,  ie3: 3300.0, electronAffinity: 9.6, electronegativity: 0.90, covalentRadius: 221, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '¹S₀' },
  Ac:  { z: 89,  symbol: 'Ac',  name: 'Actinium',     atomicMass: 227.0,    period: 7, group: 3,  block: 'd', standardConfig: '[Rn] 6d1 7s2', nobleCore: 'Rn', ie1: 499.0, ie2: 1170.0, ie3: 1900.0, electronAffinity: 33.8, electronegativity: 1.10, covalentRadius: 215, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²D₃/₂' },
  Th:  { z: 90,  symbol: 'Th',  name: 'Thorium',      atomicMass: 232.04,   period: 7, group: 3,  block: 'd', standardConfig: '[Rn] 6d2 7s2', nobleCore: 'Rn', ie1: 587.0, ie2: 1110.0, ie3: 1930.0, electronAffinity: 112.7, electronegativity: 1.30, covalentRadius: 206, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³F₂' },
  Pa:  { z: 91,  symbol: 'Pa',  name: 'Protactinium', atomicMass: 231.04,   period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f2 6d1 7s2', nobleCore: 'Rn', ie1: 568.0, ie2: 1128.0, ie3: 1980.0, electronAffinity: 53.0, electronegativity: 1.50, covalentRadius: 200, crystalStructure: 'Body-Centered Tetragonal', coordinationNumber: 10, groundTermSymbol: '⁴K₁₁/₂' },
  U:   { z: 92,  symbol: 'U',   name: 'Uranium',      atomicMass: 238.03,   period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f3 6d1 7s2', nobleCore: 'Rn', ie1: 597.6, ie2: 1420.0, ie3: 1900.0, electronAffinity: 50.9, electronegativity: 1.38, covalentRadius: 196, crystalStructure: 'Orthorhombic (α-U)', coordinationNumber: 12, groundTermSymbol: '⁵L₆' },
  Np:  { z: 93,  symbol: 'Np',  name: 'Neptunium',    atomicMass: 237.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f4 6d1 7s2', nobleCore: 'Rn', ie1: 604.5, ie2: 1128.0, ie3: 1997.0, electronAffinity: 45.9, electronegativity: 1.36, covalentRadius: 190, crystalStructure: 'Orthorhombic (α-Np)', coordinationNumber: 12, groundTermSymbol: '⁶L₁₁/₂' },
  Pu:  { z: 94,  symbol: 'Pu',  name: 'Plutonium',    atomicMass: 244.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f6 7s2', nobleCore: 'Rn', ie1: 584.7, ie2: 1128.0, ie3: 2084.0, electronAffinity: -48.3, electronegativity: 1.28, covalentRadius: 187, crystalStructure: 'Monoclinic (α-Pu)', coordinationNumber: 14, groundTermSymbol: '⁷F₀' },
  Am:  { z: 95,  symbol: 'Am',  name: 'Americium',    atomicMass: 243.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f7 7s2', nobleCore: 'Rn', ie1: 578.0, ie2: 1158.0, ie3: 2130.0, electronAffinity: 9.9, electronegativity: 1.13, covalentRadius: 180, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁸S₇/₂' },
  Cm:  { z: 96,  symbol: 'Cm',  name: 'Curium',       atomicMass: 247.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f7 6d1 7s2', nobleCore: 'Rn', ie1: 581.0, ie2: 1190.0, ie3: 2026.0, electronAffinity: 27.2, electronegativity: 1.28, covalentRadius: 169, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁹D₂' },
  Bk:  { z: 97,  symbol: 'Bk',  name: 'Berkelium',    atomicMass: 247.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f9 7s2', nobleCore: 'Rn', ie1: 601.0, ie2: 1180.0, ie3: 2170.0, electronAffinity: -165.2, electronegativity: 1.30, covalentRadius: 168, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁶H₁₅/₂' },
  Cf:  { z: 98,  symbol: 'Cf',  name: 'Californium',  atomicMass: 251.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f10 7s2', nobleCore: 'Rn', ie1: 608.0, ie2: 1200.0, ie3: 2280.0, electronAffinity: -97.3, electronegativity: 1.30, covalentRadius: 168, crystalStructure: 'Double Hexagonal Close-Packed (DHCP)', coordinationNumber: 12, groundTermSymbol: '⁵I₈' },
  Es:  { z: 99,  symbol: 'Es',  name: 'Einsteinium',  atomicMass: 252.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f11 7s2', nobleCore: 'Rn', ie1: 619.0, ie2: 1210.0, ie3: 2330.0, electronAffinity: -28.6, electronegativity: 1.30, covalentRadius: 165, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '⁴I₁₅/₂' },
  Fm:  { z: 100, symbol: 'Fm',  name: 'Fermium',      atomicMass: 257.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f12 7s2', nobleCore: 'Rn', ie1: 627.0, ie2: 1230.0, ie3: 2380.0, electronAffinity: 33.9, electronegativity: 1.30, covalentRadius: 167, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³H₆' },
  Md:  { z: 101, symbol: 'Md',  name: 'Mendelevium',  atomicMass: 258.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f13 7s2', nobleCore: 'Rn', ie1: 635.0, ie2: 1260.0, ie3: 2470.0, electronAffinity: 93.9, electronegativity: 1.30, covalentRadius: 173, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '²F₇/₂' },
  No:  { z: 102, symbol: 'No',  name: 'Nobelium',     atomicMass: 259.0,    period: 7, group: 3,  block: 'f', standardConfig: '[Rn] 5f14 7s2', nobleCore: 'Rn', ie1: 642.0, ie2: 1280.0, ie3: 2550.0, electronAffinity: -223.2, electronegativity: 1.30, covalentRadius: 176, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Lr:  { z: 103, symbol: 'Lr',  name: 'Lawrencium',   atomicMass: 266.0,    period: 7, group: 3,  block: 'p', standardConfig: '[Rn] 5f14 7s2 7p1', nobleCore: 'Rn', ie1: 470.0, ie2: 1428.0, ie3: 2200.0, electronAffinity: -30.0, electronegativity: 1.30, covalentRadius: 161, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²P₁/₂' },
  Rf:  { z: 104, symbol: 'Rf',  name: 'Rutherfordium', atomicMass: 267.0,   period: 7, group: 4,  block: 'd', standardConfig: '[Rn] 5f14 6d2 7s2', nobleCore: 'Rn', ie1: 580.0, ie2: 1390.0, ie3: 2300.0, electronAffinity: null, electronegativity: null, covalentRadius: 157, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³F₂' },
  Db:  { z: 105, symbol: 'Db',  name: 'Dubnium',      atomicMass: 268.0,    period: 7, group: 5,  block: 'd', standardConfig: '[Rn] 5f14 6d3 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 149, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁴F₃/₂' },
  Sg:  { z: 106, symbol: 'Sg',  name: 'Seaborgium',   atomicMass: 269.0,    period: 7, group: 6,  block: 'd', standardConfig: '[Rn] 5f14 6d4 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 143, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁵D₀' },
  Bh:  { z: 107, symbol: 'Bh',  name: 'Bohrium',      atomicMass: 270.0,    period: 7, group: 7,  block: 'd', standardConfig: '[Rn] 5f14 6d5 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 141, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁶S₅/₂' },
  Hs:  { z: 108, symbol: 'Hs',  name: 'Hassium',      atomicMass: 270.0,    period: 7, group: 8,  block: 'd', standardConfig: '[Rn] 5f14 6d6 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 134, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '⁵D₄' },
  Mt:  { z: 109, symbol: 'Mt',  name: 'Meitnerium',   atomicMass: 278.0,    period: 7, group: 9,  block: 'd', standardConfig: '[Rn] 5f14 6d7 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 129, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '⁴F₉/₂' },
  Ds:  { z: 110, symbol: 'Ds',  name: 'Darmstadtium', atomicMass: 281.0,    period: 7, group: 10, block: 'd', standardConfig: '[Rn] 5f14 6d8 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 128, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '³F₄' },
  Rg:  { z: 111, symbol: 'Rg',  name: 'Roentgenium',  atomicMass: 282.0,    period: 7, group: 11, block: 'd', standardConfig: '[Rn] 5f14 6d9 7s2', nobleCore: 'Rn', ie1: null,  ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 121, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '²D₅/₂' },
  Cn:  { z: 112, symbol: 'Cn',  name: 'Copernicium',  atomicMass: 285.0,    period: 7, group: 12, block: 'd', standardConfig: '[Rn] 5f14 6d10 7s2', nobleCore: 'Rn', ie1: null, ie2: null,   ie3: null,   electronAffinity: null, electronegativity: null, covalentRadius: 122, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '¹S₀' },
  Nh:  { z: 113, symbol: 'Nh',  name: 'Nihonium',     atomicMass: 286.0,    period: 7, group: 13, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p1', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 136, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '²P₁/₂' },
  Fl:  { z: 114, symbol: 'Fl',  name: 'Flerovium',    atomicMass: 289.0,    period: 7, group: 14, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p2', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 143, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 12, groundTermSymbol: '³P₀' },
  Mc:  { z: 115, symbol: 'Mc',  name: 'Moscovium',    atomicMass: 290.0,    period: 7, group: 15, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p3', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 162, crystalStructure: 'Body-Centered Cubic (BCC)', coordinationNumber: 8, groundTermSymbol: '⁴S₃/₂' },
  Lv:  { z: 116, symbol: 'Lv',  name: 'Livermorium',  atomicMass: 293.0,    period: 7, group: 16, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p4', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 175, crystalStructure: 'Hexagonal Close-Packed (HCP)', coordinationNumber: 12, groundTermSymbol: '³P₂' },
  Ts:  { z: 117, symbol: 'Ts',  name: 'Tennessine',   atomicMass: 294.0,    period: 7, group: 17, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p5', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 165, crystalStructure: 'Face-Centered Cubic (FCC)', coordinationNumber: 1, groundTermSymbol: '²P₃/₂' },
  Og:  { z: 118, symbol: 'Og',  name: 'Oganesson',    atomicMass: 294.0,    period: 7, group: 18, block: 'p', standardConfig: '[Rn] 5f14 6d10 7s2 7p6', nobleCore: 'Rn', ie1: null, ie2: null, ie3: null, electronAffinity: null, electronegativity: null, covalentRadius: 157, crystalStructure: 'Face-Centered Cubic (Predicted)', coordinationNumber: 12, groundTermSymbol: '¹S₀' }
};

/**
 * Parses user input e.g. "Fe", "Fe+2", "Fe2+", "fe+3", "O-2", "O2-", "26".
 */
export function parseElementQuery(input: string): { symbol: string; charge: number } | null {
  if (!input) return null;
  const clean = input.trim();

  // If user entered atomic number e.g. "26"
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    const found = Object.values(ELEMENTS_DB).find(e => e.z === num);
    if (found) return { symbol: found.symbol, charge: 0 };
    return null;
  }

  // Regex for Symbol + optional charge: "Fe+2", "Fe2+", "Fe++", "Fe-", "Cl-"
  const match = clean.match(/^([A-Za-z]{1,2})(?:([+-]?\d+)|(\d+[+-])|([+-]+))?$/);
  if (!match) return null;

  const rawSym = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  if (!ELEMENTS_DB[rawSym]) return null;

  let charge = 0;
  if (match[2]) {
    // Form: "+2" or "-2"
    charge = parseInt(match[2], 10);
  } else if (match[3]) {
    // Form: "2+" or "2-"
    const num = parseInt(match[3].slice(0, -1), 10);
    const sign = match[3].slice(-1);
    charge = sign === '+' ? num : -num;
  } else if (match[4]) {
    // Form: "++", "+", "-", "--"
    const sign = match[4][0];
    const len = match[4].length;
    charge = sign === '+' ? len : -len;
  }

  return { symbol: rawSym, charge };
}

/**
 * Computes Slater's screening constant (S) and effective nuclear charge (Z_eff)
 * for the outermost valence electron.
 */
export function calculateSlaterZeff(z: number, subshells: SubshellConfig[]): { S: number; Zeff: number } {
  if (subshells.length === 0) return { S: 0, Zeff: z };

  // Identify outermost occupied subshell
  const outermost = subshells[subshells.length - 1];
  const targetN = outermost.n;
  const isTargetSP = outermost.l === 0 || outermost.l === 1;

  let S = 0;

  subshells.forEach(sub => {
    const n = sub.n;
    const l = sub.l;
    let electrons = sub.electrons;

    if (sub.subshell === outermost.subshell) {
      // Electron in question doesn't shield itself
      electrons -= 1;
    }

    if (electrons <= 0) return;

    if (isTargetSP) {
      // Target is in s or p group
      if (n === targetN) {
        S += electrons * 0.35;
      } else if (n === targetN - 1) {
        S += electrons * 0.85;
      } else if (n < targetN - 1) {
        S += electrons * 1.00;
      }
    } else {
      // Target is in d or f group
      if (n === targetN && l === outermost.l) {
        S += electrons * 0.35;
      } else if (n < targetN || (n === targetN && l < outermost.l)) {
        S += electrons * 1.00;
      }
    }
  });

  // Special rule for 1s: shielding is 0.30 instead of 0.35
  if (outermost.subshell === '1s') {
    S = (outermost.electrons - 1) * 0.30;
  }

  const Zeff = parseFloat((z - S).toFixed(2));
  return { S: parseFloat(S.toFixed(2)), Zeff };
}

/**
 * Builds the Hund's Rule orbital box visualizer for a subshell.
 * Degenerate orbitals fill singly with parallel spin (+1/2) before pairing.
 */
export function populateOrbitalBoxes(l: number, electrons: number) {
  const numBoxes = 2 * l + 1;
  const boxes = [];

  for (let i = 0; i < numBoxes; i++) {
    const ml = -l + i;
    boxes.push({ ml, up: false, down: false });
  }

  // Pass 1: Add spin-up electrons (Hund's Rule)
  let remaining = electrons;
  for (let i = 0; i < numBoxes && remaining > 0; i++) {
    boxes[i].up = true;
    remaining--;
  }

  // Pass 2: Add spin-down electrons (Pauli Exclusion)
  for (let i = 0; i < numBoxes && remaining > 0; i++) {
    boxes[i].down = true;
    remaining--;
  }

  return boxes;
}

/**
 * Master solver for electron configuration, ionization, and quantum properties.
 */
export function solveElectronConfiguration(input: string): ConfigResult {
  const parsed = parseElementQuery(input);
  if (!parsed) {
    return {
      z: 0,
      symbol: '',
      name: '',
      charge: 0,
      totalElectrons: 0,
      fullConfigString: '',
      nobleConfigString: '',
      nobleCoreUsed: '',
      isIon: false,
      subshells: [],
      unpairedElectrons: 0,
      magneticState: 'Diamagnetic',
      magneticMomentBM: 0,
      valenceElectrons: 0,
      coreElectrons: 0,
      differentiatingQuantumNumbers: null,
      slaterScreeningS: 0,
      effectiveNuclearChargeZeff: 0,
      ionizationEnergies: { ie1: null, ie2: null, ie3: null },
      electronAffinity: null,
      electronegativity: null,
      covalentRadius: null,
      crystalStructure: '',
      coordinationNumber: null,
      groundTermSymbol: '',
      aufbauExceptionsNoted: [],
      homeworkSteps: [],
      latexBlock: '',
      isValid: false,
      errorMessage: `Could not identify chemical element or ion from "${input}". Try "Fe", "Fe+2", "Cr", or "O-2".`
    };
  }

  const elem = ELEMENTS_DB[parsed.symbol];
  const z = elem.z;
  const charge = parsed.charge;
  const totalElectrons = z - charge;

  if (totalElectrons < 0) {
    return {
      z,
      symbol: elem.symbol,
      name: elem.name,
      charge,
      totalElectrons,
      fullConfigString: '',
      nobleConfigString: '',
      nobleCoreUsed: '',
      isIon: true,
      subshells: [],
      unpairedElectrons: 0,
      magneticState: 'Diamagnetic',
      magneticMomentBM: 0,
      valenceElectrons: 0,
      coreElectrons: 0,
      differentiatingQuantumNumbers: null,
      slaterScreeningS: 0,
      effectiveNuclearChargeZeff: 0,
      ionizationEnergies: { ie1: elem.ie1, ie2: elem.ie2, ie3: elem.ie3 },
      electronAffinity: elem.electronAffinity,
      electronegativity: elem.electronegativity,
      covalentRadius: elem.covalentRadius,
      crystalStructure: elem.crystalStructure,
      coordinationNumber: elem.coordinationNumber,
      groundTermSymbol: elem.groundTermSymbol,
      aufbauExceptionsNoted: [],
      homeworkSteps: [],
      latexBlock: '',
      isValid: false,
      errorMessage: `Positive charge (+${charge}) exceeds atomic number (${z}). An atom cannot have negative electrons.`
    };
  }

  const aufbauExceptionsNoted: string[] = [];
  const homeworkSteps: string[] = [];
  homeworkSteps.push(`Target Entity: ${elem.name} (${elem.symbol}), Atomic Number Z = ${z}.`);
  if (charge !== 0) {
    homeworkSteps.push(`Ionic State: Charge = ${charge > 0 ? `+${charge}` : charge}, Total Electrons = ${totalElectrons}.`);
  } else {
    homeworkSteps.push(`Neutral Ground State: Total Electrons = ${totalElectrons}.`);
  }

  // Step A: Determine Neutral Ground State Configuration
  // Check if element has an anomalous Aufbau override in database
  const neutralOccupancy: Record<string, number> = {};

  if (elem.standardConfig.includes('[')) {
    // Has noble gas shorthand: expand into neutral subshell map
    // First, fill noble gas core
    const coreMatch = elem.standardConfig.match(/^\[([A-Za-z]+)\]\s*(.*)$/);
    if (coreMatch) {
      const coreSym = coreMatch[1];
      const remainder = coreMatch[2];
      const noble = NOBLE_GAS_CORES.find(n => n.symbol === coreSym);
      if (noble) {
        noble.subshells.forEach(s => {
          const cap = AUFBAU_ORDER.find(a => a.label === s)?.capacity || 2;
          neutralOccupancy[s] = cap;
        });
      }
      // Fill remainder
      const tokens = remainder.trim().split(/\s+/);
      tokens.forEach(tok => {
        const m = tok.match(/^(\d[spdf])(\d+)$/);
        if (m) neutralOccupancy[m[1]] = parseInt(m[2], 10);
      });
    }
  } else if (elem.standardConfig === '1s1') {
    neutralOccupancy['1s'] = 1;
  } else if (elem.standardConfig === '1s2') {
    neutralOccupancy['1s'] = 2;
  } else {
    // Standard Aufbau filling for elements without explicit override
    let eLeft = z;
    for (const sub of AUFBAU_ORDER) {
      if (eLeft <= 0) break;
      const count = Math.min(eLeft, sub.capacity);
      neutralOccupancy[sub.label] = count;
      eLeft -= count;
    }
  }

  // Detect Aufbau exception
  let standardAufbauExpected = '';
  let tempLeft = z;
  const expectedMap: Record<string, number> = {};
  for (const sub of AUFBAU_ORDER) {
    if (tempLeft <= 0) break;
    const count = Math.min(tempLeft, sub.capacity);
    expectedMap[sub.label] = count;
    tempLeft -= count;
  }
  const isAnomalous = Object.keys(neutralOccupancy).some(k => neutralOccupancy[k] !== expectedMap[k]);
  if (isAnomalous) {
    aufbauExceptionsNoted.push(`${elem.symbol} is an Aufbau anomaly: possesses enhanced stability from half-filled or fully-filled subshells.`);
    homeworkSteps.push(`Aufbau Exception: Ground state configuration exhibits subshell promotion for exchange energy stability.`);
  }

  // Step B: Ionization Rule (Outer Shell First Rule for Cations)
  // Strip electrons from highest principal quantum number (n), then highest l.
  const activeOccupancy = { ...neutralOccupancy };

  if (charge > 0) {
    // Remove electrons outer-shell first
    let electronsToRemove = charge;
    homeworkSteps.push(`Ionization Protocol (Outer-Shell-First Rule): Stripping ${charge} electron(s) from highest principal shell (n).`);

    while (electronsToRemove > 0) {
      // Find occupied subshell with maximum n, then maximum l
      let bestSub: string | null = null;
      let maxN = -1;
      let maxL = -1;

      Object.keys(activeOccupancy).forEach(subKey => {
        if (activeOccupancy[subKey] > 0) {
          const item = AUFBAU_ORDER.find(a => a.label === subKey);
          if (item) {
            if (item.n > maxN || (item.n === maxN && item.l > maxL)) {
              maxN = item.n;
              maxL = item.l;
              bestSub = subKey;
            }
          }
        }
      });

      if (!bestSub) break;

      const currentCount = activeOccupancy[bestSub];
      const take = Math.min(currentCount, electronsToRemove);
      activeOccupancy[bestSub] -= take;
      electronsToRemove -= take;
      homeworkSteps.push(`Removed ${take} electron(s) from ${bestSub} subshell (remaining in ${bestSub}: ${activeOccupancy[bestSub]}).`);
    }
  } else if (charge < 0) {
    // Add electrons following Aufbau filling order
    let electronsToAdd = Math.abs(charge);
    homeworkSteps.push(`Anion Formation: Adding ${electronsToAdd} electron(s) into lowest available vacant subshells.`);

    for (const sub of AUFBAU_ORDER) {
      if (electronsToAdd <= 0) break;
      const current = activeOccupancy[sub.label] || 0;
      const space = sub.capacity - current;
      if (space > 0) {
        const add = Math.min(space, electronsToAdd);
        activeOccupancy[sub.label] = current + add;
        electronsToAdd -= add;
        homeworkSteps.push(`Added ${add} electron(s) into ${sub.label} subshell.`);
      }
    }
  }

  // Step C: Assemble SubshellConfig array in standard pedagogical order (by n, then l)
  const subshells: SubshellConfig[] = [];
  const pedagogicalOrder = [...AUFBAU_ORDER].sort((a, b) => {
    if (a.n !== b.n) return a.n - b.n;
    return a.l - b.l;
  });

  let unpairedCount = 0;
  pedagogicalOrder.forEach(item => {
    const count = activeOccupancy[item.label] || 0;
    if (count > 0) {
      const boxes = populateOrbitalBoxes(item.l, count);
      // Count unpaired
      boxes.forEach(b => {
        if ((b.up && !b.down) || (!b.up && b.down)) {
          unpairedCount++;
        }
      });
      subshells.push({
        n: item.n,
        l: item.l,
        subshell: item.label,
        electrons: count,
        capacity: item.capacity,
        boxes
      });
    }
  });

  // Full Configuration String e.g. 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶
  const superscriptDigits: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  const toSuper = (num: number) => num.toString().split('').map(d => superscriptDigits[d] || d).join('');

  const fullConfigString = subshells.map(s => `${s.subshell}${toSuper(s.electrons)}`).join(' ');

  // Noble Gas Shorthand determination
  let nobleCoreUsed = '';
  let nobleConfigString = fullConfigString;

  for (const noble of NOBLE_GAS_CORES) {
    if (totalElectrons > noble.z) {
      nobleCoreUsed = noble.symbol;
      const remainingSubshells = subshells.filter(s => !noble.subshells.includes(s.subshell));
      const remStr = remainingSubshells.map(s => `${s.subshell}${toSuper(s.electrons)}`).join(' ');
      nobleConfigString = `[${noble.symbol}] ${remStr}`.trim();
      break;
    } else if (totalElectrons === noble.z && charge !== 0) {
      // Isoelectronic with noble gas
      nobleCoreUsed = noble.symbol;
      nobleConfigString = `[${noble.symbol}] (Isoelectronic)`;
      break;
    }
  }

  // Step D: Quantum Numbers for the Differentiating (Last Added) Electron
  let diffQuantum: QuantumNumbers | null = null;
  if (subshells.length > 0) {
    const lastSub = subshells[subshells.length - 1];
    const n = lastSub.n;
    const l = lastSub.l;
    const totalInSub = lastSub.electrons;
    const capacity = 2 * l + 1;

    let ml = 0;
    let ms = '+1/2';

    if (totalInSub <= capacity) {
      // Spin up pass
      ml = -l + (totalInSub - 1);
      ms = '+1/2';
    } else {
      // Spin down pass
      ml = -l + (totalInSub - capacity - 1);
      ms = '-1/2';
    }

    diffQuantum = {
      n,
      l,
      ml,
      ms,
      orbitalDesignation: lastSub.subshell
    };
  }

  // Step E: Magnetism & Effective Moment
  const magneticState = unpairedCount > 0 ? 'Paramagnetic' : 'Diamagnetic';
  const magneticMomentBM = parseFloat(Math.sqrt(unpairedCount * (unpairedCount + 2)).toFixed(2));

  // Step F: Slater's Effective Nuclear Charge
  const { S: slaterS, Zeff } = calculateSlaterZeff(z, subshells);

  // Valence vs Core Count
  const maxPrincipalN = subshells.length > 0 ? Math.max(...subshells.map(s => s.n)) : 1;
  let valenceElectrons = 0;
  subshells.forEach(s => {
    // In transition metals, outer s and incomplete (n-1)d count as valence
    if (s.n === maxPrincipalN || (s.n === maxPrincipalN - 1 && s.l === 2 && s.electrons < 10)) {
      valenceElectrons += s.electrons;
    }
  });
  const coreElectrons = totalElectrons - valenceElectrons;

  // LaTeX derivation block
  const latexBlock = `\\begin{aligned} \\text{Species: } &\\text{${elem.name} (${elem.symbol}${charge !== 0 ? (charge > 0 ? `^{${charge}+}` : `^{${Math.abs(charge)}-}`) : ''})} \\\\ \\text{Total } e^-: &${totalElectrons} \\\\ \\text{Full Config: } &${fullConfigString.replace(/([spdf])(\d+)/g, '$1^{$2}')} \\\\ \\text{Noble Shorthand: } &\\mathbf{${nobleConfigString}} \\\\ Z_{\\text{eff}}: &Z - S = ${z} - ${slaterS} = \\mathbf{${Zeff}} \\\\ \\mu_{\\text{eff}}: &\\sqrt{${unpairedCount}(${unpairedCount} + 2)} = \\mathbf{${magneticMomentBM}\\text{ BM}} \\end{aligned}`;

  return {
    z,
    symbol: elem.symbol,
    name: elem.name,
    charge,
    totalElectrons,
    fullConfigString,
    nobleConfigString,
    nobleCoreUsed,
    isIon: charge !== 0,
    subshells,
    unpairedElectrons: unpairedCount,
    magneticState,
    magneticMomentBM,
    valenceElectrons,
    coreElectrons,
    differentiatingQuantumNumbers: diffQuantum,
    slaterScreeningS: slaterS,
    effectiveNuclearChargeZeff: Zeff,
    ionizationEnergies: {
      ie1: elem.ie1,
      ie2: elem.ie2,
      ie3: elem.ie3
    },
    electronAffinity: elem.electronAffinity,
    electronegativity: elem.electronegativity,
    covalentRadius: elem.covalentRadius,
    crystalStructure: elem.crystalStructure,
    coordinationNumber: elem.coordinationNumber,
    groundTermSymbol: elem.groundTermSymbol,
    aufbauExceptionsNoted,
    homeworkSteps,
    latexBlock,
    isValid: true
  };
}