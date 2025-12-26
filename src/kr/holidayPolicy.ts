import type { HolidayItem } from "../types.js";
import { addDays, getWeekday } from "../date/utils.js";

/**
 * Configuration for substitute holiday policy
 */
export interface SubstituteHolidayPolicy {
  /**
   * List of holiday names that are eligible for substitute holidays
   * If empty, all holidays are eligible
   */
  eligibleHolidays?: string[];

  /**
   * Whether to apply substitute holidays for holidays that fall on Saturday
   */
  applySaturday?: boolean;

  /**
   * Whether to apply substitute holidays for holidays that fall on Sunday
   */
  applySunday?: boolean;
}

const DEFAULT_POLICY: SubstituteHolidayPolicy = {
  eligibleHolidays: [],
  applySaturday: true,
  applySunday: true,
};

/**
 * Calculate substitute holidays for a list of holidays
 */
export function calculateSubstituteHolidays(
  holidays: HolidayItem[],
  policy: SubstituteHolidayPolicy = DEFAULT_POLICY
): HolidayItem[] {
  const mergedPolicy = { ...DEFAULT_POLICY, ...policy };
  const substituteHolidays: HolidayItem[] = [];

  // Create a Set of all holiday dates for quick lookup
  const holidayDates = new Set(holidays.map((h) => h.date));

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  for (const holiday of sortedHolidays) {
    // Skip if not eligible
    if (
      mergedPolicy.eligibleHolidays &&
      mergedPolicy.eligibleHolidays.length > 0 &&
      !mergedPolicy.eligibleHolidays.includes(holiday.name)
    ) {
      continue;
    }

    const weekday = getWeekday(holiday.date);
    const isSaturday = weekday === 6;
    const isSunday = weekday === 0;

    // Check if substitute should be applied (weekend only)
    const shouldApply =
      (isSaturday && mergedPolicy.applySaturday) ||
      (isSunday && mergedPolicy.applySunday);

    if (!shouldApply) {
      continue;
    }

    // Find next available non-holiday, non-weekend day
    let candidateDate = addDays(holiday.date, 1);
    let attempts = 0;
    const maxAttempts = 14; // Prevent infinite loop

    while (attempts < maxAttempts) {
      const candidateWeekday = getWeekday(candidateDate);
      const isWeekend = candidateWeekday === 0 || candidateWeekday === 6;
      const isHoliday = holidayDates.has(candidateDate);

      if (!isWeekend && !isHoliday) {
        // Found a valid substitute date
        const substituteHoliday: HolidayItem = {
          date: candidateDate,
          name: `${holiday.name} 대체공휴일`,
          kind: "SUBSTITUTE",
          substituteFor: holiday.date,
        };

        substituteHolidays.push(substituteHoliday);
        holidayDates.add(candidateDate); // Add to set to prevent future conflicts
        break;
      }

      candidateDate = addDays(candidateDate, 1);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn(`Could not find substitute holiday for ${holiday.name} on ${holiday.date}`);
    }
  }

  return substituteHolidays;
}

/**
 * Merge base holidays with substitute holidays
 */
export function mergeHolidays(
  baseHolidays: HolidayItem[],
  substituteHolidays: HolidayItem[],
  extraHolidays: HolidayItem[] = []
): HolidayItem[] {
  const allHolidays = [...baseHolidays, ...substituteHolidays, ...extraHolidays];

  // Sort by date
  return allHolidays.sort((a, b) => a.date.localeCompare(b.date));
}
