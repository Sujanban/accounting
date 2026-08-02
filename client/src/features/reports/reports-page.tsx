import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { DownloadIcon, FileTextIcon, ReaderIcon } from "@radix-ui/react-icons";
import { Children, isValidElement, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { OrderActionsMenu } from "../../components/order-actions-menu";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { NepaliDatePicker } from "../../components/ui/nepali-date-picker";
import { LoadingScreen } from "../../components/loading-screen";
import { ApiClientError } from "../../lib/query-client";
import { downloadCsv } from "../../lib/csv";
import { useLedgers } from "../accounting/use-accounting";
import { useContacts, useCreateContactLedgerMapping, useProducts, useWarehouses } from "../masters/use-masters";
import { useBranches } from "../enterprise/use-enterprise";
import type { ReportFilters } from "./reports-api";
import {
  useDayBook,
  useGeneralLedger,
  useJournalRegister,
  useStockSummary,
  useStockLedger,
  useProfitLoss,
  useBalanceSheet,
  useCashFlow,
  useVoucherSummary,
  useProductMovementSummary,
  useExpenseSummary,
  useLowStock,
  useNegativeStock,
  useExpenseTrend,
  useSalesTrend,
  useContactStatement,
  useTrialBalance,
  useVatRegister,
} from "./use-reports";

const money = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = (value: string) => `${value} BS`;
const errorMessage = (error: unknown) =>
  error instanceof ApiClientError
    ? error.message
    : "The report could not be loaded.";
const reportMetadata: Record<string, { title: string; description: string }> = {
  "general-ledger": {
    title: "General ledger",
    description: "Review journal activity and running balances for one ledger.",
  },
  "trial-balance": {
    title: "Trial balance",
    description:
      "Compare debit and credit totals across your active fiscal year.",
  },
  "journal-register": {
    title: "Journal register",
    description: "Review posted journals in date order.",
  },
  "day-book": {
    title: "Day book",
    description: "Review posted and reversed vouchers by transaction date.",
  },
  "stock-summary": {
    title: "Stock summary",
    description: "Review stock movement, quantity on hand, and inventory value by warehouse.",
  },
  "stock-ledger": {
    title: "Stock ledger",
    description: "Trace inventory movements and running quantity for one product.",
  },
  "profit-loss": {
    title: "Profit & loss",
    description: "Compare income and expenses for the selected reporting period.",
  },
  "balance-sheet": {
    title: "Balance sheet",
    description: "Review assets, liabilities, equity, and current earnings as of the selected date.",
  },
  "cash-flow": {
    title: "Cash flow",
    description: "Review operating, investing, and financing cash movements for the selected period.",
  },
  "sales-summary": { title: "Sales summary", description: "Review posted sales vouchers and total sales for the selected period." },
  "purchase-summary": { title: "Purchase summary", description: "Review posted purchase vouchers and total purchases for the selected period." },
  "vat-sales-register": { title: "VAT sales register", description: "Review taxable sales, VAT collected, and issued tax invoices." },
  "vat-purchase-register": { title: "VAT purchase register", description: "Review taxable purchases and input VAT." },
  "sales-by-product": { title: "Sales by product", description: "Review sold stock quantities and their movement value by product." },
  "purchases-by-product": { title: "Purchases by product", description: "Review purchased stock quantities and their movement value by product." },
  "expense-summary": { title: "Expense summary", description: "Review expenses by ledger for the selected reporting period." },
  "low-stock": { title: "Low stock", description: "Review products at or below their configured reorder level." },
  "negative-stock": { title: "Negative stock", description: "Review products with a calculated inventory balance below zero." },
  "expense-trend": { title: "Expense trend", description: "Review total expenses by calendar month for the selected period." },
  "sales-trend": { title: "Sales trend", description: "Review posted sales totals by calendar month for the selected period." },
  "customer-statement": {
    title: "Customer statement",
    description: "Review receivable activity and the running balance for one customer.",
  },
  "supplier-statement": {
    title: "Supplier statement",
    description: "Review payable activity and the running balance for one supplier.",
  },
};

function ReportFiltersForm({
  filters,
  onApply,
  children,
  showFrom = true,
}: {
  filters: ReportFilters;
  onApply: (filters: ReportFilters) => void;
  children?: ReactNode;
  showFrom?: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const branches = useBranches();
  return (
    <Card size="3" className="report-filters no-print">
      <form
        className="accounting-filters"
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ ...draft, page: 1, limit: 20 });
        }}
      >
        {showFrom ? <label>
          From date
          <NepaliDatePicker
            value={draft.from ?? ""}
            max={draft.to}
            onChange={(value) => setDraft({ ...draft, from: value || undefined })}
            ariaLabel="Choose report start date in Bikram Sambat"
          />
        </label> : null}
        <label>
          To date
          <NepaliDatePicker
            value={draft.to ?? ""}
            min={draft.from}
            onChange={(value) => setDraft({ ...draft, to: value || undefined })}
            ariaLabel="Choose report end date in Bikram Sambat"
          />
        </label>
        <label>Branch<AppSelect value={draft.branchId ?? ""} onChange={(event) => setDraft({ ...draft, branchId: event.target.value || undefined })}><option value="">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label>
        {children}
        <div className="report-filters__actions">
          <Button type="submit">Apply filters</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const cleared = { page: 1, limit: 20 };
              setDraft(cleared);
              onApply(cleared);
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ReportFrame({
  children,
  printTitle,
  onExportCsv,
}: {
  children: ReactNode;
  printTitle: string;
  onExportCsv?: () => void;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<"detailed" | "compact">("detailed");
  const reportChildren = Children.toArray(children);
  const inlineCsvAction = reportChildren.find(
    (child) =>
      isValidElement<{ className?: string; onClick?: () => void }>(child) &&
      child.props.className?.split(" ").includes("report-export"),
  );
  const exportCsv =
    onExportCsv ??
    (isValidElement<{ onClick?: () => void }>(inlineCsvAction)
      ? inlineCsvAction.props.onClick
      : undefined);
  const visibleChildren = reportChildren.filter((child) => child !== inlineCsvAction);
  const downloadExcel = async () => {
    const tables = reportRef.current?.querySelectorAll("table");
    if (!tables?.length) return;
    const XLSX = await import("xlsx");
    const filename = printTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const workbook = XLSX.utils.book_new();
    [...tables].forEach((table, index) => {
      const clone = table.cloneNode(true) as HTMLTableElement;
      clone.querySelectorAll("td,th").forEach((cell) => {
        if (/^[=+\-@]/.test(cell.textContent?.trim() ?? "")) cell.textContent = `'${cell.textContent}`;
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.table_to_sheet(clone, { raw: true }), `Report ${index + 1}`);
    });
    workbook.Props = { Title: printTitle, CreatedDate: new Date() };
    XLSX.writeFile(workbook, `${filename || "report"}.xlsx`, { compression: true });
  };
  const downloadPdf = async () => {
    const tables = reportRef.current?.querySelectorAll("table");
    if (!tables?.length) return;
    const filename = printTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
    const document = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    document.setFontSize(16);
    document.text(printTitle, 40, 38);
    document.setFontSize(9);
    document.setTextColor(96, 115, 111);
    document.text(`Generated ${new Date().toLocaleString()}`, 40, 54);
    let startY = 72;
    [...tables].forEach((table) => {
      const header = [...(table.tHead?.rows ?? [])].map((row) => [...row.cells].map((cell) => cell.textContent?.trim() ?? ""));
      const body = [...(table.tBodies[0]?.rows ?? [])].map((row) => [...row.cells].map((cell) => cell.textContent?.trim() ?? ""));
      const footer = [...(table.tFoot?.rows ?? [])].map((row) => [...row.cells].map((cell) => cell.textContent?.trim() ?? ""));
      autoTable(document, { head: header, body: [...body, ...footer], startY, theme: "grid", styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [23, 59, 74] }, footStyles: { fillColor: [245, 249, 247], textColor: [23, 59, 74], fontStyle: "bold" } });
      const finalY = (document as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
      startY = finalY === undefined ? startY + 32 : finalY + 16;
    });
    document.save(`${filename || "report"}.pdf`);
  };
  return (
    <Card ref={reportRef} size="3" className={`accounting-table-card report-result report-result--${template}`}>
      <div className="report-result__heading">
        <div><Heading size="4">{printTitle}</Heading><Text className="report-print-meta" size="2">Generated {new Date().toLocaleString()}</Text></div>
        <Flex className="no-print report-result__actions" align="center">
          <label className="report-template-label">
            Layout
            <AppSelect value={template} onChange={(event) => setTemplate(event.target.value as "detailed" | "compact")}>
              <option value="detailed">Detailed</option>
              <option value="compact">Compact</option>
            </AppSelect>
          </label>
          <OrderActionsMenu
            label={`Actions for ${printTitle}`}
            actions={[
              ...(exportCsv ? [{ label: "Export CSV", icon: <DownloadIcon />, onSelect: exportCsv }] : []),
              { label: "Export Excel", icon: <DownloadIcon />, onSelect: () => void downloadExcel() },
              { label: "Export PDF", icon: <FileTextIcon />, onSelect: () => void downloadPdf() },
              { label: "Print report", icon: <ReaderIcon />, onSelect: () => window.print() },
            ]}
          />
        </Flex>
      </div>
      {visibleChildren}
    </Card>
  );
}

function ReportPagination({ meta, onPageChange }: { meta: { page: number; totalPages: number; hasNextPage: boolean }; onPageChange: (page: number) => void }) {
  if (meta.totalPages <= 1) return null;
  return <Flex className="no-print" gap="2" justify="between" align="center" mt="3"><Text color="gray" size="2">Page {meta.page} of {meta.totalPages}</Text><Flex gap="2"><Button variant="outline" disabled={meta.page === 1} onClick={() => onPageChange(meta.page - 1)}>Previous</Button><Button variant="outline" disabled={!meta.hasNextPage} onClick={() => onPageChange(meta.page + 1)}>Next</Button></Flex></Flex>;
}

function GeneralLedgerReport() {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const [ledgerId, setLedgerId] = useState("");
  const ledgers = useLedgers({ isActive: true });
  const report = useGeneralLedger(ledgerId, filters);
  return (
    <>
      <ReportFiltersForm filters={filters} onApply={setFilters}>
        <label>
          Ledger
          <AppSelect
            value={ledgerId}
            onChange={(event) => setLedgerId(event.target.value)}
            required
          >
            <option value="">Select a ledger</option>
            {ledgers.data?.map((ledger) => (
              <option value={ledger.id} key={ledger.id}>
                {ledger.name}
              </option>
            ))}
          </AppSelect>
        </label>
      </ReportFiltersForm>
      {ledgers.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading ledgers"
          description="Preparing your ledger selector…"
        />
      ) : !ledgerId ? (
        <Text color="gray">
          Select a ledger and apply filters to view its activity.
        </Text>
      ) : report.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading general ledger"
          description="Calculating entries and balances…"
        />
      ) : report.isError ? (
        <Text color="red" role="alert">
          {errorMessage(report.error)}
        </Text>
      ) : report.data ? (
        <ReportFrame printTitle={`${report.data.ledger.name} — General ledger`}>
          <div className="report-summary">
            <span>
              Opening balance
              <strong>{money.format(report.data.openingBalance)}</strong>
            </span>
            <span>
              Closing balance
              <strong>{money.format(report.data.closingBalance)}</strong>
            </span>
          </div>
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {report.data.entries.map((entry) => (
                <tr key={`${entry.journalId}-${entry.transactionDate}`}>
                  <td>{date(entry.transactionDate)}</td>
                  <td>{entry.voucherNumber}</td>
                  <td>{entry.narration || "—"}</td>
                  <td>{money.format(entry.debit)}</td>
                  <td>{money.format(entry.credit)}</td>
                  <td>{money.format(entry.runningBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReportPagination meta={report.data.meta} onPageChange={(page) => setFilters({ ...filters, page })} />
          {report.data.entries.length === 0 ? (
            <Text as="p" color="gray" className="accounting-empty">
              No journal entries match these filters.
            </Text>
          ) : null}
        </ReportFrame>
      ) : null}
    </>
  );
}

function TrialBalanceReport() {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const report = useTrialBalance(filters);
  return (
    <>
      <ReportFiltersForm filters={filters} onApply={setFilters} />
      {report.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading trial balance"
          description="Calculating ledger totals…"
        />
      ) : report.isError ? (
        <Text color="red" role="alert">
          {errorMessage(report.error)}
        </Text>
      ) : report.data ? (
        <ReportFrame printTitle="Trial balance">
          <Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("trial-balance.csv", ["Ledger", "Debit", "Credit", "Net balance"], [...report.data.data.map((row) => [row.ledgerName, row.debit, row.credit, row.closing]), ["Total", report.data.totals.debit, report.data.totals.credit, ""]])}>Export CSV</Button>
          <div
            className={`report-balance ${report.data.isBalanced ? "report-balance--balanced" : "report-balance--unbalanced"}`}
          >
            {report.data.isBalanced ? "Balanced" : "Out of balance"}
          </div>
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Ledger</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Net balance</th>
              </tr>
            </thead>
            <tbody>
              {report.data.data.map((row) => (
                <tr key={row.ledgerId}>
                  <td>{row.ledgerName}</td>
                  <td>{money.format(row.debit)}</td>
                  <td>{money.format(row.credit)}</td>
                  <td>{money.format(row.closing)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th>{money.format(report.data.totals.debit)}</th>
                <th>{money.format(report.data.totals.credit)}</th>
                <th>—</th>
              </tr>
            </tfoot>
          </table>
          {report.data.data.length === 0 ? (
            <Text as="p" color="gray" className="accounting-empty">
              No journal entries match these filters.
            </Text>
          ) : null}
        </ReportFrame>
      ) : null}
    </>
  );
}

function JournalRegisterReport() {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const report = useJournalRegister(filters);
  return (
    <>
      <ReportFiltersForm filters={filters} onApply={setFilters} />
      {report.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading journal register"
          description="Retrieving journal entries…"
        />
      ) : report.isError ? (
        <Text color="red" role="alert">
          {errorMessage(report.error)}
        </Text>
      ) : report.data ? (
        <ReportFrame printTitle="Journal register">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Narration</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {report.data.items.map((item) => (
                <tr key={item._id}>
                  <td>{date(item.transactionDate)}</td>
                  <td>{item.voucherNumber}</td>
                  <td>{item.narration || "—"}</td>
                  <td>{money.format(item.totalDebit)}</td>
                  <td>{money.format(item.totalCredit)}</td>
                  <td>{item.isReversal ? "Reversal" : "Journal"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReportPagination meta={report.data.meta} onPageChange={(page) => setFilters({ ...filters, page })} />
          {report.data.items.length === 0 ? (
            <Text as="p" color="gray" className="accounting-empty">
              No journals match these filters.
            </Text>
          ) : null}
        </ReportFrame>
      ) : null}
    </>
  );
}

function DayBookReport() {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const report = useDayBook(filters);
  return (
    <>
      <ReportFiltersForm filters={filters} onApply={setFilters} />
      {report.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading day book"
          description="Retrieving voucher activity…"
        />
      ) : report.isError ? (
        <Text color="red" role="alert">
          {errorMessage(report.error)}
        </Text>
      ) : report.data ? (
        <ReportFrame printTitle="Day book">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher</th>
                <th>Transaction</th>
                <th>Narration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.data.items.map((item) => (
                <tr key={item._id}>
                  <td>{date(item.transactionDate)}</td>
                  <td>{item.voucherNumber || "—"}</td>
                  <td>{item.transactionType}</td>
                  <td>{item.narration || "—"}</td>
                  <td>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReportPagination meta={report.data.meta} onPageChange={(page) => setFilters({ ...filters, page })} />
          {report.data.items.length === 0 ? (
            <Text as="p" color="gray" className="accounting-empty">
              No vouchers match these filters.
            </Text>
          ) : null}
        </ReportFrame>
      ) : null}
    </>
  );
}

function StockSummaryReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const warehouses = useWarehouses();
  const report = useStockSummary(filters);
  return (
    <>
      <ReportFiltersForm filters={filters} onApply={setFilters}>
        <label>
          Warehouse
          <AppSelect value={filters.warehouseId ?? ""} onChange={(event) => setFilters({ ...filters, warehouseId: event.target.value || undefined })}>
            <option value="">All warehouses</option>
            {warehouses.data?.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
          </AppSelect>
        </label>
      </ReportFiltersForm>
      {report.isLoading ? <LoadingScreen fullScreen={false} label="Loading stock summary" description="Calculating inventory movements…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Stock summary"><div className="report-summary"><span>Quantity on hand<strong>{money.format(report.data.totals.quantityOnHand)}</strong></span><span>Inventory value<strong>{money.format(report.data.totals.stockValue)}</strong></span></div><table className="accounting-table"><thead><tr><th>Product</th><th>Warehouse</th><th>In</th><th>Out</th><th>On hand</th><th>Value</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={`${item.productId}-${item.warehouseId}`}><td>{item.productName}<span>{item.productSku}</span></td><td>{item.warehouseName}</td><td>{money.format(item.quantityIn)}</td><td>{money.format(item.quantityOut)}</td><td>{money.format(item.quantityOnHand)}</td><td>{money.format(item.stockValue)}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>Total</th><th>{money.format(report.data.totals.quantityIn)}</th><th>{money.format(report.data.totals.quantityOut)}</th><th>{money.format(report.data.totals.quantityOnHand)}</th><th>{money.format(report.data.totals.stockValue)}</th></tr></tfoot></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No inventory movements match these filters.</Text> : null}</ReportFrame> : null}
    </>
  );
}

function StockLedgerReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [productId, setProductId] = useState("");
  const products = useProducts();
  const report = useStockLedger(productId, filters);
  return <><ReportFiltersForm filters={filters} onApply={setFilters}><label>Product<AppSelect value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select a product</option>{products.data?.filter((product) => !product.isService).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</AppSelect></label></ReportFiltersForm>{products.isLoading ? <LoadingScreen fullScreen={false} label="Loading products" description="Preparing your product selector…" /> : !productId ? <Text color="gray">Select a product and apply filters to view its inventory movements.</Text> : report.isLoading ? <LoadingScreen fullScreen={false} label="Loading stock ledger" description="Calculating running inventory…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle={`${report.data.product.name} — Stock ledger`}><div className="report-summary"><span>Opening quantity<strong>{money.format(report.data.openingQuantity)}</strong></span><span>Closing quantity<strong>{money.format(report.data.closingQuantity)}</strong></span><span>Closing value<strong>{money.format(report.data.closingValue)}</strong></span></div><table className="accounting-table"><thead><tr><th>Date</th><th>Movement</th><th>In</th><th>Out</th><th>Running quantity</th><th>Running value</th></tr></thead><tbody>{report.data.entries.map((entry) => <tr key={entry.id}><td>{date(entry.transactionDate)}</td><td>{entry.movementType}</td><td>{money.format(entry.quantityIn)}</td><td>{money.format(entry.quantityOut)}</td><td>{money.format(entry.runningQuantity)}</td><td>{money.format(entry.runningValue)}</td></tr>)}</tbody></table>{report.data.entries.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No inventory movements match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function ProfitLossReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useProfitLoss(filters);
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading profit and loss" description="Calculating income and expenses…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Profit & loss"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("profit-loss.csv", ["Category", "Ledger", "Amount"], [...report.data.income.map((entry) => ["Income", entry.ledgerName, entry.amount]), ...report.data.expenses.map((entry) => ["Expense", entry.ledgerName, entry.amount]), ["", "Total income", report.data.totals.income], ["", "Total expenses", report.data.totals.expenses], ["", "Net profit", report.data.totals.netProfit]])}>Export CSV</Button><div className="report-summary"><span>Total income<strong>{money.format(report.data.totals.income)}</strong></span><span>Total expenses<strong>{money.format(report.data.totals.expenses)}</strong></span><span>{report.data.totals.netProfit >= 0 ? "Net profit" : "Net loss"}<strong>{money.format(Math.abs(report.data.totals.netProfit))}</strong></span></div><table className="accounting-table"><thead><tr><th>Income</th><th>Amount</th></tr></thead><tbody>{report.data.income.map((entry) => <tr key={entry.ledgerId}><td>{entry.ledgerName}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total income</th><th>{money.format(report.data.totals.income)}</th></tr></tfoot></table><table className="accounting-table"><thead><tr><th>Expenses</th><th>Amount</th></tr></thead><tbody>{report.data.expenses.map((entry) => <tr key={entry.ledgerId}><td>{entry.ledgerName}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total expenses</th><th>{money.format(report.data.totals.expenses)}</th></tr></tfoot></table>{!report.data.income.length && !report.data.expenses.length ? <Text as="p" color="gray" className="accounting-empty">No income or expense journal entries match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function BalanceSheetReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useBalanceSheet(filters);
  const renderSection = (title: string, entries: Array<{ ledgerId: string; ledgerName: string; amount: number }>, total: number) => <table className="accounting-table"><thead><tr><th>{title}</th><th>Amount</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.ledgerId}><td>{entry.ledgerName}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total {title.toLowerCase()}</th><th>{money.format(total)}</th></tr></tfoot></table>;
  return <><ReportFiltersForm filters={filters} onApply={setFilters} showFrom={false} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading balance sheet" description="Calculating account balances…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Balance sheet"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("balance-sheet.csv", ["Category", "Ledger", "Amount"], [...report.data.assets.map((entry) => ["Asset", entry.ledgerName, entry.amount]), ...report.data.liabilities.map((entry) => ["Liability", entry.ledgerName, entry.amount]), ...report.data.equity.map((entry) => ["Equity", entry.ledgerName, entry.amount]), ["Equity", "Current earnings", report.data.totals.currentEarnings], ["", "Total assets", report.data.totals.assets], ["", "Total liabilities and equity", report.data.totals.liabilitiesAndEquity]])}>Export CSV</Button><div className={`report-balance ${report.data.isBalanced ? "report-balance--balanced" : "report-balance--unbalanced"}`}>{report.data.isBalanced ? "Balanced" : "Out of balance"}</div><div className="report-summary"><span>Assets<strong>{money.format(report.data.totals.assets)}</strong></span><span>Liabilities & equity<strong>{money.format(report.data.totals.liabilitiesAndEquity)}</strong></span><span>Current earnings<strong>{money.format(report.data.totals.currentEarnings)}</strong></span></div>{renderSection("Assets", report.data.assets, report.data.totals.assets)}{renderSection("Liabilities", report.data.liabilities, report.data.totals.liabilities)}{renderSection("Equity", report.data.equity, report.data.totals.equity)}<table className="accounting-table"><tbody><tr><th>Current earnings</th><td>{money.format(report.data.totals.currentEarnings)}</td></tr><tr><th>Total equity</th><td>{money.format(report.data.totals.totalEquity)}</td></tr><tr><th>Total liabilities & equity</th><td>{money.format(report.data.totals.liabilitiesAndEquity)}</td></tr></tbody></table></ReportFrame> : null}</>;
}

function CashFlowReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useCashFlow(filters);
  const renderSection = (title: string, entries: Array<{ journalId: string; transactionDate: string; voucherNumber: string | null; narration: string | null; amount: number }>, total: number) => <table className="accounting-table"><thead><tr><th colSpan={3}>{title}</th><th>Amount</th></tr><tr><th>Date</th><th>Voucher</th><th>Narration</th><th>Cash movement</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.journalId}><td>{date(entry.transactionDate)}</td><td>{entry.voucherNumber || "—"}</td><td>{entry.narration || "—"}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Net {title.toLowerCase()}</th><th>{money.format(total)}</th></tr></tfoot></table>;
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading cash flow" description="Classifying cash movements…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Cash flow"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("cash-flow.csv", ["Activity", "Date", "Voucher", "Narration", "Amount"], [...report.data.operating.map((entry) => ["Operating", date(entry.transactionDate), entry.voucherNumber || "", entry.narration || "", entry.amount]), ...report.data.investing.map((entry) => ["Investing", date(entry.transactionDate), entry.voucherNumber || "", entry.narration || "", entry.amount]), ...report.data.financing.map((entry) => ["Financing", date(entry.transactionDate), entry.voucherNumber || "", entry.narration || "", entry.amount])])}>Export CSV</Button><div className="report-summary"><span>Opening cash<strong>{money.format(report.data.openingBalance)}</strong></span><span>Net cash flow<strong>{money.format(report.data.totals.netCashFlow)}</strong></span><span>Closing cash<strong>{money.format(report.data.closingBalance)}</strong></span></div>{renderSection("Operating activities", report.data.operating, report.data.totals.operating)}{renderSection("Investing activities", report.data.investing, report.data.totals.investing)}{renderSection("Financing activities", report.data.financing, report.data.totals.financing)}</ReportFrame> : null}</>;
}

function VoucherSummaryReport({ type }: { type: "sales" | "purchase" }) {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const report = useVoucherSummary(type, filters);
  const title = type === "sales" ? "Sales" : "Purchase";
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label={`Loading ${type} summary`} description={`Retrieving posted ${type} vouchers…`} /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle={`${title} summary`}><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv(`${type}-summary.csv`, ["Date", "Voucher", "Narration", "Items", "Amount"], [...report.data.items.map((item) => [date(item.transactionDate), item.voucherNumber, item.narration || "", item.itemCount, item.amount]), ["", "", "Total", report.data.totals.count, report.data.totals.amount]])}>Export CSV</Button><div className="report-summary"><span>Posted vouchers<strong>{report.data.totals.count}</strong></span><span>Total {type}<strong>{money.format(report.data.totals.amount)}</strong></span></div><table className="accounting-table"><thead><tr><th>Date</th><th>Voucher</th><th>Narration</th><th>Items</th><th>Amount</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.id}><td>{date(item.transactionDate)}</td><td>{item.voucherNumber}</td><td>{item.narration || "—"}</td><td>{item.itemCount}</td><td>{money.format(item.amount)}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total</th><th>{report.data.totals.count}</th><th>{money.format(report.data.totals.amount)}</th></tr></tfoot></table><ReportPagination meta={report.data.meta} onPageChange={(page) => setFilters({ ...filters, page })} />{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No posted {type} vouchers match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function VatRegisterReport({ type }: { type: "sales" | "purchase" }) {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 }); const report = useVatRegister(type, filters); const title = type === "sales" ? "VAT sales register" : "VAT purchase register";
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label={`Loading ${title}`} description="Preparing VAT transactions…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle={title}><div className="report-summary"><span>Taxable amount<strong>{money.format(report.data.totals.taxableAmount)}</strong></span><span>VAT<strong>{money.format(report.data.totals.vatAmount)}</strong></span><span>Total<strong>{money.format(report.data.totals.totalAmount)}</strong></span></div><table className="accounting-table"><thead><tr><th>Date</th><th>Voucher</th><th>Tax invoice</th><th>Party</th><th>PAN</th><th>Taxable</th><th>VAT</th><th>Total</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.id}><td>{date(item.transactionDate)}</td><td>{item.voucherNumber}</td><td>{item.taxInvoiceNumber || "—"}</td><td>{item.partyName || "—"}</td><td>{item.panNumber || "—"}</td><td>{money.format(item.taxableAmount)}</td><td>{money.format(item.vatAmount)}</td><td>{money.format(item.totalAmount)}</td></tr>)}</tbody></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No taxable {type} vouchers match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function ProductMovementSummaryReport({ type }: { type: "sales" | "purchases" }) {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useProductMovementSummary(type, filters);
  const title = type === "sales" ? "Sales by product" : "Purchases by product";
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label={`Loading ${title.toLowerCase()}`} description="Calculating immutable inventory movements…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle={title}><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv(`${type}-by-product.csv`, ["Product", "SKU", "Transactions", "Quantity", "Movement value"], [...report.data.items.map((item) => [item.productName, item.productSku, item.transactionCount, item.quantity, item.value]), ["Total", "", report.data.totals.transactionCount, report.data.totals.quantity, report.data.totals.value]])}>Export CSV</Button><div className="report-summary"><span>Transactions<strong>{report.data.totals.transactionCount}</strong></span><span>Quantity<strong>{money.format(report.data.totals.quantity)}</strong></span><span>Movement value<strong>{money.format(report.data.totals.value)}</strong></span></div><table className="accounting-table"><thead><tr><th>Product</th><th>SKU</th><th>Transactions</th><th>Quantity</th><th>Movement value</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{item.productSku}</td><td>{item.transactionCount}</td><td>{money.format(item.quantity)}</td><td>{money.format(item.value)}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>Total</th><th>{report.data.totals.transactionCount}</th><th>{money.format(report.data.totals.quantity)}</th><th>{money.format(report.data.totals.value)}</th></tr></tfoot></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No inventory movements match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function ExpenseSummaryReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useExpenseSummary(filters);
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading expense summary" description="Calculating expenses by ledger…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Expense summary"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("expense-summary.csv", ["Ledger", "Amount"], [...report.data.items.map((item) => [item.ledgerName, item.amount]), ["Total expenses", report.data.totals.expenses]])}>Export CSV</Button><div className="report-summary"><span>Total expenses<strong>{money.format(report.data.totals.expenses)}</strong></span></div><table className="accounting-table"><thead><tr><th>Expense ledger</th><th>Amount</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.ledgerId}><td>{item.ledgerName}</td><td>{money.format(item.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total expenses</th><th>{money.format(report.data.totals.expenses)}</th></tr></tfoot></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No expenses match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function LowStockReport() {
  const report = useLowStock();
  return report.isLoading ? <LoadingScreen fullScreen={false} label="Loading low stock" description="Calculating current inventory balances…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Low stock"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("low-stock.csv", ["Product", "SKU", "On hand", "Reorder level", "Shortage"], [...report.data.items.map((item) => [item.productName, item.productSku, item.quantityOnHand, item.reorderLevel, item.shortage]), ["Total", "", "", "", report.data.totals.shortage]])}>Export CSV</Button><div className="report-summary"><span>Products needing attention<strong>{report.data.totals.products}</strong></span><span>Total shortage<strong>{money.format(report.data.totals.shortage)}</strong></span></div><table className="accounting-table"><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Reorder level</th><th>Shortage</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{item.productSku}</td><td>{money.format(item.quantityOnHand)}</td><td>{money.format(item.reorderLevel)}</td><td>{money.format(item.shortage)}</td></tr>)}</tbody></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">All tracked products are above their reorder levels.</Text> : null}</ReportFrame> : null;
}

function NegativeStockReport() {
  const report = useNegativeStock();
  return report.isLoading ? <LoadingScreen fullScreen={false} label="Loading negative stock" description="Calculating current inventory balances…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Negative stock"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("negative-stock.csv", ["Product", "SKU", "On hand", "Deficit"], [...report.data.items.map((item) => [item.productName, item.productSku, item.quantityOnHand, item.deficit]), ["Total", "", "", report.data.totals.deficit]])}>Export CSV</Button><div className="report-summary"><span>Products with negative stock<strong>{report.data.totals.products}</strong></span><span>Total deficit<strong>{money.format(report.data.totals.deficit)}</strong></span></div><table className="accounting-table"><thead><tr><th>Product</th><th>SKU</th><th>On hand</th><th>Deficit</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.productId}><td>{item.productName}</td><td>{item.productSku}</td><td>{money.format(item.quantityOnHand)}</td><td>{money.format(item.deficit)}</td></tr>)}</tbody></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No products have negative stock.</Text> : null}</ReportFrame> : null;
}

function ExpenseTrendReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useExpenseTrend(filters);
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading expense trend" description="Calculating monthly expenses…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Expense trend"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("expense-trend.csv", ["Month", "Expenses"], [...report.data.items.map((item) => [item.month, item.amount]), ["Total expenses", report.data.totals.expenses]])}>Export CSV</Button><div className="report-summary"><span>Total expenses<strong>{money.format(report.data.totals.expenses)}</strong></span></div><table className="accounting-table"><thead><tr><th>Month</th><th>Expenses</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.month}><td>{item.month}</td><td>{money.format(item.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total expenses</th><th>{money.format(report.data.totals.expenses)}</th></tr></tfoot></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No expenses match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function SalesTrendReport() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const report = useSalesTrend(filters);
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading sales trend" description="Calculating monthly sales…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Sales trend"><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv("sales-trend.csv", ["Month", "Vouchers", "Sales"], [...report.data.items.map((item) => [item.month, item.voucherCount, item.amount]), ["Total", report.data.totals.vouchers, report.data.totals.amount]])}>Export CSV</Button><div className="report-summary"><span>Posted vouchers<strong>{report.data.totals.vouchers}</strong></span><span>Total sales<strong>{money.format(report.data.totals.amount)}</strong></span></div><table className="accounting-table"><thead><tr><th>Month</th><th>Posted vouchers</th><th>Sales</th></tr></thead><tbody>{report.data.items.map((item) => <tr key={item.month}><td>{item.month}</td><td>{item.voucherCount}</td><td>{money.format(item.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total</th><th>{report.data.totals.vouchers}</th><th>{money.format(report.data.totals.amount)}</th></tr></tfoot></table>{report.data.items.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No posted sales match these filters.</Text> : null}</ReportFrame> : null}</>;
}

