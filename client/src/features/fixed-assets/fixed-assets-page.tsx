import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityLogIcon, BarChartIcon, ExitIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { Card, Flex, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CrudPageHeader, CrudPageState, requestMessage } from "../../components/crud-page";
import { OrderActionsMenu } from "../../components/order-actions-menu";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { NepaliDatePicker } from "../../components/ui/nepali-date-picker";
import { todayBsDate } from "../../lib/nepali-date";
import { useLedgers } from "../accounting/use-accounting";
import { useBranches } from "../enterprise/use-enterprise";
import { fixedAssetsApi, type FixedAsset, type FixedAssetInput } from "./fixed-assets-api";

const assetKeys = { all: ["fixed-assets"] as const };
const useAssets = () => useQuery({ queryKey: assetKeys.all, queryFn: ({ signal }) => fixedAssetsApi.list(signal) });

function AssetForm({ asset }: { asset?: FixedAsset }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const branches = useBranches();
  const [branchId, setBranchId] = useState(asset?.branchId ?? "");
  const [purchaseDate, setPurchaseDate] = useState(asset?.purchaseDate ?? todayBsDate());
  const create = useMutation({ mutationFn: fixedAssetsApi.create });
  const update = useMutation({ mutationFn: ({ id, input }: { id: string; input: FixedAssetInput }) => fixedAssetsApi.update(id, input) });
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: FixedAssetInput = { branchId, category: String(form.get("category")), purchaseDate: String(form.get("purchaseDate")), purchaseValue: Number(form.get("purchaseValue")), salvageValue: Number(form.get("salvageValue")), usefulLifeMonths: Number(form.get("usefulLifeMonths")), depreciationMethod: String(form.get("depreciationMethod")) as FixedAssetInput["depreciationMethod"] };
    try { if (asset) await update.mutateAsync({ id: asset.id, input }); else await create.mutateAsync(input); await client.invalidateQueries({ queryKey: assetKeys.all }); navigate("/fixed-assets", { replace: true }); } catch { /* rendered below */ }
  }
  return <Flex direction="column" gap="5"><CrudPageHeader title={asset ? "Edit fixed asset" : "Add fixed asset"} description="Maintain acquisition values and depreciation settings." /><CrudPageState loading={branches.isLoading} error={branches.error} label="Loading fixed asset" description="Preparing the asset form…"><Card size="3"><form className="accounting-form" onSubmit={(event) => void submit(event)}><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)} required><option value="">Select branch</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Category<input name="category" defaultValue={asset?.category} required /></label><label>Purchase date (BS)<NepaliDatePicker name="purchaseDate" value={purchaseDate} onChange={setPurchaseDate} required ariaLabel="Choose asset purchase date in Bikram Sambat" /></label><label>Purchase value<input name="purchaseValue" type="number" min="0" step="any" defaultValue={asset?.purchaseValue} required /></label><label>Salvage value<input name="salvageValue" type="number" min="0" step="any" defaultValue={asset?.salvageValue ?? 0} required /></label><label>Useful life (months)<input name="usefulLifeMonths" type="number" min="1" defaultValue={asset?.usefulLifeMonths} required /></label><label>Method<AppSelect name="depreciationMethod" defaultValue={asset?.depreciationMethod ?? "STRAIGHT_LINE"}><option value="STRAIGHT_LINE">Straight line</option><option value="WRITTEN_DOWN_VALUE">Written down value</option></AppSelect></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/fixed-assets")}>Cancel</Button><Button type="submit" disabled={!branchId || !purchaseDate} loading={create.isPending || update.isPending}>{asset ? "Save asset" : "Add asset"}</Button></div></form>{create.error || update.error ? <Text color="red" role="alert">{requestMessage(create.error || update.error)}</Text> : null}</Card></CrudPageState></Flex>;
}

function AssetRouteState({ children }: { children: (asset: FixedAsset) => React.ReactNode }) {
  const { assetId } = useParams();
  const assets = useAssets();
  const asset = assets.data?.find((item) => item.id === assetId);
  return <CrudPageState loading={assets.isLoading} error={assets.error} label="Loading fixed asset" description="Retrieving asset details…">{asset ? children(asset) : <Text color="red" role="alert">The fixed asset was not found.</Text>}</CrudPageState>;
}

