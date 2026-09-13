import { redirect } from "next/navigation";

import { logoutUser } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";
import { getPerformanceContext } from "@/lib/perf";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getPerformanceContext();
  const user = await getSessionUser({ requestId: context.requestId, operation: "app-layout" });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-400">Fitness app</p>
            <h1 className="text-lg font-semibold text-white">Personal dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-200">
              {user.email}
            </span>
            <form action={logoutUser}>
              <button
                type="submit"
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-white"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
