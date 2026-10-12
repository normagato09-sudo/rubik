/**
 * Aprender del 4×4: Reducción, Freeslice, Hoya y Yau (docs/plan-puzles.md),
 * investigados en la Speedsolving Wiki (cada caso dice su fuente,
 * «Investigado»). La parte de 3×3 de los cuatro métodos es la de CFOP que
 * ya existe (Cruz, Esquinas, F2L, OLL y PLL): sus bloques la listan tal
 * cual (categories.ts, sets.ts).
 *
 * Every case is a position of the engine (cube4.ts) and its algorithm is
 * checked by the tests: it reaches the step's goal, and for the intuitive
 * steps (centers, cross, edges) it is the shortest the engine finds with
 * the moves the step allows. The centers are made from colors (the four
 * center pieces of a color look the same, so any spread of them can
 * happen); the edges from where their wings are. The explanations are
 * read from each case's stickers, and the diagrams are drawn from them
 * (diagrams-4x4.ts; `WRITE_DIAGRAMS=1 npx vitest run cases-4x4` rewrites
 * them, and the notation's).
 */
import type { CubeColor, Vec3 } from "@/features/cube/types";
import type { BigMove } from "@/features/cube/moves";
import type { ResearchSource } from "@/features/pyraminx/research";
import type { AlgorithmCase } from "./algorithm-sets";
import { id, joinSpanish } from "./cases-pyraminx";
import {
  EDGES_4,
  SOLVED_4,
  STICKERS_4,
  WINGS_4,
  apply4,
  caseColors4,
  centerOf,
  edgeOf,
  movePerm,
  parse4,
  sticker4,
  stickersAtPositions,
  wingAt,
  withWings,
  type Face4,
} from "./cube4";
import { cornerViewSvg4, frontViewSvg4, moveSvg4, topViewSvg4, type CornerView4 } from "./diagrams-4x4";
import { NOTATION_MOVES_4X4 } from "./notation";

// ---------- sources ----------

export const SOURCES_4X4 = {
  reduction: { name: "Speedsolving Wiki · Reduction", url: "https://www.speedsolving.com/wiki/index.php/Reduction" },
  parity: {
    name: "Speedsolving Wiki · 4x4x4 parity algorithms",
    url: "https://www.speedsolving.com/wiki/index.php/4x4x4_parity_algorithms",
  },
  freeslice: { name: "Speedsolving Wiki · Freeslice", url: "https://www.speedsolving.com/wiki/index.php/Freeslice" },
  hoya: { name: "Speedsolving Wiki · Hoya method", url: "https://www.speedsolving.com/wiki/index.php/Hoya_method" },
  yau: { name: "Speedsolving Wiki · Yau method", url: "https://www.speedsolving.com/wiki/index.php/Yau_method" },
  edgePairing: {
    name: "Speedsolving Wiki · 3-2-3 Edge Pairing",
    url: "https://www.speedsolving.com/wiki/index.php/3-2-3_Edge_Pairing",
  },
} satisfies Record<string, ResearchSource>;

// ---------- how the cube is held ----------

/** Held like the sheets: yellow up, white down, green in front. */
const HELD = SOLVED_4;
/** The first center is built on top, where it shows: white up (x2). */
const WHITE_UP = apply4(SOLVED_4, ["x2"]);
/** The two finished centers, or the cross, on the sides: white on the left, yellow on the right (z). */
const SIDES = apply4(SOLVED_4, ["z"]);

// ---------- words ----------

const PIECE: Record<CubeColor, [string, string]> = {
  white: ["blanca", "blancas"],
  yellow: ["amarilla", "amarillas"],
  red: ["roja", "rojas"],
  orange: ["naranja", "naranjas"],
  blue: ["azul", "azules"],
  green: ["verde", "verdes"],
};

const COLOR: Record<CubeColor, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};

/** How the 2×2 center of a face reads: its rows and its columns. */
function centerWords(face: Face4): { rows: [string, string]; cols: [string, string]; bar: (line: "row" | "col", k: number) => string } {
  const rows: [string, string] = face === "U" ? ["detrás", "delante"] : face === "D" ? ["delante", "detrás"] : ["arriba", "abajo"];
  const cols: [string, string] = ["a la izquierda", "a la derecha"];
  const flat = face === "U" || face === "D";
  return {
    rows,
    cols,
    bar: (line, k) =>
      line === "row" ? `una barra ${flat ? "" : "horizontal "}${rows[k]}` : `una barra ${flat ? "" : "vertical "}${cols[k]}`,
  };
}

