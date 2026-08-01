import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Cross2Icon, CubeIcon, FilePlusIcon, LockClosedIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Card, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CrudPageHeader, CrudPageState, requestMessage } from "../../components/crud-page";
import { useActionDialog } from "../../components/action-dialog";
import { OrderActionsMenu } from "../../components/order-actions-menu";
import { Button } from "../../components/ui/button";
import { NepaliDatePicker } from "../../components/ui/nepali-date-picker";
import { AppSelect } from "../../components/ui/select";
import { formatAdDate } from "../../lib/nepali-date";
import { useBranches, useBranchWarehouses } from "../enterprise/use-enterprise";
import { useContacts, useProducts } from "../masters/use-masters";
import { purchaseOrdersApi, type PurchaseOrder, type PurchaseOrderInput } from "./purchase-orders-api";

const purchaseKeys = { all: ["purchase-orders"] as const, list: (branchId: string) => ["purchase-orders", "list", branchId] as const };

function PurchaseOrderForm({ order }: { order?: PurchaseOrder }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [branchId, setBranchId] = useState(order?.branchId ?? "");
  const [contactId, setContactId] = useState(order?.contactId ?? "");
  const [productId, setProductId] = useState(order?.items[0]?.productId ?? "");
  const [orderDate, setOrderDate] = useState(order?.orderDate.slice(0, 10) ?? formatAdDate(new Date()));
  const branches = useBranches();
  const contacts = useContacts({ role: "SUPPLIER", page: 1, isActive: "true" });
  const products = useProducts();
  const create = useMutation({ mutationFn: purchaseOrdersApi.create });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: PurchaseOrderInput }) => purchaseOrdersApi.update(id, input) });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: PurchaseOrderInput = { branchId, contactId, orderDate, items: [{ productId, quantity: Number(form.get("quantity")), unitPrice: Number(form.get("unitPrice")) }], notes: String(form.get("notes") || "") || undefined };
    try {
      if (order) await update.mutateAsync({ id: order.id, input });
      else await create.mutateAsync(input);
      await client.invalidateQueries({ queryKey: purchaseKeys.all });
      navigate("/purchase-orders", { replace: true });
    } catch { /* mutation state is rendered below */ }
  }

  const dependencyError = branches.error ?? contacts.error ?? products.error;
  return <Flex direction="column" gap="5"><CrudPageHeader title={order ? "Edit purchase order" : "Add purchase order"} description="Create and maintain supplier planning documents." /><CrudPageState loading={branches.isLoading || contacts.isLoading || products.isLoading} error={dependencyError} label="Loading purchase order" description="Preparing the purchase order form…"><Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Supplier<AppSelect value={contactId} onChange={(event) => setContactId(event.target.value)} required><option value="">Select supplier</option>{contacts.data?.items.map((contact) => <option key={contact.id} value={contact.id}>{contact.displayName || contact.name}</option>)}</AppSelect></label><label>Product<AppSelect value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select product</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</AppSelect></label><label>Order date (BS)<NepaliDatePicker name="orderDate" value={orderDate} onChange={setOrderDate} required ariaLabel="Choose purchase order date in Bikram Sambat" /></label><label>Quantity<input name="quantity" type="number" min="0.000001" step="any" defaultValue={order?.items[0]?.quantity} required /></label><label>Unit price<input name="unitPrice" type="number" min="0" step="any" defaultValue={order?.items[0]?.unitPrice} required /></label><label className="accounting-form__wide">Notes<textarea name="notes" defaultValue={order?.notes ?? ""} /></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")}>Cancel</Button><Button type="submit" disabled={!branchId || !contactId || !productId || !orderDate} loading={create.isPending || update.isPending}>{order ? "Save purchase order" : "Create purchase order"}</Button></div></form>{create.error || update.error ? <Text color="red" role="alert">{requestMessage(create.error || update.error)}</Text> : null}</Card></CrudPageState></Flex>;
}

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const actionDialog = useActionDialog();
  const { orderId } = useParams();
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("all");
  const orders = useQuery({ queryKey: purchaseKeys.list(branchId), queryFn: ({ signal }) => purchaseOrdersApi.list(branchId || undefined, signal) });
  const branches = useBranches();
  const selected = orderId ? orders.data?.items.find((order) => order.id === orderId) : undefined;
  const changeStatus = useMutation({ mutationFn: ({ id, status: nextStatus }: { id: string; status: "CONFIRMED" | "CANCELLED" }) => purchaseOrdersApi.updateStatus(id, nextStatus), onSuccess: () => client.invalidateQueries({ queryKey: purchaseKeys.all }) });
  const close = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => purchaseOrdersApi.close(id, reason), onSuccess: () => client.invalidateQueries({ queryKey: purchaseKeys.all }) });
  const convert = useMutation({ mutationFn: purchaseOrdersApi.createVoucherDraft, onSuccess: (draft) => navigate(`/vouchers/transactions/${draft.id}/edit`) });

  if (orderId) return <CrudPageState loading={orders.isLoading} error={orders.error} label="Loading purchase order" description="Retrieving purchase order details…">{selected ? <PurchaseOrderForm order={selected} /> : <Text color="red" role="alert">The purchase order was not found.</Text>}</CrudPageState>;
  const filtered = orders.data?.items.filter((order) => status === "all" || order.status === status) ?? [];
  const actionError = changeStatus.error ?? close.error ?? convert.error;
  return (
    <Flex direction="column" gap="5">
      <CrudPageHeader title="Purchase orders" description="Planning documents only; purchase orders do not affect inventory or accounting." action={<Button onClick={() => navigate("/purchase-orders/new")}>Add purchase order</Button>} />
      <Card size="3"><div className="accounting-filters"><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Status<AppSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="DRAFT">Draft</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="CLOSED">Closed</option></AppSelect></label></div></Card>
      {actionError ? <Text color="red" role="alert">{requestMessage(actionError)}</Text> : null}
      <CrudPageState loading={orders.isLoading || branches.isLoading} error={orders.error ?? branches.error} label="Loading purchase orders" description="Retrieving your purchase orders…">
        <Card size="3" className="accounting-table-card order-actions-table">
          <table className="accounting-table">
            <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Items</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((order) => {
                const pending = changeStatus.isPending || close.isPending || convert.isPending;
                const actions = order.status === "DRAFT" ? [
                  { label: "Edit order", icon: <Pencil1Icon />, onSelect: () => navigate(`/purchase-orders/${order.id}/edit`) },
                  { label: "Confirm order", icon: <CheckIcon />, onSelect: () => changeStatus.mutate({ id: order.id, status: "CONFIRMED" }), disabled: pending },
                  { label: "Cancel order", icon: <Cross2Icon />, onSelect: () => changeStatus.mutate({ id: order.id, status: "CANCELLED" }), disabled: pending, destructive: true },
                ] : order.status === "CONFIRMED" ? [
                  { label: "Create goods receipt", icon: <CubeIcon />, onSelect: () => navigate(`/purchase-orders/${order.id}/receipt`) },
                  { label: "Pre-close order", icon: <LockClosedIcon />, onSelect: async () => { const reason = await actionDialog.prompt({ title: "Pre-close purchase order?", description: `Explain why ${order.orderNumber} is being closed before fulfillment.`, inputLabel: "Reason", inputPlaceholder: "Enter the reason for pre-closing this order", confirmLabel: "Pre-close order", destructive: true }); if (reason) close.mutate({ id: order.id, reason }); }, disabled: pending },
                  { label: "Create purchase draft", icon: <FilePlusIcon />, onSelect: () => convert.mutate(order.id), disabled: pending },
                ] : [];
                return <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{new Date(order.orderDate).toLocaleDateString()}</td><td>{order.status}</td><td>{order.items.length}</td><td><OrderActionsMenu label={`Actions for purchase order ${order.orderNumber}`} actions={actions} /></td></tr>;
              })}
              {!filtered.length ? <tr><td colSpan={5}><Text color="gray">No purchase orders match your filters.</Text></td></tr> : null}
            </tbody>
          </table>
        </Card>
      </CrudPageState>
      {actionDialog.dialog}
    </Flex>
  );
}

