import type { HolidayItem, SpecialItem, LunarDate, YMD } from "../types.js";

/**
 * Offline data structure
 */
export interface OfflineData {
  holidays: Record<string, HolidayItem[]>; // year -> holidays
  specials: Record<string, SpecialItem[]>; // year -> specials
  lunar: Record<YMD, LunarDate>; // date -> lunar
}

let cachedData: OfflineData | null = null;

/**
 * Load offline data from bundled JSON file
 */
export async function loadOfflineData(): Promise<OfflineData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    // Try to import the offline data file
    // @ts-expect-error - JSON import may not exist
    const data = await import("./offline-data.json", { assert: { type: "json" } });
    cachedData = data.default || data;
  } catch (error) {
    console.warn("Offline data file not found. Using empty data structure.");
    cachedData = {
      holidays: {},
      specials: {},
      lunar: {},
    };
  }

  return cachedData!;
}

/**
 * Get holidays for a year from offline data
 */
export async function getOfflineHolidays(year: number): Promise<HolidayItem[]> {
  const data = await loadOfflineData();
  return data.holidays[year] || [];
}

/**
 * Get specials for a year from offline data
 */
export async function getOfflineSpecials(year: number): Promise<SpecialItem[]> {
  const data = await loadOfflineData();
  return data.specials[year] || [];
}

/**
 * Get lunar date from offline data
 */
export async function getOfflineLunar(date: YMD): Promise<LunarDate | null> {
  const data = await loadOfflineData();
  return data.lunar[date] || null;
}