/** "una barra amarilla vertical a la derecha", "tres piezas blancas (falta la de delante a la izquierda)"... */
export function describeCenter(colors: readonly CubeColor[], face: Face4, color: CubeColor): string {
  const cells = ([
    [1, 1],
    [1, 2],
    [2, 1],
    [2, 2],
  ] as const).filter(([r, c]) => colors[sticker4(face, r, c)] === color);
  const { rows, cols, bar } = centerWords(face);
  const cell = ([r, c]: readonly [number, number]) => `${rows[r - 1]} ${cols[c - 1]}`;
  const [one, many] = PIECE[color];
  switch (cells.length) {
    case 4:
      return `las cuatro piezas ${many}: está hecho`;
    case 3: {
      const missing = ([[1, 1], [1, 2], [2, 1], [2, 2]] as const).find(([r, c]) => !cells.some(([a, b]) => a === r && b === c))!;
      return `tres piezas ${many} (falta la de ${cell(missing)})`;
    }
    case 2: {
      const [[r1, c1], [r2, c2]] = cells;
      const words = r1 === r2 ? bar("row", r1 - 1) : c1 === c2 ? bar("col", c1 - 1) : null;
      if (!words) return `dos piezas ${many} en diagonal (${cell(cells[0])} y ${cell(cells[1])})`;
      return words.replace("una barra", `una barra ${one}`);
    }
    case 1:
      return `una pieza ${one}, ${cell(cells[0])}`;
    default:
      return `ninguna pieza ${one}`;
  }
}

const OUTER_NAME = (axis: number, sign: number) =>
  axis === 1 ? (sign > 0 ? "arriba" : "abajo") : axis === 2 ? (sign > 0 ? "delante" : "detrás") : sign > 0 ? "a la derecha" : "a la izquierda";
const INNER_NAME = (axis: number, sign: number) =>
  axis === 1 ? (sign > 0 ? "la de arriba" : "la de abajo") : axis === 2 ? (sign > 0 ? "la de delante" : "la de detrás") : sign > 0 ? "la de la derecha" : "la de la izquierda";
const FACING = (normal: Vec3) =>
  normal[1] !== 0 ? (normal[1] > 0 ? "hacia arriba" : "hacia abajo") : normal[2] !== 0 ? (normal[2] > 0 ? "hacia ti" : "hacia atrás") : normal[0] > 0 ? "a la derecha" : "a la izquierda";

/** "la arista de delante a la izquierda" for a wing's position. */
export function edgeName(position: Vec3): string {
  const outer = [1, 2, 0].filter((axis) => Math.abs(position[axis]) === 3);
  return `la arista de ${outer.map((axis) => OUTER_NAME(axis, position[axis])).join(" ")}`;
}

/** Where the two pieces (wings) of the edge with colors `a` and `b` are, and where `a` looks. */
export function describeWings(colors: readonly CubeColor[], a: CubeColor, b: CubeColor): string {
  const wings = WINGS_4.filter(({ stickers: [s, t] }) => new Set([colors[s], colors[t]]).size === 2 && [colors[s], colors[t]].every((c) => c === a || c === b));
  const parts = wings.map(({ position, stickers }) => {
    const inner = position.findIndex((c) => Math.abs(c) !== 3);
    const facing = FACING(STICKERS_4[stickers.find((s) => colors[s] === a)!].normal);
    return `en ${edgeName(position)}, ${INNER_NAME(inner, position[inner])}, con el ${COLOR[a]} mirando ${facing}`;
  });
  return `Las dos piezas ${PIECE[a][0]}-${PIECE[b][0]} están ${joinSpanish(parts)}.`;
}

const sameEdge = (colors: readonly CubeColor[], a: CubeColor, b: CubeColor) => {
  const wings = WINGS_4.filter(({ stickers: [s, t] }) => [colors[s], colors[t]].sort().join() === [a, b].sort().join());
  const [p, q] = wings.map((w) => w.position);
  return p.every((c, k) => Math.abs(c) !== 3 || c === q[k]);
};

// ---------- the cases ----------

type Draw = (colors: readonly CubeColor[], shown: ReadonlySet<number>, title: string) => string;
const corner = (view: CornerView4): Draw => (colors, shown, title) => cornerViewSvg4(colors, shown, view, title);
const front: Draw = frontViewSvg4;
const top: Draw = (colors, shown, title) => topViewSvg4(colors, title, shown);

