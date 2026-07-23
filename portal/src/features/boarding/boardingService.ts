import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { BoardingStay, BoardingStayInput } from "./boardingTypes";

const STORAGE_KEY = "wpms-demo-boarding-stays";
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const later = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

const seed: BoardingStay[] = [
  {
    id: "demo-boarding-1",
    customerId: "demo-customer-1",
    petId: "demo-pet-1",
    checkInDate: today,
    checkInTime: "14:00",
    checkOutDate: later,
    checkOutTime: "10:00",
    kennelName: "Suite A1",
    status: "Checked In",
    feedingFrequency: "Twice Daily",
    foodInstructions: "1 cup morning and evening.",
    medicationInstructions: "",
    walkInstructions: "Three short walks daily.",
    playtimeInstructions: "Group play with friendly dogs.",
    emergencyNotes: "",
    belongings: "Blue blanket and food container.",
    dailyRate: 48,
    depositAmount: 50,
    photoUpdatesEnabled: true,
    veterinarianReleaseConfirmed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-boarding-2",
    customerId: "demo-customer-2",
    petId: "demo-pet-2",
    checkInDate: tomorrow,
    checkInTime: "09:00",
    checkOutDate: later,
    checkOutTime: "16:00",
    kennelName: "Luxury B2",
    status: "Reserved",
    feedingFrequency: "Twice Daily",
    foodInstructions: "Use owner-provided food.",
    medicationInstructions: "Allergy tablet with dinner.",
    walkInstructions: "Leash walks only.",
    playtimeInstructions: "Solo play.",
    emergencyNotes: "",
    belongings: "Medication and harness.",
    dailyRate: 62,
    depositAmount: 75,
    photoUpdatesEnabled: true,
    veterinarianReleaseConfirmed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemo(): BoardingStay[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as BoardingStay[];
}

function writeDemo(items: BoardingStay[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): BoardingStay {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    petId: String(row.pet_id),
    checkInDate: String(row.check_in_date ?? ""),
    checkInTime: String(row.check_in_time ?? "").slice(0, 5),
    checkOutDate: String(row.check_out_date ?? ""),
    checkOutTime: String(row.check_out_time ?? "").slice(0, 5),
    kennelName: String(row.kennel_name ?? ""),
    status: String(row.status ?? "Reserved") as BoardingStay["status"],
    feedingFrequency: String(row.feeding_frequency ?? "Twice Daily") as BoardingStay["feedingFrequency"],
    foodInstructions: String(row.food_instructions ?? ""),
    medicationInstructions: String(row.medication_instructions ?? ""),
    walkInstructions: String(row.walk_instructions ?? ""),
    playtimeInstructions: String(row.playtime_instructions ?? ""),
    emergencyNotes: String(row.emergency_notes ?? ""),
    belongings: String(row.belongings ?? ""),
    dailyRate: Number(row.daily_rate ?? 0),
    depositAmount: Number(row.deposit_amount ?? 0),
    photoUpdatesEnabled: Boolean(row.photo_updates_enabled),
    veterinarianReleaseConfirmed: Boolean(row.veterinarian_release_confirmed),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: BoardingStayInput) {
  return {
    customer_id: input.customerId,
    pet_id: input.petId,
    check_in_date: input.checkInDate,
    check_in_time: input.checkInTime,
    check_out_date: input.checkOutDate,
    check_out_time: input.checkOutTime,
    kennel_name: input.kennelName || null,
    status: input.status,
    feeding_frequency: input.feedingFrequency,
    food_instructions: input.foodInstructions || null,
    medication_instructions: input.medicationInstructions || null,
    walk_instructions: input.walkInstructions || null,
    playtime_instructions: input.playtimeInstructions || null,
    emergency_notes: input.emergencyNotes || null,
    belongings: input.belongings || null,
    daily_rate: input.dailyRate,
    deposit_amount: input.depositAmount,
    photo_updates_enabled: input.photoUpdatesEnabled,
    veterinarian_release_confirmed: input.veterinarianReleaseConfirmed,
  };
}

export async function listBoardingStays(): Promise<BoardingStay[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort((a, b) => `${a.checkInDate}T${a.checkInTime}`.localeCompare(`${b.checkInDate}T${b.checkInTime}`));
  }
  const { data, error } = await supabase.from("boarding_stays").select("*").order("check_in_date").order("check_in_time");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createBoardingStay(input: BoardingStayInput): Promise<BoardingStay> {
  if (!isSupabaseConfigured) {
    const timestamp = new Date().toISOString();
    const item: BoardingStay = { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
    writeDemo([...readDemo(), item]);
    return item;
  }
  const { data, error } = await supabase.from("boarding_stays").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateBoardingStay(id: string, input: BoardingStayInput): Promise<BoardingStay> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Boarding stay not found.");
    const updated: BoardingStay = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemo(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from("boarding_stays").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
