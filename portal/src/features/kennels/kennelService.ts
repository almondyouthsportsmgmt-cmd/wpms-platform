import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Kennel, KennelInput } from "./kennelTypes";

const STORAGE_KEY = "wpms-demo-kennels";
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const seed: Kennel[] = [
  { id: "k1", name: "Suite A1", zone: "North Wing", type: "Luxury", capacity: 1, status: "Occupied", petId: "demo-pet-1", customerId: "demo-customer-1", checkInDate: today, checkOutDate: tomorrow, notes: "Photo update requested.", updatedAt: new Date().toISOString() },
  { id: "k2", name: "Suite A2", zone: "North Wing", type: "Luxury", capacity: 1, status: "Available", petId: "", customerId: "", checkInDate: "", checkOutDate: "", notes: "", updatedAt: new Date().toISOString() },
  { id: "k3", name: "Kennel B1", zone: "South Wing", type: "Standard", capacity: 1, status: "Reserved", petId: "demo-pet-2", customerId: "demo-customer-2", checkInDate: tomorrow, checkOutDate: "", notes: "Leash walks only.", updatedAt: new Date().toISOString() },
  { id: "k4", name: "Kennel B2", zone: "South Wing", type: "Standard", capacity: 1, status: "Cleaning", petId: "", customerId: "", checkInDate: "", checkOutDate: "", notes: "Sanitizing after checkout.", updatedAt: new Date().toISOString() },
  { id: "k5", name: "Cat C1", zone: "Cat Room", type: "Cat Condo", capacity: 1, status: "Available", petId: "", customerId: "", checkInDate: "", checkOutDate: "", notes: "", updatedAt: new Date().toISOString() },
  { id: "k6", name: "Daycare D1", zone: "Play Yard", type: "Daycare", capacity: 6, status: "Occupied", petId: "", customerId: "", checkInDate: today, checkOutDate: today, notes: "4 pets currently assigned.", updatedAt: new Date().toISOString() },
];

function readDemo(): Kennel[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as Kennel[];
}

function writeDemo(items: Kennel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): Kennel {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    zone: String(row.zone ?? ""),
    type: String(row.type ?? "Standard") as Kennel["type"],
    capacity: Number(row.capacity ?? 1),
    status: String(row.status ?? "Available") as Kennel["status"],
    petId: String(row.pet_id ?? ""),
    customerId: String(row.customer_id ?? ""),
    checkInDate: String(row.check_in_date ?? ""),
    checkOutDate: String(row.check_out_date ?? ""),
    notes: String(row.notes ?? ""),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function toRow(input: KennelInput) {
  return {
    name: input.name.trim(),
    zone: input.zone.trim(),
    type: input.type,
    capacity: input.capacity,
    status: input.status,
    pet_id: input.petId || null,
    customer_id: input.customerId || null,
    check_in_date: input.checkInDate || null,
    check_out_date: input.checkOutDate || null,
    notes: input.notes.trim() || null,
  };
}

export async function listKennels(): Promise<Kennel[]> {
  if (!isSupabaseConfigured) return readDemo().sort((a, b) => a.name.localeCompare(b.name));
  const { data, error } = await supabase.from("kennels").select("*").order("zone").order("name");
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createKennel(input: KennelInput): Promise<Kennel> {
  if (!isSupabaseConfigured) {
    const item: Kennel = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    writeDemo([...readDemo(), item]);
    return item;
  }
  const { data, error } = await supabase.from("kennels").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateKennel(id: string, input: KennelInput): Promise<Kennel> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Kennel not found.");
    const updated: Kennel = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemo(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from("kennels").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
