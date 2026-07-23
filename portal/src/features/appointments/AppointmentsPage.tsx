import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Pencil, Plus, Search, XCircle } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import { AppointmentFormModal } from "./AppointmentFormModal";
import type { Appointment, AppointmentInput, AppointmentStatus } from "./appointmentTypes";
import { useAppointments } from "./useAppointments";

const workflowStatuses: AppointmentStatus[] = ["Scheduled", "Confirmed", "Checked In", "In Service", "Ready for Pickup", "Completed", "Cancelled", "No Show"];
const statusClass = (status: string) => status.toLowerCase().replaceAll(" ", "-");

export function AppointmentsPage() {
  const { appointments, loading, error, refresh, save, setStatus } = useAppointments();
  const { customers } = useCustomers();
  const { pets } = usePets();
  const [query, setQuery] = useState("");
  const [status, setStatusFilter] = useState<"All" | AppointmentStatus>("All");
  const [dateScope, setDateScope] = useState<"Upcoming" | "Today" | "All">("Upcoming");
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const petMap = useMemo(() => new Map(pets.map((item) => [item.id, item])), [pets]);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const customer = customerMap.get(appointment.customerId);
      const pet = petMap.get(appointment.petId);
      const haystack = [customer?.firstName, customer?.lastName, pet?.name, appointment.serviceName, appointment.assignedStaff].join(" ").toLowerCase();
      const matchesSearch = !needle || haystack.includes(needle);
      const matchesStatus = status === "All" || appointment.status === status;
      const matchesDate = dateScope === "All" || (dateScope === "Today" ? appointment.appointmentDate === today : appointment.appointmentDate >= today);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, customerMap, dateScope, petMap, query, status, today]);

  async function handleSave(input: AppointmentInput, id?: string) {
    await save(input, id);
    setNotice(id ? "Appointment updated successfully." : "Appointment booked successfully.");
    window.setTimeout(() => setNotice(""), 2800);
  }

  async function quickStatus(id: string, value: AppointmentStatus) {
    await setStatus(id, value);
    setNotice(`Appointment moved to ${value}.`);
    window.setTimeout(() => setNotice(""), 2400);
  }

  const todayCount = appointments.filter((item) => item.appointmentDate === today && !["Cancelled", "No Show"].includes(item.status)).length;
  const activeCount = appointments.filter((item) => ["Checked In", "In Service", "Ready for Pickup"].includes(item.status)).length;
  const completedToday = appointments.filter((item) => item.appointmentDate === today && item.status === "Completed").length;
  const cancelled = appointments.filter((item) => ["Cancelled", "No Show"].includes(item.status)).length;

  return <div className="appointments-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Shop calendar</span><h1>Appointments</h1><p>Book services, assign staff, track arrivals, and move pets through the day.</p></div><AppButton onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18}/> New appointment</AppButton></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid">
      <AppCard className="summary-card"><CalendarDays size={22}/><div><span>Today</span><strong>{todayCount}</strong></div></AppCard>
      <AppCard className="summary-card"><Clock3 size={22}/><div><span>In progress</span><strong>{activeCount}</strong></div></AppCard>
      <AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Completed today</span><strong>{completedToday}</strong></div></AppCard>
      <AppCard className="summary-card"><XCircle size={22}/><div><span>Cancelled / no show</span><strong>{cancelled}</strong></div></AppCard>
    </section>
    <AppCard className="customer-directory-card">
      <div className="directory-toolbar appointment-toolbar"><div className="module-search"><Search size={18}/><input aria-label="Search appointments" placeholder="Search pet, owner, service, or staff..." value={query} onChange={(e) => setQuery(e.target.value)}/></div><select aria-label="Filter appointment dates" value={dateScope} onChange={(e) => setDateScope(e.target.value as typeof dateScope)}><option>Upcoming</option><option>Today</option><option>All</option></select><select aria-label="Filter appointment status" value={status} onChange={(e) => setStatusFilter(e.target.value as typeof status)}><option>All</option>{workflowStatuses.map((item) => <option key={item}>{item}</option>)}</select><button className="link-button" onClick={() => void refresh()}>Refresh</button></div>
      {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading appointments...</p></div>}
      {!loading && error && <div className="module-state error-state"><p>{error}</p><AppButton onClick={() => void refresh()}>Try again</AppButton></div>}
      {!loading && !error && filtered.length === 0 && <div className="module-state"><div className="empty-icon">📅</div><h2>No appointments found</h2><p>Adjust the filters or book the shop’s next appointment.</p></div>}
      {!loading && !error && filtered.length > 0 && <div className="appointment-day-list">{filtered.map((appointment) => {
        const customer = customerMap.get(appointment.customerId);
        const pet = petMap.get(appointment.petId);
        return <article className="appointment-list-card" key={appointment.id}>
          <div className="appointment-date-box"><strong>{new Date(`${appointment.appointmentDate}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><span>{appointment.startTime}</span></div>
          <div className="appointment-pet-avatar">{pet?.species === "Cat" ? "🐈" : "🐕"}</div>
          <div className="appointment-main-copy"><div className="appointment-title-line"><strong>{pet?.name ?? "Pet unavailable"}</strong><span className={`appointment-status status-${statusClass(appointment.status)}`}>{appointment.status}</span></div><span>{appointment.serviceName} · {appointment.appointmentType}</span><small>{customer ? `${customer.firstName} ${customer.lastName}` : "Customer unavailable"}{appointment.assignedStaff ? ` · ${appointment.assignedStaff}` : ""}</small></div>
          <div className="appointment-time-range"><strong>{appointment.startTime}–{appointment.endTime}</strong><span>{appointment.priceEstimate === null ? "No estimate" : `$${appointment.priceEstimate.toFixed(2)}`}</span></div>
          <div className="appointment-row-actions"><select aria-label={`Update status for ${pet?.name ?? "appointment"}`} value={appointment.status} onChange={(e) => void quickStatus(appointment.id, e.target.value as AppointmentStatus)}>{workflowStatuses.map((item) => <option key={item}>{item}</option>)}</select><button className="icon-button" aria-label="Edit appointment" onClick={() => { setEditing(appointment); setModalOpen(true); }}><Pencil size={16}/></button></div>
        </article>;
      })}</div>}
    </AppCard>
    <AppointmentFormModal appointment={editing} customers={customers} pets={pets} open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave}/>
  </div>;
}
