import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  CreditCard,
} from "lucide-react";

import type {
  CheckoutPaymentMethod,
} from "../types/checkoutTypes";

type Props = {
  balance: number;
  working: boolean;
  onPay: (
    payment: {
      method: CheckoutPaymentMethod;
      amount: number;
      reference?: string;
    },
  ) => Promise<unknown> | unknown;
};

const methods: CheckoutPaymentMethod[] = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Check",
  "Square",
  "Gift Card",
  "Store Credit",
  "Other",
];

export default function CheckoutPaymentPanel({
  balance,
  working,
  onPay,
}: Props) {
  const [method, setMethod] =
    useState<CheckoutPaymentMethod>(
      "Square",
    );

  const [amount, setAmount] =
    useState(balance);

  const [reference, setReference] =
    useState("");

  useEffect(() => {
    setAmount(balance);
  }, [balance]);

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    await onPay({
      method,
      amount,
      reference:
        reference.trim() || undefined,
    });

    setReference("");
  }

  return (
    <section className="checkout-payment-panel">
      <div className="checkout-builder-section-head">
        <div>
          <span className="eyebrow">
            Payment
          </span>
          <h2>Collect payment</h2>
        </div>

        <CreditCard size={21} />
      </div>

      <form
        className="form-grid"
        onSubmit={submit}
      >
        <label className="field">
          <span>Method</span>
          <select
            value={method}
            disabled={working}
            onChange={(event) =>
              setMethod(
                event.target
                  .value as CheckoutPaymentMethod,
              )
            }
          >
            {methods.map((value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Amount</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            disabled={working}
            onChange={(event) =>
              setAmount(
                Number(
                  event.target.value,
                ),
              )
            }
          />
        </label>

        <label className="field">
          <span>Reference</span>
          <input
            value={reference}
            disabled={working}
            placeholder="Optional"
            onChange={(event) =>
              setReference(
                event.target.value,
              )
            }
          />
        </label>

        <button
          type="submit"
          className="primary-button checkout-pay-button"
          disabled={
            working ||
            amount <= 0 ||
            balance <= 0
          }
        >
          Record payment
        </button>
      </form>
    </section>
  );
}
