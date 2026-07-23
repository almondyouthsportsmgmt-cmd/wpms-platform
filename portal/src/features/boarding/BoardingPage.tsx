import { useMemo, useState } from "react";
import { CalendarCheck, Hotel, Pencil, RefreshCw, Search, UserCheck } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import { BoardingFormModal } from "./BoardingFormModal";
import type { BoardingStay } from "./boardingTypes";
import { useBoarding } from "./useBoarding";

const statusClass = (value: string) => value.toLowerCase().replaceAll(" ", "-");

export function BoardingPage() {
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { stays, loading, error, refresh, save, setStatus } = useBoarding();
  const [query, setQuery] = useState("");
  const [status, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BoardingStay | null>(null);
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const petMap = useMemo(() => new Map(pets.map((item) => [item.id, item])), [pets]);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = stays.filter((stay) => {
    const pet = petMap.get(stay.petId);
    const customer = customerMap.get(stay.customerId);
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [pet?.name, pet?.breed, customer?.firstName, customer?.lastName, stay.kennelName, stay.status].join(" ").toLowerCase().includes(needle);
    return matchesQuery && (status === "All" || stay.status === status);
  });

  const occupied = stays.filter((stay) => stay.checkInDate <= today && stay.checkOutDate >= today && !["Checked Out","Cancelled"].includes(stay.status)).length;
  const arrivals = stays.filter((stay) => stay.checkInDate === today && !["Checked Out","Cancelled"].includes(stay.status)).length;
  const departures = stays.filter((stay) => stay.checkOutDate === today && !["Checked Out","Cancelled"].includes(stay.status)).length;
  const photoUpdates = stays.filter((stay) => stay.photoUpdatesEnabled && !["Checked Out","Cancelled"].includes(stay.status)).length;

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function handleSave(input: Parameters<typeof save>[0], id?: string) {
    await save(input, id);
    show(id ? "Boarding stay updated." : "Boarding reservation created.");
  }

  async function advance(stay: BoardingStay) {
    const next = stay.status === "Reserved" ? "Checked In" : stay.status === "Checked In" ? "In Stay" : stay.status === "In Stay" ? "Ready for Checkout" : stay.status === "Ready for Checkout" ? "Checked Out" : stay.status;
    await setStatus(stay.id, next);
    show(`Boarding stay moved to ${next}.`);
  }

  return <div className="boarding-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Daily operations</span><h1>Boarding</h1><p>Manage reservations, care instructions, kennel assignments, and check-outs.</p></div><div className="toolbar-actions"><AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton><AppButton onClick={() => { setEditing(null); setModalOpen(true); }}>+ New stay</AppButton></div></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid">
      <AppCard className="summary-card"><Hotel size={22}/><div><span>Guests today</span><strong>{occupied}</strong></div></AppCard>
      <AppCard className="summary-card"><CalendarCheck size={22}/><div><span>Arrivals today</span><strong>{arrivals}</strong></div></AppCard>
      <AppCard className="summary-card"><UserCheck size={22}/><div><span>Departures today</span><strong>{departures}</strong></div></AppCard>
      <AppCard className="summary-card"><span className="summary-emoji">📷</span><div><span>Photo updates</span><strong>{photoUpdates}</strong></div></AppCard>
    </section>
    <section className="module-controls">
      <div className="module-search"><Search size={18}/><input aria-label="Search boarding stays" placeholder="Search pet, owner, kennel, or status..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      <select aria-label="Filter boarding status" value={status} onChange={(e) => setStatusFilter(e.target.value)}><option>All</option>{["Reserved","Checked In","In Stay","Ready for Checkout","Checked Out","Cancelled"].map(v => <option key={v}>{v}</option>)}</select>
    </section>
    {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading boarding stays...</p></div>}
    {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}
    {!loading && !error && filtered.length === 0 && <AppCard className="empty-state"><div className="empty-icon">🏨</div><h2>No boarding stays found</h2><p>Create the first reservation or adjust your search and filters.</p></AppCard>}
    {!loading && !error && filtered.length > 0 && <section className="boarding-grid">{filtered.map((stay) => {
      const pet = petMap.get(stay.petId);
      const customer = customerMap.get(stay.customerId);
      const nights = Math.max(1, Math.ceil((new Date(stay.checkOutDate).getTime() - new Date(stay.checkInDate).getTime()) / 86400000));
      const estimate = nights * stay.dailyRate;
      return <AppCard className="boarding-card-item" key={stay.id}>
        <div className="boarding-card-head"><div className="boarding-pet"><div className="boarding-avatar">{pet?.species === "Cat" ? "🐈" : "🐕"}</div><div><h3>{pet?.name ?? "Pet"}</h3><span>{pet?.breed || "Breed unavailable"} · {customer ? `${customer.firstName} ${customer.lastName}` : "Owner unavailable"}</span></div></div><button className="icon-button" onClick={() => { setEditing(stay); setModalOpen(true); }} aria-label="Edit boarding stay"><Pencil size={17}/></button></div>
        <div className="boarding-stay-meta"><div><span>Check in</span><strong>{stay.checkInDate} · {stay.checkInTime}</strong></div><div><span>Check out</span><strong>{stay.checkOutDate} · {stay.checkOutTime}</strong></div><div><span>Kennel</span><strong>{stay.kennelName || "Unassigned"}</strong></div><div><span>Estimate</span><strong>${estimate.toFixed(2)}</strong></div></div>
        <div className="boarding-care-list"><span>🍽 {stay.feedingFrequency}</span>{stay.medicationInstructions && <span>💊 Medication</span>}{stay.photoUpdatesEnabled && <span>📷 Photo updates</span>}{stay.veterinarianReleaseConfirmed && <span>✅ Vet release</span>}</div>
        <div className="boarding-card-footer"><span className={`status-chip status-${statusClass(stay.status)}`}>{stay.status}</span>{!["Checked Out","Cancelled"].includes(stay.status) && <AppButton variant="secondary" onClick={() => void advance(stay)}>Advance status</AppButton>}</div>
      </AppCard>;
    })}</section>}
    <BoardingFormModal open={modalOpen} customers={customers} pets={pets} stay={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />
  </div>;
}
