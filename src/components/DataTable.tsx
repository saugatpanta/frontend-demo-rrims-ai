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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.header} className="px-4 py-3 text-sm text-ink-700">
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
