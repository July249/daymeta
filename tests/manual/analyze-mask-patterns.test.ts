import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };

/**
 * Analyze mask patterns to detect potential issues
 */
describe("Analyze mask patterns for leap years", () => {
  const leapYears = lunarData.rows.filter((row) => row.leap > 0);

  console.log(`\nAnalyzing ${leapYears.length} leap year masks...\n`);

  const suspiciousYears: Array<{
    year: number;
    leap: number;
    mask: string;
    totalBits: number;
    expectedBits: number;
    issue: string;
  }> = [];

  leapYears.forEach((yearData) => {
    it(`should analyze mask for ${yearData.y} (leap month ${yearData.leap})`, () => {
      const year = yearData.y;
      const leap = yearData.leap;
      const mask = parseInt(yearData.mask, 16);
      const maskHex = yearData.mask;

      // Count total bits set
      let totalBits = 0;
      for (let i = 0; i < 13; i++) {
        if ((mask >> i) & 1) {
          totalBits++;
        }
      }

      // For leap year, we need 13 bits total
      // Reasonable range: 6-8 months of 30 days (bits set)
      const minExpected = 6;
      const maxExpected = 8;

      // Check if mask uses bits beyond bit 12 (invalid for 13-month year)
      const usesBit13OrHigher = mask >= 0x2000;

      // Check bit pattern
      let issue = "";
      if (usesBit13OrHigher) {
        issue = "Uses bit 13+ (invalid)";
      } else if (totalBits < minExpected) {
        issue = `Too few 30-day months (${totalBits} < ${minExpected})`;
      } else if (totalBits > maxExpected) {
        issue = `Too many 30-day months (${totalBits} > ${maxExpected})`;
      }

      if (issue) {
        suspiciousYears.push({
          year,
          leap,
          mask: maskHex,
          totalBits,
          expectedBits: 13,
          issue,
        });
        console.log(`  ⚠️  ${year} (leap ${leap}): ${maskHex} - ${issue}`);
      }

      // For this test, we just collect data, not fail
      expect(true).toBe(true);
    });
  });

  it("should print analysis summary", () => {
    if (suspiciousYears.length > 0) {
      console.log(`\n⚠️  Found ${suspiciousYears.length} suspicious mask(s):\n`);
      suspiciousYears.forEach(({ year, leap, mask, totalBits, issue }) => {
        console.log(`  ${year} (leap ${leap}): mask=${mask}, bits=${totalBits}/13, issue: ${issue}`);
      });
    } else {
      console.log(`\n✅ All ${leapYears.length} leap year masks look reasonable!`);
    }

    // This test is for analysis only, don't fail
    expect(true).toBe(true);
  });

  it("should verify 2023 mask was fixed correctly", () => {
    const year2023 = lunarData.rows.find((r) => r.y === 2023);
    expect(year2023).toBeDefined();
    expect(year2023!.mask).toBe("0x15AA");

    const mask = parseInt(year2023!.mask, 16);
    const binary = mask.toString(2).padStart(13, "0");
    console.log(`\n2023 mask verification:`);
    console.log(`  Hex: ${year2023!.mask}`);
    console.log(`  Binary: ${binary}`);
    console.log(`  Leap month: ${year2023!.leap}`);

    // Count bits
    let bits30 = 0;
    for (let i = 0; i < 13; i++) {
      if ((mask >> i) & 1) bits30++;
    }
    console.log(`  30-day months: ${bits30}/13`);

    // Verify bit 12 is set (month 12 should be 30 days)
    const bit12 = (mask >> 12) & 1;
    console.log(`  Bit 12 (month 12): ${bit12} (should be 1 for 30 days)`);

    expect(bit12).toBe(1);
  });
});
