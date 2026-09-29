export interface Reagent {
  id: string;
  name: string;
  formula: string;
  anhydrousMw: number;
  defaultHydrate: number;
  typicalPurity: number;
  category: 'salt' | 'acid' | 'base' | 'standard' | 'buffer';
  ghs: string[];
  notes?: string;
}

export const REAGENTS_DATABASE: Reagent[] = [
  // Primary Standards & Inorganic Salts
  {
    id: 'nacl',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    anhydrousMw: 58.44,
    defaultHydrate: 0,
    typicalPurity: 99.5,
    category: 'salt',
    ghs: ['General / Non-hazardous under standard handling.'],
    notes: 'Primary standard; dry at 110°C prior to analytical titration.'
  },
  {
    id: 'cuso4-5h2o',
    name: 'Copper(II) Sulfate Pentahydrate',
    formula: 'CuSO4·5H2O',
    anhydrousMw: 159.61,
    defaultHydrate: 5,
    typicalPurity: 98.5,
    category: 'salt',
    ghs: ['GHS07 (Harmful)', 'GHS09 (Aquatic Toxicity)', 'H302, H315, H319, H410'],
    notes: 'Classic hydrous salt. Ensure 5 water molecules are accounted for.'
  },
  {
    id: 'feso4-7h2o',
    name: 'Iron(II) Sulfate Heptahydrate',
    formula: 'FeSO4·7H2O',
    anhydrousMw: 151.91,
    defaultHydrate: 7,
    typicalPurity: 99.0,
    category: 'salt',
    ghs: ['GHS07 (Harmful)', 'H302, H315, H319'],
    notes: 'Susceptible to air oxidation to Fe(III); prepare fresh with trace acid.'
  },
  {
    id: 'kmno4',
    name: 'Potassium Permanganate',
    formula: 'KMnO4',
    anhydrousMw: 158.03,
    defaultHydrate: 0,
    typicalPurity: 99.0,
    category: 'standard',
    ghs: ['GHS03 (Oxidizer)', 'GHS05 (Corrosive)', 'GHS08 (Health Hazard)', 'GHS09 (Environment)'],
    notes: 'Strong oxidizer. Store in dark amber glassware; standardize against Na2C2O4.'
  },
  {
    id: 'k2cr2o7',
    name: 'Potassium Dichromate',
    formula: 'K2Cr2O7',
    anhydrousMw: 294.18,
    defaultHydrate: 0,
    typicalPurity: 99.8,
    category: 'standard',
    ghs: ['GHS03 (Oxidizer)', 'GHS06 (Toxic)', 'GHS08 (Carcinogen/Mutagen)', 'GHS05 (Corrosive)'],
    notes: 'Primary redox standard. Handle strictly in a certified fume hood.'
  },
  {
    id: 'agno3',
    name: 'Silver Nitrate',
    formula: 'AgNO3',
    anhydrousMw: 169.87,
    defaultHydrate: 0,
    typicalPurity: 99.8,
    category: 'standard',
    ghs: ['GHS03 (Oxidizer)', 'GHS05 (Corrosive)', 'GHS09 (Aquatic Toxicity)'],
    notes: 'Light-sensitive. Prepare in volumetric flask shielded with aluminum foil.'
  },
  {
    id: 'edta-disodium',
    name: 'EDTA Disodium Salt Dihydrate',
    formula: 'C10H14N2Na2O8·2H2O',
    anhydrousMw: 336.21,
    defaultHydrate: 2,
    typicalPurity: 99.0,
    category: 'standard',
    ghs: ['GHS07 (Harmful)', 'GHS08 (STOT RE 2)', 'H332, H373'],
    notes: 'Standard complexometric chelating agent. Dissolution accelerates at pH 8.0.'
  },
  {
    id: 'znso4-7h2o',
    name: 'Zinc Sulfate Heptahydrate',
    formula: 'ZnSO4·7H2O',
    anhydrousMw: 161.47,
    defaultHydrate: 7,
    typicalPurity: 99.0,
    category: 'salt',
    ghs: ['GHS05 (Corrosive)', 'GHS07 (Harmful)', 'GHS09 (Aquatic Toxicity)'],
    notes: 'Common zinc precursor for nanoparticle and coordination synthesis.'
  },
  {
    id: 'mgso4-7h2o',
    name: 'Magnesium Sulfate Heptahydrate (Epsom Salt)',
    formula: 'MgSO4·7H2O',
    anhydrousMw: 120.37,
    defaultHydrate: 7,
    typicalPurity: 99.5,
    category: 'salt',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Common magnesium source and drying agent precursor.'
  },
  {
    id: 'cacl2-2h2o',
    name: 'Calcium Chloride Dihydrate',
    formula: 'CaCl2·2H2O',
    anhydrousMw: 110.98,
    defaultHydrate: 2,
    typicalPurity: 99.0,
    category: 'salt',
    ghs: ['GHS07 (Irritant)', 'H319 (Serious eye irritation)'],
    notes: 'Exothermic dissolution. Add gradually with stirring.'
  },
  {
    id: 'naoh',
    name: 'Sodium Hydroxide Pellets',
    formula: 'NaOH',
    anhydrousMw: 40.00,
    defaultHydrate: 0,
    typicalPurity: 98.0,
    category: 'base',
    ghs: ['GHS05 (Corrosive)', 'H314 (Causes severe skin burns and eye damage)'],
    notes: 'Strongly exothermic and hygroscopic. Standardize against potassium hydrogen phthalate.'
  },
  {
    id: 'koh',
    name: 'Potassium Hydroxide Pellets',
    formula: 'KOH',
    anhydrousMw: 56.11,
    defaultHydrate: 0,
    typicalPurity: 85.0,
    category: 'base',
    ghs: ['GHS05 (Corrosive)', 'GHS07 (Harmful)', 'H302, H314'],
    notes: 'Commercial pellets typically contain 10-15% water and carbonates.'
  },
  {
    id: 'na2co3',
    name: 'Sodium Carbonate Anhydrous (Soda Ash)',
    formula: 'Na2CO3',
    anhydrousMw: 105.99,
    defaultHydrate: 0,
    typicalPurity: 99.5,
    category: 'standard',
    ghs: ['GHS07 (Irritant)', 'H319'],
    notes: 'Primary standard for titrimetric acid standardization. Dry at 250°C for 2h.'
  },
  {
    id: 'nahco3',
    name: 'Sodium Bicarbonate',
    formula: 'NaHCO3',
    anhydrousMw: 84.01,
    defaultHydrate: 0,
    typicalPurity: 99.7,
    category: 'salt',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Common physiological buffer component and gentle neutralizing agent.'
  },
  {
    id: 'khp',
    name: 'Potassium Hydrogen Phthalate (KHP)',
    formula: 'C8H5KO4',
    anhydrousMw: 204.22,
    defaultHydrate: 0,
    typicalPurity: 99.9,
    category: 'standard',
    ghs: ['Non-hazardous; analytical primary standard.'],
    notes: 'Primary standard for standardizing aqueous NaOH and calibration of pH electrodes.'
  },
  {
    id: 'oxalic-acid-2h2o',
    name: 'Oxalic Acid Dihydrate',
    formula: 'C2H2O4·2H2O',
    anhydrousMw: 90.03,
    defaultHydrate: 2,
    typicalPurity: 99.5,
    category: 'standard',
    ghs: ['GHS05 (Corrosive)', 'GHS07 (Harmful)', 'H302, H312, H318'],
    notes: 'Redox standard for permanganate titrations.'
  },
  {
    id: 'na2s2o3-5h2o',
    name: 'Sodium Thiosulfate Pentahydrate',
    formula: 'Na2S2O3·5H2O',
    anhydrousMw: 158.11,
    defaultHydrate: 5,
    typicalPurity: 99.0,
    category: 'standard',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Iodometric titrant. Stabilize solutions with ~0.1 g/L Na2CO3 to prevent bacterial decay.'
  },
  {
    id: 'tris-base',
    name: 'Tris Base (Tris(hydroxymethyl)aminomethane)',
    formula: 'C4H11NO3',
    anhydrousMw: 121.14,
    defaultHydrate: 0,
    typicalPurity: 99.8,
    category: 'buffer',
    ghs: ['GHS07 (Irritant)', 'H315, H319, H335'],
    notes: 'Primary biological buffer (pKa = 8.06 at 25°C). Strong temperature-dependent pH shift.'
  },
  {
    id: 'hepes',
    name: 'HEPES Free Acid',
    formula: 'C8H18N2O4S',
    anhydrousMw: 238.30,
    defaultHydrate: 0,
    typicalPurity: 99.5,
    category: 'buffer',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Zwitterionic Good buffer (pKa = 7.55 at 25°C) ideal for cell culture and biochemical assays.'
  },
  {
    id: 'glucose-anhydrous',
    name: 'D-Glucose Anhydrous (Dextrose)',
    formula: 'C6H12O6',
    anhydrousMw: 180.16,
    defaultHydrate: 0,
    typicalPurity: 99.5,
    category: 'standard',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Standard metabolic substrate and analytical calibration reference.'
  },
  {
    id: 'glycine',
    name: 'Glycine',
    formula: 'C2H5NO2',
    anhydrousMw: 75.07,
    defaultHydrate: 0,
    typicalPurity: 99.0,
    category: 'buffer',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Common electrophoresis buffer (SDS-PAGE) and amino acid standard.'
  },
  {
    id: 'ni-cl2-6h2o',
    name: 'Nickel(II) Chloride Hexahydrate',
    formula: 'NiCl2·6H2O',
    anhydrousMw: 129.60,
    defaultHydrate: 6,
    typicalPurity: 98.0,
    category: 'salt',
    ghs: ['GHS06 (Toxic)', 'GHS08 (Carcinogen/Sensitizer)', 'GHS09 (Environment)'],
    notes: 'Strong contact allergen and carcinogen. Handle with dedicated nitrile gloves.'
  },
  {
    id: 'co-cl2-6h2o',
    name: 'Cobalt(II) Chloride Hexahydrate',
    formula: 'CoCl2·6H2O',
    anhydrousMw: 129.84,
    defaultHydrate: 6,
    typicalPurity: 98.0,
    category: 'salt',
    ghs: ['GHS08 (Reproductive/Carcinogen)', 'GHS07 (Harmful)', 'GHS09 (Aquatic)'],
    notes: 'Moisture indicator; deep red crystals turning blue upon complete dehydration.'
  },
  {
    id: 'kcl',
    name: 'Potassium Chloride',
    formula: 'KCl',
    anhydrousMw: 74.55,
    defaultHydrate: 0,
    typicalPurity: 99.5,
    category: 'salt',
    ghs: ['Non-hazardous under routine laboratory conditions.'],
    notes: 'Used to prepare 3M KCl electrolyte solutions for storage of pH and reference electrodes.'
  }
];