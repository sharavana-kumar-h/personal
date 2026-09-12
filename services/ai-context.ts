import type { NutritionValues } from "@/lib/nutrition";

export type NutritionContextInput = {
  date: string;
  meals: Array<{
    type: string;
    name: string;
    foods: Array<{ name: string; quantityGrams: number; nutrition: NutritionValues; isAiEstimate: boolean }>;
  }>;
  dailyTotal: NutritionValues;
  goals?: { calories?: number; protein?: number; carbohydrates?: number; fat?: number; fiber?: number };
};

export type WorkoutContextInput = {
  dateRange: { start: string; end: string };
  sessions: Array<{
    date: string;
    dayName?: string | null;
    durationMin?: number | null;
    sets: Array<{ exerciseName: string; weightKg: number; reps: number; rpe?: number | null; rir?: number | null }>;
  }>;
};

export type ProgressContextInput = {
  measurements: Array<{ date: string; weightKg: number; bmi?: number | null; bodyFatPercent?: number | null; leanMassKg?: number | null }>;
  workoutProgression: Array<{ exerciseName: string; date: string; weightKg: number; reps: number }>;
};

export type DailyContextInput = {
  date: string;
  nutrition: NutritionContextInput;
  workout?: WorkoutContextInput;
  recovery?: { sleepHours?: number; notes?: string };
};

export function buildNutritionContext(input: NutritionContextInput) {
  return {
    contextType: "nutrition",
    date: input.date,
    meals: input.meals,
    dailyTotal: input.dailyTotal,
    goals: input.goals ?? {},
  };
}

export function buildWorkoutContext(input: WorkoutContextInput) {
  return {
    contextType: "workout",
    dateRange: input.dateRange,
    sessions: input.sessions,
  };
}

export function buildProgressContext(input: ProgressContextInput) {
  return {
    contextType: "progress",
    measurements: input.measurements,
    workoutProgression: input.workoutProgression,
  };
}

export function buildDailyContext(input: DailyContextInput) {
  return {
    contextType: "daily",
    date: input.date,
    nutrition: buildNutritionContext(input.nutrition),
    workout: input.workout ? buildWorkoutContext(input.workout) : null,
    recovery: input.recovery ?? null,
  };
}

export function buildGoalContext(input: {
  goals: Record<string, unknown>;
  recentNutrition?: NutritionContextInput;
  recentWorkout?: WorkoutContextInput;
  recentProgress?: ProgressContextInput;
}) {
  return {
    contextType: "goals",
    goals: input.goals,
    recentNutrition: input.recentNutrition ? buildNutritionContext(input.recentNutrition) : null,
    recentWorkout: input.recentWorkout ? buildWorkoutContext(input.recentWorkout) : null,
    recentProgress: input.recentProgress ? buildProgressContext(input.recentProgress) : null,
  };
}
