import { XMLParser } from "fast-xml-parser";

const BASE =
  "http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo";

const xmlParser = new XMLParser({ ignoreAttributes: false });

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function normalizeServiceKey(key: string): string {
  // 공공데이터포털에서 발급되는 키는 보통 이미 URL-인코딩된 문자열(%, + 등) 형태로 제공됨.
  // 이걸 encodeURIComponent로 또 감싸면 이중 인코딩이 되어 실패할 수 있음.
  // 따라서 기본은 그대로 사용하고, 사용자가 RAW 키를 넣었을 때만 encode 하도록 보정.
  if (key.includes("%")) return key;
  return encodeURIComponent(key);
}

function pickItemFromJson(json: any): any {
  // JSON 응답은 보통 response.body.items.item 구조(단일 item이면 객체, 복수면 배열)
  const item = json?.response?.body?.items?.item;
  if (!item) return null;
  if (Array.isArray(item)) return item[0] ?? null;
  return item;
}

function pickItemFromXml(xmlObj: any): any {
  const item =
    xmlObj?.response?.body?.items?.item ??
    xmlObj?.response?.body?.items?.[0]?.item;
  if (!item) return null;
  if (Array.isArray(item)) return item[0] ?? null;
  return item;
}

export interface KasiLunCalInfoResult {
  sol: string;
  lunYear: number;
  lunMonth: number;
  lunDay: number;
  isLeapMonth: boolean;
  lunNday: number;
  raw: {
    lunLeapmonth: string;
    resultCode: string;
    resultMsg: string;
  };
}

function parseItemToNormalized(item: any): KasiLunCalInfoResult {
  // 필드 스펙: lunMonth, lunDay, lunLeapmonth(평/윤), lunNday 등
  const lunYear = Number(item.lunYear ?? item.lunyear);
  const lunMonth = Number(item.lunMonth ?? item.lunmonth);
  const lunDay = Number(item.lunDay ?? item.lunday);
  const lunNday = Number(item.lunNday ?? item.lunnday);
  const lunLeapmonth = String(item.lunLeapmonth ?? item.lunleapmonth ?? "");
  const solYear = Number(item.solYear ?? item.solyear);
  const solMonth = Number(item.solMonth ?? item.solmonth);
  const solDay = Number(item.solDay ?? item.solday);
  const resultCode = String(item.resultCode ?? "");
  const resultMsg = String(item.resultMsg ?? item.resultMag ?? "");

  if (
    !lunYear ||
    !lunMonth ||
    !lunDay ||
    !lunNday ||
    !solYear ||
    !solMonth ||
    !solDay
  ) {
    throw new Error(
      `KASI 응답 파싱 실패: 필수 값 누락 (item=${JSON.stringify(item).slice(0, 300)}...)`,
    );
  }

  return {
    sol: `${solYear}-${pad2(solMonth)}-${pad2(solDay)}`,
    lunYear,
    lunMonth,
    lunDay,
    isLeapMonth: lunLeapmonth === "윤",
    lunNday,
    raw: { lunLeapmonth, resultCode, resultMsg },
  };
}

export interface KasiLunCalInfoParams {
  y: number;
  m: number;
  d: number;
  serviceKey: string;
}

export async function getKasiLunCalInfo(
  params: KasiLunCalInfoParams,
): Promise<KasiLunCalInfoResult> {
  const { y, m, d, serviceKey } = params;

  if (!serviceKey) {
    throw new Error("KASI_SERVICE_KEY가 없습니다. env에 설정하세요.");
  }

  const key = normalizeServiceKey(serviceKey);
  const url =
    `${BASE}?serviceKey=${key}` +
    `&solYear=${y}&solMonth=${pad2(m)}&solDay=${pad2(d)}` +
    `&_type=json`;

  const res = await fetch(url);
  const text = await res.text();

  // 1) JSON 우선
  try {
    const json = JSON.parse(text);
    const item = pickItemFromJson(json);
    if (!item) throw new Error("JSON 구조에서 item을 찾지 못함");
    return parseItemToNormalized(item);
  } catch (_) {
    // 2) XML fallback
    try {
      const xmlObj = xmlParser.parse(text);
      const item = pickItemFromXml(xmlObj);
      if (!item) throw new Error("XML 구조에서 item을 찾지 못함");
      return parseItemToNormalized(item);
    } catch (e) {
      throw new Error(
        `KASI 응답 파싱 실패: JSON/XML 모두 실패\nURL=${url}\nSTATUS=${res.status}\nBODY(head)=${text.slice(
          0,
          400,
        )}\nERR=${String(e)}`,
      );
    }
  }
}
