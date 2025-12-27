import { describe, expect, it } from "vitest";

import { JsonLunarProvider } from "@/providers/lunar/json";
import { YMD } from "@/types";

/**
 * JsonLunarProvider Test Suite
 *
 * This test suite demonstrates the JsonLunarProvider class behavior.
 * Note: This provider is currently a stub implementation in v1.0
 * and does not provide actual lunar conversion functionality.
 *
 * For working lunar conversion, use TableLunarProvider instead.
 *
 * Usage Example:
 * ```typescript
 * const provider = new JsonLunarProvider("KR");
 * const lunar = await provider.getLunar("2025-01-29");
 * // Currently returns null (not implemented)
 * ```
 */
describe("JsonLunarProvider", () => {
  describe("Basic Provider Setup", () => {
    it("Example: Create provider for a country", () => {
      const provider = new JsonLunarProvider("KR");

      expect(provider).toBeDefined();
      expect(provider.meta.name).toBe("JsonLunarProvider");
      expect(provider.meta.countries).toEqual(["KR"]);
      expect(provider.meta.requiresNetwork).toBe(false);
    });

    it("Example: Create provider for different countries", () => {
      const krProvider = new JsonLunarProvider("KR");
      const cnProvider = new JsonLunarProvider("CN");

      expect(krProvider.meta.countries).toEqual(["KR"]);
      expect(cnProvider.meta.countries).toEqual(["CN"]);
    });
  });

  describe("Provider Metadata", () => {
    it("should expose provider metadata", () => {
      const provider = new JsonLunarProvider("KR");

      const { name, countries, requiresNetwork } = provider.meta;

      expect(name).toBe("JsonLunarProvider");
      expect(countries).toContain("KR");
      expect(requiresNetwork).toBe(false);
    });
  });

  describe("getLunar() - Current Behavior", () => {
    it("Example: getLunar returns null (not yet implemented)", async () => {
      const provider = new JsonLunarProvider("KR");

      // Currently returns null because data loading is not implemented
      const result = await provider.getLunar("2025-01-29");

      expect(result).toBeNull();
    });

    it("should handle cache correctly", async () => {
      const provider = new JsonLunarProvider("KR");

      // First call
      const result1 = await provider.getLunar("2025-01-29");
      expect(result1).toBeNull();

      // Second call should use cache
      const result2 = await provider.getLunar("2025-01-29");
      expect(result2).toBeNull();
    });

    it("should handle multiple different dates", async () => {
      const provider = new JsonLunarProvider("KR");

      const dates: YMD[] = ["2025-01-29", "2025-02-10", "2025-03-15"];

      for (const date of dates) {
        const result = await provider.getLunar(date);
        expect(result).toBeNull();
      }
    });
  });

  describe("toSolar() - Current Behavior", () => {
    it("Example: toSolar returns null with warning (not implemented)", async () => {
      const provider = new JsonLunarProvider("KR");

      // toSolar is not implemented and returns null
      const result = await provider.toSolar({
        year: 2025,
        month: 1,
        day: 1,
        isLeapMonth: false,
      });

      expect(result).toBeNull();
    });

    it("should handle leap month input", async () => {
      const provider = new JsonLunarProvider("KR");

      const result = await provider.toSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: true,
      });

      expect(result).toBeNull();
    });
  });
});
