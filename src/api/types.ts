export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CITIZEN"
  | "ENGINEER"
  | "NGO"
  | "FEDERAL_ADMIN"
  | "PROVINCIAL_ADMIN"
  | "LOCAL_GOVERNMENT_ADMIN"
  | "WARD_OFFICE_USER"
  | "DISTRICT_OFFICER"
  | "WARD_OFFICER"
  | "MUNICIPAL_OFFICER"
  | "PROVINCE_OFFICER";

export type User = {
  id?: string;
  fullName: string;
  username: string;
  phone: string;
  email?: string | null;
  role: Role | string;
  status?: string;
  permissions?: string[];
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  profileCompleteness?: {
    percentage: number;
    completed: boolean;
    missingFields: string[];
  };
  geography?: Record<string, string | number | null | undefined>;
};

export type Report = {
  id: string;
  code?: string;
  trackingCode?: string;
  title: string;
  description?: string;
  status: string;
  severity?: string;
  priority?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: { name?: string };
  categoryName?: string;
  district?: string;
  localGovernment?: string;
  wardNumber?: number;
  assignedEngineer?: { fullName?: string };
  reporter?: { fullName?: string; phone?: string };
};

export type WorkOrder = {
  id: string;
  code?: string;
  title?: string;
  status: string;
  priority?: string;
  progress?: number;
  dueAt?: string;
  createdAt?: string;
  report?: Report;
  engineer?: { fullName?: string };
};

export type DashboardStats = Record<string, unknown> & {
  totalReports?: number;
  openReports?: number;
  resolvedReports?: number;
  overdueWorkOrders?: number;
  dashboardType?: string;
  persona?: {
    role?: string;
    fullName?: string;
    status?: string;
    specialization?: string | null;
  };
  scope?: {
    visibility?: string;
    configured?: boolean;
    label?: string;
    description?: string;
    geography?: Record<string, string | number | null | undefined>;
  };
  totals?: {
    reports?: number;
    resolvedReports?: number;
    openReports?: number;
    urgentReports?: number;
    workOrders?: number;
    completedWorkOrders?: number;
    activeWorkOrders?: number;
    overdueWorkOrders?: number;
  };
  overview?: {
    unreadNotifications?: number;
    totalConversations?: number;
    unreadConversations?: number;
    activeCalls?: number;
    activeSessions?: number;
    profileCompletionScore?: number;
    resolutionRate?: number;
    workOrderCompletionRate?: number;
  };
  queues?: {
    triageReports?: number;
    verificationQueue?: number;
    assignmentQueue?: number;
    activeFieldWork?: number;
    overdueWorkOrders?: number;
  };
  kpis?: Record<string, number | string | null | undefined>;
  population?: {
    totalUsersInScope?: number;
    activeUsersInScope?: number;
    engineersInScope?: number;
    citizensInScope?: number;
    roleBreakdown?: Array<{ role?: string; count?: number }>;
  } | null;
  workload?: {
    myAssignments?: { active?: number; completedLast7Days?: number } | null;
    topEngineers?: Array<{ engineerId?: string | null; fullName?: string; username?: string | null; activeAssignments?: number }>;
  };
  workspace?: {
    mission?: string;
    capabilities?: string[];
    process?: string[];
    queue?: Record<string, number | string | null | undefined>;
    oversight?: Record<string, number | string | null | undefined> | null;
    recentAssignments?: WorkOrder[];
  };
  profile?: User & { specialization?: string | null };
  reportStatusBreakdown?: Array<{ status?: string; count?: number }>;
  workOrderStatusBreakdown?: Array<{ status?: string; count?: number }>;
  priorityBreakdown?: Array<{ priority?: string; count?: number }>;
  hotspots?: Array<{ name?: string; count?: number }>;
  recentReports?: Report[];
  recentWorkOrders?: WorkOrder[];
  recentNotifications?: Array<{ id?: string; title?: string; message?: string; readAt?: string | null; createdAt?: string }>;
  recentConversations?: Array<{ id?: string; subject?: string | null; type?: string; lastMessageAt?: string | null }>;
  quickActions?: string[];
  warnings?: string[];
};

export type SelectOption = {
  id?: string;
  code?: string;
  name: string;
  provinceId?: string;
  districtId?: string;
  localGovernmentId?: string;
  number?: number;
};
