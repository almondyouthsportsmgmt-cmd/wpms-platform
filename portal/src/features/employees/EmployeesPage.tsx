import { useMemo, useState } from "react";
import { BadgeDollarSign, Pencil, RefreshCw, Search, ShieldCheck, UserCheck, Users } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { EmployeeFormModal } from "./EmployeeFormModal";
import type { Employee } from "./employeeTypes";
import { useEmployees } from "./useEmployees";

export function EmployeesPage() {
  const { employees, loading, error, refresh, save } = useEmployees();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => employees.filter((employee) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.mobilePhone,
      employee.role,
    ].join(" ").toLowerCase().includes(needle);
    return matchesQuery
      && (role === "All" || employee.role === role)
      && (status === "All" || employee.status === status);
  }), [employees, query, role, status]);

  const active = employees.filter((item) => item.status === "Active").length;
  const groomers = employees.filter((item) => item.status === "Active" && ["Groomer", "Bather"].includes(item.role)).length;
  const payroll = employees
    .filter((item) => item.status === "Active")
    .reduce((total, item) => total + item.hourlyRate, 0);

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function handleSave(input: Parameters<typeof save>[0], id?: string) {
    await save(input, id);
    show(id ? "Employee updated." : "Employee added.");
  }

  return (
    <div className="employees-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">People & security</span>
          <h1>Employees</h1>
          <p>Manage staff records, roles, module permissions, and payroll rates.</p>
        </div>
        <div className="toolbar-actions">
          <AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton>
          <AppButton onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add employee</AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="appointment-summary-grid">
        <AppCard className="summary-card"><Users size={22}/><div><span>Total employees</span><strong>{employees.length}</strong></div></AppCard>
        <AppCard className="summary-card"><UserCheck size={22}/><div><span>Active staff</span><strong>{active}</strong></div></AppCard>
        <AppCard className="summary-card"><ShieldCheck size={22}/><div><span>Grooming staff</span><strong>{groomers}</strong></div></AppCard>
        <AppCard className="summary-card"><BadgeDollarSign size={22}/><div><span>Combined hourly rates</span><strong>${payroll.toFixed(2)}</strong></div></AppCard>
      </section>

      <section className="module-controls">
        <div className="module-search"><Search size={18}/><input aria-label="Search employees" placeholder="Search name, email, phone, or role..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select aria-label="Filter role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option>All</option>
          {["Owner","Manager","Groomer","Bather","Boarding Attendant","Receptionist"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>All</option><option>Active</option><option>Inactive</option>
        </select>
      </section>

      {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading employees...</p></div>}
      {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}
      {!loading && !error && filtered.length === 0 && <AppCard className="empty-state"><div className="empty-icon">👩‍💼</div><h2>No employees found</h2><p>Add the first employee or adjust your search and filters.</p></AppCard>}

      {!loading && !error && filtered.length > 0 && (
        <section className="employee-grid">
          {filtered.map((employee) => (
            <AppCard className="employee-card" key={employee.id}>
              <div className="employee-card-head">
                <div className="employee-identity">
                  <div className="employee-avatar" style={{ backgroundColor: employee.colorCode }}>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </div>
                  <div>
                    <h3>{employee.firstName} {employee.lastName}</h3>
                    <span>{employee.role}</span>
                  </div>
                </div>
                <button className="icon-button" onClick={() => { setEditing(employee); setModalOpen(true); }} aria-label="Edit employee"><Pencil size={17}/></button>
              </div>

              <div className="employee-contact">
                <span>{employee.email}</span>
                <span>{employee.mobilePhone || "No phone provided"}</span>
              </div>

              <div className="employee-meta">
                <div><span>Status</span><strong className={`employee-status ${employee.status.toLowerCase()}`}>{employee.status}</strong></div>
                <div><span>Hire date</span><strong>{employee.hireDate || "Not set"}</strong></div>
                <div><span>Hourly rate</span><strong>${employee.hourlyRate.toFixed(2)}</strong></div>
                <div><span>Module access</span><strong>{Object.values(employee.permissions).filter(Boolean).length}</strong></div>
              </div>

              <div className="permission-preview">
                {Object.entries(employee.permissions)
                  .filter(([, enabled]) => enabled)
                  .slice(0, 5)
                  .map(([name]) => <span key={name}>{name}</span>)}
                {Object.values(employee.permissions).filter(Boolean).length > 5 && <span>+ more</span>}
              </div>
            </AppCard>
          ))}
        </section>
      )}

      <EmployeeFormModal open={modalOpen} employee={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </div>
  );
}
