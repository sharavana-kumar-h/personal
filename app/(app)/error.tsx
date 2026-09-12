"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl rounded-2xl border border-rose-500/30 bg-slate-900 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-rose-300">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">This page could not load safely.</h1>
      <p className="mt-3 text-sm text-slate-400">No private record details are shown here. Try again, and contact the app owner if the problem continues.</p>
      <button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white">Try again</button>
    </main>
  );
}
