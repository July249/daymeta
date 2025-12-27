import { describe, it, expect } from "vitest";

import lunarData from "@/data/lunar/kr.lunar.v1.json" with { type: "json" };
import { TableLunarAlgorithm } from "@/algorithms/lunar/table";

describe("Verify 2023 Chuseok fix", () => {
  const algorithm = new TableLunarAlgorithm(lunarData.rows);

  it("should convert 2023 lunar 8/15 to 2023-09-29", () => {
    const result = algorithm.lunarToSolar({
      year: 2023,
      month: 8,
      day: 15,
      isLeapMonth: false,
    });

    console.log("\n2023년 추석 (음력 8/15):", result);
    console.log("예상: 2023-09-29");
    console.log("일치:", result === "2023-09-29" ? "✅" : "❌");

    expect(result).toBe("2023-09-29");
  });

  it("should convert 2023-09-29 back to lunar 8/15", () => {
    const result = algorithm.solarToLunar("2023-09-29");

    console.log("\n2023-09-29 역변환:", result);
    expect(result.year).toBe(2023);
    expect(result.month).toBe(8);
    expect(result.day).toBe(15);
    expect(result.isLeapMonth).toBe(false);
  });
});
