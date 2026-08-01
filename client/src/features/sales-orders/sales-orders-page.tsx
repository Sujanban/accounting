import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../../components/loading-screen";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { useBranches, useBranchWarehouses } from "../enterprise/use-enterprise";
import { useContacts, useProducts } from "../masters/use-masters";
import { salesOrdersApi, type SalesOrder, type SalesOrderInput } from "./sales-orders-api";

function Header({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <Flex justify="between" align="start" gap="4" wrap="wrap"><div><Heading size="7">{title}</Heading><Text as="p" color="gray" mt="2">{description}</Text></div>{action}</Flex>;
}

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The request could not be completed.";

function SalesOrderForm({ order }: { order?: SalesOrder }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [branchId, setBranchId] = useState(order?.branchId ?? "");
  const [contactId, setContactId] = useState(order?.contactId ?? "");
  const [productId, setProductId] = useState(order?.items[0]?.productId ?? "");
  const branches = useBranches();
  const contacts = useContacts({ role: "CUSTOMER", page: 1, isActive: "true" });
  const products = useProducts();
  const create = useMutation({ mutationFn: salesOrdersApi.create });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: SalesOrderInput }) => salesOrdersApi.update(id, input) });
  const loading = branches.isLoading || contacts.isLoading || products.isLoading;
  const error = create.error ?? update.error ?? branches.error ?? contacts.error ?? products.error;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: SalesOrderInput = {
      branchId,
      contactId,
      orderDate: String(form.get("orderDate")),
      items: [{ productId, quantity: Number(form.get("quantity")), unitPrice: Number(form.get("unitPrice")) }],
      notes: String(form.get("notes") || "") || undefined,
    };
    try {
      if (order) await update.mutateAsync({ id: order.id, input });
      else await create.mutateAsync(input);
      await client.invalidateQueries({ queryKey: ["sales-orders"] });
      navigate("/sales-orders", { replace: true });
    } catch {
      // Mutation state renders the safe server message below.
    }
  }

  if (loading) return <LoadingScreen fullScreen={false} label="Loading sales order" description="Preparing the order form…" />;
  if (error) return <Text color="red" role="alert">{errorMessage(error)}</Text>;
  return <Flex direction="column" gap="5"><Header title={order ? "Edit sales order" : "Add sales order"} description="Sales orders are planning documents and do not affect inventory or accounting." /><Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Customer<AppSelect value={contactId} onChange={(event) => setContactId(event.target.value)} required><option value="">Select customer</option>{contacts.data?.items.map((contact) => <option key={contact.id} value={contact.id}>{contact.displayName || contact.name}</option>)}</AppSelect></label><label>Product<AppSelect value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select product</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</AppSelect></label><label>Date<input name="orderDate" type="date" defaultValue={order?.orderDate.slice(0, 10)} required /></label><label>Quantity<input name="quantity" type="number" min="0.000001" step="any" defaultValue={order?.items[0]?.quantity} required /></label><label>Unit price<input name="unitPrice" type="number" min="0" step="any" defaultValue={order?.items[0]?.unitPrice} required /></label><label className="accounting-form__wide">Notes<textarea name="notes" defaultValue={order?.notes || ""} /></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/sales-orders")}>Cancel</Button><Button type="submit" disabled={!branchId || !contactId || !productId} loading={create.isPending || update.isPending}>{order ? "Save sales order" : "Create sales order"}</Button></div></form>{(create.error || update.error) ? <Text color="red" role="alert">{errorMessage(create.error || update.error)}</Text> : null}</Card></Flex>;
}