export function FixedAssetsPage() {
  const navigate = useNavigate();
  const assets = useAssets();
  const branches = useBranches();
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("all");
  const [scheduleAsset, setScheduleAsset] = useState<FixedAsset | null>(null);
  const schedule = useMutation({ mutationFn: fixedAssetsApi.schedule });
  const filtered = assets.data?.filter((asset) => (!branchId || asset.branchId === branchId) && (status === "all" || asset.status === status)) ?? [];
  return (
    <Flex direction="column" gap="5">
      <CrudPageHeader title="Fixed assets" description="Asset register, depreciation previews, and manual journal drafts." action={<Button onClick={() => navigate("/fixed-assets/new")}>Add fixed asset</Button>} />
      <Card size="3"><div className="accounting-filters"><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><label>Status<AppSelect value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="ACTIVE">Active</option><option value="DISPOSED">Disposed</option></AppSelect></label></div></Card>
      <CrudPageState loading={assets.isLoading || branches.isLoading} error={assets.error ?? branches.error} label="Loading fixed assets" description="Retrieving the asset register…">
        <Card size="3" className="accounting-table-card order-actions-table">
          <table className="accounting-table">
            <thead><tr><th>Category</th><th>Purchase date</th><th>Purchase value</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((asset) => {
                const actions = [
                  ...(asset.status === "ACTIVE" ? [
                    { label: "Edit asset", icon: <Pencil1Icon />, onSelect: () => navigate(`/fixed-assets/${asset.id}/edit`) },
                    { label: "Depreciation journal", icon: <ActivityLogIcon />, onSelect: () => navigate(`/fixed-assets/${asset.id}/depreciation`) },
                    { label: "Disposal journal", icon: <ExitIcon />, onSelect: () => navigate(`/fixed-assets/${asset.id}/disposal`) },
                  ] : []),
                  { label: "Preview schedule", icon: <BarChartIcon />, disabled: schedule.isPending, onSelect: () => { setScheduleAsset(asset); schedule.mutate(asset.id); } },
                ];
                return <tr key={asset.id}><td><strong>{asset.category}</strong></td><td>{asset.purchaseDate} BS</td><td>{asset.purchaseValue.toLocaleString()}</td><td>{asset.status}</td><td><OrderActionsMenu label={`Actions for ${asset.category} fixed asset`} actions={actions} /></td></tr>;
              })}
              {!filtered.length ? <tr><td colSpan={5}><Text color="gray">No fixed assets match your filters.</Text></td></tr> : null}
            </tbody>
          </table>
        </Card>
        {schedule.data && scheduleAsset ? <Card size="3" className="accounting-table-card"><CrudPageHeader title={`Depreciation schedule: ${scheduleAsset.category}`} description="Preview only; no journal is recorded automatically." /><table className="accounting-table"><thead><tr><th>Month</th><th>Depreciation</th><th>Closing value</th></tr></thead><tbody>{schedule.data.items.map((item) => <tr key={item.month}><td>{item.month}</td><td>{item.depreciation.toFixed(2)}</td><td>{item.closingValue.toFixed(2)}</td></tr>)}</tbody></table></Card> : null}
      </CrudPageState>
    </Flex>
  );
}

export function FixedAssetCreatePage() { return <AssetForm />; }
export function FixedAssetEditPage() { return <AssetRouteState>{(asset) => <AssetForm asset={asset} />}</AssetRouteState>; }

