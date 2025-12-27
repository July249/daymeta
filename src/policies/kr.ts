import { addDays, dayOfWeek } from "../utils/civil-date.js";

import type { HolidayItem } from "../types.js";
import type { SubstituteHolidayPolicy } from "./types.js";

interface EligibleHoliday {
  id: string;
  from: number;
}

interface SubstitutePolicyData {
  schema: string;
  eligible: EligibleHoliday[];
  rule: {
    ifOverlapsWeekend: boolean;
    ifOverlapsHoliday: boolean;
    nextNonHoliday: boolean;
  };
}

/**
 * Korean substitute holiday policy
 * Implements Korean government's substitute holiday rules
 */
export class KoreanSubstitutePolicy implements SubstituteHolidayPolicy {
  private readonly eligible: Map<string, number>; // id -> fromYear

  constructor(policyData: SubstitutePolicyData) {
    this.eligible = new Map(
      policyData.eligible.map((e) => [e.id, e.from])
    );
  }

  /**
   * Apply Korean substitute holiday rules
   */
  apply(year: number, baseHolidays: HolidayItem[]): HolidayItem[] {
    const substitutes: HolidayItem[] = [];
    const allHolidayDates = new Set(baseHolidays.map((h) => h.date));

    // Group holidays by date to detect overlaps
    const holidaysByDate = new Map<string, HolidayItem[]>();
    for (const holiday of baseHolidays) {
      if (!holidaysByDate.has(holiday.date)) {
        holidaysByDate.set(holiday.date, []);
      }
      holidaysByDate.get(holiday.date)!.push(holiday);
    }

    for (const holiday of baseHolidays) {
      // Check if eligible for substitute
      const fromYear = this.eligible.get(holiday.id);
      if (!fromYear || year < fromYear) {
        continue;
      }

      // Determine if this holiday needs a substitute
      let needsSubstitute = false;

      const dow = dayOfWeek(holiday.date);
      const isWeekend = dow === 0 || dow === 6;

      // Rule 1: Check for weekend overlap
      if (isWeekend && holiday.variant === "DAY") {
        needsSubstitute = true;
      }

      // Rule 2: Check for holiday overlap (two different holidays on same date)
      const sameDay = holidaysByDate.get(holiday.date) || [];
      const hasOverlap = sameDay.length > 1;

      if (hasOverlap) {
        // Only create substitute for the second+ holiday on the same date
        // (First holiday doesn't need substitute - it's the primary)
        const isSecondary = sameDay.indexOf(holiday) > 0;
        if (isSecondary && holiday.variant === "DAY") {
          needsSubstitute = true;
        }
      }

      // Rule 3: For Seollal/Chuseok: Check if ANY day in the 3-day range is Sunday
      // This is a special rule for Korean multi-day holidays
      if ((holiday.id === "KR_SEOLLAL" || holiday.id === "KR_CHUSEOK") && holiday.variant === "DAY") {
        // Check PRE, DAY, POST for Sunday
        const preDow = dayOfWeek(addDays(holiday.date, -1));
        const dayDow = dayOfWeek(holiday.date);
        const postDow = dayOfWeek(addDays(holiday.date, 1));

        if (preDow === 0 || dayDow === 0 || postDow === 0) {
          needsSubstitute = true;
        }
      }

      if (!needsSubstitute) {
        continue;
      }

      // Find next non-holiday, non-weekend day
      let substituteDate = addDays(holiday.date, 1);
      let maxAttempts = 10; // Increased safety limit

      while (maxAttempts > 0) {
        const dow = dayOfWeek(substituteDate);
        const isWeekendDay = dow === 0 || dow === 6;
        const isHoliday = allHolidayDates.has(substituteDate);

        if (!isWeekendDay && !isHoliday) {
          // Found a valid substitute date
          substitutes.push({
            date: substituteDate,
            id: "KR_SUBSTITUTE",
            kind: "SUBSTITUTE",
            name: "대체공휴일",
            nameEn: "Substitute Holiday",
            substituteFor: holiday.date,
          });

          // Add to set to prevent chaining issues
          allHolidayDates.add(substituteDate);
          break;
        }

        substituteDate = addDays(substituteDate, 1);
        maxAttempts--;
      }

      if (maxAttempts === 0) {
        console.warn(
          `Failed to find substitute date for ${holiday.date} after 10 attempts`
        );
      }
    }

    return substitutes;
  }

  get meta() {
    return {
      name: "KoreanSubstitutePolicy",
      country: "KR",
    };
  }
}

/**
 * Create KoreanSubstitutePolicy from JSON data file
 */
export async function createKoreanSubstitutePolicy(
  dataPath: string
): Promise<KoreanSubstitutePolicy> {
  const data = (await import(dataPath, {
    with: { type: "json" },
  })) as { default: SubstitutePolicyData };

  if (data.default.schema !== "kr.substitute.v1") {
    throw new Error(`Invalid substitute policy schema: ${data.default.schema}`);
  }

  return new KoreanSubstitutePolicy(data.default);
}
