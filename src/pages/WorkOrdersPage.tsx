import { CheckCircle2, Pause, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { moduleApi, unwrapList, workOrdersApi } from "../api/services";
import type { WorkOrder } from "../api/types";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { dateLabel } from "../utils/format";

export function WorkOrdersPage() {
  const [refresh, setRefresh] = useState(0);
  const workOrders = useAsync(() => workOrdersApi.list({ limit: 20 }), [refresh]);
  const rows = workOrders.data ? unwrapList<WorkOrder>(workOrders.data) : [];

  const [progress, setProgress] = useState<Record<string, number>>({});

  async function action(kind: "start" | "complete" | "pause", id: string) {
    if (kind === "start") await workOrdersApi.start(id, "Started from RRIMS frontend");
    if (kind === "complete") await workOrdersApi.complete(id, "Completed from RRIMS frontend");
    if (kind === "pause") await moduleApi.post(`/work-orders/${id}/pause`, { reason: "Paused from RRIMS frontend" });
    setRefresh((value) => value + 1);
  }

  async function updateProgress(id: string) {
    await workOrdersApi.progress(id, progress[id] ?? 50, "Progress updated from RRIMS frontend");
    setRefresh((value) => value + 1);
  }

  return (
    <>
      <PageHeader title="Work Orders" eyebrow="Field execution" />
      <Panel className="mb-5">
        <div className="flex items-center gap-3 text-sm text-ink-700">
          <SlidersHorizontal className="h-4 w-4 text-civic-700" />
          Work order actions are role-protected by the backend. Buttons appear for quick operator workflows and surface backend validation directly.
        </div>
      </Panel>
      <DataTable
        rows={rows}
        loading={workOrders.loading}
        emptyTitle={workOrders.error ? "Work orders unavailable" : "No work orders found"}
        columns={[
          { header: "Work", cell: (row) => <div><p className="font-semibold text-ink-900">{row.title ?? row.report?.title ?? "Work order"}</p><p className="text-xs text-ink-500">{row.code ?? row.id}</p></div> },
          { header: "Status", cell: (row) => <Badge value={row.status} /> },
          { header: "Priority", cell: (row) => <Badge value={row.priority} /> },
          { header: "Engineer", cell: (row) => row.engineer?.fullName ?? "Unassigned" },
          { header: "Due", cell: (row) => dateLabel(row.dueAt) },
          { header: "Progress", cell: (row) => <Field label=""><input className={inputClass} type="number" min={0} max={100} value={progress[row.id] ?? row.progress ?? 0} onChange={(event) => setProgress({ ...progress, [row.id]: Number(event.target.value) })} /></Field> },
          { header: "Actions", cell: (row) => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => action("start", row.id)}><Play className="h-4 w-4" /></Button><Button variant="secondary" onClick={() => action("pause", row.id)}><Pause className="h-4 w-4" /></Button><Button variant="secondary" onClick={() => updateProgress(row.id)}>Save %</Button><Button variant="secondary" onClick={() => action("complete", row.id)}><CheckCircle2 className="h-4 w-4" /></Button></div> },
        ]}
      />
    </>
  );
}
