/**
 * The 3×3 stage of the 4×4 methods: CFOP's Cruz, Esquinas, F2L, OLL and
 * PLL, the same cases as the 3×3 sheets, on a reduced 4×4 (every edge two
 * pieces that move together, every center a 2×2 of one color).
 *
 * Each algorithm is written in the 4×4's notation (`to4x4`): on a 4×4, r
 * is only the second layer, so the 3×3's r (R with the middle) is 3Rw or
 * Rw, M is both inner layers (r' l)... and its case is worked out on the
 * 4×4 engine (cube4.ts). The tests check that this case is exactly the
 * 3×3 case of the sheet's algorithm lifted to the 4×4, so the algorithm
 * does on a reduced 4×4 what it does on a 3×3. The diagrams are drawn from
 * that case with the sheets' views (diagrams-4x4.ts).
 *
 * The 3×3 cases (cruz-cases.ts and the rest) are not touched: these are
 * separate sets, with their own progress.
 */
import { parseCubeAlgorithm } from "@/features/cube/algorithm";
import { createSolvedCube } from "@/features/cube/model";
import { applyCubeMoves, applyMoves, invertMoves, type BigMove, type Move } from "@/features/cube/moves";
import type { CubeColor, CubeState, Vec3 } from "@/features/cube/types";
import { FACELET_GEOMETRY, faceletsFromCubeState } from "@/features/solver/cube-state";
import type { AlgorithmCase } from "./algorithm-sets";
import { CRUZ_CASES } from "./cruz-cases";
import {
  STICKERS_4,
  apply4,
  centerOf,
  centersSolved,
  colors4,
  edgeOf,
  inverse4,
  parse4,
  stickersAtPositions,
  type Face4,
} from "./cube4";
import { cornerViewSvg4, topViewSvg4, type Arrow4, type CornerView4 } from "./diagrams-4x4";
import { ESQUINAS_CASES } from "./esquinas-cases";
import { F2L_CASES } from "./f2l-cases";
import { OLL_CASES } from "./oll-cases";
import { PLL_CASES } from "./pll-cases";

export type Cfop4SetId = "c4-cruz" | "c4-esquinas" | "c4-f2l" | "c4-oll" | "c4-pll";

// ---------- notation ----------

/** How the 3×3's two-layer turns (r, Rw) are written on the 4×4. */
export type Wide4 = "Rw" | "3Rw";

const withModifier = (move: string, modifier: string) =>
  modifier === "2" ? `${move.replace(/'$/, "")}2` : modifier === "'" ? (move.endsWith("'") ? move.slice(0, -1) : `${move}'`) : move;

/** The 3×3's middle layers on a 4×4: both inner layers, each turning like the face it follows. */
const SLICES: Record<string, [string, string]> = {
  M: ["l", "r'"],
  E: ["d", "u'"],
  S: ["f", "b'"],
};

/**
 * A 3×3 algorithm in the 4×4's notation. Faces and whole-cube turns stay;
 * a two-layer turn (r, or Rw on the sheets) becomes `wide` (Rw: the two
 * outer layers; 3Rw: the three, which on a reduced 4×4 is exactly the
 * 3×3's r); M, E and S become their two inner layers.
 */
export function to4x4(algorithm: string, wide: Wide4 = "Rw"): string {
  return parseCubeAlgorithm(algorithm)
    .flatMap((move) => {
      const [, letter, modifier] = /^([A-Za-z])(.*)$/.exec(move)!;
      if (SLICES[letter]) return SLICES[letter].map((layer) => withModifier(layer, modifier));
      if (/^[rludfb]$/.test(letter)) return [withModifier(`${wide === "3Rw" ? "3" : ""}${letter.toUpperCase()}w`, modifier)];
      return [move];
    })
    .join(" ");
}

// ---------- holding the cube ----------

/** The 24 ways of holding a cube. */
const HOLDS: Move[][] = ([[], ["x"], ["x2"], ["x'"], ["z"], ["z'"]] as Move[][]).flatMap((a) =>
  ([[], ["y"], ["y2"], ["y'"]] as Move[][]).map((b) => [...a, ...b]),
);

/** How each set's sheet holds the cube: Cruz and Esquinas white up, F2L, OLL and PLL yellow up. */
const SHEET_HOLD: Record<Cfop4SetId, Move[]> = {
  "c4-cruz": [],
  "c4-esquinas": [],
  "c4-f2l": ["z2", "y2"],
  "c4-oll": ["z2"],
  "c4-pll": ["z2"],
};

