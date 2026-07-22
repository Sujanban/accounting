import { BarChartIcon, DashboardIcon, FileTextIcon, GearIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
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
    <div className="app-shell min-h-screen text-slate-900">
      <header className="app-header px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link className="brand" to="/"><span className="brand-mark">L</span>Ledgerly</Link>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{session?.user.name}</span><Button variant="secondary" size="1" onClick={() => void signOut()}>Sign out</Button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-[210px_1fr]">
        <nav aria-label="Main navigation" className="app-nav rounded-xl p-2">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink className={({ isActive }) => `app-nav-link ${isActive ? "app-nav-link--active" : ""}`} key={to} to={to} end={to === "/"}>
              <Icon />{label}
            </NavLink>
          ))}
        </nav>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
