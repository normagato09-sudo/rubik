import { describe, expect, it } from "vitest";
import {
  applyPyraTokens,
  invertPyraTokens,
  parsePyraNotation,
  solvedPyraminx,
  type PyraColor,
  type PyraToken,
} from "./moves";
import { CENTER_STICKERS, EDGE_FACES, EDGE_STICKERS, TIP_STICKERS } from "./pieces";
import { KEYHOLE_CENTER_CASES, KEYHOLE_EDGE_CASES, L3E_CASES, type ResearchCase } from "./research";
import { solvePyraminx } from "./search";

const solved = solvedPyraminx();
const edge = (name: string) => EDGE_FACES.findIndex((faces) => faces.join("") === name);
const [FL, FR, FD, LR, LD, RD] = ["FL", "FR", "FD", "LR", "LD", "RD"].map(edge);
const tips = Object.values(TIP_STICKERS).flat();
const centers = Object.values(CENTER_STICKERS).flat();
const edges = (...pieces: number[]) => pieces.flatMap((piece) => EDGE_STICKERS[piece]);
/** The back tip's block: its center and its three edges (Top First). */
const backBlock = [...CENTER_STICKERS.B, ...edges(LR, LD, RD)];

const done = (state: readonly PyraColor[], stickers: readonly number[]) => stickers.every((i) => state[i] === solved[i]);
const caseOf = (kase: ResearchCase) => applyPyraTokens(solved, invertPyraTokens(parsePyraNotation(kase.algorithm)));

/** Where edge `piece` is, and whether it is the wrong way round. */
function locate(state: readonly PyraColor[], piece: number): string {
  const [a, b] = EDGE_STICKERS[piece].map((i) => solved[i]);
  const slot = EDGE_STICKERS.findIndex(([x, y]) => new Set([state[x], state[y]]).has(a) && new Set([state[x], state[y]]).has(b));
  return `${slot}${state[EDGE_STICKERS[slot][0]] === a ? "" : "'"}`;
}

/** The state as seen after turning the whole Pyraminx with [B], colors renamed back: the same case. */
const turnedRound = (() => {
  const turned = applyPyraTokens(solved, ["[B]"]);
  const rename = new Map(turned.map((color, i) => [color, solved[i]]));
  return (state: readonly PyraColor[]) => applyPyraTokens(state, ["[B]"]).map((color) => rename.get(color)!);
})();
const caseKey = (state: readonly PyraColor[]) => {
  const views = [state, turnedRound(state), turnedRound(turnedRound(state))];
  return views.map((view) => view.join()).sort()[0];
};

describe("L3E (the front face's three edges)", () => {
  it("each algorithm's case has everything else done: tips, centers and the back block", () => {
    for (const kase of L3E_CASES) {
      const state = caseOf(kase);
      expect(done(state, [...tips, ...centers, ...backBlock]), kase.name).toBe(true);
      expect(done(state, edges(FL, FR, FD)), kase.name).toBe(false);
    }
  });

  it("there are 6 cases, counted with the engine (one is solved), and the 5 algorithms are the other 5", () => {
    // Every way to put the 3 front edges back: 3 places each, either way round.
    const front = [FL, FR, FD];
    const states: PyraColor[][] = [];
    const orders = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const order of orders) {
      for (let flips = 0; flips < 8; flips++) {
        const state = [...solved];
        front.forEach((slot, k) => {
          const colors = EDGE_STICKERS[front[order[k]]].map((i) => solved[i]);
          if (flips & (1 << k)) colors.reverse();
          EDGE_STICKERS[slot].forEach((i, j) => (state[i] = colors[j]));
        });
        // Only the real ones: the engine finds a solution (or says it is impossible).
        try {
          solvePyraminx(state);
          states.push(state);
        } catch {
          // Odd swaps or a single flipped edge cannot happen.
        }
      }
    }
    expect(states).toHaveLength(12);
    const keys = new Set(states.map(caseKey));
    expect(keys.size).toBe(6);
    const ours = L3E_CASES.map((kase) => caseKey(caseOf(kase)));
    expect(new Set(ours).size).toBe(5);
    expect(ours).not.toContain(caseKey(solved));
    for (const key of ours) expect(keys.has(key)).toBe(true);
  });
});

