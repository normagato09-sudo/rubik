/**
 * Aprender del Pyraminx: the cases of Por capas and L4E, with the
 * algorithms of features/pyraminx/algorithms.ts (the sheets', with the
 * wrong row fixed) — the tests check every one with the engine against
 * its diagram.
 *
 * Diagrams: the sheets' own, one per row (public/learning/<set>/). The
 * steps the sheets do not cover (Puntas, Centros, Primera capa, V) have
 * basic cases added on purpose, drawn from the case itself by
 * features/pyraminx/diagrams.ts in the sheets' style — with the Por capas
 * sheet's colors (red in front) for Por capas.
 *
 * The explanations are worked out from each case's stickers, so they say
 * exactly what the diagram shows.
 */
import { faceOf, type PyraFace } from "@/features/pyraminx/geometry";
import { L4E_CASES, POR_CAPAS_LAST_LAYER, type PyraCase } from "@/features/pyraminx/algorithms";
import { topViewSvg } from "@/features/pyraminx/diagrams";
import {
  applyPyraMove,
  applyPyraTokens,
  invertPyraTokens,
  parsePyraNotation,
  solvedPyraminx,
  type PyraColor,
  type PyraToken,
} from "@/features/pyraminx/moves";
import { CENTER_STICKERS, EDGE_FACES, EDGE_STICKERS, TIP_STICKERS } from "@/features/pyraminx/pieces";
import type { AlgorithmCase, AlgorithmSetId } from "./algorithm-sets";

const solved = solvedPyraminx();
export const id = (index: number) => String(index + 1).padStart(2, "0");

/** The case an algorithm (plus the final turn it needs) solves. Face turns and whole turns are read too. */
export function pyraCaseState(algorithm: string, adjust: PyraCase["adjust"] | PyraToken = ""): PyraColor[] {
  const tokens: PyraToken[] = [...parsePyraNotation(algorithm), ...(adjust ? [adjust as PyraToken] : [])];
  return applyPyraTokens(solved, invertPyraTokens(tokens));
}

// ---------- reading a case ----------

export const edgeName = (slot: number) => EDGE_FACES[slot].join("");
export const EDGE = (name: string) => EDGE_FACES.findIndex((faces) => faces.join("") === name);
const TOP_EDGES = ["FL", "FR", "LR"].map(EDGE);

export const WHERE: Record<string, string> = {
  FL: "arriba, en la arista de delante a la izquierda",
  FR: "arriba, en la arista de delante a la derecha",
  LR: "arriba, en la arista de detrás",
  FD: "abajo delante",
  LD: "abajo a la izquierda",
  RD: "abajo a la derecha",
};

export const TOWARDS: Record<PyraFace, string> = {
  F: "hacia ti",
  L: "hacia la izquierda",
  R: "hacia la derecha",
  D: "hacia abajo",
};

/** Where edge `piece` (numbered by its solved place) is in `state`, and whether it is the wrong way round. */
export function locate(state: readonly PyraColor[], piece: number): { slot: number; flipped: boolean } {
  const [a, b] = EDGE_STICKERS[piece].map((i) => solved[i]);
  for (let slot = 0; slot < EDGE_STICKERS.length; slot++) {
    const [x, y] = EDGE_STICKERS[slot].map((i) => state[i]);
    if (x === a && y === b) return { slot, flipped: false };
    if (x === b && y === a) return { slot, flipped: true };
  }
  throw new Error("Pyraminx: edge not found");
}

/** The face `color` is on, at `slot`. */
export const faceShowing = (state: readonly PyraColor[], slot: number, color: PyraColor) =>
  faceOf(EDGE_STICKERS[slot].find((i) => state[i] === color)!);

