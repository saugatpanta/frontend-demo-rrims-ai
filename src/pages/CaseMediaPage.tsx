import { BriefcaseBusiness, Image, ListChecks } from "lucide-react";
import { FormEvent, useState } from "react";

import { moduleApi } from "../api/services";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { ResourcePage } from "./ResourcePage";

export function CasesPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate((value) => !value)}>Create case</Button>
      </div>
      {showCreate ? <CaseCreateForm onDone={() => setShowCreate(false)} /> : null}
      <ResourcePage
        title="Cases"
        eyebrow="Case management"
        path="/cases"
        description="Case management workspace for grouping reports, assigning ownership, updating case state, and closing resolved operational cases."
        columns={[
          { header: "Case", cell: (row) => <div className="flex items-center gap-3"><BriefcaseBusiness className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.title ?? row.code ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.description ?? row.summary ?? "")}</p></div></div> },
          { header: "Status", cell: (row) => <Badge value={String(row.status ?? "OPEN")} /> },
          { header: "Owner", cell: (row) => String(row.assigneeName ?? row.assignedToId ?? "Unassigned") },
          { header: "Created", key: "createdAt" },
        ]}
        actions={[
          { label: "close", run: (row) => moduleApi.post(`/cases/${row.id}/close`, { reason: "Closed from RRIMS frontend", resolutionCode: "RESOLVED", summary: "Closed from RRIMS frontend" }) },
        ]}
      />
    </>
  );
}

export function MediaPage() {
  return (
    <ResourcePage
      title="Media"
      eyebrow="Report evidence"
      path="/report-media"
      description="Central report media and evidence viewer. Downloads are served by `/report-media/:id/download` with backend authorization."
      columns={[
        { header: "Media", cell: (row) => <div className="flex items-center gap-3"><Image className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.fileName ?? row.name ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.mimeType ?? row.mediaType ?? "Attachment")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? row.scanStatus ?? "AVAILABLE")} /> },
        { header: "Report", cell: (row) => String(row.reportCode ?? row.reportId ?? "Not linked") },
        { header: "Uploaded", key: "createdAt" },
      ]}
    />
  );
}

export function WorkflowPage() {
  return (
    <ResourcePage
      title="Workflow"
      eyebrow="Assignments and SLA"
      path="/assignments"
      description="Operational assignment workspace with ownership, SLA visibility, and workflow state. Use it alongside work orders for field execution."
      columns={[
        { header: "Assignment", cell: (row) => <div className="flex items-center gap-3"><ListChecks className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.title ?? row.reportCode ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.note ?? row.reason ?? "")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ASSIGNED")} /> },
        { header: "Assignee", cell: (row) => String(row.assigneeName ?? row.engineerId ?? "Unassigned") },
        { header: "Due", key: "dueAt" },
      ]}
    />
  );
}

function CaseCreateForm({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState({
    sourceType: "REPORT",
    sourceId: "",
    title: "",
    description: "",
    ownerUnitLevel: "LOCAL",
  });
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await moduleApi.post("/cases", state);
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mb-5">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <Field label="Source type">
          <select className={inputClass} value={state.sourceType} onChange={(event) => setState({ ...state, sourceType: event.target.value })}>
            <option>REPORT</option>
            <option>WORK_ORDER</option>
          </select>
        </Field>
        <Field label="Source ID"><input className={inputClass} required value={state.sourceId} onChange={(event) => setState({ ...state, sourceId: event.target.value })} /></Field>
        <Field label="Title"><input className={inputClass} required minLength={3} value={state.title} onChange={(event) => setState({ ...state, title: event.target.value })} /></Field>
        <Field label="Owner level">
          <select className={inputClass} value={state.ownerUnitLevel} onChange={(event) => setState({ ...state, ownerUnitLevel: event.target.value })}>
            <option>WARD</option><option>LOCAL</option><option>DISTRICT</option><option>PROVINCE</option><option>FEDERAL</option>
          </select>
        </Field>
        <Field label="Description"><textarea className={`${inputClass} h-28 py-3`} required minLength={3} value={state.description} onChange={(event) => setState({ ...state, description: event.target.value })} /></Field>
        <div className="lg:col-span-2"><Button loading={loading}>Create case</Button></div>
      </form>
    </Panel>
  );
}
