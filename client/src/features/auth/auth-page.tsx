import { Button, Card, Flex, Heading, Text } from "@radix-ui/themes";
import { LockClosedIcon, PersonIcon } from "@radix-ui/react-icons";
import { useState, type FormEvent } from "react";
import isEmail from "validator/lib/isEmail";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiClientError } from "../../lib/query-client";
import { FormTextField } from "../../components/forms/form-fields";
import { useAuth } from "./auth-provider";
import { useRegister } from "./use-register";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-5"><div className="w-full max-w-md"><Link to="/" className="mb-8 block text-center text-xl font-bold tracking-tight text-slate-950">Ledgerly</Link>{children}</div></main>;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  return "Something went wrong. Please try again.";
}

function getFieldErrors(error: unknown) {
  if (!(error instanceof ApiClientError)) return {};
  return Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message]));
}

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = (location.state as { registeredEmail?: string } | null)?.registeredEmail ?? "";
  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  if (status === "authenticated") return <Navigate to={destination} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!isEmail(email.trim(), { allow_utf8_local_part: false, allow_underscores: false, require_tld: true })) {
      setError("Enter a valid email address.");
      return;
    }
    setIsPending(true);
    try {
      await login({ email, password });
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsPending(false);
    }
  }

  return <AuthLayout><Card size="4"><form onSubmit={submit} noValidate><Flex direction="column" gap="4"><div><Heading size="6">Sign in</Heading><Text as="p" color="gray" mt="2">Access your accounting workspace.</Text></div>{registeredEmail ? <Text color="green" size="2" role="status">Account created. Sign in to continue.</Text> : null}<FormTextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required startAdornment={<PersonIcon />} error={error?.includes("email") ? error : undefined} /><FormTextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required error={error && !error.includes("email") ? error : undefined} startAdornment={<LockClosedIcon />} showPasswordToggle /><Button type="submit" size="3" loading={isPending}>Sign in</Button><Text align="center" size="2" color="gray">New here? <Link className="font-medium text-indigo-700" to="/register">Create an account</Link></Text></Flex></form></Card></AuthLayout>;
}

export function RegisterPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (status === "authenticated") return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    if (!isEmail(email.trim(), { allow_utf8_local_part: false, allow_underscores: false, require_tld: true })) {
      setFieldErrors({ email: "Enter a valid email address." });
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      setFieldErrors({ password: "Use 8+ characters with uppercase, lowercase, number, and special character." });
      return;
    }
    try {
      await registerMutation.mutateAsync({ name, email, password, confirmPassword });
      navigate("/login", { replace: true, state: { registeredEmail: email } });
    } catch (requestError) {
      const serverFieldErrors = getFieldErrors(requestError);
      setFieldErrors(serverFieldErrors);
      if (!Object.keys(serverFieldErrors).length) setError(getErrorMessage(requestError));
    }
  }

  return <AuthLayout><Card size="4"><form onSubmit={submit} noValidate><Flex direction="column" gap="4"><div><Heading size="6">Create account</Heading><Text as="p" color="gray" mt="2">Start by creating your secure workspace account.</Text></div><FormTextField label="Name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} error={fieldErrors.name} startAdornment={<PersonIcon />} /><FormTextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required error={fieldErrors.email} startAdornment={<PersonIcon />} /><FormTextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} error={fieldErrors.password} description="Use 8+ characters with uppercase, lowercase, number, and special character." startAdornment={<LockClosedIcon />} showPasswordToggle /><FormTextField label="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} error={fieldErrors.confirmPassword} startAdornment={<LockClosedIcon />} showPasswordToggle />{error ? <Text color="red" size="2" role="alert">{error}</Text> : null}<Button type="submit" size="3" loading={registerMutation.isPending}>Create account</Button><Text align="center" size="2" color="gray">Already have an account? <Link className="font-medium text-indigo-700" to="/login">Sign in</Link></Text></Flex></form></Card></AuthLayout>;
}
