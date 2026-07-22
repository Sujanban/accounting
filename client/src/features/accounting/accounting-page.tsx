import { Card, Dialog, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { EyeOpenIcon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../../components/loading-screen";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { ApiClientError } from "../../lib/query-client";
import { useAuth } from "../auth/auth-provider";
import {
  accountGroupTypes,
  type AccountGroup,
  type AccountGroupInput,
  type BalanceType,
  type ChartAccountGroup,
  type Ledger,
  type LedgerInput,
  type VoucherSequence,
  voucherTypeLabels,
} from "./accounting-api";
import {
  useAccountGroups,
  useArchiveAccountGroup,
  useArchiveLedger,
  useChartOfAccounts,
  useCreateAccountGroup,
  useCreateLedger,
  useLedgers,
  useRestoreAccountGroup,
  useRestoreLedger,
  useUpdateAccountGroup,
  useUpdateLedger,
  useUpdateVoucherSequence,
  useVoucherSequences,
} from "./use-accounting";

type MessageState = { text: string; tone: "error" | "success" } | null;

const requestMessage = (error: unknown) =>
  error instanceof ApiClientError
    ? error.message
    : "The change could not be saved.";
const groupFormDefaults = (): AccountGroupInput => ({
  name: "",
  type: "Assets",
  parentId: null,
  description: "",
});
const ledgerFormDefaults = (groupId = ""): LedgerInput => ({
  name: "",
  groupId,
  openingBalance: 0,
  openingBalanceType: "DEBIT",
  description: "",
  allowManualEntry: true,
});

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Flex justify="between" align="start" gap="4" wrap="wrap">
      <div>
        <Heading size="7">{title}</Heading>
        <Text as="p" color="gray" mt="2">
          {description}
        </Text>
      </div>
      {action}
    </Flex>
  );
}

function Message({ value }: { value: MessageState }) {
  return value ? (
    <Text color={value.tone === "error" ? "red" : "green"} role="alert">
      {value.text}
    </Text>
  ) : null;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Text as="p" color="gray" size="2" className="accounting-empty">
      {children}
    </Text>
  );
}

