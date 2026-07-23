import { useMemo, useState, type FormEvent } from "react";
import { CircleDollarSign, Plus, ReceiptText, Search, WalletCards } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { invoiceTotals } from "./paymentService";
import type { InvoiceLine, PaymentMethod } from "./paymentTypes";
import { usePayments } from "./usePayments";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function PaymentsPage() {
  const { customers } = useCustomers();
  const { invoices, loading, error, create, pay, voidOne } = usePayments();
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [description, setDescription] = useState("Full Groom");
  const [amount, setAmount] = useState(85);
  const [taxRate, setTaxRate] = useState(7);
  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("Credit Card");
  const [reference, setReference] = useState("");
  const [notice, setNotice] = useState("");
  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const selected = invoices.find((item) => item.id === selectedId) ?? null;
  const filtered = invoices.filter((invoice) => {
    const customer = customerMap.get(invoice.customerId);
    return [customer?.firstName, customer?.lastName, invoice.status, invoice.id].join(" ").toLowerCase().includes(query.toLowerCase());
  });
  const totals = invoices.reduce((acc, invoice) => { const t = invoiceTotals(invoice); if (invoice.status !== "Voided") { acc.sales += t.total; acc.paid += t.paid; acc.balance += t.balance; } return acc; }, { sales: 0, paid: 0, balance: 0 });
  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2200); }
  async function createCheckout(event: FormEvent) {
    event.preventDefault();
    if (!customerId) return flash("Select a customer.");
    const lines: InvoiceLine[] = [{ id: crypto.randomUUID(), description, lineType: "Grooming", quantity: 1, unitPrice: amount }];
    const invoice = await create({ customerId, lines, discountType: discount > 0 ? "Fixed" : "None", discountValue: discount, taxRate, tipAmount: tip, depositApplied: 0, notes: "" });
    setSelectedId(invoice.id); setPaymentAmount(invoiceTotals(invoice).balance); flash("Invoice created.");
  }
  async function recordPayment(event: FormEvent) {
    event.preventDefault(); if (!selected) return;
    const updated = await pay(selected.id, paymentAmount, method, reference); setPaymentAmount(invoiceTotals(updated).balance); setReference(""); flash("Payment recorded.");
  }
  return <div className="payments-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Checkout & revenue</span><h1>Payments</h1><p>Create invoices, collect payments, and track balances.</p></div></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid"><AppCard className="summary-card"><CircleDollarSign size={22}/><div><span>Total sales</span><strong>{money.format(totals.sales)}</strong></div></AppCard><AppCard className="summary-card"><WalletCards size={22}/><div><span>Collected</span><strong>{money.format(totals.paid)}</strong></div></AppCard><AppCard className="summary-card"><ReceiptText size={22}/><div><span>Outstanding</span><strong>{money.format(totals.balance)}</strong></div></AppCard></section>
    <section className="payments-layout">
      <AppCard className="checkout-card"><div className="card-heading"><div><span className="eyebrow">New sale</span><h2>Quick checkout</h2></div></div><form onSubmit={createCheckout} className="form-grid two-column"><label className="field full"><span>Customer</span><select value={customerId} onChange={(e)=>setCustomerId(e.target.value)}><option value="">Select customer</option>{customers.filter(c=>c.isActive).map(c=><option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></label><label className="field"><span>Description</span><input value={description} onChange={(e)=>setDescription(e.target.value)}/></label><label className="field"><span>Amount</span><input type="number" min="0" step="0.01" value={amount} onChange={(e)=>setAmount(Number(e.target.value))}/></label><label className="field"><span>Discount</span><input type="number" min="0" step="0.01" value={discount} onChange={(e)=>setDiscount(Number(e.target.value))}/></label><label className="field"><span>Tax %</span><input type="number" min="0" step="0.01" value={taxRate} onChange={(e)=>setTaxRate(Number(e.target.value))}/></label><label className="field"><span>Tip</span><input type="number" min="0" step="0.01" value={tip} onChange={(e)=>setTip(Number(e.target.value))}/></label><div className="full"><AppButton><Plus size={17}/> Create invoice</AppButton></div></form></AppCard>
      <AppCard className="payment-card"><div className="card-heading"><div><span className="eyebrow">Payment</span><h2>{selected ? `Invoice ${selected.id.slice(0,8)}` : "Select an invoice"}</h2></div></div>{selected ? <form onSubmit={recordPayment} className="form-grid"><div className="invoice-total-panel"><span>Balance due</span><strong>{money.format(invoiceTotals(selected).balance)}</strong></div><label className="field"><span>Payment amount</span><input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e)=>setPaymentAmount(Number(e.target.value))}/></label><label className="field"><span>Method</span><select value={method} onChange={(e)=>setMethod(e.target.value as PaymentMethod)}>{["Cash","Credit Card","Debit Card","Check","Gift Card"].map(v=><option key={v}>{v}</option>)}</select></label><label className="field"><span>Reference</span><input value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="Optional"/></label><div className="payment-actions"><AppButton disabled={invoiceTotals(selected).balance<=0}>Record payment</AppButton><AppButton type="button" variant="secondary" onClick={()=>void voidOne(selected.id)}>Void invoice</AppButton></div></form> : <div className="conversation-empty"><span>💳</span><h3>No invoice selected</h3><p>Select one from the list below.</p></div>}</AppCard>
    </section>
    <section className="module-controls"><div className="module-search"><Search size={18}/><input placeholder="Search customer, status, or invoice..." value={query} onChange={(e)=>setQuery(e.target.value)} /></div></section>
    {loading && <div className="module-state"><div className="paw-loader">🐾</div></div>}{!loading&&error&&<div className="form-error">{error}</div>}
    {!loading&&!error&&<AppCard className="invoice-list"><div className="invoice-table-head"><span>Customer</span><span>Total</span><span>Paid</span><span>Balance</span><span>Status</span></div>{filtered.map(invoice=>{const c=customerMap.get(invoice.customerId);const t=invoiceTotals(invoice);return <button className={`invoice-row ${selectedId===invoice.id?"is-active":""}`} key={invoice.id} onClick={()=>{setSelectedId(invoice.id);setPaymentAmount(t.balance)}}><span>{c?`${c.firstName} ${c.lastName}`:"Customer"}<small>{invoice.id.slice(0,8)}</small></span><strong>{money.format(t.total)}</strong><span>{money.format(t.paid)}</span><span>{money.format(t.balance)}</span><span className={`status-chip status-${invoice.status.toLowerCase().replaceAll(" ","-")}`}>{invoice.status}</span></button>})}</AppCard>}
  </div>;
}
