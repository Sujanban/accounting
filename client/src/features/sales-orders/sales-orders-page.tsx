import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { useBranches } from "../enterprise/use-enterprise";
import { useContacts, useProducts } from "../masters/use-masters";
import { salesOrdersApi } from "./sales-orders-api";
import type { SalesOrder, SalesOrderInput } from "./sales-orders-api";

export function SalesOrdersPage() {
  const client = useQueryClient();
  const orders = useQuery({ queryKey: ["sales-orders"], queryFn: ({ signal }) => salesOrdersApi.list(signal) });
  const [editing, setEditing] = useState<SalesOrder | null>(null);
  const [branchId, setBranchId] = useState("");
  const [contactId, setContactId] = useState("");
  const [productId, setProductId] = useState("");
  const complete = () => { setEditing(null); setBranchId(""); setContactId(""); setProductId(""); client.invalidateQueries({ queryKey: ["sales-orders"] }); };
  const create = useMutation({ mutationFn: salesOrdersApi.create, onSuccess: complete });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: SalesOrderInput }) => salesOrdersApi.update(id, input), onSuccess: complete });
  const changeStatus = useMutation({ mutationFn: ({ id, status }: { id: string; status: "CONFIRMED" | "CANCELLED" }) => salesOrdersApi.updateStatus(id, status), onSuccess: () => client.invalidateQueries({ queryKey: ["sales-orders"] }) });
  const closeOrder = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => salesOrdersApi.close(id, reason), onSuccess: () => client.invalidateQueries({ queryKey: ["sales-orders"] }) });
  const branches = useBranches();
  const contacts = useContacts({ role: "CUSTOMER", page: 1, isActive: "true" });
  const products = useProducts();
  const beginEdit = (order: SalesOrder) => { setEditing(order); setBranchId(order.branchId); setContactId(order.contactId); setProductId(order.items[0]?.productId || ""); };
  const pending = create.isPending || update.isPending;
  const error = create.error || update.error || changeStatus.error || closeOrder.error;

  return <Flex direction="column" gap="5"><div><Heading size="7">Sales orders</Heading><Text color="gray">Planning documents only; sales orders do not affect inventory or accounting.</Text></div><Card size="3"><form className="accounting-form" key={editing?.id || "new"} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = { branchId, contactId, orderDate: String(form.get("orderDate")), items: [{ productId, quantity: Number(form.get("quantity")), unitPrice: Number(form.get("unitPrice")) }], notes: String(form.get("notes") || "") || undefined }; if (editing) update.mutate({ id: editing.id, input }); else create.mutate(input); }}><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Customer<AppSelect value={contactId} onChange={(event) => setContactId(event.target.value)} required><option value="">Select customer</option>{contacts.data?.items.map((contact) => <option key={contact.id} value={contact.id}>{contact.displayName || contact.name}</option>)}</AppSelect></label><label>Product<AppSelect value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select product</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</AppSelect></label><label>Date<input name="orderDate" type="date" defaultValue={editing ? editing.orderDate.slice(0, 10) : ""} required /></label><label>Quantity<input name="quantity" type="number" min="0.000001" step="any" defaultValue={editing?.items[0]?.quantity} required /></label><label>Unit price<input name="unitPrice" type="number" min="0" step="any" defaultValue={editing?.items[0]?.unitPrice} required /></label><label className="accounting-form__wide">Notes<textarea name="notes" defaultValue={editing?.notes || ""} /></label><div className="accounting-form__actions"><Button type="submit" disabled={!branchId || !contactId || !productId} loading={pending}>{editing ? "Save draft order" : "Create draft order"}</Button>{editing ? <Button type="button" variant="outline" onClick={complete}>Cancel edit</Button> : null}</div></form>{error instanceof Error ? <Text color="red" role="alert">{error.message}</Text> : null}</Card><Card size="3"><Heading size="4">Orders</Heading>{orders.data?.items.length ? orders.data.items.map((order) => <Flex key={order.id} justify="between" align="center" gap="3" py="2"><Text>{order.orderNumber} · {order.status} · {new Date(order.orderDate).toLocaleDateString()}</Text>{order.status === "DRAFT" ? <Flex gap="2"><Button type="button" variant="outline" onClick={() => beginEdit(order)}>Edit</Button><Button type="button" onClick={() => changeStatus.mutate({ id: order.id, status: "CONFIRMED" })} loading={changeStatus.isPending}>Confirm</Button><Button type="button" variant="outline" onClick={() => changeStatus.mutate({ id: order.id, status: "CANCELLED" })} disabled={changeStatus.isPending}>Cancel</Button></Flex> : null}{order.status === "CONFIRMED" ? <Button type="button" variant="outline" loading={closeOrder.isPending} onClick={() => { const reason = window.prompt("Why is this order being pre-closed?"); if (reason?.trim()) closeOrder.mutate({ id: order.id, reason }); }}>Pre-close</Button> : null}</Flex>) : <Text color="gray">No sales orders yet.</Text>}</Card></Flex>;
}
