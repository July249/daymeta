import { describe, it, expect } from "vitest";
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

describe("2023년 백업 vs KASI 마스크 비교", () => {
  // 백업 데이터 (수동 수정)
  const backupData = [
    { y: 2023, ny: 22, leap: 2, mask: "0x1A96" },
    { y: 2024, ny: 41, leap: 0, mask: "0x6D2" },
  ];

  // KASI 재생성 데이터
  const kasiData = [
    { y: 2023, ny: 22, leap: 2, mask: "0x15AA" },
    { y: 2024, ny: 41, leap: 0, mask: "0x6D2" },
  ];

  it("should test 2023 leap month 2 with backup data", () => {
    const algorithm = new TableLunarAlgorithm(backupData);

    console.log("\n=== 백업 데이터 (0x1A96) ===");

    // 윤2월 29일 시도
    try {
      const day29 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 29,
        isLeapMonth: true,
      });
      console.log("윤2월 29일: ✅", day29);
    } catch (e) {
      console.log("윤2월 29일: ❌", (e as Error).message);
    }

    // 윤2월 30일 시도
    try {
      const day30 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 30,
        isLeapMonth: true,
      });
      console.log("윤2월 30일: ✅", day30);
    } catch (e) {
      console.log("윤2월 30일: ❌", (e as Error).message);
    }
  });

  it("should test 2023 leap month 2 with KASI data", () => {
    const algorithm = new TableLunarAlgorithm(kasiData);

    console.log("\n=== KASI 데이터 (0x15AA) ===");

    // 윤2월 29일 시도
    try {
      const day29 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 29,
        isLeapMonth: true,
      });
      console.log("윤2월 29일: ✅", day29);
    } catch (e) {
      console.log("윤2월 29일: ❌", (e as Error).message);
    }

    // 윤2월 30일 시도
    try {
      const day30 = algorithm.lunarToSolar({
        year: 2023,
        month: 2,
        day: 30,
        isLeapMonth: true,
      });
      console.log("윤2월 30일: ✅", day30);
    } catch (e) {
      console.log("윤2월 30일: ❌", (e as Error).message);
    }
  });

  it("should show which data matches KASI API reality", () => {
    console.log("\n=== 결론 ===");
    console.log("KASI API를 직접 호출하여 2023년 윤2월이");
    console.log("29일까지인지 30일까지인지 확인 필요");
    console.log("");
    console.log("예상: KASI 재생성 데이터가 정확");
    console.log("이유: gen-kr-lunar-v1.kasi.ts는 KASI API를 직접 호출하여");
    console.log("      각 월의 일수를 lunNday 필드로 받아옴");
  });
});
