import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLedgers } from "../features/accounting/use-accounting";
import { apiClient } from "../services/api-client";
import { Button } from "../components/ui/button";
import { AppSelect } from "../components/ui/select";
import { useActionDialog } from "../components/action-dialog";

type Entry = { ledgerId: string; amount: string; balanceType: "DEBIT" | "CREDIT" };
const submit = (path: string, entries: Entry[]) =>
  apiClient<{ totals: { debit: number; credit: number } }>(path, {
    method: "POST",
    body: JSON.stringify({ entries: entries.filter((entry) => entry.ledgerId && Number(entry.amount) > 0).map((entry) => ({ ...entry, amount: Number(entry.amount) })) }),
  });

export function OpeningBalancesPage() {
  const actionDialog = useActionDialog();
  const ledgers = useLedgers({ isActive: true }); const [entries, setEntries] = useState<Entry[]>([{ ledgerId: "", amount: "", balanceType: "DEBIT" }, { ledgerId: "", amount: "", balanceType: "CREDIT" }]);
  const preview = useMutation({ mutationFn: () => submit("/localization/opening-balances/preview", entries) });
  const generate = useMutation({ mutationFn: () => submit("/localization/opening-balances/generate", entries) });
  const update = (index: number, value: Partial<Entry>) => setEntries(entries.map((entry, current) => current === index ? { ...entry, ...value } : entry));
  return <Flex direction="column" gap="5"><div><Heading size="7">Opening balances</Heading><Text color="gray">Enter balanced opening figures once, before posting vouchers in this fiscal year.</Text></div><Card size="3"><Flex direction="column" gap="3">{entries.map((entry, index) => <Flex key={index} gap="2" wrap="wrap"><AppSelect value={entry.ledgerId} onChange={(event) => update(index, { ledgerId: event.target.value })}><option value="">Select ledger</option>{ledgers.data?.map((ledger) => <option key={ledger.id} value={ledger.id}>{ledger.name}</option>)}</AppSelect><input aria-label="Amount" type="number" min="0" step="0.01" value={entry.amount} onChange={(event) => update(index, { amount: event.target.value })} placeholder="Amount" /><AppSelect value={entry.balanceType} onChange={(event) => update(index, { balanceType: event.target.value as Entry["balanceType"] })}><option value="DEBIT">Debit</option><option value="CREDIT">Credit</option></AppSelect></Flex>)}<Flex gap="2"><Button variant="outline" onClick={() => setEntries([...entries, { ledgerId: "", amount: "", balanceType: "DEBIT" }])}>Add line</Button><Button variant="outline" loading={preview.isPending} onClick={() => preview.mutate()}>Preview</Button><Button loading={generate.isPending} onClick={async () => { if (await actionDialog.confirm({ title: "Finalize opening balances?", description: "This operation can only be completed once for the fiscal year and cannot be undone.", confirmLabel: "Finalize balances", destructive: true })) generate.mutate(); }}>Generate opening balances</Button></Flex>{preview.data ? <Text color="gray">Balanced: debit {preview.data.totals.debit.toFixed(2)} · credit {preview.data.totals.credit.toFixed(2)}</Text> : null}{generate.isSuccess ? <Text color="green">Opening balances finalized.</Text> : null}{preview.error || generate.error ? <Text color="red" role="alert">Opening balances could not be processed. Ensure all lines balance and no journals exist.</Text> : null}</Flex></Card>{actionDialog.dialog}</Flex>;
}
