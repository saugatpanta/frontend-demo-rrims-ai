import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { FileSearch, Loader2 } from "lucide-react";

import { statusTone, titleCase } from "../utils/format";

export function Button({
  className,
  variant = "primary",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-civic-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-civic-700 text-white shadow-sm hover:bg-civic-600",
        variant === "secondary" && "border border-slate-300 bg-white text-ink-700 shadow-sm hover:border-civic-200 hover:bg-civic-50",
        variant === "danger" && "bg-red-700 text-white shadow-sm hover:bg-red-600",
        variant === "ghost" && "text-ink-700 hover:bg-slate-100",
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_40px_rgba(15,23,42,0.06)]", className)}>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "teal",
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: "teal" | "blue" | "amber" | "red" | "green";
}) {
  const tones = {
    teal: "bg-civic-50 text-civic-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <Panel className="relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-civic-700 via-blue-700 to-amber-500" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-ink-900">{value}</p>
        </div>
        <div className={clsx("rounded-md p-2", tones[accent])}>{icon}</div>
      </div>
    </Panel>
  );
}

export function Badge({ value }: { value?: string }) {
  const tone = statusTone(value);
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
        tone === "green" && "border-green-200 bg-green-50 text-green-800",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-800",
        tone === "red" && "border-red-200 bg-red-50 text-red-800",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      {titleCase(value)}
    </span>
  );
}

export function Field({
  label,
  children,
}: PropsWithChildren<{ label: string }>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink-900 outline-none transition placeholder:text-slate-400 focus:border-civic-700 focus:ring-2 focus:ring-civic-100";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f8fafc,#ffffff)] p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-civic-50 text-civic-700">
        <FileSearch className="h-5 w-5" />
      </div>
      <p className="font-bold text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{body}</p>
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-md bg-slate-100" />
      ))}
    </div>
  );
}
