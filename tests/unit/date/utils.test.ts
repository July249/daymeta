import { describe, expect, it } from "vitest";

import {
  addDays,
  compareDate,
  formatYMD,
  generateMonthGrid,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getWeekday,
  isSameDate,
  isWeekend,
  parseYMD,
} from "@/date/utils";

/**
 * Date Utilities Test Suite
 *
 * This test suite demonstrates how to use the date utility functions
 * for parsing, formatting, and manipulating dates in YMD format.
 *
 * Key Features:
 * - Parse and format dates (YMD string ↔ Date object)
 * - Get weekday and check weekends
 * - Add days to dates (handles month/year boundaries)
 * - Get first/last day of month
 * - Generate month grid for calendar views
 * - Compare and check date equality
 *
 * Usage Example:
 * ```typescript
 * import { parseYMD, formatYMD, addDays, generateMonthGrid } from "@/date/utils";
 *
 * // Parse and format
 * const date = parseYMD("2024-01-15");
 * const ymd = formatYMD(date); // "2024-01-15"
 *
 * // Date manipulation
 * const tomorrow = addDays("2024-01-15", 1); // "2024-01-16"
 *
 * // Generate calendar grid (42 days, 6 weeks)
 * const grid = generateMonthGrid(2024, 1);
 * ```
 */
