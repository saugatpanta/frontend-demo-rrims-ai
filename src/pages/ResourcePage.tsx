import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Database,
  Filter,
  Gauge,
  LayoutGrid,
  ListChecks,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";

import { GenericRecord, moduleApi, unwrapList } from "../api/services";
import { DataTable } from "../components/DataTable";
import { MetricStrip } from "../components/MetricStrip";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, EmptyState, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { dateLabel, titleCase } from "../utils/format";
import { useAuth } from "../context/AuthContext";

type ResourcePageProps = {
  title: string;
  eyebrow: string;
  path: string;
  searchPlaceholder?: string;
  description: string;
  columns?: Array<{
    header: string;
    key?: string;
    cell?: (row: GenericRecord) => ReactNode;
  }>;
  actions?: Array<{
    label: string;
    run: (row: GenericRecord) => Promise<unknown>;
  }>;
  deletePath?: (row: GenericRecord) => string | undefined;
  deleteReason?: string;
};

type ResourceColumn = NonNullable<ResourcePageProps["columns"]>[number];

function valueAt(row: GenericRecord, key?: string) {
  if (!key) return undefined;
  return key.split(".").reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[part];
  }, row);
}

function readable(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return dateLabel(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function recordLabel(row: GenericRecord) {
  return readable(row.title ?? row.name ?? row.subject ?? row.code ?? row.eventType ?? row.action ?? row.fileName ?? row.id);
}

function recordDetail(row: GenericRecord) {
  return readable(row.message ?? row.description ?? row.summary ?? row.body ?? row.type ?? row.resource ?? row.storageKey ?? row.id);
}

function recordStatus(row: GenericRecord) {
  return String(row.status ?? row.state ?? row.scanStatus ?? row.outcome ?? row.type ?? "ACTIVE");
}

function recordTime(row: GenericRecord) {
  return readable(row.updatedAt ?? row.createdAt ?? row.startedAt ?? row.timestamp ?? row.dueAt);
}

export function ResourcePage({
  title,
  eyebrow,
  path,
  searchPlaceholder = "Search records",
  description,
  columns,
  actions = [],
  deletePath,
  deleteReason = "Deleted by super admin from RRIMS console",
}: ResourcePageProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [actionMessage, setActionMessage] = useState("");
  const records = useAsync(() => moduleApi.list<GenericRecord>(path, { limit: 25, search }), [refresh]);
  const rows = records.data ? unwrapList<GenericRecord>(records.data) : [];
  const canDelete = String(user?.role ?? "") === "SUPER_ADMIN" && Boolean(deletePath);
  const activeRows = rows.filter((row) => !["CLOSED", "DELETED", "REVOKED", "RESOLVED", "FAILED"].includes(recordStatus(row).toUpperCase()));
  const attentionRows = rows.filter((row) => ["FAILED", "OVERDUE", "PENDING", "UNREAD", "QUARANTINED", "BREACHED", "ESCALATED"].includes(recordStatus(row).toUpperCase()));
  const statusSummary = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      const key = recordStatus(row).toUpperCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).slice(0, 4);
  const featuredRows = rows.slice(0, 3);

  const resolvedColumns = useMemo<ResourceColumn[]>(
    () =>
      (columns ?? [
        { header: "Record", cell: (row: GenericRecord) => <div><p className="font-semibold text-ink-900">{readable(row.title ?? row.name ?? row.subject ?? row.code ?? row.id)}</p><p className="max-w-md truncate text-xs text-ink-500">{readable(row.message ?? row.description ?? row.id)}</p></div> },
        { header: "Status", cell: (row: GenericRecord) => <Badge value={String(row.status ?? row.state ?? row.type ?? "ACTIVE")} /> },
        { header: "Created", cell: (row: GenericRecord) => readable(row.createdAt ?? row.timestamp) },
      ]) satisfies ResourceColumn[],
    [columns],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    setRefresh((value) => value + 1);
  }

  return (
    <>
      <PageHeader
        title={title}
        eyebrow={eyebrow}
        action={<Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}><RefreshCw className="h-4 w-4" />Refresh</Button>}
      />

      <Panel className="relative my-5 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-civic-700 via-blue-700 to-amber-500" />
        <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-civic-100 bg-civic-50 px-3 py-1 text-xs font-black uppercase tracking-[0.13em] text-civic-800">
                  <Sparkles className="h-3.5 w-3.5" />
                  Polished module console
                </div>
                <h2 className="text-2xl font-black tracking-tight text-ink-900">{title} command workspace</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
              </div>
              <div className="grid min-w-[220px] grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-500">Records</p>
                  <p className="mt-1 text-2xl font-black text-ink-900">{rows.length}</p>
                </div>
                <div className="rounded-lg border border-civic-100 bg-civic-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-civic-700">Active</p>
                  <p className="mt-1 text-2xl font-black text-civic-900">{activeRows.length}</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
              </div>
              <Button variant="secondary"><Filter className="h-4 w-4" />Search</Button>
              <Button variant="ghost" type="button" onClick={() => {
                setSearch("");
                setRefresh((value) => value + 1);
              }}>
                Clear
              </Button>
            </form>

            {records.error ? <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{records.error.message}</p> : null}
            {actionMessage ? <p className="mt-4 rounded-md bg-civic-50 px-3 py-2 text-sm font-semibold text-civic-800">{actionMessage}</p> : null}
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-5 text-white xl:border-l xl:border-t-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-200">Operational health</p>
                <h3 className="mt-1 text-lg font-black">Live module picture</h3>
              </div>
              <Gauge className="h-6 w-6 text-amber-300" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/8 p-3">
                <Activity className="mb-3 h-4 w-4 text-civic-200" />
                <p className="text-xl font-black">{activeRows.length}</p>
                <p className="text-xs font-semibold text-slate-300">active queue</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-3">
                <ShieldCheck className="mb-3 h-4 w-4 text-green-200" />
                <p className="text-xl font-black">{Math.max(rows.length - attentionRows.length, 0)}</p>
                <p className="text-xs font-semibold text-slate-300">stable records</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-3">
                <CalendarClock className="mb-3 h-4 w-4 text-amber-200" />
                <p className="text-xl font-black">{attentionRows.length}</p>
                <p className="text-xs font-semibold text-slate-300">needs review</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {(statusSummary.length ? statusSummary : ([["READY", 0]] as Array<[string, number]>)).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between gap-3 rounded-md bg-white/[0.06] px-3 py-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-300">{titleCase(status)}</span>
                  <span className="text-sm font-black text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <MetricStrip total={rows.length} active={activeRows.length} />

      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        {records.loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Panel key={index} className="h-40 animate-pulse bg-gradient-to-r from-slate-100 via-white to-slate-100" />
          ))
        ) : featuredRows.length ? (
          featuredRows.map((row, index) => (
            <Panel key={String(row.id ?? index)} className="group overflow-hidden p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-sm">
                  {index === 0 ? <LayoutGrid className="h-5 w-5" /> : index === 1 ? <ListChecks className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                </div>
                <Badge value={recordStatus(row)} />
              </div>
              <p className="line-clamp-1 text-base font-black text-ink-900">{recordLabel(row)}</p>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-ink-500">{recordDetail(row)}</p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-ink-500">
                <span>{recordTime(row)}</span>
                <ArrowUpRight className="h-4 w-4 text-civic-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </Panel>
          ))
        ) : (
          <div className="xl:col-span-3">
            <EmptyState title={`No ${title.toLowerCase()} to spotlight`} body="Search, refresh, or create a record where this module supports creation." />
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-civic-700" />
        <p className="text-sm font-black text-ink-900">Detailed records</p>
      </div>
      <DataTable
        rows={rows}
        loading={records.loading}
        emptyTitle={records.error ? `${title} unavailable` : `No ${title.toLowerCase()} found`}
        columns={[
          ...resolvedColumns.map((column) => ({
            header: column.header,
            cell: (row: GenericRecord) => column.cell ? column.cell(row) : readable(valueAt(row, column.key)),
          })),
          ...(actions.length
          || canDelete
            ? [{
                header: "Actions",
                cell: (row: GenericRecord) => (
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button key={action.label} variant="secondary" onClick={async () => {
                        setActionMessage("");
                        try {
                          await action.run(row);
                          setActionMessage(`${titleCase(action.label)} completed.`);
                          setRefresh((value) => value + 1);
                        } catch (error) {
                          setActionMessage(error instanceof Error ? error.message : "Action failed.");
                        }
                      }}>
                        {titleCase(action.label)}
                      </Button>
                    ))}
                    {canDelete ? (
                      <Button variant="danger" onClick={async () => {
                        const targetPath = deletePath?.(row);
                        if (!targetPath) return;
                        const label = readable(row.name ?? row.title ?? row.subject ?? row.id);
                        if (!window.confirm(`Delete ${label}? This action is limited to super admins and audit history will remain.`)) return;
                        setActionMessage("");
                        try {
                          await moduleApi.remove(targetPath, { reason: deleteReason });
                          setActionMessage("Delete completed.");
                          setRefresh((value) => value + 1);
                        } catch (error) {
                          setActionMessage(error instanceof Error ? error.message : "Delete failed.");
                        }
                      }}>
                        <Trash2 className="h-4 w-4" />Delete
                      </Button>
                    ) : null}
                  </div>
                ),
              }]
            : []),
        ]}
      />
    </>
  );
}
