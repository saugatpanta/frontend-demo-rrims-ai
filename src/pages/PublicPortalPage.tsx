import { ArrowRight, BarChart3, FileText, LogIn, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { publicApi, unwrapList } from "../api/services";
import type { Report } from "../api/types";
import { DataTable } from "../components/DataTable";
import { Badge, Button, Panel, StatCard } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { compactNumber, dateLabel } from "../utils/format";

export function PublicPortalPage() {
  const summary = useAsync(() => publicApi.summary(), []);
  const reports = useAsync(() => publicApi.reports(), []);
  const reportRows = reports.data ? unwrapList<Report>(reports.data).slice(0, 6) : [];
  const data = summary.data ?? {};

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="relative min-h-[92vh] bg-[url('https://images.unsplash.com/photo-1625129870013-7e7dbf28f702?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">RRIMS</p>
              <p className="text-xs font-medium text-white/75">Nepal infrastructure incident response</p>
            </div>
            <Link to="/login">
              <Button variant="secondary">
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          </header>

          <div className="mt-auto max-w-3xl pb-10 pt-20">
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">RRIMS Public Portal</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90">
              A transparent view of public reports, response activity, and infrastructure service delivery across local governments.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#public-data">
                <Button>
                  View public data
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link to="/login">
                <Button variant="secondary">Operator login</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="public-data" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total reports" value={compactNumber(data.totalReports)} icon={<FileText className="h-5 w-5" />} />
          <StatCard label="Resolved" value={compactNumber(data.resolvedReports)} icon={<ShieldCheck className="h-5 w-5" />} accent="green" />
          <StatCard label="Active areas" value={compactNumber(data.activeLocalGovernments)} icon={<MapPin className="h-5 w-5" />} accent="blue" />
          <StatCard label="Response rate" value={`${Number(data.responseRate ?? 0)}%`} icon={<BarChart3 className="h-5 w-5" />} accent="amber" />
        </div>

        <Panel className="mt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Public reports</p>
              <h2 className="text-xl font-bold text-ink-900">Latest visible incidents</h2>
            </div>
            <p className="text-sm text-ink-500">Read-only data from `/public-portal/reports`</p>
          </div>
          <DataTable
            rows={reportRows}
            loading={reports.loading}
            columns={[
              { header: "Report", cell: (row) => <div><p className="font-semibold text-ink-900">{row.title}</p><p className="text-xs text-ink-500">{row.trackingCode ?? row.code ?? row.id}</p></div> },
              { header: "Status", cell: (row) => <Badge value={row.status} /> },
              { header: "Severity", cell: (row) => <Badge value={row.severity} /> },
              { header: "Location", cell: (row) => row.localGovernment ?? row.district ?? "Nepal" },
              { header: "Created", cell: (row) => dateLabel(row.createdAt) },
            ]}
          />
        </Panel>
      </section>
    </main>
  );
}
