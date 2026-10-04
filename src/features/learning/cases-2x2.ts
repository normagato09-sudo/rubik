/**
 * Aprender del 2×2: the cases of the Ortega and CLL methods, with the
 * algorithms of features/solver2x2/algorithms.ts (docs/source/Ortega.docx
 * and CLL.docx, with the sheet's wrong rows replaced and the two missing
 * CLL cases added) — the tests check every one with the 3D engine against
 * its diagram.
 *
 * Diagrams: the sheets' own, one per row (public/learning/<set>/), in the
 * sheets' colors: yellow on top, white on the bottom. The cases the sheets
 * do not have (the first-layer cases and CLL 41–42) are drawn from the case
 * itself by diagrams-2x2.ts, in the same colors and layout.
 */
import { invertMoves, type Move } from "@/features/cube/moves";
import type { CubeColor } from "@/features/cube/types";
import { parseAlgorithm } from "@/features/solver2x2/algorithm";
import { CLL_CASES, ORTEGA_OLL, ORTEGA_PBL, type CaseAlgorithm } from "@/features/solver2x2/algorithms";
import { applyMoves2, solvedFacelets2 } from "@/features/solver2x2/sticker-moves";
import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";

/** The sheets hold the cube yellow up, white down: RUBIKO's solved cube turned over (z2). */
export const SHEET_FRAME: Move[] = ["z2"];

/** The case an algorithm solves, as stickers held like the sheets (yellow up). */
export function caseFacelets(algorithm: string): CubeColor[] {
  return applyMoves2(applyMoves2(solvedFacelets2(), SHEET_FRAME), invertMoves(parseAlgorithm(algorithm)));
}

const id = (index: number) => String(index + 1).padStart(2, "0");

/** Where a sheet's algorithm was not used, what it said and why. */
function sourceNote(kase: CaseAlgorithm, sheet: string): string | undefined {
  if (kase.source === "documento") return undefined;
  if (kase.doc === null) return `Añadido: ${sheet} no tiene este caso. Se usa el mismo algoritmo que en la PBL de Ortega.`;
  const said = kase.docAlgorithm ? `En ${sheet} (fila ${kase.doc}) pone «${kase.docAlgorithm}», que no resuelve este caso. ` : "";
  return kase.source === "estándar"
    ? `${said}Se usa el algoritmo estándar.`
    : `${said}Se usa «${kase.algorithm}», que en ${sheet} aparece en otra fila y es el que resuelve este caso.`;
}

// ---------- Paso 1: primera cara (Ortega) / primera capa (CLL) ----------

/**
 * The three basic ways of placing a bottom corner. Not in the sheets: the
 * standard beginner inserts, added on purpose. In each, the corner waits
 * right above its place (top, front, right) and only the way its white
 * sticker faces changes.
 */
const FIRST_LAYER = [
  { name: "Blanco a la derecha", algorithm: "R U R'", faces: "mirando a la derecha" },
  { name: "Blanco delante", algorithm: "F' U' F", faces: "mirando hacia ti" },
  { name: "Blanco arriba", algorithm: "R U2 R' U' R U R'", faces: "mirando hacia arriba" },
];

const ADDED_FIRST_LAYER =
  "Añadido: tus documentos no traen casos para este paso. Es el algoritmo estándar para colocar una esquina.";

function firstLayerCases(setId: "primera-cara" | "primera-capa"): AlgorithmCase[] {
  return FIRST_LAYER.map(({ name, algorithm, faces }, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    name,
    algorithm,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation:
      setId === "primera-cara"
        ? `La esquina blanca está arriba, justo encima del hueco de delante a la derecha, con el blanco ${faces}. Este algoritmo la baja con el blanco abajo. En la primera cara solo importa el blanco: sus otros dos colores no tienen que coincidir con los lados.`
        : `La esquina que falta está arriba, justo encima de su hueco (delante a la derecha), con el blanco ${faces}. Este algoritmo la baja a su sitio, con sus colores coincidiendo con los lados, sin mover el resto de la capa.`,
    note: ADDED_FIRST_LAYER,
  }));
}

// ---------- Ortega ----------

/** How each OLL case looks, as its diagram in Ortega.docx shows it (checked against the picture in the tests). */
const OLL_EXPLANATIONS: Record<string, string> = {
  sune: "Solo una esquina tiene el amarillo arriba (delante a la izquierda, como en el diagrama); las otras tres lo tienen hacia los lados, giradas en el mismo sentido. El algoritmo orienta las cuatro.",
  antisune: "Solo una esquina tiene el amarillo arriba (detrás a la derecha, como en el diagrama); las otras tres lo tienen hacia los lados, giradas en el sentido contrario al Sune. El algoritmo orienta las cuatro.",
  pi: "Ninguna esquina tiene el amarillo arriba. Las dos de la izquierda lo tienen hacia la izquierda (como faros); de las de la derecha, una mira hacia delante y otra hacia atrás. Pon los faros a la izquierda.",
  u: "Dos esquinas vecinas tienen el amarillo arriba (a la derecha); las otras dos lo tienen hacia la izquierda, como faros. Pon los faros a la izquierda.",
  l: "Dos esquinas en diagonal tienen el amarillo arriba (detrás a la derecha y delante a la izquierda). De las otras, la de delante a la derecha mira hacia delante y la de detrás a la izquierda, hacia la izquierda.",
  t: "Dos esquinas vecinas tienen el amarillo arriba (a la derecha); de las de la izquierda, una lo tiene hacia atrás y otra hacia delante.",
  h: "Ninguna esquina tiene el amarillo arriba: las dos de detrás lo tienen hacia atrás y las dos de delante hacia delante (faros a los dos lados). Pon los faros delante y detrás.",
};

