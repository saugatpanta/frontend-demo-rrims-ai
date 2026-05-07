import { KeyRound, LifeBuoy, MailCheck, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

import { moduleApi } from "../api/services";
import { Badge, Button, Panel } from "../components/ui";
import { ResourcePage } from "./ResourcePage";

export function NotificationsPage() {
  return (
    <ResourcePage
      title="Notifications"
      eyebrow="Delivery center"
      path="/notifications"
      description="Notification inbox with unread tracking, delivery inspection, retry routes, and cleanup actions."
      columns={[
        { header: "Notification", cell: (row) => <div className="flex items-center gap-3"><MailCheck className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.title ?? row.subject ?? row.type ?? row.id)}</p><p className="max-w-md truncate text-xs text-ink-500">{String(row.message ?? row.body ?? "")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? (row.readAt ? "READ" : "UNREAD"))} /> },
        { header: "Channel", cell: (row) => String(row.channel ?? row.deliveryChannel ?? "App") },
        { header: "Created", key: "createdAt" },
      ]}
      actions={[
        { label: "read", run: (row) => moduleApi.patch(`/notifications/${row.id}/read`) },
        { label: "retry", run: (row) => moduleApi.post(`/notifications/${row.id}/retry`, { reason: "Retry from RRIMS frontend" }) },
      ]}
    />
  );
}

export function AuditPage() {
  return (
    <ResourcePage
      title="Audit"
      eyebrow="Governance trail"
      path="/audit"
      description="Privileged audit event review for admins and super admins. Includes actor, action, resource, timestamp, and immutable governance evidence from the backend."
      columns={[
        { header: "Event", cell: (row) => <div className="flex items-center gap-3"><ShieldAlert className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.action ?? row.event ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.resource ?? row.entityType ?? "System")}</p></div></div> },
        { header: "Actor", cell: (row) => String(row.actorName ?? row.actorId ?? row.userId ?? "System") },
        { header: "Severity", cell: (row) => <Badge value={String(row.severity ?? row.outcome ?? "INFO")} /> },
        { header: "Time", key: "createdAt" },
      ]}
    />
  );
}

export function ApiKeysPage() {
  return (
    <ResourcePage
      title="API Keys"
      eyebrow="Integration security"
      path="/api-keys"
      description="Manage API credentials for system integrations. Create, rotate, revoke, and audit keys through the secured backend API."
      columns={[
        { header: "Key", cell: (row) => <div className="flex items-center gap-3"><KeyRound className="h-4 w-4 text-civic-700" /><div><p className="font-semibold text-ink-900">{String(row.name ?? row.label ?? row.id)}</p><p className="text-xs text-ink-500">{String(row.prefix ?? row.maskedKey ?? "Credential")}</p></div></div> },
        { header: "Status", cell: (row) => <Badge value={String(row.status ?? (row.revokedAt ? "REVOKED" : "ACTIVE"))} /> },
        { header: "Last used", key: "lastUsedAt" },
        { header: "Created", key: "createdAt" },
      ]}
      actions={[
        { label: "regenerate", run: (row) => moduleApi.post(`/api-keys/${row.id}/regenerate`) },
        { label: "revoke", run: (row) => moduleApi.patch(`/api-keys/${row.id}/revoke`, { reason: "Revoked from RRIMS frontend" }) },
      ]}
    />
  );
}

export function SupportPage() {
  return (
    <>
      <ResourcePage
        title="Support"
        eyebrow="Help desk"
        path="/support/contact"
        description="Support contact and ticket submission center. Authenticated users can submit backend support tickets."
      />
      <Panel className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-civic-700" />
            <div>
              <h2 className="font-bold text-ink-900">Need a ticket form?</h2>
              <p className="text-sm text-ink-500">Ticket submission is available through `/support/tickets` and can be extended with category-specific fields.</p>
            </div>
          </div>
          <Link to="/app/profile"><Button variant="secondary">Check account</Button></Link>
        </div>
      </Panel>
    </>
  );
}
