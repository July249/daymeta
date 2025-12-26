import type { YMD, LunarDate, KasiLunarResponse, KasiSpecialDayResponse } from "../types.js";

const KASI_BASE_URL = "http://apis.data.go.kr/B090041/openapi/service";

export class KasiClient {
  constructor(private serviceKey: string) {
    if (!serviceKey) {
      throw new Error("KASI service key is required");
    }
  }

  /**
   * Fetch lunar calendar information for a solar date
   */
  async fetchLunar(date: YMD): Promise<LunarDate> {
    const [year, month, day] = date.split("-");
    const url = new URL(`${KASI_BASE_URL}/SpcdeInfoService/getLunCalInfo`);
    url.searchParams.set("serviceKey", this.serviceKey);
    url.searchParams.set("solYear", year);
    url.searchParams.set("solMonth", month);
    url.searchParams.set("solDay", day);
    url.searchParams.set("_type", "json");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`KASI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const item = data.response?.body?.items?.item;

    if (!item) {
      throw new Error(`No lunar data found for ${date}`);
    }

    return this.parseLunarResponse(item);
  }

  /**
   * Fetch special days (holidays, solar terms, etc.) for a year
   */
  async fetchSpecialDays(year: number): Promise<KasiSpecialDayResponse[]> {
    const url = new URL(`${KASI_BASE_URL}/SpcdeInfoService/getRestDeInfo`);
    url.searchParams.set("serviceKey", this.serviceKey);
    url.searchParams.set("solYear", String(year));
    url.searchParams.set("numOfRows", "100");
    url.searchParams.set("_type", "json");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`KASI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const items = data.response?.body?.items?.item;

    if (!items) {
      return [];
    }

    return Array.isArray(items) ? items : [items];
  }

  /**
   * Fetch solar terms (24절기) for a year
   */
  async fetchSolarTerms(year: number): Promise<KasiSpecialDayResponse[]> {
    const url = new URL(`${KASI_BASE_URL}/SpcdeInfoService/get24DivisionsInfo`);
    url.searchParams.set("serviceKey", this.serviceKey);
    url.searchParams.set("solYear", String(year));
    url.searchParams.set("numOfRows", "30");
    url.searchParams.set("_type", "json");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`KASI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const items = data.response?.body?.items?.item;

    if (!items) {
      return [];
    }

    return Array.isArray(items) ? items : [items];
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
