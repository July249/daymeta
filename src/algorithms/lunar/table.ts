import {
  dayOfYear,
  formatYMD,
  parseYMD,
  ymdFromDayOfYear,
} from "@/utils/civil-date";

import type { LunarDate, YMD } from "@/types";

/**
 * Lunar data row for one year
 */
export interface LunarYearData {
  y: number; // Solar year
  ny: number; // Day-of-year (1..366) of lunar 1/1 in solar calendar
  leap: number; // Leap month position (0=none, 1..12=after that month)
  mask: string; // Hex string for month lengths (bit i-1 = monthIndex i)
}

/**
 * Table-based lunar calendar algorithm
 * Uses pre-computed (ny, leap, mask) data for solar↔lunar conversion
 */
export class TableLunarAlgorithm {
  private readonly dataMap: Map<number, LunarYearData>;
  private readonly yearRange: [number, number];

  constructor(data: LunarYearData[]) {
    this.dataMap = new Map(data.map((row) => [row.y, row]));

    const years = data.map((d) => d.y).sort((a, b) => a - b);
    this.yearRange = [years[0], years[years.length - 1]];
  }

  /**
   * Check if algorithm supports this solar year
   */
  supports(year: number): boolean {
    return year >= this.yearRange[0] && year <= this.yearRange[1];
  }

  /**
   * Get supported year range
   */
  getYearRange(): [number, number] {
    return this.yearRange;
  }

  /**
   * Convert solar date to lunar date
   *
   * Algorithm:
   * 1. Determine lunar year (LY):
   *    - If solarDOY >= row[SY].ny, then LY = SY
   *    - Otherwise LY = SY - 1
   * 2. Calculate days since lunar new year
   * 3. Iterate through months using mask to find month and day
   * 4. Handle leap month mapping
   */
  solarToLunar(date: YMD): LunarDate {
    const { y: solarYear, m: solarMonth, d: solarDay } = parseYMD(date);

    if (!this.supports(solarYear)) {
      throw new Error(
        `Solar year ${solarYear} out of range. Supported: ${this.yearRange[0]}-${this.yearRange[1]}`,
      );
    }

    const solarDOY = dayOfYear(date);
    const rowSY = this.dataMap.get(solarYear)!;

    // Determine lunar year
    let lunarYear: number;
    let lunarNewYearDOY: number;

    if (solarDOY >= rowSY.ny) {
      // Current solar year
      lunarYear = solarYear;
      lunarNewYearDOY = rowSY.ny;
    } else {
      // Previous solar year's lunar year
      lunarYear = solarYear - 1;
      const rowPrev = this.dataMap.get(solarYear - 1);
      if (!rowPrev) {
        throw new Error(
          `Cannot determine lunar year: missing data for ${solarYear - 1}`,
        );
      }
      lunarNewYearDOY = rowPrev.ny;

      // Adjust for year boundary: previous year's NY is in previous solar year
      // Need to calculate days from that point
      const prevYearEnd = dayOfYear(
        formatYMD({ y: solarYear - 1, m: 12, d: 31 }),
      );
      const daysSinceLunarNY = prevYearEnd - lunarNewYearDOY + solarDOY;

      return this.findLunarMonthDay(lunarYear, daysSinceLunarNY);
    }

    // Days since lunar new year (0-based)
    const daysSinceLunarNY = solarDOY - lunarNewYearDOY;

    return this.findLunarMonthDay(lunarYear, daysSinceLunarNY);
  }

