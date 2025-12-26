#!/usr/bin/env node
import { writeFileSync } from "fs";
import { KasiClient } from "../src/kasi/client.js";
import { splitHolidaysAndSpecials } from "../src/kr/mappers.js";
import { getDatesInYear } from "../src/date/utils.js";
import type { OfflineData, YMD, LunarDate } from "../src/data/loader.js";

const SERVICE_KEY = process.env.KASI_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error("Error: KASI_SERVICE_KEY environment variable is required");
  process.exit(1);
}

const START_YEAR = 2020;
const END_YEAR = 2030;

async function generateOfflineData() {
  const client = new KasiClient(SERVICE_KEY!);
  const data: OfflineData = {
    holidays: {},
    specials: {},
    lunar: {},
  };

  console.log(`Generating offline data for years ${START_YEAR}-${END_YEAR}...`);

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    console.log(`Processing year ${year}...`);

    // Fetch holidays and specials
    try {
      const [holidayResponses, solarTermResponses] = await Promise.all([
        client.fetchSpecialDays(year),
        client.fetchSolarTerms(year),
      ]);

      const allResponses = [...holidayResponses, ...solarTermResponses];
      const { holidays, specials } = splitHolidaysAndSpecials(allResponses);

      data.holidays[year] = holidays;
      data.specials[year] = specials;

      console.log(`  - Holidays: ${holidays.length}, Specials: ${specials.length}`);
    } catch (error) {
      console.error(`  - Failed to fetch special days: ${error}`);
    }

    // Fetch lunar data for all dates in the year
    const dates = getDatesInYear(year);
    console.log(`  - Fetching lunar data for ${dates.length} dates...`);

    let successCount = 0;
    let failCount = 0;

    for (const date of dates) {
      try {
        const lunar = await client.fetchLunar(date);
        data.lunar[date as YMD] = lunar as LunarDate;
        successCount++;

        // Rate limiting: wait 50ms between requests
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        failCount++;
        if (failCount <= 5) {
          console.error(`  - Failed to fetch lunar for ${date}: ${error}`);
        }
      }
    }

    console.log(`  - Lunar data: ${successCount} success, ${failCount} failed`);
  }

  // Write to file
  const outputPath = "src/data/offline-data.json";
  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  console.log(`\nOffline data generated successfully!`);
  console.log(`Output: ${outputPath}`);
  console.log(`Total lunar entries: ${Object.keys(data.lunar).length}`);
}

generateOfflineData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
