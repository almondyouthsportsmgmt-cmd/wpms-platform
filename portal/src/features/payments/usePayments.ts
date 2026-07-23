import { useCallback, useEffect, useState } from "react";
import { addPayment, createInvoice, listInvoices, voidInvoice } from "./paymentService";
import type { Invoice, InvoiceInput, PaymentMethod } from "./paymentTypes";

export function usePayments() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setInvoices(await listInvoices()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load invoices."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function create(input: InvoiceInput) { const item = await createInvoice(input); setInvoices((current) => [item, ...current]); return item; }
  async function pay(id: string, amount: number, method: PaymentMethod, reference: string) { const item = await addPayment(id, amount, method, reference); setInvoices((current) => current.map((invoice) => invoice.id === id ? item : invoice)); return item; }
  async function voidOne(id: string) { const item = await voidInvoice(id); setInvoices((current) => current.map((invoice) => invoice.id === id ? item : invoice)); return item; }
  return { invoices, loading, error, refresh, create, pay, voidOne };
}
