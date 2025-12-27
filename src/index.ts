// Core exports
export { createCalendar, createKoreanCalendar } from "./core/factory.js";
export { configure, getGlobalContext } from "./core/configure.js";
export type { CalendarContext } from "./core/context.js";
export type { CalendarContextConfig } from "./core/context.js";

// Type exports
export type {
  YMD,
  DayInfo,
  HolidayItem,
  HolidayKind,
  SpecialItem,
  SpecialKind,
  LunarDate,
  ListHolidaysOptions,
  ListHolidaysResult,
} from "./types.js";

// Provider exports
export type { LunarProvider, HolidayProvider, SolarTermProvider } from "./providers/types.js";
export { TableLunarProvider, createTableLunarProvider } from "./providers/lunar/table.js";
export { JsonHolidayProvider, createJsonHolidayProvider } from "./providers/holiday/json.js";

// Policy exports
export type { SubstituteHolidayPolicy } from "./policies/types.js";
export { KoreanSubstitutePolicy, createKoreanSubstitutePolicy } from "./policies/kr.js";
export { registerPolicy, getPolicy, hasPolicy } from "./policies/registry.js";

// Utility exports
export {
  parseYMD,
  formatYMD,
  dayOfWeek,
  dayOfYear,
  ymdFromDayOfYear,
  addDays,
  isWeekend,
  isLeapYear,
  daysInYear,
  compareDate,
  isSameDate,
} from "./utils/civil-date.js";
export type { CivilDate } from "./utils/civil-date.js";

// NOTE: Algorithm abstractions (TableLunarAlgorithm, etc.) are implementation details
// and NOT exported per v1.0 plan principle #2. Public API users get pre-configured providers.
