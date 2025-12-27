import { describe, expect, it } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarProvider } from "@/providers/lunar/table";

describe("Lunar offline tests (always run)", () => {
  const provider = new TableLunarProvider("KR", lunarData.rows);

  describe("2025 Lunar New Year", () => {
    it("should convert 2025-01-29 to lunar 2025-01-01", async () => {
      const result = await provider.getLunar("2025-01-29");

      expect(result).not.toBeNull();
      expect(result?.year).toBe(2025);
      expect(result?.month).toBe(1);
      expect(result?.day).toBe(1);
      expect(result?.isLeapMonth).toBe(false);
    });
  });

  describe("2026 Lunar New Year", () => {
    it("should convert 2026-02-17 to lunar 2026-01-01", async () => {
      const result = await provider.getLunar("2026-02-17");

      expect(result).not.toBeNull();
      expect(result?.year).toBe(2026);
      expect(result?.month).toBe(1);
      expect(result?.day).toBe(1);
      expect(result?.isLeapMonth).toBe(false);
    });
  });

  describe("2025 Leap Month 6", () => {
    it("should have leap=6 in data", () => {
      const row2025 = lunarData.rows.find((r) => r.y === 2025);
      expect(row2025).toBeDefined();
      expect(row2025?.leap).toBe(6);
    });
  });
});
