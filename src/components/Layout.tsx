import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Store,
  User,
  Wallet as WalletIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useMyBusinesses, useProfile, useWallet } from "@/hooks/useData";
import { formatMoney } from "@/lib/money";
import { formatUserDisplayName, userAvatarInitial } from "@/lib/user";
import { Badge, Button, cx } from "@/components/ui";
import BrandLogo from "@/components/BrandLogo";
import ThemeToggle from "@/components/ThemeToggle";
import type { AccountType } from "@/types/ucp";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const CLIENT_NAV_GROUPS: NavGroup[] = [
  {
    heading: "Overview",
    items: [
      { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
      { to: "/wallet", label: "Wallet", icon: WalletIcon },
    ],
  },
  {
    heading: "Cuenta",
    items: [
      { to: "/perfil", label: "Perfil", icon: User },
      { to: "/historial", label: "Historial", icon: History },
    ],
  },
  {
    heading: "Agente",
    items: [
      { to: "/agente", label: "Agente MCP", icon: Bot },
    ],
  },
];

const BUSINESS_NAV_GROUPS: NavGroup[] = [
  {
    heading: "Comercio",
    items: [
      { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
      { to: "/comercio", label: "Comercio", icon: Store },
      { to: "/historial", label: "Historial", icon: History },
    ],
  },
  {
    heading: "Cuenta",
    items: [{ to: "/perfil", label: "Perfil", icon: User }],
  },
];

function SidebarNav({
  onNavigate,
  collapsed = false,
  groups,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  groups: NavGroup[];
}) {
  return (
    <nav
      aria-label="Navegacion principal"
      className={cx("flex flex-col", collapsed ? "gap-2" : "gap-6")}
    >
      {groups.map((group) => (
        <div key={group.heading} className="space-y-1">
          {collapsed ? (
            <div className="mx-auto my-2 h-px w-7 bg-[var(--color-border)]" />
          ) : (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-subtle)]">
              {group.heading}
            </div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cx(
                    "group relative flex h-10 items-center gap-3 rounded-lg text-sm outline-none transition-all duration-300 ease-out",
                    collapsed ? "justify-center px-0" : "px-3",
                    "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]",
                    isActive
                      ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
                      : "text-[var(--color-muted)] hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]/70 hover:text-[var(--color-fg)]",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={cx(
                        "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-brand-strong)] transition-all duration-300 ease-out",
                        isActive
                          ? "scale-y-100 opacity-100"
                          : "scale-y-0 opacity-0",
                      )}
                    />
                    <Icon
                      className={cx(
                        "h-[18px] w-[18px] shrink-0 transition-all duration-200 ease-out",
                        isActive
                          ? "text-[var(--color-fg)]"
                          : "text-[var(--color-subtle)] group-hover:scale-110 group-hover:text-[var(--color-fg)]",
                      )}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    {collapsed ? null : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, demoMode, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: myBusinesses = [] } = useMyBusinesses();
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const accountType: AccountType =
    profile?.account_type ??
    (myBusinesses.length > 0
      ? "business"
      : user?.accountType ?? "client");
  const navGroups =
    accountType === "business" ? BUSINESS_NAV_GROUPS : CLIENT_NAV_GROUPS;
  const displayName = formatUserDisplayName(
    profile?.full_name || user?.name,
    user?.email,
  );
  const avatarInitial = userAvatarInitial(displayName);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (accountType === "business" && ["/wallet", "/agente"].includes(location.pathname)) {
      navigate("/", { replace: true });
    }
    if (accountType === "client" && location.pathname === "/comercio") {
      navigate("/", { replace: true });
    }
  }, [accountType, location.pathname, navigate]);

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden">
      <header className="z-30 flex min-h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/88 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:gap-4 sm:px-5">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          onClick={() => setSidebarCollapsed((value) => !value)}
          className="hidden h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] md:grid"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        <BrandLogo className="h-[26px]" />

        {demoMode ? (
          <span className="hidden sm:inline-flex">
            <Badge tone="warn">modo demo</Badge>
          </span>
        ) : null}

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-4">
          {accountType === "client" && wallet ? (
            <>
              <div className="flex flex-col items-end leading-tight lg:hidden">
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                  Disp.
                </span>
                <span className="max-w-[5.5rem] truncate text-xs font-semibold sm:max-w-none sm:text-sm">
                  {formatMoney(wallet.available_minor, wallet.currency)}
                </span>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                  Disponible
                </span>
                <span className="text-sm font-semibold">
                  {formatMoney(wallet.available_minor, wallet.currency)}
                </span>
              </div>
              {wallet.reserved_minor > 0 ? (
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                    Reservado
                  </span>
                  <span className="text-sm font-medium text-[var(--color-warn)]">
                    {formatMoney(wallet.reserved_minor, wallet.currency)}
                  </span>
                </div>
              ) : null}
              </div>
            </>
          ) : null}
          <ThemeToggle />
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-surface-2)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              {avatarInitial}
            </div>
            <div className="hidden min-w-0 sm:block">
              <div className="truncate text-sm font-medium text-[var(--color-fg)]">
                {displayName}
              </div>
              {user?.email ? (
                <div className="truncate text-xs text-[var(--color-subtle)]">
                  {user.email}
                </div>
              ) : null}
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
        <aside
          className={cx(
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out md:block",
            sidebarCollapsed ? "w-16" : "w-56",
          )}
        >
          <div className="h-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)]">
            <SidebarNav collapsed={sidebarCollapsed} groups={navGroups} />
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <Outlet />
        </main>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cx(
            "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cx(
            "absolute inset-y-0 left-0 w-[min(18rem,calc(100vw-2rem))] border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <BrandLogo className="h-[28px]" />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav
            onNavigate={() => setMobileOpen(false)}
            groups={navGroups}
          />
        </aside>
      </div>
    </div>
  );
}
