import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { roundNutrition, sumNutrition } from "@/lib/nutrition";
import { calculateWorkoutVolume, type WorkoutHistoryEntry } from "@/lib/workouts";

export type CoachMode = "nutrition" | "workout";
export type DataProvenance = "measured" | "user_entered" | "calculated" | "estimated" | "ai_recommendation";

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

function provenanceForMeasurement(source: string | null) {
  return source && source.toLowerCase() !== "manual" ? "measured" as const : "user_entered" as const;
}

function labeled<T>(value: T, provenance: DataProvenance) {
  return { value, provenance };
}

export async function buildNutritionCoachContext(userId: string, now = new Date()) {
  const authenticatedUser = await requireUser();
  if (authenticatedUser.id !== userId) {
    throw new Error("Unauthorized");
  }

  const today = dayStart(now);
  const tomorrow = shiftDays(today, 1);
  const historyStart = shiftDays(today, -30);
  const bodyStart = shiftDays(today, -90);

  const [meals, goal, snapshots] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: historyStart, lt: tomorrow } },
      include: { foods: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
    prisma.bodyCompositionSnapshot.findMany({
      where: { userId, date: { gte: bodyStart, lt: tomorrow } },
      orderBy: { date: "asc" },
    }),
  ]);

  const todayMeals = meals.filter((meal) => meal.date.getTime() === today.getTime());
  const todayFoods = todayMeals.flatMap((meal) => meal.foods);
  const dailyTotals = new Map<string, ReturnType<typeof sumNutrition>>();

  for (const meal of meals) {
    const date = meal.date.toISOString().slice(0, 10);
    const existing = dailyTotals.get(date) ?? sumNutrition([]);
    dailyTotals.set(date, sumNutrition([
      existing,
      ...meal.foods.map((food) => ({
        calories: food.calories,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        fat: food.fat,
        fiber: food.fiber,
      })),
    ]));
  }

  return {
    mode: "nutrition" as const,
    today: {
      date: today.toISOString().slice(0, 10),
      meals: todayMeals.map((meal) => ({
        type: labeled(meal.mealType, "user_entered"),
        name: labeled(meal.name, "user_entered"),
        foods: meal.foods.map((food) => ({
          name: labeled(food.name, "user_entered"),
          quantityGrams: labeled(food.quantityGrams, "user_entered"),
          calories: labeled(food.calories, food.isAiEstimate ? "estimated" : "user_entered"),
          protein: labeled(food.protein, food.isAiEstimate ? "estimated" : "user_entered"),
          carbohydrates: labeled(food.carbohydrates, food.isAiEstimate ? "estimated" : "user_entered"),
          fat: labeled(food.fat, food.isAiEstimate ? "estimated" : "user_entered"),
          fiber: labeled(food.fiber, food.isAiEstimate ? "estimated" : "user_entered"),
          estimate: food.isAiEstimate,
        })),
      })),
      totals: labeled(roundNutrition(sumNutrition(todayFoods)), "calculated"),
    },
    goals: goal ? {
      calories: labeled(goal.calorieTarget, "user_entered"),
      protein: labeled(goal.proteinTarget, "user_entered"),
      carbohydrates: labeled(goal.carbTarget, "user_entered"),
      fat: labeled(goal.fatTarget, "user_entered"),
      fiber: labeled(goal.fiberTarget, "user_entered"),
    } : { status: "not_available" as const },
    recentNutrition: Array.from(dailyTotals.entries()).map(([date, totals]) => ({
      date,
      totals: labeled(roundNutrition(totals), "calculated"),
    })),
    bodyComposition: snapshots.map((snapshot) => ({
      date: snapshot.date.toISOString().slice(0, 10),
      weightKg: labeled(snapshot.weightKg, provenanceForMeasurement(snapshot.measurementSource)),
      bmi: labeled(snapshot.bmi, provenanceForMeasurement(snapshot.measurementSource)),
      bodyFatPercent: labeled(snapshot.pbf, provenanceForMeasurement(snapshot.measurementSource)),
      leanMassKg: labeled(snapshot.fatFreeMass, provenanceForMeasurement(snapshot.measurementSource)),
    })),
    provenance: {
      measured: "Values from a non-manual body-composition measurement source.",
      user_entered: "Values entered directly by the user.",
      calculated: "Values calculated from stored entries, such as daily totals.",
      estimated: "Nutrition values marked as AI estimates and not verified facts.",
      ai_recommendation: "Advice generated for this response only; not stored as measured data.",
    },
  };
}

