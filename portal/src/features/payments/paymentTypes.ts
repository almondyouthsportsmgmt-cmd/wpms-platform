export type PaymentMethod = "Cash" | "Credit Card" | "Debit Card" | "Check" | "Gift Card";
export type InvoiceStatus = "Open" | "Partially Paid" | "Paid" | "Voided";
export type InvoiceLineType = "Grooming" | "Boarding" | "Retail" | "Other";

export type InvoiceLine = {
  id: string;
  description: string;
  lineType: InvoiceLineType;
  quantity: number;
  unitPrice: number;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
};

export type Invoice = {
  id: string;
  customerId: string;
  lines: InvoiceLine[];
  discountType: "None" | "Fixed" | "Percent";
  discountValue: number;
  taxRate: number;
  tipAmount: number;
  depositApplied: number;
  status: InvoiceStatus;
  notes: string;
  payments: PaymentRecord[];
  createdAt: string;
  updatedAt: string;
};

export type InvoiceInput = Omit<Invoice, "id" | "status" | "payments" | "createdAt" | "updatedAt">;
