import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { Card, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CrudPageHeader, CrudPageState, requestMessage } from "../components/crud-page";
import { useActionDialog } from "../components/action-dialog";
import { OrderActionsMenu } from "../components/order-actions-menu";
import { Button } from "../components/ui/button";
import { AppSelect } from "../components/ui/select";
import { enterpriseApi, type Warehouse } from "../features/enterprise/enterprise-api";
import { useBranches, useBranchWarehouses } from "../features/enterprise/use-enterprise";

const enterpriseKey = ["enterprise"] as const;

export function BranchesPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const actionDialog = useActionDialog();
  const branches = useBranches();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const archiveBranch = useMutation({ mutationFn: enterpriseApi.archiveBranch, onSuccess: () => client.invalidateQueries({ queryKey: enterpriseKey }) });
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = branches.data?.filter((branch) => (status === "all" || String(branch.isActive) === status) && (!normalizedSearch || `${branch.branchCode} ${branch.name}`.toLowerCase().includes(normalizedSearch))) ?? [];
  return <Flex direction="column" gap="5"><CrudPageHeader title="Branches" description="Manage company operating locations." action={<Button onClick={() => navigate("/company/branches/new")}>Add branch</Button>} /><Card size="3"><div className="accounting-filters"><label>Search<input value={search} placeholder="Code or branch name" onChange={(event) => setSearch(event.target.value)} /></label><label>Status<AppSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="true">Active</option><option value="false">Archived</option></AppSelect></label></div></Card>{archiveBranch.error ? <Text color="red" role="alert">{requestMessage(archiveBranch.error)}</Text> : null}<CrudPageState loading={branches.isLoading} error={branches.error} label="Loading branches" description="Retrieving your company locations…"><Card size="3" className="accounting-table-card order-actions-table"><table className="accounting-table"><thead><tr><th>Code</th><th>Branch</th><th>Default</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((branch) => <tr key={branch.id} className={branch.isActive ? undefined : "archived-party-row"}><td>{branch.branchCode}</td><td><strong>{branch.name}</strong></td><td>{branch.isDefault ? "Yes" : "No"}</td><td>{branch.isActive ? "Active" : "Archived"}</td><td><OrderActionsMenu label={`Actions for branch ${branch.name}`} actions={!branch.isDefault && branch.isActive ? [{ label: "Archive branch", icon: <TrashIcon />, destructive: true, disabled: archiveBranch.isPending, onSelect: async () => { if (await actionDialog.confirm({ title: "Archive branch?", description: `“${branch.name}” will no longer be available for new entries.`, confirmLabel: "Archive branch", destructive: true })) archiveBranch.mutate(branch.id); } }] : []} /></td></tr>)}{!filtered.length ? <tr><td colSpan={5}><Text color="gray">No branches match your filters.</Text></td></tr> : null}</tbody></table></Card></CrudPageState>{actionDialog.dialog}</Flex>;
}

export function WarehousesPage() {
  const navigate = useNavigate();
  const actionDialog = useActionDialog();
  const [searchParams, setSearchParams] = useSearchParams();
  const client = useQueryClient();
  const branches = useBranches();
  const [branchId, setBranchId] = useState(() => searchParams.get("branchId") ?? "");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const warehouses = useBranchWarehouses(branchId);
  const archive = useMutation({ mutationFn: enterpriseApi.archiveWarehouse, onSuccess: () => client.invalidateQueries({ queryKey: enterpriseKey }) });
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = warehouses.data?.filter((warehouse) => (status === "all" || String(warehouse.isActive) === status) && (!normalizedSearch || `${warehouse.warehouseCode} ${warehouse.name}`.toLowerCase().includes(normalizedSearch))) ?? [];
  return <Flex direction="column" gap="5"><CrudPageHeader title="Warehouses" description="Manage branch-scoped inventory locations." action={branchId ? <Button onClick={() => navigate(`/company/warehouses/${branchId}/new`)}>Add warehouse</Button> : undefined} /><Card size="3"><div className="accounting-filters"><label>Branch<AppSelect value={branchId} onChange={(event) => { const nextBranchId = event.target.value; setBranchId(nextBranchId); setSearchParams(nextBranchId ? { branchId: nextBranchId } : {}); }}><option value="">Select branch</option>{branches.data?.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Search<input value={search} placeholder="Code or warehouse name" onChange={(event) => setSearch(event.target.value)} disabled={!branchId} /></label><label>Status<AppSelect value={status} onChange={(event) => setStatus(event.target.value)} disabled={!branchId}><option value="all">All statuses</option><option value="true">Active</option><option value="false">Archived</option></AppSelect></label></div></Card>{archive.error ? <Text color="red" role="alert">{requestMessage(archive.error)}</Text> : null}<CrudPageState loading={branches.isLoading || (Boolean(branchId) && warehouses.isLoading)} error={branches.error ?? warehouses.error} label="Loading warehouses" description="Retrieving inventory locations…">{branchId ? <Card size="3" className="accounting-table-card order-actions-table"><table className="accounting-table"><thead><tr><th>Code</th><th>Warehouse</th><th>Default</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map((warehouse) => <tr key={warehouse.id} className={warehouse.isActive ? undefined : "archived-party-row"}><td>{warehouse.warehouseCode}</td><td><strong>{warehouse.name}</strong></td><td>{warehouse.isDefault ? "Yes" : "No"}</td><td>{warehouse.isActive ? "Active" : "Archived"}</td><td><OrderActionsMenu label={`Actions for warehouse ${warehouse.name}`} actions={warehouse.isActive ? [{ label: "Edit warehouse", icon: <Pencil1Icon />, onSelect: () => navigate(`/company/warehouses/${branchId}/${warehouse.id}/edit`) }, ...(!warehouse.isDefault ? [{ label: "Archive warehouse", icon: <TrashIcon />, destructive: true, disabled: archive.isPending, onSelect: async () => { if (await actionDialog.confirm({ title: "Archive warehouse?", description: `“${warehouse.name}” will no longer be available for new inventory entries.`, confirmLabel: "Archive warehouse", destructive: true })) archive.mutate(warehouse.id); } }] : [])] : []} /></td></tr>)}{!filtered.length ? <tr><td colSpan={5}><Text color="gray">No warehouses match your filters.</Text></td></tr> : null}</tbody></table></Card> : <Card size="3"><Text color="gray">Select a branch to view its warehouses.</Text></Card>}</CrudPageState>{actionDialog.dialog}</Flex>;
}

