import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer } from "../customers/customerTypes";
import type { Pet } from "../pets/petTypes";
import type { Appointment, AppointmentInput, AppointmentStatus, AppointmentType } from "./appointmentTypes";

const statuses: AppointmentStatus[] = ["Scheduled", "Confirmed", "Checked In", "In Service", "Ready for Pickup", "Completed", "Cancelled", "No Show"];
const types: AppointmentType[] = ["Grooming", "Bath", "Nails", "Boarding", "Other"];

function initial(customerId = "", petId = ""): AppointmentInput {
  const date = new Date().toISOString().slice(0, 10);
  return {
    customerId,
    petId,
    appointmentType: "Grooming",
    serviceName: "Full Groom",
    appointmentDate: date,
    startTime: "09:00",
    endTime: "10:30",
    assignedStaff: "",
    status: "Scheduled",
    priceEstimate: null,
    notes: "",
    reminderSent: false,
  };
}

export function AppointmentFormModal({
  appointment,
  customers,
  pets,
  open,
  onClose,
  onSave,
}: {
  appointment: Appointment | null;
  customers: Customer[];
  pets: Pet[];
  open: boolean;
  onClose: () => void;
  onSave: (input: AppointmentInput, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<AppointmentInput>(initial());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const eligiblePets = useMemo(() => pets.filter((pet) => pet.customerId === form.customerId && pet.isActive), [form.customerId, pets]);

  useEffect(() => {
    if (!open) return;
    setForm(appointment ? {
      customerId: appointment.customerId,
      petId: appointment.petId,
      appointmentType: appointment.appointmentType,
      serviceName: appointment.serviceName,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      assignedStaff: appointment.assignedStaff,
      status: appointment.status,
      priceEstimate: appointment.priceEstimate,
      notes: appointment.notes,
      reminderSent: appointment.reminderSent,
    } : initial());
    setError("");
  }, [appointment, open]);

  if (!open) return null;

  function patch<K extends keyof AppointmentInput>(key: K, value: AppointmentInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.customerId || !form.petId || !form.serviceName.trim() || !form.appointmentDate || !form.startTime || !form.endTime) {
      setError("Customer, pet, service, date, start time, and end time are required.");
      return;
    }
    if (form.endTime <= form.startTime) {
      setError("End time must be later than start time.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...form, serviceName: form.serviceName.trim(), assignedStaff: form.assignedStaff.trim(), notes: form.notes.trim() }, appointment?.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save appointment.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-backdrop" role="presentation">
    <div className="app-modal appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
      <div className="modal-header"><div><span className="eyebrow">Schedule</span><h2 id="appointment-modal-title">{appointment ? "Edit appointment" : "New appointment"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-grid two-column">
          <label className="field"><span>Customer *</span><select value={form.customerId} onChange={(e) => { patch("customerId", e.target.value); patch("petId", ""); }}><option value="">Select customer</option>{customers.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>
          <label className="field"><span>Pet *</span><select value={form.petId} onChange={(e) => patch("petId", e.target.value)} disabled={!form.customerId}><option value="">Select pet</option>{eligiblePets.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.breed || item.species}</option>)}</select></label>
          <label className="field"><span>Appointment type</span><select value={form.appointmentType} onChange={(e) => patch("appointmentType", e.target.value as AppointmentType)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Service *</span><input value={form.serviceName} onChange={(e) => patch("serviceName", e.target.value)} placeholder="Full Groom" /></label>
          <label className="field"><span>Date *</span><input type="date" value={form.appointmentDate} onChange={(e) => patch("appointmentDate", e.target.value)} /></label>
          <label className="field"><span>Status</span><select value={form.status} onChange={(e) => patch("status", e.target.value as AppointmentStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Start time *</span><input type="time" value={form.startTime} onChange={(e) => patch("startTime", e.target.value)} /></label>
          <label className="field"><span>End time *</span><input type="time" value={form.endTime} onChange={(e) => patch("endTime", e.target.value)} /></label>
          <label className="field"><span>Assigned staff</span><input value={form.assignedStaff} onChange={(e) => patch("assignedStaff", e.target.value)} placeholder="Ashley" /></label>
          <label className="field"><span>Price estimate</span><input type="number" min="0" step="0.01" value={form.priceEstimate ?? ""} onChange={(e) => patch("priceEstimate", e.target.value === "" ? null : Number(e.target.value))} placeholder="0.00" /></label>
        </div>
        <label className="field"><span>Appointment notes</span><textarea rows={4} value={form.notes} onChange={(e) => patch("notes", e.target.value)} placeholder="Service instructions, pickup details, behavior reminders..." /></label>
        <label className="checkbox-field"><input type="checkbox" checked={form.reminderSent} onChange={(e) => patch("reminderSent", e.target.checked)} /><span>Reminder sent</span></label>
        <div className="modal-actions"><AppButton type="button" variant="secondary" onClick={onClose}>Cancel</AppButton><AppButton type="submit" disabled={saving}>{saving ? "Saving..." : appointment ? "Save changes" : "Book appointment"}</AppButton></div>
      </form>
    </div>
  </div>;
}