function GroupForm({
  value,
  groups,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  value: AccountGroupInput;
  groups: AccountGroup[];
  pending: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (value: AccountGroupInput) => Promise<void>;
}) {
  const [form, setForm] = useState(value);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="accounting-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim().length < 2) {
          setError("Enter an account group name with at least 2 characters.");
          return;
        }
        setError(null);
        void onSubmit({
          ...form,
          name: form.name.trim(),
          description: form.description?.trim() || null,
        });
      }}
    >
      <label>
        Group name
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>
      <label>
        Account type
        <AppSelect
          value={form.type}
          onChange={(event) =>
            setForm({
              ...form,
              type: event.target.value as AccountGroupInput["type"],
            })
          }
        >
          {accountGroupTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </AppSelect>
      </label>
      <label>
        Parent group
        <AppSelect
          value={form.parentId ?? ""}
          onChange={(event) =>
            setForm({ ...form, parentId: event.target.value || null })
          }
        >
          <option value="">No parent (top level)</option>
          {groups
            .filter((group) => group.isActive)
            .map((group) => (
              <option value={group.id} key={group.id}>
                {group.name}
              </option>
            ))}
        </AppSelect>
      </label>
      <label className="accounting-form__wide">
        Description
        <textarea
          value={form.description ?? ""}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={2}
        />
      </label>
      {error ? (
        <Text color="red" role="alert" className="accounting-form__wide">
          {error}
        </Text>
      ) : null}
      <div className="accounting-form__actions accounting-form__wide">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function AccountGroupsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [editing, setEditing] = useState<AccountGroup | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const groups = useAccountGroups(
    status === "active" ? true : status === "archived" ? false : undefined,
  );
  const activeGroups = useAccountGroups(true);
  const update = useUpdateAccountGroup();
  const archive = useArchiveAccountGroup();
  const restore = useRestoreAccountGroup();
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage({ text: success, tone: "success" });
      setEditing(null);
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }
  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Account groups"
        description="Organize your chart of accounts into a company-wide hierarchy."
        action={
          <Button
            onClick={() => {
              setMessage(null);
              setEditing(null);
              navigate("/accounting/account-groups/new");
            }}
          >
            Add account group
          </Button>
        }
      />
      <Message value={message} />
      <Card size="3">
        <div className="accounting-filters">
          <label>
            Status
            <AppSelect
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | "active" | "archived")
              }
            >
              <option value="all">All account groups</option>
              <option value="active">Active account groups</option>
              <option value="archived">Archived account groups</option>
            </AppSelect>
          </label>
        </div>
      </Card>
      {groups.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading account groups"
          description="Retrieving your account hierarchy…"
        />
      ) : groups.isError ? (
        <Message
          value={{ text: requestMessage(groups.error), tone: "error" }}
        />
      ) : (
        <Card size="3" className="accounting-table-card">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Parent</th>
                <th>Kind</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.data?.map((group) => (
                <tr key={group.id}>
                  <td>
                    <strong>{group.name}</strong>
                    {group.description ? (
                      <span>{group.description}</span>
                    ) : null}
                  </td>
                  <td>{group.type}</td>
                  <td>
                    {activeGroups.data?.find(
                      (candidate) => candidate.id === group.parentId,
                    )?.name ?? "—"}
                  </td>
                  <td>{group.isSystem ? "System" : "Custom"}</td>
                  <td>{group.isActive ? "Active" : "Archived"}</td>
                  <td className="accounting-table__actions">
                    <Button
                      size="1"
                      variant="ghost"
                      className="table-icon-button"
                      aria-label={group.isActive ? "Edit account group" : "View account group"}
                      title={group.isActive ? "Edit account group" : "View account group"}
                      onClick={() => {
                        setMessage(null);
                        if (group.isActive) {
                          navigate(`/accounting/account-groups/${group.id}/edit`);
                        } else {
                          setEditing(group);
                        }
                      }}
                    >
                      {group.isActive ? <Pencil1Icon className="table-action-icon" /> : <EyeOpenIcon className="table-action-icon" />}
                    </Button>
                    {group.isActive ? (
                      <Button
                        size="1"
                        variant="ghost"
                        className="table-icon-button"
                        aria-label="Archive account group"
                        disabled={group.isSystem || archive.isPending}
                        title={
                          group.isSystem
                            ? "System groups cannot be archived."
                            : undefined
                        }
                        onClick={() => {
                          if (window.confirm(`Archive ${group.name}?`))
                            void run(
                              () => archive.mutateAsync(group.id),
                              "Account group archived.",
                            );
                        }}
                      >
                        <TrashIcon className="table-action-icon" />
                      </Button>
                    ) : (
                      <Button
                        size="1"
                        variant="outline"
                        disabled={restore.isPending}
                        onClick={() =>
                          void run(
                            () => restore.mutateAsync(group.id),
                            "Account group restored.",
                          )
                        }
                      >
                        Restore
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!groups.data?.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>
                      No matching account groups found.
                    </EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}
      {editing ? (
        <Card size="3">
          <Heading size="4" mb="4">
            {editing.isActive ? `Edit ${editing.name}` : editing.name}
          </Heading>
          {editing.isActive ? (
            <GroupForm
              value={{
                name: editing.name,
                type: editing.type,
                parentId: editing.parentId,
                description: editing.description,
              }}
              groups={(activeGroups.data ?? []).filter(
                (group) => group.id !== editing.id,
              )}
              pending={update.isPending}
              submitLabel="Save changes"
              onCancel={() => setEditing(null)}
              onSubmit={(input) =>
                run(
                  () => update.mutateAsync({ id: editing.id, input }),
                  "Account group updated.",
                )
              }
            />
          ) : (
            <Button variant="outline" onClick={() => setEditing(null)}>
              Close
            </Button>
          )}
        </Card>
      ) : null}
    </Flex>
  );
}

export function AccountGroupEditPage() {
  const { accountGroupId } = useParams();
  const navigate = useNavigate();
  const groups = useAccountGroups(true);
  const update = useUpdateAccountGroup();
  const [message, setMessage] = useState<MessageState>(null);
  const group = groups.data?.find((item) => item.id === accountGroupId);

  async function save(input: AccountGroupInput) {
    if (!group) return;
    try {
      await update.mutateAsync({ id: group.id, input });
      navigate("/accounting/account-groups", { replace: true });
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }

  if (groups.isLoading) {
    return <LoadingScreen fullScreen={false} label="Loading account group" description="Retrieving account group details…" />;
  }
  if (groups.isError) {
    return <Message value={{ text: requestMessage(groups.error), tone: "error" }} />;
  }
  if (!group) {
    return (
      <Flex direction="column" gap="4">
        <PageHeader
          title="Account group unavailable"
          description="This account group is not active for the current company."
        />
        <Button variant="outline" onClick={() => navigate("/accounting/account-groups")}>
          Back to account groups
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title={`Edit ${group.name}`}
        description="Update the account group hierarchy for this company."
      />
      <Message value={message} />
      <Card size="3">
        <GroupForm
          value={{
            name: group.name,
            type: group.type,
            parentId: group.parentId,
            description: group.description,
          }}
          groups={(groups.data ?? []).filter((item) => item.id !== group.id)}
          pending={update.isPending}
          submitLabel="Save account group"
          onCancel={() => navigate("/accounting/account-groups")}
          onSubmit={save}
        />
      </Card>
    </Flex>
  );
}

export function AccountGroupCreatePage() {
  const navigate = useNavigate();
  const groups = useAccountGroups(true);
  const create = useCreateAccountGroup();
  const [message, setMessage] = useState<MessageState>(null);

  async function save(input: AccountGroupInput) {
    try {
      await create.mutateAsync(input);
      navigate("/accounting/account-groups", { replace: true });
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }

  if (groups.isLoading) {
    return <LoadingScreen fullScreen={false} label="Loading account groups" description="Preparing the account group form…" />;
  }
  if (groups.isError) {
    return <Message value={{ text: requestMessage(groups.error), tone: "error" }} />;
  }

  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Add account group"
        description="Create a custom group in your company account hierarchy."
      />
      <Message value={message} />
      <Card size="3">
        <GroupForm
          value={groupFormDefaults()}
          groups={groups.data ?? []}
          pending={create.isPending}
          submitLabel="Create account group"
          onCancel={() => navigate("/accounting/account-groups")}
          onSubmit={save}
        />
      </Card>
    </Flex>
  );
}

function LedgerForm({
  value,
  groups,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  value: LedgerInput;
  groups: AccountGroup[];
  pending: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (value: LedgerInput) => Promise<void>;
}) {
  const [form, setForm] = useState(value);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="accounting-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim().length < 2 || !form.groupId) {
          setError("Enter a ledger name and select an account group.");
          return;
        }
        setError(null);
        void onSubmit({
          ...form,
          name: form.name.trim(),
          openingBalance: Number(form.openingBalance),
          description: form.description?.trim() || null,
        });
      }}
    >
      <label>
        Ledger name
        <input
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
      </label>
      <label>
        Account group
        <AppSelect
          value={form.groupId}
          onChange={(event) =>
            setForm({ ...form, groupId: event.target.value })
          }
          required
        >
          <option value="">Select a group</option>
          {groups
            .filter((group) => group.isActive)
            .map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
        </AppSelect>
      </label>
      <label>
        Opening balance
        <input
          type="number"
          step="any"
          value={form.openingBalance}
          onChange={(event) =>
            setForm({ ...form, openingBalance: Number(event.target.value) })
          }
        />
      </label>
      <label>
        Balance type
        <AppSelect
          value={form.openingBalanceType}
          onChange={(event) =>
            setForm({
              ...form,
              openingBalanceType: event.target.value as BalanceType,
            })
          }
        >
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
        </AppSelect>
      </label>
      <label className="accounting-form__wide">
        Description
        <textarea
          value={form.description ?? ""}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={2}
        />
      </label>
      <label className="accounting-toggle accounting-form__wide">
        Allow manual entry{" "}
        <Switch
          checked={form.allowManualEntry}
          onCheckedChange={(allowManualEntry) =>
            setForm({ ...form, allowManualEntry })
          }
        />
      </label>
      {error ? (
        <Text color="red" role="alert" className="accounting-form__wide">
          {error}
        </Text>
      ) : null}
      <div className="accounting-form__actions accounting-form__wide">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function LedgersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"all" | "active" | "archived">("all");
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [editing, setEditing] = useState<Ledger | null>(null);
  const [ledgerToArchive, setLedgerToArchive] = useState<Ledger | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const filters = useMemo(
    () => ({
      search: search || undefined,
      groupId: groupId || undefined,
      isActive:
        status === "active" ? true : status === "archived" ? false : undefined,
    }),
    [groupId, search, status],
  );
  const ledgers = useLedgers(filters);
  const groups = useAccountGroups(true);
  const update = useUpdateLedger();
  const archive = useArchiveLedger();
  const restore = useRestoreLedger();
  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage({ text: success, tone: "success" });
      setEditing(null);
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }
  async function confirmArchive() {
    if (!ledgerToArchive) return;
    try {
      await archive.mutateAsync(ledgerToArchive.id);
      setMessage({ text: "Ledger archived.", tone: "success" });
      setLedgerToArchive(null);
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }
  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Ledgers"
        description="Manage fiscal-year opening balances and posting permissions."
        action={
          <Button
            onClick={() => {
              setMessage(null);
              setEditing(null);
              navigate("/accounting/ledgers/new");
            }}
          >
            Add ledger
          </Button>
        }
      />
      <Message value={message} />
      <Card size="3">
        <div className="accounting-filters">
          <label>
            Search
            <input
              value={search}
              placeholder="Ledger name"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Account group
            <AppSelect
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              <option value="">All groups</option>
              {groups.data?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Status
            <AppSelect
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | "active" | "archived")
              }
            >
              <option value="all">All ledgers</option>
              <option value="active">Active ledgers</option>
              <option value="archived">Archived ledgers</option>
            </AppSelect>
          </label>
        </div>
      </Card>
      {ledgers.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading ledgers"
          description="Retrieving fiscal-year ledger data…"
        />
      ) : ledgers.isError ? (
        <Message
          value={{ text: requestMessage(ledgers.error), tone: "error" }}
        />
      ) : (
        <Card size="3" className="accounting-table-card">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Ledger</th>
                <th>Account group</th>
                <th>Opening balance</th>
                <th>Entry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ledgers.data?.map((ledger) => (
                <tr key={ledger.id}>
                  <td>
                    <strong>{ledger.name}</strong>
                    {ledger.description ? (
                      <span>{ledger.description}</span>
                    ) : null}
                  </td>
                  <td>
                    {groups.data?.find((group) => group.id === ledger.groupId)
                      ?.name ?? "—"}
                  </td>
                  <td>
                    {ledger.openingBalance.toLocaleString()}{" "}
                    {ledger.openingBalanceType.toLowerCase()}
                  </td>
                  <td>
                    {ledger.allowManualEntry ? "Manual allowed" : "Restricted"}
                  </td>
                  <td>{ledger.isActive ? "Active" : "Archived"}</td>
                  <td className="accounting-table__actions">
                    {ledger.isActive ? (
                      <Button
                        size="1"
                        variant="ghost"
                        className="table-icon-button"
                        aria-label="Edit ledger"
                        title="Edit ledger"
                        onClick={() => navigate(`/accounting/ledgers/${ledger.id}/edit`)}
                      >
                        <Pencil1Icon className="table-action-icon" />
                      </Button>
                    ) : null}
                    {ledger.isActive ? (
                      <Button
                        size="1"
                        variant="ghost"
                        className="table-icon-button"
                        aria-label="Archive ledger"
                        disabled={ledger.isSystem || archive.isPending}
                        title={
                          ledger.isSystem
                            ? "System ledgers cannot be archived."
                            : undefined
                        }
                        onClick={() => setLedgerToArchive(ledger)}
                      >
                        <TrashIcon className="table-action-icon" />
                      </Button>
                    ) : (
                      <Button
                        size="1"
                        variant="outline"
                        disabled={restore.isPending}
                        onClick={() =>
                          void run(
                            () => restore.mutateAsync(ledger.id),
                            "Ledger restored.",
                          )
                        }
                      >
                        Restore
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!ledgers.data?.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>No matching ledgers found.</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}
      {editing ? (
        <Card size="3">
          <Heading size="4" mb="4">
            {editing.isActive ? `Edit ${editing.name}` : editing.name}
          </Heading>
          {editing.isActive ? (
            <LedgerForm
              value={{
                name: editing.name,
                groupId: editing.groupId,
                openingBalance: editing.openingBalance,
                openingBalanceType: editing.openingBalanceType,
                description: editing.description,
                allowManualEntry: editing.allowManualEntry,
              }}
              groups={groups.data ?? []}
              pending={update.isPending}
              submitLabel="Save changes"
              onCancel={() => setEditing(null)}
              onSubmit={(input) =>
                run(
                  () => update.mutateAsync({ id: editing.id, input }),
                  "Ledger updated.",
                )
              }
            />
          ) : (
            <Button variant="outline" onClick={() => setEditing(null)}>
              Close
            </Button>
          )}
        </Card>
      ) : null}
      <Dialog.Root
        open={Boolean(ledgerToArchive)}
        onOpenChange={(open) => {
          if (!open && !archive.isPending) setLedgerToArchive(null);
        }}
      >
        <Dialog.Content className="archive-dialog" maxWidth="420px">
          <Dialog.Title>Archive ledger?</Dialog.Title>
          <Dialog.Description mt="2">
            {ledgerToArchive
              ? `“${ledgerToArchive.name}” will no longer be available for new entries. You can restore it later.`
              : ""}
          </Dialog.Description>
          <Flex justify="end" gap="3" mt="5">
            <Button
              type="button"
              variant="outline"
              disabled={archive.isPending}
              onClick={() => setLedgerToArchive(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={archive.isPending}
              onClick={() => void confirmArchive()}
            >
              Archive ledger
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}

export function LedgerEditPage() {
  const { ledgerId } = useParams();
  const navigate = useNavigate();
  const ledgers = useLedgers({ isActive: true });
  const groups = useAccountGroups(true);
  const update = useUpdateLedger();
  const [message, setMessage] = useState<MessageState>(null);
  const ledger = ledgers.data?.find((item) => item.id === ledgerId);

  async function save(input: LedgerInput) {
    if (!ledger) return;
    try {
      await update.mutateAsync({ id: ledger.id, input });
      navigate("/accounting/ledgers", { replace: true });
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }

  if (ledgers.isLoading || groups.isLoading) {
    return <LoadingScreen fullScreen={false} label="Loading ledger" description="Retrieving ledger details…" />;
  }
  if (ledgers.isError) {
    return <Message value={{ text: requestMessage(ledgers.error), tone: "error" }} />;
  }
  if (groups.isError) {
    return <Message value={{ text: requestMessage(groups.error), tone: "error" }} />;
  }
  if (!ledger) {
    return (
      <Flex direction="column" gap="4">
        <PageHeader
          title="Ledger unavailable"
          description="This ledger is not part of the active fiscal year."
        />
        <Button variant="outline" onClick={() => navigate("/accounting/ledgers")}>
          Back to ledgers
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title={`Edit ${ledger.name}`}
        description="Update the ledger for the active fiscal year."
      />
      <Message value={message} />
      <Card size="3">
        <LedgerForm
          value={{
            name: ledger.name,
            groupId: ledger.groupId,
            openingBalance: ledger.openingBalance,
            openingBalanceType: ledger.openingBalanceType,
            description: ledger.description,
            allowManualEntry: ledger.allowManualEntry,
          }}
          groups={groups.data ?? []}
          pending={update.isPending}
          submitLabel="Save ledger"
          onCancel={() => navigate("/accounting/ledgers")}
          onSubmit={save}
        />
      </Card>
    </Flex>
  );
}

function countChartAccounts(nodes: ChartAccountGroup[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + node.ledgers.length + countChartAccounts(node.children),
    0,
  );
}

function countChartLedgers(nodes: ChartAccountGroup[]): number {
  return nodes.reduce(
    (total, node) => total + node.ledgers.length + countChartLedgers(node.children),
    0,
  );
}

export function LedgerCreatePage() {
  const navigate = useNavigate();
  const groups = useAccountGroups(true);
  const create = useCreateLedger();
  const [message, setMessage] = useState<MessageState>(null);

  async function save(input: LedgerInput) {
    try {
      await create.mutateAsync(input);
      navigate("/accounting/ledgers", { replace: true });
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }

  if (groups.isLoading) {
    return <LoadingScreen fullScreen={false} label="Loading account groups" description="Preparing the ledger form…" />;
  }
  if (groups.isError) {
    return <Message value={{ text: requestMessage(groups.error), tone: "error" }} />;
  }

  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Add ledger"
        description="Create a ledger for the active fiscal year."
      />
      <Message value={message} />
      <Card size="3">
        <LedgerForm
          value={ledgerFormDefaults()}
          groups={groups.data ?? []}
          pending={create.isPending}
          submitLabel="Create ledger"
          onCancel={() => navigate("/accounting/ledgers")}
          onSubmit={save}
        />
      </Card>
    </Flex>
  );
}

function ChartNode({ node, depth = 0 }: { node: ChartAccountGroup; depth?: number }) {
  const childCount = node.children.length;
  const ledgerCount = node.ledgers.length;
  return (
    <details
      className={`chart-node chart-node--${node.type.toLowerCase()} ${depth === 0 ? "chart-node--root" : ""}`}
      open={depth === 0}
    >
      <summary>
        <span className="chart-node__title">
          <span className="chart-node__marker" aria-hidden="true" />
          <span>
            <strong>{node.name}</strong>
            <small>{childCount ? `${childCount} group${childCount === 1 ? "" : "s"}` : "No subgroups"} · {ledgerCount} ledger{ledgerCount === 1 ? "" : "s"}</small>
          </span>
        </span>
        <span className="chart-node__type">{node.type}</span>
      </summary>
      <div className="chart-node__children">
        {node.ledgers.map((ledger) => (
          <div className="chart-ledger" key={ledger.id}>
            <span className="chart-ledger__name">{ledger.name}</span>
            <span className="chart-ledger__balance">{ledger.openingBalance.toLocaleString()} {ledger.openingBalanceType.toLowerCase()}</span>
          </div>
        ))}
        {node.children.map((child) => <ChartNode node={child} depth={depth + 1} key={child.id} />)}
        {!ledgerCount && !childCount ? <Text color="gray" size="1">No child accounts</Text> : null}
      </div>
    </details>
  );
}

function ChartOfAccountsPage() {
  const chart = useChartOfAccounts();
  const [search, setSearch] = useState("");
  const tree = useMemo(() => {
    const filter = (node: ChartAccountGroup): ChartAccountGroup | null => {
      const children = node.children
        .map(filter)
        .filter((child): child is ChartAccountGroup => Boolean(child));
      const ledgers = node.ledgers.filter((ledger) =>
        ledger.name.toLowerCase().includes(search.toLowerCase()),
      );
      return !search ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        children.length ||
        ledgers.length
        ? { ...node, children, ledgers }
        : null;
    };
    return (chart.data ?? [])
      .map(filter)
      .filter((node): node is ChartAccountGroup => Boolean(node));
  }, [chart.data, search]);
  const totals = useMemo(
    () => ({
      accounts: countChartAccounts(chart.data ?? []),
      ledgers: countChartLedgers(chart.data ?? []),
      categories: chart.data?.length ?? 0,
    }),
    [chart.data],
  );
  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Chart of accounts"
        description="Browse the active account hierarchy and fiscal-year ledgers."
      />
      <Card size="3">
        <label className="accounting-search">
          Search accounts
          <input
            value={search}
            placeholder="Group or ledger name"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </Card>
      {!chart.isLoading && !chart.isError ? (
        <div className="chart-summary">
          <div><span>Account groups</span><strong>{totals.accounts - totals.ledgers}</strong></div>
          <div><span>Ledgers</span><strong>{totals.ledgers}</strong></div>
          <div><span>Top-level categories</span><strong>{totals.categories}</strong></div>
        </div>
      ) : null}
      {chart.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading chart of accounts"
          description="Building your account hierarchy…"
        />
      ) : chart.isError ? (
        <Message value={{ text: requestMessage(chart.error), tone: "error" }} />
      ) : (
        <Card size="3" className="chart-tree">
          {tree.map((node) => (
            <ChartNode node={node} key={node.id} />
          ))}
          {!tree.length ? (
            <EmptyState>No matching accounts found.</EmptyState>
          ) : null}
        </Card>
      )}
    </Flex>
  );
}

function VoucherNumberingPage() {
  const sequences = useVoucherSequences();
  const navigate = useNavigate();
  const { session } = useAuth();
  const canEdit = ["OWNER", "ADMIN"].includes(
    session?.activeMembership?.role ?? "",
  );
  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title="Voucher numbering"
        description="Review and control the next voucher number for the active fiscal year."
      />
      {!canEdit ? (
        <Text color="gray">
          Only owners and administrators can edit voucher numbering.
        </Text>
      ) : null}
      {sequences.isLoading ? (
        <LoadingScreen
          fullScreen={false}
          label="Loading voucher numbering"
          description="Retrieving active fiscal-year sequences…"
        />
      ) : sequences.isError ? (
        <Message
          value={{ text: requestMessage(sequences.error), tone: "error" }}
        />
      ) : (
        <Card size="3" className="accounting-table-card">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Voucher type</th>
                <th>Prefix</th>
                <th>Next number</th>
                <th>Padding</th>
                <th>Resets annually</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sequences.data?.map((sequence) => (
                <tr key={sequence.id}>
                  <td>
                    <strong>
                      {voucherTypeLabels[sequence.voucherType] ??
                        sequence.voucherType}
                    </strong>
                  </td>
                  <td>{sequence.prefix}</td>
                  <td>{sequence.nextNumber}</td>
                  <td>{sequence.padding}</td>
                  <td>{sequence.resetEveryFiscalYear ? "Yes" : "No"}</td>
                  <td>
                    {canEdit ? (
                      <Button
                        size="1"
                        variant="ghost"
                        className="table-icon-button"
                        aria-label={`Edit ${voucherTypeLabels[sequence.voucherType] ?? sequence.voucherType} numbering`}
                        title={`Edit ${voucherTypeLabels[sequence.voucherType] ?? sequence.voucherType} numbering`}
                        onClick={() =>
                          navigate(
                            `/accounting/voucher-numbering/${sequence.id}/edit`,
                          )
                        }
                      >
                        <Pencil1Icon className="table-action-icon" />
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {!sequences.data?.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>
                      No voucher sequences are available for this fiscal year.
                    </EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}
    </Flex>
  );
}

function VoucherSequenceForm({
  sequence,
  pending,
  onCancel,
  onSubmit,
}: {
  sequence: VoucherSequence;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (
    input: Pick<
      VoucherSequence,
      "prefix" | "nextNumber" | "padding" | "resetEveryFiscalYear"
    >,
  ) => Promise<void>;
}) {
  const [prefix, setPrefix] = useState(sequence.prefix);
  const [nextNumber, setNextNumber] = useState(sequence.nextNumber);
  const [padding, setPadding] = useState(sequence.padding);
  const [resetEveryFiscalYear, setResetEveryFiscalYear] = useState(
    sequence.resetEveryFiscalYear,
  );
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="accounting-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (
          prefix.trim().length < 2 ||
          !Number.isInteger(nextNumber) ||
          nextNumber < 1 ||
          !Number.isInteger(padding) ||
          padding < 1
        ) {
          setError(
            "Prefix must have at least 2 characters; number and padding must be positive integers.",
          );
          return;
        }
        setError(null);
        void onSubmit({
          prefix: prefix.trim(),
          nextNumber,
          padding,
          resetEveryFiscalYear,
        });
      }}
    >
      <label>
        Voucher type
        <input
          value={
            voucherTypeLabels[sequence.voucherType] ?? sequence.voucherType
          }
          disabled
        />
      </label>
      <label>
        Prefix
        <input
          value={prefix}
          onChange={(event) => setPrefix(event.target.value)}
          required
          minLength={2}
        />
      </label>
      <label>
        Next number
        <input
          type="number"
          min={1}
          value={nextNumber}
          onChange={(event) => setNextNumber(Number(event.target.value))}
          required
        />
      </label>
      <label>
        Number padding
        <input
          type="number"
          min={1}
          value={padding}
          onChange={(event) => setPadding(Number(event.target.value))}
          required
        />
      </label>
      <label className="accounting-toggle accounting-form__wide">
        Reset every fiscal year{" "}
        <Switch
          checked={resetEveryFiscalYear}
          onCheckedChange={setResetEveryFiscalYear}
        />
      </label>
      {error ? (
        <Text color="red" role="alert" className="accounting-form__wide">
          {error}
        </Text>
      ) : null}
      <div className="accounting-form__actions accounting-form__wide">
        <Button
          type="button"
          variant="outline"
          className="voucher-sequence-cancel"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Save voucher numbering
        </Button>
      </div>
    </form>
  );
}

export function VoucherSequenceEditPage() {
  const { voucherSequenceId } = useParams();
  const navigate = useNavigate();
  const sequences = useVoucherSequences();
  const update = useUpdateVoucherSequence();
  const { session } = useAuth();
  const canEdit = ["OWNER", "ADMIN"].includes(
    session?.activeMembership?.role ?? "",
  );
  const [message, setMessage] = useState<MessageState>(null);
  const sequence = sequences.data?.find(
    (item) => item.id === voucherSequenceId,
  );
  async function save(
    input: Pick<
      VoucherSequence,
      "prefix" | "nextNumber" | "padding" | "resetEveryFiscalYear"
    >,
  ) {
    if (!sequence) return;
    try {
      await update.mutateAsync({ id: sequence.id, input });
      navigate("/accounting/voucher-numbering", { replace: true });
    } catch (error) {
      setMessage({ text: requestMessage(error), tone: "error" });
    }
  }
  if (sequences.isLoading)
    return <LoadingScreen fullScreen={false} label="Loading voucher sequence" description="Retrieving voucher numbering details…" />;
  if (sequences.isError)
    return (
      <Message
        value={{ text: requestMessage(sequences.error), tone: "error" }}
      />
    );
  if (!sequence)
    return (
      <Flex direction="column" gap="4">
        <PageHeader
          title="Voucher sequence unavailable"
          description="This voucher sequence is not part of the active fiscal year."
        />
        <Button asChild variant="outline">
          <Link to="/accounting/voucher-numbering">
            Back to voucher numbering
          </Link>
        </Button>
      </Flex>
    );
  return (
    <Flex direction="column" gap="5">
      <PageHeader
        title={`Edit ${voucherTypeLabels[sequence.voucherType] ?? sequence.voucherType} numbering`}
        description="Changes apply only to the active fiscal year."
      />
      <Message value={message} />
      {!canEdit ? (
        <Card size="3">
          <Text>
            Only owners and administrators can edit voucher numbering.
          </Text>
          <Flex mt="4">
            <Button asChild variant="outline">
              <Link to="/accounting/voucher-numbering">
                Back to voucher numbering
              </Link>
            </Button>
          </Flex>
        </Card>
      ) : (
        <Card size="3">
          <VoucherSequenceForm
            sequence={sequence}
            pending={update.isPending}
            onCancel={() => navigate("/accounting/voucher-numbering")}
            onSubmit={save}
          />
        </Card>
      )}
    </Flex>
  );
}

export function AccountingPage() {
  const { section } = useParams();
  if (section === "account-groups") return <AccountGroupsPage />;
  if (section === "ledgers") return <LedgersPage />;
  if (section === "voucher-numbering") return <VoucherNumberingPage />;
  return <ChartOfAccountsPage />;
}