/** Whether a top edge would be the right way round once U brings it home. */
function topEdgeOriented(state: readonly PyraColor[], piece: number): boolean {
  let current = [...state];
  for (let k = 0; k < 3; k++) {
    const at = locate(current, piece);
    if (at.slot === piece) return !at.flipped;
    current = applyPyraMove(current, "U");
  }
  throw new Error("Pyraminx: top edge not in the top layer");
}

export const joinSpanish = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;

const TOP_NAME: Record<string, string> = { FL: "la de delante a la izquierda", FR: "la de delante a la derecha", LR: "la de detrás" };

/** What the 3 top edges need: a cycle and its direction, flips. */
function describeTopEdges(state: readonly PyraColor[]): string {
  const pieces = TOP_EDGES.map((slot) => TOP_EDGES.find((piece) => locate(state, piece).slot === slot)!);
  const inPlace = TOP_EDGES.filter((slot, k) => pieces[k] === slot);
  const flipped = TOP_EDGES.filter((piece) => !topEdgeOriented(state, piece));
  const parts: string[] = [];
  if (inPlace.length === 3) {
    parts.push("Las tres aristas de arriba están en su sitio");
  } else {
    // Seen from above, clockwise goes front left → back → front right.
    const clockwise: Record<string, string> = { FL: "LR", LR: "FR", FR: "FL" };
    const from = TOP_EDGES.find((slot, k) => pieces[k] !== slot)!;
    const goesTo = edgeName(pieces[TOP_EDGES.indexOf(from)]);
    const sense = clockwise[edgeName(from)] === goesTo ? "horario" : "antihorario";
    parts.push(`Las tres aristas de arriba tienen que dar una vuelta entre ellas, en sentido ${sense} visto desde arriba`);
  }
  if (flipped.length === 0) parts.push(inPlace.length === 3 ? "" : ", y ninguna está dada la vuelta");
  else {
    const names = flipped.map((piece) => TOP_NAME[edgeName(piece)]);
    const said = inPlace.length === 3 ? names : flipped.map(() => "");
    parts.push(
      inPlace.length === 3
        ? `, pero ${flipped.length === 1 ? "hay una dada la vuelta" : `hay ${flipped.length} dadas la vuelta`}: ${joinSpanish(said)}`
        : `, y ${flipped.length === 1 ? "una llega" : `${flipped.length} llegan`} dada${flipped.length === 1 ? "" : "s"} la vuelta`,
    );
  }
  return `${parts.join(" ").replaceAll(" ,", ",").trim()}.`;
}

const adjustText = (adjust: PyraCase["adjust"]) =>
  adjust ? ` Al terminar, gira ${adjust} para alinear la capa de arriba con el resto.` : "";

// ---------- notes ----------

const ADDED =
  "Añadido: tus documentos no traen casos para este paso. Es un algoritmo básico, comprobado con el motor de RUBIKO.";

function sheetNote(kase: PyraCase, sheet: string): string | undefined {
  if (kase.source === "corregido") {
    return `En ${sheet} (fila ${kase.doc}) pone «${kase.docAlgorithm}», que no resuelve este caso: su segunda mitad es la de la fila ${kase.doc - 1}. Se usa «${kase.algorithm}», el algoritmo estándar (el espejo de la fila ${kase.doc - 1}).`;
  }
  if (kase.docText) {
    return `En ${sheet} pone «${kase.docText}», con un paréntesis de más; son los mismos movimientos.`;
  }
  return undefined;
}

// ---------- added steps ----------

/** Pieces a step's diagrams color: tips and centers always, plus the edges it names. */
export const piecesShown = (edges: number[]) =>
  new Set([
    ...Object.values(TIP_STICKERS).flat(),
    ...Object.values(CENTER_STICKERS).flat(),
    ...edges.flatMap((edge) => EDGE_STICKERS[edge]),
  ]);

/** RUBIKO's colors → the Por capas sheet's (red in front, blue left, green right). */
const POR_CAPAS_COLORS: Partial<Record<PyraColor, PyraColor>> = { green: "red", red: "blue", blue: "green" };

