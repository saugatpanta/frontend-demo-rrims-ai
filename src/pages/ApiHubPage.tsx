import { Play, Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { moduleApi } from "../api/services";
import { apiCatalog, type ApiEndpoint } from "../data/apiCatalog";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";

export function ApiHubPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ApiEndpoint | null>(null);
  const [path, setPath] = useState("");
  const [body, setBody] = useState("{}");
  const [result, setResult] = useState("");
  const rows = useMemo(
    () => apiCatalog.filter((endpoint) => `${endpoint.group} ${endpoint.method} ${endpoint.path}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  function open(endpoint: ApiEndpoint) {
    setSelected(endpoint);
    setPath(endpoint.path);
    setBody(JSON.stringify(endpoint.body ?? {}, null, 2));
    setResult("");
  }

  async function run(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    try {
      const parsed = body.trim() ? JSON.parse(body) as Record<string, unknown> : {};
      const response =
        selected.method === "GET" ? await moduleApi.get(path) :
        selected.method === "POST" ? await moduleApi.post(path, parsed) :
        selected.method === "PATCH" ? await moduleApi.patch(path, parsed) :
        await moduleApi.remove(path, parsed);
      setResult(JSON.stringify(response, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <PageHeader title="API Hub" eyebrow="Complete backend surface" />
      <Panel className="mb-5">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink-900">Endpoint catalog</h2>
          <p className="mt-1 text-sm text-ink-500">Every major backend route group is represented here. Use IDs in place of `:params` to execute protected operations with your current session.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          <input className={`${inputClass} pl-10`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search endpoint, module, or method" />
        </div>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <DataTable
          rows={rows}
          columns={[
            { header: "Group", cell: (row) => row.group },
            { header: "Method", cell: (row) => <Badge value={row.method} /> },
            { header: "Path", cell: (row) => <code className="text-xs text-ink-700">{row.path}</code> },
            { header: "Run", cell: (row) => <Button variant="secondary" onClick={() => open(row)}><Play className="h-4 w-4" />Open</Button> },
          ]}
        />
        <Panel>
          <form onSubmit={run} className="space-y-4">
            <Field label="Path"><input className={inputClass} value={path} onChange={(event) => setPath(event.target.value)} placeholder="/reports" /></Field>
            <Field label="JSON body"><textarea className={`${inputClass} h-40 py-3 font-mono`} value={body} onChange={(event) => setBody(event.target.value)} /></Field>
            <Button disabled={!selected}>Execute</Button>
          </form>
          <pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{result || "Select an endpoint to execute."}</pre>
        </Panel>
      </div>
    </>
  );
}
