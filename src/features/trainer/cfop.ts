export interface CfopStage {
  id: "cross" | "f2l" | "oll" | "pll";
  label: string;
  description: string;
  accent: string;
}

/** The four CFOP stages shown on the Entrenar screen. No cases/algorithms yet. */
export const CFOP_STAGES: CfopStage[] = [
  {
    id: "cross",
    label: "Cross",
    description: "Aprende la cruz y sus fundamentos.",
    accent: "var(--cube-blue)",
  },
  {
    id: "f2l",
    label: "F2L",
    description: "First Two Layers.",
    accent: "var(--cube-green)",
  },
  {
    id: "oll",
    label: "OLL",
    description: "Orientación de la última capa.",
    accent: "var(--cube-yellow)",
  },
  {
    id: "pll",
    label: "PLL",
    description: "Permutación de la última capa.",
    accent: "var(--cube-violet)",
  },
];
