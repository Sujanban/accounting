import { describe, expect, it } from "vitest";
import { mergeDashboardTrends } from "./dashboard-page";

describe("mergeDashboardTrends", () => {
  it("combines and sorts sales and expense months without dropping gaps", () => {
    expect(
      mergeDashboardTrends(
        [
          { month: "2026-03", amount: 300 },
          { month: "2026-01", amount: 100 },
        ],
        [
          { month: "2026-02", amount: 80 },
          { month: "2026-03", amount: 120 },
        ],
      ),
    ).toEqual([
      { month: "2026-01", sales: 100, expenses: 0 },
      { month: "2026-02", sales: 0, expenses: 80 },
      { month: "2026-03", sales: 300, expenses: 120 },
    ]);
  });
});
