import { Card, Flex, Heading, Switch, Text } from "@radix-ui/themes";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiClientError } from "../../lib/query-client";
import { FormSelect, FormTextField } from "../../components/forms/form-fields";
import { Button } from "../../components/ui/button";
import { getCurrentFiscalYearDefaults } from "../../lib/fiscal-year";
import { useAuth } from "../auth/auth-provider";
import { type CreateCompanyInput, type CreateSettingsInput } from "./onboarding-api";
import { useCreateCompany, useCreateSettings } from "./use-onboarding";

type CompanyForm = Omit<CreateCompanyInput, "fiscalYear" | "vatRegistered"> & {
  vatRegistered: boolean | null;
  fiscalYear: string;
  startDateBS: string;
  endDateBS: string;
  startDateAD: string;
  endDateAD: string;
};

const currentFiscalYear = getCurrentFiscalYearDefaults();

const initialCompany: CompanyForm = {
  name: "", panNumber: "", vatRegistered: null, vatNumber: "", phone: "", email: "", address: "", logo: "",
  fiscalYear: currentFiscalYear.name,
  startDateBS: currentFiscalYear.startDateBS,
  endDateBS: currentFiscalYear.endDateBS,
  startDateAD: currentFiscalYear.startDateAD,
  endDateAD: currentFiscalYear.endDateAD
};

const initialSettings: CreateSettingsInput = {
  businessType: "RETAIL", currency: "NPR", currencySymbol: "Rs.", language: "en", dateFormat: "BS", timezone: "Asia/Kathmandu", decimalPlaces: 2, allowNegativeStock: false
};

const currencyOptions = [
  { value: "NPR", label: "Nepalese Rupee (NPR)", symbol: "Rs." },
  { value: "INR", label: "Indian Rupee (INR)", symbol: "₹" },
  { value: "USD", label: "US Dollar (USD)", symbol: "$" }
];

function requestMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.";
}

