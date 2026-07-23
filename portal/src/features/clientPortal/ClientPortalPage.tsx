import { useMemo, useState } from "react";
import { ExternalLink, MailPlus, RefreshCw, Search, ShieldCheck, Smartphone, Users } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useAppointments } from "../appointments/useAppointments";
import { useBoarding } from "../boarding/useBoarding";
import { useCustomers } from "../customers/useCustomers";
import { usePayments } from "../payments/usePayments";
import { usePets } from "../pets/usePets";
import type { PortalAccessStatus } from "./clientPortalTypes";
import { useClientPortal } from "./useClientPortal";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function ClientPortalPage() {
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { appointments } = useAppointments();
  const { stays } = useBoarding();
  const { invoices } = usePayments();
  const { access, loading, error, refresh, save } = useClientPortal();
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? "");
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const selectedCustomer = customerMap.get(selectedCustomerId) ?? customers[0] ?? null;
  const selectedId = selectedCustomer?.id ?? "";
  const selectedPets = pets.filter((pet) => pet.customerId === selectedId);
  const selectedAppointments = appointments.filter((item) => item.customerId === selectedId && !["Cancelled", "No Show"].includes(item.status));
  const selectedBoarding = stays.filter((item) => item.customerId === selectedId && !["Cancelled", "Checked Out"].includes(item.status));
  const selectedInvoices = invoices.filter((item) => item.customerId === selectedId && item.status !== "Voided");
  const balance = selectedInvoices.reduce((total, invoice) => {
    const subtotal = invoice.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const discount = invoice.discountType === "Fixed" ? invoice.discountValue : invoice.discountType === "Percent" ? subtotal * invoice.discountValue / 100 : 0;
    const taxable = Math.max(0, subtotal - discount);
    const totalDue = taxable + taxable * invoice.taxRate / 100 + invoice.tipAmount - invoice.depositApplied;
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return total + Math.max(0, totalDue - paid);
  }, 0);

  const filtered = access.filter((item) => {
    const customer = customerMap.get(item.customerId);
    return [customer?.firstName, customer?.lastName, item.email, item.status]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function inviteCustomer() {
    if (!selectedCustomer) return;
    const existing = access.find((item) => item.customerId === selectedCustomer.id);
    await save({
      customerId: selectedCustomer.id,
      email: selectedCustomer.email || `${selectedCustomer.firstName.toLowerCase()}.${selectedCustomer.lastName.toLowerCase()}@example.com`,
      status: "Invited",
    }, existing?.id);
    show(existing ? "Portal invitation refreshed." : "Portal invitation created.");
  }

  async function updateStatus(id: string, customerId: string, email: string, status: PortalAccessStatus) {
    await save({ customerId, email, status }, id);
    show(`Portal access changed to ${status}.`);
  }

  return (
    <div className="client-portal-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Self-service experience</span>
          <h1>Customer Portal</h1>
          <p>Preview the client experience and manage customer portal access.</p>
        </div>
        <div className="toolbar-actions">
          <AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton>
          <AppButton onClick={() => void inviteCustomer()}><MailPlus size={17}/> Invite selected customer</AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="portal-layout">
        <AppCard className="portal-preview-card">
          <div className="portal-preview-toolbar">
            <div>
              <span className="eyebrow">Staff preview</span>
              <h2>Client dashboard</h2>
            </div>
            <label className="field compact-field">
              <span>Customer</span>
              <select value={selectedId} onChange={(event) => setSelectedCustomerId(event.target.value)}>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}
              </select>
            </label>
          </div>

          {selectedCustomer ? (
            <div className="client-preview-shell">
              <header className="client-preview-header">
                <div className="client-preview-brand">🐾 Whimsical Paws</div>
                <span>Welcome, {selectedCustomer.firstName}</span>
              </header>
              <div className="client-preview-welcome">
                <div>
                  <span className="eyebrow">Your pet care hub</span>
                  <h3>Everything for your pets in one place.</h3>
                  <p>Appointments, boarding, balances, vaccination details, and messages.</p>
                </div>
                <div className="client-preview-avatar">{selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}</div>
              </div>
              <div className="client-preview-kpis">
                <div><span>Pets</span><strong>{selectedPets.length}</strong></div>
                <div><span>Upcoming visits</span><strong>{selectedAppointments.length}</strong></div>
                <div><span>Active stays</span><strong>{selectedBoarding.length}</strong></div>
                <div><span>Balance</span><strong>{money(balance)}</strong></div>
              </div>
              <div className="client-preview-grid">
                <section>
                  <h4>My pets</h4>
                  {selectedPets.length === 0 && <p className="muted-copy">No pets added yet.</p>}
                  {selectedPets.slice(0, 3).map((pet) => (
                    <div className="client-pet-row" key={pet.id}>
                      <span>{pet.species === "Cat" ? "🐈" : "🐕"}</span>
                      <div><strong>{pet.name}</strong><small>{pet.breed || pet.species}</small></div>
                    </div>
                  ))}
                </section>
                <section>
                  <h4>Upcoming appointments</h4>
                  {selectedAppointments.length === 0 && <p className="muted-copy">No upcoming appointments.</p>}
                  {selectedAppointments.slice(0, 3).map((appointment) => (
                    <div className="client-appointment-row" key={appointment.id}>
                      <div><strong>{appointment.serviceName}</strong><small>{appointment.appointmentDate} · {appointment.startTime}</small></div>
                      <span>{appointment.status}</span>
                    </div>
                  ))}
                </section>
              </div>
              <button className="portal-open-button"><ExternalLink size={16}/> Open portal preview</button>
            </div>
          ) : <div className="module-state"><p>Add a customer to preview the portal.</p></div>}
        </AppCard>

        <aside className="portal-access-column">
          <section className="appointment-summary-grid portal-summary-grid">
            <AppCard className="summary-card"><Users size={22}/><div><span>Portal customers</span><strong>{access.length}</strong></div></AppCard>
            <AppCard className="summary-card"><ShieldCheck size={22}/><div><span>Active access</span><strong>{access.filter((item) => item.status === "Active").length}</strong></div></AppCard>
            <AppCard className="summary-card"><Smartphone size={22}/><div><span>Invitations</span><strong>{access.filter((item) => item.status === "Invited").length}</strong></div></AppCard>
          </section>

          <AppCard className="portal-access-card">
            <div className="card-heading">
              <div><span className="eyebrow">Access management</span><h2>Customer accounts</h2></div>
            </div>
            <div className="module-search"><Search size={18}/><input aria-label="Search portal accounts" placeholder="Search customer or email..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            {loading && <div className="module-state compact"><div className="paw-loader">🐾</div></div>}
            {!loading && error && <div className="form-error">{error}</div>}
            {!loading && !error && filtered.length === 0 && <div className="portal-empty">No portal accounts yet.</div>}
            <div className="portal-access-list">
              {filtered.map((item) => {
                const customer = customerMap.get(item.customerId);
                return (
                  <div className="portal-access-row" key={item.id}>
                    <div>
                      <strong>{customer ? `${customer.firstName} ${customer.lastName}` : "Customer"}</strong>
                      <span>{item.email}</span>
                    </div>
                    <select value={item.status} onChange={(event) => void updateStatus(item.id, item.customerId, item.email, event.target.value as PortalAccessStatus)}>
                      <option>Invited</option><option>Active</option><option>Suspended</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </AppCard>
        </aside>
      </section>
    </div>
  );
}
