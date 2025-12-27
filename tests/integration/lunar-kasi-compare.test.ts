import { describe, expect, it } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarProvider } from "@/providers/lunar/table";

import { getKasiLunCalInfo } from "../helpers/kasi";

const KASI_KEY = process.env.KASI_SERVICE_KEY;

// 간단 랜덤 생성 (1900~2050 범위로 제한)
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isLeapYear(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function daysInMonth(y: number, m: number) {
  const dim = [
    31,
    isLeapYear(y) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return dim[m - 1];
}

function randomYmdInRange(startYear = 1900, endYear = 2050) {
  const y = randInt(startYear, endYear);
  const m = randInt(1, 12);
  const d = randInt(1, daysInMonth(y, m));
  return {
    y,
    m,
    d,
    ymd: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` as const,
  };
}

describe.skipIf(!KASI_KEY)(
  "KASI compare: Table lunar vs KASI getLunCalInfo",
  () => {
    const provider = new TableLunarProvider("KR", lunarData.rows);

    it("golden: 2025-01-29 is lunar 2025-01-01 (non-leap)", async () => {
      const kasi = await getKasiLunCalInfo({
        y: 2025,
        m: 1,
        d: 29,
        serviceKey: KASI_KEY!,
      });

      expect(kasi.lunYear).toBe(2025);
      expect(kasi.lunMonth).toBe(1);
      expect(kasi.lunDay).toBe(1);
      expect(kasi.isLeapMonth).toBe(false);

      const ours = await provider.getLunar("2025-01-29");

      expect(ours).not.toBeNull();
      expect(ours?.year).toBe(2025);
      expect(ours?.month).toBe(1);
      expect(ours?.day).toBe(1);
      expect(ours?.isLeapMonth).toBe(false);
    });

    it("golden: 2026-02-17 is lunar 2026-01-01 (non-leap)", async () => {
      const kasi = await getKasiLunCalInfo({
        y: 2026,
        m: 2,
        d: 17,
        serviceKey: KASI_KEY!,
      });

      expect(kasi.lunYear).toBe(2026);
      expect(kasi.lunMonth).toBe(1);
      expect(kasi.lunDay).toBe(1);
      expect(kasi.isLeapMonth).toBe(false);

      const ours = await provider.getLunar("2026-02-17");

      expect(ours).not.toBeNull();
      expect(ours?.year).toBe(2026);
      expect(ours?.month).toBe(1);
      expect(ours?.day).toBe(1);
      expect(ours?.isLeapMonth).toBe(false);
    });

    it("random compare (N=300)", async () => {
      const N = Number(process.env.KASI_COMPARE_N ?? "300");
      for (let i = 0; i < N; i++) {
        const { y, m, d, ymd } = randomYmdInRange(1900, 2050);

        const [kasi, ours] = await Promise.all([
          getKasiLunCalInfo({ y, m, d, serviceKey: KASI_KEY! }),
          provider.getLunar(ymd),
        ]);

        try {
          expect(ours).not.toBeNull();
          expect(ours?.year).toBe(kasi.lunYear);
          expect(ours?.month).toBe(kasi.lunMonth);
          expect(ours?.day).toBe(kasi.lunDay);
          expect(ours?.isLeapMonth).toBe(kasi.isLeapMonth);
        } catch (e) {
          throw new Error(
            `Mismatch at ${ymd}\n` +
              `KASI: ${kasi.lunYear}-${kasi.lunMonth}-${kasi.lunDay} leap=${kasi.isLeapMonth} nday=${kasi.lunNday}\n` +
              `OURS: ${ours ? `${ours.year}-${ours.month}-${ours.day} leap=${ours.isLeapMonth}` : "null"}\n` +
              `RAW: ${JSON.stringify(kasi.raw)}\n` +
              `ERR: ${String(e)}`,
          );
        }
      }
    });
  },
);
