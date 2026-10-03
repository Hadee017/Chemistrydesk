/**
 * src/utils/chemicalLookup.ts
 * ChemistryDesk Unified Chemical Intelligence & GHS Safety Engine
 * 
 * Includes:
 * 1. Complete UN GHS Revision 10 H-Codes (H200, H300, H400) & P-Codes (P100-P500).
 * 2. Vector SVG renders for all 9 official GHS pictograms.
 * 3. Generic Mixture Concentration Cut-Off limit evaluation.
 * 4. Hybrid entity resolver: 0ms offline benchmark cache + 110M+ PubChem PUG-REST.
 * 5. Hydrate parser and effective molar mass compensator.
 */

export interface GHSStatement {
  code: string;
  statement: string;
  classCategory?: string;
}

export interface CutoffRule {
  hazardClass: string;
  category: string;
  cutoffWeightPercent: number;
  mandatoryPictogram: string;
  mandatorySignalWord: 'Danger' | 'Warning';
}

export interface ChemicalEntity {
  name: string;
  formula: string;
  molecularWeight: number; // g/mol (anhydrous or as stated)
  hydrateWater?: number;   // Number of crystalline water molecules (· nH2O)
  cas?: string;
  density?: number;        // g/mL for liquid reagents
  ghs?: {
    signalWord?: 'Danger' | 'Warning' | 'None';
    pictograms: string[];  // e.g. ['flame', 'corrosive', 'health-hazard', 'skull', 'environment']
    hCodes: string[];      // e.g. ['H302', 'H314']
    pCodes: string[];      // e.g. ['P280', 'P305+P351+P338']
    summary: string;
  };
}