export function BranchCreatePage() {
  const navigate = useNavigate(); const client = useQueryClient(); const create = useMutation({ mutationFn: enterpriseApi.createBranch });
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { await create.mutateAsync({ branchCode: String(form.get("code")), name: String(form.get("name")), isDefault: form.get("isDefault") === "true" }); await client.invalidateQueries({ queryKey: enterpriseKey }); navigate("/company/branches", { replace: true }); } catch { /* rendered below */ } }
  return <Flex direction="column" gap="5"><CrudPageHeader title="Add branch" description="Create a new operating location." /><Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Code<input name="code" required placeholder="KTM" /></label><label>Name<input name="name" required placeholder="Kathmandu Branch" /></label><label>Default<AppSelect name="isDefault" defaultValue="false"><option value="false">No</option><option value="true">Yes</option></AppSelect></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/company/branches")}>Cancel</Button><Button type="submit" loading={create.isPending}>Add branch</Button></div></form>{create.error ? <Text color="red" role="alert">{requestMessage(create.error)}</Text> : null}</Card></Flex>;
}

function WarehouseForm({ warehouse }: { warehouse?: Warehouse }) {
  const navigate = useNavigate(); const client = useQueryClient(); const { branchId } = useParams(); const create = useMutation({ mutationFn: enterpriseApi.createWarehouse }); const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof enterpriseApi.updateWarehouse>[1] }) => enterpriseApi.updateWarehouse(id, input) });
  const parentUrl = `/company/warehouses?branchId=${encodeURIComponent(branchId ?? "")}`;
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!branchId) return; const form = new FormData(event.currentTarget); const input = { branchId, warehouseCode: String(form.get("code")), name: String(form.get("name")), isDefault: form.get("isDefault") === "true" }; try { if (warehouse) await update.mutateAsync({ id: warehouse.id, input }); else await create.mutateAsync(input); await client.invalidateQueries({ queryKey: enterpriseKey }); navigate(parentUrl, { replace: true }); } catch { /* rendered below */ } }
  return <Flex direction="column" gap="5"><CrudPageHeader title={warehouse ? "Edit warehouse" : "Add warehouse"} description="Maintain an inventory location within the selected branch." /><Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Code<input name="code" defaultValue={warehouse?.warehouseCode} required /></label><label>Name<input name="name" defaultValue={warehouse?.name} required /></label><label>Default<AppSelect name="isDefault" defaultValue={String(warehouse?.isDefault ?? false)}><option value="false">No</option><option value="true">Yes</option></AppSelect></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate(parentUrl)}>Cancel</Button><Button type="submit" loading={create.isPending || update.isPending}>{warehouse ? "Save warehouse" : "Add warehouse"}</Button></div></form>{create.error || update.error ? <Text color="red" role="alert">{requestMessage(create.error || update.error)}</Text> : null}</Card></Flex>;
}

export function WarehouseCreatePage() { return <WarehouseForm />; }
export function WarehouseEditPage() { const { branchId, warehouseId } = useParams(); const warehouses = useBranchWarehouses(branchId ?? ""); const warehouse = warehouses.data?.find((item) => item.id === warehouseId); return <CrudPageState loading={warehouses.isLoading} error={warehouses.error} label="Loading warehouse" description="Retrieving warehouse details…">{warehouse ? <WarehouseForm warehouse={warehouse} /> : <Text color="red" role="alert">The warehouse was not found.</Text>}</CrudPageState>; }
