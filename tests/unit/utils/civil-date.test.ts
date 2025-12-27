/**
 * Civil Date Utilities Test Suite
 *
 * Tests UTC-based date utilities that handle YMD string format.
 * These utilities are the ONLY date manipulation functions that should be used
 * internally per the v1.0 plan (Principle #6).
 *
 * Key Features Tested:
 * - parseYMD/formatYMD: String ↔ Civil date object conversion
 * - dayOfWeek: Get weekday (0=Sunday, 6=Saturday) using UTC
 * - dayOfYear/ymdFromDayOfYear: DOY (1-366) conversion
 * - addDays: Date arithmetic with year/month boundary handling
 * - isWeekend/isLeapYear/daysInYear: Date properties
 *
 * IMPORTANT: All functions use UTC internally to avoid timezone issues.
 */

import { describe, it, expect } from "vitest";
import {
  parseYMD,
  formatYMD,
  dayOfWeek,
  dayOfYear,
  ymdFromDayOfYear,
  addDays,
  isWeekend,
  isLeapYear,
  daysInYear,
  compareDate,
  isSameDate,
} from "@/utils/civil-date";
import type { YMD } from "@/types";

describe("civil-date utilities (UTC-based)", () => {
  describe("parseYMD", () => {
    it("should parse YMD string to civil date components", () => {
      const civil = parseYMD("2024-03-15");
      expect(civil.y).toBe(2024);
      expect(civil.m).toBe(3);
      expect(civil.d).toBe(15);
    });

    it("should handle year boundaries", () => {
      const jan1 = parseYMD("2024-01-01");
      expect(jan1).toEqual({ y: 2024, m: 1, d: 1 });

      const dec31 = parseYMD("2024-12-31");
      expect(dec31).toEqual({ y: 2024, m: 12, d: 31 });
    });

    it("should handle leap year dates", () => {
      const leapDay = parseYMD("2024-02-29");
      expect(leapDay).toEqual({ y: 2024, m: 2, d: 29 });
    });

    it("should handle historical dates", () => {
      const old = parseYMD("1900-01-01");
      expect(old).toEqual({ y: 1900, m: 1, d: 1 });
    });

    it("should handle future dates", () => {
      const future = parseYMD("2100-12-31");
      expect(future).toEqual({ y: 2100, m: 12, d: 31 });
    });
  });

  describe("formatYMD", () => {
    it("should format civil date to YMD string", () => {
      const ymd = formatYMD({ y: 2024, m: 3, d: 15 });
      expect(ymd).toBe("2024-03-15");
    });

    it("should pad single-digit months", () => {
      for (let m = 1; m <= 9; m++) {
        const ymd = formatYMD({ y: 2024, m, d: 15 });
        expect(ymd).toMatch(/^2024-0\d-15$/);
      }
    });

    it("should pad single-digit days", () => {
      for (let d = 1; d <= 9; d++) {
        const ymd = formatYMD({ y: 2024, m: 3, d });
        expect(ymd).toMatch(/^2024-03-0\d$/);
      }
    });

    it("should handle double-digit months and days", () => {
      const ymd = formatYMD({ y: 2024, m: 12, d: 31 });
      expect(ymd).toBe("2024-12-31");
    });

    it("should roundtrip with parseYMD", () => {
      const original = "2024-03-15" as YMD;
      const civil = parseYMD(original);
      const formatted = formatYMD(civil);
      expect(formatted).toBe(original);
    });
  });

  describe("dayOfWeek", () => {
    it("should return correct weekday for known dates (UTC)", () => {
      // 2024-01-01 is Monday
      expect(dayOfWeek("2024-01-01")).toBe(1);
      expect(dayOfWeek("2024-01-02")).toBe(2); // Tuesday
      expect(dayOfWeek("2024-01-03")).toBe(3); // Wednesday
      expect(dayOfWeek("2024-01-04")).toBe(4); // Thursday
      expect(dayOfWeek("2024-01-05")).toBe(5); // Friday
      expect(dayOfWeek("2024-01-06")).toBe(6); // Saturday
      expect(dayOfWeek("2024-01-07")).toBe(0); // Sunday
    });

    it("should handle year boundary", () => {
      expect(dayOfWeek("2023-12-31")).toBe(0); // Sunday
      expect(dayOfWeek("2024-01-01")).toBe(1); // Monday
    });

    it("should handle leap year Feb 29", () => {
      expect(dayOfWeek("2024-02-29")).toBe(4); // Thursday
    });
  });

  describe("isWeekend", () => {
    it("should identify Saturday as weekend", () => {
      expect(isWeekend("2024-01-06")).toBe(true);
    });

    it("should identify Sunday as weekend", () => {
      expect(isWeekend("2024-01-07")).toBe(true);
    });

    it("should identify weekdays as not weekend", () => {
      const weekdays: YMD[] = [
        "2024-01-01", // Monday
        "2024-01-02", // Tuesday
        "2024-01-03", // Wednesday
        "2024-01-04", // Thursday
        "2024-01-05", // Friday
      ];

      for (const day of weekdays) {
        expect(isWeekend(day)).toBe(false);
      }
    });
  });

  describe("isLeapYear", () => {
    it("should identify leap years divisible by 4", () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2004)).toBe(true);
    });

    it("should identify non-leap years not divisible by 4", () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(2019)).toBe(false);
    });

    it("should handle century years (divisible by 100)", () => {
      expect(isLeapYear(1900)).toBe(false); // div by 100, not by 400
      expect(isLeapYear(2100)).toBe(false);
    });

    it("should handle quad-century years (divisible by 400)", () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(1600)).toBe(true);
    });
  });

  describe("daysInYear", () => {
    it("should return 366 for leap years", () => {
      expect(daysInYear(2024)).toBe(366);
      expect(daysInYear(2020)).toBe(366);
      expect(daysInYear(2000)).toBe(366);
    });

    it("should return 365 for non-leap years", () => {
      expect(daysInYear(2023)).toBe(365);
      expect(daysInYear(2021)).toBe(365);
      expect(daysInYear(1900)).toBe(365);
    });
  });

  describe("dayOfYear", () => {
    it("should return 1 for January 1st", () => {
      expect(dayOfYear("2024-01-01")).toBe(1);
      expect(dayOfYear("2023-01-01")).toBe(1);
    });

    it("should return correct DOY for end of each month (leap year)", () => {
      const expected2024 = [
        { date: "2024-01-31", doy: 31 },
        { date: "2024-02-29", doy: 60 }, // leap year
        { date: "2024-03-31", doy: 91 },
        { date: "2024-04-30", doy: 121 },
        { date: "2024-05-31", doy: 152 },
        { date: "2024-06-30", doy: 182 },
        { date: "2024-07-31", doy: 213 },
        { date: "2024-08-31", doy: 244 },
        { date: "2024-09-30", doy: 274 },
        { date: "2024-10-31", doy: 305 },
        { date: "2024-11-30", doy: 335 },
        { date: "2024-12-31", doy: 366 },
      ];

      for (const { date, doy } of expected2024) {
        expect(dayOfYear(date as YMD)).toBe(doy);
      }
    });

    it("should return correct DOY for end of each month (non-leap year)", () => {
      const expected2023 = [
        { date: "2023-01-31", doy: 31 },
        { date: "2023-02-28", doy: 59 }, // non-leap year
        { date: "2023-03-31", doy: 90 },
        { date: "2023-04-30", doy: 120 },
        { date: "2023-05-31", doy: 151 },
        { date: "2023-06-30", doy: 181 },
        { date: "2023-07-31", doy: 212 },
        { date: "2023-08-31", doy: 243 },
        { date: "2023-09-30", doy: 273 },
        { date: "2023-10-31", doy: 304 },
        { date: "2023-11-30", doy: 334 },
        { date: "2023-12-31", doy: 365 },
      ];

      for (const { date, doy } of expected2023) {
        expect(dayOfYear(date as YMD)).toBe(doy);
      }
    });

    it("should handle leap day Feb 29", () => {
      expect(dayOfYear("2024-02-29")).toBe(60);
      expect(dayOfYear("2024-03-01")).toBe(61);
    });
  });

  describe("ymdFromDayOfYear", () => {
    it("should convert DOY 1 to January 1st", () => {
      expect(ymdFromDayOfYear(2024, 1)).toBe("2024-01-01");
      expect(ymdFromDayOfYear(2023, 1)).toBe("2023-01-01");
    });

    it("should convert DOY to correct date (leap year)", () => {
      expect(ymdFromDayOfYear(2024, 31)).toBe("2024-01-31");
      expect(ymdFromDayOfYear(2024, 60)).toBe("2024-02-29"); // leap day
      expect(ymdFromDayOfYear(2024, 61)).toBe("2024-03-01");
      expect(ymdFromDayOfYear(2024, 366)).toBe("2024-12-31");
    });

    it("should convert DOY to correct date (non-leap year)", () => {
      expect(ymdFromDayOfYear(2023, 31)).toBe("2023-01-31");
      expect(ymdFromDayOfYear(2023, 59)).toBe("2023-02-28"); // no leap day
      expect(ymdFromDayOfYear(2023, 60)).toBe("2023-03-01");
      expect(ymdFromDayOfYear(2023, 365)).toBe("2023-12-31");
    });

    it("should roundtrip with dayOfYear", () => {
      // Test all days in 2024 (leap year)
      for (let doy = 1; doy <= 366; doy++) {
        const ymd = ymdFromDayOfYear(2024, doy);
        expect(dayOfYear(ymd)).toBe(doy);
      }

      // Test all days in 2023 (non-leap year)
      for (let doy = 1; doy <= 365; doy++) {
        const ymd = ymdFromDayOfYear(2023, doy);
        expect(dayOfYear(ymd)).toBe(doy);
      }
    });
  });

  describe("addDays", () => {
    it("should add days within the same month", () => {
      expect(addDays("2024-03-15", 5)).toBe("2024-03-20");
      expect(addDays("2024-03-15", 10)).toBe("2024-03-25");
    });

    it("should subtract days within the same month", () => {
      expect(addDays("2024-03-15", -5)).toBe("2024-03-10");
      expect(addDays("2024-03-15", -10)).toBe("2024-03-05");
    });

    it("should handle zero offset", () => {
      expect(addDays("2024-03-15", 0)).toBe("2024-03-15");
    });

    it("should cross month boundaries forward", () => {
      expect(addDays("2024-01-31", 1)).toBe("2024-02-01");
      expect(addDays("2024-02-29", 1)).toBe("2024-03-01"); // leap year
      expect(addDays("2023-02-28", 1)).toBe("2023-03-01"); // non-leap
    });

    it("should cross month boundaries backward", () => {
      expect(addDays("2024-02-01", -1)).toBe("2024-01-31");
      expect(addDays("2024-03-01", -1)).toBe("2024-02-29"); // leap year
      expect(addDays("2023-03-01", -1)).toBe("2023-02-28"); // non-leap
    });

    it("should cross year boundaries forward", () => {
      expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
      expect(addDays("2023-12-31", 1)).toBe("2024-01-01");
    });

    it("should cross year boundaries backward", () => {
      expect(addDays("2024-01-01", -1)).toBe("2023-12-31");
      expect(addDays("2025-01-01", -1)).toBe("2024-12-31");
    });

    it("should handle all month boundaries in leap year", () => {
      const transitions = [
        ["2024-01-31", "2024-02-01"],
        ["2024-02-29", "2024-03-01"],
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

      for (const [from, to] of transitions) {
        expect(addDays(from as YMD, 1)).toBe(to);
        expect(addDays(to as YMD, -1)).toBe(from);
      }
    });

    it("should handle large positive offsets", () => {
      expect(addDays("2024-01-01", 365)).toBe("2024-12-31"); // leap year
      expect(addDays("2023-01-01", 364)).toBe("2023-12-31"); // non-leap
    });

    it("should handle large negative offsets", () => {
      expect(addDays("2024-12-31", -365)).toBe("2024-01-01"); // leap year
      expect(addDays("2023-12-31", -364)).toBe("2023-01-01"); // non-leap
    });

    it("should handle multi-year offsets", () => {
      // Test simple 2-year forward/backward
      expect(addDays("2024-01-15", 365 + 366)).toBe("2026-01-15"); // 2024 (366) + 2025 (365)
      expect(addDays("2024-01-15", -(365 + 365))).toBe("2022-01-15"); // back through 2023 (365) + 2022 (365)
    });

    it("should handle year boundary (Jan 1) with multi-year offsets", () => {
      // CRITICAL: Jan 1 is the most important boundary point for year calculations

      // Forward from Jan 1 (leap year start)
      expect(addDays("2024-01-01", 366)).toBe("2025-01-01"); // exactly 1 leap year
      expect(addDays("2024-01-01", 366 + 365)).toBe("2026-01-01"); // 2024 (366) + 2025 (365)

      // Backward from Jan 1 (leap year start)
      expect(addDays("2024-01-01", -1)).toBe("2023-12-31"); // previous year end
      expect(addDays("2024-01-01", -365)).toBe("2023-01-01"); // exactly 1 non-leap year back
      expect(addDays("2024-01-01", -365 - 365)).toBe("2022-01-01"); // 2 non-leap years back

      // Forward from Jan 1 (non-leap year start)
      expect(addDays("2023-01-01", 365)).toBe("2024-01-01"); // exactly 1 non-leap year
      expect(addDays("2023-01-01", 365 + 366)).toBe("2025-01-01"); // 2023 (365) + 2024 (366)

      // Backward from Jan 1 (non-leap year start)
      expect(addDays("2023-01-01", -1)).toBe("2022-12-31");
      expect(addDays("2023-01-01", -365)).toBe("2022-01-01"); // exactly 1 non-leap year back
    });

    it("should roundtrip with subtraction", () => {
      const testDates: YMD[] = [
        "2024-01-01",
        "2024-02-29",
        "2024-06-15",
        "2024-12-31",
        "2023-07-04",
      ];

      for (const date of testDates) {
        expect(addDays(addDays(date, 100), -100)).toBe(date);
        expect(addDays(addDays(date, -50), 50)).toBe(date);
      }
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle Feb 29 on leap years correctly", () => {
      expect(dayOfYear("2024-02-29")).toBe(60);
      expect(ymdFromDayOfYear(2024, 60)).toBe("2024-02-29");
      expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
      expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    });

    it("should handle century years correctly", () => {
      expect(isLeapYear(1900)).toBe(false);
      expect(daysInYear(1900)).toBe(365);

      expect(isLeapYear(2000)).toBe(true);
      expect(daysInYear(2000)).toBe(366);
    });

    it("should handle min/max years in supported range", () => {
      expect(formatYMD(parseYMD("1900-01-01"))).toBe("1900-01-01");
      expect(formatYMD(parseYMD("2100-12-31"))).toBe("2100-12-31");
    });

    it("should handle all possible weekdays", () => {
      const weekDays = [0, 1, 2, 3, 4, 5, 6];
      const testWeek = [
        "2024-01-07", // Sunday (0)
        "2024-01-01", // Monday (1)
        "2024-01-02", // Tuesday (2)
        "2024-01-03", // Wednesday (3)
        "2024-01-04", // Thursday (4)
        "2024-01-05", // Friday (5)
        "2024-01-06", // Saturday (6)
      ];

      testWeek.forEach((date, i) => {
        expect(dayOfWeek(date as YMD)).toBe(weekDays[i]);
      });
    });

    it("should handle sequential day additions correctly", () => {
      let date: YMD = "2024-01-01";
      for (let i = 0; i < 366; i++) {
        const doy = dayOfYear(date);
        expect(doy).toBe(i + 1);
        date = addDays(date, 1);
      }
      expect(date).toBe("2025-01-01");
    });

    it("should handle sequential day subtractions correctly", () => {
      let date: YMD = "2024-12-31";
      for (let i = 365; i >= 0; i--) {
        const doy = dayOfYear(date);
        expect(doy).toBe(i + 1);
        date = addDays(date, -1);
      }
      expect(date).toBe("2023-12-31");
    });
  });

  describe("UTC Consistency", () => {
    it("should use UTC for dayOfWeek to avoid timezone issues", () => {
      // This test verifies that we're using UTC consistently
      // The specific values are less important than consistency
      const knownDates = [
        { date: "2024-01-01" as YMD, expectedDay: 1 }, // Monday
        { date: "2024-12-25" as YMD, expectedDay: 3 }, // Wednesday
      ];

      for (const { date, expectedDay } of knownDates) {
        expect(dayOfWeek(date)).toBe(expectedDay);
      }
    });

    it("should use UTC for dayOfYear to avoid timezone issues", () => {
      // Verify UTC consistency for DOY calculations
      expect(dayOfYear("2024-01-01")).toBe(1);
      expect(dayOfYear("2024-12-31")).toBe(366);
    });

    it("should maintain consistency across all date operations", () => {
      // Comprehensive roundtrip test
      const testDate: YMD = "2024-06-15";

      // Parse -> Format
      const civil = parseYMD(testDate);
      expect(formatYMD(civil)).toBe(testDate);

      // DOY -> YMD
      const doy = dayOfYear(testDate);
      expect(ymdFromDayOfYear(2024, doy)).toBe(testDate);

      // Add/Subtract days
      expect(addDays(addDays(testDate, 50), -50)).toBe(testDate);
    });
  });

  describe("compareDate", () => {
    it("should return 0 for same dates", () => {
      expect(compareDate("2024-03-15", "2024-03-15")).toBe(0);
    });

    it("should return negative for earlier date", () => {
      expect(compareDate("2024-03-15", "2024-03-16")).toBeLessThan(0);
    });

    it("should return positive for later date", () => {
      expect(compareDate("2024-03-16", "2024-03-15")).toBeGreaterThan(0);
    });

    it("should compare across years", () => {
      expect(compareDate("2023-12-31", "2024-01-01")).toBeLessThan(0);
      expect(compareDate("2024-01-01", "2023-12-31")).toBeGreaterThan(0);
    });

    it("should handle lexicographic ordering for date arrays", () => {
      const dates: YMD[] = [
        "2024-12-25",
        "2024-01-15",
        "2024-06-30",
        "2023-12-31",
        "2025-01-01",
      ];

      const sorted = [...dates].sort(compareDate);

      expect(sorted).toEqual([
        "2023-12-31",
        "2024-01-15",
        "2024-06-30",
        "2024-12-25",
        "2025-01-01",
      ]);
    });
  });

  describe("isSameDate", () => {
    it("should return true for identical dates", () => {
      expect(isSameDate("2024-03-15", "2024-03-15")).toBe(true);
    });

    it("should return false for different years", () => {
      expect(isSameDate("2023-03-15", "2024-03-15")).toBe(false);
    });

    it("should return false for different months", () => {
      expect(isSameDate("2024-02-15", "2024-03-15")).toBe(false);
    });

    it("should return false for different days", () => {
      expect(isSameDate("2024-03-14", "2024-03-15")).toBe(false);
    });
  });
});
