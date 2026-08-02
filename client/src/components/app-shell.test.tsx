// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./app-shell";

describe("Sidebar", () => {
  it("keeps only one parent navigation group open", () => {
    render(
      <MemoryRouter initialEntries={["/masters/products"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    const masters = screen.getByRole("button", { name: "Masters" });
    const reports = screen.getByRole("button", { name: "Reports" });
    const accounting = screen.getByRole("button", { name: "Accounting" });

    expect(masters.getAttribute("aria-expanded")).toBe("true");
    expect(reports.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(reports);

    expect(masters.getAttribute("aria-expanded")).toBe("false");
    expect(reports.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(accounting);

    expect(reports.getAttribute("aria-expanded")).toBe("false");
    expect(accounting.getAttribute("aria-expanded")).toBe("true");
  });
});
