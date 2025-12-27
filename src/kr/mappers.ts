import type { HolidayItem, KasiSpecialDayResponse, SpecialItem, YMD } from "../types.js";

/**
 * Map KASI special day response to HolidayItem or SpecialItem
 */
export function mapKasiSpecialDay(item: KasiSpecialDayResponse): HolidayItem | SpecialItem | null {
  const date = formatLocdate(item.locdate);
  const name = item.dateName;

  // Determine if it's a holiday
  if (item.isHoliday === "Y") {
    return {
      date,
      name,
      kind: "STATUTORY",
    } as HolidayItem;
  }

  // Determine special day kind based on dateKind
  const dateKind = item.dateKind || "";
  let kind: SpecialItem["kind"];

  if (dateKind.includes("24절기") || dateKind === "01") {
    kind = "SOLAR_TERM";
  } else if (dateKind.includes("잡절") || dateKind === "02") {
    kind = "SUNDRY";
  } else if (dateKind.includes("명절") || dateKind === "03") {
    kind = "LUNAR_FESTIVAL";
  } else {
    // Unknown kind, skip
    return null;
  }

  return {
    date,
    name,
    kind,
  } as SpecialItem;
}

/**
 * Format locdate (YYYYMMDD) to YMD (YYYY-MM-DD)
 */
function formatLocdate(locdate: string): YMD {
  const year = locdate.slice(0, 4);
  const month = locdate.slice(4, 6);
  const day = locdate.slice(6, 8);
  return `${year}-${month}-${day}` as YMD;
}

/**
 * Split KASI responses into holidays and specials
 */
export function splitHolidaysAndSpecials(
  items: KasiSpecialDayResponse[]
): { holidays: HolidayItem[]; specials: SpecialItem[] } {
  const holidays: HolidayItem[] = [];
  const specials: SpecialItem[] = [];

  for (const item of items) {
    const mapped = mapKasiSpecialDay(item);
    if (!mapped) continue;

    if ("kind" in mapped && (mapped.kind === "STATUTORY" || mapped.kind === "SUBSTITUTE" || mapped.kind === "TEMPORARY" || mapped.kind === "LOCAL")) {
      holidays.push(mapped as HolidayItem);
    } else {
      specials.push(mapped as SpecialItem);
    }
  }

  return { holidays, specials };
}
