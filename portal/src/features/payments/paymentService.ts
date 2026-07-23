import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Invoice, InvoiceInput, PaymentMethod, PaymentRecord } from "./paymentTypes";

const STORAGE_KEY = "wpms-demo-invoices";

function readDemo(): Invoice[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) as Invoice[] : [];
}

function writeDemo(items: Invoice[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function invoiceTotals(invoice: Pick<Invoice, "lines" | "discountType" | "discountValue" | "taxRate" | "tipAmount" | "depositApplied" | "payments">) {
  const subtotal = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discount = invoice.discountType === "Percent"
    ? subtotal * Math.min(Math.max(invoice.discountValue, 0), 100) / 100
    : invoice.discountType === "Fixed" ? Math.min(invoice.discountValue, subtotal) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * Math.max(invoice.taxRate, 0) / 100;
  const total = Math.max(0, taxable + tax + Math.max(invoice.tipAmount, 0) - Math.max(invoice.depositApplied, 0));
  const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return { subtotal, discount, tax, total, paid, balance: Math.max(0, total - paid) };
}

function deriveStatus(invoice: Invoice): Invoice["status"] {
  if (invoice.status === "Voided") return "Voided";
  const { paid, total } = invoiceTotals(invoice);
  if (paid <= 0) return "Open";
  if (paid + 0.005 >= total) return "Paid";
  return "Partially Paid";
}

function fromRow(row: Record<string, unknown>): Invoice {
  return {
    id: String(row.id), customerId: String(row.customer_id),
    lines: (row.lines ?? []) as Invoice["lines"],
    discountType: String(row.discount_type ?? "None") as Invoice["discountType"],
    discountValue: Number(row.discount_value ?? 0), taxRate: Number(row.tax_rate ?? 0),
    tipAmount: Number(row.tip_amount ?? 0), depositApplied: Number(row.deposit_applied ?? 0),
    status: String(row.status ?? "Open") as Invoice["status"], notes: String(row.notes ?? ""),
    payments: (row.payments ?? []) as Invoice["payments"], createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export async function listInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured) return readDemo().sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  const timestamp = new Date().toISOString();
  if (!isSupabaseConfigured) {
    let invoice: Invoice = { ...input, id: crypto.randomUUID(), status: "Open", payments: [], createdAt: timestamp, updatedAt: timestamp };
    invoice = { ...invoice, status: deriveStatus(invoice) };
    writeDemo([invoice, ...readDemo()]);
    return invoice;
  }
  const { data, error } = await supabase.from("invoices").insert({
    customer_id: input.customerId, lines: input.lines, discount_type: input.discountType,
    discount_value: input.discountValue, tax_rate: input.taxRate, tip_amount: input.tipAmount,
    deposit_applied: input.depositApplied, notes: input.notes,
  }).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function addPayment(invoiceId: string, amount: number, method: PaymentMethod, reference = ""): Promise<Invoice> {
  if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === invoiceId);
    if (!existing) throw new Error("Invoice not found.");
    const payment: PaymentRecord = { id: crypto.randomUUID(), invoiceId, amount, method, reference, paidAt: new Date().toISOString() };
    let updated: Invoice = { ...existing, payments: [...existing.payments, payment], updatedAt: new Date().toISOString() };
    updated = { ...updated, status: deriveStatus(updated) };
    writeDemo(items.map((item) => item.id === invoiceId ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.rpc("wpms_record_payment", {
    p_invoice_id: invoiceId, p_amount: amount, p_method: method, p_reference: reference || null,
  });
  if (error) throw error;
  const { data: invoice, error: invoiceError } = await supabase.from("invoices").select("*").eq("id", data).single();
  if (invoiceError) throw invoiceError;
  return fromRow(invoice);
}

export async function voidInvoice(invoiceId: string): Promise<Invoice> {
  if (!isSupabaseConfigured) {
    const items = readDemo(); const existing = items.find((item) => item.id === invoiceId);
    if (!existing) throw new Error("Invoice not found.");
    const updated = { ...existing, status: "Voided" as const, updatedAt: new Date().toISOString() };
    writeDemo(items.map((item) => item.id === invoiceId ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from("invoices").update({ status: "Voided" }).eq("id", invoiceId).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
