/**
 * Aprender del Skewb: the three variations of Sarah's method
 * (features/skewb/sarah.ts) — Por capas (her beginners' variation), Sarah's
 * Intermediate and Sarah's Advanced. Every case says where it comes from
 * ("Investigado") and every algorithm is checked by the tests with the
 * Skewb engine.
 *
 * The cases are worked out by the engine from the algorithms, not copied
 * from the guides' pictures: the intermediate's categories 2 and 3 and
 * the advanced variation's groups are found by what each algorithm does.
 * Where the guides have a mistake, the card uses what works and says so;
 * where they have no algorithm, the card gives the engine's shortest one
 * and says so too.
 *
 * Diagrams: drawn by RUBIKO from the case (features/skewb/diagrams.ts).
 * The explanations are read from each case's stickers.
 */
import type { CubeColor } from "@/features/cube/types";
import { SKEWB_CORNERS, faceOf, type SkewbCorner, type SkewbFace } from "@/features/skewb/geometry";
import { applySarahTokens, sarahTurn, turnGeometry, type SarahToken } from "@/features/skewb/moves";
import { CORNER_STICKERS } from "@/features/skewb/search";
import { bottomNetSvg, moveSvg, topNetSvg } from "@/features/skewb/diagrams";
import {
  L2L_POSITIONS,
  caseKey,
  describeTop,
  keepsFirstSide,
  shortestSarah,
  topShape,
  topTwists,
  yellowCenter,
} from "@/features/skewb/l2l";
import {
  CENTERS,
  FIRST_SIDE,
  L2L_BY_ALGORITHM,
  L2L_BY_CASE,
  LAST_CENTERS,
  LAST_CORNER,
  OPPOSITE_SIDE_CASES,
  SARAH_SOLVED,
  SARAH_SOURCES,
  TOP_CORNER_CASES,
  U_CENTER,
  caseOf,
  expandSarah,
  inRubikoNotation,
  invertSarah,
  isSolvedAnyWay,
  sarahTokens,
  type SarahFrame,
  type SarahSource,
} from "@/features/skewb/sarah";
import type { AlgorithmCase } from "./algorithm-sets";
import { id, joinSpanish } from "./cases-pyraminx";
import { NOTATION_MOVES_SKEWB } from "./notation";

const solved = SARAH_SOLVED;

// ---------- words ----------

const COLOR: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  green: "verde",
  orange: "naranja",
  blue: "azul",
  red: "rojo",
};

/** A face by its color: "la cara verde", "la roja". */
const FACE_COLOR_ES: Record<CubeColor, string> = {
  white: "blanca",
  yellow: "amarilla",
  green: "verde",
  orange: "naranja",
  blue: "azul",
  red: "roja",
};

/** Where each face is, held as in the guides (yellow up, green in front on the left). */
const FACE_PLACE: Record<SkewbFace, string> = {
  U: "arriba",
  D: "abajo",
  F: "delante a la izquierda",
  R: "delante a la derecha",
  B: "detrás a la derecha",
  L: "detrás a la izquierda",
};

const FACES: SkewbFace[] = ["U", "R", "F", "D", "L", "B"];

const faceName = (face: SkewbFace) =>
  face === "U" || face === "D" ? FACE_PLACE[face] : `en la cara de ${FACE_PLACE[face]} (la ${FACE_COLOR_ES[solved[CENTERS[FACES.indexOf(face)]]]})`;

const CORNER_PLACE: Partial<Record<SkewbCorner, string>> = {
  UFR: "la de delante",
  UBR: "la de la derecha",
  UBL: "la de detrás",
  UFL: "la de la izquierda",
  DFR: "la de abajo delante",
  DBR: "la de abajo a la derecha",
  DBL: "la de abajo detrás",
  DFL: "la de abajo a la izquierda",
};

const TOWARDS: Record<SkewbFace, string> = {
  U: "arriba",
  D: "abajo",
  F: "hacia delante a la izquierda",
  R: "hacia delante a la derecha",
  B: "hacia detrás a la derecha",
  L: "hacia detrás a la izquierda",
};

