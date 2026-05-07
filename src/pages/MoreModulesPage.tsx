import { CircuitBoard, Clock3, FileKey, ShieldCheck, UserPlus, Webhook } from "lucide-react";

import { moduleApi } from "../api/services";
import { Badge } from "../components/ui";
import { ResourcePage } from "./ResourcePage";

export function FilesPage() {
  return (
    <ResourcePage
      title="Files"
      eyebrow="Secure file vault"
      path="/files"
      description="File governance console with metadata, access logs, quarantine, signed access, restore, and purge operations."
      columns={[
        { header: "File", cell: (row) => <div className="flex items-center gap-3"><FileKey className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.fileName ?? row.name ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.mimeType ?? row.storageKey ?? "File")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? row.scanStatus ?? "STORED")} /> },
        { header: "Size", cell: (row) => String(row.size ?? row.bytes ?? "Not set") },
        { header: "Created", key: "createdAt" },
      ]}
      actions={[
        { label: "quarantine", run: (row) => moduleApi.post(`/files/${row.id ?? row.fileId}/quarantine`, { reason: "Quarantined from RRIMS frontend" }) },
        { label: "restore", run: (row) => moduleApi.post(`/files/${row.id ?? row.fileId}/restore`, { reason: "Restored from RRIMS frontend" }) },
        { label: "signed url", run: (row) => moduleApi.post(`/files/${row.id ?? row.fileId}/signed-url`, { expiresInSeconds: 300 }) },
      ]}
      deletePath={(row) => row.id || row.fileId ? `/files/${row.id ?? row.fileId}` : undefined}
      deleteReason="Deleted by super admin from RRIMS file console"
    />
  );
}

export function SlasPage() {
  return (
    <ResourcePage
      title="SLAs"
      eyebrow="Service policy"
      path="/slas"
      description="SLA policy list and management surface for escalation and response-time rules."
      columns={[
        { header: "Policy", cell: (row) => <div className="flex items-center gap-3"><Clock3 className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.name ?? row.title ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.description ?? row.level ?? "SLA")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ACTIVE")} /> },
        { header: "Target", cell: (row) => String(row.targetHours ?? row.responseHours ?? row.duration ?? "Not set") },
        { header: "Updated", key: "updatedAt" },
      ]}
      deletePath={(row) => row.id ? `/slas/${row.id}` : undefined}
      deleteReason="Deleted by super admin from RRIMS SLA console"
    />
  );
}

export function AdminsPage() {
  return (
    <ResourcePage
      title="Admins"
      eyebrow="Administration"
      path="/admins"
      description="Admin management for privileged RRIMS operators."
      columns={[
        { header: "Admin", cell: (row) => <div className="flex items-center gap-3"><UserPlus className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.fullName ?? row.name ?? row.username ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.email ?? row.phone ?? "Admin")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ACTIVE")} /> },
        { header: "Role", cell: (row) => String(row.role ?? "ADMIN") },
        { header: "Created", key: "createdAt" },
      ]}
    />
  );
}

export function WebhooksPage() {
  return (
    <ResourcePage
      title="Webhooks"
      eyebrow="Outbound integrations"
      path="/webhooks"
      description="Webhook endpoint management with delivery inspection, test delivery, and secret rotation."
      columns={[
        { header: "Webhook", cell: (row) => <div className="flex items-center gap-3"><Webhook className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.name ?? row.url ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.eventTypes ?? row.events ?? "Webhook")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ACTIVE")} /> },
        { header: "URL", cell: (row) => String(row.url ?? "Not set") },
        { header: "Updated", key: "updatedAt" },
      ]}
      actions={[
        { label: "test", run: (row) => moduleApi.post(`/webhooks/${row.id}/test`, { payload: { source: "rrims-frontend" } }) },
        { label: "rotate", run: (row) => moduleApi.post(`/webhooks/${row.id}/rotate-secret`, { reason: "Rotated from RRIMS frontend" }) },
      ]}
      deletePath={(row) => row.id ? `/webhooks/${row.id}` : undefined}
      deleteReason="Deleted by super admin from RRIMS webhook console"
    />
  );
}

export function OutboxPage() {
  return (
    <ResourcePage
      title="Outbox"
      eyebrow="Event reliability"
      path="/outbox/events"
      description="Outbox event monitor for retries and delivery health. Dead letters are available through the API hub and DLQ route."
      columns={[
        { header: "Event", cell: (row) => <div className="flex items-center gap-3"><CircuitBoard className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.eventType ?? row.type ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.aggregateId ?? row.topic ?? "Outbox event")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "PENDING")} /> },
        { header: "Attempts", cell: (row) => String(row.attempts ?? row.retryCount ?? 0) },
        { header: "Created", key: "createdAt" },
      ]}
      actions={[
        { label: "retry", run: (row) => moduleApi.post(`/outbox/events/${row.id}/retry`, { reason: "Retry from RRIMS frontend" }) },
      ]}
    />
  );
}

export function WorkersPage() {
  return (
    <ResourcePage
      title="Workers"
      eyebrow="Background operations"
      path="/workers/readiness"
      description="Worker operations health, readiness, metrics, and runbook access. Use API Hub for metrics and runbook routes."
      columns={[
        { header: "Probe", cell: () => <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">Worker readiness</p><p className="text-xs text-ink-500">Background processing</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? "OK")} /> },
        { header: "Service", cell: (row) => String(row.service ?? "workers") },
        { header: "Checked", key: "timestamp" },
      ]}
    />
  );
}