/** What each PBL case swaps (the side named is checked in the tests). */
const PBL_EXPLANATIONS: Record<string, string> = {
  adj: "Arriba hay dos esquinas vecinas cambiadas; abajo, todo bien. Un lado de arriba tiene sus dos pegatinas iguales (faros): ponlo a la izquierda y aplica el algoritmo.",
  diag: "Arriba hay dos esquinas en diagonal cambiadas (ningún lado de arriba tiene sus dos pegatinas iguales); abajo, todo bien.",
  "diag-diag": "Arriba y abajo hay dos esquinas en diagonal cambiadas: ningún lado tiene sus dos pegatinas iguales en ninguna capa. R2 F2 R2 arregla las dos a la vez.",
  "adj-adj": "Arriba y abajo hay dos esquinas vecinas cambiadas. Pon los faros de las dos capas detrás (los cambios, delante) y aplica el algoritmo.",
  "adj-diag": "Arriba hay dos vecinas cambiadas y abajo, dos en diagonal. Pon los faros de arriba delante (el cambio, detrás) y aplica el algoritmo.",
};

// ---------- CLL ----------

export const CLL_GROUPS: Record<string, string> = {
  Sune: "Grupo Sune: solo una esquina tiene el amarillo arriba y las otras tres están giradas en el mismo sentido.",
  Antisune: "Grupo Antisune: solo una esquina tiene el amarillo arriba y las otras tres están giradas en el sentido contrario al Sune.",
  Pi: "Grupo Pi: ninguna esquina tiene el amarillo arriba; dos vecinas lo tienen hacia el mismo lado (faros) y las otras dos, hacia lados opuestos.",
  U: "Grupo U: dos esquinas vecinas tienen el amarillo arriba y las otras dos lo tienen hacia el mismo lado (faros).",
  L: "Grupo L: dos esquinas en diagonal tienen el amarillo arriba.",
  T: "Grupo T: dos esquinas vecinas tienen el amarillo arriba y las otras dos lo tienen hacia lados opuestos.",
  H: "Grupo H: ninguna esquina tiene el amarillo arriba; los faros están a los dos lados.",
  Orientada: "Las cuatro esquinas ya tienen el amarillo arriba: solo falta cambiarlas de sitio.",
};

function cllExplanation(kase: (typeof CLL_CASES)[number]): string {
  const moves = parseAlgorithm(kase.algorithm);
  const parts = [CLL_GROUPS[kase.group]];
  if (kase.swap === "adj") parts.push("Dos esquinas vecinas están cambiadas: pon el lado con las dos pegatinas iguales (faros) a la izquierda.");
  if (kase.swap === "diag") parts.push("Dos esquinas en diagonal están cambiadas: ningún lado tiene sus dos pegatinas iguales.");
  if (kase.picture) parts.push("Sujeta el cubo como en el diagrama: el algoritmo orienta y coloca a la vez las cuatro esquinas de arriba.");
  if (/^\(U['2]?\)/.test(kase.algorithm)) parts.push("El giro de U entre paréntesis del principio deja el caso como en el diagrama.");
  const rotation = moves.find((move) => "xyz".includes(move[0]));
  if (rotation) parts.push(`Empieza con ${rotation}, un giro de todo el cubo.`);
  parts.push("Al terminar, gira la cara de arriba si hace falta para alinearla.");
  return parts.join(" ");
}

// ---------- the sets ----------

export const PRIMERA_CARA_CASES = firstLayerCases("primera-cara");
export const PRIMERA_CAPA_CASES = firstLayerCases("primera-capa");

export const ORTEGA_OLL_CASES: AlgorithmCase[] = ORTEGA_OLL.map((kase, index) => ({
  setId: "ortega-oll",
  id: id(index),
  number: index + 1,
  name: kase.name,
  algorithm: kase.algorithm,
  image: `/learning/ortega-oll/ortega-oll-${id(index)}.png`,
  explanation: OLL_EXPLANATIONS[kase.id],
  note: sourceNote(kase, "Ortega.docx"),
}));

export const ORTEGA_PBL_CASES: AlgorithmCase[] = ORTEGA_PBL.map((kase, index) => ({
  setId: "ortega-pbl",
  id: id(index),
  number: index + 1,
  name: kase.name,
  algorithm: kase.algorithm,
  image: `/learning/ortega-pbl/ortega-pbl-${id(index)}.png`,
  explanation: PBL_EXPLANATIONS[kase.id],
  note: sourceNote(kase, "Ortega.docx"),
}));

export const CLL_LEARN_CASES: AlgorithmCase[] = CLL_CASES.map((kase, index) => ({
  setId: "cll",
  id: id(index),
  number: index + 1,
  name: kase.name,
  algorithm: kase.algorithm,
  image: `/learning/cll/cll-${id(index)}.${kase.picture ? "png" : "svg"}`,
  explanation: cllExplanation(kase),
  note: sourceNote(kase, "CLL.docx"),
}));

/** The 2×2 sets, by id (registered in sets.ts). */
export const SETS_2X2: Partial<Record<AlgorithmSetId, AlgorithmCase[]>> = {
  "primera-cara": PRIMERA_CARA_CASES,
  "primera-capa": PRIMERA_CAPA_CASES,
  "ortega-oll": ORTEGA_OLL_CASES,
  "ortega-pbl": ORTEGA_PBL_CASES,
  cll: CLL_LEARN_CASES,
};
