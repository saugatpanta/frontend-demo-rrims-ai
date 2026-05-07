import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { AppLayout } from "./layouts/AppLayout";
import { useAuth } from "./context/AuthContext";
import { canAccess, routeAccess, type AccessRule } from "./auth/access";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ApiKeysPage, AuditPage, NotificationsPage, SupportPage } from "./pages/AdminModulesPage";
import { ApiHubPage } from "./pages/ApiHubPage";
import { CallsPage, ChatPage } from "./pages/CommunicationsPage";
import { CasesPage, MediaPage, WorkflowPage } from "./pages/CaseMediaPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GeographyPage } from "./pages/GeographyPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminsPage, FilesPage, OutboxPage, SlasPage, WebhooksPage, WorkersPage } from "./pages/MoreModulesPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicPortalPage } from "./pages/PublicPortalPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";
import { Button, Panel } from "./components/ui";

function Protected({ children, access }: { children: ReactNode; access?: AccessRule }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-100 text-ink-700">Loading RRIMS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(user, access)) {
    return (
      <AppLayout>
        <AccessDenied />
      </AppLayout>
    );
  }
  return <AppLayout>{children}</AppLayout>;
}

function AccessDenied() {
  return (
    <Panel className="mx-auto max-w-3xl p-8">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-red-700">Access restricted</p>
      <h1 className="mt-2 text-3xl font-black text-ink-900">You do not have permission to open this module.</h1>
      <p className="mt-3 leading-7 text-ink-500">
        RRIMS protects modules by role and permission. If you believe this is incorrect,
        ask an administrator to review your role, office level, and granted permissions.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => history.back()} variant="secondary">Go back</Button>
        <Button onClick={() => location.assign("/app/profile")}>View profile</Button>
      </div>
    </Panel>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPortalPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/app" element={<Protected access={routeAccess.dashboard}><DashboardPage /></Protected>} />
      <Route path="/app/reports" element={<Protected access={routeAccess.reports}><ReportsPage /></Protected>} />
      <Route path="/app/work-orders" element={<Protected access={routeAccess.workOrders}><WorkOrdersPage /></Protected>} />
      <Route path="/app/workflow" element={<Protected access={routeAccess.workflow}><WorkflowPage /></Protected>} />
      <Route path="/app/cases" element={<Protected access={routeAccess.cases}><CasesPage /></Protected>} />
      <Route path="/app/chat" element={<Protected access={routeAccess.chat}><ChatPage /></Protected>} />
      <Route path="/app/calls" element={<Protected access={routeAccess.calls}><CallsPage /></Protected>} />
      <Route path="/app/notifications" element={<Protected access={routeAccess.notifications}><NotificationsPage /></Protected>} />
      <Route path="/app/analytics" element={<Protected access={routeAccess.analytics}><AnalyticsPage /></Protected>} />
      <Route path="/app/users" element={<Protected access={routeAccess.users}><UsersPage /></Protected>} />
      <Route path="/app/audit" element={<Protected access={routeAccess.audit}><AuditPage /></Protected>} />
      <Route path="/app/api-keys" element={<Protected access={routeAccess.apiKeys}><ApiKeysPage /></Protected>} />
      <Route path="/app/media" element={<Protected access={routeAccess.media}><MediaPage /></Protected>} />
      <Route path="/app/files" element={<Protected access={routeAccess.files}><FilesPage /></Protected>} />
      <Route path="/app/admins" element={<Protected access={routeAccess.admins}><AdminsPage /></Protected>} />
      <Route path="/app/slas" element={<Protected access={routeAccess.slas}><SlasPage /></Protected>} />
      <Route path="/app/webhooks" element={<Protected access={routeAccess.webhooks}><WebhooksPage /></Protected>} />
      <Route path="/app/outbox" element={<Protected access={routeAccess.outbox}><OutboxPage /></Protected>} />
      <Route path="/app/workers" element={<Protected access={routeAccess.workers}><WorkersPage /></Protected>} />
      <Route path="/app/api-hub" element={<Protected access={routeAccess.apiHub}><ApiHubPage /></Protected>} />
      <Route path="/app/support" element={<Protected access={routeAccess.support}><SupportPage /></Protected>} />
      <Route path="/app/settings" element={<Protected access={routeAccess.settings}><SettingsPage /></Protected>} />
      <Route path="/app/geography" element={<Protected access={routeAccess.geography}><GeographyPage /></Protected>} />
      <Route path="/app/profile" element={<Protected access={routeAccess.profile}><ProfilePage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
