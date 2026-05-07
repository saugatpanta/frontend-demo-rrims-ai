import { CheckCircle2, MessageSquare, Pause, PhoneCall, Play, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { moduleApi, unwrapList, workOrdersApi } from "../api/services";
import type { WorkOrder } from "../api/types";
import { CommunicationConsole } from "../components/CommunicationConsole";
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
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [conversationId, setConversationId] = useState("");
  const [communicationMessage, setCommunicationMessage] = useState("");
  const [initialMessage, setInitialMessage] = useState("Hello, I am opening this work-order channel for coordination.");

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

  async function openCommunication(row: WorkOrder) {
    setCommunicationMessage("");
    setSelectedWorkOrder(row);
    try {
      const result = await workOrdersApi.ensureCommunication(row.id, initialMessage);
      setConversationId(String(result.conversationId ?? ""));
      setCommunicationMessage(
        result.created
          ? "Engineer-client conversation created. Messages, voice notes, attachments, and calls are available."
          : "Engineer-client conversation opened.",
      );
    } catch (error) {
      setConversationId("");
      setCommunicationMessage(error instanceof Error ? error.message : "Could not open work-order communication.");
    }
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
          { header: "Actions", cell: (row) => <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => action("start", row.id)}><Play className="h-4 w-4" /></Button><Button variant="secondary" onClick={() => action("pause", row.id)}><Pause className="h-4 w-4" /></Button><Button variant="secondary" onClick={() => updateProgress(row.id)}>Save %</Button><Button variant="secondary" onClick={() => action("complete", row.id)}><CheckCircle2 className="h-4 w-4" /></Button><Button variant="secondary" onClick={() => openCommunication(row)}><MessageSquare className="h-4 w-4" />Client</Button></div> },
        ]}
      />
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Panel>
          <div className="flex items-center gap-3">
            <PhoneCall className="h-5 w-5 text-civic-700" />
            <div>
              <h2 className="text-xl font-black text-ink-900">Assigned client channel</h2>
              <p className="text-sm text-ink-500">Available only when the work order has both an assigned engineer and reporting citizen.</p>
            </div>
          </div>
          <Field label="Opening message">
            <textarea
              className={`${inputClass} mt-4 min-h-28 py-3`}
              value={initialMessage}
              onChange={(event) => setInitialMessage(event.target.value)}
            />
          </Field>
          {selectedWorkOrder ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-black text-ink-900">{selectedWorkOrder.title ?? selectedWorkOrder.report?.title ?? "Selected work order"}</p>
              <p className="mt-1 text-xs font-semibold text-ink-500">{selectedWorkOrder.code ?? selectedWorkOrder.id}</p>
            </div>
          ) : null}
          {communicationMessage ? <p className="mt-4 rounded-md bg-civic-50 p-3 text-sm font-semibold text-civic-800">{communicationMessage}</p> : null}
        </Panel>
        <CommunicationConsole
          conversationId={conversationId || undefined}
          title={selectedWorkOrder ? `${selectedWorkOrder.code ?? "Work order"} client conversation` : "Assigned client conversation"}
        />
      </div>
    </>
  );
}