export interface Case4 {
  name: string;
  algorithm: string;
  /** The solved cube held as the step holds it: what the goal stickers have to show. */
  frame: readonly CubeColor[];
  start: CubeColor[];
  /** Stickers that must show their color in `frame` after the algorithm. */
  goal: number[];
  /** Something else the algorithm has to leave (every edge paired...). */
  also?: (colors: readonly CubeColor[]) => boolean;
  /** The turns the step allows: the algorithm is the shortest the engine finds with them (tests). */
  moves?: string[];
  shown: Set<number>;
  draw: Draw;
  explanation: string;
  note?: string;
  source: ResearchSource;
}

const swapStickers = (colors: readonly CubeColor[], pairs: [number, number][]) => {
  const next = [...colors];
  for (const [a, b] of pairs) [next[a], next[b]] = [next[b], next[a]];
  return next;
};

const ALL_CENTERS = (["U", "R", "F", "D", "L", "B"] as Face4[]).flatMap(centerOf);
const edgeStickers = (a: Face4, b: Face4) => stickersAtPositions(edgeOf(a, b));
/** The cross around the white center when it is on the left (z), and when it is down. */
const CROSS_LEFT = (["U", "F", "D", "B"] as Face4[]).flatMap((f) => edgeStickers("L", f));
const CROSS_DOWN = (["F", "R", "B", "L"] as Face4[]).flatMap((f) => edgeStickers("D", f));
/** Yau's three cross edges, with the cross on the left: the one in front is still free. */
const CROSS_LEFT_3 = (["U", "D", "B"] as Face4[]).flatMap((f) => edgeStickers("L", f));

/** Which sticker of the start each sticker of the end comes from, for the whole algorithm. */
function sources(algorithm: string): Int8Array {
  let total = Int8Array.from({ length: 96 }, (_, i) => i);
  for (const move of parse4(algorithm)) {
    const perm = movePerm(move as BigMove);
    total = Int8Array.from(perm, (from) => total[from]);
  }
  return total;
}

/** The goal's stickers where the case has them: in color in the diagram. */
const goalSources = (algorithm: string, goal: readonly number[]) => {
  const from = sources(algorithm);
  return new Set(goal.map((i) => from[i]));
};

const centerStickers = (colors: readonly CubeColor[], color: CubeColor) =>
  ALL_CENTERS.filter((i) => colors[i] === color);

// Centers. The four center pieces of a color look the same, so the cases are spreads of colors.

const FIRST_CENTER: Case4 = (() => {
  const start = swapStickers(WHITE_UP, [
    [sticker4("U", 1, 2), sticker4("F", 2, 1)],
    [sticker4("U", 2, 2), sticker4("F", 2, 2)],
  ]);
  return {
    name: "Primer centro",
    algorithm: "F' r",
    frame: WHITE_UP,
    start,
    goal: centerOf("U"),
    moves: ["U", "F", "r", "Rw", "Lw"],
    shown: new Set(centerStickers(start, "white")),
    draw: corner("delante-derecha"),
    explanation: `Con el centro blanco arriba, la cara de arriba tiene ${describeCenter(start, "U", "white")} y la de delante, ${describeCenter(start, "F", "white")}. F' gira la cara de delante para dejar esa barra en vertical a la derecha, justo debajo del hueco, y r (solo la segunda capa) la sube.`,
    source: SOURCES_4X4.reduction,
  };
})();

const SECOND_CENTER: Case4 = (() => {
  const start = swapStickers(HELD, [
    [sticker4("U", 1, 2), sticker4("F", 1, 2)],
    [sticker4("U", 2, 2), sticker4("F", 2, 2)],
  ]);
  return {
    name: "Segundo centro",
    algorithm: "U2 r U2 r'",
    frame: HELD,
    start,
    goal: [...centerOf("U"), ...centerOf("D")],
    moves: ["U", "F", "r", "Rw", "Lw"],
    shown: new Set([...centerStickers(start, "yellow"), ...centerOf("D")]),
    draw: corner("delante-derecha"),
    explanation: `El blanco ya está abajo. Arriba hay ${describeCenter(start, "U", "yellow")} y delante, ${describeCenter(start, "F", "yellow")}. U2 pasa la barra de arriba a la derecha; r sube la de delante y se lleva la de arriba detrás (y una columna del blanco, delante); U2 mueve la nueva a la izquierda y r' devuelve la de detrás arriba, junto a ella, y el blanco abajo.`,
    source: SOURCES_4X4.reduction,
  };
})();

