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
    <div className="glass-surface surface-grid mb-6 overflow-hidden rounded-lg border border-white/70 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.14em] text-civic-700">{eyebrow}</p> : null}
          <h1 className="mt-1 text-2xl font-black leading-tight text-ink-900 sm:text-3xl">{title}</h1>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 w-20 rounded-full bg-civic-700" />
            <div className="h-1 w-8 rounded-full bg-blue-700" />
            <div className="h-1 w-4 rounded-full bg-amber-500" />
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
