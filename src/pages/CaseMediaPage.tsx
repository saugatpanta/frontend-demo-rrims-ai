import { BriefcaseBusiness, Image, ListChecks } from "lucide-react";

import { moduleApi } from "../api/services";
import { Badge } from "../components/ui";
import { ResourcePage } from "./ResourcePage";

export function CasesPage() {
  return (
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
        { label: "close", run: (row) => moduleApi.post(`/cases/${row.id}/close`, { reason: "Closed from RRIMS frontend" }) },
      ]}
    />
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
