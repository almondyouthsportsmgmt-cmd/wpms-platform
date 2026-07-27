import type {
  CheckoutSession,
} from "../types/checkoutTypes";
import type {
  CheckoutTotals,
} from "../services/checkoutCalculations";

type Props = {
  session: CheckoutSession;
  totals: CheckoutTotals;
  working: boolean;
  onUpdate: (
    update: Partial<
      Pick<
        CheckoutSession,
        | "discountType"
        | "discountValue"
        | "taxRate"
        | "tipAmount"
        | "depositApplied"
        | "notes"
      >
    >,
  ) => Promise<unknown> | unknown;
};

const money = new Intl.NumberFormat(
  "en-US",
  {
    style: "currency",
    currency: "USD",
  },
);

export default function CheckoutTotalsPanel({
  session,
  totals,
  working,
  onUpdate,
}: Props) {
  return (
    <section className="checkout-totals-panel">
      <div className="checkout-builder-section-head">
        <div>
          <span className="eyebrow">
            Calculation
          </span>
          <h2>Totals</h2>
        </div>
      </div>

      <div className="checkout-adjustments-grid">
        <label className="field">
          <span>Discount type</span>
          <select
            value={session.discountType}
            disabled={working}
            onChange={(event) =>
              void onUpdate({
                discountType:
                  event.target
                    .value as CheckoutSession["discountType"],
              })
            }
          >
            <option value="None">
              None
            </option>
            <option value="Fixed">
              Fixed amount
            </option>
            <option value="Percent">
              Percent
            </option>
          </select>
        </label>

        <label className="field">
          <span>Discount value</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={session.discountValue}
            disabled={
              working ||
              session.discountType ===
                "None"
            }
            onChange={(event) =>
              void onUpdate({
                discountValue: Number(
                  event.target.value,
                ),
              })
            }
          />
        </label>

        <label className="field">
          <span>Tax rate %</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={session.taxRate}
            disabled={working}
            onChange={(event) =>
              void onUpdate({
                taxRate: Number(
                  event.target.value,
                ),
              })
            }
          />
        </label>

        <label className="field">
          <span>Tip</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={session.tipAmount}
            disabled={working}
            onChange={(event) =>
              void onUpdate({
                tipAmount: Number(
                  event.target.value,
                ),
              })
            }
          />
        </label>

        <label className="field">
          <span>Deposit applied</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={session.depositApplied}
            disabled={working}
            onChange={(event) =>
              void onUpdate({
                depositApplied:
                  Number(
                    event.target.value,
                  ),
              })
            }
          />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={3}
          value={session.notes}
          disabled={working}
          onChange={(event) =>
            void onUpdate({
              notes: event.target.value,
            })
          }
        />
      </label>

      <dl className="checkout-totals-list">
        <div>
          <dt>Subtotal</dt>
          <dd>
            {money.format(
              totals.subtotal,
            )}
          </dd>
        </div>

        <div>
          <dt>Line discounts</dt>
          <dd>
            -{money.format(
              totals.lineDiscounts,
            )}
          </dd>
        </div>

        <div>
          <dt>Session discount</dt>
          <dd>
            -{money.format(
              totals.sessionDiscount,
            )}
          </dd>
        </div>

        <div>
          <dt>Tax</dt>
          <dd>
            {money.format(totals.tax)}
          </dd>
        </div>

        <div>
          <dt>Tip</dt>
          <dd>
            {money.format(totals.tip)}
          </dd>
        </div>

        <div>
          <dt>Deposit applied</dt>
          <dd>
            -{money.format(
              totals.depositApplied,
            )}
          </dd>
        </div>

        <div className="checkout-total-row">
          <dt>Total</dt>
          <dd>
            {money.format(
              totals.total,
            )}
          </dd>
        </div>

        <div>
          <dt>Payments</dt>
          <dd>
            -{money.format(
              totals.paymentsApplied,
            )}
          </dd>
        </div>

        <div className="checkout-balance-row">
          <dt>Balance due</dt>
          <dd>
            {money.format(
              totals.balance,
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
