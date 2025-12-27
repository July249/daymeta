import { describe, expect, it } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

/**
 * Korean Holiday Mappers Test Suite
 *
 * This test suite demonstrates how to use the mapper functions that convert
 * KASI (Korea Astronomy and Space Science Institute) API responses to
 * internal holiday and special day data structures.
 *
 * Key Features:
 * - Map KASI API responses to HolidayItem or SpecialItem
 * - Handle different types: holidays, solar terms, sundry days, lunar festivals
 * - Split responses into holidays and special days
 *
 * Usage Example:
 * ```typescript
 * import { mapKasiSpecialDay, splitHolidaysAndSpecials } from "@/kr/mappers";
 *
 * // Map a single KASI response
 * const kasiResponse = {
 *   locdate: "20240101",
 *   dateName: "신정",
 *   dateKind: "01",
 *   isHoliday: "Y"
 * };
 * const holiday = mapKasiSpecialDay(kasiResponse);
 * // Returns: { date: "2024-01-01", name: "신정", kind: "STATUTORY" }
 *
 * // Split multiple responses
 * const { holidays, specials } = splitHolidaysAndSpecials(responses);
 * ```
 */

describe("TableLunarAlgorithm", () => {
  const algorithm = new TableLunarAlgorithm(lunarData.rows);

  describe("constructor and basic properties", () => {
    it("should initialize with correct year range", () => {
      const [minYear, maxYear] = algorithm.getYearRange();
      expect(minYear).toBe(1900);
      expect(maxYear).toBe(2050);
    });

    it("should support years within range", () => {
      expect(algorithm.supports(1900)).toBe(true);
      expect(algorithm.supports(2025)).toBe(true);
      expect(algorithm.supports(2050)).toBe(true);
    });

    it("should not support years outside range", () => {
      expect(algorithm.supports(1899)).toBe(false);
      expect(algorithm.supports(2051)).toBe(false);
    });
  });

  describe("solarToLunar error cases", () => {
    it("should throw error for year below range", () => {
      expect(() => algorithm.solarToLunar("1899-12-31")).toThrow(
        /Solar year 1899 out of range/,
      );
    });

    it("should throw error for year above range", () => {
      expect(() => algorithm.solarToLunar("2051-01-01")).toThrow(
        /Solar year 2051 out of range/,
      );
    });

    it("should throw error when missing previous year data", () => {
      // Create algorithm with only 1901 data (missing 1900)
      const limitedAlgorithm = new TableLunarAlgorithm(
        lunarData.rows.filter((r) => r.y >= 1901),
      );

      // Try to convert a date in early 1901 that would need 1900 data
      expect(() => limitedAlgorithm.solarToLunar("1901-01-01")).toThrow(
        /Cannot determine lunar year: missing data for 1900/,
      );
    });
  });

  describe("lunarToSolar error cases", () => {
    it("should throw error for year below range", () => {
      expect(() =>
        algorithm.lunarToSolar({
          year: 1899,
          month: 1,
          day: 1,
          isLeapMonth: false,
        }),
      ).toThrow(/Lunar year 1899 out of range/);
    });

    it("should throw error for year above range", () => {
      expect(() =>
        algorithm.lunarToSolar({
          year: 2051,
          month: 1,
          day: 1,
          isLeapMonth: false,
        }),
      ).toThrow(/Lunar year 2051 out of range/);
    });

    it("should throw error for leap month when year has no leap month", () => {
      // 2024 has no leap month (leap=0)
      expect(() =>
        algorithm.lunarToSolar({
          year: 2024,
          month: 6,
          day: 1,
          isLeapMonth: true,
        }),
      ).toThrow(/has no leap month, but isLeapMonth=true/);
    });

    it("should throw error for invalid leap month", () => {
      // 2025 has leap month at position 6
      expect(() =>
        algorithm.lunarToSolar({
          year: 2025,
          month: 5, // Wrong month (should be 6)
          day: 1,
          isLeapMonth: true,
        }),
      ).toThrow(/leap month is 6, but got month=5 with isLeapMonth=true/);
    });
  });

  describe("solarToLunar boundary cases", () => {
    it("should handle first day of year range", () => {
      const result = algorithm.solarToLunar("1900-01-31");
      expect(result).toBeDefined();
      expect(result.year).toBe(1900);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it("should handle last day of year range", () => {
      const result = algorithm.solarToLunar("2050-12-31");
      expect(result).toBeDefined();
    });

    it("should handle year boundary - end of lunar year", () => {
      // Last day before 2025 lunar new year
      const result = algorithm.solarToLunar("2025-01-28");
      expect(result.year).toBe(2024);
    });

    it("should handle year boundary - start of lunar year", () => {
      // First day of 2025 lunar new year
      const result = algorithm.solarToLunar("2025-01-29");
      expect(result.year).toBe(2025);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    // Golden test cases from plan document (section 11.A)
    it("should convert 2025-06-25 to lunar (2025, 6, 1, false) - regular 6th month", () => {
      const result = algorithm.solarToLunar("2025-06-25");
      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
      expect(result.day).toBe(1);
      expect(result.isLeapMonth).toBe(false);
    });

    it("should convert 2025-07-25 to lunar (2025, 6, 1, true) - leap 6th month", () => {
      const result = algorithm.solarToLunar("2025-07-25");
      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
      expect(result.day).toBe(1);
      expect(result.isLeapMonth).toBe(true);
    });

    // Additional verification test cases
    it("should convert 1991-09-02 to lunar (1991, 7, 24, false)", () => {
      const result = algorithm.solarToLunar("1991-09-02");
      expect(result.year).toBe(1991);
      expect(result.month).toBe(7);
      expect(result.day).toBe(24);
      expect(result.isLeapMonth).toBe(false);
    });

    it("should handle leap month correctly", () => {
      // 2025 has leap month 6
      // We need to find a date in the leap 6th month
      const leapMonthStart = algorithm.lunarToSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: true,
      });

      const result = algorithm.solarToLunar(leapMonthStart);
      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
      expect(result.day).toBe(1);
      expect(result.isLeapMonth).toBe(true);
    });

    it("should differentiate between regular month and leap month", () => {
      // Regular 6th month (before leap)
      const regularSixth = algorithm.lunarToSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: false,
      });

      // Leap 6th month
      const leapSixth = algorithm.lunarToSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: true,
      });

      expect(regularSixth).not.toBe(leapSixth);

      const regularResult = algorithm.solarToLunar(regularSixth);
      expect(regularResult.isLeapMonth).toBe(false);

      const leapResult = algorithm.solarToLunar(leapSixth);
      expect(leapResult.isLeapMonth).toBe(true);
    });
  });

  describe("lunarToSolar boundary cases", () => {
    // Golden test cases from plan document (section 11.A)
    it("should convert lunar (2025, 6, 1, false) to 2025-06-25 - regular 6th month", () => {
      const result = algorithm.lunarToSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: false,
      });
      expect(result).toBe("2025-06-25");
    });

    it("should convert lunar (2025, 6, 1, true) to 2025-07-25 - leap 6th month", () => {
      const result = algorithm.lunarToSolar({
        year: 2025,
        month: 6,
        day: 1,
        isLeapMonth: true,
      });
      expect(result).toBe("2025-07-25");
    });

    // Additional verification test cases
    it("should convert lunar (2026, 5, 1, false) to 2026-06-15", () => {
      const result = algorithm.lunarToSolar({
        year: 2026,
        month: 5,
        day: 1,
        isLeapMonth: false,
      });
      expect(result).toBe("2026-06-15");
    });

    it("should convert lunar (2026, 5, 27, false) to 2026-07-11", () => {
      const result = algorithm.lunarToSolar({
        year: 2026,
        month: 5,
        day: 27,
        isLeapMonth: false,
      });
      expect(result).toBe("2026-07-11");
    });

    it("should handle month after leap month correctly", () => {
      // 2025 has leap month 6, so month 7 should map to monthIndex 8
      const result = algorithm.lunarToSolar({
        year: 2025,
        month: 7,
        day: 1,
        isLeapMonth: false,
      });

      expect(result).toBeDefined();

      // Convert back to verify
      const backToLunar = algorithm.solarToLunar(result);
      expect(backToLunar.year).toBe(2025);
      expect(backToLunar.month).toBe(7);
      expect(backToLunar.day).toBe(1);
      expect(backToLunar.isLeapMonth).toBe(false);
    });

    it("should handle last day of lunar month", () => {
      // Find a 30-day month and test its last day
      const result = algorithm.lunarToSolar({
        year: 2025,
        month: 1,
        day: 30,
        isLeapMonth: false,
      });

      expect(result).toBeDefined();
    });

    it("should handle date that spans to next solar year", () => {
      // Lunar date near end of year that might spill to next solar year
      const result = algorithm.lunarToSolar({
        year: 2025,
        month: 12,
        day: 29,
        isLeapMonth: false,
      });

      expect(result).toBeDefined();

      // Convert back to verify
      const backToLunar = algorithm.solarToLunar(result);
      expect(backToLunar.year).toBe(2025);
      expect(backToLunar.month).toBe(12);
      expect(backToLunar.day).toBe(29);
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain consistency for non-leap month", () => {
      const original = { year: 2024, month: 5, day: 15, isLeapMonth: false };
      const solar = algorithm.lunarToSolar(original);
      const lunar = algorithm.solarToLunar(solar);

      expect(lunar).toEqual(original);
    });

    it("should maintain consistency for leap month", () => {
      const original = { year: 2025, month: 6, day: 15, isLeapMonth: true };
      const solar = algorithm.lunarToSolar(original);
      const lunar = algorithm.solarToLunar(solar);

      expect(lunar).toEqual(original);
    });

    it("should maintain consistency for multiple dates", () => {
      const testCases = [
        { year: 2024, month: 1, day: 1, isLeapMonth: false },
        { year: 2024, month: 6, day: 15, isLeapMonth: false },
        { year: 2024, month: 12, day: 29, isLeapMonth: false },
        { year: 2025, month: 6, day: 1, isLeapMonth: true },
        { year: 2025, month: 6, day: 29, isLeapMonth: true },
      ];

      for (const original of testCases) {
        const solar = algorithm.lunarToSolar(original);
        const lunar = algorithm.solarToLunar(solar);
        expect(lunar).toEqual(original);
      }
    });
  });
});
