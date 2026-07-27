import type {
  CheckoutLineItem,
  CheckoutSession,
} from "../types/checkoutTypes";

export interface CheckoutTotals {
  subtotal: number;
  lineDiscounts: number;
  sessionDiscount: number;
  taxableSubtotal: number;
  tax: number;
  tip: number;
  depositApplied: number;
  paymentsApplied: number;
  total: number;
  balance: number;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineItemGross(
  item: CheckoutLineItem,
) {
  return roundCurrency(
    Math.max(0, item.quantity) *
      Math.max(0, item.unitPrice),
  );
}

export function lineItemNet(
  item: CheckoutLineItem,
) {
  return roundCurrency(
    Math.max(
      0,
      lineItemGross(item) -
        Math.max(0, item.discountAmount),
    ),
  );
}

export function checkoutTotals(
  session: CheckoutSession,
): CheckoutTotals {
  const subtotal = roundCurrency(
    session.lineItems.reduce(
      (total, item) =>
        total + lineItemGross(item),
      0,
    ),
  );

  const lineDiscounts = roundCurrency(
    session.lineItems.reduce(
      (total, item) =>
        total +
        Math.max(0, item.discountAmount),
      0,
    ),
  );

  const netBeforeSessionDiscount =
    roundCurrency(
      session.lineItems.reduce(
        (total, item) =>
          total + lineItemNet(item),
        0,
      ),
    );

  const requestedSessionDiscount =
    session.discountType === "Percent"
      ? netBeforeSessionDiscount *
        (Math.max(0, session.discountValue) / 100)
      : session.discountType === "Fixed"
        ? Math.max(0, session.discountValue)
        : 0;

  const sessionDiscount = roundCurrency(
    Math.min(
      netBeforeSessionDiscount,
      requestedSessionDiscount,
    ),
  );

  const taxableBeforeSessionDiscount =
    roundCurrency(
      session.lineItems
        .filter((item) => item.taxable)
        .reduce(
          (total, item) =>
            total + lineItemNet(item),
          0,
        ),
    );

  const taxableShare =
    netBeforeSessionDiscount > 0
      ? taxableBeforeSessionDiscount /
        netBeforeSessionDiscount
      : 0;

  const taxableSubtotal = roundCurrency(
    Math.max(
      0,
      taxableBeforeSessionDiscount -
        sessionDiscount * taxableShare,
    ),
  );

  const tax = roundCurrency(
    taxableSubtotal *
      (Math.max(0, session.taxRate) / 100),
  );

  const tip = roundCurrency(
    Math.max(0, session.tipAmount),
  );

  const depositApplied = roundCurrency(
    Math.max(0, session.depositApplied),
  );

  const total = roundCurrency(
    Math.max(
      0,
      netBeforeSessionDiscount -
        sessionDiscount +
        tax +
        tip -
        depositApplied,
    ),
  );

  const paymentsApplied = roundCurrency(
    session.payments.reduce(
      (sum, payment) =>
        sum + Math.max(0, payment.amount),
      0,
    ),
  );

  const balance = roundCurrency(
    Math.max(0, total - paymentsApplied),
  );

  return {
    subtotal,
    lineDiscounts,
    sessionDiscount,
    taxableSubtotal,
    tax,
    tip,
    depositApplied,
    paymentsApplied,
    total,
    balance,
  };
}