/** A side center with a bar, and the last two centers: white on the left, yellow on the right. */
function lastCenters(keep: readonly number[], keepWords: string): Case4[] {
  const sideStart = (pairs: [number, number][]) => swapStickers(SIDES, pairs);
  const bar = sideStart([
    [sticker4("U", 1, 2), sticker4("F", 1, 2)],
    [sticker4("U", 2, 2), sticker4("F", 2, 2)],
  ]);
  const crooked = sideStart([
    [sticker4("U", 1, 2), sticker4("F", 1, 1)],
    [sticker4("U", 2, 2), sticker4("F", 1, 2)],
  ]);
  const neighbours = sideStart([
    [sticker4("F", 1, 2), sticker4("D", 1, 2)],
    [sticker4("F", 2, 2), sticker4("D", 2, 2)],
  ]);
  const opposite = sideStart([
    [sticker4("F", 1, 2), sticker4("B", 1, 1)],
    [sticker4("F", 2, 2), sticker4("B", 2, 1)],
  ]);
  const sides = [...centerOf("L"), ...centerOf("R")];
  const base = { frame: SIDES, draw: corner("delante-derecha"), source: SOURCES_4X4.reduction };
  const red = "red";
  const cases: Case4[] = [
    {
      ...base,
      name: "Una barra debajo del hueco",
      algorithm: "r",
      start: bar,
      goal: [...sides, ...centerOf("U"), ...keep],
      moves: ["U", "F", "r", "Rw"],
      shown: new Set([...centerStickers(bar, red), ...sides]),
      explanation: `Arriba hay ${describeCenter(bar, "U", red)} y delante, ${describeCenter(bar, "F", red)}, justo debajo del hueco. r sube la barra sin tocar los centros de los lados${keepWords}.`,
    },
  ];
  if (keep.length === 0) {
    cases.push({
      ...base,
      name: "Una barra torcida",
      algorithm: "F r",
      start: crooked,
      goal: [...sides, ...centerOf("U")],
      moves: ["U", "F", "r", "Rw"],
      shown: new Set([...centerStickers(crooked, red), ...sides]),
      explanation: `Arriba hay ${describeCenter(crooked, "U", red)} y delante, ${describeCenter(crooked, "F", red)}. F la pone en vertical a la derecha, debajo del hueco, y r la sube.`,
    });
  }
  cases.push(
    {
      ...base,
      name: "Últimos dos centros, vecinos",
      algorithm: "F2 r F2 r'",
      start: neighbours,
      goal: [...ALL_CENTERS, ...keep],
      moves: ["U", "F", "D", "r", "Rw"],
      shown: new Set(ALL_CENTERS),
      explanation: `Solo faltan la cara de delante y la de abajo, que tienen sus barras de la derecha cambiadas: delante hay ${describeCenter(neighbours, "F", "orange")}. F2 aparta la barra naranja a la izquierda y r trae a la derecha la barra verde de abajo. F2 vuelve a girar la cara de delante, con lo que la naranja queda a la derecha, y r' la baja a su sitio y devuelve lo demás${keepWords}.`,
    },
    {
      ...base,
      name: "Últimos dos centros, opuestos",
      algorithm: "F2 r2 F2 r2",
      start: opposite,
      goal: [...ALL_CENTERS, ...keep],
      moves: ["U", "F", "D", "r", "Rw"],
      shown: new Set(ALL_CENTERS),
      explanation: `Solo faltan la cara de delante y la de detrás, con una barra cambiada: delante hay ${describeCenter(opposite, "F", "blue")}. F2 aparta la barra azul a la izquierda y r2 cambia la columna de la derecha de delante por la de detrás. F2 vuelve a poner la azul a la derecha y r2 las cambia otra vez: la azul va detrás y la verde queda delante${keepWords}.`,
    },
  );
  return cases;
}

// Edges, one at a time (Reducción) and the last two: the two pieces of the edge in front, left and right.

const FLIP = "R U R' F R' F' R";
const SAME_HEIGHT = `Uw' ${FLIP} Uw`;
const SAME_HEIGHT_DOWN = `Dw ${FLIP} Dw'`;
const OTHER_HEIGHT = `${FLIP} ${SAME_HEIGHT}`;

