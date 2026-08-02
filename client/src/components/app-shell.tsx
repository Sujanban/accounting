import {
  BarChartIcon,
  BellIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CubeIcon,
  DashboardIcon,
  ExitIcon,
  FileTextIcon,
  GearIcon,
  HamburgerMenuIcon,
  HomeIcon,
  IdCardIcon,
  LayersIcon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import { Dialog, DropdownMenu, Tooltip } from "@radix-ui/themes";
import { useEffect, useState, type ComponentType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../features/auth/auth-provider";
import { notificationsApi } from "../features/notifications/notifications-api";
import {
  createVoucherShortcutHint,
  createVoucherShortcutLabel,
  createVoucherActions,
  findCreateVoucherShortcut,
} from "./create-voucher-shortcuts";

type NavigationItem = { label: string; to: string };
type NavigationGroup = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavigationItem[];
};

const navigation: NavigationGroup[] = [
  {
    label: "Vouchers",
    icon: FileTextIcon,
    items: [
      { label: "Sales", to: "/vouchers/sales" },
      { label: "Purchase", to: "/vouchers/purchase" },
      { label: "Receipt", to: "/vouchers/receipt" },
      { label: "Payment", to: "/vouchers/payment" },
      { label: "Contra", to: "/vouchers/contra" },
      { label: "Journal", to: "/vouchers/journal" },
    ],
  },
  {
    label: "Orders",
    icon: ClipboardIcon,
    items: [
      { label: "Sales orders", to: "/sales-orders" },
      { label: "Purchase orders", to: "/purchase-orders" },
    ],
  },
  {
    label: "Assets",
    icon: CubeIcon,
    items: [{ label: "Fixed assets", to: "/fixed-assets" }],
  },
  {
    label: "Payroll",
    icon: IdCardIcon,
    items: [{ label: "Attendance", to: "/payroll" }],
  },
  {
    label: "Masters",
    icon: LayersIcon,
    items: [
      { label: "Parties", to: "/masters/parties" },
      { label: "Products & services", to: "/masters/products" },
      { label: "Product categories", to: "/masters/categories" },
      { label: "Units", to: "/masters/units" },
      { label: "Contact groups", to: "/masters/contact-groups" },
      { label: "Warehouses", to: "/masters/warehouses" },
      { label: "Tax rates", to: "/masters/tax-rates" },
      { label: "Payment terms", to: "/masters/payment-terms" },
      { label: "Price lists", to: "/masters/price-lists" },
    ],
  },
  {
    label: "Accounting",
    icon: ReaderIcon,
    items: [
      { label: "Chart of accounts", to: "/accounting/chart-of-accounts" },
      { label: "Account groups", to: "/accounting/account-groups" },
      { label: "Ledgers", to: "/accounting/ledgers" },
      { label: "Voucher numbering", to: "/accounting/voucher-numbering" },
    ],
  },
  {
    label: "Reports",
    icon: BarChartIcon,
    items: [
      { label: "General ledger", to: "/reports/general-ledger" },
      { label: "Trial balance", to: "/reports/trial-balance" },
      { label: "Journal register", to: "/reports/journal-register" },
      { label: "Day book", to: "/reports/day-book" },
      { label: "Stock summary", to: "/reports/stock-summary" },
      { label: "Stock ledger", to: "/reports/stock-ledger" },
      { label: "Profit & loss", to: "/reports/profit-loss" },
      { label: "Balance sheet", to: "/reports/balance-sheet" },
      { label: "Cash flow", to: "/reports/cash-flow" },
      { label: "Sales summary", to: "/reports/sales-summary" },
      { label: "Purchase summary", to: "/reports/purchase-summary" },
      { label: "Sales by product", to: "/reports/sales-by-product" },
      { label: "Purchases by product", to: "/reports/purchases-by-product" },
      { label: "Expense summary", to: "/reports/expense-summary" },
      { label: "Low stock", to: "/reports/low-stock" },
      { label: "Negative stock", to: "/reports/negative-stock" },
      { label: "Expense trend", to: "/reports/expense-trend" },
      { label: "Sales trend", to: "/reports/sales-trend" },
      { label: "Customer statement", to: "/reports/customer-statement" },
      { label: "Supplier statement", to: "/reports/supplier-statement" },
      { label: "Enterprise operations", to: "/reports/enterprise-operations" },
    ],
  },
  {
    label: "Company",
    icon: HomeIcon,
    items: [
      { label: "Company profile", to: "/company/profile" },
      { label: "Preferences", to: "/company/preferences" },
      { label: "Fiscal years", to: "/company/fiscal-years" },
      { label: "PAN & VAT", to: "/company/pan-vat" },
      { label: "Branches", to: "/company/branches" },
      { label: "Warehouses", to: "/company/warehouses" },
    ],
  },
];

function CreateVoucherMenu() {
  const navigate = useNavigate();
  const platform = window.navigator.platform;

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      const isEditing =
        target instanceof Element &&
        Boolean(
          target.closest(
            "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
          ),
        );

      if (event.defaultPrevented || isEditing) return;

      const action = findCreateVoucherShortcut(event);
      if (!action) return;

      event.preventDefault();
      navigate(action.to);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [navigate]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          aria-label="Create voucher"
          className="topbar-create"
          type="button"
        >
          <PlusIcon />
          <span className="topbar-create__label">Create</span>
          <ChevronDownIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className="topbar-create-menu"
        sideOffset={8}
      >
        <DropdownMenu.Label>
          <span className="topbar-create-menu__identity">
            <strong>Create voucher</strong>
            <small>{createVoucherShortcutHint(platform)}</small>
          </span>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        {createVoucherActions.map(({ ariaShortcut, label, shortcut, to }) => {
          const shortcutLabel = createVoucherShortcutLabel(shortcut, platform);
          return (
            <Tooltip
              content={`${label} shortcut: ${shortcutLabel}`}
              key={to}
            >
              <DropdownMenu.Item
                aria-keyshortcuts={ariaShortcut}
                shortcut={shortcutLabel}
                onSelect={() => {
                  navigate(to);
                }}
              >
                <FileTextIcon />
                {label}
              </DropdownMenu.Item>
            </Tooltip>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function NotificationsMenu() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => notificationsApi.list(signal),
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => client.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          className="topbar-icon-button"
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        >
          <BellIcon />
          {unread ? (
            <span className="topbar-notification-count">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className="topbar-notifications"
        sideOffset={8}
      >
        <DropdownMenu.Label>Notifications</DropdownMenu.Label>
        <DropdownMenu.Separator />
        {notifications.isLoading ? (
          <DropdownMenu.Item disabled>Loading notifications…</DropdownMenu.Item>
        ) : notifications.isError ? (
          <DropdownMenu.Item disabled>
            Notifications are unavailable
          </DropdownMenu.Item>
        ) : notifications.data?.length ? (
          notifications.data.slice(0, 8).map((item) => (
            <DropdownMenu.Item
              className="topbar-notification-item"
              key={item.id}
              onSelect={() => {
                if (!item.readAt) markRead.mutate(item.id);
                if (item.resourcePath) navigate(item.resourcePath);
              }}
            >
              <span
                className={
                  item.readAt
                    ? "topbar-notification-dot is-read"
                    : "topbar-notification-dot"
                }
                aria-hidden="true"
              />
              <span>
                <strong>{item.title}</strong>
                <small>{item.message}</small>
              </span>
            </DropdownMenu.Item>
          ))
        ) : (
          <DropdownMenu.Item disabled>No notifications</DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function AccountMenu() {
  const { logout, session } = useAuth();
  const navigate = useNavigate();
  const name = session?.user.name || "Account";
  const role =
    session?.activeMembership?.role?.replaceAll("_", " ") || "Member";

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button
          className="topbar-account"
          type="button"
          aria-label="Open account menu"
        >
          <span className="topbar-account__avatar" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="topbar-account__identity">
            <strong>{name}</strong>
            <small>{role}</small>
          </span>
          <ChevronDownIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className="topbar-account-menu"
        sideOffset={8}
      >
        <DropdownMenu.Label>
          <span className="topbar-account-menu__identity">
            <strong>{name}</strong>
            <small>{session?.user.email}</small>
          </span>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onSelect={() => navigate("/company/profile")}>
          <PersonIcon />
          Company profile
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => navigate("/company/preferences")}>
          <GearIcon />
          Preferences
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item color="red" onSelect={() => void signOut()}>
          <ExitIcon />
          Sign out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function NavigationGroup({
  group,
  onNavigate,
}: {
  group: NavigationGroup;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const hasActiveChild = group.items.some(
    ({ to }) =>
      location.pathname === to || location.pathname.startsWith(`${to}/`),
  );
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const Icon = group.icon;

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  return (
    <section className="nav-group">
      <button
        className={`nav-group__trigger ${hasActiveChild ? "nav-group__trigger--active" : ""}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon />
        <span>{group.label}</span>
        <ChevronDownIcon
          className={`nav-group__chevron ${isOpen ? "nav-group__chevron--open" : ""}`}
        />
      </button>
      {isOpen ? (
        <div className="nav-group__items">
          {group.items.map(({ label, to }) => (
            <NavLink
              className={({ isActive }) =>
                `nav-child-link ${isActive ? "nav-child-link--active" : ""}`
              }
              key={to}
              to={to}
              onClick={onNavigate}
            >
              {label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="workspace-sidebar">
      <div className="workspace-sidebar__top">
        <Link className="brand" to="/" onClick={onNavigate}>
          <span className="brand-mark">L</span>Ledgerly
        </Link>
      </div>
      <nav
        aria-label="Main navigation"
        className="workspace-sidebar__navigation"
      >
        <NavLink
          className={({ isActive }) =>
            `app-nav-link ${isActive ? "app-nav-link--active" : ""}`
          }
          to="/"
          end
          onClick={onNavigate}
        >
          <DashboardIcon />
          Overview
        </NavLink>
        {navigation.map((group) => (
          <NavigationGroup
            group={group}
            key={group.label}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function WorkspaceHeader({
  mobileNavigationOpen,
  setMobileNavigationOpen,
}: {
  mobileNavigationOpen: boolean;
  setMobileNavigationOpen: (open: boolean) => void;
}) {
  const { session } = useAuth();
  return (
    <header className="workspace-topbar">
      <div className="workspace-topbar__mobile-brand">
        <Dialog.Root
          open={mobileNavigationOpen}
          onOpenChange={setMobileNavigationOpen}
        >
          <Dialog.Trigger>
            <button
              className="topbar-icon-button"
              type="button"
              aria-label="Open navigation"
            >
              <HamburgerMenuIcon />
            </button>
          </Dialog.Trigger>
          <Dialog.Content className="mobile-navigation-drawer">
            <Dialog.Title className="sr-only">Main navigation</Dialog.Title>
            <Sidebar onNavigate={() => setMobileNavigationOpen(false)} />
          </Dialog.Content>
        </Dialog.Root>
        <Link className="brand" to="/">
          <span className="brand-mark">L</span>Ledgerly
        </Link>
      </div>
      <div className="workspace-topbar__context">
        <strong>{session?.activeCompany?.name ?? "Company workspace"}</strong>
      </div>
      <div className="workspace-topbar__actions">
        <CreateVoucherMenu />
        <NotificationsMenu />
        <AccountMenu />
      </div>
    </header>
  );
}

export function AppShell() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <div className="workspace-sidebar--desktop">
        <Sidebar />
      </div>
      <WorkspaceHeader
        mobileNavigationOpen={mobileNavigationOpen}
        setMobileNavigationOpen={setMobileNavigationOpen}
      />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
