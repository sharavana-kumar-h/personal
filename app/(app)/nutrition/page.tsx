import Link from "next/link";

import {
  addFoodEntry,
  createMeal,
  deleteFoodEntry,
  saveNutritionGoal,
  updateFoodEntry,
} from "@/app/actions/nutrition";
import { requireUser } from "@/lib/auth";
import { createPerformanceContext, measurePerformance } from "@/lib/perf";
import { calculateRemainingCalories, formatDateInput } from "@/lib/nutrition";
import { getMealDisplayName, getNutritionDashboard, getNutritionGoalOrDefault } from "@/services/nutrition";

const mealTypes = [
  ["BREAKFAST", "Breakfast"],
  ["LUNCH", "Lunch"],
  ["DINNER", "Dinner"],
  ["SNACK", "Snack"],
  ["CUSTOM", "Custom meal"],
] as const;

function numberValue(value: number | null | undefined) {
  return value ?? "";
}

function metricCard(label: string, value: number, unit: string, detail?: string) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toFixed(1)}{unit}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  );
}

export default async function NutritionPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const context = createPerformanceContext();
  const user = await requireUser();
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : formatDateInput();
  const dashboard = await measurePerformance("page.nutrition.data", context, () => getNutritionDashboard(user.id, date, context));
  const goal = getNutritionGoalOrDefault(dashboard.goal);
  const remainingCalories = calculateRemainingCalories(dashboard.dailyTotal.calories, goal.calorieTarget);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Nutrition</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Daily nutrition dashboard</h2>
          <p className="mt-2 text-slate-400">Log your meals with values you have reviewed and edited.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300">Back to dashboard</Link>
      </div>

      <form method="GET" className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <label className="text-sm text-slate-300">Date<input type="date" name="date" defaultValue={date} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">View day</button>
      </form>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCard("Calories consumed", dashboard.dailyTotal.calories, " kcal", `Target ${goal.calorieTarget} kcal`)}
        {metricCard("Remaining calories", remainingCalories, " kcal", remainingCalories < 0 ? "Over target" : "Available today")}
        {metricCard("Protein consumed", dashboard.dailyTotal.protein, " g", `Target ${goal.proteinTarget} g`)}
        {metricCard("Carbs consumed", dashboard.dailyTotal.carbohydrates, " g", goal.carbTarget === null ? "No target set" : `Target ${goal.carbTarget} g`)}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {metricCard("Fat consumed", dashboard.dailyTotal.fat, " g", goal.fatTarget === null ? "No target set" : `Target ${goal.fatTarget} g`)}
        {metricCard("Fiber consumed", dashboard.dailyTotal.fiber, " g", goal.fiberTarget === null ? "No target set" : `Target ${goal.fiberTarget} g`)}
        {metricCard("Protein target", goal.proteinTarget, " g", `${dashboard.dailyTotal.protein.toFixed(1)} g consumed`)}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Meals for {date}</h3>
            <span className="text-sm text-slate-500">{dashboard.meals.length} meal{dashboard.meals.length === 1 ? "" : "s"}</span>
          </div>

          {dashboard.meals.map((meal) => (
            <div key={meal.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-400">{getMealDisplayName(meal.mealType, meal.name)}</p>
                  <h4 className="mt-1 text-lg font-semibold text-white">{meal.name}</h4>
                </div>
                <p className="text-sm text-slate-400">{meal.foods.reduce((sum, food) => sum + food.calories, 0).toFixed(0)} kcal</p>
              </div>

              <div className="mt-4 space-y-3">
                {meal.foods.map((food) => (
                  <form key={food.id} action={updateFoodEntry.bind(null, food.id)} className="grid gap-2 border-t border-slate-800 pt-3 md:grid-cols-8">
                    <input name="name" defaultValue={food.name} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white md:col-span-2" aria-label="Food name" />
                    <input name="quantityGrams" type="number" step="0.1" defaultValue={food.quantityGrams} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Quantity in grams" />
                    <input name="calories" type="number" step="0.1" defaultValue={food.calories} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Calories" />
                    <input name="protein" type="number" step="0.1" defaultValue={food.protein} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Protein grams" />
                    <input name="carbohydrates" type="number" step="0.1" defaultValue={food.carbohydrates} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Carbohydrates grams" />
                    <input name="fat" type="number" step="0.1" defaultValue={food.fat} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Fat grams" />
                    <input name="fiber" type="number" step="0.1" defaultValue={food.fiber} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" aria-label="Fiber grams" />
                    <div className="flex gap-2 md:col-span-8">
                      <label className="flex items-center gap-2 text-xs text-slate-400"><input name="isAiEstimate" type="checkbox" defaultChecked={food.isAiEstimate} /> AI estimate</label>
                      <input name="sourceNote" defaultValue={food.sourceNote ?? ""} placeholder="Source note" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" />
                      <button type="submit" className="rounded-lg border border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10">Save</button>
                      <button formAction={deleteFoodEntry.bind(null, food.id)} className="rounded-lg border border-rose-500 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10">Delete</button>
                    </div>
                  </form>
                ))}
              </div>

              <form action={addFoodEntry} className="mt-5 grid gap-2 border-t border-slate-800 pt-4 md:grid-cols-8">
                <input type="hidden" name="mealId" value={meal.id} />
                <input name="name" placeholder="Food name" required className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white md:col-span-2" />
                <input name="quantityGrams" type="number" min="0.1" step="0.1" placeholder="g" required className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <input name="calories" type="number" min="0" step="0.1" placeholder="kcal" required className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <input name="protein" type="number" min="0" step="0.1" placeholder="protein g" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <input name="carbohydrates" type="number" min="0" step="0.1" placeholder="carbs g" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <input name="fat" type="number" min="0" step="0.1" placeholder="fat g" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <input name="fiber" type="number" min="0" step="0.1" placeholder="fiber g" className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" />
                <div className="flex items-center gap-3 md:col-span-8">
                  <label className="flex items-center gap-2 text-xs text-slate-400"><input name="isAiEstimate" type="checkbox" /> AI estimate</label>
                  <input name="sourceNote" placeholder="Source note" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-white" />
                  <button type="submit" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-white">Add food</button>
                </div>
              </form>
            </div>
          ))}

          {dashboard.meals.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No meals logged for this date.</p> : null}
        </div>

        <aside className="space-y-6">
          <form action={createMeal} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Create meal</h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm text-slate-300">Meal type<select name="mealType" defaultValue="BREAKFAST" className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">{mealTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="block text-sm text-slate-300">Custom name<input name="customName" placeholder="Used for custom meals" className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
              <input type="hidden" name="date" value={date} />
              <button type="submit" className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Create meal</button>
            </div>
          </form>

          <form action={saveNutritionGoal} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Daily goals</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">Calories<input name="calorieTarget" type="number" defaultValue={goal.calorieTarget} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label>
              <label className="text-xs text-slate-400">Protein g<input name="proteinTarget" type="number" step="0.1" defaultValue={goal.proteinTarget} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label>
              <label className="text-xs text-slate-400">Carbs g<input name="carbTarget" type="number" step="0.1" defaultValue={numberValue(goal.carbTarget)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label>
              <label className="text-xs text-slate-400">Fat g<input name="fatTarget" type="number" step="0.1" defaultValue={numberValue(goal.fatTarget)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label>
              <label className="text-xs text-slate-400">Fiber g<input name="fiberTarget" type="number" step="0.1" defaultValue={numberValue(goal.fiberTarget)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></label>
            </div>
            <button type="submit" className="mt-4 w-full rounded-lg border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">Save goals</button>
          </form>
        </aside>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm uppercase tracking-[0.18em] text-emerald-400">Last seven days</p><h3 className="mt-1 text-xl font-semibold text-white">Weekly average intake</h3></div>
          <p className="text-sm text-slate-400">Calories {dashboard.weeklyAverage.calories.toFixed(0)} kcal · Protein {dashboard.weeklyAverage.protein.toFixed(1)} g</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {metricCard("Average calories", dashboard.weeklyAverage.calories, " kcal")}
          {metricCard("Average protein", dashboard.weeklyAverage.protein, " g")}
          {metricCard("Average carbs", dashboard.weeklyAverage.carbohydrates, " g")}
          {metricCard("Average fat", dashboard.weeklyAverage.fat, " g", `${dashboard.weeklyAverage.fiber.toFixed(1)} g fiber`)}
        </div>
      </section>
    </div>
  );
}
