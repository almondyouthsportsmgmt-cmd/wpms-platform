import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer } from "../customers/customerTypes";
import { breedsForSpecies } from "./breedCatalog";
import type {
  Pet, PetAvatar, PetFixedStatus, PetHairLength, PetInput, PetSex, PetSize,
} from "./petTypes";

const AVATARS: PetAvatar[] = ["🐕","🐶","🐩","🦮","🐕‍🦺","🐈","🐈‍⬛","🐾"];

const emptyPet = (customerId = ""): PetInput => ({
  customerId, name: "", species: "Dog", breed: "", color: "", sex: "Unknown",
  fixedStatus: "Intact", hairLength: "Short Coat", birthday: "", weightPounds: null,
  size: "Medium", microchipNumber: "", veterinarianName: "", veterinarianPhone: "",
  allergies: "", medicalAlerts: "", behaviorNotes: "", groomingNotes: "",
  preferredGroomer: "", preferredShampoo: "",
  vaccinationRabiesExpiresOn: "", vaccinationBordetellaExpiresOn: "",
  vaccinationDhppExpiresOn: "", photoUrl: "", avatar: "🐕", isActive: true,
});

export function PetFormModal({
  pet, customers, defaultCustomerId = "", open, onClose, onSave,
}: {
  pet: Pet | null; customers: Customer[]; defaultCustomerId?: string; open: boolean;
  onClose: () => void; onSave: (input: PetInput, id?: string) => Promise<void>;
}) {
  const [form, setForm] = useState<PetInput>(emptyPet(defaultCustomerId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const breeds = useMemo(() => breedsForSpecies(form.species), [form.species]);

  useEffect(() => {
    if (!open) return;
    setForm(pet ? {
      customerId: pet.customerId, name: pet.name, species: pet.species, breed: pet.breed,
      color: pet.color, sex: pet.sex, fixedStatus: pet.fixedStatus ?? "Intact",
      hairLength: pet.hairLength ?? "Short Coat", birthday: pet.birthday,
      weightPounds: pet.weightPounds, size: pet.size, microchipNumber: pet.microchipNumber,
      veterinarianName: pet.veterinarianName, veterinarianPhone: pet.veterinarianPhone,
      allergies: pet.allergies, medicalAlerts: pet.medicalAlerts,
      behaviorNotes: pet.behaviorNotes, groomingNotes: pet.groomingNotes,
      preferredGroomer: pet.preferredGroomer, preferredShampoo: pet.preferredShampoo ?? "",
      vaccinationRabiesExpiresOn: pet.vaccinationRabiesExpiresOn,
      vaccinationBordetellaExpiresOn: pet.vaccinationBordetellaExpiresOn,
      vaccinationDhppExpiresOn: pet.vaccinationDhppExpiresOn,
      photoUrl: pet.photoUrl, avatar: pet.avatar ?? (pet.species === "Cat" ? "🐈" : "🐕"),
      isActive: pet.isActive,
    } : emptyPet(defaultCustomerId));
    setError("");
  }, [defaultCustomerId, open, pet]);

  if (!open) return null;

  function set<K extends keyof PetInput>(key: K, value: PetInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeSpecies(species: string) {
    setForm((current) => ({
      ...current, species, breed: "",
      avatar: species === "Cat" ? "🐈" : species === "Dog" ? "🐕" : "🐾",
    }));
  }

  function changeSex(sex: PetSex) {
    setForm((current) => ({
      ...current, sex,
      fixedStatus:
        sex === "Male" && current.fixedStatus === "Spayed (Female)" ? "Intact" :
        sex === "Female" && current.fixedStatus === "Neutered (Male)" ? "Intact" :
        current.fixedStatus,
    }));
  }

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Select an image file.");
    if (file.size > 2_000_000) return setError("Pet photos must be 2 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => set("photoUrl", String(reader.result ?? ""));
    reader.onerror = () => setError("Unable to read the selected photo.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.customerId) return setError("Select a customer.");
    if (!form.name.trim()) return setError("Pet name is required.");
    if (!form.breed.trim()) return setError("Select or enter a breed.");
    if (form.sex === "Male" && form.fixedStatus === "Spayed (Female)") return setError("A male pet cannot be marked Spayed.");
    if (form.sex === "Female" && form.fixedStatus === "Neutered (Male)") return setError("A female pet cannot be marked Neutered.");
    setSaving(true); setError("");
    try {
      await onSave({
        ...form, name: form.name.trim(), breed: form.breed.trim(),
        preferredShampoo: form.preferredShampoo.trim(),
      }, pet?.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save pet.");
    } finally { setSaving(false); }
  }

  return (
    <div className="modal-layer" role="presentation">
      <button type="button" className="modal-backdrop" onClick={onClose} aria-label="Close pet form" />
      <form className="modal-card pet-modal-card" onSubmit={submit}>
        <div className="modal-header">
          <div><span className="eyebrow">Pet profile</span><h2>{pet ? "Edit pet" : "Add pet"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {error && <div className="form-error">{error}</div>}

        <section className="pet-image-editor">
          <div className="pet-image-preview">
            {form.photoUrl ? <img src={form.photoUrl} alt="Pet preview" /> : <span>{form.avatar}</span>}
          </div>
          <div>
            <strong>Pet photo or avatar</strong>
            <p>Upload a photo up to 2 MB, or choose an avatar.</p>
            <div className="pet-avatar-options">
              {AVATARS.map((avatar) => (
                <button type="button" key={avatar} className={form.avatar === avatar && !form.photoUrl ? "selected" : ""}
                  onClick={() => { set("avatar", avatar); set("photoUrl", ""); }}>{avatar}</button>
              ))}
            </div>
            <div className="pet-photo-actions">
              <label className="pet-upload-button"><ImagePlus size={16}/> Upload photo
                <input type="file" accept="image/*" onChange={uploadPhoto} />
              </label>
              {form.photoUrl && <button type="button" className="link-button" onClick={() => set("photoUrl", "")}><Trash2 size={15}/> Remove photo</button>}
            </div>
          </div>
        </section>

        <div className="form-grid">
          <label className="field form-span-2"><span>Customer *</span><select value={form.customerId} onChange={(e) => set("customerId", e.target.value)} required><option value="">Select customer</option>{customers.filter((c) => c.isActive || c.id === form.customerId).map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select></label>
          <label className="field"><span>Pet name *</span><input value={form.name} onChange={(e) => set("name", e.target.value)} required /></label>
          <label className="field"><span>Species</span><select value={form.species} onChange={(e) => changeSpecies(e.target.value)}><option>Dog</option><option>Cat</option><option>Other</option></select></label>
          <label className="field"><span>Breed *</span>{form.species === "Other" ? <input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="Enter breed or type" /> : <select value={form.breed} onChange={(e) => set("breed", e.target.value)} required><option value="">Select breed</option>{breeds.map((breed) => <option key={breed}>{breed}</option>)}</select>}</label>
          <label className="field"><span>Color</span><input value={form.color} onChange={(e) => set("color", e.target.value)} /></label>
          <label className="field"><span>Sex</span><select value={form.sex} onChange={(e) => changeSex(e.target.value as PetSex)}><option>Unknown</option><option>Male</option><option>Female</option></select></label>
          <label className="field"><span>Fixed status</span><select value={form.fixedStatus} onChange={(e) => set("fixedStatus", e.target.value as PetFixedStatus)}><option>Intact</option>{form.sex !== "Male" && <option>Spayed (Female)</option>}{form.sex !== "Female" && <option>Neutered (Male)</option>}</select></label>
          <label className="field"><span>Hair length</span><select value={form.hairLength} onChange={(e) => set("hairLength", e.target.value as PetHairLength)}><option>Long Coat</option><option>Short Coat</option><option>Wire Coat</option></select></label>
          <label className="field"><span>Birthday</span><input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} /></label>
          <label className="field"><span>Weight (lb)</span><input type="number" min="0" step="0.1" value={form.weightPounds ?? ""} onChange={(e) => set("weightPounds", e.target.value === "" ? null : Number(e.target.value))} /></label>
          <label className="field"><span>Size</span><select value={form.size} onChange={(e) => set("size", e.target.value as PetSize)}><option>Small</option><option>Medium</option><option>Large</option><option>Giant</option></select></label>
          <label className="field"><span>Microchip number</span><input value={form.microchipNumber} onChange={(e) => set("microchipNumber", e.target.value)} /></label>
          <label className="field"><span>Preferred groomer</span><input value={form.preferredGroomer} onChange={(e) => set("preferredGroomer", e.target.value)} /></label>
          <label className="field"><span>Preferred Shampoo</span><input value={form.preferredShampoo} onChange={(e) => set("preferredShampoo", e.target.value)} placeholder="Free-form shampoo preference" /></label>
          <label className="field"><span>Veterinarian</span><input value={form.veterinarianName} onChange={(e) => set("veterinarianName", e.target.value)} /></label>
          <label className="field"><span>Veterinarian phone</span><input value={form.veterinarianPhone} onChange={(e) => set("veterinarianPhone", e.target.value)} /></label>
          <label className="field"><span>Rabies expires</span><input type="date" value={form.vaccinationRabiesExpiresOn} onChange={(e) => set("vaccinationRabiesExpiresOn", e.target.value)} /></label>
          <label className="field"><span>Bordetella expires</span><input type="date" value={form.vaccinationBordetellaExpiresOn} onChange={(e) => set("vaccinationBordetellaExpiresOn", e.target.value)} /></label>
          <label className="field"><span>DHPP expires</span><input type="date" value={form.vaccinationDhppExpiresOn} onChange={(e) => set("vaccinationDhppExpiresOn", e.target.value)} /></label>
          <label className="field form-span-2"><span>Allergies</span><textarea rows={2} value={form.allergies} onChange={(e) => set("allergies", e.target.value)} /></label>
          <label className="field form-span-2"><span>Medical alerts</span><textarea rows={2} value={form.medicalAlerts} onChange={(e) => set("medicalAlerts", e.target.value)} /></label>
          <label className="field form-span-2"><span>Behavior notes</span><textarea rows={3} value={form.behaviorNotes} onChange={(e) => set("behaviorNotes", e.target.value)} /></label>
          <label className="field form-span-2"><span>Grooming notes</span><textarea rows={3} value={form.groomingNotes} onChange={(e) => set("groomingNotes", e.target.value)} /></label>
          <label className="check-field form-span-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /><span>Active pet profile</span></label>
        </div>
        <div className="modal-actions"><AppButton type="button" variant="secondary" onClick={onClose}>Cancel</AppButton><AppButton disabled={saving}>{saving ? "Saving..." : pet ? "Save changes" : "Add pet"}</AppButton></div>
      </form>
    </div>
  );
}
