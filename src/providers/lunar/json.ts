import type { LunarDate, YMD } from "../../types.js";
import type { LunarProvider } from "../types.js";

/**
 * JSON-based lunar calendar provider
 * Loads lunar data from pre-generated JSON files
 */
export class JsonLunarProvider implements LunarProvider {
  private readonly country: string;
  private lunarCache: Map<YMD, LunarDate | null> = new Map();
  private dataLoaded = false;

  constructor(country: string) {
    this.country = country;
  }

  /**
   * Get lunar date from JSON data
   */
  async getLunar(date: YMD): Promise<LunarDate | null> {
    // Check cache first
    if (this.lunarCache.has(date)) {
      return this.lunarCache.get(date) ?? null;
    }

    // Load data if not loaded
    if (!this.dataLoaded) {
      await this.loadData();
    }

    return this.lunarCache.get(date) ?? null;
  }

  /**
   * Convert lunar date to solar date
   * NOT IMPLEMENTED in JsonLunarProvider - use TableLunarProvider instead
   */
  async toSolar(_lunar: {
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;
  }): Promise<YMD | null> {
    console.warn("JsonLunarProvider.toSolar not implemented");
    return null;
  }

  /**
   * Load lunar data from JSON file
   */
  private async loadData(): Promise<void> {
    if (this.dataLoaded) {
      return;
    }

    try {
      // Stub - not implemented in v1.0
      this.dataLoaded = true;
    } catch (error) {
      console.warn("Failed to load lunar data:", error);
      this.dataLoaded = true; // Mark as loaded to avoid repeated attempts
    }
  }

  get meta() {
    return {
      name: "JsonLunarProvider",
      countries: [this.country],
      requiresNetwork: false,
    };
  }
}