export const frame3 = (setId: Cfop4SetId): CubeState => applyMoves(createSolvedCube(), SHEET_HOLD[setId]);
export const frame4 = (setId: Cfop4SetId): CubeColor[] =>
  colors4(applyCubeMoves(createSolvedCube(4), SHEET_HOLD[setId] as BigMove[], 4));

const sameVec = (a: Vec3, b: Vec3) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const centers3 = (state: CubeState) =>
  state.cubies.filter((cubie) => cubie.position.filter((c) => c === 0).length === 2).map((c) => `${c.id}@${c.position.join()}`).sort().join();

/**
 * The case an algorithm solves on a 3×3 held as `frame` holds it. An
 * algorithm may turn the whole cube (x, or a two-layer r), so undoing it
 * from the solved cube is not enough: the turn it leaves at the end is
 * undone first, and the case comes out held like the frame.
 */
export function case3(algorithm: string, frame: CubeState): CubeState {
  const moves = parseCubeAlgorithm(algorithm);
  const end = applyMoves(frame, moves);
  const hold = HOLDS.find((h) => centers3(applyMoves(end, h)) === centers3(frame));
  if (!hold) throw new Error(`${algorithm}: los centros no vuelven a su sitio`);
  return applyMoves(frame, [...invertMoves(hold), ...invertMoves(moves)]);
}

/** The same on the 4×4: the case `algorithm` (4×4 notation) solves, held like `frame`. */
export function case4(algorithm: string, frame: readonly CubeColor[]): CubeColor[] {
  const moves = parse4(algorithm);
  const end = apply4(frame, moves);
  const hold = (HOLDS as BigMove[][]).find((h) => centersSolved(apply4(end, h), frame));
  if (!hold) throw new Error(`${algorithm}: los centros no vuelven a su sitio`);
  return apply4(frame, [...inverse4(hold), ...inverse4(moves)]);
}

/**
 * A 3×3 position on a 4×4: each corner a corner, each edge its two
 * pieces, each center a 2×2 of its color (a reduced 4×4).
 */
export function lift3(state: CubeState): CubeColor[] {
  const colors = faceletsFromCubeState(state);
  return STICKERS_4.map(({ position, normal }) => {
    const p3 = position.map((c) => (Math.abs(c) === 3 ? Math.sign(c) : 0)) as unknown as Vec3;
    return colors[FACELET_GEOMETRY.findIndex(([p, n]) => sameVec(p, p3) && sameVec(n, normal))];
  });
}

// ---------- which notation each algorithm needs ----------

/**
 * The 4×4 algorithm of a sheet's 3×3 algorithm: with Rw for its two-layer
 * turns when that does on a reduced 4×4 exactly what the 3×3's r does,
 * and with 3Rw (which always does) when Rw would break the reduction.
 */
export function cfop4Algorithm(algorithm: string, setId: Cfop4SetId): { algorithm: string; wide: Wide4 } {
  const target = lift3(case3(algorithm, frame3(setId))).join();
  for (const wide of ["Rw", "3Rw"] as Wide4[]) {
    const written = to4x4(algorithm, wide);
    let colors: CubeColor[];
    try {
      colors = case4(written, frame4(setId));
    } catch {
      continue; // Its centers end up broken: Rw does not do it.
    }
    if (colors.join() === target) return { algorithm: written, wide };
  }
  throw new Error(`${algorithm}: no hay forma de escribirlo en el 4×4`);
}

// ---------- what the diagrams show ----------

const ALL = new Set(STICKERS_4.map((_, i) => i));

/** The stickers of the pieces whose home (in the solved frame) is at `homes`, wherever they are in `colors`. */
function piecesNow(colors: readonly CubeColor[], frame: readonly CubeColor[], homes: readonly Vec3[]): Set<number> {
  const key = (stickers: number[], from: readonly CubeColor[]) => stickers.map((i) => from[i]).sort().join();
  const groups = new Map<string, number[]>();
  STICKERS_4.forEach(({ position }, i) => groups.set(position.join(), [...(groups.get(position.join()) ?? []), i]));
  const wanted = new Set(homes.map((home) => key(groups.get(home.join())!, frame)));
  const shown = new Set<number>();
  for (const stickers of groups.values()) if (wanted.has(key(stickers, colors))) for (const i of stickers) shown.add(i);
  return shown;
}

