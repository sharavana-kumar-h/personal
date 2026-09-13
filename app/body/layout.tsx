import Link from "next/link";

export default function BodyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-3">
        <NavLink href="/body" label="Current" />
        <NavLink href="/body/new" label="Add snapshot" />
        <NavLink href="/body/compare" label="Compare" />
        <NavLink href="/body/trends" label="Trends" />
      </nav>
      {children}
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch={false} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500 hover:text-white">
      {label}
    </Link>
  );
}
