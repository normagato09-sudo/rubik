/**
 * Aprender del Pyraminx: the methods taught from research (not from the
 * user's sheets) — Keyhole, L4E intuitivo, 1-Flip and WO. Their algorithms are
 * in features/pyraminx/research.ts, each with its source, and every case
 * says so on its card ("Investigado"). Steps two methods share (Puntas,
 * V, the back edge, L3E) are written once and listed in each method.
 *
 * The diagrams are drawn by RUBIKO from the case itself, in the sheets'
 * style, and the explanations are worked out from each case's stickers.
 */
import { faceOf, type PyraFace } from "@/features/pyraminx/geometry";
import {
  applyPyraTokens,
  invertPyraTokens,
  parsePyraNotation,
  solvedPyraminx,
  type PyraColor,
  type PyraToken,
} from "@/features/pyraminx/moves";
import { CENTER_STICKERS, EDGE_STICKERS } from "@/features/pyraminx/pieces";
import { topViewSvg } from "@/features/pyraminx/diagrams";
import {
  KEYHOLE_CENTER_CASES,
  KEYHOLE_EDGE_CASES,
  L3E_CASES,
  ONE_FLIP_L3C_CASES,
  SOURCES,
  THIRD_EDGE_CASES,
  WO_L3C_CASES,
  seenWithBlockHome,
  type ResearchCase,
  type ResearchSource,
} from "@/features/pyraminx/research";
import type { AlgorithmCase } from "./algorithm-sets";
import {
  EDGE,
  PUNTAS,
  TOWARDS,
  V,
  edgeName,
  faceShowing,
  id,
  joinSpanish,
  locate,
  piecesShown,
  pyraCaseState,
  type Added,
} from "./cases-pyraminx";

const solved = solvedPyraminx();
const FL = EDGE("FL");
const FR = EDGE("FR");
const FD = EDGE("FD");
const LR = EDGE("LR");
const LD = EDGE("LD");
const RD = EDGE("RD");
const FRONT_EDGES = [FL, FR, FD];

/** A step's case: what the card shows, the stickers its diagram colors and where it comes from. */
interface StepCase {
  name?: string;
  algorithm: string;
  explanation: string;
  shown: Set<number>;
  source: ResearchSource;
  note?: string;
  /** The case as drawn, when it is not simply the algorithm undone from solved. */
  state?: PyraColor[];
  /** What the algorithm leaves, when it is not solved (1-Flip leaves an edge flipped on purpose). */
  goal?: PyraColor[];
  /** The final turn of the block the case needs after the algorithm. */
  adjust?: "B" | "B'";
}

// ---------- L3E: the three edges of the front face ----------

const FRONT_NAME: Record<string, string> = { FL: "la de la izquierda", FR: "la de la derecha", FD: "la de abajo" };

/** Whether a front edge has its green sticker on the front face. */
const greenInFront = (state: readonly PyraColor[], piece: number) => faceShowing(state, locate(state, piece).slot, "green") === "F";

function describeFrontEdges(state: readonly PyraColor[]): string {
  const inPlace = FRONT_EDGES.filter((piece) => locate(state, piece).slot === piece);
  const turned = FRONT_EDGES.filter((piece) => !greenInFront(state, piece));
  if (inPlace.length === 3) {
    const names = turned.map((piece) => FRONT_NAME[edgeName(piece)]);
    return `Las tres aristas de la cara verde están en su sitio, pero ${joinSpanish(names)} están dadas la vuelta: su pegatina verde no mira hacia ti.`;
  }
  // Seen from the front, clockwise goes left side → right side → bottom.
  const clockwise: Record<string, string> = { FL: "FR", FR: "FD", FD: "FL" };
  const from = FRONT_EDGES.find((slot) => locate(state, slot).slot !== slot)!;
  const piece = FRONT_EDGES.find((p) => locate(state, p).slot === from)!;
  // The piece sitting at `from` has to travel to its own place, `piece`.
  const sense = clockwise[edgeName(from)] === edgeName(piece) ? "horario" : "antihorario";
  const flips =
    turned.length === 0
      ? "y las tres tienen ya el verde hacia ti"
      : `y ${turned.length === 1 ? "una tiene" : `${turned.length} tienen`} el verde fuera de la cara de delante`;
  return `Las tres aristas de la cara verde tienen que dar una vuelta entre ellas, en sentido ${sense} mirando la cara de frente, ${flips}.`;
}

