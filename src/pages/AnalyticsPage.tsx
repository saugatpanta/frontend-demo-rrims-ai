import { BarChart3, PieChart, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { dashboardApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Panel, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { compactNumber } from "../utils/format";

const fallback = [
  { name: "Open", value: 42 },
  { name: "Review", value: 28 },
  { name: "Progress", value: 35 },
  { name: "Resolved", value: 65 },
];

export function AnalyticsPage() {
  const stats = useAsync(() => dashboardApi.stats(), []);
  const data = stats.data ?? {};

  return (
    <>
      <PageHeader title="Analytics" eyebrow="Performance intelligence" />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="SLA pressure" value={compactNumber(data.slaPressure ?? data.overdueWorkOrders)} icon={<TrendingUp className="h-5 w-5" />} accent="amber" />
        <StatCard label="Active reports" value={compactNumber(data.openReports)} icon={<BarChart3 className="h-5 w-5" />} accent="blue" />
        <StatCard label="Resolution count" value={compactNumber(data.resolvedReports)} icon={<PieChart className="h-5 w-5" />} accent="green" />
      </div>
      <Panel className="mt-6">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Report distribution</p>
          <h2 className="text-xl font-bold text-ink-900">Current status mix</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={fallback}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}