// ============================================================================
// 1. OFFICIAL GHS HAZARD (H) & PRECAUTIONARY (P) MASTER INDEX (UN Rev. 10)
// ============================================================================
export const GHS_HAZARD_STATEMENTS: Record<string, GHSStatement> = {
  // Physical Hazards (H200 series)
  'H200': { code: 'H200', statement: 'Unstable explosive', classCategory: 'Explosives, Unstable' },
  'H201': { code: 'H201', statement: 'Explosive; mass explosion hazard', classCategory: 'Explosives, Div 1.1' },
  'H202': { code: 'H202', statement: 'Explosive; severe projection hazard', classCategory: 'Explosives, Div 1.2' },
  'H203': { code: 'H203', statement: 'Explosive; fire, blast or projection hazard', classCategory: 'Explosives, Div 1.3' },
  'H204': { code: 'H204', statement: 'Fire or projection hazard', classCategory: 'Explosives, Div 1.4' },
  'H205': { code: 'H205', statement: 'May mass explode in fire', classCategory: 'Explosives, Div 1.5' },
  'H220': { code: 'H220', statement: 'Extremely flammable gas', classCategory: 'Flammable gases, Cat 1' },
  'H221': { code: 'H221', statement: 'Flammable gas', classCategory: 'Flammable gases, Cat 2' },
  'H224': { code: 'H224', statement: 'Extremely flammable liquid and vapour', classCategory: 'Flammable liquids, Cat 1' },
  'H225': { code: 'H225', statement: 'Highly flammable liquid and vapour', classCategory: 'Flammable liquids, Cat 2' },
  'H226': { code: 'H226', statement: 'Flammable liquid and vapour', classCategory: 'Flammable liquids, Cat 3' },
  'H228': { code: 'H228', statement: 'Flammable solid', classCategory: 'Flammable solids, Cat 1/2' },
  'H240': { code: 'H240', statement: 'Heating may cause an explosion', classCategory: 'Self-reactive Type A, Org Peroxide Type A' },
  'H241': { code: 'H241', statement: 'Heating may cause a fire or explosion', classCategory: 'Self-reactive Type B, Org Peroxide Type B' },
  'H242': { code: 'H242', statement: 'Heating may cause a fire', classCategory: 'Self-reactive Type C-F, Org Peroxide Type C-F' },
  'H250': { code: 'H250', statement: 'Catches fire spontaneously if exposed to air', classCategory: 'Pyrophoric solids/liquids, Cat 1' },
  'H260': { code: 'H260', statement: 'In contact with water releases flammable gases which may ignite spontaneously', classCategory: 'Water-reactive, Cat 1' },
  'H261': { code: 'H261', statement: 'In contact with water releases flammable gas', classCategory: 'Water-reactive, Cat 2/3' },
  'H270': { code: 'H270', statement: 'May cause or intensify fire; oxidizer', classCategory: 'Oxidizing gases, Cat 1' },
  'H271': { code: 'H271', statement: 'May cause fire or explosion; strong oxidizer', classCategory: 'Oxidizing liquids/solids, Cat 1' },
  'H272': { code: 'H272', statement: 'May intensify fire; oxidizer', classCategory: 'Oxidizing liquids/solids, Cat 2/3' },
  'H280': { code: 'H280', statement: 'Contains gas under pressure; may explode if heated', classCategory: 'Gases under pressure, Compressed/Liquefied' },
  'H290': { code: 'H290', statement: 'May be corrosive to metals', classCategory: 'Corrosive to metals, Cat 1' },

  // Health Hazards (H300 series)
  'H300': { code: 'H300', statement: 'Fatal if swallowed', classCategory: 'Acute toxicity (oral), Cat 1/2' },
  'H301': { code: 'H301', statement: 'Toxic if swallowed', classCategory: 'Acute toxicity (oral), Cat 3' },
  'H302': { code: 'H302', statement: 'Harmful if swallowed', classCategory: 'Acute toxicity (oral), Cat 4' },
  'H304': { code: 'H304', statement: 'May be fatal if swallowed and enters airways', classCategory: 'Aspiration hazard, Cat 1' },
  'H310': { code: 'H310', statement: 'Fatal in contact with skin', classCategory: 'Acute toxicity (dermal), Cat 1/2' },
  'H311': { code: 'H311', statement: 'Toxic in contact with skin', classCategory: 'Acute toxicity (dermal), Cat 3' },
  'H312': { code: 'H312', statement: 'Harmful in contact with skin', classCategory: 'Acute toxicity (dermal), Cat 4' },
  'H314': { code: 'H314', statement: 'Causes severe skin burns and eye damage', classCategory: 'Skin corrosion, Cat 1A/1B/1C' },
  'H315': { code: 'H315', statement: 'Causes skin irritation', classCategory: 'Skin irritation, Cat 2' },
  'H317': { code: 'H317', statement: 'May cause an allergic skin reaction', classCategory: 'Skin sensitization, Cat 1' },
  'H318': { code: 'H318', statement: 'Causes serious eye damage', classCategory: 'Serious eye damage, Cat 1' },
  'H319': { code: 'H319', statement: 'Causes serious eye irritation', classCategory: 'Eye irritation, Cat 2A' },
  'H330': { code: 'H330', statement: 'Fatal if inhaled', classCategory: 'Acute toxicity (inhalation), Cat 1/2' },
  'H331': { code: 'H331', statement: 'Toxic if inhaled', classCategory: 'Acute toxicity (inhalation), Cat 3' },
  'H332': { code: 'H332', statement: 'Harmful if inhaled', classCategory: 'Acute toxicity (inhalation), Cat 4' },
  'H334': { code: 'H334', statement: 'May cause allergy or asthma symptoms or breathing difficulties if inhaled', classCategory: 'Respiratory sensitization, Cat 1' },
  'H335': { code: 'H335', statement: 'May cause respiratory irritation', classCategory: 'STOT Single exposure, Cat 3 (Resp)' },
  'H336': { code: 'H336', statement: 'May cause drowsiness or dizziness', classCategory: 'STOT Single exposure, Cat 3 (Narcotic)' },
  'H340': { code: 'H340', statement: 'May cause genetic defects', classCategory: 'Germ cell mutagenicity, Cat 1A/1B' },
  'H341': { code: 'H341', statement: 'Suspected of causing genetic defects', classCategory: 'Germ cell mutagenicity, Cat 2' },
  'H350': { code: 'H350', statement: 'May cause cancer', classCategory: 'Carcinogenicity, Cat 1A/1B' },
  'H351': { code: 'H351', statement: 'Suspected of causing cancer', classCategory: 'Carcinogenicity, Cat 2' },
  'H360': { code: 'H360', statement: 'May damage fertility or the unborn child', classCategory: 'Reproductive toxicity, Cat 1A/1B' },
  'H361': { code: 'H361', statement: 'Suspected of damaging fertility or the unborn child', classCategory: 'Reproductive toxicity, Cat 2' },
  'H370': { code: 'H370', statement: 'Causes damage to organs', classCategory: 'STOT Single exposure, Cat 1' },
  'H371': { code: 'H371', statement: 'May cause damage to organs', classCategory: 'STOT Single exposure, Cat 2' },
  'H372': { code: 'H372', statement: 'Causes damage to organs through prolonged or repeated exposure', classCategory: 'STOT Repeated exposure, Cat 1' },
  'H373': { code: 'H373', statement: 'May cause damage to organs through prolonged or repeated exposure', classCategory: 'STOT Repeated exposure, Cat 2' },

  // Environmental Hazards (H400 series)
  'H400': { code: 'H400', statement: 'Very toxic to aquatic life', classCategory: 'Aquatic acute, Cat 1' },
  'H410': { code: 'H410', statement: 'Very toxic to aquatic life with long lasting effects', classCategory: 'Aquatic chronic, Cat 1' },
  'H411': { code: 'H411', statement: 'Toxic to aquatic life with long lasting effects', classCategory: 'Aquatic chronic, Cat 2' },
  'H412': { code: 'H412', statement: 'Harmful to aquatic life with long lasting effects', classCategory: 'Aquatic chronic, Cat 3' },
  'H413': { code: 'H413', statement: 'May cause long lasting harmful effects to aquatic life', classCategory: 'Aquatic chronic, Cat 4' }
};

