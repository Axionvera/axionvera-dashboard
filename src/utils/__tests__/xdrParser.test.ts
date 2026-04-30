import { scvI128ToString, extractSimulationError } from "../xdrParser";

describe("xdrParser", () => {
  describe("scvI128ToString", () => {
    it("decodes a valid scvI128 base64 XDR to its decimal string", () => {
      // scvI128 = 12345
      expect(scvI128ToString("AAAACgAAAAAAAAAAAAAAAAAAMDk=")).toBe("12345");
    });

    it("decodes zero correctly", () => {
      // scvI128 = 0
      expect(scvI128ToString("AAAACgAAAAAAAAAAAAAAAAAAAAA=")).toBe("0");
    });

    it("returns null for a non-i128 ScVal type", () => {
      // scvBool = true
      expect(scvI128ToString("AAAAAAAAAAE=")).toBeNull();
    });

    it("returns null for invalid base64 input", () => {
      expect(scvI128ToString("not-valid-xdr!!!")).toBeNull();
    });

    it("returns null for an empty string", () => {
      expect(scvI128ToString("")).toBeNull();
    });
  });

  describe("extractSimulationError", () => {
    it("returns the error string when present", () => {
      expect(extractSimulationError({ error: "Contract trapped: Revert" })).toBe(
        "Contract trapped: Revert"
      );
    });

    it("returns null when error field is absent", () => {
      expect(extractSimulationError({})).toBeNull();
    });

    it("returns null when error field is an empty string", () => {
      expect(extractSimulationError({ error: "" })).toBeNull();
    });
  });
});