const TOP: SkewbCorner[] = ["UFR", "UBR", "UBL", "UFL"];
const cornerIndex = (corner: SkewbCorner) => SKEWB_CORNERS.indexOf(corner);

/** Where the yellow of a top corner looks. */
const yellowOf = (state: readonly CubeColor[], corner: SkewbCorner): SkewbFace =>
  faceOf(CORNER_STICKERS[cornerIndex(corner)].find((i) => state[i] === "yellow")!);

/** The top corners' shape in words, from the stickers. */
function describeCorners(state: readonly CubeColor[]): string {
  const twisted = TOP.filter((corner) => yellowOf(state, corner) !== "U");
  const looks = twisted.map((corner) => `${CORNER_PLACE[corner]} lo tiene mirando ${TOWARDS[yellowOf(state, corner)]}`);
  if (twisted.length === 4) {
    return `Ninguna esquina de arriba tiene el amarillo arriba (forma Pi): ${joinSpanish(looks)}.`;
  }
  const up = TOP.filter((corner) => !twisted.includes(corner)).map((corner) => CORNER_PLACE[corner]!);
  return `Dos esquinas opuestas de arriba, ${joinSpanish(up)}, tienen el amarillo arriba, y las otras dos no (forma Peanut): ${joinSpanish(looks)}.`;
}

const describeYellowCenter = (state: readonly CubeColor[]) => {
  const face = yellowCenter(state);
  return face === "U" ? "El centro amarillo ya está arriba." : `El centro amarillo está ${faceName(face)}.`;
};

/** Where every center that is not home is, for the last centers. */
function describeCenters(state: readonly CubeColor[]): string {
  const wrong = FACES.filter((_, f) => state[CENTERS[f]] !== solved[CENTERS[f]]);
  const parts = wrong.map((face) => `el ${COLOR[state[CENTERS[FACES.indexOf(face)]]]} está ${FACE_PLACE[face]}`);
  return `Los centros que no están en su sitio: ${joinSpanish(parts)}.`;
}

// ---------- stickers in the diagrams ----------

const ALL_STICKERS = Array.from({ length: 30 }, (_, i) => i);
const ALL = new Set(ALL_STICKERS);

/** The first side's pieces and the white pieces still out: their stickers in color. */
function whitePieces(state: readonly CubeColor[]): Set<number> {
  const shown = new Set(FIRST_SIDE);
  for (const stickers of CORNER_STICKERS) if (stickers.some((i) => state[i] === "white")) stickers.forEach((i) => shown.add(i));
  CENTERS.forEach((i) => state[i] === "white" && shown.add(i));
  return shown;
}

/** The yellow stickers and the first side's colors on the sides, as the guides draw these steps. */
function yellowAndSides(state: readonly CubeColor[]): Set<number> {
  const shown = new Set<number>(FIRST_SIDE);
  state.forEach((color, i) => color === "yellow" && shown.add(i));
  return shown;
}

/** Centers in color too: the last centers. */
function centersShown(state: readonly CubeColor[]): Set<number> {
  const shown = yellowAndSides(state);
  CENTERS.forEach((i) => shown.add(i));
  for (const corner of TOP) CORNER_STICKERS[cornerIndex(corner)].forEach((i) => shown.add(i));
  return shown;
}

// ---------- one case ----------

interface SkewbCase {
  name?: string;
  /** In RUBIKO's notation, written out in full. */
  algorithm: string;
  explanation: string;
  state: CubeColor[];
  shown: Set<number>;
  view: "top" | "bottom";
  source: SarahSource;
  note?: string;
  /** What the algorithm has to leave (the tests check it). */
  goal: (after: CubeColor[]) => boolean;
}

const topCornersDone = (state: readonly CubeColor[]) => topTwists(state).every((t) => t === 0);
const topFaceDone = (state: readonly CubeColor[]) => topCornersDone(state) && state[CENTERS[0]] === "yellow";
const firstSideDone = (state: readonly CubeColor[]) => keepsFirstSide(state);

