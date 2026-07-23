import { Card, Dialog, Flex, Heading, Text } from "@radix-ui/themes";
import { Cross2Icon, Pencil1Icon, TrashIcon } from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../../components/loading-screen";
import { Button } from "../../components/ui/button";
import { AppSelect } from "../../components/ui/select";
import { ApiClientError } from "../../lib/query-client";
import {
  type Contact,
  type ContactInput,
  type ContactRole,
  type MasterAddress,
  type Product,
} from "./masters-api";
import {
  useArchiveContact,
  useCategories,
  useContact,
  useContacts,
  useCreateCategory,
  useCreateContact,
  useCreatePaymentTerm,
  useCreateProduct,
  useCreateTaxRate,
  useCreateUnit,
  usePaymentTerms,
  useProducts,
  useRestoreContact,
  useTaxRates,
  useUnits,
  useUpdateContact,
} from "./use-masters";

const roles: ContactRole[] = [
  "CUSTOMER",
  "SUPPLIER",
  "EMPLOYEE",
  "VENDOR",
  "TRANSPORTER",
  "OTHER",
];
const RequiredMark = () => <span className="form-required-mark" aria-hidden="true"> *</span>;
const messageFor = (error: unknown) =>
  error instanceof ApiClientError
    ? error.message
    : "The change could not be saved.";
function Header({
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
function Status({
  error,
  success,
}: {
  error?: unknown;
  success?: string | null;
}) {
  return error ? (
    <Text color="red" role="alert">
      {messageFor(error)}
    </Text>
  ) : success ? (
    <Text color="green" role="status">
      {success}
    </Text>
  ) : null;
}
function Content({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: unknown;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <LoadingScreen
        fullScreen={false}
        label="Loading master data"
        description="Retrieving your company records…"
      />
    );
  if (error) return <Status error={error} />;
  return <>{children}</>;
}

const emptyAddress = (): MasterAddress => ({
  line1: "",
  line2: "",
  city: "",
  district: "",
  country: "Nepal",
});
const isObjectId = (value: string | null | undefined) =>
  /^[a-f\d]{24}$/i.test(value ?? "");

function normalizeAddress(address: MasterAddress): MasterAddress {
  return {
    line1: address.line1?.trim() || null,
    line2: address.line2?.trim() || null,
    city: address.city?.trim() || null,
    district: address.district?.trim() || null,
    country: address.country?.trim() || null,
  };
}

function AddressFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MasterAddress;
  onChange: (address: MasterAddress) => void;
}) {
  const update = (field: keyof MasterAddress, fieldValue: string) =>
    onChange({ ...value, [field]: fieldValue });

  return (
    <fieldset className="contact-address-fields accounting-form__wide">
      <legend>{label}</legend>
      <div className="contact-address-fields__grid">
        <label>
          Address line 1
          <input placeholder="Street address" value={value.line1 ?? ""} onChange={(event) => update("line1", event.target.value)} />
        </label>
        <label>
          Address line 2
          <input placeholder="Building, floor, or landmark" value={value.line2 ?? ""} onChange={(event) => update("line2", event.target.value)} />
        </label>
        <label>
          City
          <input placeholder="Kathmandu" value={value.city ?? ""} onChange={(event) => update("city", event.target.value)} />
        </label>
        <label>
          District
          <input placeholder="Kathmandu" value={value.district ?? ""} onChange={(event) => update("district", event.target.value)} />
        </label>
        <label>
          Country
          <input placeholder="Nepal" value={value.country ?? ""} onChange={(event) => update("country", event.target.value)} />
        </label>
      </div>
    </fieldset>
  );
}

