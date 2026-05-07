import { Plus, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { geographyApi, reportsApi, unwrapList } from "../api/services";
import type { Report, SelectOption } from "../api/types";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { dateLabel } from "../utils/format";

export function ReportsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
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
        ]}
      />
    </>
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
