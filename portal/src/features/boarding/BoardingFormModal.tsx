import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer } from "../customers/customerTypes";
import type { Pet } from "../pets/petTypes";
import type { BoardingStay, BoardingStayInput } from "./boardingTypes";

type Props = {
  open: boolean;
  customers: Customer[];
  pets: Pet[];
  stay: BoardingStay | null;
  onClose: () => void;
  onSave: (input: BoardingStayInput, id?: string) => Promise<void>;
};

const empty: BoardingStayInput = {
  customerId: "",
  petId: "",
  checkInDate: new Date().toISOString().slice(0, 10),
  checkInTime: "14:00",
  checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  checkOutTime: "10:00",
  kennelName: "",
  status: "Reserved",
  feedingFrequency: "Twice Daily",
  foodInstructions: "",
  medicationInstructions: "",
  walkInstructions: "",
  playtimeInstructions: "",
  emergencyNotes: "",
  belongings: "",
  dailyRate: 48,
  depositAmount: 0,
  photoUpdatesEnabled: true,
  veterinarianReleaseConfirmed: false,
};

export function BoardingFormModal({ open, customers, pets, stay, onClose, onSave }: Props) {
  const [form, setForm] = useState<BoardingStayInput>(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(stay ? {
      customerId: stay.customerId,
      petId: stay.petId,
      checkInDate: stay.checkInDate,
      checkInTime: stay.checkInTime,
      checkOutDate: stay.checkOutDate,
      checkOutTime: stay.checkOutTime,
      kennelName: stay.kennelName,
      status: stay.status,
      feedingFrequency: stay.feedingFrequency,
      foodInstructions: stay.foodInstructions,
      medicationInstructions: stay.medicationInstructions,
      walkInstructions: stay.walkInstructions,
      playtimeInstructions: stay.playtimeInstructions,
      emergencyNotes: stay.emergencyNotes,
      belongings: stay.belongings,
      dailyRate: stay.dailyRate,
      depositAmount: stay.depositAmount,
      photoUpdatesEnabled: stay.photoUpdatesEnabled,
      veterinarianReleaseConfirmed: stay.veterinarianReleaseConfirmed,
    } : empty);
    setError("");
  }, [open, stay]);

  const filteredPets = useMemo(
    () => pets.filter((pet) => !form.customerId || pet.customerId === form.customerId),
    [form.customerId, pets],
  );

  if (!open) return null;

  function update<K extends keyof BoardingStayInput>(key: K, value: BoardingStayInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!form.customerId || !form.petId) return setError("Select a customer and pet.");
    if (!form.checkInDate || !form.checkOutDate) return setError("Check-in and check-out dates are required.");
    if (`${form.checkOutDate}T${form.checkOutTime}` <= `${form.checkInDate}T${form.checkInTime}`) return setError("Check-out must be after check-in.");
    if (form.dailyRate < 0 || form.depositAmount < 0) return setError("Rates and deposits cannot be negative.");
    setSaving(true);
    try {
      await onSave(form, stay?.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save boarding stay.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="modal-layer" role="presentation">
    <button className="modal-backdrop" onClick={onClose} aria-label="Close boarding form" />
    <form className="module-modal boarding-modal" onSubmit={submit}>
      <div className="modal-head"><div><span className="eyebrow">Boarding</span><h2>{stay ? "Edit stay" : "New boarding reservation"}</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={18}/></button></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-grid two-column">
        <label className="field"><span>Customer</span><select value={form.customerId} onChange={(e) => update("customerId", e.target.value)} required><option value="">Select customer</option>{customers.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></label>
        <label className="field"><span>Pet</span><select value={form.petId} onChange={(e) => update("petId", e.target.value)} required><option value="">Select pet</option>{filteredPets.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} · {p.breed}</option>)}</select></label>
        <label className="field"><span>Check-in date</span><input type="date" value={form.checkInDate} onChange={(e) => update("checkInDate", e.target.value)} required /></label>
        <label className="field"><span>Check-in time</span><input type="time" value={form.checkInTime} onChange={(e) => update("checkInTime", e.target.value)} required /></label>
        <label className="field"><span>Check-out date</span><input type="date" value={form.checkOutDate} onChange={(e) => update("checkOutDate", e.target.value)} required /></label>
        <label className="field"><span>Check-out time</span><input type="time" value={form.checkOutTime} onChange={(e) => update("checkOutTime", e.target.value)} required /></label>
        <label className="field"><span>Kennel / suite</span><input value={form.kennelName} onChange={(e) => update("kennelName", e.target.value)} placeholder="Suite A1" /></label>
        <label className="field"><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value as BoardingStayInput["status"])}>{["Reserved","Checked In","In Stay","Ready for Checkout","Checked Out","Cancelled"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="field"><span>Daily rate</span><input type="number" min="0" step="0.01" value={form.dailyRate} onChange={(e) => update("dailyRate", Number(e.target.value))} /></label>
        <label className="field"><span>Deposit</span><input type="number" min="0" step="0.01" value={form.depositAmount} onChange={(e) => update("depositAmount", Number(e.target.value))} /></label>
        <label className="field"><span>Feeding frequency</span><select value={form.feedingFrequency} onChange={(e) => update("feedingFrequency", e.target.value as BoardingStayInput["feedingFrequency"])}>{["Once Daily","Twice Daily","Three Times Daily","Custom"].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="field checkbox-field"><input type="checkbox" checked={form.photoUpdatesEnabled} onChange={(e) => update("photoUpdatesEnabled", e.target.checked)} /><span>Send photo updates</span></label>
        <label className="field full"><span>Food instructions</span><textarea value={form.foodInstructions} onChange={(e) => update("foodInstructions", e.target.value)} rows={2} /></label>
        <label className="field full"><span>Medication instructions</span><textarea value={form.medicationInstructions} onChange={(e) => update("medicationInstructions", e.target.value)} rows={2} /></label>
        <label className="field full"><span>Walk instructions</span><textarea value={form.walkInstructions} onChange={(e) => update("walkInstructions", e.target.value)} rows={2} /></label>
        <label className="field full"><span>Playtime instructions</span><textarea value={form.playtimeInstructions} onChange={(e) => update("playtimeInstructions", e.target.value)} rows={2} /></label>
        <label className="field full"><span>Belongings</span><textarea value={form.belongings} onChange={(e) => update("belongings", e.target.value)} rows={2} /></label>
        <label className="field full"><span>Emergency notes</span><textarea value={form.emergencyNotes} onChange={(e) => update("emergencyNotes", e.target.value)} rows={2} /></label>
        <label className="field checkbox-field full"><input type="checkbox" checked={form.veterinarianReleaseConfirmed} onChange={(e) => update("veterinarianReleaseConfirmed", e.target.checked)} /><span>Veterinarian release confirmed</span></label>
      </div>
      <div className="modal-actions"><AppButton type="button" variant="secondary" onClick={onClose}>Cancel</AppButton><AppButton disabled={saving}>{saving ? "Saving..." : "Save stay"}</AppButton></div>
    </form>
  </div>;
}
