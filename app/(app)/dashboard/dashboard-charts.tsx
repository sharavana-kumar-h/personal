"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { getDashboardData } from "@/services/dashboard";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type ChartPoint = Record<string, string | number | null>;

const colors = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  amber: "#fbbf24",
  rose: "#fb7185",
  violet: "#a78bfa",
  slate: "#94a3b8",
};

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function ChartFrame({ title, description, data, children }: { title: string; description: string; data: ChartPoint[]; children: React.ReactNode }) {
  const hasNumericValue = data.some((point) => Object.entries(point).some(([key, value]) => key !== "date" && typeof value === "number" && !Number.isNaN(value)));

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5" aria-label={title}>
      <div className="mb-4">
        <h4 className="font-semibold text-white">{title}</h4>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {!hasNumericValue ? (
        <div className="flex min-h-[230px] items-center justify-center rounded-xl border border-dashed border-slate-700 px-6 text-center text-sm text-slate-500">Not enough stored data for this chart yet.</div>
      ) : (
        <div role="img" aria-label={`${title} chart`} className="h-[240px] w-full">{children}</div>
      )}
    </section>
  );
}

function lineChart(data: ChartPoint[], lines: Array<{ dataKey: string; name: string; color: string }>, unit = "") {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: colors.slate, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: colors.slate, fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0" }} labelFormatter={(label) => shortDate(String(label))} formatter={(value, name) => [`${value ?? "Not recorded"}${unit}`, name]} />
        {lines.length > 1 ? <Legend wrapperStyle={{ fontSize: 11 }} /> : null}
        {lines.map((line) => <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} name={line.name} stroke={line.color} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardCharts({ data }: { data: DashboardData }) {
  const body = data.bodyComposition;
  const fitness = data.fitness.daily;
  const nutrition = data.nutrition;
  const exerciseNames = Array.from(new Set(data.fitness.exerciseProgression.map((point) => point.exerciseName))).slice(0, 5);
  const exerciseByDate = new Map<string, ChartPoint>();
  for (const point of data.fitness.exerciseProgression) {
    if (!exerciseNames.includes(point.exerciseName)) continue;
    const current = exerciseByDate.get(point.date) ?? { date: point.date };
    current[point.exerciseName] = point.weightKg;
    exerciseByDate.set(point.date, current);
  }
  const exerciseChart = Array.from(exerciseByDate.values());

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4"><p className="text-sm uppercase tracking-[0.18em] text-emerald-400">Body composition</p><h3 className="mt-1 text-2xl font-semibold text-white">Trends from recorded snapshots</h3></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartFrame title="Weight" description="kg · recorded snapshots" data={body}>{lineChart(body, [{ dataKey: "weightKg", name: "Weight kg", color: colors.emerald }], " kg")}</ChartFrame>
          <ChartFrame title="BMI" description="recorded or calculated snapshot value" data={body}>{lineChart(body, [{ dataKey: "bmi", name: "BMI", color: colors.cyan }])}</ChartFrame>
          <ChartFrame title="PBF" description="percent body fat" data={body}>{lineChart(body, [{ dataKey: "pbf", name: "PBF %", color: colors.amber }], " %")}</ChartFrame>
          <ChartFrame title="BFM" description="body fat mass · kg" data={body}>{lineChart(body, [{ dataKey: "bfm", name: "BFM kg", color: colors.rose }], " kg")}</ChartFrame>
          <ChartFrame title="SMM" description="skeletal muscle mass · kg" data={body}>{lineChart(body, [{ dataKey: "smm", name: "SMM kg", color: colors.violet }], " kg")}</ChartFrame>
          <ChartFrame title="Fat-free mass" description="kg · recorded snapshots" data={body}>{lineChart(body, [{ dataKey: "fatFreeMass", name: "FFM kg", color: colors.emerald }], " kg")}</ChartFrame>
          <ChartFrame title="Visceral fat" description="recorded snapshot value" data={body}>{lineChart(body, [{ dataKey: "visceralFat", name: "Visceral fat", color: colors.rose }])}</ChartFrame>
          <ChartFrame title="Waist-hip ratio" description="recorded snapshot value" data={body}>{lineChart(body, [{ dataKey: "waistHipRatio", name: "WHR", color: colors.cyan }])}</ChartFrame>
          <ChartFrame title="BMR" description="kcal/day · recorded or calculated snapshot value" data={body}>{lineChart(body, [{ dataKey: "bmr", name: "BMR", color: colors.amber }], " kcal")}</ChartFrame>
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-sm uppercase tracking-[0.18em] text-emerald-400">Fitness</p><h3 className="mt-1 text-2xl font-semibold text-white">Training load and progression</h3></div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartFrame title="Workout frequency" description="completed sessions per logged day" data={fitness}>{<ResponsiveContainer width="100%" height="100%"><BarChart data={fitness} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#1e293b" vertical={false} /><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: colors.slate, fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: colors.slate, fontSize: 11 }} axisLine={false} tickLine={false} width={30} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10 }} /><Bar dataKey="sessions" name="Sessions" fill={colors.emerald} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</ChartFrame>
          <ChartFrame title="Training volume" description="kg lifted from completed sets" data={fitness}>{lineChart(fitness, [{ dataKey: "volumeKg", name: "Volume kg", color: colors.cyan }], " kg")}</ChartFrame>
          <ChartFrame title="Exercise progression" description="best logged weight per exercise session" data={exerciseChart}>{lineChart(exerciseChart, exerciseNames.map((name, index) => ({ dataKey: name, name, color: [colors.emerald, colors.cyan, colors.amber, colors.rose, colors.violet][index] ?? colors.slate })), " kg")}</ChartFrame>
          <ChartFrame title="Cardio duration" description="minutes from logged cardio sessions" data={fitness}>{lineChart(fitness, [{ dataKey: "cardioDurationMin", name: "Minutes", color: colors.amber }], " min")}</ChartFrame>
          <ChartFrame title="Cardio distance" description="km from logged cardio sessions" data={fitness}>{lineChart(fitness, [{ dataKey: "cardioDistanceKm", name: "Distance km", color: colors.violet }], " km")}</ChartFrame>
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5" aria-label="Personal records"><h4 className="font-semibold text-white">Personal records</h4><p className="mt-1 text-xs text-slate-500">Heaviest logged weight in the selected range</p>{data.fitness.personalRecords.length === 0 ? <div className="flex min-h-[180px] items-center justify-center text-sm text-slate-500">No completed sets in this range yet.</div> : <ul className="mt-4 divide-y divide-slate-800">{data.fitness.personalRecords.slice(0, 8).map((record) => <li key={record.exerciseName} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-slate-300">{record.exerciseName}</span><span className="text-right font-semibold text-white">{record.weightKg} kg × {record.reps}<span className="block text-xs font-normal text-slate-500">{shortDate(record.date)}</span></span></li>)}</ul>}</section>
        </div>
      </section>

      <section>
        <div className="mb-4"><p className="text-sm uppercase tracking-[0.18em] text-emerald-400">Nutrition</p><h3 className="mt-1 text-2xl font-semibold text-white">Logged intake over time</h3></div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartFrame title="Calories" description="kcal from logged food entries" data={nutrition}>{lineChart(nutrition, [{ dataKey: "calories", name: "Calories", color: colors.emerald }], " kcal")}</ChartFrame>
          <ChartFrame title="Protein" description="grams from logged food entries" data={nutrition}>{lineChart(nutrition, [{ dataKey: "protein", name: "Protein", color: colors.cyan }], " g")}</ChartFrame>
          <ChartFrame title="Carbohydrates" description="grams from logged food entries" data={nutrition}>{lineChart(nutrition, [{ dataKey: "carbohydrates", name: "Carbs", color: colors.amber }], " g")}</ChartFrame>
          <ChartFrame title="Fat" description="grams from logged food entries" data={nutrition}>{lineChart(nutrition, [{ dataKey: "fat", name: "Fat", color: colors.rose }], " g")}</ChartFrame>
          <ChartFrame title="Fiber" description="grams from logged food entries" data={nutrition}>{lineChart(nutrition, [{ dataKey: "fiber", name: "Fiber", color: colors.violet }], " g")}</ChartFrame>
        </div>
      </section>
    </div>
  );
}
