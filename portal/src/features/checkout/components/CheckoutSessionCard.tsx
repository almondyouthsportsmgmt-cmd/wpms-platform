import {
  ChevronRight,
  Clock3,
  ReceiptText,
  Trash2,
  XCircle,
} from "lucide-react";

import type {
  CheckoutSession,
} from "../types/checkoutTypes";

type Props = {
  session: CheckoutSession;
  customerName: string;
  total: number;
  balance: number;
  working: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

const money = new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: "USD",
  },
);

function statusClass(
  status: CheckoutSession["status"],
) {
  return status
    .toLowerCase()
    .replaceAll(" ", "-");
}

export default function CheckoutSessionCard({
  session,
  customerName,
  total,
  balance,
  working,
  onOpen,
  onCancel,
  onDelete,
}: Props) {
  return (
    <article className="checkout-session-card">
      <button
        type="button"
        className="checkout-session-main"
        onClick={onOpen}
      >
        <div className="checkout-session-icon">
          <ReceiptText size={20} />
        </div>

        <div className="checkout-session-copy">
          <div className="checkout-session-title">
            <strong>{customerName}</strong>

            <span
              className={`checkout-status checkout-status-${statusClass(
                session.status,
              )}`}
            >
              {session.status}
            </span>
          </div>

          <div className="checkout-session-meta">
            <span>
              {session.lineItems.length} item
              {session.lineItems.length === 1
                ? ""
                : "s"}
            </span>

            <span>
              Updated{" "}
              {new Date(
                session.updatedAt,
              ).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="checkout-session-money">
            <span>
              Total
              <strong>{money.format(total)}</strong>
            </span>

            <span>
              Balance
              <strong>{money.format(balance)}</strong>
            </span>
          </div>
        </div>

        <ChevronRight size={19} />
      </button>

      <footer className="checkout-session-actions">
        {session.status !== "Cancelled" &&
          session.status !== "Paid" && (
            <button
              type="button"
              className="checkout-action-button"
              disabled={working}
              onClick={onCancel}
            >
              <XCircle size={15} />
              Cancel session
            </button>
          )}

        {(session.status === "Cancelled" ||
          session.status === "Paid") && (
          <button
            type="button"
            className="checkout-action-button danger"
            disabled={working}
            onClick={onDelete}
          >
            <Trash2 size={15} />
            Remove
          </button>
        )}

        <span className="checkout-session-id">
          <Clock3 size={14} />
          {session.id.slice(0, 8)}
        </span>
      </footer>
    </article>
  );
}
