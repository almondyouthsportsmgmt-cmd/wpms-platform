import { useMemo, useState, type FormEvent } from "react";
import { Hotel, Pencil, RefreshCw, Search, Sparkles, Wrench } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import type { Kennel, KennelInput, KennelStatus, KennelType } from "./kennelTypes";
import { useKennels } from "./useKennels";

const statuses: KennelStatus[] = ["Available", "Reserved", "Occupied", "Cleaning", "Maintenance"];
const types: KennelType[] = ["Standard", "Luxury", "Cat Condo", "Isolation", "Daycare"];
const blank: KennelInput = { name: "", zone: "", type: "Standard", capacity: 1, status: "Available", petId: "", customerId: "", checkInDate: "", checkOutDate: "", notes: "" };

export function KennelMapPage() {
  const { kennels, loading, error, refresh, save } = useKennels();
  const { customers } = useCustomers();
  const { pets } = usePets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Kennel | null>(null);
  const [form, setForm] = useState<KennelInput>(blank);
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const petMap = useMemo(() => new Map(pets.map((item) => [item.id, item])), [pets]);

  const filtered = kennels.filter((item) => {
    const pet = petMap.get(item.petId);
    const owner = customerMap.get(item.customerId);
    const haystack = [item.name, item.zone, item.type, item.status, pet?.name, owner?.firstName, owner?.lastName].join(" ").toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (status === "All" || item.status === status);
  });

  const available = kennels.filter((item) => item.status === "Available").length;
  const occupied = kennels.filter((item) => item.status === "Occupied").length;
  const reserved = kennels.filter((item) => item.status === "Reserved").length;
  const unavailable = kennels.filter((item) => ["Cleaning", "Maintenance"].includes(item.status)).length;

  function openEditor(item?: Kennel) {
    setEditing(item ?? null);
    setForm(item ? { name: item.name, zone: item.zone, type: item.type, capacity: item.capacity, status: item.status, petId: item.petId, customerId: item.customerId, checkInDate: item.checkInDate, checkOutDate: item.checkOutDate, notes: item.notes } : blank);
  }

  function update<K extends keyof KennelInput>(key: K, value: KennelInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.zone.trim()) return;
    await save(form, editing?.id);
    setEditing(null);
    setForm(blank);
    setNotice(editing ? "Kennel updated." : "Kennel added.");
    window.setTimeout(() => setNotice(""), 2200);
  }

  return <div className="kennel-page">
    <section className="page-toolbar">
      <div className="page-head"><span className="eyebrow">Boarding operations</span><h1>Kennel Map</h1><p>Track capacity, occupancy, cleaning, reservations, and maintenance at a glance.</p></div>
      <div className="toolbar-actions"><AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton><AppButton onClick={() => openEditor()}>+ Add kennel</AppButton></div>
    </section>
    {notice && <div className="success-notice">{notice}</div>}

    <section className="appointment-summary-grid">
      <AppCard className="summary-card"><Hotel size={22}/><div><span>Total spaces</span><strong>{kennels.length}</strong></div></AppCard>
      <AppCard className="summary-card"><span className="summary-emoji">✅</span><div><span>Available</span><strong>{available}</strong></div></AppCard>
      <AppCard className="summary-card"><span className="summary-emoji">🐾</span><div><span>Occupied / reserved</span><strong>{occupied + reserved}</strong></div></AppCard>
      <AppCard className="summary-card"><Wrench size={22}/><div><span>Cleaning / maintenance</span><strong>{unavailable}</strong></div></AppCard>
    </section>

    <section className="module-controls">
      <div className="module-search"><Search size={18}/><input aria-label="Search kennel map" placeholder="Search kennel, zone, pet, or owner..." value={query} onChange={(e) => setQuery(e.target.value)}/></div>
      <select aria-label="Filter kennel status" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select>
    </section>

    {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading kennel map...</p></div>}
    {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}
    {!loading && !error && <section className="kennel-zone-grid">{filtered.map((item) => {
      const pet = petMap.get(item.petId);
      const owner = customerMap.get(item.customerId);
      return <AppCard className={`kennel-tile kennel-${item.status.toLowerCase().replaceAll(" ", "-")}`} key={item.id}>
        <div className="kennel-tile-head"><div><span>{item.zone}</span><h3>{item.name}</h3></div><button className="icon-button" onClick={() => openEditor(item)} aria-label="Edit kennel"><Pencil size={16}/></button></div>
        <div className="kennel-type-row"><span>{item.type}</span><span>Capacity {item.capacity}</span></div>
        <div className="kennel-occupant">{pet ? <><div className="kennel-pet-icon">{pet.species === "Cat" ? "🐈" : "🐕"}</div><div><strong>{pet.name}</strong><span>{owner ? `${owner.firstName} ${owner.lastName}` : "Owner unavailable"}</span></div></> : <><Sparkles size={19}/><div><strong>{item.status}</strong><span>No pet assigned</span></div></>}</div>
        <div className="kennel-dates"><span>{item.checkInDate || "No check-in"}</span><span>{item.checkOutDate || "No check-out"}</span></div>
        {item.notes && <p className="kennel-notes">{item.notes}</p>}
        <span className={`status-chip status-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span>
      </AppCard>;
    })}</section>}

    {(editing || form !== blank) && (editing !== null || form.name !== "" || form.zone !== "") ? <div className="kennel-editor-wrap"><AppCard className="kennel-editor"><form onSubmit={submit}><div className="modal-head"><div><span className="eyebrow">Kennel setup</span><h2>{editing ? "Edit kennel" : "Add kennel"}</h2></div><button type="button" className="icon-button" onClick={() => { setEditing(null); setForm(blank); }}>×</button></div><div className="form-grid two-column">
      <label className="field"><span>Name</span><input value={form.name} onChange={(e) => update("name", e.target.value)} required/></label>
      <label className="field"><span>Zone</span><input value={form.zone} onChange={(e) => update("zone", e.target.value)} required/></label>
      <label className="field"><span>Type</span><select value={form.type} onChange={(e) => update("type", e.target.value as KennelType)}>{types.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="field"><span>Capacity</span><input type="number" min="1" value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))}/></label>
      <label className="field"><span>Status</span><select value={form.status} onChange={(e) => update("status", e.target.value as KennelStatus)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="field"><span>Customer</span><select value={form.customerId} onChange={(e) => update("customerId", e.target.value)}><option value="">None</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>
      <label className="field"><span>Pet</span><select value={form.petId} onChange={(e) => update("petId", e.target.value)}><option value="">None</option>{pets.filter((pet) => !form.customerId || pet.customerId === form.customerId).map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      <label className="field"><span>Check in</span><input type="date" value={form.checkInDate} onChange={(e) => update("checkInDate", e.target.value)}/></label>
      <label className="field"><span>Check out</span><input type="date" value={form.checkOutDate} onChange={(e) => update("checkOutDate", e.target.value)}/></label>
      <label className="field full"><span>Notes</span><textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)}/></label>
    </div><div className="modal-actions"><AppButton type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</AppButton><AppButton>Save kennel</AppButton></div></form></AppCard></div> : null}
  </div>;
}