/** The algorithm the guide writes, when it is not the one on the card. */
const asWritten = (text: string, written: string) =>
  text === written ? undefined : `En la guía está escrito «${written}»: son los mismos movimientos.`;

// ---------- the first side ----------

function firstSideCase(written: string): SkewbCase {
  const tokens = sarahTokens(written);
  const state = applySarahTokens(solved, invertSarah(tokens));
  const corner = TOP.find((c) => CORNER_STICKERS[cornerIndex(c)].some((i) => state[i] === "white"))!;
  const white = faceOf(CORNER_STICKERS[cornerIndex(corner)].find((i) => state[i] === "white")!);
  const out = SKEWB_CORNERS.filter(
    (c) => c[0] === "D" && CORNER_STICKERS[cornerIndex(c)].some((i) => state[i] !== solved[i]),
  );
  return {
    name: `Esquina ${CORNER_PLACE[corner]!.replace(/^la /, "")}, blanco ${TOWARDS[white].replace(/^hacia /, "")}`,
    algorithm: inRubikoNotation(written),
    explanation: `Falta la última esquina de la cara blanca y está arriba, en ${CORNER_PLACE[corner]}, con el blanco mirando ${TOWARDS[white]}. Su hueco es ${joinSpanish(out.map((c) => CORNER_PLACE[c]!.replace(/^la de /, "el de ")))}. Con la cara blanca abajo, ${inRubikoNotation(written)} la mete en su hueco: por el camino saca una esquina ya puesta y la vuelve a dejar en su sitio. Antes, gira el Skewb entero con y para dejar el hueco abajo delante y lleva la esquina a esta posición.`,
    state,
    shown: whitePieces(state),
    view: "bottom",
    source: SARAH_SOURCES.method,
    goal: firstSideDone,
  };
}

const FIRST_SIDE_CASES = LAST_CORNER.map(firstSideCase);

// ---------- Por capas: top corners, top center ----------

const topCornersCases: SkewbCase[] = TOP_CORNER_CASES.map(({ shape, algorithm, alternative }) => {
  const state = caseOf(sarahTokens(algorithm), topCornersDone)!;
  return {
    name: shape === "pi" ? "Pi" : "Peanut",
    algorithm: inRubikoNotation(algorithm),
    explanation: `${describeCorners(state)} El centro de arriba todavía no importa. También vale ${inRubikoNotation(alternative)}.`,
    state,
    shown: yellowAndSides(state),
    view: "top",
    source: SARAH_SOURCES.method,
    note: asWritten(inRubikoNotation(algorithm), algorithm),
    goal: topCornersDone,
  };
});

const uCenterState = caseOf(sarahTokens(U_CENTER.algorithm), topFaceDone)!;
const uCenterCases: SkewbCase[] = [
  {
    name: `Centro amarillo ${FACE_PLACE[yellowCenter(uCenterState)]}`,
    algorithm: inRubikoNotation(U_CENTER.algorithm),
    explanation: `Las esquinas de arriba ya tienen el amarillo arriba. ${describeYellowCenter(uCenterState)} Si está en otra cara de un lado, gira el Skewb entero con y hasta dejarlo ahí. El algoritmo lo sube sin estropear las esquinas. También vale ${inRubikoNotation(U_CENTER.alternative)}.`,
    state: uCenterState,
    shown: yellowAndSides(uCenterState),
    view: "top",
    source: SARAH_SOURCES.method,
    note: asWritten(inRubikoNotation(U_CENTER.algorithm), U_CENTER.algorithm),
    goal: topFaceDone,
  },
];

// ---------- the last four centers (beginners' and intermediate) ----------

const FRONT_RIGHT: SarahFrame = "front-right";

