import { Badge, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useBalanceSheet, useProfitLoss, useTrialBalance } from "../features/reports/use-reports";
import { useSystemHealth } from "../features/system/use-system-health";

export function DashboardPage() {
  const health = useSystemHealth();
  const trialBalance = useTrialBalance({});
  const profitLoss = useProfitLoss({});
  const balanceSheet = useBalanceSheet({});
  const databaseReady = health.data?.database === "connected";
  const money = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card size="3"><Text color="gray" size="2">Net {profitLoss.data && profitLoss.data.totals.netProfit < 0 ? "loss" : "profit"}</Text><Heading mt="2" size="6">{profitLoss.data ? money.format(Math.abs(profitLoss.data.totals.netProfit)) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/profit-loss">View Profit & Loss</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Assets</Text><Heading mt="2" size="6">{balanceSheet.data ? money.format(balanceSheet.data.totals.assets) : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/balance-sheet">View Balance Sheet</Link></Text></Card>
        <Card size="3"><Text color="gray" size="2">Trial balance</Text><Heading mt="2" size="6">{trialBalance.data?.isBalanced ? "Balanced" : trialBalance.data ? "Out of balance" : "—"}</Heading><Text as="p" mt="2" size="2" color="gray"><Link to="/reports/trial-balance">View Trial Balance</Link></Text></Card>
      </div>
    </Flex>
  );
}
