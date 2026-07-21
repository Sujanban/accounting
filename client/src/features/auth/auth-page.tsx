import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiClientError } from "../../lib/query-client";
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

  return <AuthLayout><Card size="4"><form onSubmit={submit}><Flex direction="column" gap="4"><div><Heading size="6">Sign in</Heading><Text as="p" color="gray" mt="2">Access your accounting workspace.</Text></div>{registeredEmail ? <Text color="green" size="2" role="status">Account created. Sign in to continue.</Text> : null}<label><Text as="div" size="2" weight="medium" mb="1">Email</Text><TextField.Root type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label><Text as="div" size="2" weight="medium" mb="1">Password</Text><TextField.Root type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error ? <Text color="red" size="2" role="alert">{error}</Text> : null}<Button type="submit" size="3" loading={isPending}>Sign in</Button><Text align="center" size="2" color="gray">New here? <Link className="font-medium text-indigo-700" to="/register">Create an account</Link></Text></Flex></form></Card></AuthLayout>;
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

  return <AuthLayout><Card size="4"><form onSubmit={submit} noValidate><Flex direction="column" gap="4"><div><Heading size="6">Create account</Heading><Text as="p" color="gray" mt="2">Start by creating your secure workspace account.</Text></div><label><Text as="div" size="2" weight="medium" mb="1">Name</Text><TextField.Root value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} aria-invalid={Boolean(fieldErrors.name)} />{fieldErrors.name ? <Text as="p" color="red" size="1" role="alert">{fieldErrors.name}</Text> : null}</label><label><Text as="div" size="2" weight="medium" mb="1">Email</Text><TextField.Root type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email ? <Text as="p" color="red" size="1" role="alert">{fieldErrors.email}</Text> : null}</label><label><Text as="div" size="2" weight="medium" mb="1">Password</Text><TextField.Root type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required minLength={8} aria-invalid={Boolean(fieldErrors.password)} />{fieldErrors.password ? <Text as="p" color="red" size="1" role="alert">{fieldErrors.password}</Text> : <Text as="p" color="gray" size="1">Use 8+ characters with uppercase, lowercase, number, and special character.</Text>}</label><label><Text as="div" size="2" weight="medium" mb="1">Confirm password</Text><TextField.Root type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} aria-invalid={Boolean(fieldErrors.confirmPassword)} />{fieldErrors.confirmPassword ? <Text as="p" color="red" size="1" role="alert">{fieldErrors.confirmPassword}</Text> : null}</label>{error ? <Text color="red" size="2" role="alert">{error}</Text> : null}<Button type="submit" size="3" loading={registerMutation.isPending}>Create account</Button><Text align="center" size="2" color="gray">Already have an account? <Link className="font-medium text-indigo-700" to="/login">Sign in</Link></Text></Flex></form></Card></AuthLayout>;
}
