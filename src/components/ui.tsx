import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import { useState } from "react";
import { FileSearch, Loader2 } from "lucide-react";

import { apiConfig } from "../api/client";
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-black transition duration-200 focus:outline-none focus:ring-2 focus:ring-civic-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        "active:translate-y-px",
        variant === "primary" && "bg-civic-700 text-white shadow-[0_10px_24px_rgba(15,118,110,0.22)] hover:bg-civic-600 hover:shadow-[0_14px_30px_rgba(15,118,110,0.28)]",
        variant === "secondary" && "border border-slate-300/80 bg-white/90 text-ink-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-civic-200 hover:bg-civic-50 hover:text-civic-800",
        variant === "danger" && "bg-red-700 text-white shadow-[0_10px_24px_rgba(185,28,28,0.22)] hover:bg-red-600",
        variant === "ghost" && "text-ink-700 hover:bg-slate-100 hover:text-ink-900",
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
    <section
      className={clsx(
        "rounded-lg border border-white/70 bg-white/[0.92] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_44px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.025]",
        "backdrop-blur transition duration-200",
        className,
      )}
    >
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
    <Panel className="group relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-civic-700 via-blue-700 to-amber-500" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50/90 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-ink-900">{value}</p>
        </div>
        <div className={clsx("relative rounded-md p-2 shadow-sm ring-1 ring-white/70", tones[accent])}>{icon}</div>
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
  "h-11 w-full rounded-md border border-slate-300/90 bg-white/95 px-3 text-sm font-medium text-ink-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition placeholder:text-slate-400 hover:border-slate-400 focus:border-civic-700 focus:ring-2 focus:ring-civic-100";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-[linear-gradient(135deg,#f8fafc,#ffffff_55%,#eef6ff)] p-10 text-center shadow-inner">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-civic-50 text-civic-700 shadow-sm ring-1 ring-civic-100">
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
        <div key={index} className="h-12 animate-pulse rounded-md bg-gradient-to-r from-slate-100 via-white to-slate-100" />
      ))}
    </div>
  );
}

export function Avatar({
  userId,
  name,
  size = "md",
  className,
}: {
  userId?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-24 w-24 text-4xl",
  };
  const initial = (name ?? "R").trim().slice(0, 1).toUpperCase() || "R";
  const src = userId ? `${apiConfig.baseUrl}/profile/avatar/${userId}` : "";

  return (
    <span
      className={clsx(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-civic-50 font-black text-civic-700 shadow-sm ring-1 ring-civic-100",
        sizes[size],
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name ? `${name} profile picture` : "Profile picture"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : null}
      <span className={clsx(src && !failed && "opacity-0")}>{initial}</span>
    </span>
  );
}
