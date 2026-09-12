import { prisma } from "@/lib/db";
import { roundNutrition, sumNutrition, type NutritionValues } from "@/lib/nutrition";

export type DashboardRangeKey = "7" | "14" | "30" | "90" | "180" | "365" | "custom";

export type DashboardFilter = {
  range?: string;
  from?: string;
  to?: string;
};

const rangeDays: Record<Exclude<DashboardRangeKey, "custom">, number> = {
  "7": 7,
  "14": 14,
  "30": 30,
  "90": 90,
  "180": 180,
  "365": 365,
};

function dayStart(date: Date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function shiftDays(date: Date, days: number) {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value;
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveDashboardRange(filter: DashboardFilter, now = new Date()) {
  const selected = filter.range && filter.range in rangeDays ? filter.range as Exclude<DashboardRangeKey, "custom"> : "30";
  const customFrom = parseDate(filter.from);
  const customTo = parseDate(filter.to);

  if (filter.range === "custom" && customFrom && customTo && customFrom <= customTo) {
    return {
      key: "custom" as const,
      start: customFrom,
      end: shiftDays(customTo, 1),
      from: customFrom.toISOString().slice(0, 10),
      to: customTo.toISOString().slice(0, 10),
      label: `${customFrom.toISOString().slice(0, 10)} to ${customTo.toISOString().slice(0, 10)}`,
    };
  }

  const end = shiftDays(dayStart(now), 1);
  const start = shiftDays(end, -rangeDays[selected]);
  return {
    key: selected,
    start,
    end,
    from: start.toISOString().slice(0, 10),
    to: shiftDays(end, -1).toISOString().slice(0, 10),
    label: `Last ${rangeDays[selected]} days`,
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function emptyNutrition(): NutritionValues {
  return { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
}

export async function getDashboardData(userId: string, filter: DashboardFilter = {}, now = new Date()) {
  const range = resolveDashboardRange(filter, now);
  const today = dayStart(now);
  const tomorrow = shiftDays(today, 1);

  const [meals, sessions, cardio, snapshots, goal, todayMeals, todaySessions, todayCardio, currentSnapshot] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: range.start, lt: range.end } },
      include: { foods: true },
      orderBy: { date: "asc" },
    }),
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: range.start, lt: range.end } },
      include: { sets: true, cardioSessions: true },
      orderBy: { date: "asc" },
    }),
    prisma.cardioSession.findMany({
      where: { userId, sessionId: null, date: { gte: range.start, lt: range.end } },
      orderBy: { date: "asc" },
    }),
    prisma.bodyCompositionSnapshot.findMany({
      where: { userId, date: { gte: range.start, lt: range.end } },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
    prisma.meal.findMany({ where: { userId, date: { gte: today, lt: tomorrow } }, include: { foods: true } }),
    prisma.workoutSession.findMany({ where: { userId, date: { gte: today, lt: tomorrow } }, include: { cardioSessions: true } }),
    prisma.cardioSession.findMany({ where: { userId, sessionId: null, date: { gte: today, lt: tomorrow } } }),
    prisma.bodyCompositionSnapshot.findFirst({ where: { userId, date: { lt: tomorrow } }, orderBy: { date: "desc" } }),
  ]);

  const todayFoods = todayMeals.flatMap((meal) => meal.foods);
  const todayNutrition = roundNutrition(sumNutrition(todayFoods));
  const todayCardioEntries = [...todaySessions.flatMap((session) => session.cardioSessions), ...todayCardio];
  const todayCardioCalories = todayCardioEntries
    .reduce((total, cardio) => total + (cardio.estimatedCalories ?? 0), 0);
  const estimatedCaloriesExpended = currentSnapshot?.bmr === null || currentSnapshot?.bmr === undefined
    ? todayCardioCalories || null
    : currentSnapshot.bmr + todayCardioCalories;

  const nutritionByDate = new Map<string, NutritionValues>();
  for (const meal of meals) {
    const key = dateKey(meal.date);
    nutritionByDate.set(key, sumNutrition([
      nutritionByDate.get(key) ?? emptyNutrition(),
      ...meal.foods,
    ]));
  }

  const workoutByDate = new Map<string, { sessions: number; volumeKg: number; cardioDurationMin: number; cardioDistanceKm: number }>();
  const exerciseByName = new Map<string, Array<{ date: string; weightKg: number; reps: number }>>();
  const personalRecords = new Map<string, { exerciseName: string; weightKg: number; reps: number; date: string }>();

  for (const session of sessions) {
    const key = dateKey(session.date);
    const day = workoutByDate.get(key) ?? { sessions: 0, volumeKg: 0, cardioDurationMin: 0, cardioDistanceKm: 0 };
    day.sessions += 1;
    day.volumeKg += session.sets.reduce((total, set) => total + set.weightKg * set.reps, 0);
    day.cardioDurationMin += session.cardioSessions.reduce((total, cardio) => total + cardio.durationMin, 0);
    day.cardioDistanceKm += session.cardioSessions.reduce((total, cardio) => total + (cardio.distanceKm ?? 0), 0);
    workoutByDate.set(key, day);

    const exercisesForSession = new Map<string, { weightKg: number; reps: number }>();
    for (const set of session.sets) {
      const normalized = set.exerciseName.trim().toLowerCase();
      const current = exercisesForSession.get(normalized);
      if (!current || set.weightKg > current.weightKg || (set.weightKg === current.weightKg && set.reps > current.reps)) {
        exercisesForSession.set(normalized, { weightKg: set.weightKg, reps: set.reps });
      }
      const record = personalRecords.get(normalized);
      if (!record || set.weightKg > record.weightKg || (set.weightKg === record.weightKg && set.reps > record.reps)) {
        personalRecords.set(normalized, { exerciseName: set.exerciseName, weightKg: set.weightKg, reps: set.reps, date: key });
      }
    }
    for (const [normalized, best] of exercisesForSession) {
      const existing = exerciseByName.get(normalized) ?? [];
      existing.push({ date: key, ...best });
      exerciseByName.set(normalized, existing);
    }
  }

  for (const entry of cardio) {
    const key = dateKey(entry.date);
    const day = workoutByDate.get(key) ?? { sessions: 0, volumeKg: 0, cardioDurationMin: 0, cardioDistanceKm: 0 };
    day.cardioDurationMin += entry.durationMin;
    day.cardioDistanceKm += entry.distanceKm ?? 0;
    workoutByDate.set(key, day);
  }

  const nutritionChart = Array.from(nutritionByDate.entries()).map(([date, values]) => ({ date, ...roundNutrition(values) }));
  const fitnessChart = Array.from(workoutByDate.entries()).map(([date, values]) => ({ date, ...values }));
  const exerciseProgression = Array.from(exerciseByName.entries()).flatMap(([exerciseName, entries]) => entries.map((entry) => ({ exerciseName, ...entry })));

  return {
    range,
    today: {
      nutrition: todayNutrition,
      caloriesExpended: estimatedCaloriesExpended,
      calorieBalance: estimatedCaloriesExpended === null ? null : Number((todayNutrition.calories - estimatedCaloriesExpended).toFixed(2)),
      workoutStatus: todaySessions.length > 0 ? "Logged" : "Not logged",
      activity: {
        workoutSessions: todaySessions.length,
        cardioMinutes: todayCardioEntries.reduce((total, entry) => total + entry.durationMin, 0),
        cardioDistanceKm: todayCardioEntries.reduce((total, entry) => total + (entry.distanceKm ?? 0), 0),
      },
      water: null,
      goalProgress: goal ? {
        calories: goal.calorieTarget ? Math.min(todayNutrition.calories / goal.calorieTarget, 1) : null,
        protein: goal.proteinTarget ? Math.min(todayNutrition.protein / goal.proteinTarget, 1) : null,
      } : null,
      goal,
      hasNutrition: todayMeals.length > 0,
      hasWorkout: todaySessions.length > 0,
    },
    bodyComposition: snapshots.map((snapshot) => ({
      date: dateKey(snapshot.date),
      weightKg: snapshot.weightKg,
      bmi: snapshot.bmi,
      pbf: snapshot.pbf,
      bfm: snapshot.bfm,
      smm: snapshot.smm,
      fatFreeMass: snapshot.fatFreeMass,
      visceralFat: snapshot.visceralFatLevel,
      waistHipRatio: snapshot.waistHipRatio,
      bmr: snapshot.bmr,
    })),
    fitness: {
      daily: fitnessChart,
      exerciseProgression,
      personalRecords: Array.from(personalRecords.values()).sort((a, b) => b.weightKg - a.weightKg),
    },
    nutrition: nutritionChart,
    hasData: {
      bodyComposition: snapshots.length > 0,
      fitness: sessions.length > 0,
      nutrition: meals.length > 0,
    },
  };
}
