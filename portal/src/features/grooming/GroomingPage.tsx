import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Play, RefreshCw, Scissors } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useAppointments } from "../appointments/useAppointments";
import type { Appointment } from "../appointments/appointmentTypes";
import { useCustomers } from "../customers/useCustomers";
import { usePets } from "../pets/usePets";
import type { GroomingSession, GroomingSessionInput, GroomingStage } from "./groomingTypes";
import { useGrooming } from "./useGrooming";

const stages: GroomingStage[] = ["Checked In", "Bath", "Drying", "Haircut", "Nails", "Finishing", "Ready for Pickup", "Picked Up"];
const stageClass = (value: string) => value.toLowerCase().replaceAll(" ", "-");

function blankSession(appointment: Appointment): GroomingSessionInput {
  const now = new Date().toISOString();
  return { appointmentId: appointment.id, petId: appointment.petId, customerId: appointment.customerId, groomer: appointment.assignedStaff, stage: "Checked In", checkInAt: now, startedAt: null, readyAt: null, pickedUpAt: null, bathComplete: false, dryingComplete: false, haircutComplete: false, nailsComplete: false, earsComplete: false, teethComplete: false, finalNotes: "" };
}

export function GroomingPage() {
  const { appointments, setStatus } = useAppointments();
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { sessions, loading, error, refresh, save } = useGrooming();
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const customerMap = useMemo(() => new Map(customers.map((item) => [item.id, item])), [customers]);
  const petMap = useMemo(() => new Map(pets.map((item) => [item.id, item])), [pets]);
  const sessionMap = useMemo(() => new Map(sessions.map((item) => [item.appointmentId, item])), [sessions]);
  const groomingAppointments = appointments.filter((item) => item.appointmentDate === today && ["Grooming", "Bath", "Nails"].includes(item.appointmentType) && !["Cancelled", "No Show", "Completed"].includes(item.status));
  const filtered = groomingAppointments.filter((appointment) => {
    const pet = petMap.get(appointment.petId); const customer = customerMap.get(appointment.customerId); const needle = query.trim().toLowerCase();
    return !needle || [pet?.name, customer?.firstName, customer?.lastName, appointment.serviceName, appointment.assignedStaff].join(" ").toLowerCase().includes(needle);
  });

  async function start(appointment: Appointment) {
    const existing = sessionMap.get(appointment.id); if (existing) return;
    await save(blankSession(appointment)); await setStatus(appointment.id, "In Service"); show("Pet added to grooming workflow.");
  }
  function show(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2200); }
  async function move(session: GroomingSession, stage: GroomingStage) {
    const now = new Date().toISOString();
    const input: GroomingSessionInput = { ...session, stage, startedAt: session.startedAt ?? (stage !== "Checked In" ? now : null), readyAt: stage === "Ready for Pickup" ? now : session.readyAt, pickedUpAt: stage === "Picked Up" ? now : session.pickedUpAt };
    await save(input, session.id);
    if (stage === "Ready for Pickup") await setStatus(session.appointmentId, "Ready for Pickup");
    if (stage === "Picked Up") await setStatus(session.appointmentId, "Completed");
    show(`Moved to ${stage}.`);
  }
  async function toggle(session: GroomingSession, key: keyof Pick<GroomingSession,"bathComplete"|"dryingComplete"|"haircutComplete"|"nailsComplete"|"earsComplete"|"teethComplete">) { await save({ ...session, [key]: !session[key] }, session.id); }

  const inService = sessions.filter((item) => !["Ready for Pickup", "Picked Up"].includes(item.stage)).length;
  const ready = sessions.filter((item) => item.stage === "Ready for Pickup").length;
  const completed = sessions.filter((item) => item.stage === "Picked Up").length;

  return <div className="grooming-page">
    <section className="page-toolbar"><div className="page-head"><span className="eyebrow">Live production board</span><h1>Grooming Workflow</h1><p>Move each pet from check-in through service and pickup.</p></div><AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton></section>
    {notice && <div className="success-notice">{notice}</div>}
    <section className="appointment-summary-grid"><AppCard className="summary-card"><Clock3 size={22}/><div><span>Waiting / active</span><strong>{inService}</strong></div></AppCard><AppCard className="summary-card"><Scissors size={22}/><div><span>Today’s grooming</span><strong>{groomingAppointments.length}</strong></div></AppCard><AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Ready for pickup</span><strong>{ready}</strong></div></AppCard><AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Picked up</span><strong>{completed}</strong></div></AppCard></section>
    <div className="module-search grooming-search"><input aria-label="Search grooming board" placeholder="Search pet, owner, service, or groomer..." value={query} onChange={(event) => setQuery(event.target.value)}/></div>
    {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading grooming workflow...</p></div>}
    {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}
    {!loading && !error && <section className="grooming-board">{stages.map((stage) => <div className="grooming-column" key={stage}><div className={`grooming-column-head stage-${stageClass(stage)}`}><strong>{stage}</strong><span>{sessions.filter((item) => item.stage === stage).length}</span></div><div className="grooming-column-body">{stage === "Checked In" && filtered.filter((appointment) => !sessionMap.has(appointment.id)).map((appointment) => { const pet = petMap.get(appointment.petId); const customer = customerMap.get(appointment.customerId); return <AppCard className="grooming-ticket" key={appointment.id}><div className="grooming-pet-line"><span className="grooming-avatar">{pet?.species === "Cat" ? "🐈" : "🐕"}</span><div><strong>{pet?.name ?? "Pet"}</strong><small>{customer ? `${customer.firstName} ${customer.lastName}` : "Owner unavailable"}</small></div></div><p>{appointment.serviceName}</p><small>{appointment.startTime} · {appointment.assignedStaff || "Unassigned"}</small><AppButton onClick={() => void start(appointment)}><Play size={15}/> Start</AppButton></AppCard>; })}{sessions.filter((item) => item.stage === stage).map((session) => { const pet = petMap.get(session.petId); const customer = customerMap.get(session.customerId); const appointment = appointments.find((item) => item.id === session.appointmentId); return <AppCard className="grooming-ticket" key={session.id}><div className="grooming-pet-line"><span className="grooming-avatar">{pet?.species === "Cat" ? "🐈" : "🐕"}</span><div><strong>{pet?.name ?? "Pet"}</strong><small>{customer ? `${customer.firstName} ${customer.lastName}` : "Owner unavailable"}</small></div></div><p>{appointment?.serviceName ?? "Grooming service"}</p><small>{session.groomer || "Unassigned groomer"}</small><div className="grooming-checklist">{[["bathComplete","Bath"],["dryingComplete","Dry"],["haircutComplete","Cut"],["nailsComplete","Nails"],["earsComplete","Ears"],["teethComplete","Teeth"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(session[key as keyof GroomingSession])} onChange={() => void toggle(session, key as keyof Pick<GroomingSession,"bathComplete"|"dryingComplete"|"haircutComplete"|"nailsComplete"|"earsComplete"|"teethComplete">)}/><span>{label}</span></label>)}</div>{stage !== "Picked Up" && <select aria-label={`Move ${pet?.name ?? "pet"} to stage`} value={session.stage} onChange={(event) => void move(session, event.target.value as GroomingStage)}>{stages.map((item) => <option key={item}>{item}</option>)}</select>}</AppCard>; })}</div></div>)}</section>}
  </div>;
}
