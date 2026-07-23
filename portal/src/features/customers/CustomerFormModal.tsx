import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer, CustomerInput, ContactMethod } from "./customerTypes";

const emptyForm: CustomerInput = {
  firstName: "",
  lastName: "",
  mobilePhone: "",
  homePhone: "",
  email: "",
  streetAddress: "",
  city: "",
  state: "FL",
  zipCode: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyRelationship: "",
  preferredContactMethod: "Text",
  marketingOptIn: false,
  notes: "",
  isActive: true,
};

export function CustomerFormModal({
  customer,
  open,
  onClose,
  onSave,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onSave: (input: CustomerInput, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(customer ? {
      firstName: customer.firstName,
      lastName: customer.lastName,
      mobilePhone: customer.mobilePhone,
      homePhone: customer.homePhone,
      email: customer.email,
      streetAddress: customer.streetAddress,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      emergencyContactName: customer.emergencyContactName,
      emergencyContactPhone: customer.emergencyContactPhone,
      emergencyRelationship: customer.emergencyRelationship,
      preferredContactMethod: customer.preferredContactMethod,
      marketingOptIn: customer.marketingOptIn,
      notes: customer.notes,
      isActive: customer.isActive,
    } : emptyForm);
  }, [customer, open]);

  if (!open) return null;

  function set<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.mobilePhone.trim()) {
      setError("First name, last name, and mobile phone are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() }, customer?.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <header className="modal-header">
          <div>
            <span className="eyebrow">Customer Management</span>
            <h2 id="customer-modal-title">{customer ? "Edit customer" : "New customer"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <form onSubmit={submit}>
          {error && <div className="error">{error}</div>}
          <div className="form-section">
            <h3>Basic information</h3>
            <div className="form-grid">
              <label className="field"><span>First name *</span><input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} /></label>
              <label className="field"><span>Last name *</span><input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></label>
              <label className="field"><span>Mobile phone *</span><input value={form.mobilePhone} onChange={(e) => set("mobilePhone", e.target.value)} /></label>
              <label className="field"><span>Home phone</span><input value={form.homePhone} onChange={(e) => set("homePhone", e.target.value)} /></label>
              <label className="field field-wide"><span>Email</span><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></label>
            </div>
          </div>
          <div className="form-section">
            <h3>Address</h3>
            <div className="form-grid">
              <label className="field field-wide"><span>Street address</span><input value={form.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} /></label>
              <label className="field"><span>City</span><input value={form.city} onChange={(e) => set("city", e.target.value)} /></label>
              <label className="field"><span>State</span><input maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></label>
              <label className="field"><span>ZIP code</span><input value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)} /></label>
            </div>
          </div>
          <div className="form-section">
            <h3>Emergency contact</h3>
            <div className="form-grid">
              <label className="field"><span>Name</span><input value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} /></label>
              <label className="field"><span>Phone</span><input value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} /></label>
              <label className="field field-wide"><span>Relationship</span><input value={form.emergencyRelationship} onChange={(e) => set("emergencyRelationship", e.target.value)} /></label>
            </div>
          </div>
          <div className="form-section">
            <h3>Preferences</h3>
            <div className="form-grid">
              <label className="field"><span>Preferred contact</span><select value={form.preferredContactMethod} onChange={(e) => set("preferredContactMethod", e.target.value as ContactMethod)}><option>Text</option><option>Call</option><option>Email</option></select></label>
              <label className="toggle-field"><input type="checkbox" checked={form.marketingOptIn} onChange={(e) => set("marketingOptIn", e.target.checked)} /><span>Marketing opt-in</span></label>
              <label className="toggle-field"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /><span>Active customer</span></label>
              <label className="field field-wide"><span>Notes</span><textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></label>
            </div>
          </div>
          <footer className="modal-footer">
            <AppButton type="button" variant="secondary" onClick={onClose}>Cancel</AppButton>
            <AppButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save customer"}</AppButton>
          </footer>
        </form>
      </section>
    </div>
  );
}
