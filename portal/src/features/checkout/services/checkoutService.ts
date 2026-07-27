import {
  getStoredCheckoutSession,
  listStoredCheckoutSessions,
  removeStoredCheckoutSession,
  saveStoredCheckoutSession,
} from "./checkoutStorage";

import {
  checkoutTotals,
} from "./checkoutCalculations";

import type {
  CheckoutAuditEntry,
  CheckoutLineItem,
  CheckoutPayment,
  CheckoutSession,
  CheckoutSessionUpdate,
  CreateCheckoutSessionInput,
} from "../types/checkoutTypes";

function now() {
  return new Date().toISOString();
}

function audit(
  action: CheckoutAuditEntry["action"],
  description: string,
  userId?: string,
): CheckoutAuditEntry {
  return {
    id: crypto.randomUUID(),
    action,
    description,
    occurredAt: now(),
    userId,
  };
}

function requireSession(
  sessionId: string,
) {
  const session =
    getStoredCheckoutSession(sessionId);

  if (!session) {
    throw new Error(
      "Checkout session not found.",
    );
  }

  return session;
}

function save(
  session: CheckoutSession,
) {
  return saveStoredCheckoutSession({
    ...session,
    updatedAt: now(),
  });
}

export function listCheckoutSessions() {
  return listStoredCheckoutSessions().sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() -
      new Date(left.updatedAt).getTime(),
  );
}

export function getCheckoutSession(
  sessionId: string,
) {
  return getStoredCheckoutSession(sessionId);
}

export function createCheckoutSession(
  input: CreateCheckoutSessionInput,
) {
  if (!input.customerId) {
    throw new Error(
      "Customer is required to create checkout.",
    );
  }

  const existing =
    listStoredCheckoutSessions().find(
      (session) =>
        session.customerId ===
          input.customerId &&
        ["Open", "Ready"].includes(
          session.status,
        ),
    );

  if (existing) {
    return existing;
  }

  const createdAt = now();

  const session: CheckoutSession = {
    id: crypto.randomUUID(),
    customerId: input.customerId,
    status: "Open",
    paymentStatus: "Unpaid",
    lineItems: [],
    payments: [],
    discountType: "None",
    discountValue: 0,
    taxRate: Math.max(
      0,
      input.taxRate ?? 0,
    ),
    tipAmount: 0,
    depositApplied: 0,
    notes: input.notes ?? "",
    createdBy: input.createdBy,
    createdAt,
    updatedAt: createdAt,
    audit: [
      audit(
        "Session Created",
        "Checkout session created.",
        input.createdBy,
      ),
    ],
  };

  return saveStoredCheckoutSession(
    session,
  );
}

export function updateCheckoutSession(
  sessionId: string,
  update: CheckoutSessionUpdate,
) {
  const session =
    requireSession(sessionId);

  return save({
    ...session,
    ...update,
  });
}

export function addCheckoutLineItem(
  sessionId: string,
  item: Omit<
    CheckoutLineItem,
    "id"
  > & {
    id?: string;
  },
) {
  const session =
    requireSession(sessionId);

  if (
    item.sourceId &&
    session.lineItems.some(
      (current) =>
        current.sourceType ===
          item.sourceType &&
        current.sourceId ===
          item.sourceId,
    )
  ) {
    throw new Error(
      "This source record is already included in checkout.",
    );
  }

  const lineItem: CheckoutLineItem = {
    ...item,
    id:
      item.id ??
      crypto.randomUUID(),
    quantity: Math.max(
      0,
      item.quantity,
    ),
    unitPrice: Math.max(
      0,
      item.unitPrice,
    ),
    discountAmount: Math.max(
      0,
      item.discountAmount,
    ),
  };

  return save({
    ...session,
    lineItems: [
      ...session.lineItems,
      lineItem,
    ],
    audit: [
      ...session.audit,
      audit(
        "Line Added",
        `${lineItem.description} added to checkout.`,
      ),
    ],
  });
}

