import { describe, expect, it } from "vitest";
import {
  ALL_PYRA_TOKENS,
  ROTATIONS,
  TOKEN_PERMUTATION,
  applyPyraTokens,
  invertPyraTokens,
  parsePyraNotation,
  solvedPyraminx,
  type PyraColor,
  type PyraToken,
} from "./moves";
import type { PyraVertex } from "./geometry";
import { CENTER_STICKERS, EDGE_FACES, EDGE_STICKERS, TIP_STICKERS } from "./pieces";
import {
  KEYHOLE_CENTER_CASES,
  KEYHOLE_EDGE_CASES,
  L3E_CASES,
  NUTELLA_EDGE_CASES,
  NUTELLA_EDGE_GOAL,
  NUTELLA_L3C_CASES,
  OKA_EDGE_CASES,
  OKA_EDGE_GOAL,
  OKA_FINISH_CASES,
  ONE_FLIP_L3C_CASES,
  THIRD_EDGE_CASES,
  WO_L3C_CASES,
  heldWithBlockBehind,
  seenWithBlockHome,
  turnedRoundBack,
  type ResearchCase,
} from "./research";
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
/** The case an algorithm solves, with the final turn of the block it needs. */
const caseOf = (kase: ResearchCase) =>
  applyPyraTokens(solved, invertPyraTokens([...parsePyraNotation(kase.algorithm), ...(kase.adjust ? [kase.adjust] : [])]));

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

// ---------- 1-Flip and WO ----------

/** Edge `piece` the wrong way round in its own place. */
const flipped = (state: readonly PyraColor[], piece: number) => {
  const next = [...state];
  const [a, b] = EDGE_STICKERS[piece];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
};

/** Tip and center of `vertex` twisted `times` thirds, as a big turn would, leaving everything else. */
const twisted = (state: readonly PyraColor[], vertex: PyraVertex, times: number) => {
  let current = [...state];
  const own = [...TIP_STICKERS[vertex], ...CENTER_STICKERS[vertex]];
  for (let k = 0; k < times; k++) {
    const next = [...current];
    for (const i of own) next[TOKEN_PERMUTATION[vertex][i]] = current[i];
    current = next;
  }
  return current;
};

/** Fewest turns of U, L, R and B from each position (by `key`) to one of `goals`. */
function bfsDistance(goals: PyraColor[][], key: (state: readonly PyraColor[]) => string): Map<string, number> {
  const MOVES: PyraToken[] = ["U", "U'", "L", "L'", "R", "R'", "B", "B'"];
  const seen = new Map(goals.map((goal) => [key(goal), 0]));
  let frontier = goals;
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
}

describe("Sarah's algorithms, held with the block at the back", () => {
  it("tipping the Pyraminx over is a whole turn of it: each move, tip, face turn and whole turn becomes the swapped one", () => {
    const stickers = Array.from({ length: 36 }, (_, i) => i);
    const moves = ALL_PYRA_TOKENS;
    const turns = ROTATIONS.flatMap((a) => ROTATIONS.map((b) => [a, b] as PyraToken[]));
    const halfTurn = turns.find((turn) =>
      moves.every(
        (move) =>
          applyPyraTokens(stickers, [...turn, ...parsePyraNotation(heldWithBlockBehind(move)), ...invertPyraTokens(turn)]).join() ===
          applyPyraTokens(stickers, [move]).join(),
      ),
    );
    expect(halfTurn).toBeDefined();
    expect(heldWithBlockBehind("R' L R' Dw' R' U' R'")).toBe("L' R L' Fw' L' B' L'");
  });
});