describe("date utilities", () => {
  describe("parseYMD", () => {
    it("should parse YMD string to Date", () => {
      const date = parseYMD("2024-01-15");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });
  });

  describe("formatYMD", () => {
    it("should format Date to YMD string", () => {
      const date = new Date(2024, 0, 15);
      expect(formatYMD(date)).toBe("2024-01-15");
    });

    it("should pad single digit month and day", () => {
      const date = new Date(2024, 0, 5);
      expect(formatYMD(date)).toBe("2024-01-05");
    });
  });

  describe("getWeekday", () => {
    it("should return 0 for Sunday", () => {
      expect(getWeekday("2024-01-07")).toBe(0);
    });

    it("should return 1 for Monday", () => {
      expect(getWeekday("2024-01-01")).toBe(1);
    });

    it("should return 6 for Saturday", () => {
      expect(getWeekday("2024-01-06")).toBe(6);
    });
  });

  describe("isWeekend", () => {
    it("should return true for Saturday", () => {
      expect(isWeekend("2024-01-06")).toBe(true);
    });

    it("should return true for Sunday", () => {
      expect(isWeekend("2024-01-07")).toBe(true);
    });

    it("should return false for weekday", () => {
      expect(isWeekend("2024-01-01")).toBe(false);
    });
  });

  describe("addDays", () => {
    it("should add days correctly", () => {
      expect(addDays("2024-01-15", 1)).toBe("2024-01-16");
      expect(addDays("2024-01-15", 7)).toBe("2024-01-22");
    });

    it("should handle month boundary", () => {
      expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
    });

    it("should handle negative days", () => {
      expect(addDays("2024-01-15", -1)).toBe("2024-01-14");
    });
  });

  describe("getFirstDayOfMonth", () => {
    it("should return first day of month", () => {
      expect(getFirstDayOfMonth(2024, 1)).toBe("2024-01-01");
      expect(getFirstDayOfMonth(2024, 12)).toBe("2024-12-01");
    });
  });

  describe("getLastDayOfMonth", () => {
    it("should return last day of month", () => {
      expect(getLastDayOfMonth(2024, 1)).toBe("2024-01-31");
      expect(getLastDayOfMonth(2024, 2)).toBe("2024-02-29"); // leap year
      expect(getLastDayOfMonth(2023, 2)).toBe("2023-02-28");
    });
  });

  describe("generateMonthGrid", () => {
    it("should generate 42 days", () => {
      const grid = generateMonthGrid(2024, 1);
      expect(grid).toHaveLength(42);
    });

    it("should start from Sunday of the first week", () => {
      const grid = generateMonthGrid(2024, 1);
      // 2024-01-01 is Monday, so grid should start from previous Sunday (2023-12-31)
      expect(grid[0]).toBe("2023-12-31");
      expect(getWeekday(grid[0])).toBe(0);
    });

    it("should include previous and next month dates", () => {
      const grid = generateMonthGrid(2024, 1);
      expect(grid[0].startsWith("2023-12")).toBe(true);
      expect(grid[41].startsWith("2024-02")).toBe(true);
    });
  });

  describe("isSameDate", () => {
    it("should return true for same dates", () => {
      expect(isSameDate("2024-01-15", "2024-01-15")).toBe(true);
    });

    it("should return false for different dates", () => {
      expect(isSameDate("2024-01-15", "2024-01-16")).toBe(false);
    });
  });

  describe("compareDate", () => {
    it("should return negative for earlier date", () => {
      expect(compareDate("2024-01-15", "2024-01-16")).toBeLessThan(0);
    });

    it("should return 0 for same date", () => {
      expect(compareDate("2024-01-15", "2024-01-15")).toBe(0);
    });

    it("should return positive for later date", () => {
      expect(compareDate("2024-01-16", "2024-01-15")).toBeGreaterThan(0);
    });
  });

  describe("Boundary Cases and Edge Conditions", () => {
    describe("parseYMD edge cases", () => {
      it("should handle year boundaries", () => {
        const date1 = parseYMD("1900-01-01");
        expect(date1.getFullYear()).toBe(1900);

        const date2 = parseYMD("2099-12-31");
        expect(date2.getFullYear()).toBe(2099);
      });

      it("should handle single digit months and days in string", () => {
        // YMD format should always be padded, but test if it handles it
        const date = parseYMD("2024-01-05");
        expect(date.getMonth()).toBe(0);
        expect(date.getDate()).toBe(5);
      });
    });

    describe("formatYMD edge cases", () => {
      it("should pad all single digit months", () => {
        for (let month = 0; month < 12; month++) {
          const date = new Date(2024, month, 15);
          const formatted = formatYMD(date);
          const monthStr = formatted.split("-")[1];
          expect(monthStr).toHaveLength(2);
        }
      });

      it("should pad all single digit days", () => {
        for (let day = 1; day <= 9; day++) {
          const date = new Date(2024, 0, day);
          const formatted = formatYMD(date);
          const dayStr = formatted.split("-")[2];
          expect(dayStr).toHaveLength(2);
        }
      });

      it("should handle year 1900", () => {
        const date = new Date(1900, 0, 1);
        expect(formatYMD(date)).toBe("1900-01-01");
      });
    });

    describe("addDays edge cases", () => {
      it("should handle year boundary (Dec 31 -> Jan 1)", () => {
        expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
      });

      it("should handle year boundary backwards (Jan 1 -> Dec 31)", () => {
        expect(addDays("2024-01-01", -1)).toBe("2023-12-31");
      });

      it("should handle February 29 on leap year", () => {
        expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
        expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
      });

      it("should handle February 28 on non-leap year", () => {
        expect(addDays("2023-02-28", 1)).toBe("2023-03-01");
      });

      it("should handle large positive offsets", () => {
        expect(addDays("2024-01-01", 365)).toBe("2024-12-31"); // 2024 is leap year
      });

      it("should handle large negative offsets", () => {
        expect(addDays("2024-12-31", -365)).toBe("2024-01-01");
      });

      it("should handle zero offset", () => {
        expect(addDays("2024-01-15", 0)).toBe("2024-01-15");
      });

      it("should handle all month boundaries", () => {
        const monthEnds: Array<[string, string]> = [
          ["2024-01-31", "2024-02-01"],
          ["2024-02-29", "2024-03-01"], // leap year
          ["2024-03-31", "2024-04-01"],
          ["2024-04-30", "2024-05-01"],
          ["2024-05-31", "2024-06-01"],
          ["2024-06-30", "2024-07-01"],
          ["2024-07-31", "2024-08-01"],
          ["2024-08-31", "2024-09-01"],
          ["2024-09-30", "2024-10-01"],
          ["2024-10-31", "2024-11-01"],
          ["2024-11-30", "2024-12-01"],
          ["2024-12-31", "2025-01-01"],
        ];

        for (const [from, to] of monthEnds) {
          expect(addDays(from as any, 1)).toBe(to);
        }
      });
    });

    describe("getWeekday all days", () => {
      it("should return correct weekday for all 7 days", () => {
        // Week of 2024-01-01 (Mon) to 2024-01-07 (Sun)
        expect(getWeekday("2023-12-31")).toBe(0); // Sunday
        expect(getWeekday("2024-01-01")).toBe(1); // Monday
        expect(getWeekday("2024-01-02")).toBe(2); // Tuesday
        expect(getWeekday("2024-01-03")).toBe(3); // Wednesday
        expect(getWeekday("2024-01-04")).toBe(4); // Thursday
        expect(getWeekday("2024-01-05")).toBe(5); // Friday
        expect(getWeekday("2024-01-06")).toBe(6); // Saturday
      });
    });

    describe("isWeekend all days", () => {
      it("should correctly identify all weekdays as not weekend", () => {
        const weekdays = [
          "2024-01-01", // Monday
          "2024-01-02", // Tuesday
          "2024-01-03", // Wednesday
          "2024-01-04", // Thursday
          "2024-01-05", // Friday
        ];

        for (const day of weekdays) {
          expect(isWeekend(day as any)).toBe(false);
        }
      });

      it("should correctly identify all weekend days", () => {
        const weekendDays = [
          "2024-01-06", // Saturday
          "2024-01-07", // Sunday
        ];

        for (const day of weekendDays) {
          expect(isWeekend(day as any)).toBe(true);
        }
      });
    });

    describe("getFirstDayOfMonth edge cases", () => {
      it("should handle all 12 months", () => {
        for (let month = 1; month <= 12; month++) {
          const result = getFirstDayOfMonth(2024, month);
          expect(result).toBe(`2024-${String(month).padStart(2, "0")}-01`);
        }
      });

      it("should handle different years", () => {
        expect(getFirstDayOfMonth(1900, 1)).toBe("1900-01-01");
        expect(getFirstDayOfMonth(2099, 12)).toBe("2099-12-01");
      });
    });

    describe("getLastDayOfMonth edge cases", () => {
      it("should handle all month lengths correctly", () => {
        const expected2024 = [
          31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
        ]; // 2024 is leap year

        for (let month = 1; month <= 12; month++) {
          const result = getLastDayOfMonth(2024, month);
          const day = parseInt(result.split("-")[2]);
          expect(day).toBe(expected2024[month - 1]);
        }
      });

      it("should handle leap years correctly", () => {
        expect(getLastDayOfMonth(2000, 2)).toBe("2000-02-29"); // divisible by 400
        expect(getLastDayOfMonth(2004, 2)).toBe("2004-02-29"); // divisible by 4
        expect(getLastDayOfMonth(2100, 2)).toBe("2100-02-28"); // divisible by 100 but not 400
        expect(getLastDayOfMonth(2001, 2)).toBe("2001-02-28"); // not divisible by 4
      });
    });

    describe("generateMonthGrid edge cases", () => {
      it("should handle month starting on Sunday (no previous month padding)", () => {
        // Find a month that starts on Sunday: May 2022
        const grid = generateMonthGrid(2022, 5);
        expect(grid[0]).toBe("2022-05-01");
        expect(getWeekday(grid[0])).toBe(0); // Sunday
        expect(grid).toHaveLength(42);
      });

      it("should handle month starting on Saturday (max previous month padding)", () => {
        // Find a month that starts on Saturday: January 2022
        const grid = generateMonthGrid(2022, 1);
        // Should have 6 days of previous month
        expect(grid[0]).toBe("2021-12-26");
        expect(getWeekday(grid[0])).toBe(0); // Sunday
        expect(grid[6]).toBe("2022-01-01"); // Saturday (first day of month)
        expect(grid).toHaveLength(42);
      });

      it("should handle February on leap year", () => {
        const grid = generateMonthGrid(2024, 2);
        expect(grid).toHaveLength(42);
        // Check that it includes Feb 29
        expect(grid).toContain("2024-02-29");
      });

      it("should handle February on non-leap year", () => {
        const grid = generateMonthGrid(2023, 2);
        expect(grid).toHaveLength(42);
        // Should not include Feb 29
        expect(grid).not.toContain("2023-02-29");
        expect(grid).toContain("2023-02-28");
      });

      it("should handle December (year boundary)", () => {
        const grid = generateMonthGrid(2024, 12);
        expect(grid).toHaveLength(42);
        // Should include some dates from January next year
        const hasNextYear = grid.some((date) => date.startsWith("2025-01"));
        expect(hasNextYear).toBe(true);
      });

      it("should handle January (year boundary)", () => {
        const grid = generateMonthGrid(2024, 1);
        expect(grid).toHaveLength(42);
        // Should include some dates from December previous year
        const hasPrevYear = grid.some((date) => date.startsWith("2023-12"));
        expect(hasPrevYear).toBe(true);
      });

      it("should always end on Saturday", () => {
        for (let month = 1; month <= 12; month++) {
          const grid = generateMonthGrid(2024, month);
          expect(getWeekday(grid[41])).toBe(6); // Saturday
        }
      });
    });

    describe("isSameDate edge cases", () => {
      it("should handle same date with leading zeros", () => {
        expect(isSameDate("2024-01-05", "2024-01-05")).toBe(true);
      });

      it("should detect difference in year", () => {
        expect(isSameDate("2023-01-15", "2024-01-15")).toBe(false);
      });

      it("should detect difference in month", () => {
        expect(isSameDate("2024-01-15", "2024-02-15")).toBe(false);
      });

      it("should detect difference in day", () => {
        expect(isSameDate("2024-01-15", "2024-01-16")).toBe(false);
      });
    });

    describe("compareDate edge cases", () => {
      it("should compare across years correctly", () => {
        expect(compareDate("2023-12-31", "2024-01-01")).toBeLessThan(0);
        expect(compareDate("2024-01-01", "2023-12-31")).toBeGreaterThan(0);
      });

      it("should compare across months correctly", () => {
        expect(compareDate("2024-01-31", "2024-02-01")).toBeLessThan(0);
        expect(compareDate("2024-02-01", "2024-01-31")).toBeGreaterThan(0);
      });

      it("should handle lexicographic ordering", () => {
        // YMD format naturally supports lexicographic comparison
        const dates = [
          "2024-12-25",
          "2024-01-15",
          "2024-06-30",
          "2023-12-31",
          "2025-01-01",
        ];

        const sorted = [...dates].sort(compareDate as any);

        expect(sorted).toEqual([
          "2023-12-31",
          "2024-01-15",
          "2024-06-30",
          "2024-12-25",
          "2025-01-01",
        ]);
      });
    });
  });
});