const stickersFacing = (positions: Vec3[], face: Face4) =>
  stickersAtPositions(positions).filter((i) => STICKERS_4[i].face === face);

const corner = (x: number, y: number, z: number): Vec3 => [x * 3, y * 3, z * 3];

/** Cruz: the white-green edge (up front, white up) and the front center. */
function cruzShown(colors: readonly CubeColor[], frame: readonly CubeColor[]) {
  return new Set([...piecesNow(colors, frame, edgeOf("U", "F")), ...centerOf("F")]);
}

/**
 * Esquinas: the corner of the up-front slot on `side` (right, or left
 * when the sheet looks from the front left), the white cross on top, and
 * the two side centers with the side of their cross edges.
 */
function esquinasShown(colors: readonly CubeColor[], frame: readonly CubeColor[], side: "R" | "L") {
  const crossTop = (["F", "R", "B", "L"] as Face4[]).flatMap((face) => stickersFacing(edgeOf("U", face), "U"));
  return new Set([
    ...piecesNow(colors, frame, [corner(side === "R" ? 1 : -1, 1, 1)]),
    ...crossTop,
    ...centerOf("U"),
    ...centerOf("F"),
    ...centerOf(side),
    ...stickersFacing(edgeOf("U", "F"), "F"),
    ...stickersFacing(edgeOf("U", side), side),
  ]);
}

/**
 * F2L: the corner and the edge of the front-right slot (bottom layer
 * down), wherever they are, and, as the sheet, the front and right faces
 * below the top layer where they are already solved.
 */
function f2lShown(colors: readonly CubeColor[], frame: readonly CubeColor[]) {
  const solvedSides = STICKERS_4.flatMap(({ face, position }, i) =>
    (face === "F" || face === "R") && position[1] < 3 && colors[i] === frame[i] ? [i] : [],
  );
  return new Set([...piecesNow(colors, frame, [corner(1, -1, 1), ...edgeOf("F", "R")]), ...solvedSides]);
}

/** OLL: only the yellow stickers in color. */
const ollShown = (colors: readonly CubeColor[]) => new Set([...ALL].filter((i) => colors[i] === "yellow"));

// ---------- PLL arrows ----------

/** The top layer's slots as the top view draws them: [row, column] of their middle, 0–3. */
const TOP_SLOTS: { at: [number, number]; positions: Vec3[] }[] = [
  { at: [0, 0], positions: [corner(-1, 1, -1)] },
  { at: [0, 1.5], positions: edgeOf("U", "B") },
  { at: [0, 3], positions: [corner(1, 1, -1)] },
  { at: [1.5, 3], positions: edgeOf("U", "R") },
  { at: [3, 3], positions: [corner(1, 1, 1)] },
  { at: [3, 1.5], positions: edgeOf("U", "F") },
  { at: [3, 0], positions: [corner(-1, 1, 1)] },
  { at: [1.5, 0], positions: edgeOf("U", "L") },
];

/**
 * Where each top piece has to go, as the sheets' arrows: a swap is one
 * line with a head at each end, a cycle one arrow per piece.
 */
export function pllArrows(colors: readonly CubeColor[], frame: readonly CubeColor[]): Arrow4[] {
  const piece = (slot: (typeof TOP_SLOTS)[number], from: readonly CubeColor[]) =>
    stickersAtPositions(slot.positions.slice(0, 1)).map((i) => from[i]).sort().join();
  const target = TOP_SLOTS.map((slot) => TOP_SLOTS.findIndex((home) => piece(home, frame) === piece(slot, colors)));
  const arrows: Arrow4[] = [];
  const seen = new Set<number>();
  TOP_SLOTS.forEach((_, start) => {
    if (seen.has(start) || target[start] === start) return;
    const cycle: number[] = [];
    for (let k = start; !seen.has(k); k = target[k]) {
      seen.add(k);
      cycle.push(k);
    }
    if (cycle.length === 2) arrows.push({ from: TOP_SLOTS[cycle[0]].at, to: TOP_SLOTS[cycle[1]].at, both: true });
    else cycle.forEach((k) => arrows.push({ from: TOP_SLOTS[k].at, to: TOP_SLOTS[target[k]].at }));
  });
  return arrows;
}

// ---------- the sets ----------

