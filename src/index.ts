import type {
  YMD,
  DayInfo,
  GetDayInfoOptions,
  ListHolidaysOptions,
  ListHolidaysResult,
  BuildMonthGridOptions,
  HolidayItem,
  SpecialItem,
  LunarDate,
} from "./types.js";
import { getWeekday, isWeekend, generateMonthGrid, parseYMD } from "./date/utils.js";
import { KasiClient } from "./kasi/client.js";
import { splitHolidaysAndSpecials } from "./kr/mappers.js";
import { calculateSubstituteHolidays, mergeHolidays } from "./kr/holidayPolicy.js";
import { getOfflineHolidays, getOfflineSpecials, getOfflineLunar } from "./data/loader.js";

/**
 * Get comprehensive day information for a specific date
 */
export async function getDayInfo(date: YMD, opts: GetDayInfoOptions = {}): Promise<DayInfo> {
  const weekday = getWeekday(date);
  const weekend = isWeekend(date);

  let lunar: LunarDate | undefined;
  let holidays: HolidayItem[] = [];
  let specials: SpecialItem[] = [];

  if (opts.useOfflineData) {
    // Use offline data
    const year = parseYMD(date).getFullYear();
    const offlineLunar = await getOfflineLunar(date);
    if (offlineLunar) {
      lunar = offlineLunar;
    }

    const allHolidays = await getOfflineHolidays(year);
    holidays = allHolidays.filter((h) => h.date === date);

    const allSpecials = await getOfflineSpecials(year);
    specials = allSpecials.filter((s) => s.date === date);
  } else {
    // Use online KASI API
    const serviceKey = opts.serviceKey || process.env.KASI_SERVICE_KEY;
    if (!serviceKey) {
      throw new Error("KASI service key is required. Set KASI_SERVICE_KEY environment variable or pass serviceKey option.");
    }

    const client = new KasiClient(serviceKey);

    try {
      lunar = await client.fetchLunar(date);
    } catch (error) {
      console.warn(`Failed to fetch lunar data for ${date}:`, error);
    }

    // Get holidays and specials for the year
    const year = parseYMD(date).getFullYear();
    const yearHolidays = await listHolidays(year, {
      ...opts,
      includeSubstitute: true,
    });

    holidays = yearHolidays.items.filter((h) => h.date === date);

    // Fetch specials
    try {
      const [holidayResponses, solarTermResponses] = await Promise.all([
        client.fetchSpecialDays(year),
        client.fetchSolarTerms(year),
      ]);

      const allResponses = [...holidayResponses, ...solarTermResponses];
      const { specials: yearSpecials } = splitHolidaysAndSpecials(allResponses);
      specials = yearSpecials.filter((s) => s.date === date);
    } catch (error) {
      console.warn(`Failed to fetch specials for ${date}:`, error);
    }
  }

  return {
    date,
    weekday,
    isWeekend: weekend,
    lunar,
    holidays,
    specials,
  };
}

/**
 * List all holidays for a year
 */
export async function listHolidays(
  year: number,
  opts: ListHolidaysOptions = {}
): Promise<ListHolidaysResult> {
  const includeSubstitute = opts.includeSubstitute ?? true;
  const includeSundays = opts.includeSundays ?? false;

  let baseHolidays: HolidayItem[] = [];

  if (opts.useOfflineData) {
    baseHolidays = await getOfflineHolidays(year);
  } else {
    const serviceKey = opts.serviceKey || process.env.KASI_SERVICE_KEY;
    if (!serviceKey) {
      throw new Error("KASI service key is required. Set KASI_SERVICE_KEY environment variable or pass serviceKey option.");
    }

    const client = new KasiClient(serviceKey);

    try {
      const [holidayResponses, solarTermResponses] = await Promise.all([
        client.fetchSpecialDays(year),
        client.fetchSolarTerms(year),
      ]);

      const allResponses = [...holidayResponses, ...solarTermResponses];
      const { holidays } = splitHolidaysAndSpecials(allResponses);
      baseHolidays = holidays;
    } catch (error) {
      throw new Error(`Failed to fetch holidays for ${year}: ${error}`);
    }
  }

  // Add extra holidays if provided
  const extraHolidayItems: HolidayItem[] =
    opts.extraHolidays?.map((h) => ({
      date: h.date,
      name: h.name,
      kind: h.kind || "TEMPORARY",
    })) || [];

  // Calculate substitute holidays
  let substituteHolidays: HolidayItem[] = [];
  if (includeSubstitute) {
    substituteHolidays = calculateSubstituteHolidays(baseHolidays);
  }

  // Merge all holidays
  let allHolidays = mergeHolidays(baseHolidays, substituteHolidays, extraHolidayItems);

  // Filter out Sundays if requested
  if (!includeSundays) {
    allHolidays = allHolidays.filter((h) => getWeekday(h.date) !== 0);
  }

  // Count excluding Sundays
  const countExcludingSundays = allHolidays.filter((h) => getWeekday(h.date) !== 0).length;

  return {
    items: allHolidays,
    countExcludingSundays,
  };
}

/**
 * Build a calendar grid for a month (6 weeks x 7 days = 42 days)
 */
export async function buildMonthGrid(
  year: number,
  month: number,
  opts: BuildMonthGridOptions = {}
): Promise<DayInfo[]> {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }

  const grid = generateMonthGrid(year, month);

  // Fetch day info for all dates in parallel with concurrency limit
  const concurrencyLimit = 10;
  const results: DayInfo[] = [];

  for (let i = 0; i < grid.length; i += concurrencyLimit) {
    const batch = grid.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(batch.map((date) => getDayInfo(date, opts)));
    results.push(...batchResults);
  }

  return results;
}

// Re-export types
export type {
  YMD,
  DayInfo,
  HolidayItem,
  SpecialItem,
  LunarDate,
  GetDayInfoOptions,
  ListHolidaysOptions,
  ListHolidaysResult,
  BuildMonthGridOptions,
} from "./types.js";
