import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard";
import DashboardCharts from "./dashboard-charts";

const rangeOptions = [
  ["7", "7 days"],
  ["14", "14 days"],
  ["30", "30 days"],
  ["90", "90 days"],
  ["180", "6 months"],
  ["365", "1 year"],
  ["custom", "Custom range"],
] as const;

function displayValue(value: number | null | undefined, unit = "") {
  return value === null || value === undefined ? "Not available" : `${value.toFixed(1)}${unit}`;
}

function metricCard(label: string, value: string, detail: string, tone = "text-white") {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400"><span>{label}</span><span>{value === null ? "No target" : `${Math.round(value * 100)}%`}</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: value === null ? "0%" : `${Math.round(value * 100)}%` }} /></div>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await getDashboardData(user.id, params);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(52,211,153,0.14),_transparent_38%),#0f172a] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Private overview</p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Welcome back, {user.name ?? user.email}</h2>
            <p className="mt-3 max-w-2xl text-slate-300">A clear read on what you have actually logged, with estimates labeled and missing data left visible.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/nutrition" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400">Log nutrition</Link>
            <Link href="/workouts" className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-emerald-400">Log workout</Link>
            <Link href="/ai" className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Open AI coach</Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="today-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.18em] text-emerald-400">Today</p><h3 id="today-heading" className="mt-1 text-2xl font-semibold text-white">What is logged today</h3></div><span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCard("Calories consumed", data.today.hasNutrition ? displayValue(data.today.nutrition.calories, " kcal") : "No data", "Logged food entries")}
          {metricCard("Calories expended", displayValue(data.today.caloriesExpended, " kcal"), "Estimated from BMR and logged cardio", "text-amber-200")}
          {metricCard("Estimated balance", displayValue(data.today.calorieBalance, " kcal"), "Consumed minus estimated expended", "text-cyan-200")}
          {metricCard("Protein", data.today.hasNutrition ? displayValue(data.today.nutrition.protein, " g") : "No data", data.today.goal ? `Target ${data.today.goal.proteinTarget} g` : "No target set")}
          {metricCard("Carbs", data.today.hasNutrition ? displayValue(data.today.nutrition.carbohydrates, " g") : "No data", "Logged food entries")}
          {metricCard("Fat", data.today.hasNutrition ? displayValue(data.today.nutrition.fat, " g") : "No data", "Logged food entries")}
          {metricCard("Workout status", data.today.workoutStatus, `${data.today.activity.workoutSessions} completed session${data.today.activity.workoutSessions === 1 ? "" : "s"}`)}
          {metricCard("Activity", data.today.activity.cardioMinutes ? `${data.today.activity.cardioMinutes} min` : data.today.hasWorkout ? "Workout logged" : "No data", data.today.activity.cardioDistanceKm ? `${data.today.activity.cardioDistanceKm.toFixed(1)} km cardio` : "Logged movement only")}
          {metricCard("Water", "Not tracked", "No water field is stored yet", "text-slate-400")}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:col-span-2 lg:col-span-2"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Goal progress</p><div className="mt-4 space-y-4"><ProgressBar label="Calories" value={data.today.hasNutrition ? data.today.goalProgress?.calories ?? null : null} /><ProgressBar label="Protein" value={data.today.hasNutrition ? data.today.goalProgress?.protein ?? null : null} /></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-5" aria-label="Analytics filters">
        <form method="GET" className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <label className="text-sm text-slate-300">Analytics range<select name="range" defaultValue={data.range.key} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white">{rangeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm text-slate-300">From<input type="date" name="from" defaultValue={data.range.key === "custom" ? data.range.from : ""} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
          <label className="text-sm text-slate-300">To<input type="date" name="to" defaultValue={data.range.key === "custom" ? data.range.to : ""} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" /></label>
          <button type="submit" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white">Apply range</button>
          <span className="text-sm text-slate-500">Showing {data.range.label}</span>
        </form>
      </section>

      <DashboardCharts data={data} />
    </div>
  );
}
