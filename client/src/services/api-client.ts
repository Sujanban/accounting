import { ApiClientError } from "../lib/query-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiFailure = {
  success: false;
  message?: string;
  errorCode?: string;
  errors?: unknown;
  requestId?: string;
};

function normalizeFieldErrors(errors: unknown): Array<{ field: string; message: string }> {
  if (Array.isArray(errors)) {
    return errors.flatMap((error) => {
      if (!error || typeof error !== "object") return [];
      const item = error as Record<string, unknown>;
      const field = item.field ?? item.path;
      return typeof field === "string" && typeof item.message === "string"
        ? [{ field, message: item.message }]
        : [];
    });
  }

  if (errors && typeof errors === "object") {
    return Object.entries(errors).map(([field, value]) => ({
      field,
      message: typeof value === "string" ? value : JSON.stringify(value) ?? String(value),
    }));
  }

  return [];
}

let accessToken: string | null = null;
let refreshAccessToken: (() => Promise<boolean>) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function configureAccessTokenRefresh(handler: (() => Promise<boolean>) | null) {
  refreshAccessToken = handler;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { companyId?: string; fiscalYearId?: string; skipAuthRefresh?: boolean } = {}
): Promise<T> {
  const { companyId, fiscalYearId, headers, skipAuthRefresh = false, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (requestOptions.body && !(requestOptions.body instanceof FormData) && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  if (companyId) requestHeaders.set("x-company-id", companyId);
  if (fiscalYearId) requestHeaders.set("x-fiscal-year-id", fiscalYearId);

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    credentials: "include"
  });

  const method = (requestOptions.method ?? "GET").toUpperCase();
  const canRetryAfterRefresh = !skipAuthRefresh && ["GET", "HEAD", "OPTIONS"].includes(method);

  if (response.status === 401 && canRetryAfterRefresh && refreshAccessToken && await refreshAccessToken()) {
    if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
      credentials: "include"
    });
  }

  if (response.ok && (response.status === 204 || response.status === 205 || method === "HEAD")) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || !payload.success) {
    const error = payload as ApiFailure | null;
    const fieldErrors = normalizeFieldErrors(error?.errors);

    if (import.meta.env.DEV) {
      console.error("[apiClient] Request failed", {
        method,
        path,
        status: response.status,
        response: {
          success: false,
          message: error?.message ?? "The request could not be completed.",
          errorCode: error?.errorCode,
          errors: fieldErrors,
          requestId: error?.requestId ?? response.headers.get("x-request-id") ?? undefined,
        },
      });
    }

    throw new ApiClientError(
      error?.message ?? "The request could not be completed.",
      response.status,
      error?.errorCode,
      fieldErrors,
      error?.requestId ?? response.headers.get("x-request-id") ?? undefined,
    );
  }

  return payload.data;
}
