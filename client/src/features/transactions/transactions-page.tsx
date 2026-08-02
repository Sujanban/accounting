import { CheckCircledIcon, EyeOpenIcon, Pencil1Icon, ResetIcon, TrashIcon } from "@radix-ui/react-icons";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CrudPageHeader, CrudPageState } from "../../components/crud-page";
import { useActionDialog } from "../../components/action-dialog";
import { LoadingScreen } from "../../components/loading-screen";
import { OrderActionsMenu } from "../../components/order-actions-menu";
import { Button } from "../../components/ui/button";
import { NepaliDatePicker } from "../../components/ui/nepali-date-picker";
import { AppSelect } from "../../components/ui/select";
import { useLedgers } from "../accounting/use-accounting";
import {
  useApproveTransaction,
  useCreateVoucherDraft,
  usePostVoucher,
  useReverseVoucher,
  useSubmitTransaction,
  useTransaction,
  useTaxInvoice,
  useUpdateVoucherDraft,
  useVoucherTransactions,
} from "./use-transactions";
import { mastersApi } from "../masters/masters-api";
import { useAttachments, useDeleteAttachment, useProducts, useUploadAttachment, useWarehouses } from "../masters/use-masters";
import { usePan, useVat } from "../settings/use-settings";
import type { VoucherTransactionType } from "./transactions-api";
import type { TaxDetails } from "./transactions-api";
import { useBranches, useBranchWarehouses } from "../enterprise/use-enterprise";
import { useAuth } from "../auth/auth-provider";
import { todayBsDate } from "../../lib/nepali-date";
import { formatVoucherStatus } from "../../lib/voucher-status";
import { areAccountingEntriesBalanced, calculateVatDetails } from "./voucher-calculations";

const types = [
  { value: "JOURNAL", voucher: "JV", path: "journal" },
  { value: "RECEIPT", voucher: "RV", path: "receipt" },
  { value: "PAYMENT", voucher: "PMV", path: "payment" },
  { value: "CONTRA", voucher: "CV", path: "contra" },
  { value: "SALE", voucher: "SV", path: "sales" },
  { value: "PURCHASE", voucher: "PV", path: "purchase" },
] as const;

const formatVoucherType = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");

const formatAmount = (value: number) => new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export const voucherDate = (value: string) => {
  const bs = value.slice(0, 10);
  return { bs };
};

export const voucherDebitTotal = (entries: Array<{ debit: number }>) =>
  entries.reduce((total, entry) => total + Number(entry.debit || 0), 0);

function NepalDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  return (
    <label>
      Transaction date (BS)
      <NepaliDatePicker
        name="transactionDate"
        value={value}
        onChange={onChange}
        required
        placeholder="Select transaction date"
        ariaLabel="Choose transaction date in Bikram Sambat"
      />
    </label>
  );
}

