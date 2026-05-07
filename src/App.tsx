import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { AppLayout } from "./layouts/AppLayout";
import { useAuth } from "./context/AuthContext";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ApiKeysPage, AuditPage, NotificationsPage, SupportPage } from "./pages/AdminModulesPage";
import { CallsPage, ChatPage } from "./pages/CommunicationsPage";
import { CasesPage, MediaPage, WorkflowPage } from "./pages/CaseMediaPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GeographyPage } from "./pages/GeographyPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicPortalPage } from "./pages/PublicPortalPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { WorkOrdersPage } from "./pages/WorkOrdersPage";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-100 text-ink-700">Loading RRIMS...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicPortalPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<Protected><DashboardPage /></Protected>} />
      <Route path="/app/reports" element={<Protected><ReportsPage /></Protected>} />
      <Route path="/app/work-orders" element={<Protected><WorkOrdersPage /></Protected>} />
      <Route path="/app/workflow" element={<Protected><WorkflowPage /></Protected>} />
      <Route path="/app/cases" element={<Protected><CasesPage /></Protected>} />
      <Route path="/app/chat" element={<Protected><ChatPage /></Protected>} />
      <Route path="/app/calls" element={<Protected><CallsPage /></Protected>} />
      <Route path="/app/notifications" element={<Protected><NotificationsPage /></Protected>} />
      <Route path="/app/analytics" element={<Protected><AnalyticsPage /></Protected>} />
      <Route path="/app/users" element={<Protected><UsersPage /></Protected>} />
      <Route path="/app/audit" element={<Protected><AuditPage /></Protected>} />
      <Route path="/app/api-keys" element={<Protected><ApiKeysPage /></Protected>} />
      <Route path="/app/media" element={<Protected><MediaPage /></Protected>} />
      <Route path="/app/support" element={<Protected><SupportPage /></Protected>} />
      <Route path="/app/geography" element={<Protected><GeographyPage /></Protected>} />
      <Route path="/app/profile" element={<Protected><ProfilePage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
