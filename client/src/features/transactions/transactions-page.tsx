import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../../components/loading-screen";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { useLedgers } from "../accounting/use-accounting";
import {
  useCreateVoucherDraft,
  usePostVoucher,
  useReverseTransaction,
  useTransaction,
  useUpdateVoucherDraft,
  useVoucherTransactions,
} from "./use-transactions";
import { useProducts, useWarehouses } from "../masters/use-masters";
import type { VoucherTransactionType } from "./transactions-api";

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

export function TransactionsPage({
  drafts = false,
  create = false,
}: {
  drafts?: boolean;
  create?: boolean;
}) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(drafts ? "DRAFT" : "");
  const [type, setType] = useState("JOURNAL");
  const { transactionId, voucherType } = useParams();
  const routeType = types.find((item) => item.path === voucherType);
  const list = useVoucherTransactions(routeType?.value, {
    page,
    status: status || undefined,
  });
  const post = usePostVoucher();
  const reverse = useReverseTransaction();
  const ledgers = useLedgers({ isActive: true });
  const createDraft = useCreateVoucherDraft();
  const products = useProducts();
  const warehouses = useWarehouses();
  if (transactionId) return <TransactionDetail />;
  if (create && (ledgers.isLoading || products.isLoading || warehouses.isLoading)) {
    return (
      <Flex direction="column" gap="5">
        <Heading size="7">New {formatVoucherType(routeType?.value ?? type)} voucher</Heading>
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
        type={routeType?.value ?? type}
        setType={setType}
        ledgers={ledgers.data ?? []}
        products={products.data ?? []}
        warehouses={warehouses.data ?? []}
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
      <Flex justify="between">
        <div>
          <Heading size="7">
            {drafts
              ? "Drafts"
              : routeType
                ? `${formatVoucherType(routeType.value)} vouchers`
                : "Transactions"}
          </Heading>
          <Text color="gray">
            Review and manage {routeType ? formatVoucherType(routeType.value).toLowerCase() : "company"} vouchers.
          </Text>
        </div>
        <Button
          onClick={() =>
            navigate(`/vouchers/${routeType?.path ?? "journal"}/new`)
          }
        >
          New{" "}
          {routeType
            ? routeType.value.toLowerCase().replaceAll("_", " ")
            : "journal"}{" "}
          voucher
        </Button>
      </Flex>
      <Card size="2" className="voucher-list__filters">
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
            <option value="POSTED">Posted</option>
            <option value="REVERSED">Reversed</option>
          </AppSelect>
        </label>
      </Card>
      {list.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading vouchers"
          description="Retrieving voucher transactions…"
        />
      ) : (
        <>
      <Card size="2" className="voucher-list__table">
        <table className="accounting-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Voucher</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.transactionDate).toLocaleDateString()}</td>
                <td>
                  <Link to={`/vouchers/transactions/${item.id}`}>
                    {item.voucherNumber ?? "Draft"}
                  </Link>
                </td>
                <td>
                  <span className={`voucher-status voucher-status--${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <Flex gap="2">
                    {item.status === "DRAFT" ? (
                      <Button
                        size="1"
                        onClick={() => {
                          if (window.confirm("Post this transaction?"))
                            void post.mutateAsync({
                              id: item.id,
                              type: item.transactionType as VoucherTransactionType,
                            });
                        }}
                      >
                        Post
                      </Button>
                    ) : null}
                    {item.status === "POSTED" && !item.reversedById ? (
                      <Button
                        size="1"
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm("Reverse this posted transaction?")
                          )
                            void reverse.mutateAsync(item.id);
                        }}
                      >
                        Reverse
                      </Button>
                    ) : null}
                  </Flex>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.data?.items.length ? (
          <Text color="gray">No transactions found.</Text>
        ) : null}
      </Card>
      {list.data?.meta.totalPages && list.data.meta.totalPages > 1 ? (
        <Flex justify="between">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Text>
            Page {page} of {list.data.meta.totalPages}
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
      )}
    </Flex>
  );
}
function DraftForm({
  type,
  setType,
  ledgers,
  products,
  warehouses,
  pending,
  error,
  onSave,
}: {
  type: string;
  setType: (value: string) => void;
  ledgers: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; isService: boolean }>;
  warehouses: Array<{ id: string; name: string }>;
  pending: boolean;
  error?: string;
  onSave: (input: any) => Promise<void>;
}) {
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
  >([]);
  const selected = types.find((item) => item.value === type)!;
  const voucherLabel = selected.value.toLowerCase().replaceAll("_", " ");
  return (
    <Flex direction="column" gap="5">
      <Heading size="7">New {voucherLabel} voucher</Heading>
      <Card size="3" className="voucher-form-card">
        <form
          className="accounting-form voucher-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void onSave({
              transactionType: type,
              voucherType: selected.voucher,
              transactionDate: form.get("transactionDate"),
              narration: form.get("narration") || null,
              items: [],
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
          <label>
            Transaction type
            <AppSelect value={type} onChange={(e) => setType(e.target.value)}>
              {types.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.value}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Date
            <input
              name="transactionDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
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
          <div className="accounting-form__wide voucher-form__accounting">
            <Heading size="4">Accounting entries</Heading>
            {lines.map((line, index) => (
              <Flex className="voucher-form__line" key={index} gap="2" mb="2">
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
                <input
                  type="number"
                  min="0"
                  placeholder="Debit"
                  value={line.debit}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, i) =>
                        i === index ? { ...x, debit: e.target.value } : x,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Credit"
                  value={line.credit}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, i) =>
                        i === index ? { ...x, credit: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Flex>
            ))}
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
            <Heading size="4">Inventory movements</Heading>
            {inventory.map((line, index) => (
              <Flex
                className="voucher-form__line voucher-form__inventory-line"
                key={index}
                gap="2"
                mb="2"
              >
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
                  <option value="">Product</option>
                  {products
                    .filter((product) => !product.isService)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </AppSelect>
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
                  <option value="">Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </AppSelect>
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
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity"
                  value={line.quantity}
                  onChange={(e) =>
                    setInventory(
                      inventory.map((x, i) =>
                        i === index ? { ...x, quantity: e.target.value } : x,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Unit cost"
                  value={line.unitCost}
                  onChange={(e) =>
                    setInventory(
                      inventory.map((x, i) =>
                        i === index ? { ...x, unitCost: e.target.value } : x,
                      ),
                    )
                  }
                />
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
          <div className="accounting-form__actions accounting-form__wide voucher-form__actions">
            <Button type="submit" loading={pending}>
              Save voucher
            </Button>
          </div>
        </form>
      </Card>
    </Flex>
  );
}
function TransactionDetail() {
  const { transactionId } = useParams();
  const transaction = useTransaction(transactionId);
  const post = usePostVoucher();
  const reverse = useReverseTransaction();
  const duplicate = useCreateVoucherDraft();
  const navigate = useNavigate();
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
  const duplicateVoucher = async () => {
    const draft = await duplicate.mutateAsync({
      type: item.transactionType as VoucherTransactionType,
      input: {
        transactionDate: item.transactionDate.slice(0, 10),
        narration: item.narration,
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
            {new Date(item.transactionDate).toLocaleDateString()}
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
          <strong className={`voucher-status voucher-status--${item.status.toLowerCase()}`}>{item.status}</strong>
        </div>
      </Card>
      <Card size="3" className="voucher-detail__section">
        <Heading size="4">Accounting entries</Heading>
        {item.accountingEntries.length ? <table className="accounting-table voucher-detail__entries"><thead><tr><th>Ledger</th><th>Debit</th><th>Credit</th></tr></thead><tbody>{item.accountingEntries.map((line, index) => <tr key={index}><td>{line.ledgerId}</td><td>{Number(line.debit || 0).toFixed(2)}</td><td>{Number(line.credit || 0).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><th>Total</th><th>{totals.debit.toFixed(2)}</th><th>{totals.credit.toFixed(2)}</th></tr></tfoot></table> : <Text color="gray">No accounting entries yet. Add balanced debit and credit entries before posting.</Text>}
      </Card>
      <Card size="3" className="voucher-detail__section">
        <Heading size="4">Inventory movements</Heading>
        {item.inventoryEntries.length ? <table className="accounting-table voucher-detail__entries"><thead><tr><th>Direction</th><th>Quantity</th><th>Unit cost</th></tr></thead><tbody>{item.inventoryEntries.map((line, index) => <tr key={index}><td>{line.direction}</td><td>{line.quantity}</td><td>{Number(line.unitCost || 0).toFixed(2)}</td></tr>)}</tbody></table> : <Text color="gray">No inventory movements.</Text>}
      </Card>
      <Card size="2" className="voucher-detail__audit">
        <Heading size="4">Audit timeline</Heading>
        <Text as="p" color="gray">Created {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</Text>
        <Text as="p" color="gray">Last updated {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "—"}</Text>
        {item.postedAt ? <Text as="p" color="gray">Posted {new Date(item.postedAt).toLocaleString()}</Text> : null}
      </Card>
      {item.status === "DRAFT" ? (
        <Flex direction="column" gap="2">
          {post.error instanceof Error ? (
            <Text color="red" role="alert">
              {post.error.message}
            </Text>
          ) : null}
          <Flex gap="2">
            <Button
              variant="outline"
              onClick={() => navigate(`/vouchers/transactions/${item.id}/edit`)}
            >
              Edit draft
            </Button>
            <Button
              loading={post.isPending}
              onClick={() => {
                void post.mutateAsync({
                  id: item.id,
                  type: item.transactionType as VoucherTransactionType,
                });
              }}
            >
              Post transaction
            </Button>
          </Flex>
        </Flex>
      ) : null}
      {item.status === "POSTED" && !item.reversedById ? (
        <Button
          variant="outline"
          onClick={() => {
            if (window.confirm("Reverse this posted transaction?"))
              void reverse.mutateAsync(item.id);
          }}
        >
          Reverse transaction
        </Button>
      ) : null}
    </Flex>
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
  const [accounting, setAccounting] = useState<
    Array<{ ledgerId: string; debit: number; credit: number }>
  >([]);
  const [inventory, setInventory] = useState<
    Array<{
      productId: string;
      warehouseId: string;
      quantity: number;
      direction: "IN" | "OUT";
      unitCost: number;
    }>
  >([]);
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
  const lines = accounting.length ? accounting : draft.accountingEntries;
  const stock = inventory.length ? inventory : draft.inventoryEntries;
  return (
    <Flex direction="column" gap="5">
      <Heading size="7">
        Edit {formatVoucherType(draft.transactionType)} voucher
      </Heading>
      {update.error ? (
        <Text color="red">The draft could not be updated.</Text>
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
                  transactionDate: String(form.get("transactionDate") || ""),
                  narration: String(form.get("narration") || "") || null,
                  accountingEntries: lines.filter((line) => line.ledgerId),
                  inventoryEntries: stock.filter(
                    (line) => line.productId && line.warehouseId,
                  ),
                },
              })
              .then(() => navigate(`/vouchers/transactions/${draft.id}`));
          }}
        >
          <label>
            Date
            <input
              name="transactionDate"
              type="date"
              defaultValue={draft.transactionDate.slice(0, 10)}
              required
            />
          </label>
          <label className="accounting-form__wide">
            Narration
            <textarea
              name="narration"
              rows={3}
              defaultValue={draft.narration ?? ""}
            />
          </label>
          <div className="accounting-form__wide voucher-form__accounting">
            <Heading size="4">Accounting entries</Heading>
            {lines.map((line, index) => (
              <Flex className="voucher-form__line" key={index} gap="2" mb="2">
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
                  <option value="">Ledger</option>
                  {ledgers.data?.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                </AppSelect>
                <input
                  type="number"
                  value={line.debit}
                  onChange={(e) =>
                    setAccounting(
                      lines.map((x, i) =>
                        i === index
                          ? { ...x, debit: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  value={line.credit}
                  onChange={(e) =>
                    setAccounting(
                      lines.map((x, i) =>
                        i === index
                          ? { ...x, credit: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
              </Flex>
            ))}
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
            <Heading size="4">Inventory movements</Heading>
            {stock.map((line, index) => (
              <Flex
                className="voucher-form__line voucher-form__inventory-line"
                key={index}
                gap="2"
                mb="2"
              >
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
                  <option value="">Product</option>
                  {products.data
                    ?.filter((product) => !product.isService)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                </AppSelect>
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
                  <option value="">Warehouse</option>
                  {warehouses.data?.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </AppSelect>
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
                <input
                  type="number"
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
                <input
                  type="number"
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
          <div className="accounting-form__actions accounting-form__wide voucher-form__actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/vouchers/transactions/${draft.id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={update.isPending}>
              Save voucher
            </Button>
          </div>
        </form>
      </Card>
    </Flex>
  );
}
