import type { ReactNode } from "react";

import { EmptyState, SkeletonRows } from "./ui";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T>({
  rows,
  columns,
  loading,
  emptyTitle = "Nothing here yet",
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyTitle?: string;
}) {
  if (loading) return <SkeletonRows />;
  if (!rows.length) return <EmptyState title={emptyTitle} body="The backend returned no records for this view." />;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_44px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-civic-50/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-500">Record ledger</p>
          <p className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-ink-600 shadow-sm ring-1 ring-slate-200">{rows.length} rows</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-950">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className="whitespace-nowrap px-4 py-3.5 text-left text-xs font-black uppercase tracking-[0.13em] text-slate-200"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, index) => (
              <tr key={index} className="transition hover:bg-civic-50/55">
                {columns.map((column) => (
                  <td key={column.header} className="max-w-[28rem] px-4 py-4 text-sm text-ink-700">
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