const l3eStep = (kase: ResearchCase): StepCase => ({
  name: kase.name,
  algorithm: kase.algorithm,
  explanation: `${describeFrontEdges(pyraCaseState(kase.algorithm))} El bloque de detrás (centros y las aristas roja-azul, roja-amarilla y azul-amarilla) ya está hecho y el algoritmo no lo toca.`,
  shown: piecesShown([FL, FR, FD, LR, LD, RD]),
  source: kase.source,
});

// ---------- the red-blue edge that closes the back block ----------

const FRONT_PLACE: Record<string, string> = {
  FL: "en la cara verde, en su lado izquierdo",
  FR: "en la cara verde, en su lado derecho",
  FD: "en la cara verde, abajo",
};

/** Short names for the case titles: where the edge is, where its red looks. */
const SHORT_PLACE: Record<string, string> = { FL: "A la izquierda", FR: "A la derecha", FD: "Abajo" };
const RED: Record<PyraFace, string> = { F: "delante", L: "a la izquierda", R: "a la derecha", D: "abajo" };

function backEdgeStep(kase: ResearchCase): StepCase {
  const state = pyraCaseState(kase.algorithm);
  const { slot } = locate(state, LR);
  const red = faceShowing(state, slot, "red");
  const where =
    slot === LR
      ? `ya está en su sitio, arriba y detrás, pero dada la vuelta: el rojo mira ${TOWARDS[red]}`
      : `está ${FRONT_PLACE[edgeName(slot)]}, con el rojo mirando ${TOWARDS[red]}`;
  return {
    name: slot === LR ? "En su sitio, dada la vuelta" : `${SHORT_PLACE[edgeName(slot)]}, rojo ${RED[red]}`,
    algorithm: kase.algorithm,
    explanation: `La arista roja-azul, la que cierra el bloque de detrás, ${where}. El algoritmo la deja bien puesta, arriba y detrás, sin mover los centros ni las otras dos aristas del bloque. Las aristas de la cara verde se colocan después, en L3E.`,
    shown: piecesShown([LD, RD, LR]),
    source: kase.source,
    note: kase.sourceText ? `En la guía está escrito «${kase.sourceText}»: son los mismos movimientos.` : undefined,
  };
}

// ---------- Keyhole: the centers, turned against the back block ----------

const CENTER_NAME = { U: "de arriba", L: "de la izquierda", R: "de la derecha" } as const;

/** The color a front center shows on the front face, where it should show green. */
const front = (state: readonly PyraColor[], v: "U" | "L" | "R") => state[CENTER_STICKERS[v].find((i) => faceOf(i) === "F")!];

function centersStep(kase: ResearchCase): StepCase {
  const state = pyraCaseState(kase.algorithm);
  const off = (["U", "L", "R"] as const).filter((v) => CENTER_STICKERS[v].some((i) => state[i] !== solved[i]));
  const [bring, turn, back] = kase.algorithm.split(" ");
  const what =
    off.length === 3
      ? `Los tres centros de delante (el de arriba, el de la izquierda y el de la derecha) están girados a la vez respecto al bloque de detrás: todo lo que no es el bloque está un tercio de vuelta desfasado. ${kase.algorithm} lo gira entero de una vez.`
      : `El centro ${CENTER_NAME[off[0]]} no coincide con el bloque de detrás: en la cara verde enseña ${colorName(front(state, off[0]))} en vez de verde. ${
          off[0] === "U"
            ? `Como está arriba, basta con girar la capa de arriba: ${kase.algorithm}.`
            : `${bring} lo sube a la posición de arriba, ${turn} lo gira y ${back} lo devuelve a su sitio.`
        }`;
  return {
    name:
      off.length === 3
        ? `Todo desfasado (${kase.algorithm})`
        : `Centro ${CENTER_NAME[off[0]]}, ${colorName(front(state, off[0]))} delante`,
    algorithm: kase.algorithm,
    explanation: `${what} La arista roja-azul de detrás puede moverse: es el hueco libre que da nombre al método.`,
    shown: piecesShown([LD, RD]),
    source: kase.source,
    note: "Calculado con el motor de RUBIKO siguiendo el método de la guía (U y Rw, que con el bloque detrás es Fw): la guía no trae lista de casos.",
  };
}

const COLOR_NAME: Record<PyraColor, string> = { green: "verde", red: "rojo", blue: "azul", yellow: "amarillo" };
const colorName = (color: PyraColor) => COLOR_NAME[color];

// ---------- WO and 1-Flip: the block's third edge ----------

/** Solved but for the red-blue edge, in its place the wrong way round: what 1-Flip builds. */
const LR_FLIPPED = (() => {
  const state = [...solved];
  const [a, b] = EDGE_STICKERS[LR];
  [state[a], state[b]] = [state[b], state[a]];
  return state;
})();

