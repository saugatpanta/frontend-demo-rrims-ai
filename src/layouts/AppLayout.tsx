import clsx from "clsx";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  Bell,
  Cable,
  CircuitBoard,
  Clock3,
  FileText,
  Home,
  Image,
  KeyRound,
  LifeBuoy,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  PhoneCall,
  Search,
  ServerCog,
  Settings,
  ShieldAlert,
  Shield,
  Siren,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { Avatar, Button } from "../components/ui";
import { canAccess, governmentRoles, managementRoles, type AccessRule } from "../auth/access";
import type { User } from "../api/types";

type NavItem = {
  group: string;
  to: string;
  label: string;
  icon: typeof Home;
} & AccessRule;

const navItems: NavItem[] = [
  { group: "Command", to: "/app", label: "Dashboard", icon: Home, permissions: ["dashboard.read"] },
  { group: "Command", to: "/app/reports", label: "Reports", icon: FileText },
  { group: "Command", to: "/app/work-orders", label: "Work Orders", icon: BriefcaseBusiness, roles: ["ENGINEER", "NGO", ...governmentRoles] },
  { group: "Command", to: "/app/workflow", label: "Workflow", icon: Activity, roles: ["ENGINEER", "NGO", ...governmentRoles] },
  { group: "Command", to: "/app/cases", label: "Cases", icon: BriefcaseBusiness, roles: governmentRoles },
  { group: "Evidence", to: "/app/media", label: "Media", icon: Image, roles: ["ENGINEER", "NGO", ...governmentRoles] },
  { group: "Evidence", to: "/app/files", label: "Files", icon: FileText, roles: managementRoles },
  { group: "Communications", to: "/app/chat", label: "Chat", icon: MessageSquare },
  { group: "Communications", to: "/app/calls", label: "Calls", icon: PhoneCall },
  { group: "Communications", to: "/app/notifications", label: "Notifications", icon: Bell },
  { group: "Intelligence", to: "/app/analytics", label: "Analytics", icon: BarChart3, roles: governmentRoles },
  { group: "Intelligence", to: "/app/geography", label: "Geography", icon: Map },
  { group: "Governance", to: "/app/users", label: "Users", icon: Users, roles: managementRoles },
  { group: "Governance", to: "/app/audit", label: "Audit", icon: ShieldAlert, roles: managementRoles },
  { group: "Governance", to: "/app/api-keys", label: "API Keys", icon: KeyRound, permissions: ["api_keys.read"] },
  { group: "Governance", to: "/app/admins", label: "Admins", icon: Users, roles: ["ADMIN"] },
  { group: "Operations", to: "/app/slas", label: "SLAs", icon: Clock3, roles: governmentRoles },
  { group: "Operations", to: "/app/webhooks", label: "Webhooks", icon: Cable, roles: managementRoles },
  { group: "Operations", to: "/app/outbox", label: "Outbox", icon: CircuitBoard, permissions: ["outbox.events.read", "outbox.dlq.read"] },
  { group: "Operations", to: "/app/workers", label: "Workers", icon: ServerCog, permissions: ["workers.read"] },
  { group: "Operations", to: "/app/api-hub", label: "API Hub", icon: Activity, roles: ["SUPER_ADMIN"] },
  { group: "Account", to: "/app/support", label: "Support", icon: LifeBuoy },
  { group: "Account", to: "/app/settings", label: "Settings", icon: Settings },
  { group: "Account", to: "/app/profile", label: "Profile", icon: Shield },
];

function canSeeNavItem(user: User | null, item: NavItem) {
  return canAccess(user, item);
}

