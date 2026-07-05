import { useMemo, useState } from "react";
import {
  Badge,
  Card,
  MobileRecordList,
  Pagination,
  SectionTitle,
  Stat,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  useBusinessMap,
  useCheckoutSessions,
  usePayments,
  useWallet,
} from "@/hooks/useData";
import {
  formatDateTime,
  formatMoney,
  formatSignedMoney,
} from "@/lib/money";
import type { Payment, PaymentStatus } from "@/types/ucp";

type Movement = {
  id: string;
  occurred_at: string;
  concept: string;
  amount_minor: number;
  status: PaymentStatus;
};

type WalletTab = "resumen" | "movimientos";
const MOVEMENTS_PAGE_SIZE = 7;

function merchantNameForPayment(
  p: Payment,
  checkoutSessions: ReturnType<typeof useCheckoutSessions>["data"],
  businessById: (id: string) => { name: string } | undefined,
): string {
  if (p.handler_id === "dev.platform.welcome_bonus") {
    return "genko - Bono de bienvenida";
  }
  const session = (checkoutSessions ?? []).find(
    (s) => s.id === p.checkout_session_id,
  );
  if (session) {
    const biz = businessById(session.business_id);
    if (biz) return `Compra - ${biz.name}`;
  }
  return "Compra agentica";
}

function movementFromPayment(
  p: Payment,
  checkoutSessions: ReturnType<typeof useCheckoutSessions>["data"],
  businessById: (id: string) => { name: string } | undefined,
): Movement | null {
  const merchantName = merchantNameForPayment(p, checkoutSessions, businessById);

  if (p.status === "captured") {
    const isIncome = p.handler_id === "dev.platform.welcome_bonus";
    return {
      id: p.id,
      occurred_at: p.created_at,
      concept: merchantName,
      amount_minor: isIncome ? p.amount_minor : -p.amount_minor,
      status: p.status,
    };
  }
  if (p.status === "released") {
    return {
      id: p.id,
      occurred_at: p.created_at,
      concept: `Reembolso - ${merchantName}`,
      amount_minor: p.amount_minor,
      status: p.status,
    };
  }
  if (p.status === "reserved" || p.status === "submitted") {
    return {
      id: p.id,
      occurred_at: p.created_at,
      concept: `En reserva - ${merchantName}`,
      amount_minor: -p.amount_minor,
      status: p.status,
    };
  }
  return null;
}

const STATUS_LABEL: Record<
  PaymentStatus,
  { label: string; tone: "accent" | "warn" | "brand" | "danger" | "neutral" }
> = {
  reserved: { label: "Reservado", tone: "warn" },
  submitted: { label: "Enviado", tone: "warn" },
  captured: { label: "Capturado", tone: "accent" },
  released: { label: "Liberado", tone: "brand" },
  failed: { label: "Fallido", tone: "danger" },
  reconciliation_required: { label: "Revision", tone: "danger" },
};

