// src/data/polyatomicData.ts

export interface PolyatomicIon {
  name: string;
  formula: string; // e.g. "SO4"
  latex: string;   // e.g. "SO_{4}^{2-}"
  charge: string;  // e.g. "-2"
  type: "cation" | "anion";
  category: "sulfates" | "nitrates" | "carbonates" | "phosphates" | "acetates" | "hydroxides";
  description: string;
}

export const POLYATOMIC_IONS_DATA: PolyatomicIon[] = [
  {
    name: "Ammonium",
    formula: "NH4+",
    latex: "NH_{4}^{+}",
    charge: "+1",
    type: "cation",
    category: "hydroxides",
    description: "Common polyatomic cation derived from protonation of ammonia."
  },
  {
    name: "Hydronium",
    formula: "H3O+",
    latex: "H_{3}O^{+}",
    charge: "+1",
    type: "cation",
    category: "hydroxides",
    description: "The form taken by a hydrogen ion in aqueous solution."
  },
  {
    name: "Hydroxide",
    formula: "OH-",
    latex: "OH^{-}",
    charge: "-1",
    type: "anion",
    category: "hydroxides",
    description: "Diatomic anion with an oxygen and hydrogen atom held by a single covalent bond."
  },
  {
    name: "Nitrate",
    formula: "NO3-",
    latex: "NO_{3}^{-}",
    charge: "-1",
    type: "anion",
    category: "nitrates",
    description: "Polyatomic ion with molecular formula NO3−, essential in fertilizers and energetic materials."
  },
  {
    name: "Nitrite",
    formula: "NO2-",
    latex: "NO_{2}^{-}",
    charge: "-1",
    type: "anion",
    category: "nitrates",
    description: "Symmetric anion important in nitrogen cycling and food preservation."
  },
  {
    name: "Sulfate",
    formula: "SO42-",
    latex: "SO_{4}^{2-}",
    charge: "-2",
    type: "anion",
    category: "sulfates",
    description: "Widely used in metal salts, precipitations, and coordination frameworks like ZrP composites."
  },
  {
    name: "Sulfite",
    formula: "SO32-",
    latex: "SO_{3}^{2-}",
    charge: "-2",
    type: "anion",
    category: "sulfates",
    description: "Derived from sulfurous acid, acts as a reducing agent."
  },
  {
    name: "Carbonate",
    formula: "CO32-",
    latex: "CO_{3}^{2-}",
    charge: "-2",
    type: "anion",
    category: "carbonates",
    description: "Forms extensive mineral deposits like limestone and metal carbonates."
  },
  {
    name: "Bicarbonate (Hydrogen Carbonate)",
    formula: "HCO3-",
    latex: "HCO_{3}^{-}",
    charge: "-1",
    type: "anion",
    category: "carbonates",
    description: "Crucial physiological buffer component regulating blood pH balance."
  },
  {
    name: "Phosphate",
    formula: "PO43-",
    latex: "PO_{4}^{3-}",
    charge: "-3",
    type: "anion",
    category: "phosphates",
    description: "Trivalent anion foundational in nucleic acids, ATP energy transfer, and metal phosphates."
  },
  {
    name: "Acetate",
    formula: "CH3COO-",
    latex: "CH_{3}COO^{-}",
    charge: "-1",
    type: "anion",
    category: "acetates",
    description: "Simple carboxylate anion used heavily in buffer solutions and organic synthesis."
  },
  {
    name: "Permanganate",
    formula: "MnO4-",
    latex: "MnO_{4}^{-}",
    charge: "-1",
    type: "anion",
    category: "sulfates",
    description: "Intense purple oxidizing agent used in redox titrations and synthetic organic reactions."
  }
];