export function FixedAssetDepreciationPage() {
  return <AssetRouteState>{(asset) => <DepreciationForm asset={asset} />}</AssetRouteState>;
}
function DepreciationForm({ asset }: { asset: FixedAsset }) {
  const navigate = useNavigate();
  const ledgers = useLedgers({ isActive: true });
  const [expenseLedgerId, setExpenseLedgerId] = useState("");
  const [accumulatedDepreciationLedgerId, setAccumulatedDepreciationLedgerId] = useState("");
  const [periodMonth, setPeriodMonth] = useState("1");
  const [transactionDate, setTransactionDate] = useState(todayBsDate);
  const create = useMutation({ mutationFn: () => fixedAssetsApi.createDepreciationDraft(asset.id, { periodMonth: Number(periodMonth), transactionDate, expenseLedgerId, accumulatedDepreciationLedgerId }), onSuccess: (draft) => navigate(`/vouchers/transactions/${draft.id}/edit`) });
  return <Flex direction="column" gap="5"><CrudPageHeader title="Prepare depreciation journal" description={`Create a reviewable journal draft for ${asset.category}.`} /><CrudPageState loading={ledgers.isLoading} error={ledgers.error} label="Loading ledgers" description="Preparing depreciation accounts…"><Card size="3"><form className="accounting-form" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}><label>Depreciation period<AppSelect value={periodMonth} onChange={(event) => setPeriodMonth(event.target.value)}>{Array.from({ length: asset.usefulLifeMonths }, (_, index) => <option key={index + 1} value={index + 1}>Month {index + 1}</option>)}</AppSelect></label><label>Journal date (BS)<NepaliDatePicker value={transactionDate} onChange={setTransactionDate} required ariaLabel="Choose depreciation journal date in Bikram Sambat" /></label><label>Expense ledger<AppSelect value={expenseLedgerId} onChange={(event) => setExpenseLedgerId(event.target.value)} required><option value="">Select ledger</option>{ledgers.data?.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</AppSelect></label><label>Accumulated depreciation ledger<AppSelect value={accumulatedDepreciationLedgerId} onChange={(event) => setAccumulatedDepreciationLedgerId(event.target.value)} required><option value="">Select ledger</option>{ledgers.data?.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</AppSelect></label><div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/fixed-assets")}>Cancel</Button><Button type="submit" disabled={!transactionDate || !expenseLedgerId || !accumulatedDepreciationLedgerId || expenseLedgerId === accumulatedDepreciationLedgerId} loading={create.isPending}>Create journal draft</Button></div></form>{create.error ? <Text color="red" role="alert">{requestMessage(create.error)}</Text> : null}</Card></CrudPageState></Flex>;
}

export function FixedAssetDisposalPage() { return <AssetRouteState>{(asset) => <DisposalForm asset={asset} />}</AssetRouteState>; }
function DisposalForm({ asset }: { asset: FixedAsset }) {
  const navigate = useNavigate();
  const ledgers = useLedgers({ isActive: true });
  const [transactionDate, setTransactionDate] = useState(todayBsDate);
  const [ids, setIds] = useState({ assetCostLedgerId: "", accumulatedDepreciationLedgerId: "", proceedsLedgerId: "", gainLossLedgerId: "" });
  const create = useMutation({ mutationFn: (values: { proceeds: number; accumulatedDepreciation: number }) => fixedAssetsApi.createDisposalDraft(asset.id, { transactionDate, ...values, ...ids }), onSuccess: (draft) => navigate(`/vouchers/transactions/${draft.id}/edit`) });
  return <Flex direction="column" gap="5"><CrudPageHeader title="Prepare disposal journal" description={`Create a reviewable disposal draft for ${asset.category}.`} /><CrudPageState loading={ledgers.isLoading} error={ledgers.error} label="Loading ledgers" description="Preparing disposal accounts…"><Card size="3"><form className="accounting-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); create.mutate({ proceeds: Number(form.get("proceeds")), accumulatedDepreciation: Number(form.get("accumulatedDepreciation")) }); }}><label>Journal date (BS)<NepaliDatePicker value={transactionDate} onChange={setTransactionDate} required ariaLabel="Choose disposal journal date in Bikram Sambat" /></label><label>Proceeds<input name="proceeds" type="number" min="0" step="any" defaultValue="0" required /></label><label>Accumulated depreciation<input name="accumulatedDepreciation" type="number" min="0" max={asset.purchaseValue - asset.salvageValue} step="any" defaultValue="0" required /></label>{([['assetCostLedgerId', 'Asset cost ledger'], ['accumulatedDepreciationLedgerId', 'Accumulated depreciation ledger'], ['proceedsLedgerId', 'Proceeds ledger'], ['gainLossLedgerId', 'Gain/loss ledger']] as const).map(([field, label]) => <label key={field}>{label}<AppSelect value={ids[field]} onChange={(event) => setIds((current) => ({ ...current, [field]: event.target.value }))} required><option value="">Select ledger</option>{ledgers.data?.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</AppSelect></label>)}<div className="accounting-form__actions accounting-form__wide"><Button type="button" variant="outline" onClick={() => navigate("/fixed-assets")}>Cancel</Button><Button type="submit" disabled={!transactionDate || Object.values(ids).some((id) => !id)} loading={create.isPending}>Create disposal draft</Button></div></form>{create.error ? <Text color="red" role="alert">{requestMessage(create.error)}</Text> : null}</Card></CrudPageState></Flex>;
}
