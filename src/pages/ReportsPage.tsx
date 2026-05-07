import { CheckCircle2, Eye, Plus, RotateCcw, Search, Trash2, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { geographyApi, moduleApi, reportsApi, unwrapList } from "../api/services";
import type { Report, SelectOption } from "../api/types";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { dateLabel } from "../utils/format";
import { playTone } from "../utils/sound";
import { useAuth } from "../context/AuthContext";

export function ReportsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Report | null>(null);
  const [refresh, setRefresh] = useState(0);
  const reports = useAsync(() => reportsApi.list({ limit: 20, search }), [refresh]);
  const rows = reports.data ? unwrapList<Report>(reports.data) : [];

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setRefresh((value) => value + 1);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        eyebrow="Incident lifecycle"
        action={<Button onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />New report</Button>}
      />

      {showCreate ? <CreateReport onCreated={() => { setShowCreate(false); setRefresh((value) => value + 1); }} /> : null}

      <Panel className="mb-5">
        <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-10`} placeholder="Search reports by title, code, or location" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Button variant="secondary">Search</Button>
        </form>
      </Panel>

      <DataTable
        rows={rows}
        loading={reports.loading}
        emptyTitle={reports.error ? "Reports unavailable" : "No reports found"}
        columns={[
          { header: "Report", cell: (row) => <div><p className="font-semibold text-ink-900">{row.title}</p><p className="text-xs text-ink-500">{row.code ?? row.trackingCode ?? row.id}</p></div> },
          { header: "Status", cell: (row) => <Badge value={row.status} /> },
          { header: "Severity", cell: (row) => <Badge value={row.severity} /> },
          { header: "Assignee", cell: (row) => row.assignedEngineer?.fullName ?? "Unassigned" },
          { header: "Location", cell: (row) => row.localGovernment ?? row.district ?? "Not set" },
          { header: "Created", cell: (row) => dateLabel(row.createdAt) },
          { header: "Actions", cell: (row) => <Button variant="secondary" onClick={() => setSelected(row)}><Eye className="h-4 w-4" />Open</Button> },
        ]}
      />
      {selected ? <ReportDetail report={selected} onClose={() => setSelected(null)} onChanged={() => setRefresh((value) => value + 1)} /> : null}
    </>
  );
}

function ReportDetail({ report, onClose, onChanged }: { report: Report; onClose: () => void; onChanged: () => void }) {
  const { user } = useAuth();
  const [note, setNote] = useState("Updated from RRIMS frontend");
  const [actionMessage, setActionMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const timeline = useAsync(() => reportsApi.timeline(report.id), [report.id]);

  async function run(action: "verify" | "reject" | "reopen" | "close") {
    setActionMessage("");
    setActionLoading(action);
    try {
      await moduleApi.post(`/reports/${report.id}/${action}`, { reason: note, note });
      playTone("success");
      setActionMessage(`${action} completed successfully.`);
      onChanged();
    } catch (error) {
      playTone("error");
      setActionMessage(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setActionLoading("");
    }
  }

  async function removeReport() {
    if (String(user?.role ?? "") !== "SUPER_ADMIN") return;
    if (!window.confirm(`Delete ${report.title}? This will soft-delete the report and preserve audit history.`)) return;
    setActionMessage("");
    setActionLoading("delete");
    try {
      await moduleApi.remove(`/reports/${report.id}`, { reason: note, note });
      playTone("success");
      setActionMessage("Report deleted successfully.");
      onChanged();
      onClose();
    } catch (error) {
      playTone("error");
      setActionMessage(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="ml-auto h-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Report detail</p>
            <h2 className="mt-1 text-2xl font-bold text-ink-900">{report.title}</h2>
            <p className="mt-1 text-sm text-ink-500">{report.code ?? report.trackingCode ?? report.id}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge value={report.status} />
          <Badge value={report.severity} />
          <Badge value={report.priority} />
        </div>
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-ink-700">{report.description ?? "No description returned."}</p>
        <div className="mt-4">
          <Field label="Action note">
            <textarea className={`${inputClass} h-24 py-3`} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" loading={actionLoading === "verify"} onClick={() => run("verify")}><CheckCircle2 className="h-4 w-4" />Verify</Button>
          <Button variant="secondary" loading={actionLoading === "reopen"} onClick={() => run("reopen")}><RotateCcw className="h-4 w-4" />Reopen</Button>
          <Button variant="secondary" loading={actionLoading === "close"} onClick={() => run("close")}>Close report</Button>
          <Button variant="danger" loading={actionLoading === "reject"} onClick={() => run("reject")}><XCircle className="h-4 w-4" />Reject</Button>
          {String(user?.role ?? "") === "SUPER_ADMIN" ? (
            <Button variant="danger" loading={actionLoading === "delete"} onClick={removeReport}><Trash2 className="h-4 w-4" />Delete</Button>
          ) : null}
        </div>
        {actionMessage ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-800">{actionMessage}</p> : null}
        <div className="mt-6">
          <h3 className="font-bold text-ink-900">Timeline</h3>
          <div className="mt-3 space-y-2">
            {(Array.isArray(timeline.data) ? timeline.data : []).slice(0, 8).map((item, index) => (
              <div key={index} className="rounded-md border border-slate-200 p-3 text-sm text-ink-700">{JSON.stringify(item)}</div>
            ))}
            {!timeline.loading && (!Array.isArray(timeline.data) || timeline.data.length === 0) ? <p className="text-sm text-ink-500">No timeline returned.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateReport({ onCreated }: { onCreated: () => void }) {
  const categories = useAsync(() => geographyApi.categories(), []);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "MEDIUM",
    categoryId: "",
    province: "Bagmati Province",
    district: "Kathmandu",
    localGovernment: "Kathmandu Metropolitan City",
    wardNumber: 1,
  });

  useEffect(() => {
    const first = (categories.data as SelectOption[] | null)?.[0];
    if (first?.id && !form.categoryId) setForm((value) => ({ ...value, categoryId: first.id! }));
  }, [categories.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await reportsApi.create(form);
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mb-5">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required minLength={5} /></Field>
        <Field label="Severity">
          <select className={inputClass} value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
        </Field>
        <Field label="Category">
          <select className={inputClass} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required>
            <option value="">Select category</option>
            {(categories.data ?? []).map((category) => <option key={category.id ?? category.name} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Local government"><input className={inputClass} value={form.localGovernment} onChange={(event) => setForm({ ...form, localGovernment: event.target.value })} /></Field>
        <Field label="Description"><textarea className={`${inputClass} h-28 py-3`} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required minLength={10} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Province"><input className={inputClass} value={form.province} onChange={(event) => setForm({ ...form, province: event.target.value })} /></Field>
          <Field label="District"><input className={inputClass} value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value })} /></Field>
          <Field label="Ward"><input className={inputClass} type="number" value={form.wardNumber} onChange={(event) => setForm({ ...form, wardNumber: Number(event.target.value) })} /></Field>
        </div>
        <div className="lg:col-span-2">
          <Button loading={loading}>Create report</Button>
        </div>
      </form>
    </Panel>
  );
}
