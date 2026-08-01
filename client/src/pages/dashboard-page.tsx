import { useQuery } from "@tanstack/react-query";
import {
  ActivityLogIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BarChartIcon,
  CheckCircledIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  PersonIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { Badge, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LoadingScreen } from "../components/loading-screen";
import { Button } from "../components/ui/button";
import { AppSelect } from "../components/ui/select";
import { useAuth } from "../features/auth/auth-provider";
import { useBranches } from "../features/enterprise/use-enterprise";
import { fixedAssetsApi } from "../features/fixed-assets/fixed-assets-api";
import { payrollApi } from "../features/payroll/payroll-api";
import { purchaseOrdersApi } from "../features/purchase-orders/purchase-orders-api";
import {
  useBalanceSheet,
  useCashFlow,
  useDayBook,
  useExpenseTrend,
  useLowStock,
  useNegativeStock,
  useProfitLoss,
  useSalesTrend,
  useStockSummary,
  useTrialBalance,
  useVoucherSummary,
} from "../features/reports/use-reports";
import { salesOrdersApi } from "../features/sales-orders/sales-orders-api";
import { useSettings } from "../features/settings/use-settings";
import { useSystemHealth } from "../features/system/use-system-health";
import { BS_MONTHS, formatBsDate, parseBsDate, todayBsDate } from "../lib/nepali-date";
import { getCurrentFiscalYearDefaults } from "../lib/fiscal-year";

type Period = "3m" | "6m" | "12m" | "ytd";
type TrendPoint = { month: string; sales: number; expenses: number };

export function mergeDashboardTrends(
  sales: Array<{ month: string; amount: number }>,
  expenses: Array<{ month: string; amount: number }>,
): TrendPoint[] {
  const months = new Map<string, TrendPoint>();
  sales.forEach((item) => months.set(item.month, { month: item.month, sales: item.amount, expenses: months.get(item.month)?.expenses ?? 0 }));
  expenses.forEach((item) => months.set(item.month, { month: item.month, sales: months.get(item.month)?.sales ?? 0, expenses: item.amount }));
  return [...months.values()].sort((left, right) => left.month.localeCompare(right.month));
}

const periodStart = (period: Period) => {
  if (period === "ytd") return getCurrentFiscalYearDefaults().startDateBS;
  const months = period === "3m" ? 2 : period === "6m" ? 5 : 11;
  const today = parseBsDate(todayBsDate());
  if (!today) return "";
  const monthIndex = today.year * 12 + today.month - months;
  return formatBsDate({ year: Math.floor(monthIndex / 12), month: monthIndex % 12, day: 1 });
};
const monthLabel = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return `${BS_MONTHS[month - 1]?.slice(0, 3) ?? month} ${String(year).slice(-2)}`;
};

function StatCard({ label, value, detail, icon, tone = "green", href }: { label: string; value: string; detail: string; icon: ReactNode; tone?: "green" | "blue" | "amber" | "red"; href: string }) {
  return <Link className="dashboard-stat-link" to={href}><Card size="3" className={`dashboard-stat dashboard-stat--${tone}`}><Flex justify="between" align="start" gap="3"><div><Text as="p" className="dashboard-stat__label">{label}</Text><Heading size="6" mt="2" className="dashboard-stat__value">{value}</Heading></div><span className="dashboard-stat__icon" aria-hidden="true">{icon}</span></Flex><Flex justify="between" align="center" mt="3"><Text size="1" color="gray">{detail}</Text><ArrowRightIcon aria-hidden="true" /></Flex></Card></Link>;
}