export interface Added {
  name: string;
  algorithm: string;
  explanation: string;
  shown: Set<number>;
}

function tipCase(algorithm: "u" | "u'"): Added {
  const state = pyraCaseState(algorithm);
  // The top tip's front sticker shows the color of the face it has to go to.
  const front = state[TIP_STICKERS.U.find((i) => faceOf(i) === "F")!];
  const from = (["L", "R"] as const).find((face) => solved[face === "L" ? 9 : 18] === front)!;
  return {
    name: `Punta con el color de la ${from === "L" ? "izquierda" : "derecha"} delante`,
    algorithm,
    explanation: `La punta de arriba no coincide con su centro: la pegatina que mira hacia ti tiene el color de la cara ${from === "L" ? "izquierda" : "derecha"}. Gira solo la punta, ${algorithm} (${algorithm === "u" ? "en sentido horario" : "en sentido antihorario"} mirándola desde arriba). Con las otras puntas es igual: l, r y b.`,
    shown: piecesShown([]),
  };
}

function centerCase(algorithm: "R" | "R'"): Added {
  const state = pyraCaseState(algorithm);
  const yellowAt = faceOf(CENTER_STICKERS.R.find((i) => state[i] === "yellow")!);
  return {
    name: yellowAt === "F" ? "Centro con el amarillo delante" : "Centro con el amarillo a la derecha",
    algorithm,
    explanation: `El centro de la derecha (la pieza de tres colores bajo la punta de la derecha) tiene el amarillo ${TOWARDS[yellowAt]} en vez de abajo. ${algorithm} lo gira hasta dejar el amarillo abajo, como los otros centros de abajo. Con los centros de la izquierda y de detrás es igual, con L y B.`,
    shown: piecesShown([]),
  };
}

/** Short names for the case titles: where the edge is, where its yellow looks. */
const PLACE: Record<string, string> = { FL: "Arriba a la izquierda", FR: "Arriba a la derecha", LR: "Arriba detrás" };
const YELLOW: Record<PyraFace, string> = { F: "delante", L: "a la izquierda", R: "a la derecha", D: "abajo" };

function edgeCase(algorithm: string, piece: number, keep: number[], what: string): Added {
  const state = pyraCaseState(algorithm);
  const { slot } = locate(state, piece);
  const yellowAt = faceShowing(state, slot, "yellow");
  return {
    name: `${PLACE[edgeName(slot)]}, amarillo ${YELLOW[yellowAt]}`,
    algorithm,
    explanation: `${what} está ${WHERE[edgeName(slot)]}, con el amarillo mirando ${TOWARDS[yellowAt]}. Este algoritmo la baja a su sitio sin estropear lo que ya está hecho.`,
    shown: piecesShown([...keep, piece]),
  };
}

const FD = EDGE("FD");
const LD = EDGE("LD");
const RD = EDGE("RD");

export const PUNTAS: Added[] = [tipCase("u"), tipCase("u'")];
const CENTROS: Added[] = [centerCase("R"), centerCase("R'")];
const PRIMERA_CAPA: Added[] = ["R U' R'", "L' U L", "U' R U R'"].map((algorithm) =>
  edgeCase(algorithm, FD, [LD, RD], "La arista que falta en la primera capa (la de abajo delante)"),
);
export const V: Added[] = ["R' U' R", "R' U R", "U R' U' R"].map((algorithm) =>
  edgeCase(algorithm, RD, [LD], "La segunda arista de la V (la de abajo a la derecha)"),
);

type AddedSetId = "pyra-puntas" | "pyra-centros" | "pyra-primera-capa" | "l4e-puntas" | "l4e-v";

