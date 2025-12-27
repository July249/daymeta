/**
 * YYYY-MM-DD format date string
 */
export type YMD = `${number}-${string}-${string}`;

/**
 * Holiday classification
 */
export type HolidayKind = "STATUTORY" | "SUBSTITUTE" | "TEMPORARY" | "LOCAL";

/**
 * Special day classification
 */
export type SpecialKind = "SOLAR_TERM" | "SUNDRY" | "LUNAR_FESTIVAL";

/**
 * Lunar calendar date information
 */
export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  ganji?: {
    secha?: string;
    wolgeon?: string;
    iljin?: string;
  };
}

/**
 * Holiday information
 */
export interface HolidayItem {
  date: YMD;
  id: string;
  kind: HolidayKind;
  name: string;
  nameEn?: string;
  variant?: "PRE" | "DAY" | "POST";
  substituteFor?: YMD;
}

/**
 * Special day information (solar terms, festivals, etc.)
 */
export interface SpecialItem {
  date: YMD;
  name: string;
  kind: SpecialKind;
}

/**
 * Complete day information
 */
export interface DayInfo {
  date: YMD;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isWeekend: boolean;
  lunar?: LunarDate;
  holidays: HolidayItem[];
  specials: SpecialItem[];
}

/**
 * Options for listHolidays
 */
export interface ListHolidaysOptions {
  includeSubstitute?: boolean;
  includeSundays?: boolean;
  extraHolidays?: { date: YMD; id: string; name: string; kind: HolidayKind }[];
}

/**
 * Result of listHolidays
 */
export interface ListHolidaysResult {
  items: HolidayItem[];
  countExcludingSundays: number;
}

/**
 * KASI API response for lunar conversion
 */
export interface KasiLunarResponse {
  solYear: string;
  solMonth: string;
  solDay: string;
  lunYear: string;
  lunMonth: string;
  lunDay: string;
  lunLeapmonth: string;
  lunNday?: string;
  lunSecha?: string;
  lunWolgeon?: string;
  lunIljin?: string;
}

/**
 * KASI API response for special days
 */
export interface KasiSpecialDayResponse {
  locdate: string;
  dateName: string;
  dateKind: string;
  isHoliday: string;
  remarks?: string;
}