/** Sarah's first case after z and after z' (two cases), the other two after z (both work for them). */
const lastCentersCases: SkewbCase[] = LAST_CENTERS.flatMap((kase, index) =>
  (index === 0 ? ["z", "z'"] : ["z"]).map((turn) => {
    const written = `(${turn}) ${kase.algorithm}`;
    const state = caseOf(sarahTokens(written, FRONT_RIGHT))!;
    const rubiko = inRubikoNotation(written, FRONT_RIGHT);
    const moved = CENTERS.filter((i) => state[i] !== solved[i]).length;
    const kind =
      moved === 3
        ? "Tres centros de los lados tienen que dar una vuelta entre ellos."
        : yellowCenter(state) === "U" &&
            [["F", "B"], ["R", "L"]].some(([a, b]) => state[CENTERS[FACES.indexOf(a as SkewbFace)]] === solved[CENTERS[FACES.indexOf(b as SkewbFace)]])
          ? "Los cuatro centros de los lados están cambiados por parejas, cada uno con el de enfrente."
          : "Los cuatro centros de los lados están cambiados por parejas, cada uno con el de al lado.";
    return {
      name: moved === 3 ? `Tres centros, con ${turn === "z" ? "x" : "x'"}` : kind.includes("enfrente") ? "Parejas de enfrente" : "Parejas de al lado",
      algorithm: rubiko,
      explanation: `Ya están las dos caras, la blanca abajo y la amarilla arriba. ${kind} ${describeCenters(state)} Primero ${turn === "z" ? "x" : "x'"} gira el Skewb entero: el blanco queda delante a la izquierda y el amarillo detrás a la derecha; el resto del algoritmo coloca los centros. También vale ${inRubikoNotation(`(${turn}) ${kase.alternative}`, FRONT_RIGHT)}.`,
      state,
      shown: centersShown(state),
      view: "top" as const,
      source: SARAH_SOURCES.method,
      note: `En la guía: «Do a (${turn === "z" ? "z" : "z'"}) or (${turn === "z" ? "z'" : "z"}) rotation first» y «${kase.algorithm}». Sarah escribe x y z mirando la cara de delante a la derecha, la naranja; con la notación de RUBIKO (z mira la cara de delante a la izquierda, la verde) su z es x y su x es z'. Comprobado con el motor.`,
      goal: isSolvedAnyWay,
    };
  }),
);

// ---------- Sarah's Intermediate: the opposite side ----------

const SHAPE_ES = { pi: "Pi", peanut: "Peanut" } as const;

/** How each of the guide's pictures is held (top corners' twists from the front corner round, and the yellow center), read from them. */
const OPPOSITE_SIDE_VIEWS = ["1221/F", "1221/B", "1221/U", "0201/F", "0201/B", "0201/R", "0201/L", "1221/L", "1221/R", "0201/U"];

const viewOf = (state: readonly CubeColor[]) => `${topTwists(state).join("")}/${yellowCenter(state)}`;
const classOf = (state: readonly CubeColor[]) => {
  const { shape, center } = describeTop(state);
  return `${shape}/${center}`;
};

const VIEW_STATE = new Map<string, CubeColor[]>();
for (const position of L2L_POSITIONS) if (!VIEW_STATE.has(viewOf(position))) VIEW_STATE.set(viewOf(position), position);

/** The guide's alternatives that the engine says do not work, and the one that does. */
const OPPOSITE_SIDE_FIXES: Record<number, { written: string; works: string }> = {
  3: { written: "(y2) R' F R F'", works: "(y2) F R' F' R" },
  5: { written: "(y2) L F' L' F", works: "(y2) F' L F L'" },
};

const oppositeSideStates = OPPOSITE_SIDE_CASES.map((kase, index) =>
  kase.category === 1 ? caseOf(sarahTokens(kase.algorithms[0]), topFaceDone)! : VIEW_STATE.get(OPPOSITE_SIDE_VIEWS[index])!,
);

