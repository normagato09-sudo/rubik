import type { CubeColor, CubeSize } from "@/features/cube/types";
import {
  colorCounts2,
  emptyFacelets2,
  faceOffset2,
  turnFace2,
  validateFacelets2,
  type Validation2,
} from "@/features/solver2x2/facelets";
import type { FaceName } from "../cubie";
import {
  CENTER_COLORS,
  CENTER_INDEX,
  COLOR_NAMES,
  colorCounts,
  emptyFacelets,
  faceOffset,
  turnFace,
  validateFacelets,
  type Facelets,
  type Validation,
} from "../facelets";
import { FACE_HINTS, FACE_HINTS_2X2 } from "./face-guide";

/**
 * What the solver screen needs to know about each cube it takes: how many
 * stickers, which are fixed, how they are checked and how to hold it. The
 * editor and the camera are written once against this.
 */
export type PuzzleId = "3x3" | "2x2";

export interface Puzzle {
  id: PuzzleId;
  label: string;
  size: CubeSize;
  /** Stickers per face (9 or 4), and of each color. */
  perFace: 4 | 9;
  total: number;
  empty: () => Facelets;
  validate: (facelets: Facelets) => Validation | Validation2;
  counts: (facelets: Facelets) => Record<CubeColor, number>;
  offset: (face: FaceName) => number;
  /** A center, which never changes (the 2×2 has none). */
  isFixed: (index: number) => boolean;
  turnFace: (facelets: Facelets, fix: { face: FaceName; turns: 1 | 2 | 3 }) => Facelets;
  hints: Record<FaceName, string>;
  /** "· centro blanco" after a face's name, or nothing. */
  faceDetail: (face: FaceName) => string;
}

const FACES: FaceName[] = ["U", "R", "F", "D", "L", "B"];

export const PUZZLES: Record<PuzzleId, Puzzle> = {
  "3x3": {
    id: "3x3",
    label: "3×3",
    size: 3,
    perFace: 9,
    total: 54,
    empty: emptyFacelets,
    validate: validateFacelets,
    counts: colorCounts,
    offset: faceOffset,
    isFixed: (index) => FACES.some((face) => CENTER_INDEX(face) === index),
    turnFace,
    hints: FACE_HINTS,
    faceDetail: (face) => `centro ${COLOR_NAMES[CENTER_COLORS[face]]}`,
  },
  "2x2": {
    id: "2x2",
    label: "2×2",
    size: 2,
    perFace: 4,
    total: 24,
    empty: emptyFacelets2,
    validate: validateFacelets2,
    counts: colorCounts2,
    offset: faceOffset2,
    isFixed: () => false,
    turnFace: turnFace2,
    hints: FACE_HINTS_2X2,
    faceDetail: () => "",
  },
};

export const PUZZLE_IDS: PuzzleId[] = ["3x3", "2x2"];

const STORAGE_KEY = "rubiko.solucionador.cubo";

/** The cube chosen last time on this device (3×3 if none, or storage is not available). */
export function loadPuzzle(): PuzzleId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "2x2" ? "2x2" : "3x3";
  } catch {
    return "3x3";
  }
}

/** Screens showing the choice, told when it changes (here or in another tab). */
const listeners = new Set<() => void>();
/** The choice made in this page, used when storage cannot keep it. */
let chosen: PuzzleId | null = null;

export function savePuzzle(id: PuzzleId) {
  chosen = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode or storage blocked: the choice lasts until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

/**
 * The chosen cube, for useSyncExternalStore: 3×3 while rendering on the
 * server and on the first paint, then the one saved on this device.
 */
export const puzzleStore = {
  subscribe(listener: () => void) {
    // Chosen in another tab: what is saved now wins.
    const fromStorage = () => {
      chosen = null;
      listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", fromStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", fromStorage);
    };
  },
  getSnapshot: (): PuzzleId => chosen ?? loadPuzzle(),
  getServerSnapshot: (): PuzzleId => "3x3",
};
