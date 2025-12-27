import type { YMD } from "../types.js";

/**
 * Civil date representation (year, month, day)
 */
export interface CivilDate {
  y: number;
  m: number;
  d: number;
}

/**
 * Parse YMD string to civil date components
 * @param ymd - Date string in YYYY-MM-DD format
 * @returns Civil date object
 */
export function parseYMD(ymd: YMD): CivilDate {
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m, d };
}

/**
 * Format civil date to YMD string
 * @param civil - Civil date object
 * @returns YMD string
 */
export function formatYMD(civil: CivilDate): YMD {
  const { y, m, d } = civil;
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}` as YMD;
}

/**
 * Get day of week (0=Sunday, 6=Saturday) using UTC
 * @param ymd - Date string in YYYY-MM-DD format
 * @returns Day of week (0-6)
 */
export function dayOfWeek(ymd: YMD): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const { y, m, d } = parseYMD(ymd);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Check if year is a leap year
 * @param year - Year
 * @returns True if leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get days in year (365 or 366)
 * @param year - Year
 * @returns Number of days
 */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Get day of year (1-366)
 * @param ymd - Date string in YYYY-MM-DD format
 * @returns Day of year (1-based)
 */
export function dayOfYear(ymd: YMD): number {
  const { y, m, d } = parseYMD(ymd);
  const date = new Date(Date.UTC(y, m - 1, d));
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const diffMs = date.getTime() - yearStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 1-based
}

/**
 * Convert day of year to YMD
 * @param year - Year
 * @param doy - Day of year (1-366)
 * @returns YMD string
 */
export function ymdFromDayOfYear(year: number, doy: number): YMD {
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const targetMs = yearStart.getTime() + (doy - 1) * 24 * 60 * 60 * 1000;
  const targetDate = new Date(targetMs);

  const y = targetDate.getUTCFullYear();
  const m = targetDate.getUTCMonth() + 1;
  const d = targetDate.getUTCDate();

  return formatYMD({ y, m, d });
}

/**
 * Add days to a date
 * @param ymd - Date string in YYYY-MM-DD format
 * @param delta - Number of days to add (can be negative)
 * @returns New YMD string
 */
export function addDays(ymd: YMD, delta: number): YMD {
  const { y, m, d } = parseYMD(ymd);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + delta);

  const newY = date.getUTCFullYear();
  const newM = date.getUTCMonth() + 1;
  const newD = date.getUTCDate();

  return formatYMD({ y: newY, m: newM, d: newD });
}

/**
 * Check if date is weekend (Saturday or Sunday)
 * @param ymd - Date string in YYYY-MM-DD format
 * @returns True if weekend
 */
export function isWeekend(ymd: YMD): boolean {
  const dow = dayOfWeek(ymd);
  return dow === 0 || dow === 6;
}
