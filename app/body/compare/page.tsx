import { requireUser } from "@/lib/auth";
import { getUserSnapshots } from "@/services/body-composition";
import { compareSnapshots } from "@/services/body-composition";

export default async function CompareBodySnapshotsPage() {
  const user = await requireUser();
  const snapshots = await getUserSnapshots(user.id);

  if (snapshots.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        Add at least two body-composition snapshots to compare them.
      </div>
    );
  }

  const [older, newer] = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const comparison = compareSnapshots(older, newer);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Compare</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Body composition comparison</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ComparisonCard title={new Date(older.date).toLocaleDateString()} snapshot={older} />
        <ComparisonCard title={new Date(newer.date).toLocaleDateString()} snapshot={newer} />
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-xl font-semibold text-white">Delta</h2>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex justify-between"><span>Weight</span> <span>{comparison.weightDelta} kg</span></li>
          <li className="flex justify-between"><span>BMI</span> <span>{comparison.bmiDelta ?? "n/a"}</span></li>
          <li className="flex justify-between"><span>PBF</span> <span>{comparison.pbfDelta ?? "n/a"}</span></li>
          <li className="flex justify-between"><span>BMR</span> <span>{comparison.bmrDelta ?? "n/a"}</span></li>
        </ul>
      </div>
    </div>
  );
}

function ComparisonCard({ title, snapshot }: { title: string; snapshot: { weightKg: number; bmi?: number | null; pbf?: number | null; bmr?: number | null; date: Date } }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm text-slate-300">
        <li className="flex justify-between"><span>Weight</span> <span>{snapshot.weightKg} kg</span></li>
        <li className="flex justify-between"><span>BMI</span> <span>{snapshot.bmi ?? "n/a"}</span></li>
        <li className="flex justify-between"><span>PBF</span> <span>{snapshot.pbf ?? "n/a"}</span></li>
        <li className="flex justify-between"><span>BMR</span> <span>{snapshot.bmr ?? "n/a"}</span></li>
      </ul>
    </div>
  );
}
