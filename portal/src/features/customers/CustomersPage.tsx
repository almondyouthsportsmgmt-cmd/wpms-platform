import { useMemo, useState } from "react";
import { Mail, MapPin, Pencil, Phone, Plus, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { CustomerFormModal } from "./CustomerFormModal";
import type { Customer, CustomerInput } from "./customerTypes";
import { useCustomers } from "./useCustomers";

export function CustomersPage() {
  const { customers, loading, error, refresh, save } = useCustomers();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesSearch = !needle || [customer.firstName, customer.lastName, customer.email, customer.mobilePhone]
        .join(" ").toLowerCase().includes(needle);
      const matchesStatus = status === "All" || (status === "Active" ? customer.isActive : !customer.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [customers, query, status]);

  async function handleSave(input: CustomerInput, id?: string) {
    await save(input, id);
    setNotice(id ? "Customer updated successfully." : "Customer created successfully.");
    window.setTimeout(() => setNotice(""), 2800);
  }

  return (
    <div className="customers-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Client relationships</span>
          <h1>Customers</h1>
          <p>Manage contact details, preferences, notes, and the families behind every pet.</p>
        </div>
        <AppButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> New customer</AppButton>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="customer-summary-grid">
        <AppCard className="summary-card"><Users size={22} /><div><span>Total customers</span><strong>{customers.length}</strong></div></AppCard>
        <AppCard className="summary-card"><span className="summary-dot active-dot" /><div><span>Active</span><strong>{customers.filter((item) => item.isActive).length}</strong></div></AppCard>
        <AppCard className="summary-card"><span className="summary-dot inactive-dot" /><div><span>Inactive</span><strong>{customers.filter((item) => !item.isActive).length}</strong></div></AppCard>
      </section>

      <AppCard className="customer-directory-card">
        <div className="directory-toolbar">
          <div className="module-search"><Search size={18} /><input aria-label="Search customers" placeholder="Search name, email, or phone..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <select aria-label="Filter customer status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option>All</option><option>Active</option><option>Inactive</option></select>
          <button className="link-button" onClick={() => void refresh()}>Refresh</button>
        </div>

        {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading customers...</p></div>}
        {!loading && error && <div className="module-state error-state"><p>{error}</p><AppButton onClick={() => void refresh()}>Try again</AppButton></div>}
        {!loading && !error && filtered.length === 0 && <div className="module-state"><div className="empty-icon">👥</div><h2>No customers found</h2><p>Adjust the search or create the shop’s first customer.</p></div>}
        {!loading && !error && filtered.length > 0 && (
          <div className="customer-table-wrap">
            <table className="customer-table">
              <thead><tr><th>Customer</th><th>Contact</th><th>Location</th><th>Preferred</th><th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>{filtered.map((customer) => (
                <tr key={customer.id}>
                  <td><Link className="customer-name-link" to={`/customers/${customer.id}`}><span className="customer-initials">{customer.firstName[0]}{customer.lastName[0]}</span><span><strong>{customer.firstName} {customer.lastName}</strong><small>Customer since {new Date(customer.createdAt).toLocaleDateString()}</small></span></Link></td>
                  <td><span className="table-detail"><Phone size={14} />{customer.mobilePhone}</span>{customer.email && <span className="table-detail"><Mail size={14} />{customer.email}</span>}</td>
                  <td><span className="table-detail"><MapPin size={14} />{customer.city || "—"}{customer.state ? `, ${customer.state}` : ""}</span></td>
                  <td>{customer.preferredContactMethod}</td>
                  <td><span className={`status-badge ${customer.isActive ? "is-active" : "is-inactive"}`}>{customer.isActive ? "Active" : "Inactive"}</span></td>
                  <td><button className="icon-button" aria-label={`Edit ${customer.firstName}`} onClick={() => { setEditing(customer); setModalOpen(true); }}><Pencil size={16} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </AppCard>

      <CustomerFormModal customer={editing} open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
