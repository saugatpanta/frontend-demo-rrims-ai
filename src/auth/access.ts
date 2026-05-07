import type { User } from "../api/types";

export type AccessRule = {
  roles?: readonly string[];
  permissions?: readonly string[];
};

export const governmentRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "WARD_OFFICER",
  "MUNICIPAL_OFFICER",
  "DISTRICT_OFFICER",
  "PROVINCE_OFFICER",
] as const;

export const managementRoles = ["SUPER_ADMIN", "ADMIN"] as const;

export function canAccess(user: User | null, rule?: AccessRule) {
  if (!user) return false;
  if (!rule?.roles?.length && !rule?.permissions?.length) return true;

  const role = String(user.role ?? "");
  if (role === "SUPER_ADMIN") return true;

  const permissions = new Set(user.permissions ?? []);
  const hasRole = rule.roles?.includes(role) ?? false;
  const hasPermission =
    rule.permissions?.some((permission) => permissions.has(permission)) ?? false;

  return hasRole || hasPermission;
}

export const routeAccess = {
  dashboard: { permissions: ["dashboard.read"] },
  reports: {},
  workOrders: { roles: ["ENGINEER", "NGO", ...governmentRoles] },
  workflow: { roles: ["ENGINEER", "NGO", ...governmentRoles] },
  cases: { roles: [...governmentRoles] },
  media: { roles: ["ENGINEER", "NGO", ...governmentRoles] },
  files: { roles: [...managementRoles] },
  chat: {},
  calls: {},
  notifications: {},
  analytics: { roles: [...governmentRoles] },
  geography: {},
  users: { roles: [...managementRoles] },
  audit: { roles: [...managementRoles] },
  apiKeys: { permissions: ["api_keys.read"] },
  admins: { roles: ["ADMIN"] },
  slas: { roles: [...governmentRoles] },
  webhooks: { roles: [...managementRoles] },
  outbox: { permissions: ["outbox.events.read", "outbox.dlq.read"] },
  workers: { permissions: ["workers.read"] },
  apiHub: { roles: ["SUPER_ADMIN"] },
  support: {},
  profile: {},
} satisfies Record<string, AccessRule>;
