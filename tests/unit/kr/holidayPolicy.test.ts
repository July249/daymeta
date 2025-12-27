import { describe, expect, it } from "vitest";

import { calculateSubstituteHolidays, mergeHolidays } from "@/kr/holidayPolicy";

import type { HolidayItem } from "@/types";

/**
 * Holiday Policy Test Suite
 *
 * This test suite demonstrates how to use the holiday policy functions
 * that calculate substitute holidays and merge holiday lists.
 *
 * Key Features:
 * - Calculate substitute holidays for weekend holidays
 * - Handle consecutive holidays (find next available weekday)
 * - Support policy-based eligibility (specific holidays only)
 * - Merge multiple holiday lists and sort by date
 *
 * Usage Example:
 * ```typescript
 * import { calculateSubstituteHolidays, mergeHolidays } from "@/kr/holidayPolicy";
 *
 * const holidays = [
 *   { date: "2024-01-07", name: "Test Holiday", kind: "STATUTORY" }
 * ];
 *
 * // Calculate substitute holidays
 * const substitutes = calculateSubstituteHolidays(holidays);
 * // Returns substitute for Sunday -> Monday
 *
 * // Merge all holidays
 * const all = mergeHolidays(holidays, substitutes);
 * ```
 */
describe("holidayPolicy", () => {
  describe("calculateSubstituteHolidays", () => {
    it("should create substitute holiday for Sunday holiday", () => {
      const holidays: HolidayItem[] = [
        {
          id: "test-holiday",
          date: "2024-01-07", // Sunday
          name: "테스트 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].date).toBe("2024-01-08"); // Monday
      expect(substitutes[0].name).toBe("테스트 공휴일 대체공휴일");
      expect(substitutes[0].kind).toBe("SUBSTITUTE");
      expect(substitutes[0].substituteFor).toBe("2024-01-07");
    });

    it("should create substitute holiday for Saturday holiday", () => {
      const holidays: HolidayItem[] = [
        {
          id: "test-holiday",
          date: "2024-01-06", // Saturday
          name: "테스트 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].date).toBe("2024-01-08"); // Monday (skip Sunday)
      expect(substitutes[0].kind).toBe("SUBSTITUTE");
    });

    it("should skip weekend when finding substitute date", () => {
      const holidays: HolidayItem[] = [
        {
          id: "saturday-holiday",
          date: "2024-01-06", // Saturday
          name: "토요일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes[0].date).toBe("2024-01-08"); // Monday
    });

    it("should handle consecutive holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "sunday-holiday",
          date: "2024-01-07", // Sunday
          name: "일요일 공휴일",
          kind: "STATUTORY",
        },
        {
          id: "monday-holiday",
          date: "2024-01-08", // Monday (would be substitute, but is also a holiday)
          name: "월요일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      // Should create substitute for Sunday on Tuesday (skip Monday which is also a holiday)
      const sundaySubstitute = substitutes.find(
        (s) => s.substituteFor === "2024-01-07",
      );
      expect(sundaySubstitute?.date).toBe("2024-01-09"); // Tuesday

      // Monday is a weekday, so no substitute holiday should be created
      const mondaySubstitute = substitutes.find(
        (s) => s.substituteFor === "2024-01-08",
      );
      expect(mondaySubstitute).toBeUndefined();
    });

    it("should not create substitute for weekday holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "weekday-holiday",
          date: "2024-01-08", // Monday
          name: "평일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      // Monday is not weekend, so no substitute unless policy requires
      expect(substitutes).toHaveLength(0);
    });

    it("should respect policy for eligible holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "seollal",
          date: "2024-01-07", // Sunday
          name: "설날",
          kind: "STATUTORY",
        },
        {
          id: "other-holiday",
          date: "2024-02-11", // Sunday
          name: "기타 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays, {
        eligibleHolidays: ["설날"],
      });

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].substituteFor).toBe("2024-01-07");
    });
  });

  describe("mergeHolidays", () => {
    it("should merge and sort holidays", () => {
      const base: HolidayItem[] = [
        {
          id: "base-holiday",
          date: "2024-01-15",
          name: "Base Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitute: HolidayItem[] = [
        {
          id: "substitute-holiday",
          date: "2024-01-08",
          name: "Substitute Holiday",
          kind: "SUBSTITUTE",
        },
      ];

      const extra: HolidayItem[] = [
        {
          id: "extra-holiday",
          date: "2024-01-20",
          name: "Extra Holiday",
          kind: "TEMPORARY",
        },
      ];

      const merged = mergeHolidays(base, substitute, extra);

      expect(merged).toHaveLength(3);
      expect(merged[0].date).toBe("2024-01-08");
      expect(merged[1].date).toBe("2024-01-15");
      expect(merged[2].date).toBe("2024-01-20");
    });

    it("should handle empty arrays", () => {
      const merged = mergeHolidays([], [], []);
      expect(merged).toHaveLength(0);
    });

    it("should handle single array with others empty", () => {
      const base: HolidayItem[] = [
        {
          id: "base-holiday",
          date: "2024-01-15",
          name: "Base Holiday",
          kind: "STATUTORY",
        },
      ];

      const merged = mergeHolidays(base, [], []);
      expect(merged).toHaveLength(1);
      expect(merged[0].date).toBe("2024-01-15");
    });

    it("should sort holidays by date correctly", () => {
      const holidays: HolidayItem[] = [
        {
          id: "h3",
          date: "2024-12-25",
          name: "Christmas",
          kind: "STATUTORY",
        },
        {
          id: "h1",
          date: "2024-01-01",
          name: "New Year",
          kind: "STATUTORY",
        },
        {
          id: "h2",
          date: "2024-06-15",
          name: "Mid Year",
          kind: "STATUTORY",
        },
      ];

      const merged = mergeHolidays(holidays, []);

      expect(merged[0].date).toBe("2024-01-01");
      expect(merged[1].date).toBe("2024-06-15");
      expect(merged[2].date).toBe("2024-12-25");
    });

    it("should merge without extra parameter", () => {
      const base: HolidayItem[] = [
        {
          id: "base",
          date: "2024-01-15",
          name: "Base",
          kind: "STATUTORY",
        },
      ];

      const substitute: HolidayItem[] = [
        {
          id: "sub",
          date: "2024-01-08",
          name: "Sub",
          kind: "SUBSTITUTE",
        },
      ];

      // Call without third parameter
      const merged = mergeHolidays(base, substitute);

      expect(merged).toHaveLength(2);
      expect(merged[0].date).toBe("2024-01-08");
      expect(merged[1].date).toBe("2024-01-15");
    });
  });

  describe("Edge Cases and Policy Variations", () => {
    it("should handle policy with applySaturday=false", () => {
      const holidays: HolidayItem[] = [
        {
          id: "saturday",
          date: "2024-01-06", // Saturday
          name: "Saturday Holiday",
          kind: "STATUTORY",
        },
        {
          id: "sunday",
          date: "2024-01-07", // Sunday
          name: "Sunday Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays, {
        applySaturday: false,
        applySunday: true,
      });

      // Only Sunday should get substitute
      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].substituteFor).toBe("2024-01-07");
    });

    it("should handle policy with applySunday=false", () => {
      const holidays: HolidayItem[] = [
        {
          id: "saturday",
          date: "2024-01-06", // Saturday
          name: "Saturday Holiday",
          kind: "STATUTORY",
        },
        {
          id: "sunday",
          date: "2024-01-07", // Sunday
          name: "Sunday Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays, {
        applySaturday: true,
        applySunday: false,
      });

      // Only Saturday should get substitute
      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].substituteFor).toBe("2024-01-06");
    });

    it("should handle empty eligibleHolidays list (all eligible)", () => {
      const holidays: HolidayItem[] = [
        {
          id: "h1",
          date: "2024-01-07", // Sunday
          name: "Holiday A",
          kind: "STATUTORY",
        },
        {
          id: "h2",
          date: "2024-02-11", // Sunday
          name: "Holiday B",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays, {
        eligibleHolidays: [],
      });

      // Both should get substitutes
      expect(substitutes).toHaveLength(2);
    });

    it("should handle multiple consecutive weekends", () => {
      const holidays: HolidayItem[] = [
        {
          id: "sat1",
          date: "2024-01-06", // Saturday
          name: "Saturday 1",
          kind: "STATUTORY",
        },
        {
          id: "sun1",
          date: "2024-01-07", // Sunday
          name: "Sunday 1",
          kind: "STATUTORY",
        },
        {
          id: "mon",
          date: "2024-01-08", // Monday (substitute would go here)
          name: "Monday Holiday",
          kind: "STATUTORY",
        },
        {
          id: "tue",
          date: "2024-01-09", // Tuesday (substitute would go here)
          name: "Tuesday Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      // Saturday -> skip Sun/Mon/Tue -> Wed
      const satSub = substitutes.find((s) => s.substituteFor === "2024-01-06");
      expect(satSub?.date).toBe("2024-01-10"); // Wednesday

      // Sunday -> skip Mon/Tue -> Wed (but Wed is taken, so Thu)
      const sunSub = substitutes.find((s) => s.substituteFor === "2024-01-07");
      expect(sunSub?.date).toBe("2024-01-11"); // Thursday
    });

    it("should handle holidays with same date (idempotent)", () => {
      const holidays: HolidayItem[] = [
        {
          id: "h1",
          date: "2024-01-07", // Sunday
          name: "Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitutes1 = calculateSubstituteHolidays(holidays);
      const substitutes2 = calculateSubstituteHolidays(holidays);

      expect(substitutes1).toEqual(substitutes2);
    });

    it("should set correct id for substitute holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "original",
          date: "2024-01-07", // Sunday
          name: "Test Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes[0].id).toBe("KR_SUBSTITUTE");
      expect(substitutes[0].kind).toBe("SUBSTITUTE");
    });

    it("should handle empty holiday list", () => {
      const substitutes = calculateSubstituteHolidays([]);
      expect(substitutes).toHaveLength(0);
    });

    it("should maintain substitute date reference", () => {
      const holidays: HolidayItem[] = [
        {
          id: "h1",
          date: "2024-01-07", // Sunday
          name: "Original",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes[0].substituteFor).toBe("2024-01-07");
      expect(substitutes[0].name).toBe("Original 대체공휴일");
    });
  });
});
