// src/site.config.js
export const SITE_CONFIG = {
  // Brand & Core Identity (Optimized for E-E-A-T)
  name: "Chemistrycal",
  tagline: "Precision Computational Chemistry & Benchtop Laboratory Suite",
  siteUrl: "https://chemistrycal.com", 
  
  // Author & E-E-A-T Credentials (Real Data)
  author: {
    name: "Bilal Khan",
    credentials: "MS in Physical Chemistry & Polymer Study (University of Education Lahore)",
    title: "Lead Computational Chemist & Materials Scientist",
    email: "contact@chemistrycal.com",
    bio: "Specializing in porous material characterization (BET / PXRD), gas physisorption equilibria, and aqueous solution thermodynamics. All formula derivations and calibration tolerances across Chemistrycal are verified against empirical standards.",
    avatar: "/images/bilal-khan.jpg",
    identifiers: {
      orcid: "https://orcid.org/0009-0006-3082-7043",
      zenodo: "https://doi.org/10.5281/zenodo.23059466",
      wikidata: "https://www.wikidata.org/wiki/Q141699332",
      linkedin: "https://www.linkedin.com/in/bilal-khan-bbb259248",
      github: "https://github.com/chemistrycal"
    }
  },

  defaultDescription: "High-precision chemical calculation engines, XRD solvers, molecular weight estimators, and laboratory solution formulation utilities running 100% client-side.",
  defaultImage: "/assets/og-chemistrycal-global.png",
  locale: "en_US",
  
  // SEO & Content Silos (The Architecture for Millions of Visits)
  navLinks: [
    { name: "Home", href: "/" },
    { name: "Calculators", href: "/tools" },
    { name: "Compounds Database", href: "/compounds" },
    { name: "Solution Prep", href: "/solutions" },
    { name: "Formulas & Theory", href: "/formulas" }
  ],

  // Programmatic Target Parameters (For scaling thousands of landing pages)
  seoTaxonomies: {
    categories: [
      "Stoichiometry & Molarity",
      "Thermodynamics & Kinetics",
      "Spectroscopy & XRD",
      "Solution Preparation",
      "Analytical Chemistry"
    ],
    targetAudiences: [
      "Undergraduate Chemistry Students",
      "AP/A-Level Chemistry Teachers",
      "Benchtop Laboratory Researchers",
      "Industrial Quality Control Chemists"
    ]
  },

  // Research Publications & Contributions Repository
  contributions: [
    {
      title: "Advanced Oxidation & Catalytic Composite Studies (Zenodo DOI Record)",
      type: "Research Datasets & Preprints",
      platform: "Zenodo",
      url: "https://doi.org/10.5281/zenodo.23059466"
    }
  ]
};