const oppositeSideCases: SkewbCase[] = OPPOSITE_SIDE_CASES.map((kase, index) => {
  const state = oppositeSideStates[index];
  const [first, ...others] = kase.algorithms;
  const fix = OPPOSITE_SIDE_FIXES[index];
  const alternatives = others.map((alt) => (fix && alt === fix.written ? fix.works : alt)).map((alt) => inRubikoNotation(alt));
  const after = applySarahTokens(state, sarahTokens(first));
  const leads = oppositeSideStates.findIndex((other, j) => j !== index && OPPOSITE_SIDE_CASES[j].category < kase.category + 1 && classOf(other) === classOf(after));
  const reduces =
    kase.category === 1
      ? "El algoritmo deja hecha la cara de arriba."
      : `No la resuelve: la convierte en el caso ${id(leads)} (categoría ${OPPOSITE_SIDE_CASES[leads].category}), y desde ahí se sigue.`;
  const notes: string[] = [];
  if (fix) notes.push(`La guía da también «${fix.written}», pero según el motor no lleva a un caso de la categoría 1; la que sí funciona es ${inRubikoNotation(fix.works)}.`);
  if (kase.category === 3 && OPPOSITE_SIDE_CASES[leads].category === 3) {
    notes.push("La guía dice «→ cat. 2», pero según el motor sus cuatro algoritmos llevan a un caso de la categoría 3 (que luego lleva a la 2).");
  }
  const written = asWritten(inRubikoNotation(first), first);
  if (written) notes.push(written);
  return {
    name: `Categoría ${kase.category} · ${SHAPE_ES[kase.shape]}, centro ${yellowCenter(state) === "U" ? "arriba" : FACE_PLACE[yellowCenter(state)]}`,
    algorithm: inRubikoNotation(first),
    explanation: `${describeCorners(state)} ${describeYellowCenter(state)} ${reduces}${alternatives.length ? ` También vale ${joinSpanish(alternatives)}.` : ""}`,
    state,
    shown: yellowAndSides(state),
    view: "top",
    source: SARAH_SOURCES.method,
    ...(notes.length ? { note: notes.join(" ") } : {}),
    goal: (afterState) =>
      kase.category === 1 ? topFaceDone(afterState) : leads >= 0 && classOf(afterState) === classOf(oppositeSideStates[leads]),
  };
});

// ---------- Sarah's Advanced: L2L ----------

/** The by-case guide's groups, as the engine sees them (the yellow center relative to the shape). */
const GROUP_CENTER: Record<string, { shape: "pi" | "peanut" | "solved"; center: SkewbFace | null }> = {
  "Peanut - center on U": { shape: "peanut", center: "U" },
  "Peanut - center on FR": { shape: "peanut", center: "L" },
  "Peanut - center on FL": { shape: "peanut", center: "B" },
  "Peanut - center on BR": { shape: "peanut", center: "F" },
  "Peanut - center on BL": { shape: "peanut", center: "R" },
  "Pi - center on U": { shape: "pi", center: "U" },
  "Pi - center on F": { shape: "pi", center: "B" },
  "Pi - center on B": { shape: "pi", center: "F" },
  "Pi - center on R": { shape: "pi", center: "L" },
  "Pi - center on L": { shape: "pi", center: "R" },
  "L5C (Last 5 Centers)": { shape: "solved", center: null },
};

const groupOf = (state: readonly CubeColor[]) => {
  const { shape, center } = describeTop(state);
  return Object.keys(GROUP_CENTER).find((group) => {
    const g = GROUP_CENTER[group];
    return g.shape === shape && (g.center === null || g.center === center);
  })!;
};

/** The guide's name for each algorithm (by-algorithm guide). */
const ALGORITHM_GROUP = new Map<string, string>();
for (const { group, algorithms } of L2L_BY_ALGORITHM) for (const text of algorithms) ALGORITHM_GROUP.set(expandSarah(text), group);

interface Found {
  written: string;
  state: CubeColor[];
  /** Where the by-case guide puts it, when that is not where the engine does. */
  listedIn?: string;
}

