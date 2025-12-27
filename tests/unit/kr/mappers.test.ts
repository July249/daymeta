import { describe, expect, it } from "vitest";

import { mapKasiSpecialDay, splitHolidaysAndSpecials } from "@/kr/mappers";

import type { KasiSpecialDayResponse } from "@/types";

describe("mappers", () => {
  describe("mapKasiSpecialDay", () => {
    it("should map holiday correctly", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240101",
        dateName: "신정",
        dateKind: "01",
        isHoliday: "Y",
      };

      const result = mapKasiSpecialDay(response);

      expect(result).toEqual({
        date: "2024-01-01",
        name: "신정",
        kind: "STATUTORY",
      });
    });

    it("should map solar term correctly", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240120",
        dateName: "대한",
        dateKind: "01",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      expect(result).toEqual({
        date: "2024-01-20",
        name: "대한",
        kind: "SOLAR_TERM",
      });
    });

    it("should map sundry day correctly", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240315",
        dateName: "한식",
        dateKind: "02",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      expect(result).toEqual({
        date: "2024-03-15",
        name: "한식",
        kind: "SUNDRY",
      });
    });

    it("should map lunar festival correctly", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240210",
        dateName: "설날",
        dateKind: "03",
        isHoliday: "Y",
      };

      const result = mapKasiSpecialDay(response);

      expect(result).toEqual({
        date: "2024-02-10",
        name: "설날",
        kind: "STATUTORY",
      });
    });
  });

  describe("splitHolidaysAndSpecials", () => {
    it("should split holidays and specials correctly", () => {
      const responses: KasiSpecialDayResponse[] = [
        {
          locdate: "20240101",
          dateName: "신정",
          dateKind: "01",
          isHoliday: "Y",
        },
        {
          locdate: "20240120",
          dateName: "대한",
          dateKind: "01",
          isHoliday: "N",
        },
        {
          locdate: "20240301",
          dateName: "삼일절",
          dateKind: "01",
          isHoliday: "Y",
        },
      ];

      const { holidays, specials } = splitHolidaysAndSpecials(responses);

      expect(holidays).toHaveLength(2);
      expect(holidays[0].name).toBe("신정");
      expect(holidays[1].name).toBe("삼일절");

      expect(specials).toHaveLength(1);
      expect(specials[0].name).toBe("대한");
      expect(specials[0].kind).toBe("SOLAR_TERM");
    });
  });
});
