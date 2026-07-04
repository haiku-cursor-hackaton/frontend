import { useMemo } from "react";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";
import {
  businessById,
  checkoutSessions,
  currentWallet,
  payments,
} from "@/data/mock";
import {
  formatDateTime,
  formatMoney,
  formatSignedMoney,
} from "@/lib/money";
import type { Payment, PaymentStatus } from "@/types/ucp";

/**
 * Un `Payment` representa una operación sobre la wallet:
 *  - `reserved`  -> sale de available a reserved (no lo mostramos como movimiento firmado, va aparte).
 *  - `captured`  -> se descuenta definitivamente del disponible (compra).
 *  - `released`  -> vuelve del reserved al available.
 *  - `failed`    -> no se descontó nada.
 *  - `handler_id = dev.platform.welcome_bonus` -> es un ingreso (bono de bienvenida).
 */

type Movement = {
  id: string;
  occurred_at: string;
  concept: string;
  amount_minor: number;
  status: PaymentStatus;
};

function merchantNameForPayment(p: Payment): string {
  if (p.handler_id === "dev.platform.welcome_bonus") {
    return "genko · Bono de bienvenida";
  }
  const session = checkoutSessions.find((s) => s.id === p.checkout_session_id);
  if (session) {
    const biz = businessById(session.business_id);
    if (biz) return `Compra · ${biz.name}`;
  }
  return "Compra agéntica";
}

function movementFromPayment(p: Payment): Movement | null {
  const merchantName = merchantNameForPayment(p);

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
      concept: `Reembolso · ${merchantName}`,
      amount_minor: p.amount_minor,
      status: p.status,
    };
  }
  if (p.status === "reserved" || p.status === "submitted") {
    return {
      id: p.id,
      occurred_at: p.created_at,
      concept: `En reserva · ${merchantName}`,
      amount_minor: -p.amount_minor,
      status: p.status,
    };
  }
  return null;
}

const STATUS_LABEL: Record<PaymentStatus, { label: string; tone: "accent" | "warn" | "brand" | "danger" | "neutral" }> = {
  reserved: { label: "Reservado", tone: "warn" },
  submitted: { label: "Enviado", tone: "warn" },
  captured: { label: "Capturado", tone: "accent" },
  released: { label: "Liberado", tone: "brand" },
  failed: { label: "Fallido", tone: "danger" },
  reconciliation_required: { label: "Revisión", tone: "danger" },
};

export default function Wallet() {
  const movements = useMemo(
    () =>
      payments
        .map(movementFromPayment)
        .filter((m): m is Movement => m !== null)
        .sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1)),
    [],
  );

  const totalMinor = currentWallet.available_minor + currentWallet.reserved_minor;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Wallet</h1>
        <span className="text-xs text-[var(--color-subtle)]">
          Saldo simulado en unidades menores · handler{" "}
          <code className="text-[var(--color-fg)]">
            dev.platform.simulated_balance
          </code>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Stat
          value={formatMoney(currentWallet.available_minor, currentWallet.currency)}
          label="Disponible"
          tone="accent"
        />
        <Stat
          value={formatMoney(currentWallet.reserved_minor, currentWallet.currency)}
          label="Reservado (checkouts en curso)"
          tone="warn"
        />
        <Stat
          value={formatMoney(totalMinor, currentWallet.currency)}
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
              {currentWallet.available_minor}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--color-subtle)]">
              reserved_minor
            </div>
            <div className="font-mono text-[var(--color-fg)]">
              {currentWallet.reserved_minor}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--color-subtle)]">
              currency
            </div>
            <div className="font-mono text-[var(--color-fg)]">
              {currentWallet.currency}
            </div>
          </div>
        </div>
      </Card>

      <div>
        <SectionTitle hint="Origen: tabla payments (uno por checkout)">
          Movimientos
        </SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-subtle)]">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Concepto</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[var(--color-border)] last:border-0"
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
                    {formatSignedMoney(m.amount_minor, currentWallet.currency)}
                  </td>
                </tr>
              ))}
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-[var(--color-subtle)]"
                  >
                    Aún no hay movimientos.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-xs text-[var(--color-subtle)]">
        La wallet es <strong>simulada</strong> para la demo. En producción, cada
        compra pasa por{" "}
        <code>reserve_checkout_payment</code> →{" "}
        <code>capture_checkout_payment</code> vía RPC de Supabase.
      </p>
    </div>
  );
}