function thirdEdgeStep(kase: ResearchCase, oneFlip: boolean): StepCase {
  const goal = oneFlip ? LR_FLIPPED : solved;
  const state = applyPyraTokens(goal, invertPyraTokens(parsePyraNotation(kase.algorithm)));
  const { slot } = locate(state, LR);
  const red = faceShowing(state, slot, "red");
  const inPlace = slot === LR;
  const where = inPlace
    ? oneFlip
      ? "ya está en su sitio, arriba y detrás, y bien puesta: aquí hay que darle la vuelta"
      : `ya está en su sitio, arriba y detrás, pero dada la vuelta: el rojo mira ${TOWARDS[red]}`
    : `está ${FRONT_PLACE[edgeName(slot)]}, con el rojo mirando ${TOWARDS[red]}`;
  const leaves = oneFlip
    ? "la sube a su sitio, arriba detrás, pero dada la vuelta a propósito (el rojo hacia la derecha)"
    : "la deja bien puesta, arriba y detrás";
  return {
    name: inPlace ? (oneFlip ? "En su sitio, bien puesta" : "En su sitio, dada la vuelta") : `${SHORT_PLACE[edgeName(slot)]}, rojo ${RED[red]}`,
    algorithm: kase.algorithm,
    explanation: `La arista roja-azul, la que cierra el bloque de detrás, ${where}. El algoritmo ${leaves}, sin mover el centro de detrás ni las aristas roja-amarilla y azul-amarilla. Los centros de delante pueden moverse: se arreglan en el paso siguiente.`,
    shown: piecesShown([LD, RD, LR]),
    source: kase.source,
    note: "Calculado con el motor de RUBIKO: el más corto con U, L, R y B, con los centros de delante libres. Las guías enseñan este paso con intuición, sin lista de casos.",
    state,
    goal,
  };
}

// ---------- WO and 1-Flip: the last three centers (L3C) ----------

const BLOCK_EDGE_NAME: Record<string, string> = {
  LR: "roja-azul (arriba detrás)",
  LD: "roja-amarilla (abajo a la izquierda)",
  RD: "azul-amarilla (abajo a la derecha)",
};

const TIPPED_NOTE = (sourceText: string) =>
  `En la fuente está escrito «${sourceText}», sujetando el Pyraminx con el bloque arriba. Aquí el bloque va detrás, como en los demás métodos Top First de RUBIKO: son los mismos giros con las letras cambiadas (U↔B, L↔R, Dw↔Fw).`;

function l3cStep(kase: ResearchCase, oneFlip: boolean): StepCase {
  // Seen from the side where the block is home, so it is drawn at the back in its own colors.
  const state = seenWithBlockHome(pyraCaseState(kase.algorithm, kase.adjust));
  const centers = (["U", "L", "R"] as const).map((v) => {
    const off = CENTER_STICKERS[v].some((i) => state[i] !== solved[i]);
    return off ? `el ${CENTER_NAME[v]} enseña ${colorName(front(state, v))} en la cara verde` : `el ${CENTER_NAME[v]} está bien`;
  });
  const allDone = centers.every((text) => text.endsWith("está bien"));
  const flippedEdge = [LR, LD, RD].find((piece) => locate(state, piece).flipped);
  const what = allDone
    ? "Los tres centros de delante ya coinciden con el bloque de detrás."
    : `Mira los tres centros de delante respecto al bloque de detrás: ${joinSpanish(centers)}.`;
  const flip = flippedEdge === undefined ? "" : ` La arista ${BLOCK_EDGE_NAME[edgeName(flippedEdge)]} del bloque está dada la vuelta.`;
  const fixes = oneFlip ? "los centros y esa arista a la vez" : "los tres centros a la vez";
  const adjust = kase.adjust ? ` Al terminar, gira ${kase.adjust} para alinear el bloque de detrás con el resto.` : "";
  return {
    name: kase.name,
    algorithm: kase.algorithm,
    explanation: `${what}${flip} El algoritmo arregla ${fixes} sin romper el bloque; las aristas de la cara verde pueden moverse, se colocan en L3E.${adjust} Si no reconoces el caso, gira el Pyraminx entero con [B] o [B'] (el bloque sigue detrás) y vuelve a mirar.`,
    shown: piecesShown([LR, LD, RD]),
    source: kase.source,
    note: kase.computed
      ? "La fuente no trae algoritmo para este caso («GLHF»: buena suerte). Este es el más corto que encuentra el motor de RUBIKO con U, L, R y B."
      : TIPPED_NOTE(kase.sourceText!),
    state,
    adjust: kase.adjust,
  };
}

