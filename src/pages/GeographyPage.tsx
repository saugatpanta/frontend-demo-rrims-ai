import { MapPinned } from "lucide-react";

import { geographyApi } from "../api/services";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

export function GeographyPage() {
  const provinces = useAsync(() => geographyApi.provinces(), []);
  const categories = useAsync(() => geographyApi.categories(), []);

  return (
    <>
      <PageHeader title="Geography" eyebrow="Nepal coverage data" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center gap-3">
            <MapPinned className="h-5 w-5 text-civic-700" />
            <h2 className="text-xl font-bold text-ink-900">Provinces</h2>
          </div>
          <DataTable
            rows={provinces.data ?? []}
            loading={provinces.loading}
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Code", cell: (row) => row.code ?? "Not set" },
              { header: "ID", cell: (row) => row.id ?? "Not set" },
            ]}
          />
        </Panel>
        <Panel>
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-civic-700">Reference data</p>
            <h2 className="text-xl font-bold text-ink-900">Report categories</h2>
          </div>
          <DataTable
            rows={categories.data ?? []}
            loading={categories.loading}
            columns={[
              { header: "Name", cell: (row) => row.name },
              { header: "Code", cell: (row) => row.code ?? "Not set" },
              { header: "ID", cell: (row) => row.id ?? "Not set" },
            ]}
          />
        </Panel>
      </div>
    </>
  );
}
