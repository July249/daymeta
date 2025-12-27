import { addDays, dayOfWeek, formatYMD, isWeekend } from "@/utils/civil-date";

import type {
  DayInfo,
  HolidayItem,
  ListHolidaysOptions,
  ListHolidaysResult,
  LunarDate,
  SpecialItem,
  YMD,
} from "../types.js";
import type { SubstituteHolidayPolicy } from "@/policies/types";
import type { HolidayProvider, LunarProvider } from "@/providers/types";

/**
 * Configuration for CalendarContext
 */
export interface CalendarContextConfig {
  /** ISO 3166-1 alpha-2 country code (e.g., "KR", "JP", "CN") */
  country: string;

  /** Lunar calendar provider (optional, uses default if not provided) */
  lunarProvider?: LunarProvider;

  /** Holiday provider (optional, uses default if not provided) */
  holidayProvider?: HolidayProvider;

  /** Substitute holiday policy (optional) */
  substitutePolicy?: SubstituteHolidayPolicy;
}

/**
 * CalendarContext orchestrates all providers to provide calendar information
 */
export class CalendarContext {
  private readonly country: string;
  private readonly lunarProvider?: LunarProvider;
  private readonly holidayProvider?: HolidayProvider;
  private readonly substitutePolicy?: SubstituteHolidayPolicy;

  // Caches
  private readonly yearHolidaysCache = new Map<number, HolidayItem[]>();

  constructor(config: CalendarContextConfig) {
    this.country = config.country;
    this.lunarProvider = config.lunarProvider;
    this.holidayProvider = config.holidayProvider;
    this.substitutePolicy = config.substitutePolicy;
  }

  /**
   * Get comprehensive day information for a specific date
   * @param date - Date in YYYY-MM-DD format
   * @returns Complete day information including lunar, holidays, and specials
   */
  async getDayInfo(date: YMD): Promise<DayInfo> {
    const weekday = dayOfWeek(date);
    const weekend = isWeekend(date);

    // Fetch all data in parallel
    const [lunar, holidays, specials] = await Promise.all([
      this.getLunarForDate(date),
      this.getHolidaysForDate(date),
      this.getSpecialsForDate(date),
    ]);

    return {
      date,
      weekday,
      isWeekend: weekend,
      lunar: lunar ?? undefined,
      holidays,
      specials,
    };
  }

  /**
   * List all holidays for a year
   * @param year - The year to fetch holidays for
   * @param options - Options for listing holidays
   * @returns List of holidays with count excluding Sundays
   */
  async listHolidays(
    year: number,
    options?: ListHolidaysOptions,
  ): Promise<ListHolidaysResult> {
    const opts = options ?? {};
    const includeSubstitute = opts.includeSubstitute ?? true;
    const includeSundays = opts.includeSundays ?? true;

    if (!this.holidayProvider) {
      return { items: [], countExcludingSundays: 0 };
    }

    // Create cache key (only cache when no extra holidays)
    const hasExtras = opts.extraHolidays && opts.extraHolidays.length > 0;
    const cacheKey = hasExtras ? null : includeSubstitute ? year : -year;

    // Check cache first (only if no extra holidays)
    if (cacheKey !== null) {
      const cached = this.yearHolidaysCache.get(cacheKey);
      if (cached) {
        // Apply includeSundays filter to cached result
        let holidays = cached;
        if (!includeSundays) {
          holidays = holidays.filter((h) => dayOfWeek(h.date) !== 0);
        }
        const countExcludingSundays = cached.filter(
          (h) => dayOfWeek(h.date) !== 0,
        ).length;
        return { items: holidays, countExcludingSundays };
      }
    }

    // 1. Get base holidays from provider
    let baseHolidays = await this.holidayProvider.getBaseHolidays(year);

    // 2. Add extra holidays to base (before substitute calculation)
    if (hasExtras) {
      const extraItems: HolidayItem[] = opts.extraHolidays!.map((h) => ({
        date: h.date,
        id: h.id,
        kind: h.kind,
        name: h.name,
      }));
      baseHolidays = this.mergeHolidays(baseHolidays, extraItems);
    }

    // 3. Calculate substitute holidays (based on base + extra)
    let holidays = baseHolidays;
    if (includeSubstitute && this.substitutePolicy) {
      const substitutes = this.substitutePolicy.apply(year, baseHolidays);
      holidays = [...baseHolidays, ...substitutes];
      holidays.sort((a, b) => a.date.localeCompare(b.date));
    }

    // Cache result (only if no extra holidays)
    if (cacheKey !== null) {
      this.yearHolidaysCache.set(cacheKey, holidays);
    }

    // 4. Filter out Sundays if requested
    let finalHolidays = holidays;
    if (!includeSundays) {
      finalHolidays = holidays.filter((h) => dayOfWeek(h.date) !== 0);
    }

    // 5. Count excluding Sundays (always calculated from all holidays before Sunday filter)
    const countExcludingSundays = holidays.filter(
      (h) => dayOfWeek(h.date) !== 0,
    ).length;

    return {
      items: finalHolidays,
      countExcludingSundays,
    };
  }

