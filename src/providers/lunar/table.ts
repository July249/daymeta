import { type LunarYearData, TableLunarAlgorithm } from "../../algorithms/lunar/table.js";

import type { LunarDate, YMD } from "../../types.js";
import type { LunarProvider } from "../types.js";

/**
 * Table-based lunar calendar provider
 * Uses pre-computed lunar data for offline operation
 */
export class TableLunarProvider implements LunarProvider {
  private readonly algorithm: TableLunarAlgorithm;
  private readonly country: string;

  constructor(country: string, data: LunarYearData[]) {
    this.country = country;
    this.algorithm = new TableLunarAlgorithm(data);
  }

  /**
   * Convert solar date to lunar date
   */
  async getLunar(date: YMD): Promise<LunarDate | null> {
    try {
      return this.algorithm.solarToLunar(date);
    } catch (error) {
      console.warn(`TableLunarProvider.getLunar failed for ${date}:`, error);
      return null;
    }
  }

  /**
   * Convert lunar date to solar date
   */
  async toSolar(lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  }): Promise<YMD | null> {
    try {
      return this.algorithm.lunarToSolar(lunar);
    } catch (error) {
      console.warn(`TableLunarProvider.toSolar failed:`, error);
      return null;
    }
  }

  get meta() {
    return {
      name: "TableLunarProvider",
      countries: [this.country],
      yearRange: this.algorithm.getYearRange() as [number, number],
      requiresNetwork: false,
    };
  }
}

/**
 * Create TableLunarProvider from JSON data file
 */
export async function createTableLunarProvider(
  country: string,
  dataPath: string
): Promise<TableLunarProvider> {
  const data = await import(dataPath, { with: { type: "json" } });

  if (data.default.schema !== "kr.lunar.v1") {
    throw new Error(`Invalid lunar data schema: ${data.default.schema}`);
  }

  return new TableLunarProvider(country, data.default.rows);
}
