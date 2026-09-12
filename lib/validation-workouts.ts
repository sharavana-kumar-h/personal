import { z } from "zod";

export const plannedExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().min(1).optional(),
  sets: z.coerce.number().int().min(1).max(20).optional().default(3),
  reps: z.coerce.number().int().min(1).max(30).optional().default(10),
  weightKg: z.coerce.number().min(0).max(1000).optional().default(0),
  restSec: z.coerce.number().min(0).max(600).optional().default(90),
  rpe: z.coerce.number().min(1).max(10).optional(),
  rir: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const workoutProgramSchema = z.object({
  name: z.string().min(1),
  split: z.string().min(1),
  days: z.array(
    z.object({
      name: z.string().min(1),
      muscleGroup: z.string().min(1),
      exercises: z.array(plannedExerciseSchema),
      notes: z.string().max(2000).optional().or(z.literal("")),
    }),
  ),
});

export const completedWorkoutSetSchema = z.object({
  exerciseName: z.string().min(1),
  setNumber: z.coerce.number().int().min(1).max(20),
  weightKg: z.coerce.number().min(0).max(1000),
  reps: z.coerce.number().int().min(0).max(50),
  durationSec: z.coerce.number().min(0).max(18000).optional(),
  rpe: z.coerce.number().min(1).max(10).optional(),
  rir: z.coerce.number().min(0).max(10).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const cardioSessionSchema = z.object({
  activity: z.string().min(1),
  durationMin: z.coerce.number().min(0).max(600),
  distanceKm: z.coerce.number().min(0).max(200).optional(),
  resistance: z.coerce.number().min(0).max(100).optional(),
  speed: z.coerce.number().min(0).max(100).optional(),
  incline: z.coerce.number().min(0).max(100).optional(),
  heartRate: z.coerce.number().min(0).max(250).optional(),
  estimatedCalories: z.coerce.number().min(0).max(5000).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().min(1),
});
