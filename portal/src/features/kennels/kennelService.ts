import {
  isSupabaseConfigured,
  supabase,
} from "../../lib/supabaseClient";
import type { Kennel, KennelInput } from "./kennelTypes";

const STORAGE_KEY = "wpms-demo-kennels-v2";
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000)
  .toISOString()
  .slice(0, 10);

const seed: Kennel[] = [
  {
    id: "k1",
    name: "Suite A1",
    zone: "North Wing",
    type: "Luxury",
    capacity: 2,
    status: "Occupied",
    petIds: ["demo-pet-1"],
    customerId: "demo-customer-1",
    checkInDate: today,
    checkOutDate: tomorrow,
    price: 62,
    notes: "Photo update requested.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "k2",
    name: "Suite A2",
    zone: "North Wing",
    type: "Luxury",
    capacity: 2,
    status: "Available",
    petIds: [],
    customerId: "",
    checkInDate: "",
    checkOutDate: "",
    price: 62,
    notes: "",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "k3",
    name: "Kennel B1",
    zone: "South Wing",
    type: "Standard",
    capacity: 2,
    status: "Reserved",
    petIds: ["demo-pet-2"],
    customerId: "demo-customer-2",
    checkInDate: tomorrow,
    checkOutDate: "",
    price: 48,
    notes: "Leash walks only.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "k4",
    name: "Kennel B2",
    zone: "South Wing",
    type: "Standard",
    capacity: 1,
    status: "Cleaning",
    petIds: [],
    customerId: "",
    checkInDate: "",
    checkOutDate: "",
    price: 48,
    notes: "Sanitizing after checkout.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "k5",
    name: "Cat C1",
    zone: "Cat Room",
    type: "Cat Condo",
    capacity: 2,
    status: "Available",
    petIds: [],
    customerId: "",
    checkInDate: "",
    checkOutDate: "",
    price: 42,
    notes: "",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "k6",
    name: "Daycare D1",
    zone: "Play Yard",
    type: "Daycare",
    capacity: 6,
    status: "Occupied",
    petIds: [],
    customerId: "",
    checkInDate: today,
    checkOutDate: today,
    price: 35,
    notes: "4 pets currently assigned.",
    updatedAt: new Date().toISOString(),
  },
];

function normalizeDemoKennel(item: Partial<Kennel> & { petId?: string }): Kennel {
  return {
    id: String(item.id ?? crypto.randomUUID()),
    name: String(item.name ?? ""),
    zone: String(item.zone ?? ""),
    type: (item.type ?? "Standard") as Kennel["type"],
    capacity: Number(item.capacity ?? 1),
    status: (item.status ?? "Available") as Kennel["status"],
    petIds: Array.isArray(item.petIds)
      ? item.petIds.map(String)
      : item.petId
        ? [String(item.petId)]
        : [],
    customerId: String(item.customerId ?? ""),
    checkInDate: String(item.checkInDate ?? ""),
    checkOutDate: String(item.checkOutDate ?? ""),
    price: Number(item.price ?? 0),
    notes: String(item.notes ?? ""),
    updatedAt: String(item.updatedAt ?? new Date().toISOString()),
  };
}

function readDemo(): Kennel[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return (JSON.parse(raw) as Array<Partial<Kennel> & { petId?: string }>)
      .map(normalizeDemoKennel);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

function writeDemo(items: Kennel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(
  row: Record<string, unknown>,
  petIds: string[],
): Kennel {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    zone: String(row.zone ?? ""),
    type: String(row.type ?? "Standard") as Kennel["type"],
    capacity: Number(row.capacity ?? 1),
    status: String(row.status ?? "Available") as Kennel["status"],
    petIds,
    customerId: String(row.customer_id ?? ""),
    checkInDate: String(row.check_in_date ?? ""),
    checkOutDate: String(row.check_out_date ?? ""),
    price: Number(row.price ?? 0),
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
    customer_id: input.customerId || null,
    check_in_date: input.checkInDate || null,
    check_out_date: input.checkOutDate || null,
    price: input.price,
    notes: input.notes.trim() || null,
  };
}

async function replaceAssignments(
  kennelId: string,
  petIds: string[],
): Promise<void> {
  const remove = await supabase
    .from("kennel_pet_assignments")
    .delete()
    .eq("kennel_id", kennelId);

  if (remove.error) throw remove.error;

  if (petIds.length === 0) return;

  const insert = await supabase
    .from("kennel_pet_assignments")
    .insert(
      petIds.map((petId) => ({
        kennel_id: kennelId,
        pet_id: petId,
      })),
    );

  if (insert.error) throw insert.error;
}

export async function listKennels(): Promise<Kennel[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort((a, b) =>
      `${a.zone} ${a.name}`.localeCompare(`${b.zone} ${b.name}`),
    );
  }

  const [kennelResult, assignmentResult] = await Promise.all([
    supabase
      .from("kennels")
      .select("*")
      .order("zone")
      .order("name"),
    supabase
      .from("kennel_pet_assignments")
      .select("kennel_id, pet_id"),
  ]);

  if (kennelResult.error) throw kennelResult.error;
  if (assignmentResult.error) throw assignmentResult.error;

  const assignments = new Map<string, string[]>();

  for (const row of assignmentResult.data ?? []) {
    const kennelId = String(row.kennel_id);
    const current = assignments.get(kennelId) ?? [];
    current.push(String(row.pet_id));
    assignments.set(kennelId, current);
  }

  return (kennelResult.data ?? []).map((row) =>
    fromRow(
      row as Record<string, unknown>,
      assignments.get(String(row.id)) ?? [],
    ),
  );
}

export async function createKennel(
  input: KennelInput,
): Promise<Kennel> {
  if (!isSupabaseConfigured) {
    const item: Kennel = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };

    writeDemo([...readDemo(), item]);
    return item;
  }

  const { data, error } = await supabase
    .from("kennels")
    .insert(toRow(input))
    .select("*")
    .single();

  if (error) throw error;

  await replaceAssignments(String(data.id), input.petIds);

  return fromRow(
    data as Record<string, unknown>,
    input.petIds,
  );
}

export async function updateKennel(
  id: string,
  input: KennelInput,
): Promise<Kennel> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);

    if (!existing) throw new Error("Kennel not found.");

    const updated: Kennel = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    writeDemo(
      items.map((item) => (item.id === id ? updated : item)),
    );

    return updated;
  }

  const { data, error } = await supabase
    .from("kennels")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  await replaceAssignments(id, input.petIds);

  return fromRow(
    data as Record<string, unknown>,
    input.petIds,
  );
}
