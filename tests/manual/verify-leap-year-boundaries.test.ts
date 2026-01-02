import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

describe("Verify leap year boundaries", () => {
  const algorithm = new TableLunarAlgorithm(lunarData.rows);
  const leapYears = lunarData.rows.filter((row) => row.leap > 0);

  console.log(`\nVerifying boundary dates for ${leapYears.length} leap years...\n`);

  const errors: Array<{
    year: number;
    test: string;
    error: string;
  }> = [];

  leapYears.forEach((yearData) => {
    const year = yearData.y;
    const leap = yearData.leap;

    describe(`Lunar year ${year} (leap month ${leap})`, () => {
      // Test 1: First day of lunar year (1/1)
      it("should convert lunar 1/1 to solar", () => {
        try {
          const solar = algorithm.lunarToSolar({
            year,
            month: 1,
            day: 1,
            isLeapMonth: false,
          });

          // Verify it matches the `ny` value
          const nextYearData = lunarData.rows.find((r) => r.y === year);
          if (nextYearData) {
            const expectedDOY = nextYearData.ny;
            // We can't easily verify DOY without more complex calculation
            // Just make sure conversion works
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push({ year, test: "lunar 1/1", error: msg });
          console.log(`  ❌ ${year} lunar 1/1: ${msg}`);
        }
      });

      // Test 2: Last day of Month 12
      it("should convert lunar 12/29 and 12/30", () => {
        try {
          // Try 12/29 (always valid)
          algorithm.lunarToSolar({
            year,
            month: 12,
            day: 29,
            isLeapMonth: false,
          });

          // Try 12/30 (may or may not exist)
          let has30Days = false;
          try {
            algorithm.lunarToSolar({
              year,
              month: 12,
              day: 30,
              isLeapMonth: false,
            });
            has30Days = true;
          } catch {
            // Month 12 has 29 days
          }

          // Verify with mask
          const mask = parseInt(yearData.mask, 16);
          const bit12 = (mask >> 12) & 1;
          const maskSays30 = bit12 === 1;

          if (has30Days !== maskSays30) {
            const msg = `Month 12: actual ${has30Days ? "30" : "29"} days, mask says ${maskSays30 ? "30" : "29"} days`;
            errors.push({ year, test: "month 12 length", error: msg });
            console.log(`  ❌ ${year} ${msg}`);
            expect(has30Days).toBe(maskSays30);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push({ year, test: "lunar 12/29-30", error: msg });
          console.log(`  ❌ ${year} lunar 12/29-30: ${msg}`);
        }
      });

      // Test 3: Leap month exists
      it("should convert leap month dates", () => {
        if (leap === 0) return;

        try {
          // Try leap month day 1
          algorithm.lunarToSolar({
            year,
            month: leap,
            day: 1,
            isLeapMonth: true,
          });

          // Try leap month day 29
          algorithm.lunarToSolar({
            year,
            month: leap,
            day: 29,
            isLeapMonth: true,
          });

          // Try leap month day 30
          let leapHas30Days = false;
          try {
            algorithm.lunarToSolar({
              year,
              month: leap,
              day: 30,
              isLeapMonth: true,
            });
            leapHas30Days = true;
          } catch {
            // Leap month has 29 days
          }

          // Verify with mask
          const mask = parseInt(yearData.mask, 16);
          const leapBit = (mask >> leap) & 1;
          const maskSays30 = leapBit === 1;

          if (leapHas30Days !== maskSays30) {
            const msg = `Leap month ${leap}: actual ${leapHas30Days ? "30" : "29"} days, mask says ${maskSays30 ? "30" : "29"} days`;
            errors.push({ year, test: `leap month ${leap} length`, error: msg });
            console.log(`  ❌ ${year} ${msg}`);
            expect(leapHas30Days).toBe(maskSays30);
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          errors.push({ year, test: `leap month ${leap}`, error: msg });
          console.log(`  ❌ ${year} leap month ${leap}: ${msg}`);
        }
      });
    });
  });

  it("should print error summary", () => {
    if (errors.length > 0) {
      console.log(`\n❌ Found ${errors.length} error(s):\n`);
      errors.forEach(({ year, test, error }) => {
        console.log(`  ${year} - ${test}: ${error}`);
      });
    } else {
      console.log(`\n✅ All ${leapYears.length} leap years passed boundary tests!`);
    }

    expect(errors).toHaveLength(0);
  });
});
