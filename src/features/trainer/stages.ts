import { CFOP_STAGES } from "./cfop";
import type { CfopStage } from "./cfop";

/**
 * Stages available for one method — the "Método → Etapa" relation. Only
 * CFOP has stages defined today; a method with no stages yet (or none
 * planned) simply returns an empty list.
 */
export function getStagesForMethod(methodId: string): CfopStage[] {
  if (methodId === "cfop") return CFOP_STAGES;
  return [];
}
