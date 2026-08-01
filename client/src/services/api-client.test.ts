import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "../lib/query-client";
import { apiClient, setAccessToken } from "./api-client";

describe("apiClient diagnostics", () => {
  afterEach(() => {
    setAccessToken(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs a safe structured validation response during development", async () => {
    const response = {
      success: false,
      message: "Validation failed.",
      errorCode: "VALIDATION_ERROR",
      errors: [{ field: "branchId", message: "This field cannot be modified." }],
      requestId: "request-123",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(response), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(apiClient("/sales", { method: "POST", body: JSON.stringify({ branchId: "branch-1" }) }))
      .rejects.toBeInstanceOf(ApiClientError);

    expect(consoleError).toHaveBeenCalledWith("[apiClient] Request failed", {
      method: "POST",
      path: "/sales",
      status: 400,
      response,
    });
  });

  it("accepts a successful response with no content", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, {
      status: 204,
      headers: { "x-request-id": "request-204" },
    })));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(apiClient<void>("/warehouses/warehouse-1", { method: "DELETE" }))
      .resolves.toBeUndefined();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