/** Every case of the last two layers, and the first algorithm of the guides that solves it. */
const L2L_CASES = (() => {
  const found = new Map<string, Found>();
  const add = (written: string, listedIn?: string) => {
    const state = caseOf(sarahTokens(written));
    if (!state) throw new Error(`No resuelve un caso: ${written}`);
    const key = caseKey(state);
    if (found.has(key)) return;
    found.set(key, { written, state, ...(listedIn && listedIn !== groupOf(state) ? { listedIn } : {}) });
  };
  for (const { group, algorithms } of L2L_BY_CASE) for (const text of algorithms) if (text) add(text, group);
  for (const { algorithms } of L2L_BY_ALGORITHM) for (const text of algorithms) add(text);
  const all = new Map<string, CubeColor[]>();
  for (const position of L2L_POSITIONS) if (!isSolvedAnyWay(position)) all.set(caseKey(position), position);
  return { found, all };
})();

const SARAH_SHORTHAND =
  "S es el sledgehammer (F' L F L') y H el hedgeslammer (L F' L' F); la letra entre paréntesis dice qué cara va delante a la izquierda antes de empezar ((g) verde, (o) naranja: y; (b) azul: y2; (r) roja: y').";

const NO_ALGORITHM =
  "La guía no trae algoritmo para este caso: lo marca con «-» (hacen falta cinco sledgehammers o más, y Sarah aconseja aprender el óptimo) o solo dice «Setup to U perm» / «Setup to Z perm». Este es el más corto que encuentra el motor de RUBIKO con F, R y L.";

/** The canonical way of holding a case with no algorithm in the guides: the shape turned the way describeTop looks at it. */
function canonical(state: readonly CubeColor[]): CubeColor[] {
  let view = [...state];
  for (let k = 0; k < describeTop(state).turns; k++) {
    const turned = applySarahTokens(view, ["y"]);
    const turnedSolved = applySarahTokens(solved, ["y"]);
    const recolor = new Map(CENTERS.map((c) => [turnedSolved[c], solved[c]]));
    view = turned.map((color) => recolor.get(color)!);
  }
  return view;
}

const GROUP_ES: Record<string, string> = {
  "Peanut - center on U": "Centro arriba",
  "Peanut - center on FR": "Centro FR",
  "Peanut - center on FL": "Centro FL",
  "Peanut - center on BR": "Centro BR",
  "Peanut - center on BL": "Centro BL",
  "Pi - center on U": "Centro arriba",
  "Pi - center on F": "Centro F",
  "Pi - center on B": "Centro B",
  "Pi - center on R": "Centro R",
  "Pi - center on L": "Centro L",
  "L5C (Last 5 Centers)": "L5C",
};

function l2lCases(groups: string[]): SkewbCase[] {
  const { found, all } = L2L_CASES;
  const cases: SkewbCase[] = [];
  for (const group of groups) {
    const keys = [...all.keys()].filter((key) => groupOf(all.get(key)!) === group);
    // The guides' cases first, in the order they list them, then the ones they leave out.
    const listed = [...found.entries()].filter(([key]) => keys.includes(key)).map(([key]) => key);
    const rest = keys.filter((key) => !found.has(key)).sort();
    [...listed, ...rest].forEach((key, k) => {
      const hit = found.get(key);
      const state = hit ? hit.state : canonical(all.get(key)!);
      const tokens: SarahToken[] = hit ? sarahTokens(hit.written) : shortestSarah(state);
      const algorithm = tokens.join(" ");
      const shape = topShape(state);
      const top = shape === "solved" ? "Las cuatro esquinas de arriba ya tienen el amarillo arriba." : describeCorners(state);
      const sarahGroup = hit ? ALGORITHM_GROUP.get(expandSarah(hit.written)) : undefined;
      const how = hit
        ? `Sarah lo resuelve con «${hit.written}»${sarahGroup ? `, en su grupo «${sarahGroup}»` : ""}.`
        : "";
      const notes = [
        hit ? `${SARAH_SHORTHAND}` : NO_ALGORITHM,
        hit?.listedIn ? `En la guía por casos aparece en el grupo «${hit.listedIn}», pero según el motor es de «${group}».` : "",
      ].filter(Boolean);
      cases.push({
        name: `${GROUP_ES[group]} · ${k + 1}`,
        algorithm,
        explanation: `${top} ${shape === "solved" ? describeCenters(state) : `${describeYellowCenter(state)} ${describeCenters(state)}`} ${how}`.trim(),
        state,
        shown: ALL,
        view: "top",
        // The cases without an algorithm are the by-case guide's "-".
        source: hit && !L2L_BY_CASE.some((g) => g.algorithms.includes(hit.written)) ? SARAH_SOURCES.guide : SARAH_SOURCES.byCase,
        note: notes.join(" "),
        goal: isSolvedAnyWay,
      });
    });
  }
  return cases;
}

