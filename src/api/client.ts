const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "https://pantasaugat.com.np/api/v1"
).replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? "rrims_csrf";

export type ApiEnvelope<T> = {
  success: boolean;
  code: string;
  message: string;
  data: T;
  details?: unknown;
  meta?: Record<string, unknown>;
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, status: number, code = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const authFailureCodes = new Set([
  "UNAUTHORIZED",
  "ACCOUNT_DISABLED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_PENDING_VERIFICATION",
]);

export const authExpiredEvent = "rrims:auth-expired";

const ACCESS_TOKEN_STORAGE_KEY = "rrims.accessToken";
const CSRF_TOKEN_STORAGE_KEY = "rrims.csrfToken";

export function getApiTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "",
    csrfToken:
      getCookie(CSRF_COOKIE_NAME) ||
      localStorage.getItem(CSRF_TOKEN_STORAGE_KEY) ||
      "",
  };
}

export function setApiTokens(tokens: { accessToken?: string; csrfToken?: string }) {
  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  }

  if (tokens.csrfToken) {
    localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, tokens.csrfToken);
  }
}

export function clearApiAuth() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
  localStorage.removeItem("rrims.user");
}

function notifyAuthExpired(error: ApiError, skipAuth?: boolean) {
  if (skipAuth) return;
  if (error.status !== 401 && error.status !== 403 && error.status !== 423) return;
  if (!authFailureCodes.has(error.code)) return;

  clearApiAuth();
  window.dispatchEvent(
    new CustomEvent(authExpiredEvent, {
      detail: {
        code: error.code,
        message: error.message,
        status: error.status,
      },
    }),
  );
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function getCookie(name: string) {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  if (!match) return "";
  return decodeURIComponent(match.slice(prefix.length));
}

export function buildApiUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  return buildUrl(path, query);
}

export async function api<T>(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | boolean | undefined | null>;
    skipAuth?: boolean;
  } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && !(options.body instanceof FormData);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { accessToken, csrfToken } = getApiTokens();
  if (accessToken && !options.skipAuth && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (csrfToken && ["POST", "PATCH", "PUT", "DELETE"].includes((options.method ?? "GET").toUpperCase())) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const envelope = payload as Partial<ApiEnvelope<unknown>>;
    const error = new ApiError(
      envelope.message ?? response.statusText,
      response.status,
      envelope.code,
      envelope.details,
    );
    notifyAuthExpired(error, options.skipAuth);
    throw error;
  }

  const envelope = payload as ApiEnvelope<T>;
  return envelope && "data" in envelope ? envelope.data : (payload as T);
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};