  /**
   * Build a calendar grid for a month (6 weeks × 7 days = 42 days)
   * @param year - Year
   * @param month - Month (1-12)
   * @returns Array of 42 DayInfo objects representing the calendar grid
   */
  async buildMonthGrid(year: number, month: number): Promise<DayInfo[]> {
    if (month < 1 || month > 12) {
      throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
    }

    const grid = this.generateMonthGrid(year, month);

    // Fetch day info for all dates with controlled concurrency
    return this.getDayInfoBatch(grid);
  }

  // Private helper methods

  /**
   * Get lunar date for a specific date
   */
  private async getLunarForDate(date: YMD): Promise<LunarDate | null> {
    if (!this.lunarProvider) {
      return null;
    }

    try {
      return await this.lunarProvider.getLunar(date);
    } catch (error) {
      console.warn(`Failed to fetch lunar data for ${date}:`, error);
      return null;
    }
  }

  /**
   * Get holidays for a specific date
   */
  private async getHolidaysForDate(date: YMD): Promise<HolidayItem[]> {
    if (!this.holidayProvider) {
      return [];
    }

    // Extract year from date
    const year = parseInt(date.split("-")[0]);

    // Use listHolidays to get all holidays (with caching)
    // This ensures consistent behavior with public API
    const result = await this.listHolidays(year, {
      includeSubstitute: true,
      includeSundays: true,
    });

    // Filter to this specific date
    return result.items.filter((h) => h.date === date);
  }

  /**
   * Get special days (solar terms, festivals) for a specific date
   */
  private async getSpecialsForDate(date: YMD): Promise<SpecialItem[]> {
    // For v1.0, specials are not implemented
    // Will be added in future versions
    return [];
  }

  /**
   * Generate 6x7 calendar grid for a month (starting with Sunday)
   */
  private generateMonthGrid(year: number, month: number): YMD[] {
    // First day of the month
    const firstDay = formatYMD({ y: year, m: month, d: 1 });
    const firstDayOfWeek = dayOfWeek(firstDay);

    // Start from the Sunday of the week containing the first day
    const startDate = addDays(firstDay, -firstDayOfWeek);

    // Generate 42 days (6 weeks)
    const grid: YMD[] = [];
    for (let i = 0; i < 42; i++) {
      grid.push(addDays(startDate, i));
    }

    return grid;
  }

  /**
   * Fetch day info for multiple dates with controlled concurrency
   */
  private async getDayInfoBatch(dates: YMD[]): Promise<DayInfo[]> {
    const concurrencyLimit = 10;
    const results: DayInfo[] = [];

    for (let i = 0; i < dates.length; i += concurrencyLimit) {
      const batch = dates.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map((date) => this.getDayInfo(date)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Merge multiple holiday arrays, removing duplicates
   */
  private mergeHolidays(...holidayArrays: HolidayItem[][]): HolidayItem[] {
    const seen = new Set<string>();
    const merged: HolidayItem[] = [];

    for (const holidays of holidayArrays) {
      for (const holiday of holidays) {
        const key = `${holiday.date}-${holiday.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(holiday);
        }
      }
    }

    // Sort by date
    merged.sort((a, b) => a.date.localeCompare(b.date));

    return merged;
  }
}
