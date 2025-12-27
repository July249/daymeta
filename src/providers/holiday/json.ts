import { addDays, formatYMD } from "../../utils/civil-date.js";

import type { HolidayItem, HolidayKind } from "../../types.js";
import type { HolidayProvider } from "../types.js";
import type { LunarProvider } from "../types.js";

/**
 * Holiday rule types
 */
interface FixedSolarRule {
  type: "fixed_solar";
  month: number;
  day: number;
}

interface FixedLunarRule {
  type: "fixed_lunar";
  month: number;
  day: number;
  pad?: {
    before?: number;
    after?: number;
  };
}

type HolidayRule = FixedSolarRule | FixedLunarRule;

interface HolidayRuleData {
  id: string;
  kind: HolidayKind;
  names: {
    ko: string;
    en?: string;
  };
  rule: HolidayRule;
}

interface HolidayRulesData {
  schema: string;
  country: string;
  rules: HolidayRuleData[];
}

/**
 * JSON-based holiday provider
 * Processes rule-based holiday definitions
 */
export class JsonHolidayProvider implements HolidayProvider {
  private readonly country: string;
  private readonly rules: HolidayRuleData[];
  private readonly lunarProvider?: LunarProvider;
  private readonly cache = new Map<number, HolidayItem[]>();

  constructor(
    country: string,
    rules: HolidayRuleData[],
    lunarProvider?: LunarProvider
  ) {
    this.country = country;
    this.rules = rules;
    this.lunarProvider = lunarProvider;
  }

  /**
   * Get base holidays for a specific year
   * Does NOT include substitute holidays
   */
  async getBaseHolidays(year: number): Promise<HolidayItem[]> {
    // Check cache
    if (this.cache.has(year)) {
      return this.cache.get(year)!;
    }

    const holidays: HolidayItem[] = [];

    for (const ruleData of this.rules) {
      const items = await this.processRule(year, ruleData);
      holidays.push(...items);
    }

    // Sort by date
    holidays.sort((a, b) => a.date.localeCompare(b.date));

    // Cache result
    this.cache.set(year, holidays);

    return holidays;
  }

  /**
   * Process a single holiday rule for a given year
   */
  private async processRule(
    year: number,
    ruleData: HolidayRuleData
  ): Promise<HolidayItem[]> {
    const { id, kind, names, rule } = ruleData;

    if (rule.type === "fixed_solar") {
      // Solar holiday - simple
      const date = formatYMD({ y: year, m: rule.month, d: rule.day });

      return [
        {
          date,
          id,
          kind,
          name: names.ko,
          nameEn: names.en,
          variant: "DAY",
        },
      ];
    } else if (rule.type === "fixed_lunar") {
      // Lunar holiday - requires lunar provider
      if (!this.lunarProvider) {
        console.warn(
          `Cannot process lunar holiday ${id}: no lunar provider available`
        );
        return [];
      }

      // Convert lunar date to solar
      const baseDate = await this.lunarProvider.toSolar({
        year,
        month: rule.month,
        day: rule.day,
        isLeapMonth: false,
      });

      if (!baseDate) {
        console.warn(
          `Failed to convert lunar date to solar for ${id} in year ${year}`
        );
        return [];
      }

      const items: HolidayItem[] = [];

      // Apply padding
      const before = rule.pad?.before ?? 0;
      const after = rule.pad?.after ?? 0;

      // Generate dates: [baseDate - before, ..., baseDate, ..., baseDate + after]
      for (let offset = -before; offset <= after; offset++) {
        const date = addDays(baseDate, offset);

        let variant: "PRE" | "DAY" | "POST";
        if (offset < 0) {
          variant = "PRE";
        } else if (offset > 0) {
          variant = "POST";
        } else {
          variant = "DAY";
        }

        items.push({
          date,
          id,
          kind,
          name: names.ko,
          nameEn: names.en,
          variant,
        });
      }

      return items;
    }

    return [];
  }

  get meta() {
    return {
      name: "JsonHolidayProvider",
      country: this.country,
    };
  }
}

/**
 * Create JsonHolidayProvider from JSON data file
 */
export async function createJsonHolidayProvider(
  dataPath: string,
  lunarProvider?: LunarProvider
): Promise<JsonHolidayProvider> {
  const data = (await import(dataPath, {
    with: { type: "json" },
  })) as { default: HolidayRulesData };

  if (data.default.schema !== "holiday.rules.v1") {
    throw new Error(`Invalid holiday rules schema: ${data.default.schema}`);
  }

  return new JsonHolidayProvider(
    data.default.country,
    data.default.rules,
    lunarProvider
  );
}