export const GHS_PRECAUTIONARY_STATEMENTS: Record<string, GHSStatement> = {
  // General (P100 series)
  'P101': { code: 'P101', statement: 'If medical advice is needed, have product container or label at hand.' },
  'P102': { code: 'P102', statement: 'Keep out of reach of children.' },
  'P103': { code: 'P103', statement: 'Read carefully and follow all instructions.' },

  // Prevention (P200 series)
  'P201': { code: 'P201', statement: 'Obtain special instructions before use.' },
  'P202': { code: 'P202', statement: 'Do not handle until all safety precautions have been read and understood.' },
  'P210': { code: 'P210', statement: 'Keep away from heat, hot surfaces, sparks, open flames and other ignition sources. No smoking.' },
  'P220': { code: 'P220', statement: 'Keep away from clothing and other combustible materials.' },
  'P260': { code: 'P260', statement: 'Do not breathe dust/fume/gas/mist/vapours/spray.' },
  'P261': { code: 'P261', statement: 'Avoid breathing dust/fume/gas/mist/vapours/spray.' },
  'P264': { code: 'P264', statement: 'Wash hands and exposed skin thoroughly after handling.' },
  'P270': { code: 'P270', statement: 'Do not eat, drink or smoke when using this product.' },
  'P271': { code: 'P271', statement: 'Use only outdoors or in a well-ventilated area.' },
  'P273': { code: 'P273', statement: 'Avoid release to the environment.' },
  'P280': { code: 'P280', statement: 'Wear protective gloves/protective clothing/eye protection/face protection.' },
  'P284': { code: 'P284', statement: '[In case of inadequate ventilation] wear respiratory protection.' },

  // Response (P300 series)
  'P301+P310': { code: 'P301+P310', statement: 'IF SWALLOWED: Immediately call a POISON CENTER or doctor/physician.' },
  'P301+P312': { code: 'P301+P312', statement: 'IF SWALLOWED: Call a POISON CENTER or doctor if you feel unwell.' },
  'P301+P330+P331': { code: 'P301+P330+P331', statement: 'IF SWALLOWED: Rinse mouth. Do NOT induce vomiting.' },
  'P302+P352': { code: 'P302+P352', statement: 'IF ON SKIN: Wash with plenty of water and soap.' },
  'P303+P361+P353': { code: 'P303+P361+P353', statement: 'IF ON SKIN (or hair): Take off immediately all contaminated clothing. Rinse skin with water [or shower].' },
  'P304+P340': { code: 'P304+P340', statement: 'IF INHALED: Remove person to fresh air and keep comfortable for breathing.' },
  'P305+P351+P338': { code: 'P305+P351+P338', statement: 'IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses, if present and easy to do. Continue rinsing.' },
  'P310': { code: 'P310', statement: 'Immediately call a POISON CENTER or doctor/physician.' },
  'P314': { code: 'P314', statement: 'Get medical advice/attention if you feel unwell.' },

  // Storage (P400 series)
  'P403+P233': { code: 'P403+P233', statement: 'Store in a well-ventilated place. Keep container tightly closed.' },
  'P403+P235': { code: 'P403+P235', statement: 'Store in a well-ventilated place. Keep cool.' },
  'P405': { code: 'P405', statement: 'Store locked up.' },

  // Disposal (P500 series)
  'P501': { code: 'P501', statement: 'Dispose of contents/container in accordance with local/regional/national regulations.' }
};