describe("Keyhole: the last edge of the back block", () => {
  it("each case has the tips, the centers and the two bottom edges of the block done, and not the red-blue edge", () => {
    for (const kase of KEYHOLE_EDGE_CASES) {
      const state = caseOf(kase);
      expect(done(state, [...tips, ...centers, ...edges(LD, RD)]), kase.algorithm).toBe(true);
      expect(done(state, edges(LR)), kase.algorithm).toBe(false);
    }
  });

  it("covers the 7 wrong places of that edge (4 places, either way round, less the solved one)", () => {
    const places = KEYHOLE_EDGE_CASES.map((kase) => locate(caseOf(kase), LR));
    expect(new Set(places).size).toBe(7);
    expect(places).not.toContain(`${LR}`);
    for (const place of places) expect([FL, FR, FD, LR].map(String)).toContain(place.replace("'", ""));
  });
});

describe("Keyhole: the centers", () => {
  const watched = [...centers, ...CENTER_STICKERS.B, ...edges(LD, RD)];
  const key = (state: readonly PyraColor[]) => watched.map((i) => state[i]).join();
  const MOVES: PyraToken[] = ["U", "U'", "Fw", "Fw'"];

  /** Shortest number of U and Fw turns from each position of the centers to solved. */
  const distance = (() => {
    const seen = new Map([[key(solved), 0]]);
    let frontier = [solved];
    for (let depth = 1; frontier.length; depth++) {
      const next: PyraColor[][] = [];
      for (const state of frontier) {
        for (const move of MOVES) {
          const moved = applyPyraTokens(state, [move]);
          if (!seen.has(key(moved))) {
            seen.set(key(moved), depth);
            next.push(moved);
          }
        }
      }
      frontier = next;
    }
    return seen;
  })();

  it("U and Fw never touch the block's center and bottom edges; the engine counts 81 positions, 26 cases if U is left for last", () => {
    expect(distance.size).toBe(81);
    // Leaving the top center for last: positions that differ only by a turn of U are one case.
    const upToU = new Set(
      [...distance.keys()].map((k) => {
        const state = [...solved];
        k.split(",").forEach((color, j) => (state[watched[j]] = color as PyraColor));
        return [state, applyPyraTokens(state, ["U"]), applyPyraTokens(state, ["U'"])].map(key).sort()[0];
      }),
    );
    expect(upToU.size - 1).toBe(26);
  });

  it("each basic case has the block done, and its algorithm is the shortest with U and Fw", () => {
    for (const kase of KEYHOLE_CENTER_CASES) {
      const state = caseOf(kase);
      expect(done(state, [...TIP_STICKERS.B, ...CENTER_STICKERS.B, ...edges(LD, RD)]), kase.algorithm).toBe(true);
      expect(done(state, centers), kase.algorithm).toBe(false);
      expect(distance.get(key(state)), kase.algorithm).toBe(parsePyraNotation(kase.algorithm).length);
    }
    expect(new Set(KEYHOLE_CENTER_CASES.map((kase) => key(caseOf(kase)))).size).toBe(KEYHOLE_CENTER_CASES.length);
  });
});

describe("research sources", () => {
  it("every algorithm says where it comes from", () => {
    for (const kase of [...L3E_CASES, ...KEYHOLE_EDGE_CASES, ...KEYHOLE_CENTER_CASES]) {
      expect(kase.source.url).toMatch(/^https:\/\//);
      expect(kase.source.name.length).toBeGreaterThan(5);
    }
  });

  it("where RUBIKO spaces an algorithm differently from its source, the moves are the same", () => {
    for (const kase of KEYHOLE_EDGE_CASES.filter((k) => k.sourceText)) {
      const spaced = kase.sourceText!.replace(/([ULRB]'?)/g, " $1 ");
      expect(parsePyraNotation(spaced)).toEqual(parsePyraNotation(kase.algorithm));
    }
  });
});
