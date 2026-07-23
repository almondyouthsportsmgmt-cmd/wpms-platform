import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BrainCircuit, CalendarClock, CheckCircle2, Clock3, Sparkles, TriangleAlert } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import { useCustomers } from "../customers/useCustomers";
import { useEmployees } from "../employees/useEmployees";
import { usePets } from "../pets/usePets";
import { generateSchedulingSuggestions, listSavedSchedulingPlans, saveSchedulingPlan } from "./aiSchedulingService";
import type { SchedulingRequest, SchedulingService, SchedulingSuggestion } from "./aiSchedulingTypes";

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const serviceDurations: Record<SchedulingService, number> = {
  "Full Groom": 120,
  "Bath & Brush": 75,
  "Nail Trim": 30,
  "Boarding Check-In": 30,
  Other: 60,
};

const initialRequest: SchedulingRequest = {
  customerId: "",
  petId: "",
  service: "Full Groom",
  preferredDate: tomorrow,
  preferredStaff: "",
  earliestTime: "08:00",
  latestTime: "17:30",
  durationMinutes: 120,
};

export function AiSchedulingPage() {
  const { customers } = useCustomers();
  const { pets } = usePets();
  const { employees } = useEmployees();
  const [request, setRequest] = useState<SchedulingRequest>(initialRequest);
  const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => setSavedCount(listSavedSchedulingPlans().length), []);

  const filteredPets = useMemo(
    () => pets.filter((pet) => !request.customerId || pet.customerId === request.customerId),
    [pets, request.customerId],
  );

  const activeStaff = employees.filter((employee) => employee.status === "Active");
  const selectedSuggestion = suggestions.find((item) => item.id === selectedId) ?? null;

  function update<K extends keyof SchedulingRequest>(key: K, value: SchedulingRequest[K]) {
    setRequest((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!request.customerId || !request.petId) {
      setError("Select a customer and pet before generating suggestions.");
      return;
    }
    setLoading(true);
    try {
      const next = await generateSchedulingSuggestions(request);
      setSuggestions(next);
      setSelectedId(next[0]?.id ?? "");
      if (next.length === 0) setError("No open slots were found in the selected time window.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate scheduling suggestions.");
    } finally {
      setLoading(false);
    }
  }

  function savePlan() {
    if (!selectedSuggestion) return;
    saveSchedulingPlan(request, selectedSuggestion);
    setSavedCount(listSavedSchedulingPlans().length);
    setNotice("Scheduling plan saved for staff review.");
    window.setTimeout(() => setNotice(""), 2400);
  }

  return (
    <div className="ai-scheduling-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Smart operations</span>
          <h1>AI Scheduling Assistant</h1>
          <p>Find the strongest open appointment times using staff availability, pet preferences, duration, and conflicts.</p>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}
      {error && <div className="form-error">{error}</div>}

      <section className="appointment-summary-grid">
        <AppCard className="summary-card"><Sparkles size={22}/><div><span>Suggestions generated</span><strong>{suggestions.length}</strong></div></AppCard>
        <AppCard className="summary-card"><CalendarClock size={22}/><div><span>Saved plans</span><strong>{savedCount}</strong></div></AppCard>
        <AppCard className="summary-card"><BrainCircuit size={22}/><div><span>Assistant mode</span><strong>Review</strong></div></AppCard>
        <AppCard className="summary-card"><CheckCircle2 size={22}/><div><span>Automatic booking</span><strong>Off</strong></div></AppCard>
      </section>

      <section className="ai-scheduling-layout">
        <AppCard className="ai-scheduling-form-card">
          <div className="card-heading">
            <div><span className="eyebrow">Request details</span><h2>Find the best appointment</h2></div>
          </div>
          <form onSubmit={submit} className="form-grid two-column">
            <label className="field"><span>Customer</span><select value={request.customerId} onChange={(event) => { update("customerId", event.target.value); update("petId", ""); }} required><option value="">Select customer</option>{customers.filter((item) => item.isActive).map((customer) => <option key={customer.id} value={customer.id}>{customer.firstName} {customer.lastName}</option>)}</select></label>
            <label className="field"><span>Pet</span><select value={request.petId} onChange={(event) => update("petId", event.target.value)} required><option value="">Select pet</option>{filteredPets.filter((item) => item.isActive).map((pet) => <option key={pet.id} value={pet.id}>{pet.name} · {pet.breed}</option>)}</select></label>
            <label className="field"><span>Service</span><select value={request.service} onChange={(event) => { const service = event.target.value as SchedulingService; update("service", service); update("durationMinutes", serviceDurations[service]); }}>{Object.keys(serviceDurations).map((service) => <option key={service}>{service}</option>)}</select></label>
            <label className="field"><span>Preferred date</span><input type="date" value={request.preferredDate} onChange={(event) => update("preferredDate", event.target.value)} required /></label>
            <label className="field"><span>Preferred staff</span><select value={request.preferredStaff} onChange={(event) => update("preferredStaff", event.target.value)}><option value="">Best available</option>{activeStaff.map((employee) => <option key={employee.id}>{employee.firstName} {employee.lastName}</option>)}</select></label>
            <label className="field"><span>Duration</span><select value={request.durationMinutes} onChange={(event) => update("durationMinutes", Number(event.target.value))}>{[30,45,60,75,90,120,150,180].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
            <label className="field"><span>Earliest time</span><input type="time" value={request.earliestTime} onChange={(event) => update("earliestTime", event.target.value)} /></label>
            <label className="field"><span>Latest finish</span><input type="time" value={request.latestTime} onChange={(event) => update("latestTime", event.target.value)} /></label>
            <div className="full ai-scheduling-submit"><AppButton disabled={loading}>{loading ? "Analyzing schedule..." : "Generate suggestions"}</AppButton></div>
          </form>
          <div className="ai-scheduling-guardrail"><TriangleAlert size={18}/><p>The assistant recommends times only. Staff must review and create the final appointment.</p></div>
        </AppCard>

        <div className="ai-suggestion-column">
          <AppCard className="ai-suggestion-panel">
            <div className="card-heading"><div><span className="eyebrow">Ranked results</span><h2>Recommended openings</h2></div></div>
            {suggestions.length === 0 ? <div className="ai-scheduling-empty"><span>🗓️</span><h3>No suggestions yet</h3><p>Complete the request and let the assistant evaluate the schedule.</p></div> : <div className="ai-suggestion-list">{suggestions.map((suggestion, index) => <button type="button" key={suggestion.id} className={`ai-suggestion-item ${selectedId === suggestion.id ? "is-selected" : ""}`} onClick={() => setSelectedId(suggestion.id)}><div className="ai-suggestion-rank">#{index + 1}</div><div className="ai-suggestion-main"><strong>{suggestion.startTime}–{suggestion.endTime}</strong><span>{suggestion.staffName}</span></div><div className="ai-score">{suggestion.score}</div></button>)}</div>}
          </AppCard>

          {selectedSuggestion && <AppCard className="ai-suggestion-detail"><div className="ai-detail-head"><div><span className="eyebrow">Selected plan</span><h2>{selectedSuggestion.startTime} with {selectedSuggestion.staffName}</h2></div><Clock3 size={22}/></div><div className="ai-reason-list">{selectedSuggestion.reasons.map((reason) => <div key={reason}><CheckCircle2 size={16}/><span>{reason}</span></div>)}{selectedSuggestion.conflicts.map((conflict) => <div className="warning" key={conflict}><TriangleAlert size={16}/><span>{conflict}</span></div>)}</div><AppButton onClick={savePlan}>Save plan for review</AppButton></AppCard>}
        </div>
      </section>
    </div>
  );
}
