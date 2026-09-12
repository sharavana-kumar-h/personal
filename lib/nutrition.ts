export type NutritionValues = {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
};

export type NutritionEntry = NutritionValues & {
  mealId?: string;
  date?: Date | string;
};

export const emptyNutritionValues = (): NutritionValues => ({
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fat: 0,
  fiber: 0,
});

export function sumNutrition(entries: NutritionEntry[]) {
  return entries.reduce<NutritionValues>((total, entry) => ({
    calories: total.calories + entry.calories,
    protein: total.protein + entry.protein,
    carbohydrates: total.carbohydrates + entry.carbohydrates,
    fat: total.fat + entry.fat,
    fiber: total.fiber + entry.fiber,
  }), emptyNutritionValues());
}

export function roundNutrition(values: NutritionValues): NutritionValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, Math.round((value + Number.EPSILON) * 100) / 100]),
  ) as NutritionValues;
}

export function calculateRemainingCalories(consumed: number, target: number) {
  return Number((target - consumed).toFixed(2));
}

export function averageNutrition(dailyTotals: NutritionValues[]) {
  if (dailyTotals.length === 0) {
    return emptyNutritionValues();
  }

  return roundNutrition({
    calories: dailyTotals.reduce((sum, day) => sum + day.calories, 0) / dailyTotals.length,
    protein: dailyTotals.reduce((sum, day) => sum + day.protein, 0) / dailyTotals.length,
    carbohydrates: dailyTotals.reduce((sum, day) => sum + day.carbohydrates, 0) / dailyTotals.length,
    fat: dailyTotals.reduce((sum, day) => sum + day.fat, 0) / dailyTotals.length,
    fiber: dailyTotals.reduce((sum, day) => sum + day.fiber, 0) / dailyTotals.length,
  });
}

export function formatDateInput(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getUtcDayRange(dateInput: string) {
  const start = new Date(`${dateInput}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function getPreviousSevenDayDates(dateInput: string) {
  const selected = new Date(`${dateInput}T00:00:00.000Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selected);
    date.setUTCDate(selected.getUTCDate() - (6 - index));
    return formatDateInput(date);
  });
}
