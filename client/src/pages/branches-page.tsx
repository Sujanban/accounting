import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { AppSelect } from "../components/ui/select";
import { enterpriseApi, type Warehouse } from "../features/enterprise/enterprise-api";
import { useBranches, useBranchWarehouses } from "../features/enterprise/use-enterprise";

export function BranchesPage() {
  const client = useQueryClient();
  const branches = useBranches();
  const [branchId, setBranchId] = useState("");
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const warehouses = useBranchWarehouses(branchId);
  const refresh = () => client.invalidateQueries({ queryKey: ["enterprise"] });
  const createBranch = useMutation({ mutationFn: enterpriseApi.createBranch, onSuccess: refresh });
  const archiveBranch = useMutation({ mutationFn: enterpriseApi.archiveBranch, onSuccess: refresh });
  const createWarehouse = useMutation({ mutationFn: enterpriseApi.createWarehouse, onSuccess: refresh });
  const updateWarehouse = useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof enterpriseApi.updateWarehouse>[1] }) => enterpriseApi.updateWarehouse(id, input), onSuccess: () => { setEditingWarehouse(null); refresh(); } });
  const archiveWarehouse = useMutation({ mutationFn: enterpriseApi.archiveWarehouse, onSuccess: refresh });

  return (
    <Flex direction="column" gap="5">
      <div>
        <Heading size="7">Branches & warehouses</Heading>
        <Text color="gray">Manage operating locations and inventory warehouses by branch.</Text>
      </div>
      <Card size="3">
        <Heading size="4">Branches</Heading>
        <form className="accounting-form" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          createBranch.mutate({ branchCode: String(form.get("code")), name: String(form.get("name")) });
          event.currentTarget.reset();
        }}>
          <label>Code<input name="code" required placeholder="KTM" /></label>
          <label>Name<input name="name" required placeholder="Kathmandu Branch" /></label>
          <div className="accounting-form__actions"><Button type="submit" loading={createBranch.isPending}>Add branch</Button></div>
        </form>
        {branches.data?.map((branch) => (
          <Flex key={branch.id} justify="between" align="center" mt="3">
            <Text>{branch.name} <Text color="gray">({branch.branchCode}){branch.isDefault ? " · Default" : ""}</Text></Text>
            <Button size="1" variant="ghost" disabled={branch.isDefault} loading={archiveBranch.isPending} onClick={() => {
              if (window.confirm(`Archive ${branch.name}?`)) archiveBranch.mutate(branch.id);
            }}>Archive</Button>
          </Flex>
        ))}
      </Card>
      <Card size="3">
        <Heading size="4">Warehouses</Heading>
        <form className="accounting-form" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          createWarehouse.mutate({ branchId, warehouseCode: String(form.get("code")), name: String(form.get("name")) });
          event.currentTarget.reset();
        }}>
          <label className="accounting-form__wide">Branch<AppSelect value={branchId} onChange={(event) => { setBranchId(event.target.value); setEditingWarehouse(null); }} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label>
          <label>Code<input name="code" required disabled={!branchId} placeholder="MAIN" /></label>
          <label>Name<input name="name" required disabled={!branchId} placeholder="Main warehouse" /></label>
          <div className="accounting-form__actions"><Button type="submit" disabled={!branchId} loading={createWarehouse.isPending}>Add warehouse</Button></div>
        </form>
        {branchId ? warehouses.data?.map((warehouse) => (
          <div key={warehouse.id} className="warehouse-row">
            <Flex justify="between" align="center" mt="3">
              <Text>{warehouse.name} ({warehouse.warehouseCode}){warehouse.isDefault ? " · Default" : ""}</Text>
              <Flex gap="2">
                <Button size="1" variant="outline" onClick={() => setEditingWarehouse(warehouse)}>Edit</Button>
                <Button size="1" variant="ghost" disabled={warehouse.isDefault} loading={archiveWarehouse.isPending} onClick={() => {
                  if (window.confirm(`Archive ${warehouse.name}?`)) archiveWarehouse.mutate(warehouse.id);
                }}>Archive</Button>
              </Flex>
            </Flex>
            {editingWarehouse?.id === warehouse.id ? (
              <form className="accounting-form" onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                updateWarehouse.mutate({ id: warehouse.id, input: { branchId, warehouseCode: String(form.get("code")), name: String(form.get("name")), isDefault: warehouse.isDefault } });
              }}>
                <label>Code<input name="code" required defaultValue={warehouse.warehouseCode} /></label>
                <label>Name<input name="name" required defaultValue={warehouse.name} /></label>
                <div className="accounting-form__actions"><Button type="submit" loading={updateWarehouse.isPending}>Save warehouse</Button><Button type="button" variant="outline" onClick={() => setEditingWarehouse(null)}>Cancel</Button></div>
              </form>
            ) : null}
          </div>
        )) : <Text color="gray">Select a branch to see its warehouses.</Text>}
      </Card>
    </Flex>
  );
}
