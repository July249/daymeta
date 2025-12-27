import { CalendarContext, type CalendarContextConfig } from "@/core/context";
import { KoreanSubstitutePolicy } from "@/policies/kr";
import { JsonHolidayProvider } from "@/providers/holiday/json";
import { TableLunarProvider } from "@/providers/lunar/table";

import type { LunarYearData } from "@/algorithms/lunar/table";

/**
 * Create a calendar instance for a specific country
 *
 * @example
 * ```typescript
 * // Create a calendar (providers must be provided)
 * const calendar = createCalendar({
 *   country: 'KR',
 *   lunarProvider,
 *   holidayProvider,
 *   substitutePolicy,
 * });
 * const info = await calendar.getDayInfo('2024-01-01');
 * ```
 *
 * @example
 * ```typescript
 * // For Korea, use createKoreanCalendar() helper instead
 * const calendar = await createKoreanCalendar();
 * ```
 *
 * @param config - Calendar configuration
 * @returns CalendarContext instance
 */
export function createCalendar(config: CalendarContextConfig): CalendarContext {
  return new CalendarContext(config);
}

/**
 * Create a pre-configured calendar for Korea
 * Includes TableLunarProvider, JsonHolidayProvider, and KoreanSubstitutePolicy
 *
 * @example
 * ```typescript
 * const calendar = await createKoreanCalendar();
 * const holidays = await calendar.listHolidays(2025);
 * ```
 *
 * @returns CalendarContext instance configured for Korea
 */
export async function createKoreanCalendar(): Promise<CalendarContext> {
  // Load lunar data
  const lunarData = await import("../data/lunar/kr.lunar.v1.json", {
    with: { type: "json" },
  });

  const lunarProvider = new TableLunarProvider(
    "KR",
    lunarData.default.rows as LunarYearData[],
  );

  // Load holiday rules
  const holidayRules = await import("../data/holidays/kr.rules.v1.json", {
    with: { type: "json" },
  });

  const holidayProvider = new JsonHolidayProvider(
    "KR",
    holidayRules.default.rules as any,
    lunarProvider,
  );

  // Load substitute policy
  const policyData = await import("../data/policies/kr.substitute.v1.json", {
    with: { type: "json" },
  });

  const substitutePolicy = new KoreanSubstitutePolicy(
    policyData.default as any,
  );

  return new CalendarContext({
    country: "KR",
    lunarProvider,
    holidayProvider,
    substitutePolicy,
  });
}
