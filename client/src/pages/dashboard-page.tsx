import { Badge, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { AppSelect } from "../components/ui/select";
import { useBalanceSheet, useCashFlow, useProfitLoss, useStockSummary, useTrialBalance } from "../features/reports/use-reports";
import { useSystemHealth } from "../features/system/use-system-health";
import { useQuery } from "@tanstack/react-query";
import { salesOrdersApi } from "../features/sales-orders/sales-orders-api";
import { purchaseOrdersApi } from "../features/purchase-orders/purchase-orders-api";
import { fixedAssetsApi } from "../features/fixed-assets/fixed-assets-api";
import { payrollApi } from "../features/payroll/payroll-api";
import { useBranches } from "../features/enterprise/use-enterprise";

export function DashboardPage() {
  const [branchId, setBranchId] = useState("");
  const filters = branchId ? { branchId } : {};
  const health = useSystemHealth();
  const trialBalance = useTrialBalance(filters);
  const profitLoss = useProfitLoss(filters);
  const balanceSheet = useBalanceSheet(filters);
  const cashFlow = useCashFlow(filters);
  const stockSummary = useStockSummary(filters);
  const branches = useBranches();
  const salesOrders = useQuery({ queryKey: ["sales-orders", "dashboard", branchId], queryFn: ({ signal }) => salesOrdersApi.list(branchId || undefined, signal) });
  const purchaseOrders = useQuery({ queryKey: ["purchase-orders", "dashboard", branchId], queryFn: ({ signal }) => purchaseOrdersApi.list(branchId || undefined, signal) });
  const fixedAssets = useQuery({ queryKey: ["fixed-assets", "dashboard"], queryFn: ({ signal }) => fixedAssetsApi.list(signal) });
  const employees = useQuery({ queryKey: ["payroll", "employees", "dashboard"], queryFn: ({ signal }) => payrollApi.employees(signal) });
  const leaveRequests = useQuery({ queryKey: ["payroll", "leave-requests", "dashboard"], queryFn: ({ signal }) => payrollApi.leaveRequests(signal) });
  const databaseReady = health.data?.database === "connected";
  const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const confirmedSalesOrders = salesOrders.data?.items.filter((order) => order.status === "CONFIRMED").length;
  const confirmedPurchaseOrders = purchaseOrders.data?.items.filter((order) => order.status === "CONFIRMED").length;
  const activeAssets = fixedAssets.data?.filter((asset) => asset.status === "ACTIVE" && (!branchId || asset.branchId === branchId)) ?? [];
  const activeAssetValue = activeAssets.reduce((total, asset) => total + asset.purchaseValue, 0);
  const scopedEmployees = employees.data?.filter((employee) => !branchId || employee.branchId === branchId) ?? [];
  const scopedEmployeeIds = new Set(scopedEmployees.map((employee) => employee._id));
  const pendingLeaveRequests = leaveRequests.data?.filter((request) => request.status === "PENDING" && (!branchId || scopedEmployeeIds.has(request.employeeId))).length;

  return (
    <Flex direction="column" gap="5">
      <div>
        <Heading size="7">Welcome to Ledgerly</Heading>
        <Text as="p" color="gray" mt="2">A current snapshot of your active fiscal year.</Text>
      </div>
      <Card size="3">
        <Flex align="center" justify="between" gap="4" wrap="wrap">
          <div>
            <Text as="p" weight="bold">API connection</Text>
            <Text as="p" color="gray" size="2" mt="1">The dashboard checks the server every 30 seconds.</Text>
          </div>
          <Flex align="center" gap="3">
            <Badge color={databaseReady ? "green" : "amber"} size="2">{health.isFetching ? "Checking" : databaseReady ? "Connected" : "Unavailable"}</Badge>
            <Button variant="outline" onClick={() => void health.refetch()} disabled={health.isFetching}><ReloadIcon /> Refresh</Button>
          </Flex>
        </Flex>
        {health.isError ? <Text as="p" color="red" size="2" mt="3">{health.error.message}</Text> : null}
      </Card>
      <Card size="2"><label>Branch scope<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card size="3"><Text color="gray" size="2">Net {profitLoss.data && profitLoss.data.totals.netProfit < 0 ? "loss" : "profit"}</Text><Heading mt="2" size="6">{profitLoss.data ? money.format(Math.abs(profitLoss.data.totals.netProfit)) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/profit-loss">View Profit & Loss</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Assets</Text><Heading mt="2" size="6">{balanceSheet.data ? money.format(balanceSheet.data.totals.assets) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/balance-sheet">View Balance Sheet</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Trial balance</Text><Heading mt="2" size="6">{trialBalance.data?.isBalanced ? "Balanced" : trialBalance.data ? "Out of balance" : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/trial-balance">View Trial Balance</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Closing cash</Text><Heading mt="2" size="6">{cashFlow.data ? money.format(cashFlow.data.closingBalance) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/cash-flow">View Cash Flow</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Inventory value</Text><Heading mt="2" size="6">{stockSummary.data ? money.format(stockSummary.data.totals.stockValue) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/stock-summary">View Stock Summary</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Confirmed sales orders</Text><Heading mt="2" size="6">{confirmedSalesOrders ?? "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/sales-orders">Delivery planning queue</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Confirmed purchase orders</Text><Heading mt="2" size="6">{confirmedPurchaseOrders ?? "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/purchase-orders">Goods-receipt planning queue</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Active asset value</Text><Heading mt="2" size="6">{fixedAssets.data ? money.format(activeAssetValue) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/fixed-assets">{activeAssets.length} active asset{activeAssets.length === 1 ? "" : "s"}</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Active employees</Text><Heading mt="2" size="6">{employees.data ? scopedEmployees.length : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/payroll">{pendingLeaveRequests ?? "—"} pending leave request{pendingLeaveRequests === 1 ? "" : "s"}</Link></Text></Card>
      </div>
    </Flex>
  );
}
