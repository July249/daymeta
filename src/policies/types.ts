import type { HolidayItem } from "../types.js";

/**
 * Substitute holiday policy interface
 * Determines when and how substitute holidays are created
 */
export interface SubstituteHolidayPolicy {
  /**
   * Apply substitute holiday rules to base holidays
   * @param year - The year to process
   * @param baseHolidays - Base holidays (already sorted by date)
   * @returns Additional substitute holidays
   */
  apply(year: number, baseHolidays: HolidayItem[]): HolidayItem[];

  /**
   * Policy metadata
   */
  readonly meta: {
    name: string;
    country: string;
  };
}