const PAIR_WORDS = {
  up: "Están a la misma altura y enseñan el mismo color hacia ti. Uw' lleva la pieza de la izquierda a la derecha (y la de la derecha, detrás); R U R' F R' F' R da la vuelta a la arista de la derecha, así que esa pieza pasa abajo, y Uw devuelve las capas y trae la otra justo encima: quedan juntas delante a la derecha, y los centros, en su sitio.",
  down: "Están a la misma altura, las dos abajo, y enseñan el mismo color hacia ti. Dw lleva la pieza de la izquierda a la derecha (y la de la derecha, detrás); R U R' F R' F' R da la vuelta a la arista de la derecha, así que esa pieza pasa arriba, y Dw' devuelve las capas y trae la otra justo debajo: quedan juntas delante a la derecha, y los centros, en su sitio.",
  other:
    "Están a distinta altura, así que no enseñan el mismo color hacia ti. Primero R U R' F R' F' R da la vuelta a la arista de la derecha: su pieza cambia de altura y queda el caso de la misma altura, que se termina con Uw' R U R' F R' F' R Uw.",
};

function pairCase(name: string, algorithm: string, words: string, a: CubeColor, b: CubeColor, source: ResearchSource): Case4 {
  const start = caseColors4(algorithm);
  return {
    name,
    algorithm,
    frame: HELD,
    start,
    goal: [...ALL_CENTERS, ...edgeStickers("F", "R")],
    shown: new Set(WINGS_4.filter(({ stickers: [s, t] }) => [start[s], start[t]].sort().join() === [a, b].sort().join()).flatMap((w) => w.stickers)),
    draw: front,
    explanation: `${describeWings(start, a, b)} ${words}`,
    source,
  };
}

const wing = (a: Face4, b: Face4, up: boolean) => wingAt(edgeOf(a, b)[up ? 1 : 0]);
const FL_UP = wing("F", "L", true);
const FL_DOWN = wing("F", "L", false);
const FR_UP = wing("F", "R", true);
const FR_DOWN = wing("F", "R", false);

/**
 * The last two edges: the four pieces of the edges in front, left and
 * right, with the rest paired. The engine counts 24 ways they can sit
 * (cases-4x4.test.ts): 8 have both edges paired, and the other 16 are
 * just two cases, the pieces of each edge at the same height or not.
 */
export const LAST_TWO_STARTS = {
  same: withWings(HELD, [
    [FL_UP, FL_UP],
    [FR_UP, FL_DOWN],
    [FL_DOWN, FR_UP],
    [FR_DOWN, FR_DOWN],
  ]),
  other: withWings(HELD, [
    [FL_UP, FL_UP],
    [FR_UP, FL_DOWN],
    [FR_DOWN, FR_UP],
    [FL_DOWN, FR_DOWN],
  ]),
};

const paired = (colors: readonly CubeColor[]) => EDGES_4.every(([a1, b1, a2, b2]) => colors[a1] === colors[b1] && colors[a2] === colors[b2]);

function lastTwoCases(source: ResearchSource): Case4[] {
  const shown = new Set([FL_UP, FL_DOWN, FR_UP, FR_DOWN].flatMap((w) => WINGS_4[w].stickers));
  const describe = (start: CubeColor[]) => `${describeWings(start, "green", "red")} ${describeWings(start, "green", "orange")}`;
  return [
    {
      name: "Últimas dos aristas, a la misma altura",
      algorithm: SAME_HEIGHT,
      frame: HELD,
      start: LAST_TWO_STARTS.same,
      goal: ALL_CENTERS,
      also: paired,
      shown,
      draw: front,
      explanation: `${describe(LAST_TWO_STARTS.same)} Las piezas de cada arista están a la misma altura, así que el mismo algoritmo de antes empareja las dos a la vez.`,
      source,
    },
    {
      name: "Últimas dos aristas, a distinta altura",
      algorithm: OTHER_HEIGHT,
      frame: HELD,
      start: LAST_TWO_STARTS.other,
      goal: ALL_CENTERS,
      also: paired,
      shown,
      draw: front,
      explanation: `${describe(LAST_TWO_STARTS.other)} Las piezas de cada arista están a distinta altura: R U R' F R' F' R da la vuelta a la arista de la derecha y queda el caso de la misma altura.`,
      source,
    },
  ];
}

const reductionEdges = (source: ResearchSource): Case4[] => [
  pairCase("Misma altura, arriba", SAME_HEIGHT, PAIR_WORDS.up, "green", "orange", source),
  pairCase("Misma altura, abajo", SAME_HEIGHT_DOWN, PAIR_WORDS.down, "green", "orange", source),
  pairCase("Distinta altura", OTHER_HEIGHT, PAIR_WORDS.other, "green", "orange", source),
];