const PEANUT_GROUPS = ["Peanut - center on U", "Peanut - center on FR", "Peanut - center on FL", "Peanut - center on BR", "Peanut - center on BL"];
const PI_GROUPS = ["Pi - center on U", "Pi - center on F", "Pi - center on B", "Pi - center on R", "Pi - center on L"];

// ---------- the sets ----------

export type SkewbSetId =
  | "skc-primera-cara"
  | "skc-esquinas"
  | "skc-centro"
  | "skc-centros"
  | "ski-primera-cara"
  | "ski-cara-arriba"
  | "ski-centros"
  | "ska-primera-cara"
  | "ska-peanut"
  | "ska-pi"
  | "ska-l5c";

const SKEWB_SETS: Record<SkewbSetId, SkewbCase[]> = {
  "skc-primera-cara": FIRST_SIDE_CASES,
  "skc-esquinas": topCornersCases,
  "skc-centro": uCenterCases,
  "skc-centros": lastCentersCases,
  "ski-primera-cara": FIRST_SIDE_CASES,
  "ski-cara-arriba": oppositeSideCases,
  "ski-centros": lastCentersCases,
  "ska-primera-cara": FIRST_SIDE_CASES,
  "ska-peanut": l2lCases(PEANUT_GROUPS),
  "ska-pi": l2lCases(PI_GROUPS),
  "ska-l5c": l2lCases(["L5C (Last 5 Centers)"]),
};

/** Each case's stickers, its algorithm (RUBIKO's notation) and what that algorithm has to leave — for the tests. */
export function skewbCaseChecks(setId: SkewbSetId) {
  return SKEWB_SETS[setId].map((kase) => ({ state: kase.state, algorithm: kase.algorithm, goal: kase.goal }));
}

export const SETS_SKEWB = Object.fromEntries(
  (Object.keys(SKEWB_SETS) as SkewbSetId[]).map((setId) => [
    setId,
    SKEWB_SETS[setId].map(
      (kase, index): AlgorithmCase => ({
        setId,
        id: id(index),
        number: index + 1,
        ...(kase.name ? { name: kase.name } : {}),
        algorithm: kase.algorithm,
        image: `/learning/${setId}/${setId}-${id(index)}.svg`,
        explanation: kase.explanation,
        ...(kase.note ? { note: kase.note } : {}),
        research: kase.source,
      }),
    ),
  ]),
) as Record<SkewbSetId, AlgorithmCase[]>;

/** The diagrams of these sets and of the notation, by file (written to public/ by the test). */
export function generatedSkewbDiagrams(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const notation of NOTATION_MOVES_SKEWB) {
    const move = notation.move as SarahToken;
    const inverse = `${move}'` as SarahToken;
    const { turns } = turnGeometry(sarahTurn(move));
    const half = new Set(ALL_STICKERS.filter(turns));
    const turned = [move, inverse].map((token) => ({ label: token, state: applySarahTokens(solved, [token]) }));
    files[notation.image] = moveSvg(turned, half, `${move} y ${inverse}`);
  }
  for (const [setId, cases] of Object.entries(SKEWB_SETS)) {
    cases.forEach((kase, index) => {
      const draw = kase.view === "bottom" ? bottomNetSvg : topNetSvg;
      files[`/learning/${setId}/${setId}-${id(index)}.svg`] = draw(kase.state, kase.shown, kase.name ?? `Caso ${id(index)}`);
    });
  }
  return files;
}
