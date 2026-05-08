import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, LifeBuoy, MailCheck, Phone, Plus, Send, ShieldAlert } from "lucide-react";

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
      deletePath={(row) => row.id ? `/notifications/${row.id}` : undefined}
      deleteReason="Deleted by super admin from RRIMS notification console"
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
  const [open, setOpen] = useState(false);

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
    <>
      <section className="mb-6 overflow-hidden rounded-lg border border-white/70 bg-slate-950 text-white shadow-2xl">
        <div className="surface-grid bg-[linear-gradient(135deg,#08111f,#123a6f_58%,#0f766e)] p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-civic-100">Help desk</p>
              <h1 className="mt-2 text-3xl font-black leading-tight">Support center</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-100">
                Open a ticket in a focused popup. Contact routes and ticket APIs are connected to the backend support module.
              </p>
            </div>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New ticket</Button>
          </div>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <LifeBuoy className="mb-4 h-8 w-8 text-civic-700" />
          <h2 className="text-xl font-black text-ink-900">Ticket intake</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink-500">Submit issues, account help, and operational support requests.</p>
          <Button className="mt-5" onClick={() => setOpen(true)}><Send className="h-4 w-4" />Open form</Button>
        </Panel>
        <Panel className="p-5">
          <MailCheck className="mb-4 h-8 w-8 text-blue-700" />
          <h2 className="text-xl font-black text-ink-900">Contact details</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink-500">Use email and phone fields so support can follow up quickly.</p>
        </Panel>
        <Panel className="p-5">
          <CheckCircle2 className="mb-4 h-8 w-8 text-green-700" />
          <h2 className="text-xl font-black text-ink-900">Status</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-ink-500">{result || "No ticket submitted in this session yet."}</p>
        </Panel>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <div className="mx-auto my-8 max-w-3xl overflow-hidden rounded-lg border border-white/70 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff,#eef7f6)] p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-civic-700">Support popup</p>
              <h2 className="text-xl font-black text-ink-900">Create support ticket</h2>
            </div>
            <form onSubmit={submit} className="grid gap-4 bg-slate-50 p-5 lg:grid-cols-2">
              <Field label="Subject"><input className={inputClass} required value={state.subject} onChange={(event) => setState({ ...state, subject: event.target.value })} /></Field>
              <Field label="Contact email"><input className={inputClass} type="email" value={state.contactEmail} onChange={(event) => setState({ ...state, contactEmail: event.target.value })} /></Field>
              <Field label="Contact phone"><input className={inputClass} value={state.contactPhone} onChange={(event) => setState({ ...state, contactPhone: event.target.value })} /></Field>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-ink-600"><Phone className="mr-2 inline h-4 w-4 text-civic-700" />Support uses your current RRIMS session context.</div>
              <Field label="Message"><textarea className={`${inputClass} h-40 py-3`} required minLength={10} value={state.message} onChange={(event) => setState({ ...state, message: event.target.value })} /></Field>
              <div className="flex items-end gap-3 lg:col-span-2">
                <Button loading={loading}>Submit ticket</Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
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
