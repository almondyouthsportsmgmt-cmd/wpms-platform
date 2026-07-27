import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import type {
  CheckoutSourceRefreshItem,
} from "../services/checkoutRefresh";

type Props = {
  items: CheckoutSourceRefreshItem[];
  working: boolean;
  onRefreshOne: (
    item: CheckoutSourceRefreshItem,
  ) => Promise<unknown> | unknown;
  onRefreshAll: () =>
    Promise<unknown> | unknown;
};

export default function CheckoutRefreshPanel({
  items,
  working,
  onRefreshOne,
  onRefreshAll,
}: Props) {
  const changed = items.filter(
    (item) =>
      item.status === "Changed",
  );

  const missing = items.filter(
    (item) =>
      item.status === "Missing",
  );

  if (
    changed.length === 0 &&
    missing.length === 0
  ) {
    return (
      <section className="checkout-refresh-panel is-current">
        <CheckCircle2 size={20} />

        <div>
          <strong>
            Invoice sources are current
          </strong>

          <span>
            Grooming and boarding prices match their source records.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-refresh-panel">
      <div className="checkout-refresh-header">
        <div>
          <span className="eyebrow">
            Invoice refresh
          </span>

          <h2>
            Source records changed
          </h2>

          <p>
            Review the changes before replacing the current invoice values.
          </p>
        </div>

        {changed.length > 0 && (
          <button
            type="button"
            className="primary-button checkout-refresh-all"
            disabled={working}
            onClick={() =>
              void onRefreshAll()
            }
          >
            <RefreshCw
              size={16}
              className={
                working
                  ? "checkout-spin"
                  : ""
              }
            />
            Refresh all
          </button>
        )}
      </div>

      <div className="checkout-refresh-list">
        {items
          .filter(
            (item) =>
              item.status !==
              "Current",
          )
          .map((item) => (
            <article
              key={item.lineItemId}
              className={`checkout-refresh-item is-${item.status.toLowerCase()}`}
            >
              <div className="checkout-refresh-icon">
                <AlertTriangle
                  size={18}
                />
              </div>

              <div>
                <strong>
                  {
                    item.currentLine
                      .description
                  }
                </strong>

                <span>
                  {item.sourceType}
                </span>

                <ul>
                  {item.changes.map(
                    (change) => (
                      <li key={change}>
                        {change}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {item.status ===
                "Changed" && (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={working}
                  onClick={() =>
                    void onRefreshOne(
                      item,
                    )
                  }
                >
                  <RefreshCw
                    size={15}
                  />
                  Refresh line
                </button>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}
