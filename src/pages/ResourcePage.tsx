import { RefreshCw, Search, Trash2 } from "lucide-react";
import { FormEvent, ReactNode, useMemo, useState } from "react";

import { GenericRecord, moduleApi, unwrapList } from "../api/services";
import { DataTable } from "../components/DataTable";
import { MetricStrip } from "../components/MetricStrip";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, inputClass, Panel } from "../components/ui";
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

      <MetricStrip
        total={rows.length}
        active={rows.filter((row) => !["CLOSED", "DELETED", "REVOKED"].includes(String(row.status ?? row.state ?? "").toUpperCase())).length}
      />

      <Panel className="my-5">
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{title} workspace</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>
          </div>
          {records.error ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">{records.error.message}</p> : null}
          {actionMessage ? <p className="rounded-md bg-civic-50 px-3 py-2 text-sm font-semibold text-civic-800">{actionMessage}</p> : null}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-10`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} />
          </div>
          <Button variant="secondary">Search</Button>
        </form>
      </Panel>

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
