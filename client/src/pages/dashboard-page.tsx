import { Badge, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "../components/ui/button";
import { useSystemHealth } from "../features/system/use-system-health";

export function DashboardPage() {
  const health = useSystemHealth();
  const databaseReady = health.data?.database === "connected";

  return (
    <Flex direction="column" gap="5">
      <div>
        <Heading size="7">Welcome to Ledgerly</Heading>
        <Text as="p" color="gray" mt="2">Your accounting workspace is ready for the next feature.</Text>
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
        {["Companies", "Transactions", "Reports"].map((label) => <Card key={label} size="3"><Text color="gray" size="2">{label}</Text><Heading mt="2" size="6">—</Heading><Text as="p" mt="2" size="2" color="gray">Connect this card to its feature query.</Text></Card>)}
      </div>
    </Flex>
  );
}
