export default function BodyLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading body composition</span>
      <div className="h-16 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />)}
      </div>
    </div>
  );
}
