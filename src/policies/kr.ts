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

    for (const holiday of baseHolidays) {
      // Check if eligible for substitute
      const fromYear = this.eligible.get(holiday.id);
      if (!fromYear || year < fromYear) {
        continue;
      }

      // Only apply to "DAY" variant (not PRE/POST padding days)
      if (holiday.variant !== "DAY") {
        continue;
      }

      // Check if overlaps weekend or another holiday
      const dow = dayOfWeek(holiday.date);
      const isWeekend = dow === 0 || dow === 6;

      if (!isWeekend) {
        // Not a weekend, no substitute needed (unless overlaps with another holiday)
        // For simplicity, we skip this case for now
        // TODO: Handle holiday-on-holiday case if needed
        continue;
      }

      // Find next non-holiday, non-weekend day
      let substituteDate = addDays(holiday.date, 1);
      let maxAttempts = 7; // Safety limit

      while (maxAttempts > 0) {
        const dow = dayOfWeek(substituteDate);
        const isWeekend = dow === 0 || dow === 6;
        const isHoliday = allHolidayDates.has(substituteDate);

        if (!isWeekend && !isHoliday) {
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
          `Failed to find substitute date for ${holiday.date} after 7 attempts`
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
