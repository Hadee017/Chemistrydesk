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
  }
];