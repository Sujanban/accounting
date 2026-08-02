import { describe, expect, it } from "vitest";
import { buildCatalogCreateInput } from "./catalog-form";

describe("buildCatalogCreateInput", () => {
  it("does not leak fields from other master forms into a contact group", () => {
    const formData = new FormData();
    formData.set("name", "Wholesale customers");
    formData.set("parentId", "");
    formData.set("description", "");

    expect(buildCatalogCreateInput(formData)).toEqual({
      name: "Wholesale customers",
    });
  });

  it("normalizes only boolean and numeric fields present in the form", () => {
    const formData = new FormData();
    formData.set("name", "Kilogram");
    formData.set("decimalAllowed", "false");
    formData.set("dueDays", "30");

    expect(buildCatalogCreateInput(formData)).toEqual({
      name: "Kilogram",
      decimalAllowed: false,
      dueDays: 30,
    });
  });
});
