const nullableFields = [
  "parentId",
  "categoryId",
  "taxId",
  "barcode",
  "description",
] as const;

const numericFields = [
  "percentage",
  "dueDays",
  "purchasePrice",
  "sellingPrice",
  "reorderLevel",
  "minimumStock",
] as const;

const booleanFields = ["decimalAllowed", "isService", "isDefault"] as const;

export function buildCatalogCreateInput(
  formData: FormData,
): Record<string, unknown> {
  const input: Record<string, unknown> = Object.fromEntries(formData);

  for (const field of nullableFields) {
    if (input[field] === "") delete input[field];
  }
  for (const field of numericFields) {
    if (input[field] !== undefined) input[field] = Number(input[field]);
  }
  for (const field of booleanFields) {
    if (formData.has(field)) input[field] = formData.get(field) === "true";
  }

  return input;
}
