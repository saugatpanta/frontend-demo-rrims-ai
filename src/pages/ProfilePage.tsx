import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { PageHeader } from "../components/PageHeader";
import { Panel } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Profile" eyebrow="Signed-in operator" />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <div className="grid h-20 w-20 place-items-center rounded-lg bg-civic-50 text-2xl font-black text-civic-700">
            {(user?.fullName ?? user?.username ?? "R").slice(0, 1)}
          </div>
          <h2 className="mt-4 text-2xl font-bold text-ink-900">{user?.fullName}</h2>
          <p className="text-sm font-semibold text-civic-700">{user?.role}</p>
          <div className="mt-5 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-civic-700" style={{ width: `${user?.profileCompleteness?.percentage ?? 0}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-500">Profile completeness: {user?.profileCompleteness?.percentage ?? 0}%</p>
        </Panel>
        <Panel>
          <h2 className="text-xl font-bold text-ink-900">Account details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phone ?? "Not set"} />
            <Info icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email ?? "Not set"} />
            <Info icon={<ShieldCheck className="h-4 w-4" />} label="Permissions" value={`${user?.permissions?.length ?? 0} granted`} />
            <Info icon={<MapPin className="h-4 w-4" />} label="Geography" value={String(user?.geography?.district ?? user?.geography?.province ?? "Not set")} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-civic-700">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-semibold text-ink-900">{value}</p>
    </div>
  );
}
