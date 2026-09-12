import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    meal: { findMany: vi.fn() },
    nutritionGoal: { findUnique: vi.fn() },
    bodyCompositionSnapshot: { findMany: vi.fn() },
    workoutProgram: { findFirst: vi.fn() },
    workoutSession: { findMany: vi.fn() },
    cardioSession: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({ id: "user-a" })),
}));

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { buildNutritionCoachContext, buildWorkoutCoachContext } from "@/services/coach-context";

describe("authenticated coach context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes nutrition context and preserves estimated versus entered provenance", async () => {
    vi.mocked(prisma.meal.findMany).mockResolvedValue([
      {
        id: "meal-1",
        userId: "user-a",
        date: new Date("2026-09-12T00:00:00.000Z"),
        mealType: "BREAKFAST",
        name: "Breakfast",
        createdAt: new Date(),
        updatedAt: new Date(),
        foods: [
          {
            id: "food-1",
            mealId: "meal-1",
            name: "Oats",
            quantityGrams: 80,
            calories: 300,
            protein: 10,
            carbohydrates: 50,
            fat: 6,
            fiber: 8,
            isAiEstimate: true,
            sourceNote: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "food-2",
            mealId: "meal-1",
            name: "Eggs",
            quantityGrams: 100,
            calories: 140,
            protein: 12,
            carbohydrates: 1,
            fat: 10,
            fiber: 0,
            isAiEstimate: false,
            sourceNote: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ] as never);
    vi.mocked(prisma.nutritionGoal.findUnique).mockResolvedValue({
      id: "goal-1",
      userId: "user-a",
      calorieTarget: 2200,
      proteinTarget: 150,
      carbTarget: 240,
      fatTarget: 70,
      fiberTarget: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.bodyCompositionSnapshot.findMany).mockResolvedValue([
      {
        id: "body-1",
        userId: "user-a",
        date: new Date("2026-09-10T00:00:00.000Z"),
        weightKg: 75,
        heightCm: null,
        bmi: 24,
        smm: null,
        bfm: null,
        pbf: 18,
        waistHipRatio: null,
        visceralFatLevel: null,
        fatFreeMass: 61.5,
        bmr: null,
        obesityDegree: null,
        smi: null,
        notes: null,
        measurementSource: "DEXA",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const context = await buildNutritionCoachContext("user-a", new Date("2026-09-12T10:00:00.000Z"));

    expect(prisma.meal.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-a" }) }));
    expect(prisma.nutritionGoal.findUnique).toHaveBeenCalledWith({ where: { userId: "user-a" } });
    expect(context.today.meals[0]?.foods[0]?.calories.provenance).toBe("estimated");
    expect(context.today.meals[0]?.foods[1]?.calories.provenance).toBe("user_entered");
    expect(context.today.totals.provenance).toBe("calculated");
    expect(context.bodyComposition[0]?.weightKg.provenance).toBe("measured");
  });

  it("scopes workout context and marks derived volume as calculated", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-b" } as never);
    vi.mocked(prisma.workoutProgram.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.nutritionGoal.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.cardioSession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.workoutSession.findMany).mockResolvedValue([
      {
        id: "session-1",
        userId: "user-b",
        programId: null,
        date: new Date("2026-09-12T00:00:00.000Z"),
        dayName: "Push",
        durationMin: 60,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sets: [{
          id: "set-1",
          sessionId: "session-1",
          exerciseName: "Bench Press",
          setNumber: 1,
          weightKg: 80,
          reps: 5,
          durationSec: null,
          rpe: 8,
          rir: 2,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        cardioSessions: [],
      },
    ] as never);

    const context = await buildWorkoutCoachContext("user-b", new Date("2026-09-12T10:00:00.000Z"));

    expect(prisma.workoutSession.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-b" }) }));
    expect(context.completedSessions[0]?.sets[0]?.volumeKg).toEqual({ value: 400, provenance: "calculated" });
    expect(context.completedSessions[0]?.sets[0]?.weightKg.provenance).toBe("user_entered");
  });

  it("rejects a context request for a different authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-a" } as never);

    await expect(buildNutritionCoachContext("user-b")).rejects.toThrow("Unauthorized");
    expect(prisma.meal.findMany).not.toHaveBeenCalled();
  });
});