function ContactForm({
  value,
  pending,
  onSubmit,
  onCancel,
}: {
  value?: Contact;
  pending: boolean;
  onSubmit: (input: ContactInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<ContactInput>(() => ({
    contactCode: value?.contactCode ?? "",
    name: value?.name ?? "",
    displayName: value?.displayName ?? "",
    roles: value?.roles ?? ["CUSTOMER"],
    contactGroupId: isObjectId(value?.contactGroupId) ? value?.contactGroupId : "",
    panNumber: value?.panNumber ?? "",
    vatNumber: value?.vatNumber ?? "",
    phone: value?.phone ?? "",
    mobile: value?.mobile ?? "",
    email: value?.email ?? "",
    website: value?.website ?? "",
    billingAddress: value?.billingAddress ?? emptyAddress(),
    shippingAddress: value?.shippingAddress ?? emptyAddress(),
    creditLimit: value?.creditLimit,
    paymentTermId: value?.paymentTermId ?? "",
    notes: value?.notes ?? "",
  }));
  const [roleToAdd, setRoleToAdd] = useState("");
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const paymentTerms = usePaymentTerms();
  return (
    <form
      className="accounting-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!form.name.trim() || !form.contactCode.trim() || !form.roles.length)
          return;
        void onSubmit({
          ...form,
          contactCode: form.contactCode.trim(),
          name: form.name.trim(),
          displayName: form.displayName?.trim() || null,
          contactGroupId: form.contactGroupId?.trim() || null,
          panNumber: form.panNumber?.trim() || null,
          vatNumber: form.vatNumber?.trim() || null,
          phone: form.phone?.trim() || null,
          mobile: form.mobile?.trim() || null,
          email: form.email?.trim() || null,
          website: form.website?.trim() || null,
          billingAddress: normalizeAddress(form.billingAddress ?? emptyAddress()),
          shippingAddress: normalizeAddress(form.shippingAddress ?? emptyAddress()),
          notes: form.notes?.trim() || null,
          creditLimit: Number(form.creditLimit ?? 0),
          paymentTermId: form.paymentTermId || null,
        });
      }}
    >
      <label>
        <span>Contact code<RequiredMark /></span>
        <input
          placeholder="CUS-001"
          value={form.contactCode}
          disabled={Boolean(value)}
          onChange={(e) => setForm({ ...form, contactCode: e.target.value })}
          required
        />
      </label>
      <label>
        <span>Name<RequiredMark /></span>
        <input
          placeholder="ABC Traders"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </label>
      <label>
        <span>Roles<RequiredMark /></span>
        <AppSelect
          value={roleToAdd}
          onChange={(e) => {
            const role = e.target.value as ContactRole;
            if (role && !form.roles.includes(role)) {
              setForm({ ...form, roles: [...form.roles, role] });
            }
            setRoleToAdd("");
          }}
        >
          <option value="">Select a role to add</option>
          {roles.map((role) => (
            <option value={role} key={role} disabled={form.roles.includes(role)}>
              {role}
            </option>
          ))}
        </AppSelect>
        <span className="contact-role-list" aria-label="Selected roles">
          {form.roles.map((role) => (
            <span key={role} className="contact-role-chip">
              {role}
              <button
                type="button"
                className="contact-role-chip__remove"
                onClick={() => setForm({ ...form, roles: form.roles.filter((item) => item !== role) })}
                aria-label={`Remove ${role} role`}
              >
                <Cross2Icon aria-hidden="true" />
              </button>
            </span>
          ))}
        </span>
      </label>
      <label>
        Display name
        <input placeholder="Name used on invoices" value={form.displayName ?? ""} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
      </label>
      <label>
        PAN number
        <input placeholder="9-digit PAN" inputMode="numeric" maxLength={9} pattern="[0-9]{9}" value={form.panNumber ?? ""} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
      </label>
      <label>
        VAT number
        <input placeholder="9-digit VAT number" inputMode="numeric" maxLength={9} pattern="[0-9]{9}" value={form.vatNumber ?? ""} onChange={(e) => setForm({ ...form, vatNumber: e.target.value })} />
      </label>
      <label>
        Phone
        <input placeholder="01-4000000" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </label>
      <label>
        Mobile
        <input placeholder="98XXXXXXXX" value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
      </label>
      <label>
        Email
        <input type="email" placeholder="name@example.com" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </label>
      <label>
        Website
        <input type="url" placeholder="https://example.com" value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} />
      </label>
      <label>
        Payment term
        <AppSelect value={form.paymentTermId ?? ""} onChange={(e) => setForm({ ...form, paymentTermId: e.target.value || null })} disabled={paymentTerms.isLoading}>
          <option value="">No payment term</option>
          {paymentTerms.data?.map((term) => <option value={term.id} key={term.id}>{`${term.name} (${term.dueDays} days)`}</option>)}
        </AppSelect>
      </label>
      <label>
        Credit limit
        <input type="number" min="0" placeholder="0.00" value={form.creditLimit ?? ""} onChange={(e) => setForm({ ...form, creditLimit: e.target.value === "" ? undefined : Number(e.target.value) })} />
      </label>
      <div className="accounting-form__wide contact-additional-info-toggle">
        <Button type="button" variant="outline" onClick={() => setShowAdditionalInfo((visible) => !visible)} aria-expanded={showAdditionalInfo} aria-controls="party-additional-information">
          {showAdditionalInfo ? "Hide addresses" : "Additional information"}
        </Button>
      </div>
      {showAdditionalInfo ? (
        <div id="party-additional-information" className="contact-additional-info accounting-form__wide">
          <AddressFields label="Billing address" value={form.billingAddress ?? emptyAddress()} onChange={(billingAddress) => setForm({ ...form, billingAddress })} />
          <AddressFields label="Shipping address" value={form.shippingAddress ?? emptyAddress()} onChange={(shippingAddress) => setForm({ ...form, shippingAddress })} />
        </div>
      ) : null}
      <label className="accounting-form__wide">
        Notes
        <textarea rows={2} placeholder="Add any internal notes" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>
      <div className="accounting-form__actions accounting-form__wide">
        {onCancel ? (
          <Button type="button" variant="outline" className="contact-form__cancel" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={pending}>
          {value ? "Save contact" : "Create contact"}
        </Button>
      </div>
    </form>
  );
}

function PartiesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [success, setSuccess] = useState<string | null>(null);
  const [contactToArchive, setContactToArchive] = useState<Contact | null>(null);
  const contacts = useContacts({
    search: search || undefined,
    role: role || undefined,
    isActive: status,
  });
  const archive = useArchiveContact();
  const restore = useRestoreContact();
  async function confirmArchive() {
    if (!contactToArchive) return;
    try {
      await archive.mutateAsync(contactToArchive.id);
      setSuccess("Contact archived.");
      setContactToArchive(null);
    } catch {
      // The mutation error is rendered through the shared status message.
    }
  }
  async function restoreContact(contact: Contact) {
    try {
      await restore.mutateAsync(contact.id);
      setSuccess("Contact restored.");
    } catch {
      // The mutation error is rendered through the shared status message.
    }
  }
  return (
    <Flex direction="column" gap="5">
      <Header
        title="Parties"
        description="Maintain reusable customers, suppliers, and other business contacts."
        action={<Button onClick={() => navigate("/masters/parties/new")}>Add party</Button>}
      />
      <Status
        error={archive.error ?? restore.error}
        success={success}
      />
      <Card size="3">
        <div className="accounting-filters">
          <label>
            Search
            <input
              value={search}
              placeholder="Name, code, phone"
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Role
            <AppSelect value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {roles.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Status
            <AppSelect
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | "true" | "false")
              }
            >
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Archived</option>
            </AppSelect>
          </label>
        </div>
      </Card>
      <Content loading={contacts.isLoading} error={contacts.error}>
        <Card size="3" className="accounting-table-card">
          <table className="accounting-table">
            <thead>
              <tr>
                <th>Party</th>
                <th>Roles</th>
                <th>Contact</th>
                <th>Credit limit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.data?.items.map((contact) => (
                <tr key={contact.id} className={contact.isActive ? undefined : "archived-party-row"}>
                  <td>
                    <strong>{contact.name}</strong>
                    <span>{contact.contactCode}</span>
                  </td>
                  <td>{contact.roles.join(", ")}</td>
                  <td>
                    {contact.mobile || contact.phone || contact.email || "—"}
                  </td>
                  <td>{contact.creditLimit.toLocaleString()}</td>
                  <td>
                    <div className="accounting-table__actions">
                      {contact.isActive ? (
                        <>
                          <Button
                            size="1"
                            variant="ghost"
                            className="table-icon-button"
                            aria-label="Edit party"
                            onClick={() => navigate(`/masters/parties/${contact.id}/edit`)}
                          >
                            <Pencil1Icon className="table-action-icon" />
                          </Button>
                          <Button
                            size="1"
                            variant="ghost"
                            className="table-icon-button"
                            aria-label="Archive party"
                            disabled={archive.isPending || restore.isPending}
                            onClick={() => setContactToArchive(contact)}
                          >
                            <TrashIcon className="table-action-icon" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="1"
                          variant="outline"
                          disabled={restore.isPending || archive.isPending}
                          onClick={() => void restoreContact(contact)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!contacts.data?.items.length ? (
                <tr>
                  <td colSpan={5}>
                    <Text color="gray">No parties match your filters.</Text>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </Content>
      <Dialog.Root
        open={Boolean(contactToArchive)}
        onOpenChange={(open) => {
          if (!open && !archive.isPending) setContactToArchive(null);
        }}
      >
        <Dialog.Content className="archive-dialog" maxWidth="420px">
          <Dialog.Title>Archive party?</Dialog.Title>
          <Dialog.Description mt="2">
            {contactToArchive
              ? `“${contactToArchive.name}” will no longer be available for new entries.`
              : ""}
          </Dialog.Description>
          <Flex justify="end" gap="3" mt="5">
            <Button
              type="button"
              variant="outline"
              disabled={archive.isPending}
              onClick={() => setContactToArchive(null)}
            >
              Cancel
            </Button>
            <Button type="button" loading={archive.isPending} onClick={() => void confirmArchive()}>
              Archive party
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Flex>
  );
}

export function PartyCreatePage() {
  const navigate = useNavigate();
  const create = useCreateContact();
  const [error, setError] = useState<unknown>(null);

  async function save(input: ContactInput) {
    try {
      await create.mutateAsync(input);
      navigate("/masters/parties", { replace: true });
    } catch (requestError) {
      setError(requestError);
    }
  }

  return (
    <Flex direction="column" gap="5">
      <Header title="Add party" description="Create a customer, supplier, or other reusable business contact." />
      <Status error={error} />
      <Card size="3">
        <ContactForm pending={create.isPending} onSubmit={save} onCancel={() => navigate("/masters/parties")} />
      </Card>
    </Flex>
  );
}

export function PartyEditPage() {
  const navigate = useNavigate();
  const { partyId } = useParams();
  const contact = useContact(partyId);
  const update = useUpdateContact();
  const [error, setError] = useState<unknown>(null);

  async function save(input: ContactInput) {
    if (!partyId) return;
    try {
      const { contactCode: _contactCode, ...updateInput } = input;
      await update.mutateAsync({ id: partyId, input: updateInput });
      navigate("/masters/parties", { replace: true });
    } catch (requestError) {
      setError(requestError);
    }
  }

  return (
    <Flex direction="column" gap="5">
      <Header title="Edit party" description="Update a reusable customer, supplier, or other business contact." />
      <Status error={error ?? contact.error} />
      <Content loading={contact.isLoading} error={contact.error}>
        {contact.data ? (
          <Card size="3">
            <ContactForm value={contact.data} pending={update.isPending} onSubmit={save} onCancel={() => navigate("/masters/parties")} />
          </Card>
        ) : null}
      </Content>
    </Flex>
  );
}

type CatalogProps<T> = {
  title: string;
  description: string;
  loading: boolean;
  error: unknown;
  items: T[] | undefined;
  create: {
    mutateAsync: (input: any) => Promise<unknown>;
    isPending: boolean;
    error: unknown;
  };
  columns: string[];
  row: (item: T) => React.ReactNode;
  form: (
    submit: (event: React.FormEvent<HTMLFormElement>) => void,
    pending: boolean,
    onCancel?: () => void,
  ) => React.ReactNode;
  createPage?: boolean;
  masterType: string;
};
function Catalog<T>({
  title,
  description,
  loading,
  error,
  items,
  create,
  columns,
  row,
  form,
  createPage = false,
  masterType,
}: CatalogProps<T>) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(
    () =>
      items?.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [items, search],
  );
  const singularTitle = {
    units: "Unit",
    categories: "Product category",
    "tax-rates": "Tax rate",
    "payment-terms": "Payment term",
    products: "Product or service",
  }[masterType] ?? title;
  return (
    <Flex direction="column" gap="5">
      <Header
        title={createPage ? `Add ${singularTitle.toLowerCase()}` : title}
        description={createPage ? `Create a new ${singularTitle.toLowerCase()}.` : description}
        action={!createPage ? <Button onClick={() => navigate(`/masters/${masterType}/new`)}>Add {singularTitle}</Button> : undefined}
      />
      <Status error={error ?? create.error} />
      {!createPage ? (
        <Card size="3">
          <div className="accounting-filters">
            <label>
              Search
              <input
                value={search}
                placeholder={`Search ${title.toLowerCase()}`}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </Card>
      ) : null}
      <Content loading={loading} error={error}>
        {createPage ? (
          <Card size="3">
            {form((event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const input: Record<string, unknown> = Object.fromEntries(formData);
              for (const key of [
                "parentId",
                "categoryId",
                "taxId",
                "barcode",
                "description",
              ])
                if (input[key] === "") delete input[key];
              for (const key of [
                "percentage",
                "dueDays",
                "purchasePrice",
                "sellingPrice",
                "reorderLevel",
                "minimumStock",
              ])
                if (input[key] !== undefined) input[key] = Number(input[key]);
              input.decimalAllowed = formData.get("decimalAllowed") === "true";
              input.isService = formData.get("isService") === "true";
              void create.mutateAsync(input).then(() => {
                navigate(`/masters/${masterType}`, { replace: true });
              });
            }, create.isPending, () => navigate(`/masters/${masterType}`))}
          </Card>
        ) : null}
        {!createPage ? <Card size="3" className="accounting-table-card">
          <table className="accounting-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((item) => row(item))}
              {!filteredItems?.length ? (
                <tr>
                  <td colSpan={columns.length}>
                    <Text color="gray">No {title.toLowerCase()} match your filters.</Text>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
        : null}
      </Content>
    </Flex>
  );
}

function MastersCatalogPage({ type, createPage }: { type: string; createPage?: boolean }) {
  const units = useUnits(),
    categories = useCategories(),
    taxes = useTaxRates(),
    terms = usePaymentTerms(),
    products = useProducts();
  const unitCreate = useCreateUnit(),
    categoryCreate = useCreateCategory(),
    taxCreate = useCreateTaxRate(),
    termCreate = useCreatePaymentTerm(),
    productCreate = useCreateProduct();
  const simpleForm =
    (fields: React.ReactNode) =>
    (
      submit: (e: React.FormEvent<HTMLFormElement>) => void,
      pending: boolean,
      onCancel?: () => void,
    ) => (
      <form className="accounting-form" onSubmit={submit}>
        {fields}
        <div className="accounting-form__actions accounting-form__wide">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="submit" loading={pending}>
            Create
          </Button>
        </div>
      </form>
    );
  if (type === "units")
    return (
      <Catalog
        title="Units"
        description="Define the units of measure used by products and services."
        loading={units.isLoading}
        error={units.error}
        items={units.data}
        create={unitCreate}
        columns={["Name", "Symbol", "Precision"]}
        row={(x) => (
          <tr key={x.id}>
            <td>{x.name}</td>
            <td>{x.symbol}</td>
            <td>{x.decimalAllowed ? "Decimals allowed" : "Whole numbers"}</td>
          </tr>
        )}
        form={simpleForm(
          <>
            <label>
              Name
              <input name="name" placeholder="Kilogram" required minLength={2} />
            </label>
            <label>
              Symbol
              <input name="symbol" placeholder="kg" required />
            </label>
            <label>
              Precision
              <AppSelect name="decimalAllowed" defaultValue="true">
                <option value="true">Decimals allowed</option>
                <option value="false">Whole numbers only</option>
              </AppSelect>
            </label>
          </>,
        )}
        masterType={type}
        createPage={createPage}
      />
    );
  if (type === "categories")
    return (
      <Catalog
        title="Product categories"
        description="Organize products in a reusable hierarchy."
        loading={categories.isLoading}
        error={categories.error}
        items={categories.data}
        create={categoryCreate}
        columns={["Code", "Name", "Parent", "Description"]}
        row={(x) => (
          <tr key={x.id}>
            <td>{x.categoryCode}</td>
            <td>{x.name}</td>
            <td>
              {categories.data?.find((p) => p.id === x.parentId)?.name ?? "—"}
            </td>
            <td>{x.description ?? "—"}</td>
          </tr>
        )}
        form={simpleForm(
          <>
            <label>
              Code
              <input name="categoryCode" placeholder="OFFICE" required />
            </label>
            <label>
              Name
              <input name="name" placeholder="Office supplies" required minLength={2} />
            </label>
            <label>
              Parent
              <AppSelect name="parentId" defaultValue="">
                <option value="">No parent</option>
                {categories.data?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </AppSelect>
            </label>
            <label>
              Description
              <input name="description" placeholder="Optional category description" />
            </label>
          </>,
        )}
        masterType={type}
        createPage={createPage}
      />
    );
  if (type === "tax-rates")
    return (
      <Catalog
        title="Tax rates"
        description="Maintain reusable tax configurations for product pricing."
        loading={taxes.isLoading}
        error={taxes.error}
        items={taxes.data}
        create={taxCreate}
        columns={["Code", "Name", "Rate", "Type", "Effective from"]}
        row={(x) => (
          <tr key={x.id}>
            <td>{x.taxCode}</td>
            <td>{x.name}</td>
            <td>{x.percentage}%</td>
            <td>{x.type}</td>
            <td>{new Date(x.effectiveDate).toLocaleDateString()}</td>
          </tr>
        )}
        form={simpleForm(
          <>
            <label>
              Code
              <input name="taxCode" placeholder="VAT-13" required />
            </label>
            <label>
              Name
              <input name="name" placeholder="VAT 13%" required />
            </label>
            <label>
              Percentage
              <input
                name="percentage"
                placeholder="13"
                type="number"
                min="0"
                max="100"
                step="any"
                required
              />
            </label>
            <label>
              Type
              <AppSelect name="type" defaultValue="VAT">
                <option value="VAT">VAT</option>
                <option value="EXEMPT">Exempt</option>
                <option value="ZERO_RATED">Zero rated</option>
              </AppSelect>
            </label>
            <label>
              Effective date
              <input name="effectiveDate" type="date" placeholder="YYYY-MM-DD" required />
            </label>
          </>,
        )}
        masterType={type}
        createPage={createPage}
      />
    );
  if (type === "payment-terms")
    return (
      <Catalog
        title="Payment terms"
        description="Set standard payment due dates for your business parties."
        loading={terms.isLoading}
        error={terms.error}
        items={terms.data}
        create={termCreate}
        columns={["Name", "Due days", "Description"]}
        row={(x) => (
          <tr key={x.id}>
            <td>{x.name}</td>
            <td>{x.dueDays}</td>
            <td>{x.description ?? "—"}</td>
          </tr>
        )}
        form={simpleForm(
          <>
            <label>
              Name
              <input name="name" placeholder="Net 30" required />
            </label>
            <label>
              Due days
              <input name="dueDays" type="number" min="0" placeholder="30" required />
            </label>
            <label className="accounting-form__wide">
              Description
              <textarea name="description" rows={2} placeholder="Optional payment instructions" />
            </label>
          </>,
        )}
        masterType={type}
        createPage={createPage}
      />
    );
  return (
    <Catalog<Product>
      title="Products & services"
      description="Maintain the catalog used by future sales and purchase transactions."
      loading={products.isLoading}
      error={products.error}
      items={products.data}
      create={productCreate}
      columns={["SKU", "Name", "Type", "Selling price", "Unit"]}
      row={(x) => (
        <tr key={x.id}>
          <td>{x.sku}</td>
          <td>{x.name}</td>
          <td>{x.isService ? "Service" : "Product"}</td>
          <td>{x.sellingPrice.toLocaleString()}</td>
          <td>{units.data?.find((u) => u.id === x.unitId)?.symbol ?? "—"}</td>
        </tr>
      )}
      form={simpleForm(
        <>
          <label>
            SKU
            <input name="sku" placeholder="ITEM-001" required />
          </label>
          <label>
            Name
            <input name="name" placeholder="Office desk" required />
          </label>
          <label>
            Unit
            <AppSelect name="unitId" required defaultValue="">
              <option value="" disabled>
                Select a unit
              </option>
              {units.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Category
            <AppSelect name="categoryId" defaultValue="">
              <option value="">No category</option>
              {categories.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Purchase price
            <input
              name="purchasePrice"
              placeholder="0.00"
              type="number"
              min="0"
              step="any"
            />
          </label>
          <label>
            Selling price
            <input
              name="sellingPrice"
              placeholder="0.00"
              type="number"
              min="0"
              step="any"
            />
          </label>
          <label>
            Tax rate
            <AppSelect name="taxId" defaultValue="">
              <option value="">No tax rate</option>
              {taxes.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </AppSelect>
          </label>
          <label>
            Type
            <AppSelect name="isService" defaultValue="false">
              <option value="false">Product</option>
              <option value="true">Service</option>
            </AppSelect>
          </label>
          <label className="accounting-form__wide">
            Description
            <textarea name="description" rows={2} placeholder="Optional product or service description" />
          </label>
        </>,
      )}
      masterType={type}
      createPage={createPage}
    />
  );
}

export function MastersPage() {
  const { masterType = "parties" } = useParams();
  const location = useLocation();
  return masterType === "parties" ? (
    <PartiesPage />
  ) : (
    <MastersCatalogPage type={masterType} createPage={location.pathname.endsWith("/new")} />
  );
}
