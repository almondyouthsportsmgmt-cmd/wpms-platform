import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { PetTimelineEvent, PetTimelineEventInput } from "./petTimelineTypes";

const KEY = "wpms-demo-pet-timeline";

const seed: PetTimelineEvent[] = [
  {
    id: "demo-timeline-1",
    petId: "demo-pet-1",
    eventType: "Grooming",
    title: "Full Groom Completed",
    description: "Bath, haircut, nails, ears, and finishing spray completed.",
    eventDate: new Date().toISOString().slice(0, 10),
    beforePhotoUrl: "",
    afterPhotoUrl: "",
    reportCard: {
      coatCondition: "Healthy with light matting behind ears",
      behavior: "Friendly and calm",
      servicesCompleted: ["Bath", "Haircut", "Nails", "Ears"],
      staffNotes: "Bella did great today and enjoyed the dryer.",
    },
    createdAt: new Date().toISOString(),
  },
];

function readDemo(): PetTimelineEvent[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as PetTimelineEvent[];
}

function writeDemo(items: PetTimelineEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): PetTimelineEvent {
  return {
    id: String(row.id),
    petId: String(row.pet_id),
    eventType: String(row.event_type) as PetTimelineEvent["eventType"],
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    eventDate: String(row.event_date ?? ""),
    beforePhotoUrl: String(row.before_photo_url ?? ""),
    afterPhotoUrl: String(row.after_photo_url ?? ""),
    reportCard: (row.report_card ?? null) as PetTimelineEvent["reportCard"],
    createdAt: String(row.created_at),
  };
}

export async function listTimelineEvents(): Promise<PetTimelineEvent[]> {
  if (!isSupabaseConfigured) return readDemo().sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  const { data, error } = await supabase.from("pet_timeline_events").select("*").order("event_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createTimelineEvent(input: PetTimelineEventInput): Promise<PetTimelineEvent> {
  if (!isSupabaseConfigured) {
    const item: PetTimelineEvent = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeDemo([...readDemo(), item]);
    return item;
  }
  const { data, error } = await supabase.from("pet_timeline_events").insert({
    pet_id: input.petId,
    event_type: input.eventType,
    title: input.title,
    description: input.description,
    event_date: input.eventDate,
    before_photo_url: input.beforePhotoUrl || null,
    after_photo_url: input.afterPhotoUrl || null,
    report_card: input.reportCard,
  }).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
