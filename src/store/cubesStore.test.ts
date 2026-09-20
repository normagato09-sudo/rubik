import { beforeEach, describe, expect, it } from "vitest";
import { useCubesStore } from "./cubesStore";

const INITIAL = useCubesStore.getState();

beforeEach(() => {
  useCubesStore.setState(INITIAL, true);
});

describe("cubesStore", () => {
  it("starts with one default cube, active", () => {
    const { cubes, activeCubeId } = useCubesStore.getState();
    expect(cubes).toHaveLength(1);
    expect(activeCubeId).toBe(cubes[0].id);
  });

  it("addCube appends a new cube without changing the active one", () => {
    const before = useCubesStore.getState().activeCubeId;
    useCubesStore.getState().addCube({ type: "3x3", name: "Segundo cubo" });

    const { cubes, activeCubeId } = useCubesStore.getState();
    expect(cubes).toHaveLength(2);
    expect(cubes[1].name).toBe("Segundo cubo");
    expect(activeCubeId).toBe(before);
  });

  it("setActiveCube switches to an existing cube", () => {
    useCubesStore.getState().addCube({ type: "3x3", name: "Segundo cubo" });
    const second = useCubesStore.getState().cubes[1];

    useCubesStore.getState().setActiveCube(second.id);

    expect(useCubesStore.getState().activeCubeId).toBe(second.id);
  });

  it("setActiveCube is a no-op for an unknown id", () => {
    const before = useCubesStore.getState().activeCubeId;
    useCubesStore.getState().setActiveCube("does-not-exist");
    expect(useCubesStore.getState().activeCubeId).toBe(before);
  });
});
