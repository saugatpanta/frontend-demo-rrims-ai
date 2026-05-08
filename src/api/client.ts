const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "https://pantasaugat.com.np/api/v1"
).replace(/\/$/, "");
const CSRF_COOKIE_NAME = import.meta.env.VITE_CSRF_COOKIE_NAME ?? "rrims_csrf";
const ACCESS_TOKEN_STORAGE_KEY = "rrims.accessToken";
const CSRF_TOKEN_STORAGE_KEY = "rrims.csrfToken";
let csrfHeaderToken = "";
let csrfTokenRequest: Promise<string> | null = null;

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

export function getApiTokens() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "";
  const csrfToken =
    csrfHeaderToken || localStorage.getItem(CSRF_TOKEN_STORAGE_KEY) || getCookie(CSRF_COOKIE_NAME);
  return { accessToken, csrfToken };
}

export function setApiTokens(tokens: { accessToken?: string; csrfToken?: string }) {
  if (tokens.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  }
  if (tokens.csrfToken) {
    csrfHeaderToken = tokens.csrfToken;
    localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, tokens.csrfToken);
  }
}

export function clearApiAuth() {
  csrfHeaderToken = "";
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
  localStorage.removeItem("rrims.user");
}

function clearCsrfToken() {
  csrfHeaderToken = "";
  localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
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

function isUnsafeMethod(method = "GET") {
  return ["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase());
}

function extractCsrfToken(payload: unknown): string {
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;
  if (!data || typeof data !== "object") return "";

  const value = data as {
    csrfToken?: unknown;
    token?: unknown;
    tokenValue?: unknown;
    auth?: { csrf?: { token?: unknown } };
    security?: { csrf?: { token?: unknown } };
    session?: { csrf?: { token?: unknown } };
  };

  const token =
    value.security?.csrf?.token ??
    value.session?.csrf?.token ??
    value.auth?.csrf?.token ??
    value.csrfToken ??
    value.tokenValue ??
    (typeof value.token === "string" ? value.token : "");

  return typeof token === "string" ? token : "";
}

async function ensureCsrfToken(forceRefresh = false) {
  const existingToken = getApiTokens().csrfToken;
  if (existingToken && !forceRefresh) return existingToken;
  if (csrfTokenRequest) return csrfTokenRequest;

  csrfTokenRequest = fetch(buildUrl("/auth/csrf-token"), {
    credentials: "include",
  })
    .then(async (response) => {
      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json") ? await response.json() : await response.text();

      if (!response.ok) {
        const envelope = payload as Partial<ApiEnvelope<unknown>>;
        throw new ApiError(
          envelope.message ?? response.statusText,
          response.status,
          envelope.code,
          envelope.details,
        );
      }

      const csrfToken = extractCsrfToken(payload);
      if (!csrfToken) {
        throw new ApiError("CSRF token response did not include a token.", response.status, "CSRF_TOKEN_MISSING");
      }

      setApiTokens({ csrfToken });
      return csrfToken;
    })
    .finally(() => {
      csrfTokenRequest = null;
    });

  return csrfTokenRequest;
}

export async function api<T>(
  path: string,
  options: RequestInit & {
    query?: Record<string, string | number | boolean | undefined | null>;
    skipAuth?: boolean;
    retryingAfterCsrfRefresh?: boolean;
  } = {},
): Promise<T> {
  const { retryingAfterCsrfRefresh, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined && !(options.body instanceof FormData);
  const method = (options.method ?? "GET").toUpperCase();

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isUnsafeMethod(method) && path !== "/auth/csrf-token" && path !== "/auth/csrf") {
    const csrfToken = await ensureCsrfToken(path === "/auth/refresh");
    if (!headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const { accessToken, csrfToken } = getApiTokens();
  if (accessToken && !options.skipAuth && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (csrfToken && isUnsafeMethod(method) && !headers.has("x-csrf-token")) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...requestOptions,
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
    if (
      isUnsafeMethod(method) &&
      !retryingAfterCsrfRefresh &&
      (error.code === "CSRF_TOKEN_INVALID" || error.code === "CSRF_TOKEN_MISSING")
    ) {
      clearCsrfToken();
      const csrfToken = await ensureCsrfToken(true);
      const retryHeaders = new Headers(options.headers);
      if (hasBody && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("x-csrf-token", csrfToken);
      if (accessToken && !options.skipAuth && !retryHeaders.has("Authorization")) {
        retryHeaders.set("Authorization", `Bearer ${accessToken}`);
      }
      return api<T>(path, {
        ...options,
        headers: retryHeaders,
        retryingAfterCsrfRefresh: true,
      });
    }
    notifyAuthExpired(error, options.skipAuth);
    throw error;
  }

  const envelope = payload as ApiEnvelope<T>;
  const nextCsrfToken = extractCsrfToken(payload);
  if (nextCsrfToken) {
    setApiTokens({ csrfToken: nextCsrfToken });
  }
  return envelope && "data" in envelope ? envelope.data : (payload as T);
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};
