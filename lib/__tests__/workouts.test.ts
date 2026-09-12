import { describe, expect, it } from "vitest";

import { calculateWorkoutVolume, detectPersonalRecord } from "@/lib/workouts";

describe("workout calculations", () => {
  it("calculates workout volume from sets, reps, and weight", () => {
    const result = calculateWorkoutVolume([
      { setNumber: 1, weightKg: 40, reps: 10 },
      { setNumber: 2, weightKg: 40, reps: 10 },
      { setNumber: 3, weightKg: 42.5, reps: 8 },
    ]);

    expect(result).toBe(1140);
  });

  it("detects a personal record when a weight increases for the same exercise", () => {
    const records = [
      { exerciseName: "Squat", weightKg: 100, reps: 5 },
      { exerciseName: "Squat", weightKg: 105, reps: 5 },
      { exerciseName: "Squat", weightKg: 110, reps: 5 },
    ];

    expect(detectPersonalRecord("Squat", records)).toEqual({
      exerciseName: "Squat",
      weightKg: 110,
      reps: 5,
    });
  });

  it("returns null when there is no record for an exercise", () => {
    expect(detectPersonalRecord("Deadlift", [{ exerciseName: "Squat", weightKg: 90, reps: 5 }])).toBeNull();
  });
});