export function TransactionsPage({
  drafts = false,
  create = false,
}: {
  drafts?: boolean;
  create?: boolean;
}) {
  const navigate = useNavigate();
  const actionDialog = useActionDialog();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(drafts ? "DRAFT" : "");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { transactionId, voucherType } = useParams();
  const routeType = types.find((item) => item.path === voucherType);
  const activeType = routeType?.value ?? "JOURNAL";
  const list = useVoucherTransactions(routeType?.value, {
    page,
    status: status || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const post = usePostVoucher();
  const reverse = useReverseVoucher();
  const ledgers = useLedgers({ isActive: true });
  const createDraft = useCreateVoucherDraft();
  const products = useProducts();
  const warehouses = useWarehouses();
  const branches = useBranches();
  const vat = useVat();
  const pan = usePan();
  if (transactionId) return <TransactionDetail />;
  if (create && (ledgers.isLoading || products.isLoading || warehouses.isLoading || branches.isLoading || vat.isLoading || pan.isLoading)) {
    return (
      <Flex direction="column" gap="5">
        <Heading size="7">New {formatVoucherType(activeType)} voucher</Heading>
        <LoadingScreen
          fullScreen={false}
          label="Loading voucher form"
          description="Preparing ledgers, products, and warehouses…"
        />
      </Flex>
    );
  }
  if (create)
    return (
      <DraftForm
        type={activeType}
        ledgers={ledgers.data ?? []}
        products={products.data ?? []}
        warehouses={warehouses.data ?? []}
        branches={branches.data ?? []}
        defaultVatRate={vat.data?.defaultVatRate ?? 13}
        defaultVatMode={vat.data?.vatMode ?? "EXCLUSIVE"}
        canIssueTaxInvoice={Boolean(vat.data?.vatRegistered && vat.data.vatNumber && pan.data?.panNumber)}
        initialInventory={[]}
        pending={createDraft.isPending}
        error={
          createDraft.error instanceof Error
            ? createDraft.error.message
            : undefined
        }
        onSave={async (input) => {
          const {
            transactionType,
            voucherType: _voucherType,
            ...voucherInput
          } = input;
          const draft = await createDraft.mutateAsync({
            type: transactionType as VoucherTransactionType,
            input: voucherInput,
          });
          navigate(`/vouchers/transactions/${draft.id}`);
        }}
      />
    );
  return (
    <Flex direction="column" gap="5">
      <CrudPageHeader
        title={drafts ? "Voucher drafts" : routeType ? `${formatVoucherType(routeType.value)} vouchers` : "Transactions"}
        description={drafts ? "Review unfinished vouchers before making them regular." : `Review and manage ${routeType ? formatVoucherType(routeType.value).toLowerCase() : "company"} vouchers.`}
        action={<Button
          onClick={() =>
            navigate(`/vouchers/${routeType?.path ?? "journal"}/new`)
          }
        >
          New{" "}
          {routeType
            ? routeType.value.toLowerCase().replaceAll("_", " ")
            : "journal"}{" "}
          voucher
        </Button>}
      />
      <Card size="3" className="voucher-list__filter-card">
        <div className="accounting-filters voucher-list__filters">
          <label>
            Status
            <AppSelect
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Regular</option>
              <option value="REVERSED">Reversed</option>
            </AppSelect>
          </label>
          <label>
            From date
            <NepaliDatePicker
              value={fromDate}
              max={toDate || undefined}
              onChange={(nextDate) => {
                setFromDate(nextDate);
                setPage(1);
              }}
              ariaLabel="Choose starting date in Bikram Sambat"
            />
          </label>
          <label>
            To date
            <NepaliDatePicker
              value={toDate}
              min={fromDate || undefined}
              onChange={(nextDate) => {
                setToDate(nextDate);
                setPage(1);
              }}
              ariaLabel="Choose ending date in Bikram Sambat"
            />
          </label>
          {(status || fromDate || toDate) ? (
            <div className="voucher-list__filter-actions">
              <Button variant="ghost" onClick={() => { setStatus(drafts ? "DRAFT" : ""); setFromDate(""); setToDate(""); setPage(1); }}>
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
      </Card>
      {post.error instanceof Error ? <Text color="red" role="alert">{post.error.message}</Text> : null}
      <CrudPageState loading={list.isLoading} error={list.error} label="Loading vouchers" description="Retrieving voucher transactions…">
        <>
      <Card size="3" className="accounting-table-card order-actions-table">
        <table className="accounting-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher</th>
              <th>Narration</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((item) => {
              const date = voucherDate(item.transactionDate);
              const amount = voucherDebitTotal(item.accountingEntries);
              const pending = post.isPending || reverse.isPending;
              const actions = [
                { label: "View voucher", icon: <EyeOpenIcon />, onSelect: () => navigate(`/vouchers/transactions/${item.id}`) },
                ...(item.status === "DRAFT" ? [
                  { label: "Edit draft", icon: <Pencil1Icon />, onSelect: () => navigate(`/vouchers/transactions/${item.id}/edit`) },
                  { label: "Make regular", icon: <CheckCircledIcon />, disabled: pending, onSelect: async () => { if (await actionDialog.confirm({ title: "Make voucher regular?", description: "This will record the voucher in the accounts and inventory, assign its final number, and prevent normal editing.", confirmLabel: "Make regular" })) post.mutate({ id: item.id, type: item.transactionType as VoucherTransactionType }); } },
                ] : []),
                ...(item.status === "POSTED" && !item.reversedById ? [
                  { label: "Reverse voucher", icon: <ResetIcon />, disabled: pending, destructive: true, onSelect: async () => { if (await actionDialog.confirm({ title: "Reverse voucher?", description: "A reversing entry will be created for this regular voucher. This action cannot be undone.", confirmLabel: "Reverse voucher", destructive: true })) reverse.mutate({ id: item.id, type: item.transactionType as VoucherTransactionType }); } },
                ] : []),
              ];
              return <tr key={item.id}>
                <td><span className="voucher-list__date"><strong>{date.bs} BS</strong></span></td>
                <td>
                  <Link className="voucher-list__link" to={`/vouchers/transactions/${item.id}`}>
                    {item.voucherNumber ?? "Draft"}
                  </Link>
                </td>
                <td className="voucher-list__narration">{item.narration || "—"}</td>
                <td className="voucher-list__amount">Rs. {formatAmount(amount)}</td>
                <td>
                  <span className={`voucher-status voucher-status--${item.status.toLowerCase()}`}>
                    {formatVoucherStatus(item.status)}
                  </span>
                </td>
                <td><OrderActionsMenu label={`Actions for voucher ${item.voucherNumber ?? "draft"}`} actions={actions} /></td>
              </tr>;
            })}
            {!list.data?.items.length ? (
              <tr>
                <td colSpan={6} className="voucher-list__empty">
                  <strong>No vouchers found</strong>
                  <Text color="gray">Try changing the filters or create a new voucher.</Text>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      {list.data?.meta.totalPages && list.data.meta.totalPages > 1 ? (
        <Flex justify="between" align="center" className="voucher-list__pagination">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Text color="gray">
            Page <strong>{page}</strong> of <strong>{list.data.meta.totalPages}</strong> · {list.data.meta.total} vouchers
          </Text>
          <Button
            variant="outline"
            disabled={!list.data.meta.hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </Flex>
      ) : null}
        </>
      </CrudPageState>
      {actionDialog.dialog}
    </Flex>
  );
}
function DraftForm({
  type,
  ledgers,
  products,
  warehouses,
  branches,
  defaultVatRate,
  defaultVatMode,
  canIssueTaxInvoice,
  initialInventory,
  pending,
  error,
  onSave,
}: {
  type: string;
  ledgers: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; isService: boolean }>;
  warehouses: Array<{ id: string; name: string }>;
  branches: Array<{ id: string; name: string; isDefault: boolean }>;
  defaultVatRate: number;
  defaultVatMode: "EXCLUSIVE" | "INCLUSIVE";
  canIssueTaxInvoice: boolean;
  initialInventory: Array<{ productId: string; warehouseId: string; quantity: string; unitCost: string; direction: "IN" | "OUT" }>;
  pending: boolean;
  error?: string;
  onSave: (input: any) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [transactionDate, setTransactionDate] = useState(todayBsDate);
  const [lines, setLines] = useState([
    { ledgerId: "", debit: "", credit: "" },
    { ledgerId: "", debit: "", credit: "" },
  ]);
  const [inventory, setInventory] = useState<
    Array<{
      productId: string;
      warehouseId: string;
      quantity: string;
      unitCost: string;
      direction: "IN" | "OUT";
    }>
  >(initialInventory);
  const [branchId, setBranchId] = useState(branches.find((branch) => branch.isDefault)?.id ?? "");
  const branchWarehouses = useBranchWarehouses(branchId);
  const [includeTaxInvoice, setIncludeTaxInvoice] = useState(false);
  const [tax, setTax] = useState({ customerName: "", customerPan: "", taxableAmount: "", vatRate: String(defaultVatRate), mode: defaultVatMode });
  const selected = types.find((item) => item.value === type)!;
  const voucherLabel = selected.value.toLowerCase().replaceAll("_", " ");
  const enteredTaxAmount = Number(tax.taxableAmount || 0);
  const vatRate = Number(tax.vatRate || 0);
  const taxDetails = calculateVatDetails(enteredTaxAmount, vatRate, tax.mode);
  const debitTotal = lines.reduce((total, line) => total + Number(line.debit || 0), 0);
  const creditTotal = lines.reduce((total, line) => total + Number(line.credit || 0), 0);
  const isBalanced = areAccountingEntriesBalanced(lines);
  const taxMatchesAccounting = !includeTaxInvoice || Math.abs(debitTotal - taxDetails.totalAmount) < .005;
  return (
    <Flex direction="column" gap="5">
      <CrudPageHeader
        title={`New ${voucherLabel} voucher`}
        description="Enter the voucher details, balance the accounting lines, and save it as a draft for review."
        action={<Button variant="outline" onClick={() => navigate(`/vouchers/${selected.path}`)}>Back to vouchers</Button>}
      />
      <Card size="3" className="voucher-form-card">
        <form
          className="accounting-form voucher-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void onSave({
              transactionType: type,
              voucherType: selected.voucher,
              transactionDate,
              branchId: branchId || undefined,
              narration: form.get("narration") || null,
              items: [],
              ...(type === "SALE" && includeTaxInvoice ? { taxDetails: { customerName: tax.customerName || null, customerPan: tax.customerPan || null, ...taxDetails } } : {}),
              inventoryEntries: inventory
                .filter((line) => line.productId && line.warehouseId)
                .map((line) => ({
                  ...line,
                  quantity: Number(line.quantity),
                  unitCost: Number(line.unitCost || 0),
                })),
              accountingEntries: lines
                .filter((line) => line.ledgerId)
                .map((line) => ({
                  ledgerId: line.ledgerId,
                  debit: Number(line.debit || 0),
                  credit: Number(line.credit || 0),
                })),
            });
          }}
        >
          <NepalDateField
            value={transactionDate}
            onChange={setTransactionDate}
          />
          <label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Select branch (default)</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label>
          <label className="accounting-form__wide">
            Narration
            <textarea
              name="narration"
              rows={2}
              placeholder="Add a brief description"
            />
          </label>
          {error ? (
            <Text className="accounting-form__wide" color="red" role="alert">
              {error}
            </Text>
          ) : null}
          {type === "SALE" ? (
            <div className="accounting-form__wide voucher-tax">
              <Flex justify="between" align="center" gap="3" wrap="wrap">
                <div>
                  <Heading size="4">Tax invoice</Heading>
                  <Text size="2" color="gray">Tally-style VAT summary for a taxable sale.</Text>
                </div>
                <label className="voucher-tax__toggle"><input type="checkbox" checked={includeTaxInvoice} disabled={!canIssueTaxInvoice} onChange={(event) => setIncludeTaxInvoice(event.target.checked)} /> Issue tax invoice</label>
              </Flex>
              {!canIssueTaxInvoice ? <Text size="2" color="amber">Complete the company PAN and VAT registration settings before issuing tax invoices.</Text> : null}
              {includeTaxInvoice ? (
                <div className="voucher-tax__grid">
                  <label>Customer name<input value={tax.customerName} onChange={(event) => setTax({ ...tax, customerName: event.target.value })} placeholder="Enter customer name" /></label>
                  <label>Customer PAN<input value={tax.customerPan} onChange={(event) => setTax({ ...tax, customerPan: event.target.value.replace(/\D/g, "").slice(0, 9) })} inputMode="numeric" placeholder="Optional 9-digit PAN" /></label>
                  <label>{tax.mode === "INCLUSIVE" ? "Invoice amount (VAT included)" : "Taxable amount (before VAT)"}<input type="number" min="0.01" step="0.01" required value={tax.taxableAmount} onChange={(event) => setTax({ ...tax, taxableAmount: event.target.value })} placeholder={tax.mode === "INCLUSIVE" ? "Enter VAT-inclusive total" : "Enter taxable amount"} /></label>
                  <label>VAT rate (%)<input type="number" min="0" max="100" step="0.01" required value={tax.vatRate} onChange={(event) => setTax({ ...tax, vatRate: event.target.value })} placeholder="Enter VAT rate" /></label>
                  <label>VAT mode<AppSelect value={tax.mode} onChange={(event) => setTax({ ...tax, mode: event.target.value as "EXCLUSIVE" | "INCLUSIVE" })}><option value="EXCLUSIVE">Exclusive</option><option value="INCLUSIVE">Inclusive</option></AppSelect></label>
                  <div className="voucher-tax__totals"><span>Taxable: Rs. {taxDetails.taxableAmount.toFixed(2)}</span><span>VAT: Rs. {taxDetails.vatAmount.toFixed(2)}</span><strong>Total: Rs. {taxDetails.totalAmount.toFixed(2)}</strong></div>
                  <Text size="2" color="gray">Tally-style posting: debit Party/Cash for the total, credit Sales for the taxable amount, and credit VAT Payable for VAT.</Text>
                  {!taxMatchesAccounting ? <Text size="2" color="red" role="alert">The accounting debit total must equal the tax invoice total of Rs. {taxDetails.totalAmount.toFixed(2)}.</Text> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="accounting-form__wide voucher-form__accounting">
            <div className="voucher-form__section-heading">
              <div><Heading size="4">Accounting entries</Heading><Text size="2" color="gray">Add matching debit and credit lines.</Text></div>
              <span>{lines.length} lines</span>
            </div>
            {lines.map((line, index) => (
              <Flex className="voucher-form__line" key={index} gap="2" mb="2">
                <label>
                  Ledger
                  <AppSelect
                    value={line.ledgerId}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === index ? { ...x, ledgerId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select ledger</option>
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label>
                  Debit
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter debit amount"
                    value={line.debit}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === index ? { ...x, debit: e.target.value, ...(Number(e.target.value) > 0 ? { credit: "" } : {}) } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Credit
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter credit amount"
                    value={line.credit}
                    onChange={(e) =>
                      setLines(
                        lines.map((x, i) =>
                          i === index ? { ...x, credit: e.target.value, ...(Number(e.target.value) > 0 ? { debit: "" } : {}) } : x,
                        ),
                      )
                    }
                  />
                </label>
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  className="table-icon-button"
                  aria-label={`Remove accounting line ${index + 1}`}
                  disabled={lines.length <= 2}
                  onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
                >
                  <TrashIcon className="table-action-icon" />
                </Button>
              </Flex>
            ))}
            <div className={`voucher-entry-summary${isBalanced ? " is-balanced" : ""}`}>
              <span>Debit <strong>Rs. {formatAmount(debitTotal)}</strong></span>
              <span>Credit <strong>Rs. {formatAmount(creditTotal)}</strong></span>
              <span className="voucher-entry-summary__balance">{isBalanced ? "Balanced" : lines.some((line) => line.ledgerId && Number(line.debit || 0) > 0 && Number(line.credit || 0) > 0) ? "Use debit or credit on each row—not both" : `Difference Rs. ${formatAmount(Math.abs(debitTotal - creditTotal))}`}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setLines([...lines, { ledgerId: "", debit: "", credit: "" }])
              }
            >
              Add accounting line
            </Button>
          </div>
          <div className="accounting-form__wide voucher-form__inventory">
            <div className="voucher-form__section-heading">
              <div><Heading size="4">Inventory movements</Heading><Text size="2" color="gray">Optional stock movement details for this voucher.</Text></div>
              <span>{inventory.length} lines</span>
            </div>
            {inventory.map((line, index) => (
              <Flex
                className="voucher-form__line voucher-form__inventory-line"
                key={index}
                gap="2"
                mb="2"
              >
                <label>
                  Product
                  <AppSelect
                    value={line.productId}
                    onChange={(e) =>
                      setInventory(
                        inventory.map((x, i) =>
                          i === index ? { ...x, productId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select product</option>
                    {products
                      .filter((product) => !product.isService)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                  </AppSelect>
                </label>
                <label>
                  Warehouse
                  <AppSelect
                    value={line.warehouseId}
                    onChange={(e) =>
                      setInventory(
                        inventory.map((x, i) =>
                          i === index ? { ...x, warehouseId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select warehouse</option>
                    {(branchWarehouses.data ?? warehouses).map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label>
                  Direction
                  <AppSelect
                    value={line.direction}
                    onChange={(e) =>
                      setInventory(
                        inventory.map((x, i) =>
                          i === index
                            ? { ...x, direction: e.target.value as "IN" | "OUT" }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="IN">In</option>
                    <option value="OUT">Out</option>
                  </AppSelect>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={line.quantity}
                    onChange={(e) =>
                      setInventory(
                        inventory.map((x, i) =>
                          i === index ? { ...x, quantity: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Unit cost
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter unit cost"
                    value={line.unitCost}
                    onChange={(e) =>
                      setInventory(
                        inventory.map((x, i) =>
                          i === index ? { ...x, unitCost: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <Button
                  type="button"
                  size="1"
                  variant="ghost"
                  className="table-icon-button"
                  aria-label={`Remove inventory line ${index + 1}`}
                  onClick={() => setInventory(inventory.filter((_, lineIndex) => lineIndex !== index))}
                >
                  <TrashIcon className="table-action-icon" />
                </Button>
              </Flex>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setInventory([
                  ...inventory,
                  {
                    productId: "",
                    warehouseId: "",
                    quantity: "",
                    unitCost: "",
                    direction: "IN",
                  },
                ])
              }
            >
              Add inventory line
            </Button>
          </div>
          <div className="accounting-form__actions accounting-form__wide">
            <Button type="button" variant="outline" onClick={() => navigate(`/vouchers/${selected.path}`)}>Cancel</Button>
            <Button type="submit" loading={pending}>
              Save draft
            </Button>
          </div>
        </form>
      </Card>
    </Flex>
  );
}
function TransactionDetail() {
  const actionDialog = useActionDialog();
  const { transactionId } = useParams();
  const transaction = useTransaction(transactionId);
  const taxInvoice = useTaxInvoice(
    transactionId,
    Boolean(
      transaction.data?.transactionType === "SALE" &&
        Boolean(transaction.data.taxDetails) &&
        ["POSTED", "REVERSED"].includes(transaction.data.status),
    ),
  );
  const post = usePostVoucher();
  const reverse = useReverseVoucher();
  const submit = useSubmitTransaction();
  const approve = useApproveTransaction();
  const duplicate = useCreateVoucherDraft();
  const navigate = useNavigate();
  const { session } = useAuth();
  if (transaction.isLoading) {
    return (
      <LoadingScreen
        fullScreen={false}
        label="Loading voucher"
        description="Retrieving voucher details…"
      />
    );
  }
  if (!transaction.data) return <Text color="red">Transaction not found.</Text>;
  const item = transaction.data;
  const voucherPath =
    types.find((type) => type.value === item.transactionType)?.path ??
    "journal";
  const totals = item.accountingEntries.reduce(
    (result, line) => ({
      debit: result.debit + Number(line.debit || 0),
      credit: result.credit + Number(line.credit || 0),
    }),
    { debit: 0, credit: 0 },
  );
  const accountingReady = areAccountingEntriesBalanced(item.accountingEntries);
  const taxTotalMatches = !item.taxDetails || Math.abs(totals.debit - item.taxDetails.totalAmount) < .005;
  const canMakeRegular = accountingReady && taxTotalMatches;
  const detailDate = voucherDate(item.transactionDate);
  const duplicateVoucher = async () => {
    const draft = await duplicate.mutateAsync({
      type: item.transactionType as VoucherTransactionType,
      input: {
        transactionDate: item.transactionDate,
        narration: item.narration,
        taxDetails: item.taxDetails ?? undefined,
        accountingEntries: item.accountingEntries,
        inventoryEntries: item.inventoryEntries,
      },
    });
    navigate(`/vouchers/transactions/${draft.id}/edit`);
  };
  return (
    <Flex direction="column" gap="0" className="voucher-receipt">
      <div className="voucher-detail__header">
        <div className="voucher-receipt__identity">
          <Text className="voucher-receipt__brand">Ledgerly</Text>
          <Text className="voucher-receipt__eyebrow">Voucher receipt</Text>
        </div>
        <div className="voucher-receipt__title">
          <Heading size="7">
            {formatVoucherType(item.transactionType)} voucher
          </Heading>
          <Text color="gray">
            {item.voucherNumber ?? "Draft"}
          </Text>
        </div>
        <div className="voucher-receipt__header-actions">
          <Text className="voucher-receipt__date">
            {detailDate.bs} BS
          </Text>
          <Flex gap="2" justify="end">
            <Button variant="outline" onClick={() => window.print()}>Print</Button>
            <Button variant="outline" loading={duplicate.isPending} onClick={() => void duplicateVoucher()}>Duplicate</Button>
            <Button variant="outline" onClick={() => navigate(`/vouchers/${voucherPath}`)}>Back</Button>
          </Flex>
        </div>
      </div>
      <Card size="3" className="voucher-detail__summary">
        <div>
          <span>Voucher status</span>
          <strong className={`voucher-status voucher-status--${item.status.toLowerCase()}`}>{formatVoucherStatus(item.status)}</strong>
        </div>
        <div><span>BS date</span><strong>{detailDate.bs}</strong></div>
        <div><span>Voucher amount</span><strong>Rs. {formatAmount(totals.debit)}</strong></div>
        <div><span>Accounting lines</span><strong>{item.accountingEntries.length}</strong></div>
      </Card>
      {item.taxDetails && !taxInvoice.data ? (
        <Card size="3" className="voucher-tax-invoice">
          <Flex justify="between" align="start" gap="3" wrap="wrap">
            <div>
              <Text className="voucher-tax-invoice__eyebrow">Tax invoice details</Text>
              <Heading size="5">Pending official invoice number</Heading>
              <Text size="2" color="gray">The final tax invoice is issued when this voucher is made regular.</Text>
            </div>
            <div className="voucher-tax-invoice__amounts">
              <span>Taxable Rs. {item.taxDetails.taxableAmount.toFixed(2)}</span>
              <span>VAT {item.taxDetails.vatRate}%: Rs. {item.taxDetails.vatAmount.toFixed(2)}</span>
              <strong>Total Rs. {item.taxDetails.totalAmount.toFixed(2)}</strong>
            </div>
          </Flex>
          {item.taxDetails.customerName || item.taxDetails.customerPan ? <Text mt="3" size="2">Customer: {item.taxDetails.customerName ?? "—"}{item.taxDetails.customerPan ? ` · PAN ${item.taxDetails.customerPan}` : ""}</Text> : null}
        </Card>
      ) : null}
      {taxInvoice.data ? (
        <Card size="3" className="voucher-tax-invoice">
          <Flex justify="between" align="start" gap="3" wrap="wrap">
            <div>
              <Text className="voucher-tax-invoice__eyebrow">Nepal VAT tax invoice</Text>
              <Heading size="5">{taxInvoice.data.number}</Heading>
              <Text size="2" color="gray">Company PAN {taxInvoice.data.companyPan} · VAT {taxInvoice.data.companyVatNumber}</Text>
            </div>
            <div className="voucher-tax-invoice__amounts">
              <span>Taxable Rs. {taxInvoice.data.taxableAmount.toFixed(2)}</span>
              <span>VAT {taxInvoice.data.vatRate}%: Rs. {taxInvoice.data.vatAmount.toFixed(2)}</span>
              <strong>Total Rs. {taxInvoice.data.totalAmount.toFixed(2)}</strong>
            </div>
          </Flex>
          {taxInvoice.data.customerName || taxInvoice.data.customerPan ? <Text mt="3" size="2">Customer: {taxInvoice.data.customerName ?? "—"}{taxInvoice.data.customerPan ? ` · PAN ${taxInvoice.data.customerPan}` : ""}</Text> : null}
        </Card>
      ) : null}
      <Card size="3" className="voucher-detail__section">
        <Heading size="4">Accounting entries</Heading>
        {item.accountingEntries.length ? <table className="accounting-table voucher-detail__entries"><thead><tr><th>Ledger</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{item.accountingEntries.map((line, index) => <tr key={index}><td>{line.ledgerId}</td><td>{Number(line.debit || 0).toFixed(2)}</td><td>{Number(line.credit || 0).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><th>Total</th><th>{totals.debit.toFixed(2)}</th><th>{totals.credit.toFixed(2)}</th></tr></tfoot></table> : <Text color="gray">No accounting entries yet. Add balanced debit and credit entries before making this voucher regular.</Text>}
      </Card>
      <Card size="3" className="voucher-detail__section">
        <Heading size="4">Inventory movements</Heading>
        {item.inventoryEntries.length ? <table className="accounting-table voucher-detail__entries"><thead><tr><th>Direction</th><th>Quantity</th><th>Unit cost</th></tr></thead><tbody>{item.inventoryEntries.map((line, index) => <tr key={index}><td>{line.direction}</td><td>{line.quantity}</td><td>{Number(line.unitCost || 0).toFixed(2)}</td></tr>)}</tbody></table> : <Text color="gray">No inventory movements.</Text>}
      </Card>
      <Card size="2" className="voucher-detail__audit">
        <Heading size="4">Audit timeline</Heading>
        <Text as="p" color="gray">Created {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</Text>
        <Text as="p" color="gray">Last updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}</Text>
        {item.postedAt ? <Text as="p" color="gray">Made regular {new Date(item.postedAt).toLocaleString()}</Text> : null}
      </Card>
      <VoucherAttachments transactionId={item.id} />
      {item.status === "DRAFT" ? (
        <Flex direction="column" gap="2">
          {submit.error instanceof Error ? <Text color="red" role="alert">{submit.error.message}</Text> : null}
          {post.error instanceof Error ? (
            <Text color="red" role="alert">
              {post.error.message}
            </Text>
          ) : null}
          {!canMakeRegular ? <Text color="red" role="alert">Edit this draft before posting: every accounting row must use one side, totals must balance, and the journal total must match the tax invoice total.</Text> : null}
          <Flex gap="2">
            <Button
              variant="outline"
              onClick={() => navigate(`/vouchers/transactions/${item.id}/edit`)}
            >
              Edit draft
            </Button>
            <Button
              loading={post.isPending}
              disabled={!canMakeRegular}
              onClick={async () => {
                if (await actionDialog.confirm({
                  title: "Make voucher regular?",
                  description: "This will record the voucher in the accounts and inventory, assign its final number, and prevent normal editing.",
                  confirmLabel: "Make regular",
                })) {
                  post.mutate({
                    id: item.id,
                    type: item.transactionType as VoucherTransactionType,
                  });
                }
              }}
            >
              Make regular
            </Button>
            <Button variant="outline" loading={submit.isPending} disabled={!canMakeRegular} onClick={() => submit.mutate(item.id)}>
              Submit for approval
            </Button>
          </Flex>
        </Flex>
      ) : null}
      {item.status === "SUBMITTED" ? (
        <Flex direction="column" gap="2">
          <Text color="gray">Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : ""}. This voucher is read-only until approved.</Text>
          {["OWNER", "ADMIN"].includes(session?.activeMembership?.role ?? "") ? (
              <Button loading={approve.isPending} onClick={() => approve.mutate(item.id)}>Approve transaction</Button>
          ) : null}
          {approve.error instanceof Error ? <Text color="red" role="alert">{approve.error.message}</Text> : null}
        </Flex>
      ) : null}
      {item.status === "APPROVED" ? (
        <Flex direction="column" gap="2">
          <Text color="gray">Approved {item.approvedAt ? new Date(item.approvedAt).toLocaleString() : ""}. Ready to make regular.</Text>
          <Button loading={post.isPending} disabled={!canMakeRegular} onClick={async () => { if (await actionDialog.confirm({ title: "Make approved voucher regular?", description: "This will record the voucher in the accounts and inventory, assign its final number, and prevent normal editing.", confirmLabel: "Make regular" })) post.mutate({ id: item.id, type: item.transactionType as VoucherTransactionType }); }}>Make regular</Button>
        </Flex>
      ) : null}
      {item.status === "POSTED" && !item.reversedById ? (
        <Button
          variant="outline"
          onClick={async () => {
            if (await actionDialog.confirm({
              title: "Reverse voucher?",
              description: "A reversing entry will be created for this regular voucher. This action cannot be undone.",
              confirmLabel: "Reverse voucher",
              destructive: true,
            }))
              void reverse.mutateAsync({
                id: item.id,
                type: item.transactionType as VoucherTransactionType,
              });
          }}
        >
          Reverse transaction
        </Button>
      ) : null}
      {actionDialog.dialog}
    </Flex>
  );
}

function VoucherAttachments({ transactionId }: { transactionId: string }) {
  const attachments = useAttachments("transaction", transactionId);
  const upload = useUploadAttachment();
  const remove = useDeleteAttachment();
  const [file, setFile] = useState<File | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    await upload.mutateAsync({ file, entityType: "transaction", entityId: transactionId });
    setFile(null);
    await attachments.refetch();
  }

  return (
    <section className="voucher-detail__attachments">
      <Heading size="4">Attachments</Heading>
      <form className="voucher-attachments__form" onSubmit={(event) => void submit(event)}>
        <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <Button type="submit" variant="outline" disabled={!file} loading={upload.isPending}>Add attachment</Button>
      </form>
      {upload.error || remove.error ? <Text color="red" role="alert">The attachment could not be updated.</Text> : null}
      {attachments.data?.length ? <div className="voucher-attachments__list">{attachments.data.map((attachment) => <div key={attachment.id} className="voucher-attachments__item"><a href={attachment.url} target="_blank" rel="noreferrer">{attachment.fileName}</a><Flex gap="2"><Button size="1" variant="outline" onClick={() => void mastersApi.attachmentDownload(attachment.id).then((download) => { if (download.url) window.open(download.url, "_blank", "noopener,noreferrer"); })}>Download</Button><Button size="1" variant="ghost" loading={remove.isPending} onClick={() => void remove.mutateAsync(attachment.id).then(() => attachments.refetch())}>Remove</Button></Flex></div>)}</div> : <Text color="gray">No attachments.</Text>}
    </section>
  );
}
export function TransactionEditPage() {
  const { transactionId } = useParams();
  const transaction = useTransaction(transactionId);
  const update = useUpdateVoucherDraft();
  const navigate = useNavigate();
  const ledgers = useLedgers({ isActive: true });
  const products = useProducts();
  const warehouses = useWarehouses();
  const branches = useBranches();
  const vat = useVat();
  const pan = usePan();
  const [accounting, setAccounting] = useState<
    Array<{ ledgerId: string; debit: number; credit: number }>
  | null>(null);
  const [inventory, setInventory] = useState<
    Array<{
      productId: string;
      warehouseId: string;
      quantity: number;
      direction: "IN" | "OUT";
      unitCost: number;
    }>
  | null>(null);
  const [transactionDate, setTransactionDate] = useState("");
  const [branchId, setBranchId] = useState("");
  const [includeTaxInvoice, setIncludeTaxInvoice] = useState<boolean | null>(null);
  const [tax, setTax] = useState<{ customerName: string; customerPan: string; amount: string; vatRate: string; mode: TaxDetails["mode"] } | null>(null);
  if (transaction.isLoading) {
    return (
      <LoadingScreen
        fullScreen={false}
        label="Loading voucher draft"
        description="Retrieving draft details…"
      />
    );
  }
  if (!transaction.data || transaction.data.status !== "DRAFT")
    return <Text color="red">Only draft transactions can be edited.</Text>;
  const draft = transaction.data;
  const effectiveTransactionDate = transactionDate || draft.transactionDate;
  const effectiveBranchId = branchId || draft.branchId || "";
  const lines = accounting ?? draft.accountingEntries;
  const stock = inventory ?? draft.inventoryEntries;
  const canIssueTaxInvoice = Boolean(vat.data?.vatRegistered && vat.data.vatNumber && pan.data?.panNumber);
  const effectiveIncludeTaxInvoice = includeTaxInvoice ?? Boolean(draft.taxDetails);
  const effectiveTax = tax ?? {
    customerName: draft.taxDetails?.customerName ?? "",
    customerPan: draft.taxDetails?.customerPan ?? "",
    amount: draft.taxDetails ? String(draft.taxDetails.mode === "INCLUSIVE" ? draft.taxDetails.totalAmount : draft.taxDetails.taxableAmount) : "",
    vatRate: String(draft.taxDetails?.vatRate ?? vat.data?.defaultVatRate ?? 13),
    mode: draft.taxDetails?.mode ?? vat.data?.vatMode ?? "EXCLUSIVE",
  };
  const calculatedTaxDetails = calculateVatDetails(Number(effectiveTax.amount || 0), Number(effectiveTax.vatRate || 0), effectiveTax.mode);
  const voucherPath = types.find((item) => item.value === draft.transactionType)?.path ?? "journal";
  const debitTotal = lines.reduce((total, line) => total + Number(line.debit || 0), 0);
  const creditTotal = lines.reduce((total, line) => total + Number(line.credit || 0), 0);
  const isBalanced = areAccountingEntriesBalanced(lines);
  const taxMatchesAccounting = !effectiveIncludeTaxInvoice || Math.abs(debitTotal - calculatedTaxDetails.totalAmount) < .005;
  return (
    <Flex direction="column" gap="5">
      <CrudPageHeader
        title={`Edit ${formatVoucherType(draft.transactionType)} voucher`}
        description={`Update ${draft.voucherNumber ?? "this draft"} before it is made regular.`}
        action={<Button variant="outline" onClick={() => navigate(`/vouchers/${voucherPath}`)}>Back to vouchers</Button>}
      />
      {update.error ? (
        <Text color="red" role="alert">The draft could not be updated.</Text>
      ) : null}
      <Card size="3" className="voucher-form-card">
        <form
          className="accounting-form voucher-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void update
              .mutateAsync({
                type: draft.transactionType as VoucherTransactionType,
                id: draft.id,
                input: {
                  transactionDate: effectiveTransactionDate,
                  branchId: effectiveBranchId || undefined,
                  narration: String(form.get("narration") || "") || null,
                  ...(draft.transactionType === "SALE" ? {
                    taxDetails: effectiveIncludeTaxInvoice ? {
                      customerName: effectiveTax.customerName || null,
                      customerPan: effectiveTax.customerPan || null,
                      ...calculatedTaxDetails,
                    } : null,
                  } : {}),
                  accountingEntries: lines.filter((line) => line.ledgerId),
                  inventoryEntries: stock.filter(
                    (line) => line.productId && line.warehouseId,
                  ),
                },
              })
              .then(() => navigate(`/vouchers/transactions/${draft.id}`));
          }}
        >
          <NepalDateField
            value={effectiveTransactionDate}
            onChange={setTransactionDate}
          />
          <label>Branch<AppSelect value={effectiveBranchId} onChange={(event) => setBranchId(event.target.value)}><option value="">Select branch (default)</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label>
          <label className="accounting-form__wide">
            Narration
            <textarea
              name="narration"
              rows={3}
              defaultValue={draft.narration ?? ""}
              placeholder="Add a brief description"
            />
          </label>
          {draft.transactionType === "SALE" ? (
            <div className="accounting-form__wide voucher-tax">
              <Flex justify="between" align="center" gap="3" wrap="wrap">
                <div><Heading size="4">Tax invoice</Heading><Text size="2" color="gray">Review or change the tax treatment before posting.</Text></div>
                <label className="voucher-tax__toggle"><input type="checkbox" checked={effectiveIncludeTaxInvoice} disabled={!canIssueTaxInvoice && !effectiveIncludeTaxInvoice} onChange={(event) => setIncludeTaxInvoice(event.target.checked)} /> Issue tax invoice</label>
              </Flex>
              {!canIssueTaxInvoice ? <Text size="2" color="amber">Complete the company PAN and VAT registration settings before issuing this invoice.</Text> : null}
              {effectiveIncludeTaxInvoice ? (
                <div className="voucher-tax__grid">
                  <label>Customer name<input value={effectiveTax.customerName} onChange={(event) => setTax({ ...effectiveTax, customerName: event.target.value })} placeholder="Enter customer name" /></label>
                  <label>Customer PAN<input value={effectiveTax.customerPan} onChange={(event) => setTax({ ...effectiveTax, customerPan: event.target.value.replace(/\D/g, "").slice(0, 9) })} inputMode="numeric" placeholder="Optional 9-digit PAN" /></label>
                  <label>{effectiveTax.mode === "INCLUSIVE" ? "Invoice amount (VAT included)" : "Taxable amount (before VAT)"}<input type="number" min="0.01" step="0.01" required value={effectiveTax.amount} onChange={(event) => setTax({ ...effectiveTax, amount: event.target.value })} /></label>
                  <label>VAT rate (%)<input type="number" min="0" max="100" step="0.01" required value={effectiveTax.vatRate} onChange={(event) => setTax({ ...effectiveTax, vatRate: event.target.value })} /></label>
                  <label>VAT mode<AppSelect value={effectiveTax.mode} onChange={(event) => setTax({ ...effectiveTax, mode: event.target.value as TaxDetails["mode"] })}><option value="EXCLUSIVE">Exclusive</option><option value="INCLUSIVE">Inclusive</option></AppSelect></label>
                  <div className="voucher-tax__totals"><span>Taxable: Rs. {calculatedTaxDetails.taxableAmount.toFixed(2)}</span><span>VAT: Rs. {calculatedTaxDetails.vatAmount.toFixed(2)}</span><strong>Total: Rs. {calculatedTaxDetails.totalAmount.toFixed(2)}</strong></div>
                  <Text size="2" color="gray">Tally-style posting: debit Party/Cash for the total, credit Sales for the taxable amount, and credit VAT Payable for VAT.</Text>
                  {!taxMatchesAccounting ? <Text size="2" color="red" role="alert">The accounting debit total must equal the tax invoice total of Rs. {calculatedTaxDetails.totalAmount.toFixed(2)}.</Text> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="accounting-form__wide voucher-form__accounting">
            <div className="voucher-form__section-heading">
              <div><Heading size="4">Accounting entries</Heading><Text size="2" color="gray">Keep total debit and credit equal.</Text></div>
              <span>{lines.length} lines</span>
            </div>
            {lines.map((line, index) => (
              <Flex className="voucher-form__line" key={index} gap="2" mb="2">
                <label>
                  Ledger
                  <AppSelect
                    value={line.ledgerId}
                    onChange={(e) =>
                      setAccounting(
                        lines.map((x, i) =>
                          i === index ? { ...x, ledgerId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select ledger</option>
                    {ledgers.data?.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label>
                  Debit
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter debit amount"
                    value={line.debit}
                    onChange={(e) =>
                      setAccounting(
                        lines.map((x, i) =>
                          i === index
                            ? { ...x, debit: Number(e.target.value), ...(Number(e.target.value) > 0 ? { credit: 0 } : {}) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Credit
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter credit amount"
                    value={line.credit}
                    onChange={(e) =>
                      setAccounting(
                        lines.map((x, i) =>
                          i === index
                            ? { ...x, credit: Number(e.target.value), ...(Number(e.target.value) > 0 ? { debit: 0 } : {}) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <Button type="button" size="1" variant="ghost" className="table-icon-button" aria-label={`Remove accounting line ${index + 1}`} disabled={lines.length <= 2} onClick={() => setAccounting(lines.filter((_, lineIndex) => lineIndex !== index))}>
                  <TrashIcon className="table-action-icon" />
                </Button>
              </Flex>
            ))}
            <div className={`voucher-entry-summary${isBalanced ? " is-balanced" : ""}`}>
              <span>Debit <strong>Rs. {formatAmount(debitTotal)}</strong></span>
              <span>Credit <strong>Rs. {formatAmount(creditTotal)}</strong></span>
              <span className="voucher-entry-summary__balance">{isBalanced ? "Balanced" : lines.some((line) => line.ledgerId && Number(line.debit || 0) > 0 && Number(line.credit || 0) > 0) ? "Use debit or credit on each row—not both" : `Difference Rs. ${formatAmount(Math.abs(debitTotal - creditTotal))}`}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setAccounting([...lines, { ledgerId: "", debit: 0, credit: 0 }])
              }
            >
              Add accounting line
            </Button>
          </div>
          <div className="accounting-form__wide voucher-form__inventory">
            <div className="voucher-form__section-heading">
              <div><Heading size="4">Inventory movements</Heading><Text size="2" color="gray">Optional stock movement details.</Text></div>
              <span>{stock.length} lines</span>
            </div>
            {stock.map((line, index) => (
              <Flex
                className="voucher-form__line voucher-form__inventory-line"
                key={index}
                gap="2"
                mb="2"
              >
                <label>
                  Product
                  <AppSelect
                    value={line.productId}
                    onChange={(e) =>
                      setInventory(
                        stock.map((x, i) =>
                          i === index ? { ...x, productId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select product</option>
                    {products.data
                      ?.filter((product) => !product.isService)
                      .map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                  </AppSelect>
                </label>
                <label>
                  Warehouse
                  <AppSelect
                    value={line.warehouseId}
                    onChange={(e) =>
                      setInventory(
                        stock.map((x, i) =>
                          i === index ? { ...x, warehouseId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.data?.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </AppSelect>
                </label>
                <label>
                  Direction
                  <AppSelect
                    value={line.direction}
                    onChange={(e) =>
                      setInventory(
                        stock.map((x, i) =>
                          i === index
                            ? { ...x, direction: e.target.value as "IN" | "OUT" }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="IN">In</option>
                    <option value="OUT">Out</option>
                  </AppSelect>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter quantity"
                    value={line.quantity}
                    onChange={(e) =>
                      setInventory(
                        stock.map((x, i) =>
                          i === index
                            ? { ...x, quantity: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Unit cost
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter unit cost"
                    value={line.unitCost}
                    onChange={(e) =>
                      setInventory(
                        stock.map((x, i) =>
                          i === index
                            ? { ...x, unitCost: Number(e.target.value) }
                            : x,
                        ),
                      )
                    }
                  />
                </label>
                <Button type="button" size="1" variant="ghost" className="table-icon-button" aria-label={`Remove inventory line ${index + 1}`} onClick={() => setInventory(stock.filter((_, lineIndex) => lineIndex !== index))}>
                  <TrashIcon className="table-action-icon" />
                </Button>
              </Flex>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setInventory([
                  ...stock,
                  {
                    productId: "",
                    warehouseId: "",
                    direction: "IN",
                    quantity: 0,
                    unitCost: 0,
                  },
                ])
              }
            >
              Add inventory line
            </Button>
          </div>
          <div className="accounting-form__actions accounting-form__wide">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/vouchers/transactions/${draft.id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </Flex>
  );
}
