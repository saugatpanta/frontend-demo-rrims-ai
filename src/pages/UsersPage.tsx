import { Search, UserCog } from "lucide-react";
import { FormEvent, useState } from "react";

import { unwrapList, usersApi } from "../api/services";
import type { User } from "../api/types";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const users = useAsync(() => usersApi.list({ limit: 20, search }), [refresh]);
  const rows = users.data ? unwrapList<User>(users.data) : [];

  function submit(event: FormEvent) {
    event.preventDefault();
    setRefresh((value) => value + 1);
  }

  return (
    <>
      <PageHeader title="Users" eyebrow="Access and identity" />
      <Panel className="mb-5">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-10`} placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Button variant="secondary">Search</Button>
        </form>
      </Panel>
      <DataTable
        rows={rows}
        loading={users.loading}
        emptyTitle={users.error ? "Users unavailable for this role" : "No users found"}
        columns={[
          { header: "User", cell: (row) => <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-civic-50 text-civic-700"><UserCog className="h-4 w-4" /></div><div><p className="font-semibold text-ink-900">{row.fullName}</p><p className="text-xs text-ink-500">{row.username}</p></div></div> },
          { header: "Role", cell: (row) => <Badge value={row.role} /> },
          { header: "Phone", cell: (row) => row.phone },
          { header: "Email", cell: (row) => row.email ?? "Not set" },
          { header: "Verified", cell: (row) => row.isEmailVerified || row.isPhoneVerified ? <Badge value="VERIFIED" /> : <Badge value="PENDING" /> },
          { header: "Profile", cell: (row) => `${row.profileCompleteness?.percentage ?? 0}%` },
        ]}
      />
    </>
  );
}
