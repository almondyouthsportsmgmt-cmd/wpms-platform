import { useMemo, useState, type FormEvent } from "react";
import { Camera, ClipboardCheck, Plus, RefreshCw, Search } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { usePets } from "../pets/usePets";
import { usePetTimeline } from "./usePetTimeline";
import type { PetTimelineEventInput, TimelineEventType } from "./petTimelineTypes";

const services = ["Bath", "Haircut", "Nails", "Ears", "Teeth", "De-shed", "Finishing"];

export function PetTimelinePage() {
  const { pets } = usePets();
  const { events, loading, error, refresh, add } = usePetTimeline();
  const [query, setQuery] = useState("");
  const [petId, setPetId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<PetTimelineEventInput>({
    petId: "",
    eventType: "Grooming",
    title: "",
    description: "",
    eventDate: new Date().toISOString().slice(0, 10),
    beforePhotoUrl: "",
    afterPhotoUrl: "",
    reportCard: {
      coatCondition: "",
      behavior: "",
      servicesCompleted: [],
      staffNotes: "",
    },
  });

  const petMap = useMemo(() => new Map(pets.map((pet) => [pet.id, pet])), [pets]);
  const filtered = events.filter((event) => {
    const pet = petMap.get(event.petId);
    const needle = query.toLowerCase();
    return (!petId || event.petId === petId) && [pet?.name, pet?.breed, event.title, event.description, event.eventType].join(" ").toLowerCase().includes(needle);
  });

  function toggleService(service: string) {
    setForm((current) => ({
      ...current,
      reportCard: current.reportCard ? {
        ...current.reportCard,
        servicesCompleted: current.reportCard.servicesCompleted.includes(service)
          ? current.reportCard.servicesCompleted.filter((item) => item !== service)
          : [...current.reportCard.servicesCompleted, service],
      } : null,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await add(form);
    setNotice("Timeline event added.");
    window.setTimeout(() => setNotice(""), 2200);
    setShowForm(false);
  }

  return <div className="pet-timeline-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Pet history</span><h1>Photo Timeline & Report Cards</h1><p>Keep grooming, boarding, health, notes, and before-and-after photos in one chronological view.</p></div><div className="toolbar-actions"><AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton><AppButton onClick={() => setShowForm((v) => !v)}><Plus size={17}/> Add event</AppButton></div></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid"><AppCard className="summary-card"><Camera size={22}/><div><span>Timeline events</span><strong>{events.length}</strong></div></AppCard><AppCard className="summary-card"><ClipboardCheck size={22}/><div><span>Report cards</span><strong>{events.filter((e) => e.reportCard).length}</strong></div></AppCard></section>
    {showForm && <AppCard className="timeline-form-card"><form onSubmit={submit}><div className="form-grid two-column"><label className="field"><span>Pet</span><select value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })} required><option value="">Select pet</option>{pets.filter((pet) => pet.isActive).map((pet) => <option key={pet.id} value={pet.id}>{pet.name} · {pet.breed}</option>)}</select></label><label className="field"><span>Event type</span><select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value as TimelineEventType })}>{["Grooming","Boarding","Health","Photo","Note"].map((v) => <option key={v}>{v}</option>)}</select></label><label className="field"><span>Title</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label><label className="field"><span>Date</span><input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required /></label><label className="field full"><span>Description</span><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="field"><span>Before photo URL</span><input value={form.beforePhotoUrl} onChange={(e) => setForm({ ...form, beforePhotoUrl: e.target.value })} /></label><label className="field"><span>After photo URL</span><input value={form.afterPhotoUrl} onChange={(e) => setForm({ ...form, afterPhotoUrl: e.target.value })} /></label><label className="field"><span>Coat condition</span><input value={form.reportCard?.coatCondition ?? ""} onChange={(e) => setForm({ ...form, reportCard: { ...form.reportCard!, coatCondition: e.target.value } })} /></label><label className="field"><span>Behavior</span><input value={form.reportCard?.behavior ?? ""} onChange={(e) => setForm({ ...form, reportCard: { ...form.reportCard!, behavior: e.target.value } })} /></label><div className="field full"><span>Services completed</span><div className="timeline-service-grid">{services.map((service) => <label key={service}><input type="checkbox" checked={form.reportCard?.servicesCompleted.includes(service) ?? false} onChange={() => toggleService(service)} /> {service}</label>)}</div></div><label className="field full"><span>Staff notes</span><textarea rows={3} value={form.reportCard?.staffNotes ?? ""} onChange={(e) => setForm({ ...form, reportCard: { ...form.reportCard!, staffNotes: e.target.value } })} /></label></div><div className="modal-actions"><AppButton type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</AppButton><AppButton>Save event</AppButton></div></form></AppCard>}
    <section className="module-controls"><div className="module-search"><Search size={18}/><input placeholder="Search pet, breed, title, or notes..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><select value={petId} onChange={(e) => setPetId(e.target.value)}><option value="">All pets</option>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></section>
    {loading && <div className="module-state"><div className="paw-loader">🐾</div></div>}
    {!loading && error && <div className="form-error">{error}</div>}
    {!loading && !error && <section className="timeline-list">{filtered.map((event) => { const pet = petMap.get(event.petId); return <AppCard className="timeline-card" key={event.id}><div className="timeline-marker">🐾</div><div className="timeline-card-content"><div className="timeline-card-head"><div><span className="eyebrow">{event.eventType}</span><h3>{event.title}</h3><p>{pet?.name ?? "Pet"} · {event.eventDate}</p></div></div><p>{event.description}</p>{(event.beforePhotoUrl || event.afterPhotoUrl) && <div className="timeline-photo-grid">{event.beforePhotoUrl && <figure><img src={event.beforePhotoUrl} alt="Before"/><figcaption>Before</figcaption></figure>}{event.afterPhotoUrl && <figure><img src={event.afterPhotoUrl} alt="After"/><figcaption>After</figcaption></figure>}</div>}{event.reportCard && <div className="report-card-panel"><h4>Digital Report Card</h4><div className="report-card-grid"><div><span>Coat condition</span><strong>{event.reportCard.coatCondition || "Not recorded"}</strong></div><div><span>Behavior</span><strong>{event.reportCard.behavior || "Not recorded"}</strong></div></div><div className="permission-preview">{event.reportCard.servicesCompleted.map((service) => <span key={service}>{service}</span>)}</div>{event.reportCard.staffNotes && <p>{event.reportCard.staffNotes}</p>}</div>}</div></AppCard>; })}</section>}
  </div>;
}