export async function buildWorkoutCoachContext(userId: string, now = new Date()) {
  const authenticatedUser = await requireUser();
  if (authenticatedUser.id !== userId) {
    throw new Error("Unauthorized");
  }

  const end = shiftDays(dayStart(now), 1);
  const start = shiftDays(end, -90);

  const [program, sessions, standaloneCardio, goal] = await Promise.all([
    prisma.workoutProgram.findFirst({
      where: { userId, isActive: true },
      include: { days: { include: { exercises: true }, orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { sets: true, cardioSessions: true },
      orderBy: { date: "asc" },
    }),
    prisma.cardioSession.findMany({
      where: { userId, sessionId: null, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
  ]);

  const history: WorkoutHistoryEntry[] = sessions.flatMap((session) => session.sets.map((set) => ({
    exerciseName: set.exerciseName,
    weightKg: set.weightKg,
    reps: set.reps,
    date: session.date.toISOString().slice(0, 10),
  })));

  const progression = new Map<string, WorkoutHistoryEntry[]>();
  for (const entry of history) {
    const key = entry.exerciseName.trim().toLowerCase();
    progression.set(key, [...(progression.get(key) ?? []), entry]);
  }

  return {
    mode: "workout" as const,
    program: program ? {
      name: labeled(program.name, "user_entered"),
      split: labeled(program.split, "user_entered"),
      days: program.days.map((day) => ({
        name: labeled(day.name, "user_entered"),
        muscleGroup: labeled(day.muscleGroup, "user_entered"),
        exercises: day.exercises.map((exercise) => ({
          name: labeled(exercise.name, "user_entered"),
          sets: labeled(exercise.sets, "user_entered"),
          reps: labeled(exercise.reps, "user_entered"),
          weightKg: labeled(exercise.weightKg, "user_entered"),
          restSec: labeled(exercise.restSec, "user_entered"),
          rpe: labeled(exercise.rpe, "user_entered"),
          rir: labeled(exercise.rir, "user_entered"),
        })),
      })),
    } : { status: "not_available" as const },
    completedSessions: [
      ...sessions.map((session) => ({
      date: session.date.toISOString().slice(0, 10),
      dayName: labeled(session.dayName, "user_entered"),
      durationMin: labeled(session.durationMin, "user_entered"),
      sets: session.sets.map((set) => ({
        exerciseName: labeled(set.exerciseName, "user_entered"),
        setNumber: labeled(set.setNumber, "user_entered"),
        weightKg: labeled(set.weightKg, "user_entered"),
        reps: labeled(set.reps, "user_entered"),
        volumeKg: labeled(set.weightKg * set.reps, "calculated"),
        rpe: labeled(set.rpe, "user_entered"),
        rir: labeled(set.rir, "user_entered"),
      })),
      cardio: session.cardioSessions.map((cardio) => ({
        activity: labeled(cardio.activity, "user_entered"),
        durationMin: labeled(cardio.durationMin, "user_entered"),
        distanceKm: labeled(cardio.distanceKm, "user_entered"),
        speed: labeled(cardio.speed, "user_entered"),
        incline: labeled(cardio.incline, "user_entered"),
        heartRate: labeled(cardio.heartRate, "user_entered"),
        estimatedCalories: labeled(cardio.estimatedCalories, "estimated"),
      })),
      })),
      ...standaloneCardio.map((cardio) => ({
        date: cardio.date.toISOString().slice(0, 10),
        dayName: labeled(null, "user_entered"),
        durationMin: labeled(null, "user_entered"),
        sets: [],
        cardio: [{
          activity: labeled(cardio.activity, "user_entered"),
          durationMin: labeled(cardio.durationMin, "user_entered"),
          distanceKm: labeled(cardio.distanceKm, "user_entered"),
          speed: labeled(cardio.speed, "user_entered"),
          incline: labeled(cardio.incline, "user_entered"),
          heartRate: labeled(cardio.heartRate, "user_entered"),
          estimatedCalories: labeled(cardio.estimatedCalories, "estimated"),
        }],
      })),
    ],
    strengthProgression: Array.from(progression.entries()).map(([exerciseName, entries]) => ({
      exerciseName,
      entries,
      totalVolumeKg: labeled(calculateWorkoutVolume(entries.map((entry, index) => ({ ...entry, setNumber: index + 1 }))), "calculated"),
    })),
    goals: goal ? {
      nutrition: {
        calories: labeled(goal.calorieTarget, "user_entered"),
        protein: labeled(goal.proteinTarget, "user_entered"),
      },
      workout: { status: "not_available" as const },
    } : { status: "not_available" as const },
    provenance: {
      measured: "No direct workout measurements are stored in this context.",
      user_entered: "Program and completed-workout values entered by the user.",
      calculated: "Volume and progression values calculated from stored sets.",
      estimated: "Cardio calories marked as estimated where present.",
      ai_recommendation: "Advice generated for this response only; not stored as workout data.",
    },
  };
}

export async function buildCoachContext(userId: string, mode: CoachMode, now = new Date()) {
  return mode === "nutrition"
    ? buildNutritionCoachContext(userId, now)
    : buildWorkoutCoachContext(userId, now);
}
