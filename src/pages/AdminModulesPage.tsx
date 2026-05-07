import { FormEvent, useState } from "react";
import { KeyRound, LifeBuoy, MailCheck, Plus, ShieldAlert } from "lucide-react";

import { moduleApi } from "../api/services";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
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
  const [showCreate, setShowCreate] = useState(false);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />Create API key</Button>
      </div>
      {showCreate ? <ApiKeyCreateForm onDone={() => setShowCreate(false)} /> : null}
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
          { label: "revoke", run: (row) => moduleApi.patch(`/api-keys/${row.id}/revoke`, { revokeReason: "Revoked from RRIMS frontend" }) },
        ]}
      />
    </>
  );
}

export function SupportPage() {
  const [state, setState] = useState({ subject: "", message: "", contactEmail: "", contactPhone: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult("");
    try {
      await moduleApi.post("/support/tickets", { ...state, source: "rrims-frontend", platform: navigator.platform, appVersion: "1.0.0" });
      setResult("Support ticket submitted successfully.");
      setState({ subject: "", message: "", contactEmail: "", contactPhone: "" });
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Could not submit support ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel>
      <div className="mb-6 flex items-center gap-3">
        <LifeBuoy className="h-5 w-5 text-civic-700" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Help desk</p>
          <h1 className="text-2xl font-bold text-ink-900">Support ticket</h1>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <Field label="Subject"><input className={inputClass} value={state.subject} onChange={(event) => setState({ ...state, subject: event.target.value })} /></Field>
        <Field label="Contact email"><input className={inputClass} type="email" value={state.contactEmail} onChange={(event) => setState({ ...state, contactEmail: event.target.value })} /></Field>
        <Field label="Contact phone"><input className={inputClass} value={state.contactPhone} onChange={(event) => setState({ ...state, contactPhone: event.target.value })} /></Field>
        <div />
        <Field label="Message"><textarea className={`${inputClass} h-36 py-3`} required minLength={10} value={state.message} onChange={(event) => setState({ ...state, message: event.target.value })} /></Field>
        <div className="lg:col-span-2 flex items-center gap-3">
          <Button loading={loading}>Submit ticket</Button>
          {result ? <p className="text-sm font-medium text-ink-700">{result}</p> : null}
        </div>
      </form>
    </Panel>
  );
}

function ApiKeyCreateForm({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState({ name: "", description: "", scopes: "dashboard.read,reports.read" });
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await moduleApi.post("/api-keys", {
        name: state.name,
        description: state.description || null,
        scopes: state.scopes.split(",").map((scope) => scope.trim()).filter(Boolean),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mb-5">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <Field label="Name"><input className={inputClass} required minLength={3} value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} /></Field>
        <Field label="Scopes"><input className={inputClass} required value={state.scopes} onChange={(event) => setState({ ...state, scopes: event.target.value })} /></Field>
        <Field label="Description"><input className={inputClass} value={state.description} onChange={(event) => setState({ ...state, description: event.target.value })} /></Field>
        <div className="lg:col-span-3"><Button loading={loading}>Create key</Button></div>
      </form>
    </Panel>
  );
}
