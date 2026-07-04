import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bot,
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
import { currentWallet } from "@/data/mock";
import { formatMoney } from "@/lib/money";
import { Badge, Button, cx } from "@/components/ui";

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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-subtle)]">
            {group.heading}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cx(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-all duration-200 ease-out",
                    "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-fg)_15%,transparent)]",
                    isActive
                      ? "bg-[var(--color-surface-2)] font-medium text-[var(--color-fg)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]/70 hover:text-[var(--color-fg)]",
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
                          : "text-[var(--color-subtle)] group-hover:translate-x-0.5 group-hover:text-[var(--color-fg)]",
                      )}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                    <span className="truncate">{item.label}</span>
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
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="min-h-full">
      <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-5 py-3 backdrop-blur-md">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brand-strong)] text-xs font-bold text-white">
            g
          </span>
          <span className="text-base font-semibold tracking-tight">genko</span>
          <Badge tone="brand">commerce · agéntico</Badge>
        </div>

        {demoMode ? <Badge tone="warn">modo demo</Badge> : null}

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                Disponible
              </span>
              <span className="text-sm font-semibold">
                {formatMoney(currentWallet.available_minor, currentWallet.currency)}
              </span>
            </div>
            {currentWallet.reserved_minor > 0 ? (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-subtle)]">
                  Reservado
                </span>
                <span className="text-sm font-medium text-[var(--color-warn)]">
                  {formatMoney(currentWallet.reserved_minor, currentWallet.currency)}
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
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

      <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-5 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-20">
            <SidebarNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
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
            "absolute inset-y-0 left-0 w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 shadow-[var(--shadow-pop)] transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--color-brand-strong)] text-xs font-bold text-white">
                g
              </span>
              <span className="text-base font-semibold tracking-tight">genko</span>
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