export function OnboardingPage() {
  const { session, updateSession } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(session?.activeCompany ? 3 : 1);
  const [company, setCompany] = useState<CompanyForm>(initialCompany);
  const [settings, setSettings] = useState<CreateSettingsInput>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const companyMutation = useCreateCompany();
  const settingsMutation = useCreateSettings();

  if (session?.activeCompany?.onboardingCompleted) return <Navigate to="/" replace />;

  function updateCompany<Field extends keyof CompanyForm>(field: Field, value: CompanyForm[Field]) {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  function submitCompanyDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (company.vatRegistered === null) {
      setError("Select the company’s VAT registration status.");
      return;
    }
    if (company.vatRegistered && !company.vatNumber?.trim()) {
      setError("Enter the VAT number for a VAT-registered company.");
      return;
    }
    setStep(2);
  }

  async function submitFiscalYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const result = await companyMutation.mutateAsync({
        name: company.name, panNumber: company.panNumber, vatRegistered: company.vatRegistered ?? false,
        ...(company.vatRegistered ? { vatNumber: company.vatNumber } : {}),
        ...(company.phone ? { phone: company.phone } : {}), ...(company.email ? { email: company.email } : {}),
        ...(company.address ? { address: company.address } : {}), ...(company.logo ? { logo: company.logo } : {}),
        fiscalYear: { name: company.fiscalYear, startDateBS: company.startDateBS, endDateBS: company.endDateBS, startDateAD: company.startDateAD, endDateAD: company.endDateAD }
      });
      updateSession(result.session);
      setStep(3);
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const result = await settingsMutation.mutateAsync(settings);
      updateSession(result.session);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestMessage(requestError));
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="onboarding-container py-8">
        <Text size="3" weight="bold" className="text-indigo-700">Ledgerly</Text>
        <Flex justify="between" align="center" mt="4" mb="5"><div><Heading size="7">Set up your company</Heading><Text as="p" color="gray" mt="1">Step {step} of 3</Text></div><Text size="2" color="gray">Your setup is saved securely.</Text></Flex>
        <Card size="4">
          {step === 1 ? <form onSubmit={submitCompanyDetails}><Flex direction="column" gap="4">
            <Heading size="5">Company information</Heading>
            <FormTextField label="Company name" value={company.name} onChange={(event) => updateCompany("name", event.target.value)} required minLength={2} />
            <FormTextField label="PAN number" value={company.panNumber} onChange={(event) => updateCompany("panNumber", event.target.value)} inputMode="numeric" maxLength={9} required />
            <FormSelect label="VAT registration" value={company.vatRegistered === null ? "" : String(company.vatRegistered)} onValueChange={(value) => updateCompany("vatRegistered", value === "" ? null : value === "true")} options={[{ value: "false", label: "Not VAT registered" }, { value: "true", label: "VAT registered" }]} placeholder="Select VAT status" description="Choose the company’s current VAT registration status." required error={error?.includes("VAT") ? error : undefined} />
            {company.vatRegistered ? <FormTextField label="VAT number" value={company.vatNumber ?? ""} onChange={(event) => updateCompany("vatNumber", event.target.value)} required /> : null}
            <FormTextField label="Phone" type="tel" value={company.phone ?? ""} onChange={(event) => updateCompany("phone", event.target.value)} description="Optional" />
            <FormTextField label="Company email" type="email" value={company.email ?? ""} onChange={(event) => updateCompany("email", event.target.value)} description="Optional" />
            <FormTextField label="Address" value={company.address ?? ""} onChange={(event) => updateCompany("address", event.target.value)} description="Optional" />
            {error ? <ErrorMessage message={error} /> : null}<Flex justify="end"><Button type="submit" size="3">Continue</Button></Flex>
          </Flex></form> : null}
          {step === 2 ? <form onSubmit={submitFiscalYear}><Flex direction="column" gap="4">
            <Heading size="5">Fiscal year</Heading><Text color="gray" size="2">The current Nepali fiscal year is selected automatically. You can adjust it if this company uses a different period.</Text>
            <FormTextField label="Fiscal-year name" value={company.fiscalYear} onChange={(event) => updateCompany("fiscalYear", event.target.value)} required />
            <div className="grid gap-4 sm:grid-cols-2"><FormTextField label="Start date (BS)" value={company.startDateBS} onChange={(event) => updateCompany("startDateBS", event.target.value)} placeholder="2082-04-01" required /><FormTextField label="End date (BS)" value={company.endDateBS} onChange={(event) => updateCompany("endDateBS", event.target.value)} placeholder="2083-03-31" required /><FormTextField label="Start date (AD)" type="date" value={company.startDateAD} onChange={(event) => updateCompany("startDateAD", event.target.value)} required /><FormTextField label="End date (AD)" type="date" value={company.endDateAD} onChange={(event) => updateCompany("endDateAD", event.target.value)} required /></div>
            {error ? <ErrorMessage message={error} /> : null}<Flex justify="between"><Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button><Button type="submit" size="3" loading={companyMutation.isPending}>Create company</Button></Flex>
          </Flex></form> : null}
          {step === 3 ? <form onSubmit={submitSettings}><Flex direction="column" gap="4">
            <Heading size="5">Company settings</Heading><Text color="gray" size="2">These settings complete your onboarding and can be adjusted later where supported.</Text>
            <FormSelect label="Business type" value={settings.businessType} onValueChange={(businessType) => setSettings((current) => ({ ...current, businessType: businessType as CreateSettingsInput["businessType"] }))} options={["RETAIL", "WHOLESALE", "SERVICE", "MANUFACTURING", "PHARMACY", "RESTAURANT", "OTHER"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} required />
            <div className="grid gap-4 sm:grid-cols-2"><FormSelect label="Currency" value={settings.currency} onValueChange={(currency) => { const selected = currencyOptions.find((option) => option.value === currency); setSettings((current) => ({ ...current, currency, currencySymbol: selected?.symbol ?? current.currencySymbol })); }} options={currencyOptions.map(({ value, label }) => ({ value, label }))} required /><FormSelect label="Currency symbol" value={settings.currencySymbol} onValueChange={(currencySymbol) => setSettings((current) => ({ ...current, currencySymbol }))} options={currencyOptions.map(({ symbol, value }) => ({ value: symbol, label: `${symbol} (${value})` }))} required /><FormSelect label="Date format" value={settings.dateFormat} onValueChange={(dateFormat) => setSettings((current) => ({ ...current, dateFormat: dateFormat as "BS" | "AD" }))} options={[{ value: "BS", label: "Bikram Sambat (BS)" }, { value: "AD", label: "Gregorian (AD)" }]} required /><FormSelect label="Decimal places" value={String(settings.decimalPlaces)} onValueChange={(decimalPlaces) => setSettings((current) => ({ ...current, decimalPlaces: Number(decimalPlaces) }))} options={[0, 1, 2, 3, 4, 5, 6].map((value) => ({ value: String(value), label: String(value) }))} required /></div>
            <Flex justify="between" align="center"><div><Text as="p" weight="medium">Allow negative stock</Text><Text as="p" color="gray" size="2">Keep this off unless your workflow requires it.</Text></div><Switch checked={settings.allowNegativeStock} onCheckedChange={(allowNegativeStock) => setSettings((current) => ({ ...current, allowNegativeStock }))} /></Flex>
            {error ? <ErrorMessage message={error} /> : null}<Flex justify="end"><Button type="submit" size="3" loading={settingsMutation.isPending}>Finish setup</Button></Flex>
          </Flex></form> : null}
        </Card>
      </div>
    </main>
  );
}

function ErrorMessage({ message }: { message: string }) { return <Text color="red" size="2" role="alert">{message}</Text>; }
