import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getCurrentSnapshot, getUserSnapshots } from "@/services/body-composition";
import { buildSegmentMap } from "@/services/body-composition";

export default async function BodyPage() {
  const user = await requireUser();
  const current = await getCurrentSnapshot(user.id);
  const snapshots = await getUserSnapshots(user.id);

  if (!current) {
    redirect("/body/new");
  }

  const leanMap = buildSegmentMap(current.leanSegments.map((segment) => ({ segment: segment.segment, value: segment.value })));
  const fatMap = buildSegmentMap(current.fatSegments.map((segment) => ({ segment: segment.segment, value: segment.value })));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Body composition</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Current snapshot</h1>
        </div>
        <Link
          href="/body/new"
          className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400"
        >
          Add snapshot
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Weight" value={`${current.weightKg ?? 0} kg`} kind="user-entered" />
        <MetricCard label="BMI" value={String(current.bmi ?? 0)} kind="calculated" />
        <MetricCard label="PBF" value={`${current.pbf ?? 0}%`} kind="measured" />
        <MetricCard label="BMR" value={`${current.bmr ?? 0} kcal`} kind="calculated" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Core metrics</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>SMM</span> <span>{current.smm ?? 0}</span></li>
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>BFM</span> <span>{current.bfm ?? 0}</span></li>
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>Waist-Hip Ratio</span> <span>{current.waistHipRatio ?? 0}</span></li>
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>Visceral Fat</span> <span>{current.visceralFatLevel ?? 0}</span></li>
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>Fat Free Mass</span> <span>{current.fatFreeMass ?? 0}</span></li>
            <li className="flex justify-between border-b border-slate-800 pb-2"><span>Obesity Degree</span> <span>{current.obesityDegree ?? 0}</span></li>
            <li className="flex justify-between"><span>SMI</span> <span>{current.smi ?? 0}</span></li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Segment lean analysis</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            {Object.entries(leanMap).map(([segment, value]) => (
              <li key={segment} className="flex justify-between border-b border-slate-800 pb-2">
                <span>{segment}</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Segment fat analysis</h2>
          <ul className="space-y-3 text-sm text-slate-300">
            {Object.entries(fatMap).map(([segment, value]) => (
              <li key={segment} className="flex justify-between border-b border-slate-800 pb-2">
                <span>{segment}</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Recent history</h2>
          <div className="space-y-3">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                  <span>{new Date(snapshot.date).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <Link href={`/body/${snapshot.id}`} className="text-emerald-400 hover:text-emerald-300">View</Link>
                    <Link href={`/body/${snapshot.id}/edit`} className="text-sky-400 hover:text-sky-300">Edit</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, kind }: { label: string; value: string; kind: "user-entered" | "calculated" | "measured" }) {
  const tone =
    kind === "user-entered"
      ? "text-emerald-200"
      : kind === "calculated"
        ? "text-sky-200"
        : "text-amber-200";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-4 text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{kind}</p>
    </div>
  );
}
