const VOUCHER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  POSTED: "Regular",
  REVERSED: "Reversed",
  CANCELLED: "Cancelled",
};

export function formatVoucherStatus(status: string): string {
  return VOUCHER_STATUS_LABELS[status] ?? status;
}
