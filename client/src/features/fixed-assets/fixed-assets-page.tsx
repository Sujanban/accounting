import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { useBranches } from "../enterprise/use-enterprise";
import { fixedAssetsApi } from "./fixed-assets-api";
import type { FixedAsset, FixedAssetInput } from "./fixed-assets-api";

export function FixedAssetsPage() {
  const client = useQueryClient();
  const assets = useQuery({ queryKey: ["fixed-assets"], queryFn: ({ signal }) => fixedAssetsApi.list(signal) });
  const [editing, setEditing] = useState<FixedAsset | null>(null);
  const [branchId, setBranchId] = useState("");
  const complete = () => { setEditing(null); setBranchId(""); client.invalidateQueries({ queryKey: ["fixed-assets"] }); };
  const create = useMutation({ mutationFn: fixedAssetsApi.create, onSuccess: complete });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: FixedAssetInput }) => fixedAssetsApi.update(id, input), onSuccess: complete });
  const schedule = useMutation({ mutationFn: fixedAssetsApi.schedule });
  const branches = useBranches();
  const pending = create.isPending || update.isPending;
  const error = create.error || update.error;
  const beginEdit = (asset: FixedAsset) => { setEditing(asset); setBranchId(asset.branchId); };

  return <Flex direction="column" gap="5"><div><Heading size="7">Fixed assets</Heading><Text color="gray">Asset register and read-only depreciation preview. No accounting entries are created here.</Text></div><Card size="3"><form className="accounting-form" key={editing?.id || "new"} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const input = { branchId, assetCode: String(form.get("assetCode")), category: String(form.get("category")), purchaseDate: String(form.get("purchaseDate")), purchaseValue: Number(form.get("purchaseValue")), salvageValue: Number(form.get("salvageValue")), usefulLifeMonths: Number(form.get("usefulLifeMonths")), depreciationMethod: String(form.get("depreciationMethod")) as FixedAssetInput["depreciationMethod"] }; if (editing) update.mutate({ id: editing.id, input }); else create.mutate(input); }}><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Asset code<input name="assetCode" defaultValue={editing?.assetCode} required /></label><label>Category<input name="category" defaultValue={editing?.category} required /></label><label>Purchase date<input name="purchaseDate" type="date" defaultValue={editing ? editing.purchaseDate.slice(0, 10) : ""} required /></label><label>Purchase value<input name="purchaseValue" type="number" min="0" defaultValue={editing?.purchaseValue} required /></label><label>Salvage value<input name="salvageValue" type="number" min="0" defaultValue={editing?.salvageValue ?? "0"} required /></label><label>Useful life (months)<input name="usefulLifeMonths" type="number" min="1" defaultValue={editing?.usefulLifeMonths} required /></label><label>Method<AppSelect name="depreciationMethod" defaultValue={editing?.depreciationMethod || "STRAIGHT_LINE"}><option value="STRAIGHT_LINE">Straight line</option><option value="WRITTEN_DOWN_VALUE">Written down value</option></AppSelect></label><div className="accounting-form__actions"><Button type="submit" disabled={!branchId} loading={pending}>{editing ? "Save asset" : "Add asset"}</Button>{editing ? <Button type="button" variant="outline" onClick={complete}>Cancel edit</Button> : null}</div></form>{error instanceof Error ? <Text color="red" role="alert">{error.message}</Text> : null}</Card><Card size="3"><Heading size="4">Asset register</Heading>{assets.data?.map((asset) => <Flex key={asset.id} justify="between" mt="2"><Text>{asset.assetCode} · {asset.category} · {asset.status}</Text><Flex gap="2">{asset.status === "ACTIVE" ? <Button size="1" variant="outline" onClick={() => beginEdit(asset)}>Edit</Button> : null}<Button size="1" variant="outline" onClick={() => schedule.mutate(asset.id)}>Preview depreciation</Button></Flex></Flex>) || <Text color="gray">No fixed assets yet.</Text>}{schedule.data ? <table className="accounting-table"><thead><tr><th>Month</th><th>Depreciation</th><th>Closing value</th></tr></thead><tbody>{schedule.data.items.map((item) => <tr key={item.month}><td>{item.month}</td><td>{item.depreciation.toFixed(2)}</td><td>{item.closingValue.toFixed(2)}</td></tr>)}</tbody></table> : null}</Card></Flex>;
}
