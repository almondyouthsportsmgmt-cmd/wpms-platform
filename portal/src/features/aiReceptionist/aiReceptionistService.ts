import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type {
  ReceptionistConversation,
  ReceptionistConversationStatus,
  ReceptionistIntent,
  ReceptionistReply,
} from "./aiReceptionistTypes";

const STORAGE_KEY = "wpms-demo-ai-receptionist-conversations";

const seed: ReceptionistConversation[] = [
  {
    id: "demo-ai-1",
    customerName: "Sarah Miller",
    customerPhone: "850-555-2211",
    channel: "Web Chat",
    intent: "Book Appointment",
    summary: "Wants a full groom for Bella next week.",
    lastMessage: "Do you have anything Tuesday morning for Bella?",
    lastMessageAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    status: "Open",
    assignedTo: "AI Receptionist",
    createdAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60_000).toISOString(),
  },
  {
    id: "demo-ai-2",
    customerName: "John Davis",
    customerPhone: "850-555-9988",
    channel: "SMS",
    intent: "Boarding Availability",
    summary: "Asked about a three-night boarding stay.",
    lastMessage: "Can Cooper stay Friday through Monday?",
    lastMessageAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    status: "Escalated",
    assignedTo: "Lisa",
    createdAt: new Date(Date.now() - 52 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
  },
  {
    id: "demo-ai-3",
    customerName: "Maria Lopez",
    customerPhone: "850-555-4421",
    channel: "Phone Note",
    intent: "Vaccination Question",
    summary: "Asked which vaccines are required for boarding.",
    lastMessage: "What shots does Daisy need before boarding?",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    status: "Resolved",
    assignedTo: "AI Receptionist",
    createdAt: new Date(Date.now() - 2.2 * 60 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
];

function readDemo(): ReceptionistConversation[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as ReceptionistConversation[];
}

function writeDemo(items: ReceptionistConversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): ReceptionistConversation {
  return {
    id: String(row.id),
    customerName: String(row.customer_name ?? "Unknown customer"),
    customerPhone: String(row.customer_phone ?? ""),
    channel: String(row.channel ?? "Web Chat") as ReceptionistConversation["channel"],
    intent: String(row.intent ?? "General Question") as ReceptionistIntent,
    summary: String(row.summary ?? ""),
    lastMessage: String(row.last_message ?? ""),
    lastMessageAt: String(row.last_message_at ?? row.updated_at),
    status: String(row.status ?? "Open") as ReceptionistConversationStatus,
    assignedTo: String(row.assigned_to ?? "AI Receptionist"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listReceptionistConversations(): Promise<ReceptionistConversation[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
  const { data, error } = await supabase
    .from("ai_receptionist_conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function updateConversationStatus(
  id: string,
  status: ReceptionistConversationStatus,
  assignedTo: string,
): Promise<ReceptionistConversation> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Conversation not found.");
    const updated = { ...existing, status, assignedTo, updatedAt: new Date().toISOString() };
    writeDemo(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase
    .from("ai_receptionist_conversations")
    .update({ status, assigned_to: assignedTo })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data);
}

export function generateReceptionistReply(message: string): ReceptionistReply {
  const text = message.toLowerCase();
  const contains = (...words: string[]) => words.some((word) => text.includes(word));

  if (contains("book", "appointment", "groom", "bath", "nail")) {
    return {
      intent: "Book Appointment",
      reply: "I’d be happy to help schedule that. What day works best, and which pet will be visiting?",
      suggestedAction: "Open appointment scheduler",
      confidence: 0.93,
      shouldEscalate: false,
    };
  }
  if (contains("reschedule", "change my appointment", "move appointment")) {
    return {
      intent: "Reschedule Appointment",
      reply: "I can help move the appointment. Please share the pet’s name and the new day or time you prefer.",
      suggestedAction: "Find existing appointment",
      confidence: 0.91,
      shouldEscalate: false,
    };
  }
  if (contains("cancel")) {
    return {
      intent: "Cancel Appointment",
      reply: "I can help with that. Please confirm the pet’s name and appointment date so our team can review the cancellation.",
      suggestedAction: "Escalate cancellation for confirmation",
      confidence: 0.9,
      shouldEscalate: true,
    };
  }
  if (contains("boarding", "kennel", "stay overnight", "overnight")) {
    return {
      intent: "Boarding Availability",
      reply: "We offer comfortable boarding stays. What are your check-in and check-out dates, and which pet will be staying?",
      suggestedAction: "Check boarding calendar",
      confidence: 0.94,
      shouldEscalate: false,
    };
  }
  if (contains("price", "cost", "how much", "rate")) {
    return {
      intent: "Pricing Question",
      reply: "Pricing depends on the pet, service, coat condition, and size. Tell me the breed and service you need, and I’ll prepare an estimate for the team to confirm.",
      suggestedAction: "Create service estimate",
      confidence: 0.88,
      shouldEscalate: false,
    };
  }
  if (contains("vaccine", "vaccination", "rabies", "bordetella", "dhpp")) {
    return {
      intent: "Vaccination Question",
      reply: "For boarding, we track current Rabies, Bordetella, and DHPP records. A team member can confirm the exact requirements for your pet before check-in.",
      suggestedAction: "Review pet vaccination record",
      confidence: 0.95,
      shouldEscalate: false,
    };
  }
  if (contains("hours", "open", "close", "location", "address")) {
    return {
      intent: "Hours & Location",
      reply: "Whimsical Paws Pet Escape is open from 7:30 AM to 6:00 PM. A team member can provide directions or confirm holiday hours.",
      suggestedAction: "Share business details",
      confidence: 0.92,
      shouldEscalate: false,
    };
  }
  if (contains("person", "staff", "manager", "owner", "call me", "human")) {
    return {
      intent: "Speak to Staff",
      reply: "Absolutely. I’ll flag this for a Whimsical Paws team member to follow up with you.",
      suggestedAction: "Escalate to staff",
      confidence: 0.97,
      shouldEscalate: true,
    };
  }

  return {
    intent: "General Question",
    reply: "Thanks for reaching out to Whimsical Paws. I can help with appointments, grooming, boarding, pricing, vaccines, hours, and connecting you with our team.",
    suggestedAction: "Ask a follow-up question",
    confidence: 0.62,
    shouldEscalate: true,
  };
}
