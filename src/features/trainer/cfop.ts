export interface CfopStage {
  id: "cross" | "f2l" | "oll" | "pll";
  /** The method this stage belongs to — the "Método → Etapa" relation. */
  methodId: "cfop";
  label: string;
  description: string;
  accent: string;
}

/** The four CFOP stages shown on the Entrenar screen. No cases/algorithms yet. */
export const CFOP_STAGES: CfopStage[] = [
  {
    id: "cross",
    methodId: "cfop",
    label: "Cross",
    description: "Aprende la cruz y sus fundamentos.",
    accent: "var(--cube-blue)",
  },
  {
    id: "f2l",
    methodId: "cfop",
    label: "F2L",
    description: "First Two Layers.",
    accent: "var(--cube-green)",
  },
  {
    id: "oll",
    methodId: "cfop",
    label: "OLL",
    description: "Orientación de la última capa.",
    accent: "var(--cube-yellow)",
  },
  {
    id: "pll",
    methodId: "cfop",
    label: "PLL",
    description: "Permutación de la última capa.",
    accent: "var(--cube-violet)",
  },
];
