import { requireUser } from "@/lib/auth";
import { getUserSnapshots } from "@/services/body-composition";

export default async function BodyTrendsPage() {
  const user = await requireUser();
  const snapshots = await getUserSnapshots(user.id);

  if (snapshots.length === 0) {
    return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">No body-composition history yet.</div>;
  }

  const ordered = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Trends</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Historical trend view</h1>
      </div>

      <div className="space-y-4">
        {ordered.map((snapshot) => (
          <div key={snapshot.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{new Date(snapshot.date).toLocaleDateString()}</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{snapshot.measurementSource ?? "manual"}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
              <div>Weight: {snapshot.weightKg} kg</div>
              <div>BMI: {snapshot.bmi ?? "n/a"}</div>
              <div>PBF: {snapshot.pbf ?? "n/a"}</div>
              <div>BMR: {snapshot.bmr ?? "n/a"}</div>
              <div>SMM: {snapshot.smm ?? "n/a"}</div>
              <div>SMI: {snapshot.smi ?? "n/a"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
