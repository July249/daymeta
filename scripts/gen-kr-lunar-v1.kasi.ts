#!/usr/bin/env tsx
/**
 * Generate kr.lunar.v1.json from KASI API
 *
 * Usage:
 *   KASI_SERVICE_KEY=your_key tsx scripts/gen-kr-lunar-v1.kasi.ts
 *
 * This script generates offline lunar calendar table for years 1900-2050
 * by querying KASI's lunar calendar API (LrsrCldInfoService/getLunCalInfo).
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { getKasiLunCalInfo } from "../tests/helpers/kasi";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SERVICE_KEY = process.env.KASI_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error("Error: KASI_SERVICE_KEY environment variable is required");
  process.exit(1);
}

const START_YEAR = 1900;
const END_YEAR = 2050;

// Utility functions
function formatDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  return formatDate(y, m, d);
}

function dayOfYear(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  const y = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const diffMs = date.getTime() - yearStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 1-based
}

function getYear(dateStr: string): number {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.getUTCFullYear();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch lunar calendar info from KASI using helper
 */
async function fetchLunarInfo(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const result = await getKasiLunCalInfo({
    y: year,
    m: month,
    d: day,
    serviceKey: SERVICE_KEY,
  });
  return result;
}

/**
 * Find Lunar New Year (LNY) for a given lunar year
 * Search from Jan 15 to Mar 15 for lunYear=year, lunMonth=1, lunDay=1, isLeapMonth=false
 */