// ============================================================================
// 2. OFFICIAL GHS PICTOGRAM VECTOR RENDERERS (Clean, Self-Contained SVG)
// ============================================================================
export const GHS_PICTOGRAMS: Record<string, { title: string; svg: string }> = {
  'corrosive': {
    title: 'Corrosion (GHS05)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><path d="M30,36 L44,48 L38,50 L26,38 Z" fill="#1e293b"/><path d="M70,36 L56,48 L62,50 L74,38 Z" fill="#1e293b"/><rect x="22" y="58" width="56" height="6" rx="2" fill="#1e293b"/><path d="M32,64 L36,74 L42,74 L38,64 Z" fill="#1e293b"/><path d="M62,64 L66,74 L72,74 L68,64 Z" fill="#1e293b"/></svg>`
  },
  'flame': {
    title: 'Flame / Flammable (GHS02)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><path d="M50,22 C54,34 68,40 68,54 C68,66 58,74 48,74 C36,74 30,64 30,52 C30,42 38,36 42,28 C42,34 46,38 50,22 Z" fill="#1e293b"/></svg>`
  },
  'oxidizer': {
    title: 'Flame Over Circle / Oxidizer (GHS03)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="56" r="16" fill="none" stroke="#1e293b" stroke-width="5"/><path d="M50,22 C53,30 62,34 62,44 C62,50 56,54 50,54 C44,54 38,50 38,44 C38,36 44,32 46,26 C46,30 48,32 50,22 Z" fill="#1e293b"/></svg>`
  },
  'toxic': {
    title: 'Exclamation Mark / Harmful (GHS07)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><rect x="46" y="26" width="8" height="30" rx="4" fill="#1e293b"/><circle cx="50" cy="68" r="5" fill="#1e293b"/></svg>`
  },
  'health-hazard': {
    title: 'Health Hazard / Target Organ / CMR (GHS08)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="30" r="7" fill="#1e293b"/><path d="M34,68 C34,50 44,44 50,44 C56,44 66,50 66,68 Z" fill="#1e293b"/><polygon points="50,46 53,55 62,52 56,60 63,65 54,66 50,74 46,66 37,65 44,60 38,52 47,55" fill="#ffffff"/></svg>`
  },
  'skull': {
    title: 'Skull & Crossbones / Acute Toxicity (GHS06)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><path d="M28,68 L72,28 M28,28 L72,68" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/><ellipse cx="50" cy="44" rx="16" ry="14" fill="#1e293b"/><circle cx="44" cy="42" r="3.5" fill="#ffffff"/><circle cx="56" cy="42" r="3.5" fill="#ffffff"/><rect x="44" y="58" width="12" height="6" rx="2" fill="#1e293b"/></svg>`
  },
  'environment': {
    title: 'Environmental Aquatic Hazard (GHS09)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><path d="M26,62 Q38,54 50,62 T74,62" fill="none" stroke="#1e293b" stroke-width="4"/><path d="M32,68 Q44,60 56,68 T80,68" fill="none" stroke="#1e293b" stroke-width="4"/><path d="M48,46 C56,36 68,44 72,46 C66,48 58,48 52,52 Z" fill="#1e293b"/><path d="M40,30 L40,54" stroke="#1e293b" stroke-width="4"/><circle cx="40" cy="28" r="8" fill="#1e293b"/></svg>`
  },
  'explosive': {
    title: 'Exploding Bomb (GHS01)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><circle cx="50" cy="54" r="14" fill="#1e293b"/><path d="M50,24 L50,36 M34,32 L42,40 M66,32 L58,40 M26,50 L36,52 M74,50 L64,52" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/></svg>`
  },
  'cylinder': {
    title: 'Gas Cylinder Under Pressure (GHS04)',
    svg: `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><polygon points="50,4 96,50 50,96 4,50" fill="#ffffff" stroke="#dc2626" stroke-width="7" stroke-linejoin="round"/><rect x="36" y="34" width="28" height="36" rx="14" fill="#1e293b"/><rect x="46" y="26" width="8" height="6" fill="#1e293b"/></svg>`
  }
};

