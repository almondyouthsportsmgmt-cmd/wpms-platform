import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { GroomingSession, GroomingSessionInput, GroomingStage } from "./groomingTypes";

const STORAGE_KEY = "wpms-demo-grooming-sessions";

function readDemo(): GroomingSession[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as GroomingSession[]) : [];
}
function writeDemo(items: GroomingSession[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function fromRow(row: Record<string, unknown>): GroomingSession {
  return {
    id: String(row.id), appointmentId: String(row.appointment_id), petId: String(row.pet_id), customerId: String(row.customer_id),
    groomer: String(row.groomer ?? ""), stage: String(row.stage ?? "Checked In") as GroomingStage,
    checkInAt: row.check_in_at ? String(row.check_in_at) : null, startedAt: row.started_at ? String(row.started_at) : null,
    readyAt: row.ready_at ? String(row.ready_at) : null, pickedUpAt: row.picked_up_at ? String(row.picked_up_at) : null,
    bathComplete: Boolean(row.bath_complete), dryingComplete: Boolean(row.drying_complete), haircutComplete: Boolean(row.haircut_complete),
    nailsComplete: Boolean(row.nails_complete), earsComplete: Boolean(row.ears_complete), teethComplete: Boolean(row.teeth_complete),
    finalNotes: String(row.final_notes ?? ""), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}
function toRow(input: GroomingSessionInput) {
  return {
    appointment_id: input.appointmentId, pet_id: input.petId, customer_id: input.customerId, groomer: input.groomer || null,
    stage: input.stage, check_in_at: input.checkInAt, started_at: input.startedAt, ready_at: input.readyAt, picked_up_at: input.pickedUpAt,
    bath_complete: input.bathComplete, drying_complete: input.dryingComplete, haircut_complete: input.haircutComplete,
    nails_complete: input.nailsComplete, ears_complete: input.earsComplete, teeth_complete: input.teethComplete,
    final_notes: input.finalNotes || null,
  };
}
export async function listGroomingSessions(): Promise<GroomingSession[]> {
  if (!isSupabaseConfigured) return readDemo();
  const { data, error } = await supabase.from("grooming_sessions").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row));
}
export async function createGroomingSession(input: GroomingSessionInput): Promise<GroomingSession> {
  if (!isSupabaseConfigured) {
    const timestamp = new Date().toISOString();
    const item: GroomingSession = { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
    writeDemo([...readDemo(), item]); return item;
  }
  const { data, error } = await supabase.from("grooming_sessions").insert(toRow(input)).select("*").single();
  if (error) throw error; return fromRow(data);
}
export async function updateGroomingSession(id: string, input: GroomingSessionInput): Promise<GroomingSession> {
  if (!isSupabaseConfigured) {
    const items = readDemo(); const current = items.find((item) => item.id === id); if (!current) throw new Error("Grooming session not found.");
    const updated = { ...current, ...input, updatedAt: new Date().toISOString() }; writeDemo(items.map((item) => item.id === id ? updated : item)); return updated;
  }
  const { data, error } = await supabase.from("grooming_sessions").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error; return fromRow(data);
}