export function AppLayout({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleNavItems = navItems.filter((item) => canSeeNavItem(user, item));
  const commandItems = useMemo(
    () =>
      visibleNavItems.filter((item) =>
        `${item.group} ${item.label}`.toLowerCase().includes(commandQuery.toLowerCase()),
      ),
    [visibleNavItems, commandQuery],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") setCommandOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-transparent">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-80 border-r border-white/10 bg-slate-950 text-white shadow-2xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#08111f,#0f172a_38%,#111827)]" />
        <div className="absolute inset-0 surface-grid opacity-[0.08]" />
        <div className="relative border-b border-white/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg border border-white/15 bg-white text-civic-700 shadow-[0_16px_34px_rgba(20,184,166,0.2)]">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black leading-tight">RRIMS</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-100">Response Intelligence</p>
              </div>
            </div>
            <button className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-civic-400/25 bg-white/[0.055] p-3 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-civic-100">Operational status</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_0_4px_rgba(74,222,128,0.15)]" />
                  Production API connected
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
          </div>
        </div>

        <nav className="relative h-[calc(100vh-9.7rem)] overflow-y-auto px-3 py-4">
          {Array.from(new Set(visibleNavItems.map((item) => item.group))).map((group) => (
            <div key={group} className="mb-4">
              <p className="mb-1.5 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{group}</p>
              <div className="space-y-1">
                {visibleNavItems.filter((item) => item.group === group).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition duration-200",
                        isActive
                          ? "bg-white text-slate-950 shadow-[0_10px_28px_rgba(15,23,42,0.26)]"
                          : "text-slate-300 hover:bg-white/10 hover:text-white",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={clsx("absolute left-0 h-6 w-1 rounded-r-full transition", isActive ? "bg-civic-500" : "bg-transparent group-hover:bg-white/30")} />
                        <span className={clsx("grid h-8 w-8 place-items-center rounded-md transition", isActive ? "bg-civic-50 text-civic-700" : "bg-white/[0.055] text-slate-300 group-hover:bg-white/10 group-hover:text-white")}>
                          <item.icon className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-80">
        <div className="bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 shadow-sm lg:px-8">
          Government operational platform | Authorized personnel only | Audited session
        </div>
        <header className="sticky top-0 z-20 border-b border-white/70 bg-white/[0.82] shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="hidden items-center gap-2 text-sm font-bold text-ink-900 sm:flex">
                <Activity className="h-4 w-4 text-civic-700" />
                National Incident Response Console
              </div>
              <p className="hidden text-xs font-medium text-ink-500 sm:block">Live API: pantasaugat.com.np | Environment: production</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setCommandOpen(true)}>
              <Search className="h-4 w-4" />
              Command
              <span className="hidden rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-black text-ink-500 sm:inline">Ctrl K</span>
            </Button>
            <Button variant="danger" onClick={() => navigate("/app/reports")}>
              <Siren className="h-4 w-4" />
              Incident
            </Button>
            <div className="hidden items-center gap-3 sm:flex">
              <Avatar userId={user?.id} name={user?.fullName ?? user?.username} size="md" />
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-900">{user?.fullName ?? user?.username ?? "Operator"}</p>
                <p className="text-xs text-ink-500">{user?.role ?? "Authenticated"}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1480px] p-4 lg:p-8">{children}</main>
      </div>
      {commandOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setCommandOpen(false)}>
          <div className="glass-surface mx-auto mt-20 max-w-2xl overflow-hidden rounded-lg border border-white/70 shadow-2xl ring-1 ring-slate-900/[0.04]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-slate-200/80 p-4">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-civic-700" />
                <input
                  autoFocus
                  className="h-11 flex-1 border-0 text-base font-semibold outline-none placeholder:text-slate-400"
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  placeholder="Search modules, actions, settings..."
                />
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {commandItems.map((item) => (
                <button
                  key={item.to}
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left hover:bg-civic-50"
                  onClick={() => {
                    navigate(item.to);
                    setCommandOpen(false);
                    setCommandQuery("");
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-civic-50 text-civic-700 ring-1 ring-civic-100">
                      <item.icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-ink-900">{item.label}</span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.13em] text-ink-500">{item.group}</span>
                    </span>
                  </span>
                  <span className="text-xs font-bold text-civic-700">Open</span>
                </button>
              ))}
              {!commandItems.length ? (
                <div className="p-8 text-center text-sm font-semibold text-ink-500">No matching module available for your role.</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
