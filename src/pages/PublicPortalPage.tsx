import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Globe2,
  LogIn,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
} from "lucide-react";
import type { ReactNode } from "react";
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
  const topReport = reportRows[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative min-h-screen overflow-hidden bg-[url('https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=2200&q=85')] bg-cover bg-center text-white">
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 to-transparent" />

        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-white text-civic-700 shadow-soft">
                <Siren className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-black leading-tight">RRIMS</p>
                <p className="text-xs font-medium text-white/75">Road & resource incident response</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="#public-data" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 sm:inline-flex">
                Public data
              </a>
              <Link to="/login">
                <Button variant="secondary">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              </Link>
            </div>
          </header>

          <div className="grid flex-1 items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur">
                <Radio className="h-4 w-4 text-civic-100" />
                Live public transparency portal
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[1.02] sm:text-6xl lg:text-7xl">
                RRIMS Public Portal
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/88">
                Track visible infrastructure reports, response progress, and public service performance across Nepal’s local governments.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#public-data">
                  <Button>
                    Explore public data
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              <Link to="/login">
                <Button variant="secondary">Operator workspace</Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary">Citizen registration</Button>
              </Link>
            </div>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/12 p-4 shadow-soft backdrop-blur-md">
              <div className="rounded-lg bg-white p-4 text-ink-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Latest public signal</p>
                    <h2 className="mt-1 text-xl font-bold">{topReport?.title ?? "Awaiting latest public report"}</h2>
                  </div>
                  <Badge value={topReport?.status ?? "LIVE"} />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MiniMetric icon={<FileText className="h-4 w-4" />} label="Reports" value={compactNumber(data.totalReports)} />
                  <MiniMetric icon={<CheckCircle2 className="h-4 w-4" />} label="Resolved" value={compactNumber(data.resolvedReports)} />
                  <MiniMetric icon={<Globe2 className="h-4 w-4" />} label="Areas" value={compactNumber(data.activeLocalGovernments)} />
                </div>
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-700">Public response rate</span>
                    <span className="font-bold text-civic-700">{Number(data.responseRate ?? 0)}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-civic-700" style={{ width: `${Math.min(Number(data.responseRate ?? 0), 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mb-8 grid gap-px overflow-hidden rounded-lg border border-white/15 bg-white/15 backdrop-blur md:grid-cols-4">
            <PublicSignal label="Portal status" value="Live" />
            <PublicSignal label="API surface" value="342 endpoints" />
            <PublicSignal label="Evidence" value="Photo, video, files" />
            <PublicSignal label="Access" value="Citizen + operator" />
          </div>
        </div>
      </section>

      <section id="public-data" className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="-mt-16 grid gap-4 md:grid-cols-4">
          <StatCard label="Total reports" value={compactNumber(data.totalReports)} icon={<FileText className="h-5 w-5" />} />
          <StatCard label="Resolved" value={compactNumber(data.resolvedReports)} icon={<ShieldCheck className="h-5 w-5" />} accent="green" />
          <StatCard label="Active areas" value={compactNumber(data.activeLocalGovernments)} icon={<MapPin className="h-5 w-5" />} accent="blue" />
          <StatCard label="Response rate" value={`${Number(data.responseRate ?? 0)}%`} icon={<BarChart3 className="h-5 w-5" />} accent="amber" />
        </div>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <ProcessStep icon={<Siren className="h-5 w-5" />} title="Report intake" body="Public reports are grouped by location, severity, category, and visible tracking information." />
          <ProcessStep icon={<Clock3 className="h-5 w-5" />} title="Response tracking" body="Verified work moves through review, assignment, field execution, and resolution states." />
          <ProcessStep icon={<ShieldCheck className="h-5 w-5" />} title="Public accountability" body="Citizens can inspect service performance while operators handle protected case details." />
        </section>

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

function PublicSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950/35 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-civic-100">{label}</p>
      <p className="mt-1 text-base font-black text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-civic-50 text-civic-700">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}

function ProcessStep({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-civic-50 text-civic-700">{icon}</div>
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">{body}</p>
    </div>
  );
}