// Freeslice: the first 8 edges with the slice d left turned.

function freesliceCase(name: string, algorithm: string, words: string): Case4 {
  const start = caseColors4(algorithm);
  const homes = (["F", "R", "B", "L"] as Face4[]).flatMap((f) => [edgeOf("U", f), edgeOf("D", f)]);
  const upAndDown = homes.flatMap((home) => stickersAtPositions(home));
  // The edge the algorithm pairs: the one of the top or bottom layer whose two pieces are apart.
  const home = homes.find((wings) => {
    const [s, t] = WINGS_4[wingAt(wings[0])].stickers;
    return !sameEdge(start, SOLVED_4[s], SOLVED_4[t]);
  })!;
  const target = home.map((p) => WINGS_4[wingAt(p)]);
  const [a, b] = target[0].stickers.map((s) => SOLVED_4[s]);
  return {
    name,
    algorithm,
    frame: HELD,
    start,
    goal: [...centerOf("U"), ...centerOf("D"), ...upAndDown],
    moves: ["U", "R", "d", "L"],
    shown: goalSources(algorithm, target.flatMap((w) => w.stickers)),
    draw: front,
    explanation: `El corte de abajo (d) está girado: la fila de abajo de los centros de los lados no coincide, y no importa. ${describeWings(start, a, b)} ${words}`,
    source: SOURCES_4X4.freeslice,
  };
}

const FREESLICE_EDGES: Case4[] = [
  freesliceCase("Pareja con d", "d R U R'", "d gira solo esa capa y junta la pieza de abajo con la de arriba, delante a la derecha; R U R' sube la arista ya emparejada a la capa de arriba y baja otra a ese hueco."),
  freesliceCase("Pareja con d'", "d' R U R'", "d' junta la pieza de abajo con la de arriba, delante a la derecha; R U R' la guarda arriba y baja otra a ese hueco."),
  freesliceCase("Pareja con d2", "d2 R U R'", "d2 trae la pieza de abajo desde el otro lado y la junta con la de arriba, delante a la derecha; R U R' la guarda arriba."),
];

// Hoya and Yau: cross edges with the inner slices (the side centers are still free).

function crossCase(name: string, algorithm: string, words: string, source: ResearchSource): Case4 {
  const start = caseColors4(algorithm);
  return {
    name,
    algorithm,
    frame: HELD,
    start,
    goal: [...centerOf("U"), ...centerOf("D"), ...edgeStickers("D", "F")],
    moves: ["U", "D", "R", "L", "F", "B", "u", "d"],
    shown: goalSources(algorithm, edgeStickers("D", "F")),
    draw: front,
    explanation: `${describeWings(start, "white", "green")} ${words}`,
    source,
  };
}

const crossEdges = (source: ResearchSource): Case4[] => [
  crossCase("Juntar con d", "d F'", "d (solo la capa de dentro, que mueve centros que aún no importan) las junta delante a la izquierda, y F' baja la arista a su sitio.", source),
  crossCase("Juntar con u", "u F", "u las junta delante a la derecha, y F baja la arista a su sitio.", source),
  crossCase("Una pieza en la derecha", "R d' F'", "R lleva la pieza de abajo a la derecha a la arista de delante a la derecha, d' la junta con la otra delante a la izquierda y F' baja la arista.", source),
];

/** Yau's last cross edge: the centers are done, so the slice has to come back. */
const lastCrossEdge: Case4[] = [
  [`${SAME_HEIGHT} F`, "Misma altura", "Están a la misma altura: Uw' R U R' F R' F' R Uw las empareja delante a la derecha (como en Reducción, sin estropear los centros ni la cruz) y F baja la arista a su sitio."],
  [`${OTHER_HEIGHT} F`, "Distinta altura", "Están a distinta altura: R U R' F R' F' R da la vuelta a la arista de la derecha, Uw' R U R' F R' F' R Uw las empareja y F baja la arista."],
].map(([algorithm, name, words]) => {
  const start = caseColors4(algorithm);
  return {
    name,
    algorithm,
    frame: HELD,
    start,
    goal: [...ALL_CENTERS, ...CROSS_DOWN],
    shown: goalSources(algorithm, edgeStickers("D", "F")),
    draw: front,
    explanation: `${describeWings(start, "white", "green")} ${words}`,
    source: SOURCES_4X4.yau,
  };
});