describe("WO and 1-Flip: the last three centers (L3C)", () => {
  const blockEdges = [LR, LD, RD];
  const watched = [...tips, ...centers, ...edges(...blockEdges)];
  const key = (state: readonly PyraColor[]) => watched.map((i) => state[i]).join();
  const blockHome = (state: readonly PyraColor[]) =>
    done(state, [...TIP_STICKERS.B, ...CENTER_STICKERS.B]) &&
    blockEdges.every((piece) => locate(state, piece).replace("'", "") === `${piece}`);
  /** Each front center shows its own colors (only twisted), as on a real Pyraminx seen with the block home. */
  const ownCenters = (state: readonly PyraColor[]) =>
    (["U", "L", "R"] as const).every((v) =>
      CENTER_STICKERS[v].every((i) => CENTER_STICKERS[v].some((j) => solved[j] === state[i])),
    );
  const flips = (state: readonly PyraColor[]) => blockEdges.filter((piece) => locate(state, piece).endsWith("'")).length;

  /**
   * A case, whatever side it is seen from: the block home (turning it, B, or
   * the rest, Fw, is the same as looking from another side), then the
   * smallest of the three views round the back tip.
   */
  function l3cCase(state: readonly PyraColor[]): string {
    for (const block of [[], ["B"], ["B'"]] as PyraToken[][]) {
      for (const rest of [[], ["Fw"], ["Fw'"]] as PyraToken[][]) {
        const seen = seenWithBlockHome(applyPyraTokens(state, [...block, ...rest]));
        if (blockHome(seen) && ownCenters(seen)) {
          return [seen, turnedRound(seen), turnedRound(turnedRound(seen))].map(key).sort()[0];
        }
      }
    }
    throw new Error("not an L3C position");
  }

  /** Every position of the step: the front centers twisted any way and, in 1-Flip, one block edge flipped. */
  const positions = (oneFlip: boolean) => {
    const states: PyraColor[][] = [];
    for (let u = 0; u < 3; u++)
      for (let l = 0; l < 3; l++)
        for (let r = 0; r < 3; r++) {
          const state = twisted(twisted(twisted(solved, "U", u), "L", l), "R", r);
          if (oneFlip) for (const piece of blockEdges) states.push(flipped(state, piece));
          else states.push(state);
        }
    return states;
  };

  it("each WO case has the block whole", () => {
    for (const kase of WO_L3C_CASES) {
      const state = seenWithBlockHome(caseOf(kase));
      expect(blockHome(state) && flips(state) === 0, kase.algorithm).toBe(true);
      expect(done(state, centers), kase.algorithm).toBe(false);
    }
  });

  it("with its final turn of the block, each case has the front centers only twisted (each in its own place); without it, not", () => {
    for (const kase of [...WO_L3C_CASES, ...ONE_FLIP_L3C_CASES]) {
      expect(ownCenters(seenWithBlockHome(caseOf(kase))), kase.algorithm).toBe(true);
      if (kase.adjust) expect(ownCenters(seenWithBlockHome(caseOf({ ...kase, adjust: undefined }))), kase.algorithm).toBe(false);
    }
  });

  it("WO: 27 positions, 11 cases seen from any side (one is the skip); Sarah's 10 algorithms are the other 10", () => {
    const states = positions(false);
    expect(states).toHaveLength(27);
    const cases = new Set(states.map(l3cCase));
    expect(cases.size).toBe(11);
    const ours = WO_L3C_CASES.map((kase) => l3cCase(caseOf(kase)));
    expect(new Set(ours).size).toBe(10);
    expect(ours).not.toContain(l3cCase(solved));
    for (const c of ours) expect(cases.has(c)).toBe(true);
  });

  it("each 1-Flip case has the block with exactly one edge the wrong way round", () => {
    for (const kase of ONE_FLIP_L3C_CASES) {
      const state = seenWithBlockHome(caseOf(kase));
      expect(blockHome(state) && flips(state) === 1, kase.algorithm).toBe(true);
    }
  });

  it("1-Flip: 81 positions, 27 cases; Sarah's 10 plus GLHF (the centers already done) are 11 of them", () => {
    const states = positions(true);
    expect(states).toHaveLength(81);
    const cases = new Set(states.map(l3cCase));
    expect(cases.size).toBe(27);
    const ours = ONE_FLIP_L3C_CASES.map((kase) => l3cCase(caseOf(kase)));
    expect(new Set(ours).size).toBe(11);
    for (const c of ours) expect(cases.has(c)).toBe(true);
  });

  it("GLHF is the case with the centers done and the top back edge flipped, and its algorithm is the shortest with U, L, R and B", () => {
    const glhf = ONE_FLIP_L3C_CASES.find((kase) => kase.name === "GLHF")!;
    const state = seenWithBlockHome(caseOf(glhf));
    expect(done(state, [...tips, ...centers, ...edges(LD, RD)])).toBe(true);
    expect(locate(state, LR)).toBe(`${LR}'`);
    const k = (s: readonly PyraColor[]) => [centers.map((i) => s[i]).join(), ...blockEdges.map((p) => locate(s, p))].join("|");
    expect(bfsDistance([solved], k).get(k(state))).toBe(parsePyraNotation(glhf.algorithm).length);
    // A full search over the centers and the block: a few seconds.
  }, 60_000);
});