const SOURCE_SETS: Record<Cfop4SetId, AlgorithmCase[]> = {
  "c4-cruz": CRUZ_CASES,
  "c4-esquinas": ESQUINAS_CASES,
  "c4-f2l": F2L_CASES,
  "c4-oll": OLL_CASES,
  "c4-pll": PLL_CASES,
};

/**
 * Sheet drawings that are not the case of their algorithm, checked on the
 * engine against the sheets' PNGs (docs/plan-puzles.md). The 4×4 card
 * draws the algorithm's case and says so. A drawing turned a quarter or a
 * half turn of U from its algorithm's case (OLL 12, 13, 29, 52, 55; PLL 6;
 * F2L 15) is the same case and is drawn as the algorithm solves it.
 */
export const SHEET_MISMATCH: Partial<Record<Cfop4SetId, Record<string, string>>> = {
  "c4-oll": {
    "26": "La hoja de OLL del 3×3 repite aquí el algoritmo del caso 27 (la Sune), pero su dibujo es la Antisune. Aquí va la Antisune de siempre, que según el motor resuelve justo ese dibujo.",
    "31": "El dibujo de la hoja de OLL del 3×3 tiene una arista con amarillo arriba y detrás a la vez y otra sin amarillo, que no puede ser; aquí se dibuja el caso que resuelve el algoritmo según el motor.",
    "54": "La hoja de OLL del 3×3 dibuja aquí las aristas de delante y de detrás al revés (la de delante con el amarillo arriba y la de detrás con el amarillo detrás); aquí se dibuja el caso que resuelve el algoritmo según el motor.",
  },
  "c4-f2l": {
    "05": "La hoja de F2L del 3×3 dibuja aquí otro caso (la esquina arriba delante a la derecha con el blanco a la derecha y la arista arriba delante), que según el motor no resuelve ningún algoritmo de la hoja; aquí se dibuja el caso que resuelve este.",
    "06": "La hoja de F2L del 3×3 dibuja aquí otro caso (la esquina arriba delante a la derecha con el blanco delante y la arista arriba a la derecha), que según el motor no resuelve ningún algoritmo de la hoja; aquí se dibuja el caso que resuelve este.",
  },
};

/**
 * Esquinas, as the sheet draws it (white up, the cross done): the sheet's
 * algorithms are steps of a beginner's method, so a case comes from its
 * drawing, not from undoing its algorithm (cases 2 and 4 even share one).
 * `setup` takes the solved cube to the drawing; `then` is what the
 * algorithm leaves (checked by the tests): solved, or another case.
 */
export const ESQUINAS_DRAWN: Record<string, { hold: Move[]; setup: string; side: "R" | "L"; then: { case?: string; turn?: string } }> = {
  // The corner below its slot, red in front, green on the right, white down.
  "01": { hold: [], setup: "R F2 R' F2 D", side: "R", then: { case: "02" } },
  // Below its slot, green in front, white on the right.
  "02": { hold: [], setup: "R' D R", side: "R", then: {} },
  // Seen from the front left with red in front: below its slot, white on the left (green side).
  "03": { hold: ["y"], setup: "L D' L'", side: "L", then: {} },
  // In its slot, turned: red in front, green up, white on the right.
  "04": { hold: [], setup: "R F' R' F2 D F'", side: "R", then: { case: "02", turn: "D" } },
};

const ESQUINAS_NOTE: Record<string, string> = {
  "01": "Este algoritmo no deja la esquina hecha: la deja como en el caso 2 (con el blanco a la derecha), y se sigue con el caso 2. El motor de RUBIKO lo comprueba.",
  "04": "Este algoritmo saca la esquina: la deja abajo, y después de D queda como en el caso 2, que la sube bien. El motor de RUBIKO lo comprueba.",
};

export interface Cfop4Case {
  setId: Cfop4SetId;
  source: AlgorithmCase;
  algorithm: string;
  wide: Wide4;
  frame: CubeColor[];
  start: CubeColor[];
  shown: Set<number>;
  arrows: Arrow4[];
  /** Where the corner views look from. */
  view: CornerView4;
}

/** Where the sheet's algorithm is not the one of its drawing (SHEET_MISMATCH says why): the algorithm the 4×4 card uses. */
export const ALGORITHM_FIX: Partial<Record<Cfop4SetId, Record<string, string>>> = {
  "c4-oll": { "26": "R U2 R' U' R U' R'" },
};

export const heldFrame4 = (hold: Move[]) => colors4(applyCubeMoves(createSolvedCube(4), hold as BigMove[], 4));