/** Hoya and Yau: the 8 edges left, with the cross on the left (3-2-3 edge pairing). */
function sideEdges(source: ResearchSource): Case4[] {
  return [
    ["Uw R U' R' Uw'", "Uw aparta la pieza de delante a la derecha (se va delante a la izquierda); R U' R' baja la otra a la arista de delante a la derecha, abajo, y Uw' devuelve las capas y trae la primera justo encima: quedan juntas."],
    ["Dw' R U R' Dw", "Dw' aparta la pieza de delante a la derecha (se va delante a la izquierda); R U R' baja la otra a la arista de delante a la derecha, arriba, y Dw devuelve las capas y trae la primera justo debajo: quedan juntas."],
    ["Uw R2 Uw'", "Uw lleva la pieza de detrás a la izquierda delante a la izquierda, y la de delante a la derecha, detrás; R2 trae esa a la arista de delante a la derecha, abajo, y Uw' devuelve las capas y pone la otra justo encima: quedan juntas."],
  ].map(([algorithm, words]): Case4 => {
    const start = caseColors4(algorithm, SIDES);
    const target = edgeStickers("F", "R");
    const [a, b] = [SIDES[target[0]], SIDES[target.find((i) => SIDES[i] !== SIDES[target[0]])!]];
    return {
      name: algorithm.split(" ")[0] === "Dw'" ? "Con la capa de abajo" : algorithm.includes("R2") ? "Con R2" : "Con la capa de arriba",
      algorithm,
      frame: SIDES,
      start,
      goal: [...ALL_CENTERS, ...CROSS_LEFT, ...target],
      moves: ["U", "R", "Uw", "Dw"],
      shown: goalSources(algorithm, target),
      draw: front,
      explanation: `Con la cruz blanca a la izquierda. ${describeWings(start, a, b)} ${words} Al terminar, la cruz y los centros están como estaban.`,
      source,
    };
  });
}

// Parities.

export const OLL_PARITY = "r2 B2 U2 l U2 r' U2 r U2 F2 r F2 l' B2 r2";
export const OLL_PARITY_OTHER = "Rw U2 x Rw U2 Rw U2 Rw' U2 Lw U2 Rw' U2 Rw U2 Rw' U2 Rw'";
export const PLL_PARITY = "r2 U2 r2 Uw2 r2 u2";

const parityCases = (): Case4[] => [
  {
    name: "Paridad de OLL",
    algorithm: OLL_PARITY,
    frame: HELD,
    start: caseColors4(OLL_PARITY),
    goal: STICKERS_4.map((_, i) => i),
    shown: new Set(STICKERS_4.map((_, i) => i)),
    draw: top,
    explanation:
      "Una sola arista de arriba está dada la vuelta: sus dos piezas tienen el amarillo hacia el lado. Eso no pasa nunca en un 3×3. Ponla delante y haz el algoritmo: solo le da la vuelta a esa arista. Si te salen tres aristas dadas la vuelta, también es paridad: arregla una y sigue con la OLL normal.",
    note: `Es la versión pura, con r y l (solo la segunda capa). Muchos usan ${OLL_PARITY_OTHER}: el motor de RUBIKO comprueba que voltea la misma arista, pero además cambia otras piezas de arriba (dos esquinas y dos aristas), así que después hay que volver a mirar la OLL.`,
    source: SOURCES_4X4.parity,
  },
  {
    name: "Paridad de PLL",
    algorithm: PLL_PARITY,
    frame: HELD,
    start: caseColors4(PLL_PARITY),
    goal: STICKERS_4.map((_, i) => i),
    shown: new Set(STICKERS_4.map((_, i) => i)),
    draw: top,
    explanation:
      "Con la cara de arriba orientada, dos aristas opuestas (la de delante y la de detrás) están cambiadas y no hay ninguna PLL del 3×3 que lo arregle. Ponlas delante y detrás y haz el algoritmo: las cambia sin tocar nada más. Si lo que ves no es exactamente esto (por ejemplo, también hay esquinas por colocar), haz el algoritmo igual con dos aristas opuestas delante y detrás y termina con la PLL normal.",
    note: "En RUBIKO r es solo la segunda capa, u también y Uw las dos de arriba. Muchas hojas escriben r2 U2 r2 Uw2 r2 Uw2: es lo mismo con la capa de arriba media vuelta girada al final, que se arregla con U2.",
    source: SOURCES_4X4.parity,
  },
];

// ---------- the sets ----------

