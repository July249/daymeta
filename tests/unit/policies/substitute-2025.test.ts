import { describe, expect, it } from "vitest";

import { createKoreanCalendar } from "@/core/factory";

/**
 * Test suite for 2025 Korean substitute holidays
 *
 * Expected 2025 substitute holidays:
 * - March 3 (Mon): Substitute for 삼일절 (March 1, Sat)
 * - May 6 (Tue): Substitute for 부처님오신날 (May 5, overlaps with 어린이날)
 * - October 8 (Wed): Substitute for 추석 연휴 (October 5, Sun)
 */
describe("2025 Korean substitute holidays", () => {
  it("should generate substitute holiday for 삼일절 on weekend", async () => {
    const calendar = await createKoreanCalendar();
    const result = await calendar.listHolidays(2025);

    // March 1 (Sat) is 삼일절
    const samil = result.items.find(
      (h) => h.date === "2025-03-01" && h.id === "KR_SAMIL"
    );
    expect(samil).toBeDefined();
    expect(samil!.kind).toBe("STATUTORY");

    // March 3 (Mon) should be substitute holiday
    const substitute = result.items.find(
      (h) => h.date === "2025-03-03" && h.kind === "SUBSTITUTE"
    );
    expect(substitute).toBeDefined();
    expect(substitute!.name).toBe("대체공휴일");
    expect(substitute!.substituteFor).toBe("2025-03-01");
  });

  it("should generate substitute holiday for 부처님오신날 overlapping with 어린이날", async () => {
    const calendar = await createKoreanCalendar();
    const result = await calendar.listHolidays(2025);

    // May 5 has both 어린이날 and 부처님오신날
    const may5Holidays = result.items.filter((h) => h.date === "2025-05-05");
    expect(may5Holidays.length).toBeGreaterThanOrEqual(2);

    const children = may5Holidays.find((h) => h.id === "KR_CHILDREN");
    const buddha = may5Holidays.find((h) => h.id === "KR_BUDDHA");
    expect(children).toBeDefined();
    expect(buddha).toBeDefined();

    // May 6 (Tue) should be substitute holiday for 부처님오신날
    const substitute = result.items.find(
      (h) => h.date === "2025-05-06" && h.kind === "SUBSTITUTE"
    );
    expect(substitute).toBeDefined();
    expect(substitute!.name).toBe("대체공휴일");
    // Should substitute for 부처님오신날 (which overlapped with 어린이날)
    expect(substitute!.substituteFor).toBe("2025-05-05");
  });

  it("should generate substitute holiday for 추석 연휴 including Sunday", async () => {
    const calendar = await createKoreanCalendar();
    const result = await calendar.listHolidays(2025);

    // 추석 연휴: Oct 5 (Sun, PRE), 6 (Mon, DAY), 7 (Tue, POST)
    const chuseokHolidays = result.items.filter((h) => h.id === "KR_CHUSEOK");
    expect(chuseokHolidays).toHaveLength(3);

    // Oct 5 is Sunday (PRE variant)
    const oct5 = chuseokHolidays.find((h) => h.date === "2025-10-05");
    expect(oct5).toBeDefined();
    expect(oct5!.variant).toBe("PRE");

    // Oct 6 is the actual 추석 (DAY variant)
    const oct6 = chuseokHolidays.find((h) => h.date === "2025-10-06");
    expect(oct6).toBeDefined();
    expect(oct6!.variant).toBe("DAY");

    // Oct 8 (Wed) should be substitute holiday for Oct 6 (추석 DAY)
    // Because the 3-day range includes Sunday (Oct 5)
    const substitute = result.items.find(
      (h) => h.date === "2025-10-08" && h.kind === "SUBSTITUTE"
    );
    expect(substitute).toBeDefined();
    expect(substitute!.name).toBe("대체공휴일");
    expect(substitute!.substituteFor).toBe("2025-10-06"); // Substitutes for the DAY variant
  });

  it("should have correct total count for 2025", async () => {
    const calendar = await createKoreanCalendar();
    const result = await calendar.listHolidays(2025);

    // Expected holidays (excluding temporary holidays like Jan 27):
    // Base: 15 items (신정, 설날×3, 삼일절, 부처님오신날, 어린이날, 현충일, 광복절, 추석×3, 개천절, 한글날, 성탄절)
    // Substitutes: 3 items (Mar 3, May 6, Oct 8)
    // Total: 18 items
    expect(result.items.length).toBeGreaterThanOrEqual(18);

    // Count substitute holidays
    const substitutes = result.items.filter((h) => h.kind === "SUBSTITUTE");
    expect(substitutes.length).toBeGreaterThanOrEqual(3);
  });
});
