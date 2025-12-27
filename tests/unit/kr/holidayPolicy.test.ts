import { describe, expect, it } from "vitest";

import { calculateSubstituteHolidays, mergeHolidays } from "@/kr/holidayPolicy";

import type { HolidayItem } from "@/types";

describe("holidayPolicy", () => {
  describe("calculateSubstituteHolidays", () => {
    it("should create substitute holiday for Sunday holiday", () => {
      const holidays: HolidayItem[] = [
        {
          id: "test-holiday",
          date: "2024-01-07", // Sunday
          name: "테스트 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].date).toBe("2024-01-08"); // Monday
      expect(substitutes[0].name).toBe("테스트 공휴일 대체공휴일");
      expect(substitutes[0].kind).toBe("SUBSTITUTE");
      expect(substitutes[0].substituteFor).toBe("2024-01-07");
    });

    it("should create substitute holiday for Saturday holiday", () => {
      const holidays: HolidayItem[] = [
        {
          id: "test-holiday",
          date: "2024-01-06", // Saturday
          name: "테스트 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].date).toBe("2024-01-08"); // Monday (skip Sunday)
      expect(substitutes[0].kind).toBe("SUBSTITUTE");
    });

    it("should skip weekend when finding substitute date", () => {
      const holidays: HolidayItem[] = [
        {
          id: "saturday-holiday",
          date: "2024-01-06", // Saturday
          name: "토요일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      expect(substitutes[0].date).toBe("2024-01-08"); // Monday
    });

    it("should handle consecutive holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "sunday-holiday",
          date: "2024-01-07", // Sunday
          name: "일요일 공휴일",
          kind: "STATUTORY",
        },
        {
          id: "monday-holiday",
          date: "2024-01-08", // Monday (would be substitute, but is also a holiday)
          name: "월요일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      // Should create substitute for Sunday on Tuesday (skip Monday which is also a holiday)
      const sundaySubstitute = substitutes.find(
        (s) => s.substituteFor === "2024-01-07",
      );
      expect(sundaySubstitute?.date).toBe("2024-01-09"); // Tuesday

      // Monday is a weekday, so no substitute holiday should be created
      const mondaySubstitute = substitutes.find(
        (s) => s.substituteFor === "2024-01-08",
      );
      expect(mondaySubstitute).toBeUndefined();
    });

    it("should not create substitute for weekday holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "weekday-holiday",
          date: "2024-01-08", // Monday
          name: "평일 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays);

      // Monday is not weekend, so no substitute unless policy requires
      expect(substitutes).toHaveLength(0);
    });

    it("should respect policy for eligible holidays", () => {
      const holidays: HolidayItem[] = [
        {
          id: "seollal",
          date: "2024-01-07", // Sunday
          name: "설날",
          kind: "STATUTORY",
        },
        {
          id: "other-holiday",
          date: "2024-02-11", // Sunday
          name: "기타 공휴일",
          kind: "STATUTORY",
        },
      ];

      const substitutes = calculateSubstituteHolidays(holidays, {
        eligibleHolidays: ["설날"],
      });

      expect(substitutes).toHaveLength(1);
      expect(substitutes[0].substituteFor).toBe("2024-01-07");
    });
  });

  describe("mergeHolidays", () => {
    it("should merge and sort holidays", () => {
      const base: HolidayItem[] = [
        {
          id: "base-holiday",
          date: "2024-01-15",
          name: "Base Holiday",
          kind: "STATUTORY",
        },
      ];

      const substitute: HolidayItem[] = [
        {
          id: "substitute-holiday",
          date: "2024-01-08",
          name: "Substitute Holiday",
          kind: "SUBSTITUTE",
        },
      ];

      const extra: HolidayItem[] = [
        {
          id: "extra-holiday",
          date: "2024-01-20",
          name: "Extra Holiday",
          kind: "TEMPORARY",
        },
      ];

      const merged = mergeHolidays(base, substitute, extra);

      expect(merged).toHaveLength(3);
      expect(merged[0].date).toBe("2024-01-08");
      expect(merged[1].date).toBe("2024-01-15");
      expect(merged[2].date).toBe("2024-01-20");
    });
  });
});