export type Set4Id =
  | "r4-centros"
  | "r4-aristas"
  | "r4-paridades"
  | "fs4-centros"
  | "fs4-aristas"
  | "fs4-l4e"
  | "fs4-paridades"
  | "hoya-centros"
  | "hoya-cruz"
  | "hoya-centros4"
  | "hoya-aristas"
  | "hoya-paridades"
  | "yau-centros"
  | "yau-cruz3"
  | "yau-centros4"
  | "yau-cruz4"
  | "yau-aristas"
  | "yau-paridades";

const withSource = (cases: Case4[], source: ResearchSource) => cases.map((kase) => ({ ...kase, source }));

const REDUCTION_CENTERS = [FIRST_CENTER, SECOND_CENTER, ...lastCenters([], "")];
const OPPOSITE_CENTERS = [FIRST_CENTER, SECOND_CENTER];
const KEEP_CROSS = " ni la cruz de la izquierda";

const SETS_4X4_CASES: Record<Set4Id, Case4[]> = {
  "r4-centros": REDUCTION_CENTERS,
  "r4-aristas": [...reductionEdges(SOURCES_4X4.reduction), ...lastTwoCases(SOURCES_4X4.reduction)],
  "r4-paridades": parityCases(),
  "fs4-centros": withSource(REDUCTION_CENTERS, SOURCES_4X4.freeslice),
  "fs4-aristas": FREESLICE_EDGES,
  "fs4-l4e": lastTwoCases(SOURCES_4X4.freeslice),
  "fs4-paridades": parityCases(),
  "hoya-centros": withSource(OPPOSITE_CENTERS, SOURCES_4X4.hoya),
  "hoya-cruz": crossEdges(SOURCES_4X4.hoya),
  "hoya-centros4": withSource(lastCenters(CROSS_LEFT, KEEP_CROSS), SOURCES_4X4.hoya),
  "hoya-aristas": sideEdges(SOURCES_4X4.hoya),
  "hoya-paridades": parityCases(),
  "yau-centros": withSource(OPPOSITE_CENTERS, SOURCES_4X4.yau),
  "yau-cruz3": crossEdges(SOURCES_4X4.yau),
  "yau-centros4": withSource(lastCenters(CROSS_LEFT_3, " ni las tres aristas de la cruz"), SOURCES_4X4.yau),
  "yau-cruz4": lastCrossEdge,
  "yau-aristas": sideEdges(SOURCES_4X4.yau),
  "yau-paridades": parityCases(),
};

/** Each case as the tests check it. */
export const cases4x4 = (setId: Set4Id) => SETS_4X4_CASES[setId];

export const SETS_4X4 = Object.fromEntries(
  (Object.keys(SETS_4X4_CASES) as Set4Id[]).map((setId) => [
    setId,
    SETS_4X4_CASES[setId].map(
      (kase, index): AlgorithmCase => ({
        setId,
        id: id(index),
        number: index + 1,
        name: kase.name,
        algorithm: kase.algorithm,
        image: `/learning/${setId}/${setId}-${id(index)}.svg`,
        explanation: kase.explanation,
        ...(kase.note ? { note: kase.note } : {}),
        research: kase.source,
      }),
    ),
  ]),
) as Record<Set4Id, AlgorithmCase[]>;

/** Whether two wings of these colors are in the same edge (for the tests). */
export const wingsTogether = sameEdge;

/** The diagrams of these sets and of the 4×4 notation, by file (written to public/ by the test). */
export function generated4x4Diagrams(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const notation of NOTATION_MOVES_4X4) {
    const move = notation.move as BigMove;
    const inverse = `${move}'` as BigMove;
    const turning = new Set(STICKERS_4.map((_, i) => i).filter((i) => movePerm(move)[i] !== i));
    // The stickers of the turning layers: those that move, plus the center of a face that spins in place.
    const face = notation.move.replace(/w$/, "").toUpperCase() as Face4;
    const layers = new Set([...turning, ...(notation.move === notation.move.toUpperCase() || notation.move.endsWith("w") ? centerOf(face) : [])]);
    files[notation.image] = moveSvg4(
      [move, inverse].map((token) => ({ label: token, colors: apply4(HELD, [token]) })),
      layers,
      face,
      `${move} y ${inverse}`,
    );
  }
  for (const [setId, cases] of Object.entries(SETS_4X4_CASES)) {
    cases.forEach((kase, index) => {
      files[`/learning/${setId}/${setId}-${id(index)}.svg`] = kase.draw(kase.start, kase.shown, kase.name);
    });
  }
  return files;
}
