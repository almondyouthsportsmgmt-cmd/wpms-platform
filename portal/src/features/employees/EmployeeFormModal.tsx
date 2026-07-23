import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { permissionsForRole } from "./employeeService";
import type { Employee, EmployeeInput, EmployeePermissions, EmployeeRole } from "./employeeTypes";

type Props = {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (input: EmployeeInput, id?: string) => Promise<void>;
};

const roles: EmployeeRole[] = ["Owner", "Manager", "Groomer", "Bather", "Boarding Attendant", "Receptionist"];
const permissionLabels: Array<[keyof EmployeePermissions, string]> = [
  ["dashboard", "Dashboard"],
  ["customers", "Customers"],
  ["pets", "Pets"],
  ["appointments", "Appointments"],
  ["grooming", "Grooming"],
  ["boarding", "Boarding"],
  ["messages", "Messages"],
  ["payments", "Payments"],
  ["employees", "Employees"],
  ["reports", "Reports"],
  ["settings", "Settings"],
];

const blank: EmployeeInput = {
  firstName: "",
  lastName: "",
  email: "",
  mobilePhone: "",
  role: "Receptionist",
  status: "Active",
  hireDate: new Date().toISOString().slice(0, 10),
  hourlyRate: 0,
  colorCode: "#99e83f",
  notes: "",
  permissions: permissionsForRole("Receptionist"),
};

export function EmployeeFormModal({ open, employee, onClose, onSave }: Props) {
  const [form, setForm] = useState<EmployeeInput>(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(employee ? {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      mobilePhone: employee.mobilePhone,
      role: employee.role,
      status: employee.status,
      hireDate: employee.hireDate,
      hourlyRate: employee.hourlyRate,
      colorCode: employee.colorCode,
      notes: employee.notes,
      permissions: { ...employee.permissions },
    } : { ...blank, permissions: permissionsForRole("Receptionist") });
    setError("");
  }, [employee, open]);

  if (!open) return null;

  function update<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeRole(role: EmployeeRole) {
    setForm((current) => ({
      ...current,
      role,
      permissions: permissionsForRole(role),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) return setError("First and last name are required.");
    if (!form.email.includes("@")) return setError("Enter a valid email address.");
    if (form.hourlyRate < 0) return setError("Hourly rate cannot be negative.");
    setSaving(true);
    try {
      await onSave(form, employee?.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" onClick={onClose} aria-label="Close employee form" />
      <form className="module-modal employee-modal" onSubmit={submit}>
        <div className="modal-head">
          <div><span className="eyebrow">Team management</span><h2>{employee ? "Edit employee" : "Add employee"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-grid two-column">
          <label className="field"><span>First name</span><input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required /></label>
          <label className="field"><span>Last name</span><input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required /></label>
          <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></label>
          <label className="field"><span>Mobile phone</span><input value={form.mobilePhone} onChange={(e) => update("mobilePhone", e.target.value)} /></label>
          <label className="field"><span>Role</span><select value={form.role} onChange={(e) => changeRole(e.target.value as EmployeeRole)}>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="field"><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value as EmployeeInput["status"])}><option>Active</option><option>Inactive</option></select></label>
          <label className="field"><span>Hire date</span><input type="date" value={form.hireDate} onChange={(e) => update("hireDate", e.target.value)} /></label>
          <label className="field"><span>Hourly rate</span><input type="number" min="0" step="0.01" value={form.hourlyRate} onChange={(e) => update("hourlyRate", Number(e.target.value))} /></label>
          <label className="field"><span>Calendar color</span><input type="color" value={form.colorCode} onChange={(e) => update("colorCode", e.target.value)} /></label>
          <label className="field full"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
        </div>

        <div className="permission-editor">
          <div>
            <span className="eyebrow">Permissions</span>
            <h3>Module access</h3>
            <p>Role defaults are applied automatically and can be adjusted per employee.</p>
          </div>
          <div className="permission-grid">
            {permissionLabels.map(([key, label]) => (
              <label key={key} className="permission-item">
                <input
                  type="checkbox"
                  checked={form.permissions[key]}
                  onChange={(e) => update("permissions", { ...form.permissions, [key]: e.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <AppButton type="button" variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton disabled={saving}>{saving ? "Saving..." : "Save employee"}</AppButton>
        </div>
      </form>
    </div>
  );
}
