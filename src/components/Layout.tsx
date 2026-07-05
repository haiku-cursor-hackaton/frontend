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
import { useWallet } from "@/hooks/useData";
import { formatMoney } from "@/lib/money";
import { Badge, Button, cx } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";

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

const NAV_GROUPS: NavGroup[] = [
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
    heading: "Comercio",
    items: [
      { to: "/comercio", label: "Comercio", icon: Store },
      { to: "/agente", label: "Agente MCP", icon: Bot },
    ],
  },
];

function SidebarNav({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <nav
      aria-label="Navegacion principal"
      className={cx("flex flex-col", collapsed ? "gap-2" : "gap-6")}
    >
      {NAV_GROUPS.map((group) => (
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
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="z-30 flex min-h-14 shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/88 px-3 py-2 backdrop-blur-md sm:gap-4 sm:px-5">
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

        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brand-strong)] text-xs font-bold text-[var(--color-on-brand)]">
            g
          </span>
          <span className="truncate text-base font-semibold">genko</span>
          <span className="hidden lg:inline-flex">
            <Badge tone="brand">commerce · agéntico</Badge>
          </span>
        </div>

        {demoMode ? (
          <span className="hidden sm:inline-flex">
            <Badge tone="warn">modo demo</Badge>
          </span>
        ) : null}

        <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-4">
          {wallet ? (
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
          ) : null}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-surface-2)] text-xs font-semibold uppercase text-[var(--color-muted)]">
              {(user?.email ?? "u").slice(0, 1)}
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 gap-4 px-3 py-3 sm:px-5 sm:py-4">
        <aside
          className={cx(
            "hidden shrink-0 overflow-hidden transition-[width] duration-300 ease-out md:block",
            sidebarCollapsed ? "w-16" : "w-56",
          )}
        >
          <div className="h-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)]">
            <SidebarNav collapsed={sidebarCollapsed} />
          </div>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
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
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brand-strong)] text-xs font-bold text-[var(--color-on-brand)]">
                g
              </span>
              <span className="text-base font-semibold">genko</span>
            </div>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>
    </div>
  );
}