describe("WO and 1-Flip: the block's third edge", () => {
  // The back center and the block's edges; the front centers are free here.
  const key = (state: readonly PyraColor[]) =>
    [CENTER_STICKERS.B.map((i) => state[i]).join(), ...[LR, LD, RD].map((p) => locate(state, p))].join("|");

  for (const [method, goal] of [
    ["WO", solved],
    ["1-Flip", flipped(solved, LR)],
  ] as const) {
    it(`${method}: covers the 7 places, keeps the back center and the two bottom edges, and each is the shortest`, () => {
      const distance = bfsDistance([goal], key);
      const states = THIRD_EDGE_CASES.map((kase) => applyPyraTokens(goal, invertPyraTokens(parsePyraNotation(kase.algorithm))));
      const places = states.map((state) => locate(state, LR));
      expect(new Set(places).size).toBe(7);
      expect(places).not.toContain(locate(goal, LR));
      states.forEach((state, k) => {
        const { algorithm } = THIRD_EDGE_CASES[k];
        expect(done(state, [...CENTER_STICKERS.B, ...edges(LD, RD)]), algorithm).toBe(true);
        expect(distance.get(key(state)), algorithm).toBe(parsePyraNotation(algorithm).length);
      });
    });
  }
});

// ---------- Oka and Nutella ----------

const blockKey = (state: readonly PyraColor[]) => [CENTER_STICKERS.B.map((i) => state[i]).join(), ...[LR, LD, RD].map((p) => locate(state, p))].join("|");
const centersAndBlock = (state: readonly PyraColor[]) => [centers.map((i) => state[i]).join(), ...[LR, LD, RD].map((p) => locate(state, p))].join("|");

describe("turning the Pyraminx round the back tip", () => {
  it("is a whole turn of it ([B]): each move, tip, face turn and whole turn becomes the swapped one", () => {
    const stickers = Array.from({ length: 36 }, (_, i) => i);
    const turn = ROTATIONS.find((r) =>
      ALL_PYRA_TOKENS.every(
        (token) =>
          applyPyraTokens(stickers, [r, token, ...invertPyraTokens([r])]).join() ===
          applyPyraTokens(stickers, parsePyraNotation(turnedRoundBack(token, 1))).join(),
      ),
    );
    expect(turn).toBe("[B]");
    expect(turnedRoundBack("U' L' U B L B'", 3)).toBe("U' L' U B L B'");
  });
});

describe("Oka: the Oka edge", () => {
  // Blue-yellow solved; the red-blue edge bottom left, blue on the left face.
  const goal = OKA_EDGE_GOAL;

  it("goal: the red-blue edge in the bottom-left slot with blue on the left face", () => {
    expect(locate(goal, LR)).toBe(`${LD}'`);
    expect(goal[EDGE_STICKERS[LD][0]]).toBe("blue");
  });

  it("covers the 9 places, keeps the back center and the blue-yellow edge, and each is the shortest", () => {
    const distance = bfsDistance([goal], (s) => [CENTER_STICKERS.B.map((i) => s[i]).join(), locate(s, LR), locate(s, RD)].join("|"));
    const states = OKA_EDGE_CASES.map((kase) => applyPyraTokens(goal, invertPyraTokens(parsePyraNotation(kase.algorithm))));
    const places = states.map((state) => locate(state, LR));
    expect(new Set(places).size).toBe(9);
    expect(places).not.toContain(`${LD}'`);
    expect(places).not.toContain(`${RD}`);
    states.forEach((state, k) => {
      const { algorithm } = OKA_EDGE_CASES[k];
      expect(done(state, [...CENTER_STICKERS.B, ...edges(RD)]), algorithm).toBe(true);
      expect(distance.get([CENTER_STICKERS.B.map((i) => state[i]).join(), locate(state, LR), locate(state, RD)].join("|"))).toBe(
        parsePyraNotation(algorithm).length,
      );
    });
  });
});

