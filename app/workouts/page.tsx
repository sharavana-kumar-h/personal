import Link from "next/link";

import { addCardioSession, addPlannedExercise, addWorkoutDay, addWorkoutSet, createWorkoutProgram, createWorkoutSession } from "@/app/actions/workouts";
import { requireUser } from "@/lib/auth";
import { createPerformanceContext, measurePerformance } from "@/lib/perf";
import { getWorkoutData } from "@/services/workouts";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function WorkoutsPage({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const context = createPerformanceContext();
  const user = await requireUser();
  const params = await searchParams;
  const data = await measurePerformance("page.workouts.data", context, () => getWorkoutData(user.id, context));
  const selectedSession = data.sessions.find((session) => session.id === params.sessionId) ?? data.sessions[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Training</p><h2 className="mt-2 text-3xl font-semibold text-white">Programs and completed workouts</h2><p className="mt-2 text-slate-400">Planned exercises stay separate from the sessions you actually complete.</p></div>
        <Link href="/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300">Back to dashboard</Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Completed sessions" value={String(data.totals.sessions)} />
        <Metric label="Logged sets" value={String(data.totals.sets)} />
        <Metric label="Strength volume" value={`${data.totals.volumeKg.toFixed(0)} kg`} />
        <Metric label="Cardio time" value={`${data.totals.cardioMinutes} min`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-xl font-semibold text-white">Workout programs</h3>
            <form action={createWorkoutProgram} className="mt-4 grid gap-2 md:grid-cols-4">
              <input name="name" required placeholder="Program name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="split" required placeholder="Split, e.g. upper/lower" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="description" placeholder="Description" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <button className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950">Create program</button>
            </form>
            <div className="mt-5 space-y-4">{data.programs.map((program) => <ProgramCard key={program.id} program={program} />)}{data.programs.length === 0 ? <p className="text-sm text-slate-500">No programs yet.</p> : null}</div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-4"><h3 className="text-xl font-semibold text-white">Completed workout history</h3><span className="text-sm text-slate-500">Latest 50</span></div>
            <form action={createWorkoutSession} className="mt-4 grid gap-2 md:grid-cols-5">
              <input name="date" type="date" defaultValue={today()} required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <select name="programId" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">No program</option>{data.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select>
              <input name="dayName" placeholder="Day name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="durationMin" type="number" min="0" placeholder="Minutes" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-950">Start session</button>
            </form>
            <div className="mt-5 space-y-3">{data.sessions.map((session) => <div key={session.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-white">{session.dayName || session.program?.name || "Workout session"}</p><p className="text-sm text-slate-500">{session.date.toISOString().slice(0, 10)} · {session.sets.length} sets · {session.cardioSessions.length} cardio entries</p></div><Link href={`/workouts?sessionId=${session.id}`} className="text-sm text-emerald-400">Log details</Link></div></div>)}{data.sessions.length === 0 ? <p className="text-sm text-slate-500">No completed sessions yet.</p> : null}</div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="text-lg font-semibold text-white">Personal records</h3><div className="mt-4 space-y-3">{data.personalRecords.map((record) => <div key={record.exerciseName} className="flex justify-between gap-3 text-sm"><span className="text-slate-300">{record.exerciseName}</span><span className="text-emerald-300">{record.weightKg} kg × {record.reps}</span></div>)}{data.personalRecords.length === 0 ? <p className="text-sm text-slate-500">Records appear after completed sets are logged.</p> : null}</div></div>
          {selectedSession ? <SessionDetails session={selectedSession} /> : <div className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-500">Select a session to log sets and cardio.</div>}
        </aside>
      </section>
    </div>
  );
}

function ProgramCard({ program }: { program: Awaited<ReturnType<typeof getWorkoutData>>["programs"][number] }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950 p-4"><div className="flex justify-between gap-3"><div><h4 className="font-semibold text-white">{program.name}</h4><p className="text-sm text-slate-500">{program.split}{program.description ? ` · ${program.description}` : ""}</p></div><span className="text-xs text-slate-500">{program.days.length} days</span></div><div className="mt-4 space-y-3">{program.days.map((day) => <div key={day.id} className="border-t border-slate-800 pt-3"><p className="font-medium text-slate-200">{day.name} <span className="text-xs text-slate-500">{day.muscleGroup}</span></p><div className="mt-2 space-y-1 text-sm text-slate-400">{day.exercises.map((exercise) => <p key={exercise.id}>{exercise.name} · {exercise.sets} × {exercise.reps} @ {exercise.weightKg} kg</p>)}</div><form action={addPlannedExercise} className="mt-3 grid gap-2 sm:grid-cols-4"><input type="hidden" name="dayId" value={day.id} /><input name="name" required placeholder="Exercise" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white sm:col-span-2" /><input name="sets" type="number" min="1" defaultValue="3" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" /><input name="reps" type="number" min="1" defaultValue="10" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" /><input name="weightKg" type="number" min="0" step="0.1" placeholder="kg" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" /><button className="rounded border border-emerald-500 px-2 py-1 text-xs text-emerald-300 sm:col-span-3">Add planned exercise</button></form></div>)}<form action={addWorkoutDay} className="mt-3 grid gap-2 sm:grid-cols-3"><input type="hidden" name="programId" value={program.id} /><input name="name" required placeholder="Day name" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" /><input name="muscleGroup" required placeholder="Muscle group" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white" /><button className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300">Add day</button></form></div></div>;
}

function SessionDetails({ session }: { session: Awaited<ReturnType<typeof getWorkoutData>>["sessions"][number] }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h3 className="text-lg font-semibold text-white">Log session details</h3><p className="mt-1 text-sm text-slate-500">{session.date.toISOString().slice(0, 10)}</p><form action={addWorkoutSet} className="mt-4 space-y-2"><input type="hidden" name="sessionId" value={session.id} /><input name="exerciseName" required placeholder="Exercise" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /><div className="grid grid-cols-3 gap-2"><input name="setNumber" type="number" min="1" defaultValue="1" placeholder="Set" className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /><input name="weightKg" type="number" min="0" step="0.1" placeholder="kg" className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /><input name="reps" type="number" min="0" placeholder="Reps" className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></div><button className="w-full rounded border border-emerald-500 px-3 py-2 text-sm text-emerald-300">Add set</button></form><div className="mt-4 space-y-2 text-sm text-slate-400">{session.sets.map((set) => <p key={set.id}>{set.exerciseName} · set {set.setNumber} · {set.weightKg} kg × {set.reps}</p>)}</div><form action={addCardioSession} className="mt-5 space-y-2 border-t border-slate-800 pt-4"><input type="hidden" name="sessionId" value={session.id} /><input name="activity" required placeholder="Cardio activity" className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /><div className="grid grid-cols-2 gap-2"><input name="durationMin" type="number" min="0" required placeholder="Minutes" className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /><input name="distanceKm" type="number" min="0" step="0.1" placeholder="Distance km" className="rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white" /></div><input name="date" type="hidden" value={session.date.toISOString().slice(0, 10)} /><button className="w-full rounded border border-sky-500 px-3 py-2 text-sm text-sky-300">Add cardio</button></form></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>;
}