import {
  BarChartIcon,
  ChevronDownIcon,
  DashboardIcon,
  ExitIcon,
  FileTextIcon,
  GearIcon,
  HamburgerMenuIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Dialog, DropdownMenu } from "@radix-ui/themes";
import { useEffect, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/auth-provider";
import { Button } from "./ui/button";

type NavigationItem = { label: string; to: string };
type NavigationGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavigationItem[];
};

const navigation: NavigationGroup[] = [
  { label: "Vouchers", icon: FileTextIcon, items: [
    { label: "All vouchers", to: "/vouchers" }, { label: "Drafts", to: "/vouchers/drafts" },
    { label: "Sales", to: "/vouchers/sales" }, { label: "Purchase", to: "/vouchers/purchase" },
    { label: "Receipt", to: "/vouchers/receipt" }, { label: "Payment", to: "/vouchers/payment" },
    { label: "Contra", to: "/vouchers/contra" }, { label: "Journal", to: "/vouchers/journal" },
    { label: "Expense", to: "/vouchers/expense" }, { label: "Adjustments", to: "/vouchers/adjustments" },
    { label: "Opening balance", to: "/vouchers/opening-balance" },
  ] },
  { label: "Masters", icon: GearIcon, items: [
    { label: "Parties", to: "/masters/parties" }, { label: "Products & services", to: "/masters/products" },
    { label: "Product categories", to: "/masters/categories" }, { label: "Units", to: "/masters/units" },
    { label: "Contact groups", to: "/masters/contact-groups" }, { label: "Warehouses", to: "/masters/warehouses" },
    { label: "Tax rates", to: "/masters/tax-rates" }, { label: "Payment terms", to: "/masters/payment-terms" }, { label: "Price lists", to: "/masters/price-lists" },
  ] },
  { label: "Accounting", icon: FileTextIcon, items: [
    { label: "Chart of accounts", to: "/accounting/chart-of-accounts" }, { label: "Account groups", to: "/accounting/account-groups" },
    { label: "Ledgers", to: "/accounting/ledgers" }, { label: "Voucher numbering", to: "/accounting/voucher-numbering" },
  ] },
  { label: "Reports", icon: BarChartIcon, items: [
    { label: "General ledger", to: "/reports/general-ledger" }, { label: "Trial balance", to: "/reports/trial-balance" },
    { label: "Journal register", to: "/reports/journal-register" }, { label: "Day book", to: "/reports/day-book" },
  ] },
  { label: "Company", icon: GearIcon, items: [
    { label: "Company profile", to: "/company/profile" }, { label: "Preferences", to: "/company/preferences" },
    { label: "Fiscal years", to: "/company/fiscal-years" }, { label: "PAN & VAT", to: "/company/pan-vat" },
    { label: "Branches", to: "/company/branches" }, { label: "Warehouses", to: "/company/warehouses" },
  ] },
];

const createActions = [
  { label: "Sales voucher", to: "/vouchers/sales/new" },
  { label: "Purchase voucher", to: "/vouchers/purchase/new" },
  { label: "Receipt voucher", to: "/vouchers/receipt/new" },
  { label: "Payment voucher", to: "/vouchers/payment/new" },
  { label: "Journal voucher", to: "/vouchers/journal/new" },
  { label: "Expense voucher", to: "/vouchers/expense/new" },
];

function CreateVoucherMenu({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return <DropdownMenu.Root><DropdownMenu.Trigger><Button className="create-voucher-button" size="2"><PlusIcon /> Create</Button></DropdownMenu.Trigger><DropdownMenu.Content align="start" className="create-menu"><DropdownMenu.Label>Create voucher</DropdownMenu.Label>{createActions.map(({ label, to }) => <DropdownMenu.Item key={to} onSelect={() => { navigate(to); onNavigate?.(); }}>{label}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Root>;
}

function NavigationGroup({ group, onNavigate }: { group: NavigationGroup; onNavigate?: () => void }) {
  const location = useLocation();
  const hasActiveChild = group.items.some(({ to }) => location.pathname === to || location.pathname.startsWith(`${to}/`));
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const Icon = group.icon;

  useEffect(() => { if (hasActiveChild) setIsOpen(true); }, [hasActiveChild]);

  return <section className="nav-group"><button className={`nav-group__trigger ${hasActiveChild ? "nav-group__trigger--active" : ""}`} type="button" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}><Icon /><span>{group.label}</span><ChevronDownIcon className={`nav-group__chevron ${isOpen ? "nav-group__chevron--open" : ""}`} /></button>{isOpen ? <div className="nav-group__items">{group.items.map(({ label, to }) => <NavLink className={({ isActive }) => `nav-child-link ${isActive ? "nav-child-link--active" : ""}`} key={to} to={to} onClick={onNavigate}>{label}</NavLink>)}</div> : null}</section>;
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  async function signOut() { await logout(); navigate("/login", { replace: true }); onNavigate?.(); }

  return <aside className="workspace-sidebar"><div className="workspace-sidebar__top"><Link className="brand" to="/" onClick={onNavigate}><span className="brand-mark">L</span>Ledgerly</Link><div className="workspace-sidebar__create"><CreateVoucherMenu onNavigate={onNavigate} /></div></div><nav aria-label="Main navigation" className="workspace-sidebar__navigation"><NavLink className={({ isActive }) => `app-nav-link ${isActive ? "app-nav-link--active" : ""}`} to="/" end onClick={onNavigate}><DashboardIcon />Overview</NavLink>{navigation.map((group) => <NavigationGroup group={group} key={group.label} onNavigate={onNavigate} />)}</nav><footer className="workspace-sidebar__footer"><div className="account-context"><span className="account-context__avatar" aria-hidden="true">{session?.user.name.slice(0, 1).toUpperCase()}</span><div><strong>{session?.user.name}</strong><span>{session?.user.email}</span></div><Button className="workspace-signout" variant="ghost" size="1" onClick={() => void signOut()} aria-label="Sign out" title="Sign out"><ExitIcon /></Button></div></footer></aside>;
}

export function AppShell() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return <div className="app-shell min-h-screen text-slate-900"><div className="workspace-sidebar--desktop"><Sidebar /></div><header className="mobile-app-header"><Dialog.Root open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}><Dialog.Trigger><Button variant="ghost" size="2" aria-label="Open navigation"><HamburgerMenuIcon /></Button></Dialog.Trigger><Dialog.Content className="mobile-navigation-drawer"><Dialog.Title className="sr-only">Main navigation</Dialog.Title><Sidebar onNavigate={() => setMobileNavigationOpen(false)} /></Dialog.Content></Dialog.Root><Link className="brand" to="/"><span className="brand-mark">L</span>Ledgerly</Link><CreateVoucherMenu /></header><main className="app-content"><Outlet /></main></div>;
}