describe("Oka: the Oka edge and the free slot", () => {
  const places = [LR, FL, FR, FD].flatMap((slot) => [`${slot}`, `${slot}'`]);
  const home = centers.map((i) => solved[i]).join();
  // Bottom left: the Oka edge flipped there, blue-yellow solved. Bottom right: the mirror.
  const expected = new Set([
    ...places.map((p) => [home, `${LD}'`, p, `${RD}`].join("|")),
    ...places.map((p) => [home, `${RD}`, `${LD}`, p].join("|")),
  ]);

  it("the engine counts 16 places for the third edge, and the 16 cases are exactly those", () => {
    expect(expected.size).toBe(16);
    const ours = OKA_FINISH_CASES.map((kase) => centersAndBlock(seenWithBlockHome(caseOf(kase))));
    expect(new Set(ours)).toEqual(expected);
    expect(ours).toHaveLength(16);
  });

  it("Drew Brads' cases are 7 of them (one algorithm for both sides); the engine's are the shortest with U, L, R and B", () => {
    const distance = bfsDistance([solved], centersAndBlock);
    expect(OKA_FINISH_CASES.filter((kase) => !kase.computed)).toHaveLength(7);
    for (const kase of OKA_FINISH_CASES.filter((k) => k.computed)) {
      expect(distance.get(centersAndBlock(caseOf(kase))), kase.algorithm).toBe(parsePyraNotation(kase.algorithm).length);
      expect(kase.adjust).toBeUndefined();
    }
  }, 60_000);
});

describe("Nutella", () => {
  // Red-blue solved; the other two block edges in each other's slot.
  const swapped = NUTELLA_EDGE_GOAL;

  it("the swapped block: red-blue home, red-yellow bottom right and blue-yellow bottom left", () => {
    expect([LR, LD, RD].map((p) => locate(swapped, p))).toEqual([`${LR}`, `${RD}`, `${LD}`]);
  });

  it("the second edge covers its 7 places, keeps the rest of the block, and each is the shortest", () => {
    const distance = bfsDistance([swapped], blockKey);
    const states = NUTELLA_EDGE_CASES.map((kase) => applyPyraTokens(swapped, invertPyraTokens(parsePyraNotation(kase.algorithm))));
    const places = states.map((state) => locate(state, LD));
    expect(new Set(places).size).toBe(7);
    expect(places).not.toContain(`${RD}`);
    states.forEach((state, k) => {
      const { algorithm } = NUTELLA_EDGE_CASES[k];
      expect([locate(state, LR), locate(state, RD)], algorithm).toEqual([`${LR}`, `${LD}`]);
      expect(distance.get(blockKey(state)), algorithm).toBe(parsePyraNotation(algorithm).length);
    });
  });

  it("each L3C case has that block and the front centers only twisted; 27 positions, all different cases, the sheet's 8 among them", () => {
    const watched = [...tips, ...centers, ...edges(LR, LD, RD)];
    const key = (state: readonly PyraColor[]) => watched.map((i) => state[i]).join();
    const positions = new Set<string>();
    for (let u = 0; u < 3; u++)
      for (let l = 0; l < 3; l++)
        for (let r = 0; r < 3; r++) positions.add(key(twisted(twisted(twisted(swapped, "U", u), "L", l), "R", r)));
    expect(positions.size).toBe(27);
    const ours = NUTELLA_L3C_CASES.map((kase) => seenWithBlockHome(caseOf(kase)));
    for (const [k, state] of ours.entries()) {
      const { algorithm } = NUTELLA_L3C_CASES[k];
      expect([LR, LD, RD].map((p) => locate(state, p)), algorithm).toEqual([`${LR}`, `${RD}`, `${LD}`]);
      expect(positions.has(key(state)), algorithm).toBe(true);
      expect(done(state, centers), algorithm).toBe(false);
    }
    expect(new Set(ours.map(key)).size).toBe(8);
  });
});