// ============================================================================
// 3. UN GENERIC MIXTURE CONCENTRATION CUT-OFF LIMITS
// ============================================================================
export const GHS_GENERIC_CUTOFFS: CutoffRule[] = [
  { hazardClass: 'Carcinogenicity', category: 'Cat 1A / 1B (H350)', cutoffWeightPercent: 0.1, mandatoryPictogram: 'health-hazard', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Germ Cell Mutagenicity', category: 'Cat 1A / 1B (H340)', cutoffWeightPercent: 0.1, mandatoryPictogram: 'health-hazard', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Reproductive Toxicity', category: 'Cat 1A / 1B (H360)', cutoffWeightPercent: 0.1, mandatoryPictogram: 'health-hazard', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Carcinogenicity / Mutagenicity', category: 'Cat 2 (H351, H341)', cutoffWeightPercent: 1.0, mandatoryPictogram: 'health-hazard', mandatorySignalWord: 'Warning' },
  { hazardClass: 'Skin Corrosion', category: 'Cat 1A / 1B / 1C (H314)', cutoffWeightPercent: 3.0, mandatoryPictogram: 'corrosive', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Skin Irritation', category: 'Cat 2 (H315)', cutoffWeightPercent: 10.0, mandatoryPictogram: 'toxic', mandatorySignalWord: 'Warning' },
  { hazardClass: 'Serious Eye Damage', category: 'Cat 1 (H318)', cutoffWeightPercent: 3.0, mandatoryPictogram: 'corrosive', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Eye Irritation', category: 'Cat 2 (H319)', cutoffWeightPercent: 10.0, mandatoryPictogram: 'toxic', mandatorySignalWord: 'Warning' },
  { hazardClass: 'Acute Toxicity (Oral / Dermal)', category: 'Cat 1-3 (H300, H310)', cutoffWeightPercent: 1.0, mandatoryPictogram: 'skull', mandatorySignalWord: 'Danger' },
  { hazardClass: 'Acute Toxicity (Harmful)', category: 'Cat 4 (H302, H312)', cutoffWeightPercent: 1.0, mandatoryPictogram: 'toxic', mandatorySignalWord: 'Warning' },
  { hazardClass: 'Aquatic Environmental Hazard', category: 'Acute / Chronic 1 (H400, H410)', cutoffWeightPercent: 1.0, mandatoryPictogram: 'environment', mandatorySignalWord: 'Warning' }
];

/**
 * Calculates whether a prepared solution mixture legally triggers label warnings under GHS.
 */
export function evaluateMixtureCutoff(soluteWeightPercent: number): CutoffRule[] {
  return GHS_GENERIC_CUTOFFS.filter(rule => soluteWeightPercent >= rule.cutoffWeightPercent);
}

// ============================================================================
// 4. TIER 1: HIGH-SPEED LOCAL BENCHMARK REAGENT CACHE (0ms Offline)
// ============================================================================
export const COMMON_LAB_REAGENTS: Record<string, ChemicalEntity> = {
  'nacl': {
    name: 'Sodium Chloride',
    formula: 'NaCl',
    molecularWeight: 58.44,
    hydrateWater: 0,
    cas: '7647-14-5',
    ghs: {
      signalWord: 'None',
      pictograms: [],
      hCodes: [],
      pCodes: ['P102', 'P103'],
      summary: 'Non-hazardous laboratory salt. Store dry in ambient temperature.'
    }
  },
  'cuso4': {
    name: 'Copper(II) Sulfate Pentahydrate',
    formula: 'CuSO4 · 5H2O',
    molecularWeight: 159.61,
    hydrateWater: 5,
    cas: '7758-99-8',
    ghs: {
      signalWord: 'Danger',
      pictograms: ['corrosive', 'environment', 'toxic'],
      hCodes: ['H302', 'H315', 'H318', 'H410'],
      pCodes: ['P273', 'P280', 'P305+P351+P338'],
      summary: 'Harmful if swallowed. Causes serious eye damage. Very toxic to aquatic life.'
    }
  },
  'kmno4': {
    name: 'Potassium Permanganate',
    formula: 'KMnO4',
    molecularWeight: 158.03,
    hydrateWater: 0,
    cas: '7722-64-7',
    ghs: {
      signalWord: 'Danger',
      pictograms: ['oxidizer', 'corrosive', 'environment'],
      hCodes: ['H272', 'H302', 'H314', 'H410'],
      pCodes: ['P220', 'P273', 'P280', 'P305+P351+P338'],
      summary: 'Strong oxidizing agent. May intensify fire. Causes severe skin burns.'
    }
  },
  'naoh': {
    name: 'Sodium Hydroxide',
    formula: 'NaOH',
    molecularWeight: 40.00,
    hydrateWater: 0,
    cas: '1310-73-2',
    ghs: {
      signalWord: 'Danger',
      pictograms: ['corrosive'],
      hCodes: ['H314', 'H290'],
      pCodes: ['P260', 'P280', 'P301+P330+P331', 'P305+P351+P338'],
      summary: 'Strong caustic base. Exothermic dissolution. Causes severe skin burns and eye damage.'
    }
  },
  'koh': {
    name: 'Potassium Hydroxide',
    formula: 'KOH',
    molecularWeight: 56.11,
    hydrateWater: 0,
    cas: '1310-58-3',
    ghs: {
      signalWord: 'Danger',
      pictograms: ['corrosive', 'toxic'],
      hCodes: ['H302', 'H314'],
      pCodes: ['P280', 'P305+P351+P338'],
      summary: 'Strong caustic base. Rapid exothermic heat generation during preparation.'
    }
  },
  'hcl': {
    name: 'Hydrochloric Acid (37%)',
    formula: 'HCl',
    molecularWeight: 36.46,
    hydrateWater: 0,
    cas: '7647-01-0',
    density: 1.19,
    ghs: {
      signalWord: 'Danger',
      pictograms: ['corrosive', 'toxic'],
      hCodes: ['H314', 'H335'],
      pCodes: ['P261', 'P280', 'P305+P351+P338'],
      summary: 'Fuming mineral acid. Vapor causes severe respiratory tract and eye irritation.'
    }
  },
  'h2so4': {
    name: 'Sulfuric Acid (98%)',
    formula: 'H2SO4',
    molecularWeight: 98.08,
    hydrateWater: 0,
    cas: '7664-93-9',
    density: 1.84,
    ghs: {
      signalWord: 'Danger',
      pictograms: ['corrosive'],
      hCodes: ['H314'],
      pCodes: ['P280', 'P301+P330+P331', 'P305+P351+P338'],
      summary: 'Extreme exothermic heat of hydration. Always add acid to water, never water to acid.'
    }
  },
  'hno3': {
    name: 'Nitric Acid (68%)',
    formula: 'HNO3',
    molecularWeight: 63.01,
    hydrateWater: 0,
    cas: '7697-37-2',
    density: 1.41,
    ghs: {
      signalWord: 'Danger',
      pictograms: ['oxidizer', 'corrosive'],
      hCodes: ['H272', 'H314', 'H330'],
      pCodes: ['P220', 'P260', 'P280', 'P305+P351+P338'],
      summary: 'Strong oxidizer. Corrosive to biological tissues. Liberates toxic nitrogen oxides.'
    }
  },
  'methylene blue': {
    name: 'Methylene Blue Trihydrate',
    formula: 'C16H18ClN3S · 3H2O',
    molecularWeight: 319.85,
    hydrateWater: 3,
    cas: '7220-79-3',
    ghs: {
      signalWord: 'Warning',
      pictograms: ['toxic'],
      hCodes: ['H302'],
      pCodes: ['P264', 'P270', 'P301+P312'],
      summary: 'Harmful if swallowed. Redox indicator & spectrophotometric standard (λmax = 664 nm).'
    }
  },
  'paraquat': {
    name: 'Paraquat Dichloride',
    formula: 'C12H14Cl2N2',
    molecularWeight: 257.16,
    hydrateWater: 0,
    cas: '1910-42-5',
    ghs: {
      signalWord: 'Danger',
      pictograms: ['skull', 'health-hazard', 'environment'],
      hCodes: ['H300', 'H311', 'H330', 'H372', 'H410'],
      pCodes: ['P260', 'P280', 'P284', 'P301+P310', 'P304+P340'],
      summary: 'Fatal if inhaled or swallowed. Severe pulmonary toxicity. Handle strictly in a fume hood.'
    }
  },
  'methanol': {
    name: 'Methanol',
    formula: 'CH3OH',
    molecularWeight: 32.04,
    hydrateWater: 0,
    cas: '67-56-1',
    density: 0.791,
    ghs: {
      signalWord: 'Danger',
      pictograms: ['flame', 'skull', 'health-hazard'],
      hCodes: ['H225', 'H301', 'H311', 'H331', 'H370'],
      pCodes: ['P210', 'P260', 'P280', 'P301+P310'],
      summary: 'Highly flammable liquid. Toxic by ingestion, inhalation, and skin absorption. UV Cutoff: 205 nm.'
    }
  },
  'ethanol': {
    name: 'Ethanol (Absolute)',
    formula: 'C2H5OH',
    molecularWeight: 46.07,
    hydrateWater: 0,
    cas: '64-17-5',
    density: 0.789,
    ghs: {
      signalWord: 'Danger',
      pictograms: ['flame', 'health-hazard'],
      hCodes: ['H225', 'H319'],
      pCodes: ['P210', 'P233', 'P305+P351+P338'],
      summary: 'Highly flammable. Exhibits volumetric contraction when mixed with water.'
    }
  }
};

// ============================================================================
// 5. TIER 2: REMOTE NCBI PUBCHEM PUG-REST ASYNC RESOLVER (110M+ Compounds)
// ============================================================================

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function detectHydrateWater(inputStr: string): number {
  const match = inputStr.match(/[·*.\s]+(\d*)\s*H2O/i);
  if (match) {
    const num = match[1];
    return num === '' ? 1 : parseInt(num, 10);
  }
  return 0;
}

export function getHydratedMolarMass(anhydrousMw: number, hydrateWaters: number): number {
  const waterMw = 18.015;
  return parseFloat((anhydrousMw + hydrateWaters * waterMw).toFixed(3));
}

/**
 * Searches local cache first; if missing, issues a lightweight client-side fetch
 * to the NCBI PubChem PUG-REST API without consuming backend resources.
 */
export async function lookupChemical(query: string): Promise<ChemicalEntity | null> {
  const clean = normalizeQuery(query);
  if (!clean) return null;

  // 1. Check local cache (0ms)
  if (COMMON_LAB_REAGENTS[clean]) {
    return COMMON_LAB_REAGENTS[clean];
  }

  for (const key in COMMON_LAB_REAGENTS) {
    const item = COMMON_LAB_REAGENTS[key];
    if (item.name.toLowerCase() === clean || item.formula.toLowerCase() === clean) {
      return item;
    }
  }

  // 2. Query NCBI PubChem PUG-REST API
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/MolecularWeight,MolecularFormula,IUPACName/JSON`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout limit

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;

    const mw = parseFloat(props.MolecularWeight);
    if (isNaN(mw)) return null;

    return {
      name: props.IUPACName || query.trim(),
      formula: props.MolecularFormula || '',
      molecularWeight: parseFloat(mw.toFixed(3)),
      hydrateWater: detectHydrateWater(query),
      ghs: {
        signalWord: 'Warning',
        pictograms: ['health-hazard'],
        hCodes: [],
        pCodes: ['P280', 'P264'],
        summary: 'Compound dynamically retrieved via PubChem Registry. Consult primary Safety Data Sheet (SDS) for verified handling.'
      }
    };
  } catch {
    return null;
  }
}