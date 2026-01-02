import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

describe("2023년 음력 변환 상세 검증", () => {
  const algorithm = new TableLunarAlgorithm(lunarData.rows);

  console.log("\n=== 2023년 음력 데이터 확인 ===");
  const row2023 = lunarData.rows.find((r) => r.y === 2023);
  console.log("음력 설날 (1/1):", `양력 ${row2023?.ny}번째 날 → 2023-01-22`);
  console.log("윤달:", row2023?.leap === 0 ? "없음" : `윤${row2023?.leap}월`);
  console.log("마스크:", row2023?.mask);

  describe("음력 1월 1일 (설날)", () => {
    it("should convert 2023 lunar 1/1 to 2023-01-22", () => {
      const result = algorithm.lunarToSolar({
        year: 2023,
        month: 1,
        day: 1,
        isLeapMonth: false,
      });

      console.log("\n음력 2023-01-01 → 양력:", result);
      console.log("예상: 2023-01-22");
      console.log("검증:", result === "2023-01-22" ? "✅ 성공" : "❌ 실패");

      expect(result).toBe("2023-01-22");
    });

    it("should convert 2023-01-22 back to lunar 1/1", () => {
      const result = algorithm.solarToLunar("2023-01-22");

      console.log("\n양력 2023-01-22 → 음력:", result);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.isLeapMonth).toBe(false);
      console.log("검증: ✅ 설날 일치");
    });
  });

  describe("음력 8월 15일 (추석)", () => {
    it("should convert 2023 lunar 8/15 to 2023-09-29", () => {
      const result = algorithm.lunarToSolar({
        year: 2023,
        month: 8,
        day: 15,
        isLeapMonth: false,
      });

      console.log("\n음력 2023-08-15 → 양력:", result);
      console.log("예상: 2023-09-29");
      console.log("검증:", result === "2023-09-29" ? "✅ 성공" : "❌ 실패");

      expect(result).toBe("2023-09-29");
    });

    it("should convert 2023-09-29 back to lunar 8/15", () => {
      const result = algorithm.solarToLunar("2023-09-29");

      console.log("\n양력 2023-09-29 → 음력:", result);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(8);
      expect(result.day).toBe(15);
      expect(result.isLeapMonth).toBe(false);
      console.log("검증: ✅ 추석 일치");
    });
  });

  describe("윤2월 검증", () => {
    it("should handle leap month 2 correctly", () => {
      // 정규 2월 마지막 날
      const regular2 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 29,
        isLeapMonth: false,
      });

      console.log("\n음력 2023-02-29 (정규) → 양력:", regular2);

      // 윤2월 1일
      const leap2_1 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 1,
        isLeapMonth: true,
      });

      console.log("음력 2023-윤02-01 → 양력:", leap2_1);

      // 역변환
      const backToLeap = algorithm.solarToLunar(leap2_1);
      console.log("역변환:", backToLeap);

      expect(backToLeap.year).toBe(2023);
      expect(backToLeap.month).toBe(2);
      expect(backToLeap.isLeapMonth).toBe(true);
      console.log("검증: ✅ 윤2월 정상 동작");
    });
  });

  describe("종합 검증", () => {
    it("should pass all 2023 conversion tests", () => {
      const tests = [
        {
          desc: "설날",
          lunar: { year: 2023, month: 1, day: 1, isLeapMonth: false },
          solar: "2023-01-22",
        },
        {
          desc: "추석",
          lunar: { year: 2023, month: 8, day: 15, isLeapMonth: false },
          solar: "2023-09-29",
        },
      ];

      console.log("\n=== 종합 검증 ===");

      for (const test of tests) {
        const lunarToSolar = algorithm.lunarToSolar(test.lunar);
        const solarToLunar = algorithm.solarToLunar(
          test.solar as `${number}-${string}-${string}`,
        );

        const lunarMatch = lunarToSolar === test.solar;
        const solarMatch =
          solarToLunar.year === test.lunar.year &&
          solarToLunar.month === test.lunar.month &&
          solarToLunar.day === test.lunar.day &&
          solarToLunar.isLeapMonth === test.lunar.isLeapMonth;

        console.log(
          `${test.desc}: 음→양 ${lunarMatch ? "✅" : "❌"}, 양→음 ${solarMatch ? "✅" : "❌"}`,
        );

        expect(lunarMatch).toBe(true);
        expect(solarMatch).toBe(true);
      }

      console.log("\n✅ 모든 2023년 음력 변환 테스트 통과!\n");
    });
  });
});
