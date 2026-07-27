export type CheckoutSessionStatus =
  | "Open"
  | "Ready"
  | "Paid"
  | "Cancelled";

export type CheckoutSourceType =
  | "Grooming"
  | "Boarding"
  | "Retail"
  | "Daycare"
  | "Training"
  | "Membership"
  | "Adjustment"
  | "Discount"
  | "Tax";

export type CheckoutPaymentStatus =
  | "Unpaid"
  | "Partially Paid"
  | "Paid"
  | "Refunded"
  | "Voided";

export type CheckoutPaymentMethod =
  | "Cash"
  | "Credit Card"
  | "Debit Card"
  | "Check"
  | "Square"
  | "Gift Card"
  | "Store Credit"
  | "Other";

export interface CheckoutLineItem {
  id: string;
  sourceType: CheckoutSourceType;
  sourceId?: string;
  customerId: string;
  petId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
  discountAmount: number;
  notes?: string;
  sourceUpdatedAt?: string;
}

export interface CheckoutPayment {
  id: string;
  method: CheckoutPaymentMethod;
  amount: number;
  reference?: string;
  receivedAt: string;
}

export interface CheckoutAuditEntry {
  id: string;
  action:
    | "Session Created"
    | "Line Added"
    | "Line Removed"
    | "Line Updated"
    | "Invoice Refreshed"
    | "Payment Added"
    | "Session Finalized"
    | "Session Cancelled";
  description: string;
  occurredAt: string;
  userId?: string;
}

export interface CheckoutSession {
  id: string;
  customerId: string;
  status: CheckoutSessionStatus;
  paymentStatus: CheckoutPaymentStatus;
  lineItems: CheckoutLineItem[];
  payments: CheckoutPayment[];
  discountType: "None" | "Fixed" | "Percent";
  discountValue: number;
  taxRate: number;
  tipAmount: number;
  depositApplied: number;
  notes: string;
  invoiceId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  audit: CheckoutAuditEntry[];
}

export type CreateCheckoutSessionInput = {
  customerId: string;
  createdBy?: string;
  taxRate?: number;
  notes?: string;
};

export type CheckoutSessionUpdate = Partial<
  Pick<
    CheckoutSession,
    | "status"
    | "paymentStatus"
    | "discountType"
    | "discountValue"
    | "taxRate"
    | "tipAmount"
    | "depositApplied"
    | "notes"
    | "invoiceId"
  >
>;

export interface CheckoutStorageData {
  version: 1;
  sessions: CheckoutSession[];
}