async function findLunarNewYear(year: number): Promise<string> {
  console.log(`Finding Lunar New Year for ${year}...`);

  // Search range: Jan 15 to Mar 15
  for (let month = 1; month <= 3; month++) {
    const startDay = month === 1 ? 15 : 1;
    const endDay = month === 3 ? 15 : new Date(year, month, 0).getDate();

    for (let day = startDay; day <= endDay; day++) {
      const dateStr = formatDate(year, month, day);
      try {
        const info = await fetchLunarInfo(dateStr);
        await sleep(100); // Rate limiting

        if (
          info.lunYear === year &&
          info.lunMonth === 1 &&
          info.lunDay === 1 &&
          !info.isLeapMonth
        ) {
          console.log(`  Found: ${dateStr}`);
          return dateStr;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  Warning: failed to fetch ${dateStr}: ${message}`);
      }
    }
  }

  throw new Error(`Could not find Lunar New Year for ${year}`);
}

interface YearRow {
  y: number;
  ny: number;
  leap: number;
  mask: string;
}

interface GenerateYearRowResult {
  row: YearRow;
  nextLnyDate: string | null;
}

/**
 * Generate lunar table row for a year
 */
async function generateYearRow(
  year: number,
  lnyDate: string,
  isLastYear = false,
): Promise<GenerateYearRowResult> {
  console.log(`Generating row for ${year}...`);

  const ny = dayOfYear(lnyDate);

  // Verify that lnyDate is in the correct year
  if (getYear(lnyDate) !== year) {
    throw new Error(`LNY date ${lnyDate} is not in year ${year}`);
  }

  const monthLens = new Array(13).fill(0); // [0, len1, len2, ..., len12]
  let leap = 0;
  let leapLen = 0;
  let monthStart = lnyDate;
  let nextLnyDate: string | null = null;
  let monthCount = 0;

  while (true) {
    let info;
    try {
      info = await fetchLunarInfo(monthStart);
      await sleep(100); // Rate limiting
    } catch (err) {
      // If we're on the last year and can't fetch next year's data, that's expected
      if (isLastYear && monthCount >= 12) {
        console.log(`  End of supported range (last year)`);
        nextLnyDate = null; // Won't be used for last year
        break;
      }
      throw err;
    }

    // lunDay must be 1 (start of month)
    if (info.lunDay !== 1) {
      throw new Error(
        `Logic error: expected lunDay=1, got ${info.lunDay} at ${monthStart}`,
      );
    }

    // Check if this is the start of next lunar year
    if (
      info.lunYear === year + 1 &&
      info.lunMonth === 1 &&
      !info.isLeapMonth
    ) {
      nextLnyDate = monthStart;
      console.log(`  Next LNY: ${nextLnyDate}`);
      break;
    }

    // Record month length
    if (info.isLeapMonth) {
      leap = info.lunMonth;
      leapLen = info.lunNday;
      console.log(`  Leap month ${info.lunMonth}: ${info.lunNday} days`);
      monthCount++;
    } else {
      monthLens[info.lunMonth] = info.lunNday;
      console.log(`  Month ${info.lunMonth}: ${info.lunNday} days`);
      monthCount++;
    }

    // Move to next month
    monthStart = addDays(monthStart, info.lunNday);
  }

  // Build mask
  let mask = 0;
  for (let m = 1; m <= 12; m++) {
    if (monthLens[m] === 30) {
      mask |= 1 << (m - 1);
    }
  }
  if (leap > 0 && leapLen === 30) {
    mask |= 1 << 12;
  }

  const row: YearRow = {
    y: year,
    ny,
    leap,
    mask: "0x" + mask.toString(16).toUpperCase(),
  };

  console.log(`  Row: ${JSON.stringify(row)}`);

  return { row, nextLnyDate };
}

interface LunarTable {
  schema: string;
  range: [number, number];
  rows: YearRow[];
}

/**
 * Main generation logic
 */
async function generateTable(): Promise<LunarTable> {
  console.log("=".repeat(60));
  console.log("Generating Korean Lunar Calendar Table (1900-2050)");
  console.log("=".repeat(60));

  const rows: YearRow[] = [];
  let currentLnyDate = await findLunarNewYear(START_YEAR);

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const isLastYear = year === END_YEAR;
    const { row, nextLnyDate } = await generateYearRow(
      year,
      currentLnyDate,
      isLastYear,
    );
    rows.push(row);
    if (nextLnyDate) {
      currentLnyDate = nextLnyDate;
    }
  }

  const table: LunarTable = {
    schema: "kr.lunar.v1",
    range: [START_YEAR, END_YEAR],
    rows,
  };

  return table;
}

/**
 * Validate generated data
 */
function validateTable(table: LunarTable): void {
  console.log("\n" + "=".repeat(60));
  console.log("Validating generated data...");
  console.log("=".repeat(60));

  const row2025 = table.rows.find((r) => r.y === 2025);
  const row2026 = table.rows.find((r) => r.y === 2026);

  if (!row2025) {
    throw new Error("Missing row for year 2025");
  }
  if (!row2026) {
    throw new Error("Missing row for year 2026");
  }

  console.log("2025:", row2025);
  console.log("2026:", row2026);

  // Validate 2025-01-29 is LNY 2025 (DOY = 29)
  if (row2025.ny !== 29) {
    throw new Error(`Expected ny=29 for 2025, got ${row2025.ny}`);
  }
  console.log("✓ 2025 ny=29 (2025-01-29)");

  // Validate 2026-02-17 is LNY 2026 (DOY = 48)
  if (row2026.ny !== 48) {
    throw new Error(`Expected ny=48 for 2026, got ${row2026.ny}`);
  }
  console.log("✓ 2026 ny=48 (2026-02-17)");

  // Validate 2025 has leap month 6
  if (row2025.leap !== 6) {
    throw new Error(`Expected leap=6 for 2025, got ${row2025.leap}`);
  }
  console.log("✓ 2025 leap=6 (윤6월)");

  console.log("\nAll validations passed!");
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    const table = await generateTable();
    validateTable(table);

    // Write to file
    const outputDir = join(__dirname, "../src/data/lunar");
    mkdirSync(outputDir, { recursive: true });
    const outputPath = join(outputDir, "kr.lunar.v1.json");
    const json = JSON.stringify(table, null, 2);
    writeFileSync(outputPath, json, "utf8");

    console.log("\n" + "=".repeat(60));
    console.log(`Successfully wrote ${table.rows.length} rows to:`);
    console.log(outputPath);
    console.log("=".repeat(60));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("\nError:", message);
    console.error(stack);
    process.exit(1);
  }
}

main();
