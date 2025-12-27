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
});