function TrendChart({ data, money }: { data: TrendPoint[]; money: (value: number) => string }) {
  const width = 760;
  const height = 250;
  const padding = { left: 52, right: 20, top: 22, bottom: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(1, ...data.flatMap((item) => [item.sales, item.expenses]));
  const point = (value: number, index: number) => ({ x: padding.left + (data.length === 1 ? innerWidth / 2 : index * innerWidth / Math.max(1, data.length - 1)), y: padding.top + innerHeight - value / maximum * innerHeight });
  const line = (key: "sales" | "expenses") => data.map((item, index) => { const current = point(item[key], index); return `${current.x},${current.y}`; }).join(" ");
  const area = data.length ? `${padding.left},${padding.top + innerHeight} ${line("sales")} ${padding.left + innerWidth},${padding.top + innerHeight}` : "";
  if (!data.length) return <div className="dashboard-empty-chart"><BarChartIcon /><Text color="gray">No trend data is available for this period.</Text></div>;
  return <div className="dashboard-chart-wrap"><svg className="dashboard-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly sales and expenses trend"><defs><linearGradient id="dashboardSalesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#16936f" stopOpacity="0.22" /><stop offset="1" stopColor="#16936f" stopOpacity="0" /></linearGradient></defs>{[0, .25, .5, .75, 1].map((ratio) => { const y = padding.top + innerHeight * ratio; const value = maximum * (1 - ratio); return <g key={ratio}><line className="dashboard-chart__grid" x1={padding.left} x2={width - padding.right} y1={y} y2={y} /><text className="dashboard-chart__axis" x={padding.left - 9} y={y + 4} textAnchor="end">{money(value)}</text></g>; })}<polygon points={area} fill="url(#dashboardSalesArea)" /><polyline className="dashboard-chart__line dashboard-chart__line--sales" points={line("sales")} /><polyline className="dashboard-chart__line dashboard-chart__line--expenses" points={line("expenses")} />{data.map((item, index) => { const x = point(0, index).x; return <text key={item.month} className="dashboard-chart__axis" x={x} y={height - 13} textAnchor="middle">{monthLabel(item.month)}</text>; })}</svg></div>;
}

function CashFlowBars({ values, money }: { values: Array<{ label: string; value: number }>; money: (value: number) => string }) {
  const maximum = Math.max(1, ...values.map((item) => Math.abs(item.value)));
  return <div className="dashboard-flow-bars">{values.map((item) => <div className="dashboard-flow" key={item.label}><Flex justify="between" gap="3"><Text size="2">{item.label}</Text><Text size="2" weight="bold" color={item.value < 0 ? "red" : undefined}>{money(item.value)}</Text></Flex><div className="dashboard-flow__track"><span className={item.value < 0 ? "dashboard-flow__bar dashboard-flow__bar--negative" : "dashboard-flow__bar"} style={{ width: `${Math.max(2, Math.abs(item.value) / maximum * 100)}%` }} /></div></div>)}</div>;
}

function OperationalMetric({ label, value, detail, icon, href }: { label: string; value: string | number; detail: string; icon: ReactNode; href: string }) {
  return <Link className="dashboard-operation" to={href}><span className="dashboard-operation__icon" aria-hidden="true">{icon}</span><div><Text as="p" size="1" color="gray">{label}</Text><Text as="p" size="5" weight="bold" mt="1">{value}</Text><Text as="p" size="1" color="gray" mt="1">{detail}</Text></div></Link>;
}

export function DashboardPage() {
  const { session } = useAuth();
  const companyId = session?.activeCompany?.id ?? null;
  const [branchId, setBranchId] = useState("");
  const [period, setPeriod] = useState<Period>("6m");
  const filters = useMemo(() => ({ ...(branchId ? { branchId } : {}), from: periodStart(period), to: todayBsDate() }), [branchId, period]);
  const branchFilters = branchId ? { branchId } : {};
  const settings = useSettings(companyId);
  const health = useSystemHealth();
  const branches = useBranches();
  const trialBalance = useTrialBalance(branchFilters);
  const profitLoss = useProfitLoss(filters);
  const balanceSheet = useBalanceSheet(branchFilters);
  const cashFlow = useCashFlow(filters);
  const stockSummary = useStockSummary(branchFilters);
  const salesSummary = useVoucherSummary("sales", filters);
  const purchaseSummary = useVoucherSummary("purchase", filters);
  const salesTrend = useSalesTrend(filters);
  const expenseTrend = useExpenseTrend(filters);
  const lowStock = useLowStock();
  const negativeStock = useNegativeStock();
  const dayBook = useDayBook({ ...filters, page: 1, limit: 7 });
  const salesOrders = useQuery({ queryKey: ["sales-orders", "dashboard", branchId], queryFn: ({ signal }) => salesOrdersApi.list(branchId || undefined, signal) });
  const purchaseOrders = useQuery({ queryKey: ["purchase-orders", "dashboard", branchId], queryFn: ({ signal }) => purchaseOrdersApi.list(branchId || undefined, signal) });
  const fixedAssets = useQuery({ queryKey: ["fixed-assets", "dashboard"], queryFn: ({ signal }) => fixedAssetsApi.list(signal) });
  const employees = useQuery({ queryKey: ["payroll", "employees", "dashboard"], queryFn: ({ signal }) => payrollApi.employees(signal) });
  const leaveRequests = useQuery({ queryKey: ["payroll", "leave-requests", "dashboard"], queryFn: ({ signal }) => payrollApi.leaveRequests(signal) });
  const currency = settings.data?.currency || "NPR";
  const currencyFormatter = useMemo(() => new Intl.NumberFormat(undefined, { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }), [currency]);
  const fullMoneyFormatter = useMemo(() => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }), [currency]);
  const money = (value: number) => currencyFormatter.format(value);
  const fullMoney = (value: number) => fullMoneyFormatter.format(value);
  const trendData = useMemo(() => mergeDashboardTrends(salesTrend.data?.items ?? [], expenseTrend.data?.items ?? []), [salesTrend.data, expenseTrend.data]);
  const confirmedSales = salesOrders.data?.items.filter((order) => order.status === "CONFIRMED").length ?? 0;
  const confirmedPurchases = purchaseOrders.data?.items.filter((order) => order.status === "CONFIRMED").length ?? 0;
  const activeAssets = fixedAssets.data?.filter((asset) => asset.status === "ACTIVE" && (!branchId || asset.branchId === branchId)) ?? [];
  const scopedEmployees = employees.data?.filter((employee) => !branchId || employee.branchId === branchId) ?? [];
  const scopedEmployeeIds = new Set(scopedEmployees.map((employee) => employee._id));
  const pendingLeave = leaveRequests.data?.filter((request) => request.status === "PENDING" && (!branchId || scopedEmployeeIds.has(request.employeeId))).length ?? 0;
  const currentBranch = branches.data?.find((branch) => branch.id === branchId)?.name;
  const primaryLoading = profitLoss.isLoading && balanceSheet.isLoading && cashFlow.isLoading && salesSummary.isLoading;
  const reportError = [profitLoss, balanceSheet, cashFlow, stockSummary, salesSummary, purchaseSummary, salesTrend, expenseTrend, dayBook].some((query) => query.isError);
  const isRefreshing = [profitLoss, balanceSheet, cashFlow, stockSummary, salesSummary, purchaseSummary, salesTrend, expenseTrend, dayBook].some((query) => query.isFetching);
  const refresh = () => void Promise.all([profitLoss.refetch(), balanceSheet.refetch(), cashFlow.refetch(), stockSummary.refetch(), salesSummary.refetch(), purchaseSummary.refetch(), salesTrend.refetch(), expenseTrend.refetch(), dayBook.refetch(), salesOrders.refetch(), purchaseOrders.refetch(), fixedAssets.refetch(), employees.refetch(), leaveRequests.refetch(), health.refetch()]);

  if (primaryLoading) return <LoadingScreen fullScreen={false} label="Loading dashboard" description="Preparing your financial and operational overview…" />;

  return <main className="dashboard-page"><section className="dashboard-hero"><div><Flex align="center" gap="2" mb="2"><Badge color="green" variant="soft">Active fiscal year</Badge><Text size="1" color="gray">{currentBranch ?? "All branches"}</Text></Flex><Heading size="8">Business overview</Heading><Text as="p" color="gray" mt="2">Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}. Here is how {session?.activeCompany?.name ?? "your company"} is performing.</Text></div><Flex gap="3" align="end" wrap="wrap" className="dashboard-controls"><label>Period<AppSelect value={period} onChange={(event) => setPeriod(event.target.value as Period)}><option value="3m">Last 3 months</option><option value="6m">Last 6 months</option><option value="12m">Last 12 months</option><option value="ytd">Year to date</option></AppSelect></label><label>Branch<AppSelect value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">All branches</option>{branches.data?.filter((branch) => branch.isActive).map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</AppSelect></label><Button variant="outline" onClick={refresh} disabled={isRefreshing}><ReloadIcon className={isRefreshing ? "dashboard-spin" : undefined} />Refresh</Button></Flex></section>{reportError ? <Card size="2" className="dashboard-warning"><ExclamationTriangleIcon /><Text size="2">Some dashboard reports could not be loaded. Available data is still shown; try refreshing.</Text></Card> : null}<section className="dashboard-stats" aria-label="Financial summary"><StatCard label="Net profit" value={profitLoss.data ? money(profitLoss.data.totals.netProfit) : "—"} detail={`${money(profitLoss.data?.totals.income ?? 0)} income`} icon={(profitLoss.data?.totals.netProfit ?? 0) < 0 ? <ArrowDownIcon /> : <ArrowUpIcon />} tone={(profitLoss.data?.totals.netProfit ?? 0) < 0 ? "red" : "green"} href="/reports/profit-loss" /><StatCard label="Sales" value={salesSummary.data ? money(salesSummary.data.totals.amount) : "—"} detail={`${salesSummary.data?.totals.count ?? 0} posted vouchers`} icon={<BarChartIcon />} tone="blue" href="/reports/sales-summary" /><StatCard label="Expenses" value={profitLoss.data ? money(profitLoss.data.totals.expenses) : "—"} detail={`${purchaseSummary.data?.totals.count ?? 0} purchase vouchers`} icon={<ArrowDownIcon />} tone="amber" href="/reports/expense-summary" /><StatCard label="Closing cash" value={cashFlow.data ? money(cashFlow.data.closingBalance) : "—"} detail={`${money(cashFlow.data?.totals.netCashFlow ?? 0)} net movement`} icon={<ActivityLogIcon />} tone="green" href="/reports/cash-flow" /><StatCard label="Inventory value" value={stockSummary.data ? money(stockSummary.data.totals.stockValue) : "—"} detail={`${stockSummary.data?.totals.quantityOnHand.toLocaleString() ?? "—"} units on hand`} icon={<CubeIcon />} tone="blue" href="/reports/stock-summary" /><StatCard label="Total assets" value={balanceSheet.data ? money(balanceSheet.data.totals.assets) : "—"} detail={balanceSheet.data?.isBalanced ? "Balance sheet balanced" : "Review balance sheet"} icon={<CheckCircledIcon />} tone={balanceSheet.data?.isBalanced ? "green" : "amber"} href="/reports/balance-sheet" /></section><section className="dashboard-main-grid"><Card size="3" className="dashboard-panel dashboard-panel--trend"><Flex justify="between" align="start" gap="3" wrap="wrap"><div><Heading size="5">Sales and expense trend</Heading><Text as="p" size="2" color="gray" mt="1">Monthly posted activity for the selected period</Text></div><div className="dashboard-chart-legend"><span><i className="dashboard-legend-dot dashboard-legend-dot--sales" />Sales</span><span><i className="dashboard-legend-dot dashboard-legend-dot--expenses" />Expenses</span></div></Flex><TrendChart data={trendData} money={money} /></Card><Card size="3" className="dashboard-panel"><Heading size="5">Cash flow</Heading><Text as="p" size="2" color="gray" mt="1">Movement by activity category</Text><CashFlowBars values={[{ label: "Operating", value: cashFlow.data?.totals.operating ?? 0 }, { label: "Investing", value: cashFlow.data?.totals.investing ?? 0 }, { label: "Financing", value: cashFlow.data?.totals.financing ?? 0 }]} money={fullMoney} /><div className="dashboard-cash-total"><Text size="2" color="gray">Net cash flow</Text><Heading size="5">{cashFlow.data ? fullMoney(cashFlow.data.totals.netCashFlow) : "—"}</Heading></div><Link className="dashboard-panel-link" to="/reports/cash-flow">View cash-flow statement <ArrowRightIcon /></Link></Card></section><section><Flex justify="between" align="end" mb="3"><div><Heading size="5">Operations</Heading><Text as="p" size="2" color="gray" mt="1">Queues and resources requiring day-to-day attention</Text></div><Link className="dashboard-panel-link" to="/reports/enterprise-operations">Operations report <ArrowRightIcon /></Link></Flex><Card size="3" className="dashboard-operations"><OperationalMetric label="Sales fulfillment" value={confirmedSales} detail="confirmed orders" icon={<ArrowUpIcon />} href="/sales-orders" /><OperationalMetric label="Purchase receipts" value={confirmedPurchases} detail="confirmed orders" icon={<ArrowDownIcon />} href="/purchase-orders" /><OperationalMetric label="Fixed assets" value={activeAssets.length} detail={money(activeAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0))} icon={<CubeIcon />} href="/fixed-assets" /><OperationalMetric label="Employees" value={scopedEmployees.length} detail={`${pendingLeave} pending leave`} icon={<PersonIcon />} href="/payroll" /></Card></section><section className="dashboard-bottom-grid"><Card size="3" className="dashboard-panel"><Flex justify="between" align="start"><div><Heading size="5">Inventory alerts</Heading><Text as="p" size="2" color="gray" mt="1">Company-wide stock exceptions</Text></div><Badge color={(negativeStock.data?.totals.products ?? 0) > 0 ? "red" : "green"}>{(lowStock.data?.totals.products ?? 0) + (negativeStock.data?.totals.products ?? 0)} alerts</Badge></Flex><div className="dashboard-alert-summary"><div><Text size="1" color="gray">Low stock</Text><Heading size="5">{lowStock.data?.totals.products ?? "—"}</Heading></div><div><Text size="1" color="gray">Negative stock</Text><Heading size="5" color={(negativeStock.data?.totals.products ?? 0) > 0 ? "red" : undefined}>{negativeStock.data?.totals.products ?? "—"}</Heading></div></div><div className="dashboard-alert-list">{negativeStock.data?.items.slice(0, 3).map((item) => <Link to="/reports/negative-stock" key={item.productId}><span><strong>{item.productName}</strong><small>{item.productSku}</small></span><Badge color="red">{item.quantityOnHand.toLocaleString()}</Badge></Link>)}{!negativeStock.data?.items.length && lowStock.data?.items.slice(0, 3).map((item) => <Link to="/reports/low-stock" key={item.productId}><span><strong>{item.productName}</strong><small>{item.productSku}</small></span><Badge color="amber">{item.quantityOnHand.toLocaleString()}</Badge></Link>)}{!negativeStock.data?.items.length && !lowStock.data?.items.length ? <div className="dashboard-all-clear"><CheckCircledIcon /><Text size="2">No stock exceptions found.</Text></div> : null}</div><Link className="dashboard-panel-link" to="/reports/low-stock">View inventory alerts <ArrowRightIcon /></Link></Card><Card size="3" className="dashboard-panel"><Flex justify="between" align="start"><div><Heading size="5">Recent activity</Heading><Text as="p" size="2" color="gray" mt="1">Latest vouchers in the selected scope</Text></div><Link className="dashboard-panel-link" to="/vouchers">View all</Link></Flex><div className="dashboard-activity-list">{dayBook.data?.items.map((item) => <Link to={`/vouchers/transactions/${item._id}`} key={item._id}><span className={`dashboard-activity-icon dashboard-activity-icon--${item.status.toLowerCase()}`}><ActivityLogIcon /></span><span><strong>{item.voucherNumber ?? "Draft voucher"}</strong><small>{item.narration || item.transactionType.replaceAll("_", " ")}</small></span><span className="dashboard-activity-meta"><Badge variant="soft">{item.status}</Badge><small>{item.transactionDate} BS</small></span></Link>)}{!dayBook.data?.items.length ? <div className="dashboard-all-clear"><Text size="2" color="gray">No voucher activity in this period.</Text></div> : null}</div></Card><Card size="3" className="dashboard-panel dashboard-quick-actions"><Heading size="5">Quick actions</Heading><Text as="p" size="2" color="gray" mt="1">Common accounting workflows</Text><div><Link to="/vouchers/sales/new"><ArrowUpIcon />New sales voucher<ArrowRightIcon /></Link><Link to="/vouchers/purchase/new"><ArrowDownIcon />New purchase voucher<ArrowRightIcon /></Link><Link to="/vouchers/receipt/new"><ActivityLogIcon />Record receipt<ArrowRightIcon /></Link><Link to="/masters/parties/new"><PersonIcon />Add party<ArrowRightIcon /></Link></div><div className="dashboard-system-status"><span className={health.data?.database === "connected" ? "dashboard-status-dot" : "dashboard-status-dot dashboard-status-dot--warning"} /><div><Text as="p" size="2" weight="bold">System {health.data?.database === "connected" ? "operational" : "needs attention"}</Text><Text as="p" size="1" color="gray">Database {health.data?.database ?? "status unavailable"}</Text></div></div></Card></section><footer className="dashboard-footer"><Text size="1" color="gray">Trial balance: {trialBalance.data?.isBalanced ? "Balanced" : trialBalance.data ? "Review required" : "Unavailable"}</Text><Text size="1" color="gray">Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text></footer></main>;
}
