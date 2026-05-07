import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { dashboardApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Panel, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { compactNumber } from "../utils/format";

const fallbackTrend = [
  { name: "Sun", reports: 14 },
  { name: "Mon", reports: 22 },
  { name: "Tue", reports: 18 },
  { name: "Wed", reports: 31 },
  { name: "Thu", reports: 28 },
  { name: "Fri", reports: 35 },
  { name: "Sat", reports: 24 },
];

export function DashboardPage() {
  const summary = useAsync(() => dashboardApi.summary(), []);
  const trends = useAsync(() => dashboardApi.trends(), []);
  const data = summary.data ?? {};
  const chartData = Array.isArray(trends.data) && trends.data.length ? trends.data : fallbackTrend;

  return (
    <>
      <PageHeader title="Operations Dashboard" eyebrow="Live response overview" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" value={compactNumber(data.totalReports)} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Open reports" value={compactNumber(data.openReports)} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" />
        <StatCard label="Resolved" value={compactNumber(data.resolvedReports)} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Overdue work" value={compactNumber(data.overdueWorkOrders)} icon={<Clock className="h-5 w-5" />} accent="red" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Panel>
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Trend</p>
            <h2 className="text-xl font-bold text-ink-900">Report intake</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData as never[]}>
                <defs>
                  <linearGradient id="reports" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="reports" stroke="#0f766e" fill="url(#reports)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Backend status</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Access notes</h2>
          <div className="mt-5 space-y-4 text-sm text-ink-700">
            <p>Authenticated dashboard routes require the `dashboard.read` permission.</p>
            <p>Views automatically show empty states when your role cannot access a module or no records match.</p>
            <p className="rounded-md bg-civic-50 p-3 font-medium text-civic-700">
              API base: {import.meta.env.VITE_API_BASE_URL}
            </p>
            {summary.error ? <p className="rounded-md bg-amber-50 p-3 text-amber-700">{summary.error.message}</p> : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
