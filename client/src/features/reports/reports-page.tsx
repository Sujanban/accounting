import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { LoadingScreen } from "../../components/loading-screen";
import { ApiClientError } from "../../lib/query-client";
import { useLedgers } from "../accounting/use-accounting";
import { useProducts, useWarehouses } from "../masters/use-masters";
import type { ReportFilters } from "./reports-api";
import {
  useDayBook,
  useGeneralLedger,
  useJournalRegister,
  useStockSummary,
  useStockLedger,
  useProfitLoss,
  useTrialBalance,
} from "./use-reports";

const money = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const date = (value: string) => new Date(value).toLocaleDateString();
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
};

function ReportFiltersForm({
  filters,
  onApply,
  children,
}: {
  filters: ReportFilters;
  onApply: (filters: ReportFilters) => void;
  children?: ReactNode;
}) {
  const [draft, setDraft] = useState(filters);
  return (
    <Card size="3" className="report-filters no-print">
      <form
        className="accounting-filters"
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ ...draft, page: 1, limit: 20 });
        }}
      >
        <label>
          From date
          <input
            type="date"
            value={draft.from ?? ""}
            onChange={(event) =>
              setDraft({ ...draft, from: event.target.value || undefined })
            }
          />
        </label>
        <label>
          To date
          <input
            type="date"
            value={draft.to ?? ""}
            onChange={(event) =>
              setDraft({ ...draft, to: event.target.value || undefined })
            }
          />
        </label>
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
}: {
  children: ReactNode;
  printTitle: string;
}) {
  return (
    <Card size="3" className="accounting-table-card report-result">
      <div className="report-result__heading">
        <Heading size="4">{printTitle}</Heading>
        <Button
          className="no-print"
          variant="outline"
          onClick={() => window.print()}
        >
          Print
        </Button>
      </div>
      {children}
    </Card>
  );
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
  return <><ReportFiltersForm filters={filters} onApply={setFilters} />{report.isLoading ? <LoadingScreen fullScreen={false} label="Loading profit and loss" description="Calculating income and expenses…" /> : report.isError ? <Text color="red" role="alert">{errorMessage(report.error)}</Text> : report.data ? <ReportFrame printTitle="Profit & loss"><div className="report-summary"><span>Total income<strong>{money.format(report.data.totals.income)}</strong></span><span>Total expenses<strong>{money.format(report.data.totals.expenses)}</strong></span><span>{report.data.totals.netProfit >= 0 ? "Net profit" : "Net loss"}<strong>{money.format(Math.abs(report.data.totals.netProfit))}</strong></span></div><table className="accounting-table"><thead><tr><th>Income</th><th>Amount</th></tr></thead><tbody>{report.data.income.map((entry) => <tr key={entry.ledgerId}><td>{entry.ledgerName}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total income</th><th>{money.format(report.data.totals.income)}</th></tr></tfoot></table><table className="accounting-table"><thead><tr><th>Expenses</th><th>Amount</th></tr></thead><tbody>{report.data.expenses.map((entry) => <tr key={entry.ledgerId}><td>{entry.ledgerName}</td><td>{money.format(entry.amount)}</td></tr>)}</tbody><tfoot><tr><th>Total expenses</th><th>{money.format(report.data.totals.expenses)}</th></tr></tfoot></table>{!report.data.income.length && !report.data.expenses.length ? <Text as="p" color="gray" className="accounting-empty">No income or expense journal entries match these filters.</Text> : null}</ReportFrame> : null}</>;
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
      ) : (
        <DayBookReport />
      )}
    </Flex>
  );
}
