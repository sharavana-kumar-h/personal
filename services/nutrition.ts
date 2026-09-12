import { prisma } from "@/lib/db";
import {
  averageNutrition,
  emptyNutritionValues,
  getPreviousSevenDayDates,
  getUtcDayRange,
  roundNutrition,
  sumNutrition,
} from "@/lib/nutrition";

export async function getNutritionDashboard(userId: string, dateInput: string) {
  const { start, end } = getUtcDayRange(dateInput);
  const dates = getPreviousSevenDayDates(dateInput);
  const weekStart = new Date(`${dates[0]}T00:00:00.000Z`);
  const weekEnd = new Date(`${dateInput}T00:00:00.000Z`);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 1);

  const [meals, weeklyMeals, goal] = await Promise.all([
    prisma.meal.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { foods: { orderBy: { createdAt: "asc" } } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
    prisma.meal.findMany({
      where: { userId, date: { gte: weekStart, lt: weekEnd } },
      include: { foods: true },
      orderBy: { date: "asc" },
    }),
    prisma.nutritionGoal.findUnique({ where: { userId } }),
  ]);

  const dailyTotals = dates.map((date) => {
    const entries = weeklyMeals
      .filter((meal) => meal.date.toISOString().slice(0, 10) === date)
      .flatMap((meal) => meal.foods);
    return sumNutrition(entries);
  });

  const foods = meals.flatMap((meal) => meal.foods);

  return {
    meals,
    goal,
    dailyTotal: roundNutrition(sumNutrition(foods)),
    weeklyAverage: averageNutrition(dailyTotals),
    dailyTotals,
  };
}

export function getMealDisplayName(mealType: string, name: string) {
  if (mealType === "CUSTOM") {
    return name;
  }

  return mealType.charAt(0) + mealType.slice(1).toLowerCase();
}

export function getNutritionGoalOrDefault(goal: {
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number | null;
  fatTarget: number | null;
  fiberTarget: number | null;
} | null) {
  return goal ?? {
    calorieTarget: 2000,
    proteinTarget: 150,
    carbTarget: null,
    fatTarget: null,
    fiberTarget: null,
  };
}

export function getEmptyNutritionTotal() {
  return emptyNutritionValues();
}
