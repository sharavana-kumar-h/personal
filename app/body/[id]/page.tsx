import Link from "next/link";

import { getSnapshotById } from "@/services/body-composition";
import { requireUser } from "@/lib/auth";

export default async function BodySnapshotDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const snapshot = await getSnapshotById(user.id, params.id);

  if (!snapshot) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">Snapshot not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Body snapshot</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{new Date(snapshot.date).toLocaleDateString()}</h1>
        </div>
        <Link href={`/body/${snapshot.id}/edit`} className="rounded-xl border border-sky-500 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/20">
          Edit snapshot
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Weight" value={`${snapshot.weightKg} kg`} kind="user-entered" />
        <Metric label="BMI" value={String(snapshot.bmi ?? 0)} kind="calculated" />
        <Metric label="PBF" value={`${snapshot.pbf ?? 0}%`} kind="measured" />
        <Metric label="BMR" value={`${snapshot.bmr ?? 0} kcal`} kind="calculated" />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Detailed values</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex justify-between"><span>SMM</span> <span>{snapshot.smm ?? 0}</span></li>
            <li className="flex justify-between"><span>BFM</span> <span>{snapshot.bfm ?? 0}</span></li>
            <li className="flex justify-between"><span>Waist-Hip Ratio</span> <span>{snapshot.waistHipRatio ?? 0}</span></li>
            <li className="flex justify-between"><span>Visceral Fat Level</span> <span>{snapshot.visceralFatLevel ?? 0}</span></li>
            <li className="flex justify-between"><span>Fat Free Mass</span> <span>{snapshot.fatFreeMass ?? 0}</span></li>
          </ul>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex justify-between"><span>Obesity Degree</span> <span>{snapshot.obesityDegree ?? 0}</span></li>
            <li className="flex justify-between"><span>SMI</span> <span>{snapshot.smi ?? 0}</span></li>
            <li className="flex justify-between"><span>Height</span> <span>{snapshot.heightCm ?? 0} cm</span></li>
            <li className="flex justify-between"><span>Source</span> <span>{snapshot.measurementSource ?? "manual"}</span></li>
            <li className="flex justify-between"><span>Notes</span> <span>{snapshot.notes ?? "—"}</span></li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Lean segments</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {snapshot.leanSegments.map((segment) => (
              <li key={segment.id} className="flex justify-between"><span>{segment.segment}</span> <span>{segment.value}</span></li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-xl font-semibold text-white">Fat segments</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            {snapshot.fatSegments.map((segment) => (
              <li key={segment.id} className="flex justify-between"><span>{segment.segment}</span> <span>{segment.value}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, kind }: { label: string; value: string; kind: "user-entered" | "calculated" | "measured" }) {
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
