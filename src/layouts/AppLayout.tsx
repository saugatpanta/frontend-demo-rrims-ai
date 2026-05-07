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
  Users,
  X,
} from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";

const navItems = [
  { to: "/app", label: "Dashboard", icon: Home },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/work-orders", label: "Work Orders", icon: BriefcaseBusiness },
  { to: "/app/workflow", label: "Workflow", icon: Activity },
  { to: "/app/cases", label: "Cases", icon: BriefcaseBusiness },
  { to: "/app/media", label: "Media", icon: Image },
  { to: "/app/files", label: "Files", icon: FileText },
  { to: "/app/chat", label: "Chat", icon: MessageSquare },
  { to: "/app/calls", label: "Calls", icon: PhoneCall },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/users", label: "Users", icon: Users },
  { to: "/app/audit", label: "Audit", icon: ShieldAlert },
  { to: "/app/api-keys", label: "API Keys", icon: KeyRound },
  { to: "/app/admins", label: "Admins", icon: Users },
  { to: "/app/slas", label: "SLAs", icon: Clock3 },
  { to: "/app/webhooks", label: "Webhooks", icon: Cable },
  { to: "/app/outbox", label: "Outbox", icon: CircuitBoard },
  { to: "/app/workers", label: "Workers", icon: ServerCog },
  { to: "/app/api-hub", label: "API Hub", icon: Activity },
  { to: "/app/support", label: "Support", icon: LifeBuoy },
  { to: "/app/geography", label: "Geography", icon: Map },
  { to: "/app/profile", label: "Profile", icon: Shield },
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
    <div className="min-h-screen bg-slate-100">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-lg font-black text-ink-900">RRIMS</p>
            <p className="text-xs font-medium text-ink-500">Command Center</p>
          </div>
          <button className="rounded-md p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition",
                  isActive ? "bg-civic-50 text-civic-700" : "text-ink-700 hover:bg-slate-100",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-md p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm font-medium text-ink-500 sm:flex">
              <Activity className="h-4 w-4 text-civic-700" />
              Live API: pantasaugat.com.np
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink-900">{user?.fullName ?? user?.username ?? "Operator"}</p>
              <p className="text-xs text-ink-500">{user?.role ?? "Authenticated"}</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
