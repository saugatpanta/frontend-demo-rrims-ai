import type { ReactNode } from "react";

export function PageHeader({
  title,
  eyebrow,
  action,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.14em] text-civic-700">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black text-ink-900 sm:text-3xl">{title}</h1>
        <div className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-civic-700 via-blue-700 to-amber-500" />
      </div>
      {action}
      </div>
    </div>
  );
}
