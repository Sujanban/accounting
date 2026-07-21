import { ApiClientError } from "../lib/query-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiFailure = { success: false; message?: string; error?: { code?: string; message?: string } };

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { companyId?: string; fiscalYearId?: string } = {}
): Promise<T> {
  const { companyId, fiscalYearId, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (requestOptions.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  if (companyId) requestHeaders.set("x-company-id", companyId);
  if (fiscalYearId) requestHeaders.set("x-fiscal-year-id", fiscalYearId);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    credentials: "include"
  });
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || !payload.success) {
    const error = payload as ApiFailure | null;
    throw new ApiClientError(
      error?.error?.message ?? error?.message ?? "The request could not be completed.",
      response.status,
      error?.error?.code
    );
  }

  return payload.data;
}
