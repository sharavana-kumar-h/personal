import { describe, expect, it } from "vitest";

import {
  calculateBmi,
  calculateBmr,
  calculateBodyFatMass,
  calculateLeanMass,
  calculateWaistHipRatio,
} from "@/lib/body-composition";

describe("body composition calculations", () => {
  it("calculates BMI correctly", () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.86, 2);
  });

  it("calculates BMR for a male using Mifflin-St Jeor", () => {
    expect(calculateBmr({ weightKg: 75, heightCm: 180, age: 30, gender: "male" })).toBe(1730);
  });

  it("calculates BMR for a female using Mifflin-St Jeor", () => {
    expect(calculateBmr({ weightKg: 65, heightCm: 165, age: 28, gender: "female" })).toBe(1380);
  });

  it("calculates waist-to-hip ratio correctly", () => {
    expect(calculateWaistHipRatio(82, 100)).toBeCloseTo(0.82, 2);
  });

  it("calculates body fat mass correctly", () => {
    expect(calculateBodyFatMass(80, 20)).toBeCloseTo(16, 2);
  });

  it("calculates lean mass correctly", () => {
    expect(calculateLeanMass(80, 20)).toBeCloseTo(64, 2);
  });
});
