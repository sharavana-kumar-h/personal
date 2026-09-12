import { describe, expect, it } from "vitest";

import {
  calculateWorkoutVolume,
  detectPersonalRecord,
  findExerciseProgression,
  summarizePersonalRecords,
} from "@/lib/workouts";

describe("workout analytics", () => {
  it("sums total training volume from all working sets", () => {
    const volume = calculateWorkoutVolume([
      { setNumber: 1, weightKg: 100, reps: 5 },
      { setNumber: 2, weightKg: 90, reps: 8 },
      { setNumber: 3, weightKg: 80, reps: 10 },
    ]);

    expect(volume).toBe(100 * 5 + 90 * 8 + 80 * 10);
  });

  it("detects the heaviest successful record for an exercise", () => {
    const record = detectPersonalRecord("Bench Press", [
      { exerciseName: "Bench Press", weightKg: 90, reps: 6 },
      { exerciseName: "Bench Press", weightKg: 110, reps: 5 },
      { exerciseName: "Bench Press", weightKg: 100, reps: 8 },
      { exerciseName: "Squat", weightKg: 140, reps: 5 },
    ]);

    expect(record).toEqual({ exerciseName: "Bench Press", weightKg: 110, reps: 5 });
  });

  it("tracks exercise progression across sessions", () => {
    const progression = findExerciseProgression("Deadlift", [
      { exerciseName: "Deadlift", weightKg: 100, reps: 5, date: "2024-01-01" },
      { exerciseName: "Deadlift", weightKg: 120, reps: 5, date: "2024-01-08" },
      { exerciseName: "Deadlift", weightKg: 120, reps: 7, date: "2024-01-15" },
    ]);

    expect(progression).toEqual({
      exerciseName: "Deadlift",
      firstWeightKg: 100,
      latestWeightKg: 120,
      weightDeltaKg: 20,
      firstReps: 5,
      latestReps: 7,
      repDelta: 2,
    });
  });

  it("groups personal records by exercise name", () => {
    const records = summarizePersonalRecords([
      { exerciseName: "Bench Press", weightKg: 90, reps: 6 },
      { exerciseName: "Bench Press", weightKg: 110, reps: 5 },
      { exerciseName: "Bench Press", weightKg: 105, reps: 8 },
      { exerciseName: "Squat", weightKg: 140, reps: 5 },
      { exerciseName: "Squat", weightKg: 150, reps: 4 },
    ]);

    expect(records).toEqual({
      "Bench Press": { exerciseName: "Bench Press", weightKg: 110, reps: 5 },
      Squat: { exerciseName: "Squat", weightKg: 150, reps: 4 },
    });
  });
});