export function PurchaseOrderCreatePage() { return <PurchaseOrderForm />; }

export function PurchaseOrderReceiptPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { orderId } = useParams();
  const orders = useQuery({ queryKey: purchaseKeys.all, queryFn: ({ signal }) => purchaseOrdersApi.list(undefined, signal) });
  const order = orders.data?.items.find((item) => item.id === orderId);
  const warehouses = useBranchWarehouses(order?.branchId ?? "");
  const [warehouseId, setWarehouseId] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState(() => formatAdDate(new Date()));
  const receipt = useMutation({ mutationFn: () => purchaseOrdersApi.createGoodsReceipt(order!.id, { warehouseId, fulfillmentDate }) });
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); try { await receipt.mutateAsync(); await client.invalidateQueries({ queryKey: purchaseKeys.all }); navigate("/purchase-orders", { replace: true }); } catch { /* rendered below */ } }
  return <Flex direction="column" gap="5"><CrudPageHeader title="Create goods receipt" description={order ? `Record receipt for purchase order ${order.orderNumber}.` : "Record received inventory."} /><CrudPageState loading={orders.isLoading || warehouses.isLoading} error={orders.error ?? warehouses.error} label="Loading goods receipt" description="Preparing the receipt form…">{order ? <Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Warehouse<AppSelect value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} required><option value="">Select warehouse</option>{warehouses.data?.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</AppSelect></label><label>Receipt date (BS)<NepaliDatePicker value={fulfillmentDate} onChange={setFulfillmentDate} required ariaLabel="Choose goods receipt date in Bikram Sambat" /></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")}>Cancel</Button><Button type="submit" disabled={!warehouseId || !fulfillmentDate} loading={receipt.isPending}>Post goods receipt</Button></div></form>{receipt.error ? <Text color="red" role="alert">{requestMessage(receipt.error)}</Text> : null}</Card> : <Text color="red" role="alert">The purchase order was not found.</Text>}</CrudPageState></Flex>;
}
