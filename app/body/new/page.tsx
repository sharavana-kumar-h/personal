import BodySnapshotForm from "@/app/body/body-snapshot-form";

export default function NewBodySnapshotPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400">Body composition</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Add snapshot</h1>
      </div>

      <BodySnapshotForm />
    </div>
  );
}
