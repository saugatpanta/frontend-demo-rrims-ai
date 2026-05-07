import { api, Paginated, setApiTokens } from "./client";
import type { DashboardStats, Report, SelectOption, User, WorkOrder } from "./types";

type LoginResponse = {
  user?: User;
  accessToken?: string;
  auth?: { accessToken?: string; csrf?: { token?: string } };
  token?: { accessToken?: string };
  session?: { csrf?: { token?: string } };
  security?: { csrf?: { token?: string } };
};

function extractItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    return ((value as { items?: T[] }).items ?? []) as T[];
  }
  return [];
}

export const authApi = {
  async login(identifier: string, password: string) {
    const data = await api<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ identifier, password }),
    });
    const accessToken =
      data.accessToken ?? data.auth?.accessToken ?? data.token?.accessToken ?? "";
    const csrfToken =
      data.security?.csrf?.token ?? data.session?.csrf?.token ?? data.auth?.csrf?.token ?? "";
    setApiTokens({ accessToken, csrfToken });
    return { user: data.user, accessToken, csrfToken, raw: data };
  },
  async me() {
    return api<User>("/auth/me");
  },
  async csrf() {
    const data = await api<{ token?: string; csrfToken?: string }>("/csrf", { skipAuth: true });
    setApiTokens({ csrfToken: data.token ?? data.csrfToken ?? "" });
    return data;
  },
  async logout() {
    await api("/auth/logout", { method: "POST" });
    setApiTokens({ accessToken: "", csrfToken: "" });
  },
};

export const publicApi = {
  summary: () => api<Record<string, unknown>>("/public-portal/summary", { skipAuth: true }),
  statistics: () => api<Record<string, unknown>>("/public-portal/statistics", { skipAuth: true }),
  trends: () => api<unknown[]>("/public-portal/trends", { skipAuth: true }),
  reports: () => api<Report[] | Paginated<Report>>("/public-portal/reports", { skipAuth: true }),
  categories: () => api<SelectOption[]>("/public-portal/categories", { skipAuth: true }),
  geography: () => api<unknown>("/public-portal/geography", { skipAuth: true }),
};

export const dashboardApi = {
  summary: () => api<DashboardStats>("/dashboard/summary"),
  stats: () => api<DashboardStats>("/dashboard/stats"),
  trends: () => api<unknown[]>("/dashboard/trends"),
  activity: () => api<unknown[]>("/dashboard/activity"),
};

export const reportsApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    api<Paginated<Report> | Report[]>("/reports", { query }),
  get: (id: string) => api<Report>(`/reports/${id}`),
  create: (body: Record<string, unknown>) =>
    api<Report>("/reports", { method: "POST", body: JSON.stringify(body) }),
  updateStatus: (id: string, status: string, note?: string) =>
    api<Report>(`/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note }),
    }),
  timeline: (id: string) => api<unknown[]>(`/reports/${id}/timeline`),
};

export const workOrdersApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    api<Paginated<WorkOrder> | WorkOrder[]>("/work-orders", { query }),
  start: (id: string, note?: string) =>
    api(`/work-orders/${id}/start`, { method: "POST", body: JSON.stringify({ note }) }),
  complete: (id: string, note?: string) =>
    api(`/work-orders/${id}/complete`, { method: "POST", body: JSON.stringify({ note }) }),
  progress: (id: string, progress: number, note?: string) =>
    api(`/work-orders/${id}/progress`, {
      method: "POST",
      body: JSON.stringify({ progress, note }),
    }),
};

export const usersApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    api<Paginated<User> | User[]>("/users", { query }),
};

export const geographyApi = {
  provinces: () => api<SelectOption[]>("/geography/provinces"),
  districts: (provinceId?: string) =>
    api<SelectOption[]>("/geography/districts", { query: { provinceId } }),
  localGovernments: (districtId?: string) =>
    api<SelectOption[]>("/geography/local-governments", { query: { districtId } }),
  wards: (localGovernmentId?: string) =>
    api<SelectOption[]>("/geography/wards", { query: { localGovernmentId } }),
  categories: () => api<SelectOption[]>("/geography/categories"),
};

export function unwrapList<T>(value: T[] | Paginated<T> | unknown): T[] {
  return extractItems<T>(value);
}

export type GenericRecord = Record<string, unknown> & { id?: string };

export const moduleApi = {
  list: <T = GenericRecord>(path: string, query?: Record<string, string | number | undefined>) =>
    api<Paginated<T> | T[]>(path, { query }),
  get: <T = GenericRecord>(path: string) => api<T>(path),
  post: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  remove: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
