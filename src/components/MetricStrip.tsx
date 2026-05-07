import { Activity, Database, LockKeyhole, Radio } from "lucide-react";

import { StatCard } from "./ui";

export function MetricStrip({
  total,
  activeLabel = "Active",
  active = 0,
  secure = true,
}: {
  total: number;
  activeLabel?: string;
  active?: number;
  secure?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="Records loaded" value={total} icon={<Database className="h-5 w-5" />} />
      <StatCard label={activeLabel} value={active} icon={<Activity className="h-5 w-5" />} accent="blue" />
      <StatCard label="Live backend" value="Online" icon={<Radio className="h-5 w-5" />} accent="green" />
      <StatCard label="Access" value={secure ? "Protected" : "Public"} icon={<LockKeyhole className="h-5 w-5" />} accent="amber" />
    </div>
  );
}