  /**
   * Find lunar month and day given lunar year and days since lunar new year
   */
  private findLunarMonthDay(
    lunarYear: number,
    daysSinceLunarNY: number,
  ): LunarDate {
    const row = this.dataMap.get(lunarYear);
    if (!row) {
      throw new Error(`Missing data for lunar year ${lunarYear}`);
    }

    const { leap, mask } = row;
    const maskNum = parseInt(mask, 16);

    // Calculate total months (12 or 13)
    const totalMonths = leap > 0 ? 13 : 12;

    let daysAccum = 0;

    for (let monthIndex = 1; monthIndex <= totalMonths; monthIndex++) {
      // Month length: 29 or 30 based on bit (monthIndex-1)
      const monthLen = 29 + ((maskNum >> (monthIndex - 1)) & 1);

      if (daysSinceLunarNY < daysAccum + monthLen) {
        // Found the month
        const lunarDay = daysSinceLunarNY - daysAccum + 1; // 1-based

        // Map monthIndex to (month, isLeapMonth)
        let month: number;
        let isLeapMonth: boolean;

        if (leap === 0) {
          // No leap month
          month = monthIndex;
          isLeapMonth = false;
        } else {
          // Has leap month
          if (monthIndex <= leap) {
            month = monthIndex;
            isLeapMonth = false;
          } else if (monthIndex === leap + 1) {
            month = leap;
            isLeapMonth = true;
          } else {
            month = monthIndex - 1;
            isLeapMonth = false;
          }
        }

        return {
          year: lunarYear,
          month,
          day: lunarDay,
          isLeapMonth,
        };
      }

      daysAccum += monthLen;
    }

    throw new Error(
      `Failed to find lunar month/day for year ${lunarYear}, days ${daysSinceLunarNY}`,
    );
  }

  /**
   * Convert lunar date to solar date
   *
   * Algorithm:
   * 1. Get lunar year data
   * 2. Map (month, isLeapMonth) to monthIndex
   * 3. Sum days from months 1 to (monthIndex-1)
   * 4. Add (day - 1)
   * 5. Convert to solar DOY and then to YMD
   */
  lunarToSolar(lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  }): YMD {
    const { year: lunarYear, month, day, isLeapMonth } = lunar;

    if (!this.supports(lunarYear)) {
      throw new Error(
        `Lunar year ${lunarYear} out of range. Supported: ${this.yearRange[0]}-${this.yearRange[1]}`,
      );
    }

    const row = this.dataMap.get(lunarYear)!;
    const { ny, leap, mask } = row;
    const maskNum = parseInt(mask, 16);

    // Validate leap month input
    if (leap === 0) {
      // No leap month this year
      if (isLeapMonth) {
        throw new Error(
          `Lunar year ${lunarYear} has no leap month, but isLeapMonth=true`,
        );
      }
    } else {
      // Has leap month
      if (isLeapMonth && month !== leap) {
        throw new Error(
          `Lunar year ${lunarYear} leap month is ${leap}, but got month=${month} with isLeapMonth=true`,
        );
      }
    }

    // Calculate days from lunar 1/1 to this date
    let daysSinceLunarNY = 0;

    // Iterate through actual lunar months (not monthIndex)
    // We need to account for the leap month if it exists
    for (let m = 1; m < month; m++) {
      // Determine monthIndex for this month
      let idx: number;
      if (leap === 0) {
        idx = m;
      } else {
        if (m <= leap) {
          idx = m;
        } else {
          idx = m + 1;
        }
      }

      const monthLen = 29 + ((maskNum >> (idx - 1)) & 1);
      daysSinceLunarNY += monthLen;

      // If this is the leap month position, add the leap month too
      if (leap > 0 && m === leap) {
        const leapIdx = leap + 1;
        const leapMonthLen = 29 + ((maskNum >> (leapIdx - 1)) & 1);
        daysSinceLunarNY += leapMonthLen;
      }
    }

    // If we're IN the leap month, add the regular month first
    if (isLeapMonth && leap > 0 && month === leap) {
      const regularIdx = leap;
      const regularMonthLen = 29 + ((maskNum >> (regularIdx - 1)) & 1);
      daysSinceLunarNY += regularMonthLen;
    }

    daysSinceLunarNY += day - 1; // 0-based offset

    // Convert to solar date
    // Lunar NY is at row.ny in solar year (usually lunarYear, but could span to lunarYear+1)
    const lunarNYDate = ymdFromDayOfYear(lunarYear, ny);
    const { y: nyYear } = parseYMD(lunarNYDate);

    // Add daysSinceLunarNY to lunar new year date
    // Need to handle year boundary
    const solarDOY = ny + daysSinceLunarNY;
    const yearEnd = dayOfYear(formatYMD({ y: nyYear, m: 12, d: 31 }));

    if (solarDOY <= yearEnd) {
      // Within the same solar year
      return ymdFromDayOfYear(nyYear, solarDOY);
    } else {
      // Spills over to next year
      const nextYearDOY = solarDOY - yearEnd;
      return ymdFromDayOfYear(nyYear + 1, nextYearDOY);
    }
  }
}
