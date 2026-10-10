export interface ToolMeta {
  id: string;
  title: string;
  path: string;
  icon: string;
  badge: string;
  badgeColor?: string;
  description: string;
  priority: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod: string;
}

export const toolsCatalog: ToolMeta[] = [
  {
    id: 'dilution',
    title: 'Serial Dilution Calculator',
    path: '/dilution',
    icon: '💧',
    badge: 'Core Engine',
    description: 'Determine required stock aliquot volumes (V₁) and necessary diluent/solvent additions using standard mass balance (C₁V₁ = C₂V₂) conservation logic.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-09-29'
  },
  {
    id: 'molarity',
    title: 'Solution Molarity Studio',
    path: '/molarity',
    icon: '🧪',
    badge: 'Core Engine',
    description: 'Accurately calculate solute mass with automatic compensation for crystalline hydration water (· nH₂O) and reagent assay purity. Includes printable benchtop labels.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-09-29'
  },
  {
    id: 'scherrer',
    title: 'PXRD Scherrer Crystallite Size',
    path: '/scherrer',
    icon: '🔬',
    badge: 'Materials',
    description: 'Calculate volume-weighted coherent crystalline domain dimensions (D) from Powder X-ray Diffraction peak full-width at half-maximum (FWHM) with source presets.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-09-29'
  },
  {
    id: 'buffer',
    title: 'Buffer Preparation Studio',
    path: '/buffer',
    icon: '⚖️',
    badge: 'Live Studio',
    description: 'Calculate conjugate acid-base masses using the Henderson-Hasselbalch equation. Features dynamic titration curves, Van Slyke capacity (β), and hydrate/purity corrections.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-01'
  },
  {
    id: 'bet',
    title: 'BET Surface Area Analyzer',
    path: '/bet',
    icon: '📊',
    badge: 'New Studio',
    badgeColor: '#059669',
    description: 'Calculate specific surface area (SBET), monolayer volume (Vm), and energetic C-constant from gas adsorption isotherms. Includes Rouquerol checks, dynamic SVG plots, and thermal tube labels.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-02'
  },
  {
    id: 'spectro',
    title: 'UV-Vis & Chemical Kinetics Studio',
    path: '/spectro',
    icon: '🌈',
    badge: 'New Studio',
    badgeColor: '#7c3aed',
    description: 'Solve Beer-Lambert parameters (A = εbc), multi-point standard calibration curves, unknown concentration interpolation, and reaction degradation rate kinetics.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-03'
  },
  {
    id: 'ghs',
    title: 'GHS Hazard & Chemical Safety Studio',
    path: '/ghs',
    icon: '⚠',
    badge: 'Safety Core',
    badgeColor: '#dc2626',
    description: 'Universal chemical entity lookup (110M+ compounds), GHS hazard & precautionary H/P code index, mixture cut-off calculators, and printable OSHA secondary container labels.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-03'
  },
  {
    id: 'isotherm',
    title: 'Adsorption Isotherm Studio',
    path: '/isotherm',
    icon: '🧲',
    badge: 'Materials Core',
    badgeColor: '#0284c7',
    description: 'Fit Langmuir, Freundlich, Temkin, and Dubinin-Radushkevich models from liquid-phase adsorption data. Extract qmax, KL, RL, KF, 1/n, and mean sorption energy E with error analysis.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-04'
  },
  {
    id: 'stoichiometry',
    title: 'Stoichiometry & Reaction Yield Engine',
    path: '/stoichiometry',
    icon: '⚗️',
    badge: 'High Traffic Core',
    badgeColor: '#e11d48',
    description: 'Automatically balance chemical equations, resolve reagent molar masses, identify limiting reactants, and calculate theoretical mass and percent yield.',
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: '2026-10-06'
  },
  {
    id: 'titration',
    title: 'Acid-Base Titration Studio',
    path: '/titration',
    icon: '🧪',
    badge: 'Live Studio',
    badgeColor: '#06b6d4',
    description: 'Simulate dynamic pH neutralization curves, Henderson-Hasselbalch buffer capacities, first-derivative (dpH/dV) inflection detection, and experimental lab scatter overlays.',
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: '2026-10-08'
  },
  {
    id: 'gas',
    title: 'Ideal & Real Gas Thermodynamics Studio',
    path: '/gas',
    icon: '🎈',
    badge: 'High Traffic Core',
    badgeColor: '#0284c7',
    description: 'Solve PV=nRT and Van der Waals real gas states. Compute pressure, volume, temperature, mass, compressibility factor (Z), and density with dynamic P-V isotherm plots.',
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: '2026-10-09'
  },
  {
    id: 'ph',
    title: 'Universal pH & Aqueous Equilibrium Studio',
    path: '/ph',
    icon: '📈',
    badge: 'High Traffic Core',
    badgeColor: '#38bdf8',
    description: 'Circular 4-way solver for pH, pOH, [H⁺], and [OH⁻]. Features exact quadratic weak acid/base ICE equilibrium, temperature-dependent Kw compensation, and live indicator spectrum visualization.',
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: '2026-10-10'
  },
  {
    id: 'molar-mass',
    title: 'Molar Mass & Elemental Composition Studio',
    path: '/molar-mass',
    icon: '⚖️',
    badge: 'High Traffic Core',
    badgeColor: '#f59e0b',
    description: 'Universal chemical formula molar mass calculator. Computes IUPAC molecular weights, elemental mass percentage profiles, nested complexes, hydrates, and two-way grams to moles conversions.',
    priority: '1.0',
    changefreq: 'weekly',
    lastmod: '2026-10-10'
  }
];