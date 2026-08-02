import type { TaxDetails } from "./transactions-api";

export type VatMode = TaxDetails["mode"];

const roundMoney = (value: number) => Number(value.toFixed(2));

export function calculateVatDetails(
  amount: number,
  rate: number,
  mode: VatMode,
): Pick<TaxDetails, "taxableAmount" | "vatRate" | "vatAmount" | "totalAmount" | "mode"> {
  const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
  const safeRate = Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0;

  if (mode === "INCLUSIVE") {
    const totalAmount = roundMoney(safeAmount);
    const taxableAmount = roundMoney(totalAmount / (1 + safeRate / 100));
    return {
      taxableAmount,
      vatRate: safeRate,
      vatAmount: roundMoney(totalAmount - taxableAmount),
      totalAmount,
      mode,
    };
  }

  const taxableAmount = roundMoney(safeAmount);
  const vatAmount = roundMoney(taxableAmount * safeRate / 100);
  return {
    taxableAmount,
    vatRate: safeRate,
    vatAmount,
    totalAmount: roundMoney(taxableAmount + vatAmount),
    mode,
  };
}

export function isValidAccountingLine(line: { ledgerId: string; debit: number | string; credit: number | string }) {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  return Boolean(line.ledgerId) && Number.isFinite(debit) && Number.isFinite(credit) && ((debit > 0) !== (credit > 0));
}

export function areAccountingEntriesBalanced(
  lines: Array<{ ledgerId: string; debit: number | string; credit: number | string }>,
) {
  const selectedLines = lines.filter((line) => line.ledgerId);
  if (!selectedLines.length || !selectedLines.every(isValidAccountingLine)) return false;
  const totals = selectedLines.reduce(
    (result, line) => ({
      debit: result.debit + Number(line.debit || 0),
      credit: result.credit + Number(line.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );
  return totals.debit > 0 && Math.abs(totals.debit - totals.credit) < 0.005;
}
