import { api, Paginated, setApiTokens } from "./client";
import type { DashboardStats, Report, SelectOption, User, WorkOrder } from "./types";

type LoginResponse = {
  user?: User;
  accessToken?: string;
  auth?: { accessToken?: string; csrf?: { token?: string } };
  token?: { accessToken?: string };
  tokens?: {
    accessToken?: string;
    tokenType?: string;
    expiresAt?: string | null;
    expiresInSeconds?: number;
  };
  session?: { csrf?: { token?: string } };
  security?: { csrf?: { token?: string } };
  verificationRequired?: boolean;
};

function extractItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "items" in value) {
    return ((value as { items?: T[] }).items ?? []) as T[];
  }
  return [];
}

export const authApi = {
  async login(identity: string, password: string) {
    const data = await api<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        identity,
        password,
        deviceFingerprint: getDeviceFingerprint(),
      }),
    });
    const accessToken =
      data.tokens?.accessToken ??
      data.accessToken ??
      data.auth?.accessToken ??
      data.token?.accessToken ??
      "";
    const csrfToken =
      data.security?.csrf?.token ?? data.session?.csrf?.token ?? data.auth?.csrf?.token ?? "";
    if (!accessToken) {
      throw new Error(
        data.verificationRequired
          ? "Account verification is required before access is granted."
          : "Login succeeded but the backend did not return an access token.",
      );
    }
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
  sessions: () => api<unknown[]>("/auth/sessions"),
  revokeSession: (sessionId: string) => api(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
  changePassword: (body: Record<string, unknown>) =>
    api("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (email: string) =>
    api<Record<string, unknown>>("/auth/forgot-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email }),
    }),
  validateResetToken: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/auth/validate-reset-token", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(body),
    }),
  resetPassword: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/auth/reset-password", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(body),
    }),
  mfaStatus: () => api<Record<string, unknown>>("/auth/mfa/status"),
  enableMfa: (password: string) =>
    api<Record<string, unknown>>("/auth/mfa/enable", { method: "POST", body: JSON.stringify({ password }) }),
  verifyMfa: (enrollmentId: string, code: string) =>
    api<Record<string, unknown>>("/auth/mfa/verify", { method: "POST", body: JSON.stringify({ enrollmentId, code }) }),
  disableMfa: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/auth/mfa/disable", { method: "POST", body: JSON.stringify(body) }),
  regenerateRecoveryCodes: (body: Record<string, unknown>) =>
    api<Record<string, unknown>>("/auth/mfa/recovery-codes/regenerate", { method: "POST", body: JSON.stringify(body) }),
  async register(body: Record<string, unknown>) {
    return api<LoginResponse>("/auth/register", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify(body),
    });
  },
};

export const settingsApi = {
  notificationPreferences: () => api<Record<string, unknown>>("/notification-preferences"),
  updateNotificationPreferences: (preferences: Array<Record<string, unknown>>) =>
    api<Record<string, unknown>>("/notification-preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferences }),
    }),
  systemSettings: () => api<Record<string, unknown>>("/system-settings"),
  featureFlags: () => api<Record<string, unknown>>("/feature-flags"),
};

export const notificationsApi = {
  pushPublicKey: () => api<{ enabled?: boolean; publicKey?: string }>("/notifications/push/public-key"),
  savePushSubscription: (subscription: PushSubscriptionJSON) =>
    api<Record<string, unknown>>("/notifications/push/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription),
    }),
  removePushSubscription: (endpoint: string) =>
    api<Record<string, unknown>>("/notifications/push/subscriptions", {
      method: "DELETE",
      body: JSON.stringify({ endpoint }),
    }),
};

function getDeviceFingerprint() {
  const key = "rrims.deviceFingerprint";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = `web-${crypto.randomUUID()}-${navigator.userAgent.slice(0, 48)}`;
  localStorage.setItem(key, generated);
  return generated;
}

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
  communications: (id: string) =>
    api<Record<string, unknown>>(`/work-orders/${id}/communications`),
  ensureCommunication: (id: string, initialMessage?: string) =>
    api<Record<string, unknown>>(`/work-orders/${id}/communications`, {
      method: "POST",
      body: JSON.stringify({ initialMessage }),
    }),
  start: (id: string, note?: string) =>
    api(`/work-orders/${id}/start`, { method: "POST", body: JSON.stringify({ note }) }),
  complete: (id: string, note?: string) =>
    api(`/work-orders/${id}/complete`, { method: "POST", body: JSON.stringify({ resolutionNotes: note ?? "Completed from RRIMS frontend" }) }),
  progress: (id: string, progress: number, note?: string) =>
    api(`/work-orders/${id}/progress`, {
      method: "POST",
      body: JSON.stringify({ percentComplete: progress, note: note ?? "Progress updated from RRIMS frontend", blocked: false }),
    }),
};

export const chatApi = {
  messages: (conversationId: string, query?: Record<string, string | number | undefined>) =>
    api<Paginated<GenericRecord> | GenericRecord[]>(`/chat/conversations/${conversationId}/messages`, { query }),
  sendMessage: (conversationId: string, body: Record<string, unknown>) =>
    api<GenericRecord>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addAttachment: (conversationId: string, body: Record<string, unknown>) =>
    api<GenericRecord>(`/chat/conversations/${conversationId}/attachments`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const callsApi = {
  create: (conversationId: string, type: "VOICE" | "VIDEO" = "VOICE") =>
    api<GenericRecord>("/calls", {
      method: "POST",
      body: JSON.stringify({ conversationId, type }),
    }),
  ring: (callId: string, reason = "Ring from RRIMS frontend") =>
    api<GenericRecord>(`/calls/${callId}/ring`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  answer: (callId: string) =>
    api<GenericRecord>(`/calls/${callId}/answer`, { method: "POST", body: JSON.stringify({}) }),
  join: (callId: string) =>
    api<GenericRecord>(`/calls/${callId}/join`, { method: "POST", body: JSON.stringify({}) }),
  twilioToken: (callId: string) =>
    api<GenericRecord>(`/calls/${callId}/twilio-token`, { method: "POST", body: JSON.stringify({}) }),
  end: (callId: string, reason = "Ended from RRIMS frontend") =>
    api<GenericRecord>(`/calls/${callId}/end`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

export const usersApi = {
  list: (query?: Record<string, string | number | undefined>) =>
    api<Paginated<User> | User[]>("/users", { query }),
  create: (body: Record<string, unknown>) =>
    api<User>("/users", { method: "POST", body: JSON.stringify(body) }),
  action: (id: string, action: string, body: Record<string, unknown>) =>
    api<User>(`/users/${id}/${action}`, { method: "POST", body: JSON.stringify(body) }),
  patch: (id: string, body: Record<string, unknown>) =>
    api<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string, reason: string) =>
    api<User>(`/users/${id}`, { method: "DELETE", body: JSON.stringify({ reason }) }),
};

export const profileApi = {
  get: () => api<User & Record<string, unknown>>("/profile"),
  activity: () => api<unknown[]>("/profile/activity"),
  update: (body: Record<string, unknown>) =>
    api<User & Record<string, unknown>>("/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
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
  list: <T = GenericRecord>(path: string, query?: Record<string, string | number | boolean | undefined>) =>
    api<Paginated<T> | T[]>(path, { query }),
  get: <T = GenericRecord>(path: string) => api<T>(path),
  post: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  remove: <T = GenericRecord>(path: string, body?: Record<string, unknown>) =>
    api<T>(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
