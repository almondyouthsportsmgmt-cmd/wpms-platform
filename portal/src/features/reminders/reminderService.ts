import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { AutomatedReminder, ReminderInput, ReminderStatus } from "./reminderTypes";

const STORAGE_KEY = "wpms-demo-automated-reminders";

const inHours = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

const seed: AutomatedReminder[] = [
  {
    id: "demo-reminder-1",
    customerId: "demo-customer-1",
    petId: "demo-pet-1",
    type: "Appointment Reminder",
    channel: "SMS",
    subject: "Bella's appointment tomorrow",
    message: "Hi Sarah, this is a reminder that Bella's grooming appointment is tomorrow at 8:00 AM.",
    scheduledFor: inHours(4),
    status: "Scheduled",
    sentAt: null,
    errorMessage: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-reminder-2",
    customerId: "demo-customer-2",
    petId: "demo-pet-2",
    type: "Boarding Check-Out",
    channel: "Both",
    subject: "Cooper's boarding pickup",
    message: "Cooper is scheduled for boarding pickup tomorrow at 4:00 PM.",
    scheduledFor: inHours(20),
    status: "Scheduled",
    sentAt: null,
    errorMessage: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemo(): AutomatedReminder[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as AutomatedReminder[];
}

function writeDemo(items: AutomatedReminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): AutomatedReminder {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    petId: row.pet_id ? String(row.pet_id) : null,
    type: String(row.reminder_type) as AutomatedReminder["type"],
    channel: String(row.channel) as AutomatedReminder["channel"],
    subject: String(row.subject ?? ""),
    message: String(row.message ?? ""),
    scheduledFor: String(row.scheduled_for),
    status: String(row.status) as AutomatedReminder["status"],
    sentAt: row.sent_at ? String(row.sent_at) : null,
    errorMessage: String(row.error_message ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: ReminderInput) {
  return {
    customer_id: input.customerId,
    pet_id: input.petId || null,
    reminder_type: input.type,
    channel: input.channel,
    subject: input.subject.trim(),
    message: input.message.trim(),
    scheduled_for: input.scheduledFor,
    status: input.status,
  };
}

export async function listReminders(): Promise<AutomatedReminder[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  }
  const { data, error } = await supabase
    .from("automated_reminders")
    .select("*")
    .order("scheduled_for", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function saveReminder(input: ReminderInput, id?: string): Promise<AutomatedReminder> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const now = new Date().toISOString();
    const saved: AutomatedReminder = id
      ? {
          ...(items.find((item) => item.id === id) as AutomatedReminder),
          ...input,
          updatedAt: now,
        }
      : {
          ...input,
          id: crypto.randomUUID(),
          sentAt: null,
          errorMessage: "",
          createdAt: now,
          updatedAt: now,
        };
    writeDemo(id ? items.map((item) => item.id === id ? saved : item) : [...items, saved]);
    return saved;
  }

  const query = id
    ? supabase.from("automated_reminders").update(toRow(input)).eq("id", id)
    : supabase.from("automated_reminders").insert(toRow(input));
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateReminderStatus(id: string, status: ReminderStatus): Promise<AutomatedReminder> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Reminder not found.");
    const updated: AutomatedReminder = {
      ...existing,
      status,
      sentAt: status === "Sent" ? new Date().toISOString() : existing.sentAt,
      updatedAt: new Date().toISOString(),
    };
    writeDemo(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const patch: Record<string, unknown> = { status };
  if (status === "Sent") patch.sent_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("automated_reminders")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data);
}
