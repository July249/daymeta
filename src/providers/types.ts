import type { HolidayItem, LunarDate, SpecialItem, YMD } from "../types.js";

/**
 * Lunar calendar conversion provider
 * Converts between solar and lunar dates
 */
export interface LunarProvider {
  /**
   * Convert a solar date to lunar date
   * @param date - Solar date in YYYY-MM-DD format
   * @returns Lunar date information or null if not available
   */
  getLunar(date: YMD): Promise<LunarDate | null>;

  /**
   * Convert a lunar date to solar date
   * @param lunar - Lunar date components
   * @returns Solar date in YYYY-MM-DD format or null if not available
   */
  toSolar(lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  }): Promise<YMD | null>;

  /**
   * Provider metadata
   */
  readonly meta: {
    name: string;
    countries: string[]; // ISO 3166-1 alpha-2 codes: "KR", "JP", "CN"
    yearRange?: [number, number];
    requiresNetwork: boolean;
  };
}

/**
 * Holiday data provider
 * Provides base holiday information (excluding substitutes)
 */
export interface HolidayProvider {
  /**
   * Get base holidays for a specific year
   * Does NOT include substitute holidays - those are calculated by country policy
   * @param year - The year to fetch holidays for
   * @returns Array of base holiday items
   */
  getBaseHolidays(year: number): Promise<HolidayItem[]>;

  /**
   * Provider metadata
   */
  readonly meta: {
    name: string;
    country: string; // ISO 3166-1 alpha-2: "KR", "JP", "CN"
    yearRange?: [number, number];
  };
}

/**
 * Solar term provider (24 solar terms / 24절기)
 * Provides astronomical solar term data
 */
export interface SolarTermProvider {
  /**
   * Get solar terms for a specific year
   * @param year - The year to fetch solar terms for
   * @returns Array of solar term items
   */
  getSolarTerms(year: number): Promise<SpecialItem[]>;

  /**
   * Provider metadata
   */
  readonly meta: {
    name: string;
    country: string;
    yearRange?: [number, number];
    requiresNetwork: boolean;
  };
}