export default function Wallet() {
  const [tab, setTab] = useState<WalletTab>("resumen");
  const [movementPage, setMovementPage] = useState(1);
  const { data: wallet, isLoading } = useWallet();
  const { data: payments = [] } = usePayments(wallet?.id);
  const { data: checkoutSessions = [] } = useCheckoutSessions();
  const { businessById } = useBusinessMap();

  const movements = useMemo(
    () =>
      payments
        .map((p) => movementFromPayment(p, checkoutSessions, businessById))
        .filter((m): m is Movement => m !== null)
        .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)),
    [payments, checkoutSessions, businessById],
  );

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">
        Cargando wallet...
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-4">
        <h1 className="shrink-0 text-lg font-semibold">Wallet</h1>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">
            Aun no tienes wallet. Crea una cuenta o contacta soporte.
          </p>
        </Card>
      </div>
    );
  }

  const totalMinor = wallet.available_minor + wallet.reserved_minor;
  const movementPageCount = Math.max(
    1,
    Math.ceil(movements.length / MOVEMENTS_PAGE_SIZE),
  );
  const currentMovementPage = Math.min(movementPage, movementPageCount);
  const paginatedMovements = movements.slice(
    (currentMovementPage - 1) * MOVEMENTS_PAGE_SIZE,
    currentMovementPage * MOVEMENTS_PAGE_SIZE,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Wallet</h1>
        <span className="text-xs text-[var(--color-subtle)]">
          Saldo simulado en unidades menores - handler{" "}
          <code className="text-[var(--color-fg)]">
            dev.platform.simulated_balance
          </code>
        </span>
      </div>

      <Tabs<WalletTab>
        ariaLabel="Secciones de wallet"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "resumen", label: "Resumen" },
          { id: "movimientos", label: "Movimientos", meta: movements.length },
        ]}
      />

      {tab === "resumen" ? (
        <TabPanel key="resumen" className="flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Stat
                value={formatMoney(wallet.available_minor, wallet.currency)}
                label="Disponible"
                tone="accent"
              />
              <Stat
                value={formatMoney(wallet.reserved_minor, wallet.currency)}
                label="Reservado (checkouts en curso)"
                tone="warn"
              />
              <Stat
                value={formatMoney(totalMinor, wallet.currency)}
                label="Balance total"
              />
            </div>

            <Card>
              <div className="grid gap-3 text-sm text-[var(--color-muted)] sm:grid-cols-3">
                <div>
                  <div className="text-xs font-medium text-[var(--color-subtle)]">
                    available_minor
                  </div>
                  <div className="font-mono text-[var(--color-fg)]">
                    {wallet.available_minor}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--color-subtle)]">
                    reserved_minor
                  </div>
                  <div className="font-mono text-[var(--color-fg)]">
                    {wallet.reserved_minor}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--color-subtle)]">
                    currency
                  </div>
                  <div className="font-mono text-[var(--color-fg)]">
                    {wallet.currency}
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-xs text-[var(--color-subtle)]">
              La wallet es <strong>simulada</strong> para la demo. En produccion,
              cada compra pasa por <code>reserve_checkout_payment</code> {"->"}{" "}
              <code>capture_checkout_payment</code> via RPC de Supabase.
            </p>
          </div>
        </TabPanel>
      ) : (
        <TabPanel key="movimientos" className="flex-1">
          <SectionTitle hint="Origen: tabla payments (uno por checkout)">
            Movimientos
          </SectionTitle>
          <div className="md:hidden">
            <MobileRecordList
              records={paginatedMovements.map((m) => ({
                id: m.id,
                eyebrow: formatDateTime(m.occurred_at),
                title: m.concept,
                meta: (
                  <Badge tone={STATUS_LABEL[m.status].tone}>
                    {STATUS_LABEL[m.status].label}
                  </Badge>
                ),
                fields: [
                  {
                    label: "Monto",
                    value: (
                      <span
                        className={
                          "font-medium " +
                          (m.amount_minor > 0
                            ? "text-[var(--color-accent)]"
                            : m.status === "reserved" || m.status === "submitted"
                              ? "text-[var(--color-warn)]"
                              : "text-[var(--color-fg)]")
                        }
                      >
                        {formatSignedMoney(m.amount_minor, wallet.currency)}
                      </span>
                    ),
                  },
                  { label: "Estado", value: STATUS_LABEL[m.status].label },
                ],
              }))}
              empty="Aun no hay movimientos."
            />
            <Pagination
              page={currentMovementPage}
              pageSize={MOVEMENTS_PAGE_SIZE}
              total={movements.length}
              onPageChange={setMovementPage}
              className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          </div>
          <Card padded={false} className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Concepto</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMovements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-surface-2)]/60"
                    >
                      <td className="px-5 py-3 text-[var(--color-muted)]">
                        {formatDateTime(m.occurred_at)}
                      </td>
                      <td className="px-5 py-3">{m.concept}</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_LABEL[m.status].tone}>
                          {STATUS_LABEL[m.status].label}
                        </Badge>
                      </td>
                      <td
                        className={
                          "px-5 py-3 text-right font-medium " +
                          (m.amount_minor > 0
                            ? "text-[var(--color-accent)]"
                            : m.status === "reserved" || m.status === "submitted"
                              ? "text-[var(--color-warn)]"
                              : "text-[var(--color-fg)]")
                        }
                      >
                        {formatSignedMoney(m.amount_minor, wallet.currency)}
                      </td>
                    </tr>
                  ))}
                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-[var(--color-subtle)]"
                      >
                        Aun no hay movimientos.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <Pagination
              page={currentMovementPage}
              pageSize={MOVEMENTS_PAGE_SIZE}
              total={movements.length}
              onPageChange={setMovementPage}
            />
          </Card>
        </TabPanel>
      )}
    </div>
  );
}
