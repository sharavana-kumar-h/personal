"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cardioSessionSchema, completedWorkoutSetSchema, plannedExerciseSchema } from "@/lib/validation-workouts";

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || undefined;
}

function numberOrUndefined(formData: FormData, key: string) {
  const value = optional(formData, key);
  return value === undefined ? undefined : Number(value);
}

function revalidateWorkouts() {
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/ai");
}

export async function createWorkoutProgram(formData: FormData) {
  const user = await requireUser();
  const name = required(formData, "name");
  const split = required(formData, "split");
  const description = optional(formData, "description");

  await prisma.workoutProgram.create({ data: { userId: user.id, name, split, description } });
  revalidateWorkouts();
}

export async function addWorkoutDay(formData: FormData) {
  const user = await requireUser();
  const programId = required(formData, "programId");
  const program = await prisma.workoutProgram.findFirst({ where: { id: programId, userId: user.id }, select: { id: true } });
  if (!program) throw new Error("Workout program not found.");

  await prisma.workoutDay.create({
    data: {
      programId: program.id,
      name: required(formData, "name"),
      muscleGroup: required(formData, "muscleGroup"),
      notes: optional(formData, "notes"),
    },
  });
  revalidateWorkouts();
}

export async function addPlannedExercise(formData: FormData) {
  const user = await requireUser();
  const dayId = required(formData, "dayId");
  const day = await prisma.workoutDay.findFirst({
    where: { id: dayId, program: { userId: user.id } },
    select: { id: true },
  });
  if (!day) throw new Error("Workout day not found.");

  const parsed = plannedExerciseSchema.safeParse({
    name: formData.get("name"),
    muscleGroup: optional(formData, "muscleGroup"),
    sets: numberOrUndefined(formData, "sets"),
    reps: numberOrUndefined(formData, "reps"),
    weightKg: numberOrUndefined(formData, "weightKg"),
    restSec: numberOrUndefined(formData, "restSec"),
    rpe: numberOrUndefined(formData, "rpe"),
    rir: numberOrUndefined(formData, "rir"),
    notes: optional(formData, "notes") ?? "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid planned exercise.");

  await prisma.plannedExercise.create({ data: { dayId: day.id, ...parsed.data } });
  revalidateWorkouts();
}

export async function createWorkoutSession(formData: FormData) {
  const user = await requireUser();
  const programId = optional(formData, "programId");
  if (programId) {
    const program = await prisma.workoutProgram.findFirst({ where: { id: programId, userId: user.id }, select: { id: true } });
    if (!program) throw new Error("Workout program not found.");
  }

  const date = required(formData, "date");
  if (Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime())) throw new Error("Invalid workout date.");
  const session = await prisma.workoutSession.create({
    data: {
      userId: user.id,
      programId,
      date: new Date(`${date}T00:00:00.000Z`),
      dayName: optional(formData, "dayName"),
      durationMin: numberOrUndefined(formData, "durationMin"),
      notes: optional(formData, "notes"),
    },
  });
  revalidateWorkouts();
  redirect(`/workouts?sessionId=${session.id}`);
}

export async function addWorkoutSet(formData: FormData) {
  const user = await requireUser();
  const sessionId = required(formData, "sessionId");
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId: user.id }, select: { id: true } });
  if (!session) throw new Error("Workout session not found.");

  const parsed = completedWorkoutSetSchema.safeParse({
    exerciseName: formData.get("exerciseName"),
    setNumber: formData.get("setNumber"),
    weightKg: formData.get("weightKg"),
    reps: formData.get("reps"),
    durationSec: formData.get("durationSec") || undefined,
    rpe: formData.get("rpe") || undefined,
    rir: formData.get("rir") || undefined,
    notes: optional(formData, "notes") ?? "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid workout set.");

  await prisma.workoutSet.create({ data: { sessionId: session.id, ...parsed.data } });
  revalidateWorkouts();
}

export async function addCardioSession(formData: FormData) {
  const user = await requireUser();
  const sessionId = optional(formData, "sessionId");
  if (sessionId) {
    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId: user.id }, select: { id: true } });
    if (!session) throw new Error("Workout session not found.");
  }

  const parsed = cardioSessionSchema.safeParse({
    activity: formData.get("activity"),
    durationMin: formData.get("durationMin"),
    distanceKm: formData.get("distanceKm") || undefined,
    resistance: formData.get("resistance") || undefined,
    speed: formData.get("speed") || undefined,
    incline: formData.get("incline") || undefined,
    heartRate: formData.get("heartRate") || undefined,
    estimatedCalories: formData.get("estimatedCalories") || undefined,
    notes: optional(formData, "notes") ?? "",
    date: formData.get("date"),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid cardio session.");

  await prisma.cardioSession.create({
    data: {
      userId: user.id,
      sessionId,
      ...parsed.data,
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
    },
  });
  revalidateWorkouts();
}