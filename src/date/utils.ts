import type { YMD } from "@/types";

/**
 * Parse YMD string to Date object (assumes KST timezone conceptually)
 */
export function parseYMD(ymd: YMD): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format Date to YMD string
 */
export function formatYMD(date: Date): YMD {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}` as YMD;
}

/**
 * Get weekday (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function getWeekday(ymd: YMD): 0 | 1 | 2 | 3 | 4 | 5 | 6 {
  const date = parseYMD(ymd);
  return date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Check if a date is weekend (Saturday or Sunday)
 */
export function isWeekend(ymd: YMD): boolean {
  const weekday = getWeekday(ymd);
  return weekday === 0 || weekday === 6;
}

/**
 * Add days to a YMD date
 */
export function addDays(ymd: YMD, days: number): YMD {
  const date = parseYMD(ymd);
  date.setDate(date.getDate() + days);
  return formatYMD(date);
}

/**
 * Get the first day of the month
 */
export function getFirstDayOfMonth(year: number, month: number): YMD {
  const monthStr = String(month).padStart(2, "0");
  return `${year}-${monthStr}-01` as YMD;
}

/**
 * Get the last day of the month
 */
export function getLastDayOfMonth(year: number, month: number): YMD {
  const date = new Date(year, month, 0);
  return formatYMD(date);
}

/**
 * Generate calendar grid for a month (6 weeks x 7 days = 42 days)
 * Includes previous and next month dates to fill the grid
 */
export function generateMonthGrid(year: number, month: number): YMD[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const firstWeekday = getWeekday(firstDay);

  // Start from the Sunday of the week containing the first day
  const startDate = addDays(firstDay, -firstWeekday);

  // Generate 42 days (6 weeks)
  const grid: YMD[] = [];
  for (let i = 0; i < 42; i++) {
    grid.push(addDays(startDate, i));
  }

  return grid;
}

/**
 * Check if two YMD dates are equal
 */
export function isSameDate(a: YMD, b: YMD): boolean {
  return a === b;
}

/**
 * Compare two YMD dates
 * Returns: negative if a < b, 0 if a === b, positive if a > b
 */
export function compareDate(a: YMD, b: YMD): number {
  return a.localeCompare(b);
}

/**
 * Get all dates in a year
 */
export function getDatesInYear(year: number): YMD[] {
  const dates: YMD[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatYMD(new Date(d)));
  }

  return dates;
}
