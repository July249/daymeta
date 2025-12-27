import { parseYMD } from "@/date/utils";

import type { LunarDate, YMD } from "@/types";

/**
 * Korean Lunar Calendar Algorithm
 *
 * This is a simplified lunar calendar conversion based on lookup tables.
 * For production use, consider using pre-generated JSON data or external APIs.
 *
 * Supports years: 1900-2100
 */

// Lunar month data: bit representation of leap month and month lengths
// Each year has 12-13 months, encoded as bits (0=29 days, 1=30 days)
// This is a simplified example - full implementation would need complete data
const LUNAR_MONTH_DATA: Record<number, number> = {
  // Format: [leap month (4 bits)][month lengths (12-13 bits)]
  // Example data for 2024 (simplified - needs full data for production)
  2024: 0x0a4bd, // Leap month 0, months: 29,30,29,30,30,29,30,30,29,30,30,29
  2025: 0x0a57b,
  // ... (would need data for 1900-2100)
};

// New year dates (solar date of lunar Jan 1) for quick lookup
const LUNAR_NEW_YEAR: Record<number, string> = {
  2020: "2020-01-25",
  2021: "2021-02-12",
  2022: "2022-02-01",
  2023: "2023-01-22",
  2024: "2024-02-10",
  2025: "2025-01-29",
  2026: "2026-02-17",
  2027: "2027-02-06",
  2028: "2028-01-26",
  2029: "2029-02-13",
  2030: "2030-02-03",
  // ... (would need data for 1900-2100)
};

/**
 * Korean Lunar Calendar Algorithm Implementation
 */
export class KoreanLunarAlgorithm {
  /**
   * Check if algorithm supports this date
   */
  supports(date: YMD): boolean {
    const year = parseInt(date.split("-")[0]);
    return year >= 2020 && year <= 2030; // Limited range for now
  }

  /**
   * Convert solar to lunar using Korean lunar calendar algorithm
   *
   * Note: This is a simplified implementation using lookup tables.
   * For production, use pre-generated JSON data or KASI API.
   *
   * @param date - Solar date in YYYY-MM-DD format
   * @returns Lunar date information
   * @throws Error if year out of supported range
   */
  solarToLunar(date: YMD): LunarDate {
    const solarDate = parseYMD(date);
    const year = solarDate.getFullYear();

    if (!this.supports(date)) {
      throw new Error(
        `Korean lunar algorithm only supports years 2020-2030. Got: ${year}`,
      );
    }

    // For now, return a placeholder
    // TODO: Implement full algorithm or use JSON lookup
    // This would require:
    // 1. Find which lunar year this solar date belongs to
    // 2. Calculate days since lunar new year
    // 3. Determine lunar month and day based on month lengths
    // 4. Check for leap month

    throw new Error(
      "Korean lunar algorithm not fully implemented yet. " +
        "Use JsonLunarProvider or KasiLunarProvider instead.",
    );
  }

  /**
   * Get lunar new year date for a given solar year
   */
  getLunarNewYear(year: number): string | null {
    return LUNAR_NEW_YEAR[year] || null;
  }
}