function buildCase(setId: Cfop4SetId, source: AlgorithmCase): Cfop4Case {
  const drawn = setId === "c4-esquinas" ? ESQUINAS_DRAWN[source.id] : undefined;
  if (drawn) {
    // Only faces and D: the same letters on the 4×4.
    const frame = heldFrame4(drawn.hold);
    const start = apply4(frame, parse4(drawn.setup));
    const view: CornerView4 = drawn.side === "R" ? "delante-derecha" : "delante-izquierda";
    return { setId, source, algorithm: source.algorithm, wide: "Rw", frame, start, shown: esquinasShown(start, frame, drawn.side), arrows: [], view };
  }
  const frame = frame4(setId);
  const { algorithm, wide } = cfop4Algorithm(ALGORITHM_FIX[setId]?.[source.id] ?? source.algorithm, setId);
  const start = case4(algorithm, frame);
  const shown =
    setId === "c4-cruz"
      ? cruzShown(start, frame)
      : setId === "c4-f2l"
          ? f2lShown(start, frame)
          : setId === "c4-oll"
            ? ollShown(start)
            : ALL;
  const arrows = setId === "c4-pll" ? pllArrows(start, frame) : [];
  return { setId, source, algorithm, wide, frame, start, shown, arrows, view: "delante-derecha" };
}

let built: Record<Cfop4SetId, Cfop4Case[]> | null = null;

/** Every case, worked out on the engine (only once). */
export function cfop4Cases(): Record<Cfop4SetId, Cfop4Case[]> {
  built ??= Object.fromEntries(
    (Object.keys(SOURCE_SETS) as Cfop4SetId[]).map((setId) => [setId, SOURCE_SETS[setId].map((source) => buildCase(setId, source))]),
  ) as Record<Cfop4SetId, Cfop4Case[]>;
  return built;
}

const NOTE_3RW =
  "Escrito para el 4×4: la r del 3×3 (dos capas) es aquí 3Rw, las tres capas de la derecha (y f es 3Fw, u es 3Uw...). En un 4×4 reducido eso es justo lo que hace en el 3×3; con Rw, el motor comprueba que el 4×4 se deshace.";
const NOTE_SLICE = "La capa del medio del 3×3 son aquí las dos capas de dentro a la vez: M es l r' (y M', l' r).";

function notes(kase: Cfop4Case): string | undefined {
  const parts: string[] = [];
  if (/3[RLUDFB]w/.test(kase.algorithm)) parts.push(NOTE_3RW);
  if (/[MES]/.test(kase.source.algorithm)) parts.push(NOTE_SLICE);
  const mismatch = SHEET_MISMATCH[kase.setId]?.[kase.source.id];
  if (mismatch) parts.push(mismatch);
  if (kase.setId === "c4-esquinas" && ESQUINAS_NOTE[kase.source.id]) parts.push(ESQUINAS_NOTE[kase.source.id]);
  if (kase.source.note) parts.push(kase.source.note);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/** The five sets as Aprender lists them: the 3×3 cases, with the 4×4 algorithm and diagram. */
export const SETS_CFOP_4X4 = Object.fromEntries(
  (Object.keys(SOURCE_SETS) as Cfop4SetId[]).map((setId) => [
    setId,
    SOURCE_SETS[setId].map((source): AlgorithmCase => {
      const kase = cfop4Cases()[setId][source.number - 1];
      const note = notes(kase);
      return {
        ...source,
        setId,
        algorithm: kase.algorithm,
        image: `/learning/${setId}/${setId}-${source.id}.svg`,
        ...(note ? { note } : {}),
      };
    }),
  ]),
) as Record<Cfop4SetId, AlgorithmCase[]>;

/** The diagrams of these sets, by file (written to public/ by the test). */
export function generatedCfop4Diagrams(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const [setId, cases] of Object.entries(cfop4Cases()) as [Cfop4SetId, Cfop4Case[]][]) {
    for (const kase of cases) {
      const title = `Caso ${kase.source.id}${kase.source.name ? ` · ${kase.source.name}` : ""}`;
      files[`/learning/${setId}/${setId}-${kase.source.id}.svg`] =
        setId === "c4-oll" || setId === "c4-pll"
          ? topViewSvg4(kase.start, title, kase.shown, kase.arrows)
          : cornerViewSvg4(kase.start, kase.shown, kase.view, title);
    }
  }
  return files;
}
