import { describe, expect, it } from "vitest";

import {
  averageNutrition,
  calculateRemainingCalories,
  getPreviousSevenDayDates,
  roundNutrition,
  sumNutrition,
} from "@/lib/nutrition";

describe("nutrition calculations", () => {
  it("sums all logged nutrition values", () => {
    expect(sumNutrition([
      { calories: 400, protein: 30, carbohydrates: 40, fat: 10, fiber: 5 },
      { calories: 250, protein: 20, carbohydrates: 25, fat: 8, fiber: 3 },
    ])).toEqual({
      calories: 650,
      protein: 50,
      carbohydrates: 65,
      fat: 18,
      fiber: 8,
    });
  });

  it("rounds values for stable dashboard display", () => {
    expect(roundNutrition({ calories: 100.126, protein: 20.555, carbohydrates: 30.001, fat: 5.999, fiber: 2.5 })).toEqual({
      calories: 100.13,
      protein: 20.56,
      carbohydrates: 30,
      fat: 6,
      fiber: 2.5,
    });
  });

  it("calculates remaining calories against the target", () => {
    expect(calculateRemainingCalories(1850, 2200)).toBe(350);
    expect(calculateRemainingCalories(2400, 2200)).toBe(-200);
  });

  it("calculates a seven-day average including zero-intake days", () => {
    expect(averageNutrition([
      { calories: 700, protein: 70, carbohydrates: 80, fat: 20, fiber: 10 },
      { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
    ])).toEqual({
      calories: 350,
      protein: 35,
      carbohydrates: 40,
      fat: 10,
      fiber: 5,
    });
  });

  it("returns the selected day and previous six dates", () => {
    expect(getPreviousSevenDayDates("2026-09-12")).toEqual([
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
    ]);
  });
});
