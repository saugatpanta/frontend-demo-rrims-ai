export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "CITIZEN"
  | "ENGINEER"
  | "NGO"
  | "WARD_OFFICER"
  | "MUNICIPAL_OFFICER"
  | "DISTRICT_OFFICER"
  | "PROVINCE_OFFICER";

export type User = {
  id?: string;
  fullName: string;
  username: string;
  phone: string;
  email?: string | null;
  role: Role | string;
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

export type DashboardStats = Record<string, number | string | null | undefined> & {
  totalReports?: number;
  openReports?: number;
  resolvedReports?: number;
  overdueWorkOrders?: number;
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
