import {
  CheckCircle2,
  Trash2,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCog,
  UserX,
} from "lucide-react";
import { FormEvent, useState } from "react";

import { unwrapList, usersApi } from "../api/services";
import type { User } from "../api/types";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Field, inputClass, Panel } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { playTone } from "../utils/sound";
import { useAuth } from "../context/AuthContext";

const roles = [
  "CITIZEN",
  "ENGINEER",
  "NGO",
  "ADMIN",
  "SUPER_ADMIN",
  "WARD_OFFICER",
  "MUNICIPAL_OFFICER",
  "DISTRICT_OFFICER",
  "PROVINCE_OFFICER",
];

const statuses = ["", "ACTIVE", "PENDING", "SUSPENDED", "LOCKED", "DISABLED", "REJECTED"];

export function UsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const users = useAsync(() => usersApi.list({ limit: 50, search, status, role }), [refresh, search, status, role]);
  const rows = users.data ? unwrapList<User>(users.data) : [];
  const isSuperAdmin = String(user?.role ?? "") === "SUPER_ADMIN";

  function submit(event: FormEvent) {
    event.preventDefault();
    setRefresh((value) => value + 1);
  }

  async function run(id: string | undefined, action: string, body: Record<string, unknown> = {}) {
    if (!id) return;
    setMessage("");
    try {
      await usersApi.action(id, action, { reason: "Updated by RRIMS identity console", ...body });
      playTone("success");
      setMessage(`${action} completed successfully.`);
      setRefresh((value) => value + 1);
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "User action failed.");
    }
  }

  async function deleteUser(row: User) {
    if (!row.id) return;
    setMessage("");
    try {
      await usersApi.remove(row.id, "Moved to trash by super admin from RRIMS identity console");
      playTone("success");
      setMessage("User moved to trash. Audit history is preserved and recovery is governed by the 24-hour trash policy.");
      setRefresh((value) => value + 1);
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "User delete failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="Identity & Access Console"
        eyebrow="Users, roles, account state, and security controls"
        action={<Button onClick={() => setShowCreate((value) => !value)}><Plus className="h-4 w-4" />Create user</Button>}
      />

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <Summary label="Total loaded" value={rows.length} />
        <Summary label="Suspended" value={rows.filter((row) => String(row.status ?? "").toUpperCase() === "SUSPENDED").length} />
        <Summary label="Locked" value={rows.filter((row) => String(row.status ?? "").toUpperCase() === "LOCKED").length} />
        <Summary label="Pending" value={rows.filter((row) => String(row.status ?? "").toUpperCase() === "PENDING").length} />
      </div>

      {showCreate ? <CreateUserForm onCreated={() => { setShowCreate(false); setRefresh((value) => value + 1); }} /> : null}

      <Panel className="mb-5">
        <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-10`} placeholder="Search name, username, email, or phone" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => <option key={item} value={item}>{item || "All statuses"}</option>)}
          </select>
          <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="">All roles</option>
            {roles.map((item) => <option key={item}>{item}</option>)}
          </select>
          <Button variant="secondary">Apply</Button>
        </form>
        {message ? <p className="mt-3 rounded-md bg-civic-50 p-3 text-sm font-semibold text-civic-800">{message}</p> : null}
      </Panel>

      <DataTable
        rows={rows}
        loading={users.loading}
        emptyTitle={users.error ? "Users unavailable for this role" : "No users found"}
        columns={[
          { header: "User", cell: (row) => <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-civic-50 text-civic-700"><UserCog className="h-4 w-4" /></div><div><p className="font-bold text-ink-900">{row.fullName}</p><p className="text-xs text-ink-500">{row.username} | {row.email ?? row.phone}</p></div></div> },
          { header: "Role", cell: (row) => <Badge value={row.role} /> },
          { header: "Status", cell: (row) => <Badge value={String(row.status ?? "ACTIVE")} /> },
          { header: "Verified", cell: (row) => row.isEmailVerified || row.isPhoneVerified ? <Badge value="VERIFIED" /> : <Badge value="PENDING" /> },
          { header: "Profile", cell: (row) => `${row.profileCompleteness?.percentage ?? 0}%` },
          { header: "Controls", cell: (row) => (
            <div className="flex min-w-[360px] flex-wrap gap-2">
              <Button variant="secondary" onClick={() => run(row.id, "approve")}><CheckCircle2 className="h-4 w-4" />Approve</Button>
              <Button variant="secondary" onClick={() => run(row.id, "activate")}>Activate</Button>
              <Button variant="secondary" onClick={() => run(row.id, "suspend", { suspendedUntil: new Date(Date.now() + 7 * 86400000).toISOString() })}><UserX className="h-4 w-4" />Suspend</Button>
              <Button variant="secondary" onClick={() => run(row.id, "reactivate")}><RotateCcw className="h-4 w-4" />Reactivate</Button>
              <Button variant="secondary" onClick={() => run(row.id, "lock", { lockedUntil: new Date(Date.now() + 24 * 3600000).toISOString() })}><Lock className="h-4 w-4" />Lock</Button>
              <Button variant="secondary" onClick={() => run(row.id, "unlock")}>Unlock</Button>
              <Button variant="secondary" onClick={() => run(row.id, "verify-email")}><ShieldCheck className="h-4 w-4" />Email</Button>
              <Button variant="secondary" onClick={() => run(row.id, "verify-phone")}>Phone</Button>
              <Button variant="secondary" onClick={() => run(row.id, "reset-mfa", { revokeTrustedDevices: true })}><KeyRound className="h-4 w-4" />MFA</Button>
              <Button variant="secondary" onClick={() => run(row.id, "revoke-sessions", { scope: "ALL" })}>Sessions</Button>
              {isSuperAdmin && row.id !== user?.id ? (
                <Button variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 className="h-4 w-4" />Delete</Button>
              ) : null}
            </div>
          ) },
        ]}
      />
      {deleteTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <Panel className="max-w-lg">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-red-700">Move to trash</p>
            <h2 className="mt-2 text-2xl font-black text-ink-900">
              Delete {deleteTarget.fullName || deleteTarget.username || deleteTarget.id}?
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-600">
              This disables the account, revokes sessions, preserves audit history, and follows the 24-hour RRIMS trash recovery policy.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                const target = deleteTarget;
                setDeleteTarget(null);
                await deleteUser(target);
              }}>
                <Trash2 className="h-4 w-4" />Move to trash
              </Button>
            </div>
          </Panel>
        </div>
      ) : null}
    </>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    email: "",
    role: "ENGINEER",
    status: "ACTIVE",
    password: "",
    confirmPassword: "",
    isPhoneVerified: true,
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await usersApi.create(form);
      playTone("success");
      onCreated();
    } catch (error) {
      playTone("error");
      setMessage(error instanceof Error ? error.message : "Could not create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mb-5">
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
        <Field label="Full name"><input className={inputClass} required minLength={3} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></Field>
        <Field label="Username"><input className={inputClass} required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></Field>
        <Field label="Phone"><input className={inputClass} required placeholder="98XXXXXXXX" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <Field label="Email"><input className={inputClass} required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
        <Field label="Role"><select className={inputClass} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{roles.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Status"><select className={inputClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.filter(Boolean).map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Password"><input className={inputClass} required type="password" minLength={12} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Field>
        <Field label="Confirm password"><input className={inputClass} required type="password" minLength={12} value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></Field>
        <div className="flex items-end">
          <Button loading={loading}>Create identity</Button>
        </div>
      </form>
      {message ? <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p> : null}
    </Panel>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink-900">{value}</p>
    </Panel>
  );
}
