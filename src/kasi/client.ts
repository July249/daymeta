import type {
  KasiLunarResponse,
  KasiSpecialDayResponse,
  LunarDate,
  YMD,
} from "@/types";

/**
 * KASI API response wrapper
 */
interface KasiApiResponse<T> {
  response?: {
    body?: {
      items?: {
        item?: T;
      };
    };
  };
}

export interface KasiClientOptions {
  serviceKey: string;
  baseUrl?: string;
}

export class KasiClient {
  private readonly serviceKey: string;
  private readonly baseUrl: string;

  constructor(options: KasiClientOptions | string) {
    // Backward compatibility: support string (serviceKey) or options object
    if (typeof options === "string") {
      this.serviceKey = options;
      this.baseUrl = this.getBaseUrl();
    } else {
      this.serviceKey = options.serviceKey;
      this.baseUrl = options.baseUrl ?? this.getBaseUrl();
    }

    if (!this.serviceKey?.trim()) {
      throw new Error("KASI service key is required");
    }
  }

  /**
   * Get base URL from environment variable or return default
   */
  private getBaseUrl(): string {
    const DEFAULT_BASE_URL = "https://apis.data.go.kr/B090041/openapi/service";

    if (typeof process !== "undefined" && process.env?.KASI_BASE_URL) {
      return process.env.KASI_BASE_URL;
    }

    return DEFAULT_BASE_URL;
  }

  /**
   * Normalize service key to handle already-encoded keys
   * KASI API keys are often already URL-encoded (contain % characters)
   * If already encoded, use as-is; otherwise encode it
   */
  private normalizeServiceKey(key: string): string {
    // If key contains % (URL-encoded character), assume it's already encoded
    if (key.includes("%")) {
      return key;
    }
    // Otherwise, encode it
    return encodeURIComponent(key);
  }

  /**
   * Fetch lunar calendar information for a solar date
   */
  async fetchLunar(date: YMD): Promise<LunarDate> {
    const item = await this.fetchLunarRaw(date);
    return this.parseLunarResponse(item);
  }

  /**
   * Fetch raw lunar calendar info (including lunNday)
   */
  async fetchLunarRaw(date: YMD): Promise<KasiLunarResponse> {
    const [year, month, day] = date.split("-");
    const item = await this.fetchApiItem<KasiLunarResponse>(
      "LrsrCldInfoService/getLunCalInfo",
      {
        solYear: year,
        solMonth: month,
        solDay: day,
      },
    );

    if (!item) {
      throw new Error(`No lunar data found for ${date}`);
    }

    return item;
  }

  /**
   * Fetch special days (holidays, solar terms, etc.) for a year
   */
  async fetchSpecialDays(year: number): Promise<KasiSpecialDayResponse[]> {
    return this.fetchApiItems<KasiSpecialDayResponse>(
      "SpcdeInfoService/getRestDeInfo",
      {
        solYear: String(year),
        numOfRows: "100",
      },
    );
  }

  /**
   * Fetch solar terms (24절기) for a year
   */
  async fetchSolarTerms(year: number): Promise<KasiSpecialDayResponse[]> {
    return this.fetchApiItems<KasiSpecialDayResponse>(
      "SpcdeInfoService/get24DivisionsInfo",
      {
        solYear: String(year),
        numOfRows: "30",
      },
    );
  }

  /**
   * Generic API call method that returns a single item
   */
  private async fetchApiItem<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T | null> {
    const url = this.buildUrl(endpoint, params);
    const data = await this.fetchJson<KasiApiResponse<T>>(url);
    return data.response?.body?.items?.item ?? null;
  }

  /**
   * Generic API call method that returns an array of items
   */
  private async fetchApiItems<T>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T[]> {
    const url = this.buildUrl(endpoint, params);
    const data = await this.fetchJson<KasiApiResponse<T>>(url);
    const items = data.response?.body?.items?.item;

    if (!items) {
      return [];
    }

    return Array.isArray(items) ? items : [items];
  }

  /**
   * Build API URL with query parameters
   * Note: serviceKey is added manually to avoid double-encoding
   * (KASI API keys are often already URL-encoded)
   */
  private buildUrl(endpoint: string, params: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    // Add serviceKey manually to avoid double-encoding
    // (KASI service keys are often already URL-encoded with % characters)
    const normalizedKey = this.normalizeServiceKey(this.serviceKey);
    const separator = url.search ? "&" : "?";
    url.search += `${separator}serviceKey=${normalizedKey}`;

    url.searchParams.set("_type", "json");

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  /**
   * Fetch and parse JSON response with error handling
   */
  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `KASI API error: ${response.status} ${response.statusText}`,
      );
    }

    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse KASI API response: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Parse KASI lunar response to LunarDate
   */
  private parseLunarResponse(item: KasiLunarResponse): LunarDate {
    return {
      year: parseInt(item.lunYear, 10),
      month: parseInt(item.lunMonth, 10),
      day: parseInt(item.lunDay, 10),
      isLeapMonth: item.lunLeapmonth === "윤",
      ganji: {
        secha: item.lunSecha,
        wolgeon: item.lunWolgeon,
        iljin: item.lunIljin,
      },
    };
  }
}
