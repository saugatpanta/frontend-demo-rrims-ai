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
  ServerCog,
  ShieldAlert,
  Shield,
  Siren,
  Users,
  X,
} from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";

const navItems = [
  { group: "Command", to: "/app", label: "Dashboard", icon: Home },
  { group: "Command", to: "/app/reports", label: "Reports", icon: FileText },
  { group: "Command", to: "/app/work-orders", label: "Work Orders", icon: BriefcaseBusiness },
  { group: "Command", to: "/app/workflow", label: "Workflow", icon: Activity },
  { group: "Command", to: "/app/cases", label: "Cases", icon: BriefcaseBusiness },
  { group: "Evidence", to: "/app/media", label: "Media", icon: Image },
  { group: "Evidence", to: "/app/files", label: "Files", icon: FileText },
  { group: "Communications", to: "/app/chat", label: "Chat", icon: MessageSquare },
  { group: "Communications", to: "/app/calls", label: "Calls", icon: PhoneCall },
  { group: "Communications", to: "/app/notifications", label: "Notifications", icon: Bell },
  { group: "Intelligence", to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { group: "Intelligence", to: "/app/geography", label: "Geography", icon: Map },
  { group: "Governance", to: "/app/users", label: "Users", icon: Users },
  { group: "Governance", to: "/app/audit", label: "Audit", icon: ShieldAlert },
  { group: "Governance", to: "/app/api-keys", label: "API Keys", icon: KeyRound },
  { group: "Governance", to: "/app/admins", label: "Admins", icon: Users },
  { group: "Operations", to: "/app/slas", label: "SLAs", icon: Clock3 },
  { group: "Operations", to: "/app/webhooks", label: "Webhooks", icon: Cable },
  { group: "Operations", to: "/app/outbox", label: "Outbox", icon: CircuitBoard },
  { group: "Operations", to: "/app/workers", label: "Workers", icon: ServerCog },
  { group: "Operations", to: "/app/api-hub", label: "API Hub", icon: Activity },
  { group: "Account", to: "/app/support", label: "Support", icon: LifeBuoy },
  { group: "Account", to: "/app/profile", label: "Profile", icon: Shield },
];

export function AppLayout({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-80 border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-lg border border-white/15 bg-white text-civic-700">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black leading-tight">RRIMS</p>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-civic-100">Government Command</p>
              </div>
            </div>
            <button className="rounded-md p-2 text-white/80 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-civic-400/20 bg-civic-400/10 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-civic-100">Operational status</p>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_0_4px_rgba(74,222,128,0.15)]" />
              Production API connected
            </div>
          </div>
        </div>

        <nav className="h-[calc(100vh-9.7rem)] overflow-y-auto px-3 py-4">
          {Array.from(new Set(navItems.map((item) => item.group))).map((group) => (
            <div key={group} className="mb-4">
              <p className="mb-1.5 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{group}</p>
              <div className="space-y-1">
                {navItems.filter((item) => item.group === group).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/app"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
                        isActive
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-300 hover:bg-white/10 hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-80">
        <div className="bg-slate-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-300 lg:px-8">
          Government operational platform | Authorized personnel only | Audited session
        </div>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
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
            <Button variant="danger" onClick={() => navigate("/app/reports")}>
              <Siren className="h-4 w-4" />
              Incident
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-900">{user?.fullName ?? user?.username ?? "Operator"}</p>
              <p className="text-xs text-ink-500">{user?.role ?? "Authenticated"}</p>
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
    </div>
  );
}
