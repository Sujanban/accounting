import { BarChartIcon, DashboardIcon, FileTextIcon, GearIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-provider";

const navigation = [
  { label: "Overview", to: "/", icon: DashboardIcon },
  { label: "Transactions", to: "/transactions", icon: FileTextIcon },
  { label: "Reports", to: "/reports", icon: BarChartIcon },
  { label: "Settings", to: "/settings", icon: GearIcon }
];

export function AppShell() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="text-lg font-bold tracking-tight text-slate-950" to="/">Ledgerly</Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{session?.user.name}</span><Button variant="secondary" size="1" onClick={() => void signOut()}>Sign out</Button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[210px_1fr]">
        <nav aria-label="Main navigation" className="rounded-xl border border-slate-200 bg-white p-2">
          {navigation.map(({ label, to, icon: Icon }) => (
            <Link className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950" key={to} to={to}>
              <Icon />{label}
            </Link>
          ))}
        </nav>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
