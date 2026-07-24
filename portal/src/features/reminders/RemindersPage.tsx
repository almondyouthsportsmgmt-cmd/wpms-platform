import { useMemo, useState, type FormEvent } from "react";
import { BellRing, CalendarClock, CheckCircle2, RefreshCw, Search, Send, XCircle } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import type { AutomatedReminder, ReminderInput, ReminderType } from "./reminderTypes";
import { useReminders } from "./useReminders";

const types: ReminderType[] = [
  "Appointment Confirmation",
  "Appointment Reminder",
  "Boarding Check-In",
  "Boarding Check-Out",
  "Vaccination Expiration",
  "Payment Follow-Up",
  "Membership Renewal",
  "We Miss You",
];

const tomorrowAtNine = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date.toISOString().slice(0, 16);
};

const blank = (): ReminderInput => ({
  customerId: "",
  petId: null,
  type: "Appointment Reminder",
  channel: "SMS",
  subject: "",
  message: "",
  scheduledFor: tomorrowAtNine(),
  status: "Scheduled",
});

export function RemindersPage() {
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { reminders, loading, error, refresh, save, setStatus } = useReminders();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AutomatedReminder | null>(null);
  const [form, setForm] = useState<ReminderInput>(blank());
  const [notice, setNotice] = useState("");

  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const petMap = useMemo(() => new Map(pets.map((item) => [item.id, item])), [pets]);
  const filteredPets = pets.filter((pet) => !form.customerId || pet.customerId === form.customerId);

  const filtered = reminders.filter((reminder) => {
    const customer = customerMap.get(reminder.customerId);
    const pet = reminder.petId ? petMap.get(reminder.petId) : null;
    const haystack = [customer?.firstName, customer?.lastName, pet?.name, reminder.type, reminder.subject, reminder.status]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase())
      && (statusFilter === "All" || reminder.status === statusFilter);
  });

  const scheduled = reminders.filter((item) => item.status === "Scheduled").length;
  const sent = reminders.filter((item) => item.status === "Sent").length;
  const failed = reminders.filter((item) => item.status === "Failed").length;
  const dueToday = reminders.filter((item) => item.scheduledFor.slice(0, 10) === new Date().toISOString().slice(0, 10) && item.status === "Scheduled").length;

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function begin(reminder?: AutomatedReminder) {
    setEditing(reminder ?? null);
    setForm(reminder ? {
      customerId: reminder.customerId,
      petId: reminder.petId,
      type: reminder.type,
      channel: reminder.channel,
      subject: reminder.subject,
      message: reminder.message,
      scheduledFor: reminder.scheduledFor.slice(0, 16),
      status: reminder.status,
    } : blank());
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.customerId || !form.message.trim() || !form.scheduledFor) return;
    await save({ ...form, scheduledFor: new Date(form.scheduledFor).toISOString() }, editing?.id);
    setOpen(false);
    show(editing ? "Reminder updated." : "Reminder scheduled.");
  }

  return (
    <div className="reminders-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Client engagement</span>
          <h1>Automated Reminders</h1>
          <p>Schedule appointment, boarding, vaccination, payment, and membership follow-ups.</p>
        </div>
        <div className="toolbar-actions">
          <AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/>Refresh</AppButton>
          <AppButton onClick={() => begin()}>+ New reminder</AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      <section className="appointment-summary-grid">
        <AppCard className="summary-card"><CalendarClock size={22}/><div><span>Scheduled</span><strong>{scheduled}</strong></div></AppCard>
        <AppCard className="summary-card"><BellRing size={22}/><div><span>Due today</span><strong>{dueToday}</strong></div></AppCard>
        <AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Sent</span><strong>{sent}</strong></div></AppCard>
        <AppCard className="summary-card"><XCircle size={22}/><div><span>Failed</span><strong>{failed}</strong></div></AppCard>
      </section>

      <section className="module-controls">
        <div className="module-search"><Search size={18}/><input placeholder="Search reminders..." value={query} onChange={(event) => setQuery(event.target.value)}/></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option>All</option>{["Scheduled","Sent","Skipped","Failed","Cancelled"].map((value) => <option key={value}>{value}</option>)}
        </select>
      </section>

      {loading ? <div className="module-state"><div className="paw-loader">🐾</div></div> : error ? <div className="form-error">{error}</div> : (
        <section className="reminder-grid">
          {filtered.map((reminder) => {
            const customer = customerMap.get(reminder.customerId);
            const pet = reminder.petId ? petMap.get(reminder.petId) : null;
            return <AppCard className="reminder-card" key={reminder.id}>
              <div className="reminder-card-head">
                <div>
                  <span className={`status-chip status-${reminder.status.toLowerCase()}`}>{reminder.status}</span>
                  <h3>{reminder.type}</h3>
                  <p>{customer ? `${customer.firstName} ${customer.lastName}` : "Customer"}{pet ? ` · ${pet.name}` : ""}</p>
                </div>
                <button className="icon-button" onClick={() => begin(reminder)}>✏️</button>
              </div>
              <div className="reminder-message"><strong>{reminder.subject || "No subject"}</strong><p>{reminder.message}</p></div>
              <dl className="reminder-meta">
                <div><dt>Channel</dt><dd>{reminder.channel}</dd></div>
                <div><dt>Scheduled</dt><dd>{new Intl.DateTimeFormat("en-US", { dateStyle:"medium", timeStyle:"short" }).format(new Date(reminder.scheduledFor))}</dd></div>
              </dl>
              <div className="reminder-actions">
                {reminder.status === "Scheduled" && <><AppButton variant="secondary" onClick={() => void setStatus(reminder.id, "Cancelled")}>Cancel</AppButton><AppButton onClick={() => void setStatus(reminder.id, "Sent")}><Send size={16}/>Send now</AppButton></>}
              </div>
            </AppCard>;
          })}
        </section>
      )}

      {open && <div className="modal-layer">
        <button className="modal-backdrop" onClick={() => setOpen(false)} aria-label="Close reminder form"/>
        <form className="module-modal reminder-modal" onSubmit={submit}>
          <div className="modal-head"><div><span className="eyebrow">Automation</span><h2>{editing ? "Edit reminder" : "Schedule reminder"}</h2></div></div>
          <div className="form-grid two-column">
            <label className="field"><span>Customer</span><select required value={form.customerId} onChange={(event) => setForm({ ...form, customerId:event.target.value, petId:null })}><option value="">Select customer</option>{customers.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>)}</select></label>
            <label className="field"><span>Pet (optional)</span><select value={form.petId ?? ""} onChange={(event) => setForm({ ...form, petId:event.target.value || null })}><option value="">No pet selected</option>{filteredPets.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="field"><span>Reminder type</span><select value={form.type} onChange={(event) => setForm({ ...form, type:event.target.value as ReminderType })}>{types.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="field"><span>Channel</span><select value={form.channel} onChange={(event) => setForm({ ...form, channel:event.target.value as ReminderInput["channel"] })}><option>SMS</option><option>Email</option><option>Both</option></select></label>
            <label className="field full"><span>Subject</span><input value={form.subject} onChange={(event) => setForm({ ...form, subject:event.target.value })}/></label>
            <label className="field full"><span>Message</span><textarea required rows={5} value={form.message} onChange={(event) => setForm({ ...form, message:event.target.value })}/></label>
            <label className="field"><span>Schedule date and time</span><input required type="datetime-local" value={form.scheduledFor} onChange={(event) => setForm({ ...form, scheduledFor:event.target.value })}/></label>
          </div>
          <div className="modal-actions"><AppButton type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</AppButton><AppButton>Save reminder</AppButton></div>
        </form>
      </div>}
    </div>
  );
}
