import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CUBE_ID } from "./cubes";
import { DEFAULT_METHOD_ID } from "./methods";
import { useTrainerPreferences } from "./store";

beforeEach(() => {
  useTrainerPreferences.setState({ cubeId: DEFAULT_CUBE_ID, methodId: DEFAULT_METHOD_ID });
});

describe("useTrainerPreferences", () => {
  it("starts with the default active cube and method", () => {
    const state = useTrainerPreferences.getState();
    expect(state.cubeId).toBe("3x3");
    expect(state.methodId).toBe("cfop");
  });

  it("setCube is a no-op for a cube that is not active yet", () => {
    useTrainerPreferences.getState().setCube("2x2");
    expect(useTrainerPreferences.getState().cubeId).toBe("3x3");
  });

  it("setMethod is a no-op for a method that is not active yet", () => {
    useTrainerPreferences.getState().setMethod("roux");
    expect(useTrainerPreferences.getState().methodId).toBe("cfop");
  });

  it("setMethod is a no-op for a method that does not belong to the current cube", () => {
    // No other cube type has methods defined today, so this simulates a
    // method id from a different cube type ever leaking in.
    useTrainerPreferences.getState().setMethod("does-not-exist-for-3x3");
    expect(useTrainerPreferences.getState().methodId).toBe("cfop");
  });
});