export function updateCheckoutLineItem(
  sessionId: string,
  lineItemId: string,
  update: Partial<
    Omit<
      CheckoutLineItem,
      "id" | "customerId"
    >
  >,
) {
  const session =
    requireSession(sessionId);

  const exists =
    session.lineItems.some(
      (item) =>
        item.id === lineItemId,
    );

  if (!exists) {
    throw new Error(
      "Checkout line item not found.",
    );
  }

  return save({
    ...session,
    lineItems:
      session.lineItems.map(
        (item) =>
          item.id === lineItemId
            ? {
                ...item,
                ...update,
                quantity:
                  update.quantity ===
                  undefined
                    ? item.quantity
                    : Math.max(
                        0,
                        update.quantity,
                      ),
                unitPrice:
                  update.unitPrice ===
                  undefined
                    ? item.unitPrice
                    : Math.max(
                        0,
                        update.unitPrice,
                      ),
                discountAmount:
                  update.discountAmount ===
                  undefined
                    ? item.discountAmount
                    : Math.max(
                        0,
                        update.discountAmount,
                      ),
              }
            : item,
      ),
    audit: [
      ...session.audit,
      audit(
        "Line Updated",
        "Checkout line item updated.",
      ),
    ],
  });
}

export function removeCheckoutLineItem(
  sessionId: string,
  lineItemId: string,
) {
  const session =
    requireSession(sessionId);

  const line =
    session.lineItems.find(
      (item) =>
        item.id === lineItemId,
    );

  if (!line) {
    throw new Error(
      "Checkout line item not found.",
    );
  }

  return save({
    ...session,
    lineItems:
      session.lineItems.filter(
        (item) =>
          item.id !== lineItemId,
      ),
    audit: [
      ...session.audit,
      audit(
        "Line Removed",
        `${line.description} removed from checkout.`,
      ),
    ],
  });
}

export function addCheckoutPayment(
  sessionId: string,
  payment: Omit<
    CheckoutPayment,
    "id" | "receivedAt"
  > & {
    id?: string;
    receivedAt?: string;
  },
) {
  const session =
    requireSession(sessionId);

  if (payment.amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero.",
    );
  }

  const entry: CheckoutPayment = {
    ...payment,
    id:
      payment.id ??
      crypto.randomUUID(),
    receivedAt:
      payment.receivedAt ??
      now(),
  };

  const updated = {
    ...session,
    payments: [
      ...session.payments,
      entry,
    ],
    audit: [
      ...session.audit,
      audit(
        "Payment Added",
        `${entry.method} payment recorded.`,
      ),
    ],
  };

  const totals =
    checkoutTotals(updated);

  updated.paymentStatus =
    totals.balance <= 0
      ? "Paid"
      : "Partially Paid";

  if (totals.balance <= 0) {
    updated.status = "Paid";
    updated.audit = [
      ...updated.audit,
      audit(
        "Session Finalized",
        "Checkout session paid in full.",
      ),
    ];
  }

  return save(updated);
}

export function markCheckoutReady(
  sessionId: string,
) {
  const session =
    requireSession(sessionId);

  if (
    session.lineItems.length === 0
  ) {
    throw new Error(
      "Add at least one line item before marking checkout ready.",
    );
  }

  return save({
    ...session,
    status: "Ready",
  });
}

export function cancelCheckoutSession(
  sessionId: string,
) {
  const session =
    requireSession(sessionId);

  return save({
    ...session,
    status: "Cancelled",
    paymentStatus: "Voided",
    audit: [
      ...session.audit,
      audit(
        "Session Cancelled",
        "Checkout session cancelled.",
      ),
    ],
  });
}

export function deleteCheckoutSession(
  sessionId: string,
) {
  removeStoredCheckoutSession(
    sessionId,
  );
}

export function findCheckoutBySource(
  sourceType: CheckoutLineItem["sourceType"],
  sourceId: string,
) {
  return (
    listStoredCheckoutSessions().find(
      (session) =>
        ["Open", "Ready"].includes(
          session.status,
        ) &&
        session.lineItems.some(
          (item) =>
            item.sourceType ===
              sourceType &&
            item.sourceId ===
              sourceId,
        ),
    ) ?? null
  );
}