function ContactStatementReport({ role }: { role: "customer" | "supplier" }) {
  const [filters, setFilters] = useState<ReportFilters>({ page: 1, limit: 20 });
  const [contactId, setContactId] = useState("");
  const [ledgerId, setLedgerId] = useState("");
  const contacts = useContacts({ role: role.toUpperCase(), page: 1, isActive: "true" });
  const ledgers = useLedgers({ isActive: true });
  const createMapping = useCreateContactLedgerMapping();
  const report = useContactStatement(role, contactId, filters);
  const roleLabel = role === "customer" ? "customer" : "supplier";
  const mappingMissing = report.isError && errorMessage(report.error) === "No fiscal-year ledger mapping exists for this contact statement.";
  return <><ReportFiltersForm filters={filters} onApply={setFilters}><label>{roleLabel[0].toUpperCase() + roleLabel.slice(1)}<AppSelect value={contactId} onChange={(event) => { setContactId(event.target.value); setLedgerId(""); }} required><option value="">Select a {roleLabel}</option>{contacts.data?.items.map((contact) => <option key={contact.id} value={contact.id}>{contact.displayName || contact.name}</option>)}</AppSelect></label></ReportFiltersForm>{contacts.isLoading ? <LoadingScreen fullScreen={false} label={`Loading ${roleLabel}s`} description={`Preparing your ${roleLabel} selector…`} /> : !contactId ? <Text color="gray">Select a {roleLabel} and apply filters to view the statement.</Text> : report.isLoading ? <LoadingScreen fullScreen={false} label={`Loading ${roleLabel} statement`} description="Calculating entries and balances…" /> : mappingMissing ? <Card size="3" className="report-filters"><Heading size="4">Set up the {roleLabel} ledger</Heading><Text as="p" color="gray" mt="2">This {roleLabel} needs an active-fiscal-year ledger before its statement can be generated.</Text><form className="accounting-filters" onSubmit={(event) => { event.preventDefault(); createMapping.mutate({ id: contactId, input: { role: role.toUpperCase() as "CUSTOMER" | "SUPPLIER", ledgerId } }); }}><label>Ledger<AppSelect value={ledgerId} onChange={(event) => setLedgerId(event.target.value)} required><option value="">Select a ledger</option>{ledgers.data?.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</AppSelect></label><div className="report-filters__actions"><Button type="submit" disabled={!ledgerId || createMapping.isPending}> {createMapping.isPending ? "Saving…" : "Save ledger mapping"}</Button></div></form>{createMapping.isError ? <Text as="p" color="red" mt="2" role="alert">{errorMessage(createMapping.error)}</Text> : null}</Card> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle={`${report.data.contact.name} — ${roleLabel} statement`}><Button className="no-print report-export" variant="outline" onClick={() => downloadCsv(`${roleLabel}-statement.csv`, ["Date", "Voucher", "Narration", "Debit", "Credit", "Balance"], [...report.data.entries.map((entry) => [date(entry.transactionDate), entry.voucherNumber || "", entry.narration || "", entry.debit, entry.credit, entry.runningBalance]), ["", "", "Closing balance", "", "", report.data.closingBalance]])}>Export CSV</Button><div className="report-summary"><span>Ledger<strong>{report.data.ledger.name}</strong></span><span>Opening balance<strong>{money.format(report.data.openingBalance)}</strong></span><span>Closing balance<strong>{money.format(report.data.closingBalance)}</strong></span></div><table className="accounting-table"><thead><tr><th>Date</th><th>Voucher</th><th>Narration</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{report.data.entries.map((entry) => <tr key={`${entry.journalId}-${entry.transactionDate}`}><td>{date(entry.transactionDate)}</td><td>{entry.voucherNumber || "—"}</td><td>{entry.narration || "—"}</td><td>{money.format(entry.debit)}</td><td>{money.format(entry.credit)}</td><td>{money.format(entry.runningBalance)}</td></tr>)}</tbody></table>{report.data.entries.length === 0 ? <Text as="p" color="gray" className="accounting-empty">No journal entries match these filters.</Text> : null}</ReportFrame> : null}</>;
}

export function ReportsPage() {
  const { report = "" } = useParams();
  const metadata = reportMetadata[report];
  if (!metadata)
    return (
      <Text color="red" role="alert">
        This report is not available.
      </Text>
    );
  return (
    <Flex direction="column" gap="5">
      <div>
        <Heading size="7">{metadata.title}</Heading>
        <Text as="p" color="gray" mt="2">
          {metadata.description}
        </Text>
      </div>
      {report === "general-ledger" ? (
        <GeneralLedgerReport />
      ) : report === "trial-balance" ? (
        <TrialBalanceReport />
      ) : report === "journal-register" ? (
        <JournalRegisterReport />
      ) : report === "stock-summary" ? (
        <StockSummaryReport />
      ) : report === "stock-ledger" ? (
        <StockLedgerReport />
      ) : report === "profit-loss" ? (
        <ProfitLossReport />
      ) : report === "balance-sheet" ? (
        <BalanceSheetReport />
      ) : report === "cash-flow" ? (
        <CashFlowReport />
      ) : report === "sales-summary" ? (
        <VoucherSummaryReport type="sales" />
      ) : report === "purchase-summary" ? (
        <VoucherSummaryReport type="purchase" />
      ) : report === "vat-sales-register" ? (
        <VatRegisterReport type="sales" />
      ) : report === "vat-purchase-register" ? (
        <VatRegisterReport type="purchase" />
      ) : report === "sales-by-product" ? (
        <ProductMovementSummaryReport type="sales" />
      ) : report === "purchases-by-product" ? (
        <ProductMovementSummaryReport type="purchases" />
      ) : report === "expense-summary" ? (
        <ExpenseSummaryReport />
      ) : report === "low-stock" ? (
        <LowStockReport />
      ) : report === "negative-stock" ? (
        <NegativeStockReport />
      ) : report === "expense-trend" ? (
        <ExpenseTrendReport />
      ) : report === "sales-trend" ? (
        <SalesTrendReport />
      ) : report === "customer-statement" ? (
        <ContactStatementReport role="customer" />
      ) : report === "supplier-statement" ? (
        <ContactStatementReport role="supplier" />
      ) : (
        <DayBookReport />
      )}
    </Flex>
  );
}
