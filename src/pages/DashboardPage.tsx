import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  MapPinned,
  MessageSquare,
  PhoneCall,
  RadioTower,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { dashboardApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { Badge, EmptyState, Panel, SkeletonRows, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { compactNumber, dateLabel, titleCase } from "../utils/format";

const fallbackTrend = [
  { name: "Sun", reports: 14 },
  { name: "Mon", reports: 22 },
  { name: "Tue", reports: 18 },
  { name: "Wed", reports: 31 },
  { name: "Thu", reports: 28 },
  { name: "Fri", reports: 35 },
  { name: "Sat", reports: 24 },
];

const pieColors = ["#0f766e", "#2563eb", "#d97706", "#16a34a", "#dc2626", "#64748b"];

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentValue(value: unknown) {
  return `${numberValue(value).toFixed(0)}%`;
}

function listLabel(value?: string | null) {
  return titleCase(value).replace(/\bApi\b/g, "API").replace(/\bGps\b/g, "GPS");
}

function dashboardTotal(data: Record<string, unknown>, key: string, fallback: string) {
  const totals = data.totals as Record<string, unknown> | undefined;
  return totals?.[key] ?? data[fallback];
}

export function DashboardPage() {
  const summary = useAsync(() => dashboardApi.summary(), []);
  const trends = useAsync(() => dashboardApi.trends(), []);
  const data = (summary.data ?? {}) as Record<string, unknown>;
  const overview = (data.overview ?? {}) as Record<string, unknown>;
  const queues = (data.queues ?? {}) as Record<string, unknown>;
  const scope = (data.scope ?? {}) as Record<string, unknown>;
  const workspace = (data.workspace ?? {}) as Record<string, unknown>;
  const population = data.population as { roleBreakdown?: Array<{ role?: string; count?: number }> } | null | undefined;
  const workload = (data.workload ?? {}) as { topEngineers?: Array<{ fullName?: string; username?: string | null; activeAssignments?: number }> };
  const reportStatusBreakdown = (data.reportStatusBreakdown as Array<{ status?: string; count?: number }> | undefined) ?? [];
  const priorityBreakdown = (data.priorityBreakdown as Array<{ priority?: string; count?: number }> | undefined) ?? [];
  const recentReports = (data.recentReports as Array<{ id?: string; code?: string; title?: string; status?: string; priority?: string; createdAt?: string; localGovernment?: { name?: string }; ward?: { number?: number } }> | undefined) ?? [];
  const recentWorkOrders = (data.recentWorkOrders as Array<{ id?: string; code?: string; status?: string; priority?: string; scheduledFor?: string; report?: { title?: string; code?: string }; assignedEngineer?: { fullName?: string } }> | undefined) ?? [];
  const hotspots = (data.hotspots as Array<{ name?: string; count?: number }> | undefined) ?? [];
  const warnings = (data.warnings as string[] | undefined) ?? [];
  const quickActions = (data.quickActions as string[] | undefined) ?? [];
  const capabilities = (workspace.capabilities as string[] | undefined) ?? [];
  const process = (workspace.process as string[] | undefined) ?? [];
  const roleBreakdown = population?.roleBreakdown ?? [];
  const chartData = Array.isArray(trends.data) && trends.data.length ? trends.data : fallbackTrend;
  const statusChart = reportStatusBreakdown.length
    ? reportStatusBreakdown.map((item) => ({ name: listLabel(item.status), value: item.count ?? 0 }))
    : [
        { name: "Open", value: numberValue(dashboardTotal(data, "openReports", "openReports")) },
        { name: "Resolved", value: numberValue(dashboardTotal(data, "resolvedReports", "resolvedReports")) },
      ];
  const priorityChart = priorityBreakdown.map((item) => ({ name: listLabel(item.priority), count: item.count ?? 0 }));
  const queueCards = [
    { label: "Triage", value: queues.triageReports, icon: AlertTriangle },
    { label: "Verification", value: queues.verificationQueue, icon: ShieldCheck },
    { label: "Assignment", value: queues.assignmentQueue, icon: UserRoundCheck },
    { label: "Field work", value: queues.activeFieldWork, icon: Wrench },
  ];

  return (
    <>
      <PageHeader
        title={(scope.label as string | undefined) ?? "Operations Dashboard"}
        eyebrow={(scope.description as string | undefined) ?? "Live response overview"}
        action={
          <div className="grid grid-cols-2 gap-2 text-right sm:flex">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-500">Scope</p>
              <p className="text-sm font-black text-ink-900">{listLabel(scope.visibility as string | undefined)}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink-500">Profile</p>
              <p className="text-sm font-black text-ink-900">{percentValue(overview.profileCompletionScore)}</p>
            </div>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" value={compactNumber(dashboardTotal(data, "reports", "totalReports"))} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Open reports" value={compactNumber(dashboardTotal(data, "openReports", "openReports"))} icon={<AlertTriangle className="h-5 w-5" />} accent="amber" />
        <StatCard label="Resolved" value={compactNumber(dashboardTotal(data, "resolvedReports", "resolvedReports"))} icon={<CheckCircle2 className="h-5 w-5" />} accent="green" />
        <StatCard label="Overdue work" value={compactNumber(dashboardTotal(data, "overdueWorkOrders", "overdueWorkOrders"))} icon={<Clock className="h-5 w-5" />} accent="red" />
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
                <Area type="monotone" dataKey="count" stroke="#2563eb" fill="url(#reports)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Command health</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Today’s operating picture</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Resolution" value={percentValue(overview.resolutionRate)} icon={<Gauge className="h-4 w-4" />} />
            <MiniMetric label="WO completion" value={percentValue(overview.workOrderCompletionRate)} icon={<CheckCircle2 className="h-4 w-4" />} />
            <MiniMetric label="Unread" value={compactNumber(overview.unreadNotifications)} icon={<Bell className="h-4 w-4" />} />
            <MiniMetric label="Live calls" value={compactNumber(overview.activeCalls)} icon={<PhoneCall className="h-4 w-4" />} />
          </div>
          <div className="mt-5 rounded-md border border-civic-100 bg-civic-50 p-4">
            <div className="flex items-start gap-3">
              <RadioTower className="mt-0.5 h-5 w-5 shrink-0 text-civic-700" />
              <div>
                <p className="text-sm font-black text-civic-900">API connected</p>
                <p className="mt-1 break-all text-sm font-medium text-civic-700">{import.meta.env.VITE_API_BASE_URL}</p>
              </div>
            </div>
          </div>
          {summary.error ? <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-700">{summary.error.message}</p> : null}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr_0.9fr]">
        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Queues</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Action load</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {queueCards.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                <span className="flex items-center gap-3 text-sm font-bold text-ink-700">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-civic-700 shadow-sm">
                    <item.icon className="h-4 w-4" />
                  </span>
                  {item.label}
                </span>
                <span className="text-xl font-black text-ink-900">{compactNumber(item.value)}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Case mix</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Status and priority</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusChart} dataKey="value" nameKey="name" innerRadius={55} outerRadius={86} paddingAngle={2}>
                    {statusChart.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64">
              {priorityChart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No priority data" body="Priority breakdown will appear after reports are created." />
              )}
            </div>
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Workspace</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">{listLabel(workspace.mission as string | undefined)}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickActions.slice(0, 6).map((action) => (
              <span key={action} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-black text-ink-700">
                {listLabel(action)}
              </span>
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {process.slice(0, 4).map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-civic-700 text-xs font-black text-white">{index + 1}</span>
                <p className="pt-1 text-sm font-medium leading-6 text-ink-700">{listLabel(step)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Recent reports</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900">Latest citizen intake</h2>
            </div>
            <MessageSquare className="h-5 w-5 text-civic-700" />
          </div>
          {summary.loading ? <SkeletonRows /> : recentReports.length ? (
            <div className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <div key={report.id} className="grid gap-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="text-sm font-black text-ink-900">{report.title ?? report.code ?? "Untitled report"}</p>
                    <p className="mt-1 text-xs font-semibold text-ink-500">
                      {[report.code, report.localGovernment?.name, report.ward?.number ? `Ward ${report.ward.number}` : null, dateLabel(report.createdAt)].filter(Boolean).join(" | ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Badge value={report.status} />
                    <Badge value={report.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No reports in scope" body="New report intake will appear here." />
          )}
        </Panel>

        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Field execution</p>
              <h2 className="mt-1 text-xl font-bold text-ink-900">Work orders and response hotspots</h2>
            </div>
            <MapPinned className="h-5 w-5 text-civic-700" />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3">
              {recentWorkOrders.length ? recentWorkOrders.slice(0, 4).map((order) => (
                <div key={order.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-ink-900">{order.report?.title ?? order.code ?? "Work order"}</p>
                    <Badge value={order.status} />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-ink-500">
                    {[order.code, order.assignedEngineer?.fullName, order.scheduledFor ? `Due ${dateLabel(order.scheduledFor)}` : null].filter(Boolean).join(" | ")}
                  </p>
                </div>
              )) : <EmptyState title="No work orders" body="Assignments will appear once reports move into field work." />}
            </div>
            <div className="space-y-3">
              {hotspots.length ? hotspots.map((hotspot, index) => (
                <div key={hotspot.name ?? index} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
                  <span className="text-sm font-bold text-ink-700">{hotspot.name}</span>
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-sm font-black text-amber-700">{compactNumber(hotspot.count)}</span>
                </div>
              )) : workload.topEngineers?.length ? workload.topEngineers.map((engineer) => (
                <div key={engineer.username ?? engineer.fullName} className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3">
                  <span className="text-sm font-bold text-ink-700">{engineer.fullName}</span>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-black text-blue-700">{compactNumber(engineer.activeAssignments)}</span>
                </div>
              )) : <EmptyState title="No hotspots yet" body="Local government hotspots will appear after report volume builds." />}
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Capabilities</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Enabled for this role</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {capabilities.slice(0, 9).map((capability) => (
              <div key={capability} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-ink-700">
                {listLabel(capability)}
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Population</p>
          <h2 className="mt-1 text-xl font-bold text-ink-900">Users in scope</h2>
          {roleBreakdown.length ? (
            <div className="mt-4 space-y-3">
              {roleBreakdown.slice(0, 6).map((item) => (
                <div key={item.role} className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-ink-700">
                    <Users className="h-4 w-4 text-civic-700" />
                    {listLabel(item.role)}
                  </span>
                  <span className="text-lg font-black text-ink-900">{compactNumber(item.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Population hidden" body="This role only sees personal or assignment-scoped data." />
          )}
        </Panel>
      </div>

      {warnings.length ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-800">Attention</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {warnings.map((warning) => (
              <p key={warning} className="text-sm font-semibold text-amber-800">{warning}</p>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function MiniMetric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.12em] text-ink-500">{label}</span>
        <span className="text-civic-700">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-ink-900">{value}</p>
    </div>
  );
}
