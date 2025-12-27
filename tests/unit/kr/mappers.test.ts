import { describe, expect, it } from "vitest";

import { mapKasiSpecialDay, splitHolidaysAndSpecials } from "@/kr/mappers";

import type { KasiSpecialDayResponse } from "@/types";

/**
 * Korean Holiday Mappers Test Suite
 *
 * This test suite demonstrates how to use the mapper functions that convert
 * KASI (Korea Astronomy and Space Science Institute) API responses to
 * internal holiday and special day data structures.
 *
 * Key Features:
 * - Map KASI API responses to HolidayItem or SpecialItem
 * - Handle different types: holidays, solar terms, sundry days, lunar festivals
 * - Split responses into holidays and special days
 *
 * Usage Example:
 * ```typescript
 * import { mapKasiSpecialDay, splitHolidaysAndSpecials } from "@/kr/mappers";
 *
 * // Map a single KASI response
 * const kasiResponse = {
 *   locdate: "20240101",
 *   dateName: "신정",
 *   dateKind: "01",
 *   isHoliday: "Y"
 * };
 * const holiday = mapKasiSpecialDay(kasiResponse);
 * // Returns: { date: "2024-01-01", name: "신정", kind: "STATUTORY" }
 *
 * // Split multiple responses
 * const { holidays, specials } = splitHolidaysAndSpecials(responses);
 * ```
 */
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

    it("should handle empty array", () => {
      const { holidays, specials } = splitHolidaysAndSpecials([]);

      expect(holidays).toHaveLength(0);
      expect(specials).toHaveLength(0);
    });

    it("should handle only holidays", () => {
      const responses: KasiSpecialDayResponse[] = [
        {
          locdate: "20240101",
          dateName: "신정",
          dateKind: "01",
          isHoliday: "Y",
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
      expect(specials).toHaveLength(0);
    });

    it("should handle only specials", () => {
      const responses: KasiSpecialDayResponse[] = [
        {
          locdate: "20240120",
          dateName: "대한",
          dateKind: "01",
          isHoliday: "N",
        },
        {
          locdate: "20240315",
          dateName: "한식",
          dateKind: "02",
          isHoliday: "N",
        },
      ];

      const { holidays, specials } = splitHolidaysAndSpecials(responses);

      expect(holidays).toHaveLength(0);
      expect(specials).toHaveLength(2);
    });

    it("should skip items that map to null", () => {
      const responses: KasiSpecialDayResponse[] = [
        {
          locdate: "20240101",
          dateName: "신정",
          dateKind: "01",
          isHoliday: "Y",
        },
        {
          locdate: "20240999",
          dateName: "Unknown",
          dateKind: "99", // Unknown dateKind
          isHoliday: "N",
        },
      ];

      const { holidays, specials } = splitHolidaysAndSpecials(responses);

      expect(holidays).toHaveLength(1);
      expect(specials).toHaveLength(0);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle locdate with leading zeros", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240105",
        dateName: "Test",
        dateKind: "01",
        isHoliday: "Y",
      };

      const result = mapKasiSpecialDay(response);

      expect(result?.date).toBe("2024-01-05");
    });

    it("should handle dateKind as empty string", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240101",
        dateName: "Test",
        dateKind: "",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      // Unknown dateKind returns null
      expect(result).toBeNull();
    });

    it("should handle dateKind with Korean text '24절기'", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240120",
        dateName: "대한",
        dateKind: "24절기",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      expect(result?.kind).toBe("SOLAR_TERM");
    });

    it("should handle dateKind with Korean text '잡절'", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240315",
        dateName: "한식",
        dateKind: "잡절",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      expect(result?.kind).toBe("SUNDRY");
    });

    it("should handle dateKind with Korean text '명절'", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240210",
        dateName: "설날",
        dateKind: "명절",
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      expect(result?.kind).toBe("LUNAR_FESTIVAL");
    });

    it("should prioritize isHoliday=Y over dateKind", () => {
      // Even if dateKind suggests it's a lunar festival,
      // if isHoliday=Y, it should be mapped as STATUTORY
      const response: KasiSpecialDayResponse = {
        locdate: "20240210",
        dateName: "설날",
        dateKind: "03",
        isHoliday: "Y",
      };

      const result = mapKasiSpecialDay(response);

      expect(result?.kind).toBe("STATUTORY");
    });

    it("should handle undefined dateKind", () => {
      const response: KasiSpecialDayResponse = {
        locdate: "20240101",
        dateName: "Test",
        dateKind: undefined as any,
        isHoliday: "N",
      };

      const result = mapKasiSpecialDay(response);

      // Should handle undefined gracefully
      expect(result).toBeNull();
    });
  });
});
