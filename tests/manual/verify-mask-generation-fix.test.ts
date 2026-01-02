import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

/**
 * BUGGY mask generation (original)
 */
function buildMaskBuggy(monthLens: number[], leap: number, leapLen: number): number {
  let mask = 0;
  for (let m = 1; m <= 12; m++) {
    if (monthLens[m] === 30) {
      mask |= 1 << (m - 1);
    }
  }
  if (leap > 0 && leapLen === 30) {
    mask |= 1 << 12;
  }
  return mask;
}

/**
 * FIXED mask generation (new)
 */
function buildMaskFixed(monthLens: number[], leap: number, leapLen: number): number {
  let mask = 0;
  let bitIndex = 0;

  for (let m = 1; m <= 12; m++) {
    // Set bit for regular month m
    if (monthLens[m] === 30) {
      mask |= 1 << bitIndex;
    }
    bitIndex++;

    // If this is the leap month position, add leap month bit
    if (m === leap && leap > 0) {
      if (leapLen === 30) {
        mask |= 1 << bitIndex;
      }
      bitIndex++;
    }
  }

  return mask;
}

/**
 * Extract month lengths from current JSON data by reverse-engineering
 */
function extractMonthLengths(
  yearData: (typeof lunarData.rows)[0],
  nextYearData: (typeof lunarData.rows)[0] | undefined,
): { monthLens: number[]; leapLen: number } | null {
  if (!nextYearData) {
    return null; // Can't calculate for last year
  }

  const algorithm = new TableLunarAlgorithm([yearData, nextYearData]);
  const year = yearData.y;
  const leap = yearData.leap;

  // Extract month lengths by converting lunar dates to solar
  const monthLens: number[] = [0]; // monthLens[0] unused
  let leapLen = 0;

  for (let m = 1; m <= 12; m++) {
    try {
      // Find the length of month m
      // Convert lunar (year, m, 1) to solar
      const day1Solar = algorithm.lunarToSolar({
        year,
        month: m,
        day: 1,
        isLeapMonth: false,
      });

      // Try day 30 first
      let monthLen = 29;
      try {
        algorithm.lunarToSolar({
          year,
          month: m,
          day: 30,
          isLeapMonth: false,
        });
        monthLen = 30;
      } catch {
        // Month has 29 days
      }

      monthLens.push(monthLen);

      // If this is the leap month, get leap month length
      if (m === leap && leap > 0) {
        try {
          algorithm.lunarToSolar({
            year,
            month: m,
            day: 30,
            isLeapMonth: true,
          });
          leapLen = 30;
        } catch {
          leapLen = 29;
        }
      }
    } catch (error) {
      console.error(`Failed to extract month ${m} for year ${year}:`, error);
      return null;
    }
  }

  return { monthLens, leapLen };
}

describe("Verify mask generation fix", () => {
  const leapYears = lunarData.rows.filter((row) => row.leap > 0);

  console.log(`\nVerifying mask generation for ${leapYears.length} leap years...\n`);

  const problematicYears: Array<{
    year: number;
    leap: number;
    current: string;
    buggy: string;
    fixed: string;
    status: string;
  }> = [];

  leapYears.forEach((yearData, index) => {
    it(`should verify mask for ${yearData.y} (leap month ${yearData.leap})`, () => {
      const year = yearData.y;
      const leap = yearData.leap;
      const currentMask = parseInt(yearData.mask, 16);

      // Get next year data
      const nextYearData = lunarData.rows.find((r) => r.y === year + 1);
      if (!nextYearData) {
        console.log(`  ⚠️  ${year}: Skipped (last year in range)`);
        return;
      }

      // Extract month lengths
      const extracted = extractMonthLengths(yearData, nextYearData);
      if (!extracted) {
        console.log(`  ⚠️  ${year}: Failed to extract month lengths`);
        return;
      }

      const { monthLens, leapLen } = extracted;

      // Calculate masks with both methods
      const buggyMask = buildMaskBuggy(monthLens, leap, leapLen);
      const fixedMask = buildMaskFixed(monthLens, leap, leapLen);

      const currentHex = "0x" + currentMask.toString(16).toUpperCase();
      const buggyHex = "0x" + buggyMask.toString(16).toUpperCase();
      const fixedHex = "0x" + fixedMask.toString(16).toUpperCase();

      let status = "";
      if (currentMask === fixedMask) {
        status = "✅ OK (matches fixed)";
      } else if (currentMask === buggyMask) {
        status = "❌ BUG (matches buggy, should be fixed!)";
        problematicYears.push({
          year,
          leap,
          current: currentHex,
          buggy: buggyHex,
          fixed: fixedHex,
          status: "NEEDS_FIX",
        });
      } else {
        status = "⚠️  UNKNOWN (matches neither)";
        problematicYears.push({
          year,
          leap,
          current: currentHex,
          buggy: buggyHex,
          fixed: fixedHex,
          status: "UNKNOWN",
        });
      }

      if (currentMask !== fixedMask) {
        console.log(`  ${status}`);
        console.log(
          `    Year ${year} (leap ${leap}): current=${currentHex}, buggy=${buggyHex}, fixed=${fixedHex}`,
        );
      }

      // Expect current mask to match fixed mask
      expect(currentMask).toBe(fixedMask);
    });
  });

  it("should print summary of problematic years", () => {
    if (problematicYears.length > 0) {
      console.log(`\n❌ Found ${problematicYears.length} problematic year(s):\n`);
      problematicYears.forEach(({ year, leap, current, buggy, fixed, status }) => {
        console.log(`  ${year} (leap ${leap}):`);
        console.log(`    Current: ${current}`);
        console.log(`    Buggy:   ${buggy}`);
        console.log(`    Fixed:   ${fixed}`);
        console.log(`    Status:  ${status}`);
        console.log("");
      });
    } else {
      console.log(`\n✅ All ${leapYears.length} leap years have correct masks!`);
    }

    expect(problematicYears).toHaveLength(0);
  });
});