// ---------- steps reused from Por capas and L4E ----------

/** An added case of cases-pyraminx.ts, taught here as part of a researched method. */
const reused = (kase: Added, source: ResearchSource): StepCase => ({ ...kase, source });

// ---------- the sets ----------

export type ResearchSetId =
  | "keyhole-puntas"
  | "keyhole-bloque"
  | "keyhole-centros"
  | "keyhole-arista"
  | "keyhole-l3e"
  | "l4ei-puntas"
  | "l4ei-v"
  | "l4ei-arista"
  | "l4ei-l3e"
  | "1flip-puntas"
  | "1flip-bloque"
  | "1flip-arista"
  | "1flip-l3c"
  | "1flip-l3e"
  | "wo-puntas"
  | "wo-bloque"
  | "wo-arista"
  | "wo-l3c"
  | "wo-l3e";

const L3E = L3E_CASES.map(l3eStep);
const BACK_EDGE = KEYHOLE_EDGE_CASES.map(backEdgeStep);
const PUNTAS_TOP_FIRST = PUNTAS.map((kase) => reused(kase, SOURCES.speedsolvingTopFirst));
/** The block's first two edges: the V's cases, the V being the block without its top edge. */
const BLOCK = V.map((kase) => ({
  ...reused(kase, SOURCES.speedsolvingTopFirst),
  explanation: kase.explanation.replace("La segunda arista de la V", "La segunda arista del bloque"),
}));

const RESEARCH_SETS: Record<ResearchSetId, StepCase[]> = {
  "keyhole-puntas": PUNTAS_TOP_FIRST,
  "keyhole-bloque": BLOCK,
  "keyhole-centros": KEYHOLE_CENTER_CASES.map(centersStep),
  "keyhole-arista": BACK_EDGE,
  "keyhole-l3e": L3E,
  "l4ei-puntas": PUNTAS.map((kase) => reused(kase, SOURCES.speedsolvingVFirst)),
  "l4ei-v": V.map((kase) => reused(kase, SOURCES.speedsolvingVFirst)),
  "l4ei-arista": BACK_EDGE,
  "l4ei-l3e": L3E,
  "1flip-puntas": PUNTAS_TOP_FIRST,
  "1flip-bloque": BLOCK,
  "1flip-arista": THIRD_EDGE_CASES.map((kase) => thirdEdgeStep(kase, true)),
  "1flip-l3c": ONE_FLIP_L3C_CASES.map((kase) => l3cStep(kase, true)),
  "1flip-l3e": L3E,
  "wo-puntas": PUNTAS_TOP_FIRST,
  "wo-bloque": BLOCK,
  "wo-arista": THIRD_EDGE_CASES.map((kase) => thirdEdgeStep(kase, false)),
  "wo-l3c": WO_L3C_CASES.map((kase) => l3cStep(kase, false)),
  "wo-l3e": L3E,
};

/** Each case's stickers and what its algorithm leaves (solved, unless the step says otherwise). */
export function researchCaseStates(setId: ResearchSetId): { state: PyraColor[]; goal: PyraColor[]; adjust: PyraToken[] }[] {
  return RESEARCH_SETS[setId].map((kase) => ({
    state: kase.state ?? pyraCaseState(kase.algorithm),
    goal: kase.goal ?? solved,
    adjust: kase.adjust ? [kase.adjust] : [],
  }));
}

function researchCases(setId: ResearchSetId): AlgorithmCase[] {
  return RESEARCH_SETS[setId].map((kase, index) => ({
    setId,
    id: id(index),
    number: index + 1,
    ...(kase.name ? { name: kase.name } : {}),
    algorithm: kase.algorithm,
    image: `/learning/${setId}/${setId}-${id(index)}.svg`,
    explanation: kase.explanation,
    ...(kase.note ? { note: kase.note } : {}),
    research: kase.source,
  }));
}

export const SETS_PYRAMINX_RESEARCH = Object.fromEntries(
  (Object.keys(RESEARCH_SETS) as ResearchSetId[]).map((setId) => [setId, researchCases(setId)]),
) as Record<ResearchSetId, AlgorithmCase[]>;

/** The diagrams of these sets, by file (written to public/ by the test). */
export function generatedResearchDiagrams(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [setId, cases] of Object.entries(RESEARCH_SETS)) {
    cases.forEach((kase, index) => {
      files[`/learning/${setId}/${setId}-${id(index)}.svg`] = topViewSvg(
        kase.state ?? pyraCaseState(kase.algorithm),
        kase.shown,
        kase.name ?? `Caso ${id(index)}`,
      );
    });
  }
  return files;
}
