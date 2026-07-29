import { useQuery } from "@tanstack/react-query";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { AppSelect } from "../../components/ui/select";
import { useBranches } from "../enterprise/use-enterprise";
import { fixedAssetsApi } from "../fixed-assets/fixed-assets-api";
import { payrollApi } from "../payroll/payroll-api";
import { purchaseOrdersApi } from "../purchase-orders/purchase-orders-api";
import { salesOrdersApi } from "../sales-orders/sales-orders-api";

export function EnterpriseOperationsReportPage() {
  const [branchId, setBranchId] = useState("");
  const branches = useBranches();
  const sales = useQuery({ queryKey: ["enterprise-report", "sales-orders", branchId], queryFn: ({ signal }) => salesOrdersApi.list(branchId || undefined, signal) });
  const purchases = useQuery({ queryKey: ["enterprise-report", "purchase-orders", branchId], queryFn: ({ signal }) => purchaseOrdersApi.list(branchId || undefined, signal) });
  const assets = useQuery({ queryKey: ["enterprise-report", "assets"], queryFn: ({ signal }) => fixedAssetsApi.list(signal) });
  const employees = useQuery({ queryKey: ["enterprise-report", "employees"], queryFn: ({ signal }) => payrollApi.employees(signal) });
  const leaves = useQuery({ queryKey: ["enterprise-report", "leaves"], queryFn: ({ signal }) => payrollApi.leaveRequests(signal) });
  const scopedAssets = assets.data?.filter((asset) => !branchId || asset.branchId === branchId) ?? [];
  const scopedEmployees = employees.data?.filter((employee) => !branchId || employee.branchId === branchId) ?? [];
  const employeeIds = new Set(scopedEmployees.map((employee) => employee._id));
  const pendingLeave = leaves.data?.filter((leave) => leave.status === "PENDING" && (!branchId || employeeIds.has(leave.employeeId))).length ?? 0;
  const assetValue = scopedAssets.filter((asset) => asset.status === "ACTIVE").reduce((sum, asset) => sum + asset.purchaseValue, 0);
  const confirmedSales = sales.data?.items.filter((order) => order.status === "CONFIRMED") ?? [];
  const confirmedPurchases = purchases.data?.items.filter((order) => order.status === "CONFIRMED") ?? [];
  return <Flex direction="column" gap="5"><div><Heading size="7">Enterprise operations report</Heading><Text color="gray">Branch-scoped operational status for orders, fixed assets, and payroll foundations.</Text></div><Card size="2"><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label></Card><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Card size="3"><Text color="gray">Confirmed sales orders</Text><Heading size="6" mt="2">{confirmedSales.length}</Heading></Card><Card size="3"><Text color="gray">Confirmed purchase orders</Text><Heading size="6" mt="2">{confirmedPurchases.length}</Heading></Card><Card size="3"><Text color="gray">Active asset value</Text><Heading size="6" mt="2">{assetValue.toFixed(2)}</Heading></Card><Card size="3"><Text color="gray">Active employees</Text><Heading size="6" mt="2">{scopedEmployees.length}</Heading></Card><Card size="3"><Text color="gray">Pending leave requests</Text><Heading size="6" mt="2">{pendingLeave}</Heading></Card></div><Card size="3"><Heading size="4">Order fulfillment queues</Heading><Text as="p" color="gray" mt="2">Sales: {confirmedSales.map((order) => order.orderNumber).join(", ") || "None"}</Text><Text as="p" color="gray" mt="2">Purchases: {confirmedPurchases.map((order) => order.orderNumber).join(", ") || "None"}</Text></Card></Flex>;
}
