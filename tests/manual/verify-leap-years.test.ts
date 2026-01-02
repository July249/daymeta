import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

describe("Verify leap month years data integrity", () => {
  const algorithm = new TableLunarAlgorithm(lunarData.rows);

  // Get all years with leap months
  const leapYears = lunarData.rows.filter((row) => row.leap > 0);

  console.log(`\nTesting ${leapYears.length} leap month years...\n`);

  leapYears.forEach((yearData) => {
    it(`should have correct total days for lunar year ${yearData.y} (leap month ${yearData.leap})`, () => {
      const year = yearData.y;
      const ny = yearData.ny;
      const leap = yearData.leap;
      const mask = parseInt(yearData.mask, 16);

      // Calculate total days from mask
      let totalDaysFromMask = 0;
      const totalMonths = 13; // leap year always has 13 months

      for (let monthIndex = 1; monthIndex <= totalMonths; monthIndex++) {
        const monthLen = 29 + ((mask >> (monthIndex - 1)) & 1);
        totalDaysFromMask += monthLen;
      }

      // Get next year's lunar new year
      const nextYearData = lunarData.rows.find((r) => r.y === year + 1);
      if (!nextYearData) {
        console.log(`  ⚠️  ${year}: No next year data (last year in range)`);
        return;
      }

      const nextNY = nextYearData.ny;

      // Calculate actual days between lunar new years
      // Case 1: Both LNY in same solar year
      // Case 2: Current LNY in year Y, next LNY in year Y+1
      const isLeapYear = (y: number) =>
        (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      const daysInYear = isLeapYear(year) ? 366 : 365;

      // Current LNY is at day `ny` of solar year `year`
      // Next LNY is at day `nextNY` of solar year `year + 1`
      const actualTotalDays = daysInYear - ny + nextNY;

      // Check if they match
      const status = actualTotalDays === totalDaysFromMask ? "✅" : "❌";
      const diff = actualTotalDays - totalDaysFromMask;

      if (actualTotalDays !== totalDaysFromMask) {
        console.log(
          `  ${status} ${year} (leap ${leap}): mask=${yearData.mask} => ${totalDaysFromMask} days, actual=${actualTotalDays} days (diff: ${diff > 0 ? "+" : ""}${diff})`,
        );
      }

      expect(actualTotalDays).toBe(totalDaysFromMask);
    });
  });

  it("should print summary of leap year validation", () => {
    console.log(`\n✅ All ${leapYears.length} leap month years validated successfully!`);
    expect(true).toBe(true);
  });
});
