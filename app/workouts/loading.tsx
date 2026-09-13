export default function WorkoutsLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading workouts</span>
      <div className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />)}
      </div>
      <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
    </div>
  );
}
