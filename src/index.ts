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
} from "./utils/civil-date.js";

// Algorithm exports
export { TableLunarAlgorithm } from "./algorithms/lunar/table.js";
export type { LunarYearData } from "./algorithms/lunar/table.js";
