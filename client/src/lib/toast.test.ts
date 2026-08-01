import { afterEach, describe, expect, it, vi } from "vitest";
import { dismissToast, getToasts, showRequestError } from "./toast";

afterEach(() => {
  getToasts().forEach(({ id }) => dismissToast(id));
  vi.useRealTimers();
});

describe("request error toasts", () => {
  it("includes the server message, field errors, code, and status", () => {
    vi.useFakeTimers();
    const error = Object.assign(new Error("One or more fields are invalid."), {
      status: 422,
      code: "VALIDATION_ERROR",
      requestId: "req-123",
      fieldErrors: [
        { field: "name", message: "Name is required." },
        { field: "email", message: "Enter a valid email address." },
      ],
    });

    showRequestError(error);

    expect(getToasts()).toEqual([
      expect.objectContaining({
        title: "Request failed",
        message: "One or more fields are invalid.",
        details: ["name: Name is required.", "email: Enter a valid email address."],
        metadata: "Code: VALIDATION_ERROR · HTTP 422 · Request: req-123",
      }),
    ]);
  });

  it("uses a safe message for an unknown failure", () => {
    vi.useFakeTimers();
    showRequestError(null);

    expect(getToasts()[0]).toMatchObject({
      message: "The request could not be completed.",
      details: [],
    });
  });
});
