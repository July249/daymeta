import { describe, expect, it } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import holidayRules from "@/data/holidays/kr.rules.v1.json" with { type: "json" };
import { TableLunarProvider } from "@/providers/lunar/table";
import { JsonHolidayProvider } from "@/providers/holiday/json";

/**
 * JsonHolidayProvider Test Suite
 *
 * This test suite verifies the rule-based holiday provider that processes
 * both solar and lunar holidays from JSON rule definitions.
 *
 * Key Features:
 * - Fixed solar holidays (e.g., New Year's Day, Christmas)
 * - Fixed lunar holidays (e.g., Seollal, Chuseok)
 * - Padding support for multi-day holidays (before/after)
 * - Caching for performance
 *
 * Critical Test Case (Plan Section 11.C):
 * - Seollal (설날) must generate exactly 3 days with pad: {before: 1, after: 1}
 */

describe("JsonHolidayProvider", () => {
  const lunarProvider = new TableLunarProvider("KR", lunarData.rows);
  const holidayProvider = new JsonHolidayProvider(
    "KR",
    holidayRules.rules as any,
    lunarProvider
  );

  describe("constructor and metadata", () => {
    it("should initialize with correct metadata", () => {
      expect(holidayProvider.meta.name).toBe("JsonHolidayProvider");
      expect(holidayProvider.meta.country).toBe("KR");
    });

    it("should allow construction without lunar provider", () => {
      const providerWithoutLunar = new JsonHolidayProvider("KR", []);
      expect(providerWithoutLunar.meta.country).toBe("KR");
    });
  });

  describe("fixed solar holidays", () => {
    it("should generate New Year's Day correctly", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const newYear = holidays.find((h) => h.id === "KR_NEWYEAR");

      expect(newYear).toBeDefined();
      expect(newYear!.date).toBe("2025-01-01");
      expect(newYear!.kind).toBe("STATUTORY");
      expect(newYear!.name).toBe("신정");
      expect(newYear!.nameEn).toBe("New Year's Day");
      expect(newYear!.variant).toBe("DAY");
    });

    it("should generate Christmas correctly", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const christmas = holidays.find((h) => h.id === "KR_CHRISTMAS");

      expect(christmas).toBeDefined();
      expect(christmas!.date).toBe("2025-12-25");
      expect(christmas!.kind).toBe("STATUTORY");
      expect(christmas!.name).toBe("크리스마스");
      expect(christmas!.nameEn).toBe("Christmas Day");
      expect(christmas!.variant).toBe("DAY");
    });

    it("should generate Children's Day correctly", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const children = holidays.find((h) => h.id === "KR_CHILDREN");

      expect(children).toBeDefined();
      expect(children!.date).toBe("2025-05-05");
      expect(children!.variant).toBe("DAY");
    });
  });

  describe("fixed lunar holidays without padding", () => {
    it("should generate Buddha's Birthday correctly", async () => {
      // Buddha's Birthday: lunar 4/8 with NO padding
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const buddha = holidays.filter((h) => h.id === "KR_BUDDHA");

      // Should generate exactly 1 day (no padding)
      expect(buddha).toHaveLength(1);
      expect(buddha[0].kind).toBe("STATUTORY");
      expect(buddha[0].name).toBe("부처님 오신 날");
      expect(buddha[0].nameEn).toBe("Buddha's Birthday");
      expect(buddha[0].variant).toBe("DAY");

      // Verify it's the correct solar conversion of lunar 2025-04-08
      const expectedDate = await lunarProvider.toSolar({
        year: 2025,
        month: 4,
        day: 8,
        isLeapMonth: false,
      });
      expect(buddha[0].date).toBe(expectedDate);
    });
  });

  describe("fixed lunar holidays with padding - CRITICAL TEST", () => {
    /**
     * GOLDEN TEST CASE from Plan Document Section 11.C
     *
     * Seollal (설날) must generate exactly 3 days:
     * - Day before: variant="PRE"
     * - The day itself: variant="DAY"
     * - Day after: variant="POST"
     *
     * This is a critical test per the v1.0 plan requirements.
     */
    it("should generate Seollal with exactly 3 days (before=1, DAY, after=1)", async () => {
      // Seollal: lunar 1/1 with pad: {before: 1, after: 1}
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const seollal = holidays.filter((h) => h.id === "KR_SEOLLAL");

      // CRITICAL: Must generate exactly 3 days
      expect(seollal).toHaveLength(3);

      // Get the base date (lunar new year)
      const baseDate = await lunarProvider.toSolar({
        year: 2025,
        month: 1,
        day: 1,
        isLeapMonth: false,
      });
      expect(baseDate).toBe("2025-01-29"); // 2025 lunar new year

      // Verify all 3 days have correct properties
      for (const item of seollal) {
        expect(item.id).toBe("KR_SEOLLAL");
        expect(item.kind).toBe("STATUTORY");
        expect(item.name).toBe("설날");
        expect(item.nameEn).toBe("Seollal (Lunar New Year)");
      }

      // Verify the 3 days are ordered: PRE, DAY, POST
      const sorted = [...seollal].sort((a, b) => a.date.localeCompare(b.date));

      expect(sorted[0].date).toBe("2025-01-28"); // Day before
      expect(sorted[0].variant).toBe("PRE");

      expect(sorted[1].date).toBe("2025-01-29"); // The day itself
      expect(sorted[1].variant).toBe("DAY");

      expect(sorted[2].date).toBe("2025-01-30"); // Day after
      expect(sorted[2].variant).toBe("POST");
    });

    it("should generate Chuseok with exactly 3 days (before=1, DAY, after=1)", async () => {
      // Chuseok: lunar 8/15 with pad: {before: 1, after: 1}
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const chuseok = holidays.filter((h) => h.id === "KR_CHUSEOK");

      // Must generate exactly 3 days
      expect(chuseok).toHaveLength(3);

      // Get the base date (lunar 8/15)
      const baseDate = await lunarProvider.toSolar({
        year: 2025,
        month: 8,
        day: 15,
        isLeapMonth: false,
      });

      // Verify all 3 days
      const sorted = [...chuseok].sort((a, b) => a.date.localeCompare(b.date));

      expect(sorted[0].variant).toBe("PRE");
      expect(sorted[1].date).toBe(baseDate);
      expect(sorted[1].variant).toBe("DAY");
      expect(sorted[2].variant).toBe("POST");

      // Verify metadata
      for (const item of chuseok) {
        expect(item.id).toBe("KR_CHUSEOK");
        expect(item.kind).toBe("STATUTORY");
        expect(item.name).toBe("추석");
        expect(item.nameEn).toBe("Chuseok (Korean Thanksgiving)");
      }
    });
  });

  describe("year-to-year consistency", () => {
    it("should generate different solar dates for lunar holidays across years", async () => {
      const holidays2024 = await holidayProvider.getBaseHolidays(2024);
      const holidays2025 = await holidayProvider.getBaseHolidays(2025);

      const seollal2024 = holidays2024.find(
        (h) => h.id === "KR_SEOLLAL" && h.variant === "DAY"
      );
      const seollal2025 = holidays2025.find(
        (h) => h.id === "KR_SEOLLAL" && h.variant === "DAY"
      );

      expect(seollal2024!.date).toBe("2024-02-10");
      expect(seollal2025!.date).toBe("2025-01-29");

      // Different solar dates for the same lunar date
      expect(seollal2024!.date).not.toBe(seollal2025!.date);
    });

    it("should maintain same solar dates for fixed solar holidays", async () => {
      const holidays2024 = await holidayProvider.getBaseHolidays(2024);
      const holidays2025 = await holidayProvider.getBaseHolidays(2025);

      const christmas2024 = holidays2024.find((h) => h.id === "KR_CHRISTMAS");
      const christmas2025 = holidays2025.find((h) => h.id === "KR_CHRISTMAS");

      // Same month/day across years
      expect(christmas2024!.date).toBe("2024-12-25");
      expect(christmas2025!.date).toBe("2025-12-25");
    });
  });

  describe("caching behavior", () => {
    it("should cache results for the same year", async () => {
      const result1 = await holidayProvider.getBaseHolidays(2025);
      const result2 = await holidayProvider.getBaseHolidays(2025);

      // Same reference (cached)
      expect(result1).toBe(result2);
    });

    it("should return different references for different years", async () => {
      const result2024 = await holidayProvider.getBaseHolidays(2024);
      const result2025 = await holidayProvider.getBaseHolidays(2025);

      // Different references
      expect(result2024).not.toBe(result2025);
    });
  });

  describe("sorting behavior", () => {
    it("should return holidays sorted by date", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);

      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i - 1].date.localeCompare(holidays[i].date)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("error handling", () => {
    it("should handle missing lunar provider for lunar holidays", async () => {
      const providerWithoutLunar = new JsonHolidayProvider("KR", [
        {
          id: "TEST_LUNAR",
          kind: "STATUTORY",
          names: { ko: "테스트" },
          rule: { type: "fixed_lunar", month: 1, day: 1 },
        },
      ]);

      const holidays = await providerWithoutLunar.getBaseHolidays(2025);

      // Should return empty array when lunar provider is missing
      expect(holidays).toHaveLength(0);
    });

    it("should handle year out of lunar range gracefully", async () => {
      // TableLunarProvider supports 1900-2050, so 1899 is out of range
      const providerWithOutOfRangeYear = new JsonHolidayProvider(
        "KR",
        [
          {
            id: "OUT_OF_RANGE",
            kind: "STATUTORY",
            names: { ko: "범위 밖" },
            rule: {
              type: "fixed_lunar",
              month: 1,
              day: 1,
            },
          },
        ],
        lunarProvider
      );

      const holidays = await providerWithOutOfRangeYear.getBaseHolidays(1899);

      // Should handle gracefully and return empty result for year out of lunar data range
      expect(holidays).toHaveLength(0);
    });
  });

  describe("all Korean holidays count", () => {
    it("should generate correct total number of holidays for 2025", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);

      // 11 unique holidays in kr.rules.v1.json:
      // - 8 solar holidays (1 day each) = 8 items
      // - 1 lunar without pad (Buddha) = 1 item
      // - 2 lunar with pad (Seollal, Chuseok, each 3 days) = 6 items
      // Total = 8 + 1 + 6 = 15 items
      expect(holidays).toHaveLength(15);
    });

    it("should have correct unique holiday IDs", async () => {
      const holidays = await holidayProvider.getBaseHolidays(2025);
      const uniqueIds = new Set(holidays.map((h) => h.id));

      expect(uniqueIds.size).toBe(11); // 11 unique holidays
      expect(uniqueIds).toContain("KR_NEWYEAR");
      expect(uniqueIds).toContain("KR_SEOLLAL");
      expect(uniqueIds).toContain("KR_SAMIL");
      expect(uniqueIds).toContain("KR_BUDDHA");
      expect(uniqueIds).toContain("KR_CHILDREN");
      expect(uniqueIds).toContain("KR_MEMORIAL");
      expect(uniqueIds).toContain("KR_GWANGBOK");
      expect(uniqueIds).toContain("KR_CHUSEOK");
      expect(uniqueIds).toContain("KR_GAECHUN");
      expect(uniqueIds).toContain("KR_HANGEUL");
      expect(uniqueIds).toContain("KR_CHRISTMAS");
    });
  });
});