const ADDED_SETS: Record<AddedSetId, { cases: Added[]; porCapas: boolean }> = {
  "pyra-puntas": { cases: PUNTAS, porCapas: true },
  "pyra-centros": { cases: CENTROS, porCapas: true },
  "pyra-primera-capa": { cases: PRIMERA_CAPA, porCapas: true },
  "l4e-puntas": { cases: PUNTAS, porCapas: false },
  "l4e-v": { cases: V, porCapas: false },
};

function addedCases(setId: AddedSetId): AlgorithmCase[] {
  return ADDED_SETS[setId].cases.map((kase, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    name: kase.name,
    algorithm: kase.algorithm,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation: kase.explanation,
    note: ADDED,
  }));
}

/** The diagrams RUBIKO draws for the added steps, by file (written to public/ by its test). */
export function generatedPyraminxDiagrams(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [setId, { cases, porCapas }] of Object.entries(ADDED_SETS)) {
    cases.forEach((kase, index) => {
      files[`/learning/${setId}/${setId}-${id(index)}.svg`] = topViewSvg(
        pyraCaseState(kase.algorithm),
        kase.shown,
        kase.name,
        porCapas ? POR_CAPAS_COLORS : {},
      );
    });
  }
  return files;
}

// ---------- the sheets' cases ----------

function l4eExplanation(kase: PyraCase): string {
  const state = pyraCaseState(kase.algorithm, kase.adjust);
  const { slot, flipped } = locate(state, FD);
  const edge =
    slot === FD
      ? `La arista verde-amarilla ya está abajo delante${flipped ? ", pero dada la vuelta" : ", bien puesta"}.`
      : `La arista verde-amarilla (la de abajo delante) está ${WHERE[edgeName(slot)]}, con el amarillo mirando ${TOWARDS[faceShowing(state, slot, "yellow")]}.`;
  return `${edge} Los centros y la V ya están hechos: el algoritmo coloca las cuatro aristas que faltan a la vez.${adjustText(kase.adjust)}`;
}

export const PYRA_PUNTAS_CASES = addedCases("pyra-puntas");
export const PYRA_CENTROS_CASES = addedCases("pyra-centros");
export const PYRA_PRIMERA_CAPA_CASES = addedCases("pyra-primera-capa");
export const L4E_PUNTAS_CASES = addedCases("l4e-puntas");
export const L4E_V_CASES = addedCases("l4e-v");

export const PYRA_ULTIMA_CAPA_CASES: AlgorithmCase[] = POR_CAPAS_LAST_LAYER.map((kase, index) => ({
  setId: "pyra-ultima-capa",
  id: id(index),
  number: index + 1,
  algorithm: kase.algorithm,
  image: `/learning/pyra-ultima-capa/pyra-ultima-capa-${id(index)}.png`,
  explanation: `${describeTopEdges(pyraCaseState(kase.algorithm, kase.adjust))} La primera capa ya está hecha y el algoritmo no la estropea.${adjustText(kase.adjust)}`,
  note: sheetNote(kase, "tu documento de Por capas"),
}));

export const L4E_LEARN_CASES: AlgorithmCase[] = L4E_CASES.map((kase, index) => ({
  setId: "l4e",
  id: id(index),
  number: index + 1,
  algorithm: kase.algorithm,
  image: `/learning/l4e/l4e-${id(index)}.png`,
  explanation: l4eExplanation(kase),
  note: sheetNote(kase, "tu documento de L4E"),
}));

/** The Pyraminx sets, by id (registered in sets.ts). */
export const SETS_PYRAMINX: Partial<Record<AlgorithmSetId, AlgorithmCase[]>> = {
  "pyra-puntas": PYRA_PUNTAS_CASES,
  "pyra-centros": PYRA_CENTROS_CASES,
  "pyra-primera-capa": PYRA_PRIMERA_CAPA_CASES,
  "pyra-ultima-capa": PYRA_ULTIMA_CAPA_CASES,
  "l4e-puntas": L4E_PUNTAS_CASES,
  "l4e-v": L4E_V_CASES,
  l4e: L4E_LEARN_CASES,
};