export function SalesOrdersPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { orderId } = useParams();
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("all");
  const orders = useQuery({ queryKey: ["sales-orders", branchId], queryFn: ({ signal }) => salesOrdersApi.list(branchId || undefined, signal) });
  const branchFilter = useBranches();
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "CONFIRMED" | "CANCELLED" }) => salesOrdersApi.updateStatus(id, status),
    onSuccess: () => client.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
  const closeOrder = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => salesOrdersApi.close(id, reason),
    onSuccess: () => client.invalidateQueries({ queryKey: ["sales-orders"] }),
  });
  const convert = useMutation({ mutationFn: salesOrdersApi.createVoucherDraft, onSuccess: (draft) => navigate(`/vouchers/transactions/${draft.id}/edit`) });
  const matchingOrders = orders.data?.items.filter((order) => status === "all" || order.status === status) ?? [];
  const selectedOrder = orderId ? orders.data?.items.find((order) => order.id === orderId) : undefined;

  if (orderId) {
    if (orders.isLoading) return <LoadingScreen fullScreen={false} label="Loading sales order" description="Retrieving order details…" />;
    if (orders.error) return <Text color="red" role="alert">{errorMessage(orders.error)}</Text>;
    if (!selectedOrder) return <Text color="red" role="alert">The sales order was not found.</Text>;
    return <SalesOrderForm order={selectedOrder} />;
  }
  if (orders.isLoading || branchFilter.isLoading) return <LoadingScreen fullScreen={false} label="Loading sales orders" description="Retrieving your sales orders…" />;
  if (orders.error || branchFilter.error) return <Text color="red" role="alert">{errorMessage(orders.error || branchFilter.error)}</Text>;

  return <Flex direction="column" gap="5"><Header title="Sales orders" description="Planning documents only; sales orders do not affect inventory or accounting." action={<Button onClick={() => navigate("/sales-orders/new")}>Add sales order</Button>} /><Card size="3"><div className="accounting-filters"><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branchFilter.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Status<AppSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="DRAFT">Draft</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="CLOSED">Closed</option></AppSelect></label></div></Card>{changeStatus.error || closeOrder.error || convert.error ? <Text color="red" role="alert">{errorMessage(changeStatus.error || closeOrder.error || convert.error)}</Text> : null}<Card size="3" className="accounting-table-card"><table className="accounting-table"><thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Items</th><th>Action</th></tr></thead><tbody>{matchingOrders.map((order) => <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{new Date(order.orderDate).toLocaleDateString()}</td><td>{order.status}</td><td>{order.items.length}</td><td><div className="accounting-table__actions">{order.status === "DRAFT" ? <><Button size="1" variant="ghost" className="table-icon-button" aria-label="Edit sales order" onClick={() => navigate(`/sales-orders/${order.id}/edit`)}><Pencil1Icon className="table-action-icon" /></Button><Button size="1" onClick={() => changeStatus.mutate({ id: order.id, status: "CONFIRMED" })} loading={changeStatus.isPending}>Confirm</Button><Button size="1" variant="outline" onClick={() => changeStatus.mutate({ id: order.id, status: "CANCELLED" })} disabled={changeStatus.isPending}>Cancel</Button></> : null}{order.status === "CONFIRMED" ? <><Button size="1" variant="outline" onClick={() => navigate(`/sales-orders/${order.id}/delivery`)}>Create delivery note</Button><Button size="1" variant="outline" onClick={() => { const reason = window.prompt("Why is this order being pre-closed?"); if (reason?.trim()) closeOrder.mutate({ id: order.id, reason }); }} loading={closeOrder.isPending}>Pre-close</Button><Button size="1" onClick={() => convert.mutate(order.id)} loading={convert.isPending}>Create sales draft</Button></> : null}{!["DRAFT", "CONFIRMED"].includes(order.status) ? "—" : null}</div></td></tr>)}{!matchingOrders.length ? <tr><td colSpan={5}><Text color="gray">No sales orders match your filters.</Text></td></tr> : null}</tbody></table></Card></Flex>;
}

export function SalesOrderCreatePage() { return <SalesOrderForm />; }

export function SalesOrderDeliveryPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { orderId } = useParams();
  const orders = useQuery({ queryKey: ["sales-orders"], queryFn: ({ signal }) => salesOrdersApi.list(undefined, signal) });
  const order = orders.data?.items.find((item) => item.id === orderId);
  const warehouses = useBranchWarehouses(order?.branchId || "");
  const [warehouseId, setWarehouseId] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const delivery = useMutation({ mutationFn: () => salesOrdersApi.createDelivery(order!.id, { warehouseId, fulfillmentDate }) });
  if (orders.isLoading || warehouses.isLoading) return <LoadingScreen fullScreen={false} label="Loading delivery note" description="Preparing the delivery form…" />;
  if (orders.error || warehouses.error || !order) return <Text color="red" role="alert">{order ? errorMessage(orders.error || warehouses.error) : "The sales order was not found."}</Text>;
  return <Flex direction="column" gap="5"><Header title="Create delivery note" description={`Record delivery for sales order ${order.orderNumber}.`} /><Card size="3"><form className="accounting-form" onSubmit={(event) => { event.preventDefault(); void (async () => { try { await delivery.mutateAsync(); await client.invalidateQueries({ queryKey: ["sales-orders"] }); navigate("/sales-orders", { replace: true }); } catch { /* mutation state is rendered below */ } })(); }}><label>Warehouse<AppSelect value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} required><option value="">Select warehouse</option>{warehouses.data?.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</AppSelect></label><label>Delivery date<input type="date" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} required /></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/sales-orders")}>Cancel</Button><Button type="submit" disabled={!warehouseId} loading={delivery.isPending}>Post delivery note</Button></div></form>{delivery.error ? <Text color="red" role="alert">{errorMessage(delivery.error)}</Text> : null}</Card></Flex>;
}
