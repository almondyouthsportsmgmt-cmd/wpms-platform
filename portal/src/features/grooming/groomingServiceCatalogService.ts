import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type {
  GroomingService,
  GroomingServiceInput,
} from "./groomingServiceTypes";

const STORAGE_KEY = "wpms-demo-grooming-services";

const seedServices: GroomingService[] = [
  {
    id: "service-full-xs",
    name: "Full Groom - XSmall/Small - up to 20 lbs",
    category: "Full Groom",
    description:
      "Includes bath with premium shampoo and conditioner, blow dry, brush, nail clipping and grinding, ear cleaning, and whole-body haircut. Final price may vary by coat condition, breed, and behavior.",
    appointmentType: "Grooming",
    durationMinutes: 90,
    bufferMinutes: 15,
    price: 75,
    taxable: false,
    bookOnline: true,
    species: "Dog",
    minimumWeight: 0,
    maximumWeight: 20,
    isActive: true,
    displayOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-full-medium",
    name: "Full Groom - Medium - 21 to 49 lbs",
    category: "Full Groom",
    description:
      "Includes bath with premium shampoo and conditioner, blow dry, brush, nail clipping and grinding, ear cleaning, and whole-body haircut.",
    appointmentType: "Grooming",
    durationMinutes: 120,
    bufferMinutes: 15,
    price: 95,
    taxable: false,
    bookOnline: true,
    species: "Dog",
    minimumWeight: 21,
    maximumWeight: 49,
    isActive: true,
    displayOrder: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-full-large",
    name: "Full Groom - Large - 50 to 79 lbs",
    category: "Full Groom",
    description:
      "Complete grooming package for large dogs. Additional coat-condition charges may apply.",
    appointmentType: "Grooming",
    durationMinutes: 150,
    bufferMinutes: 15,
    price: 125,
    taxable: false,
    bookOnline: true,
    species: "Dog",
    minimumWeight: 50,
    maximumWeight: 79,
    isActive: true,
    displayOrder: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-bath",
    name: "Bath & Brush",
    category: "Bath & Brush",
    description:
      "Premium shampoo and conditioner, blow dry, brush, nails, and ear cleaning.",
    appointmentType: "Bath",
    durationMinutes: 75,
    bufferMinutes: 10,
    price: 55,
    taxable: false,
    bookOnline: true,
    species: "Dog",
    minimumWeight: null,
    maximumWeight: null,
    isActive: true,
    displayOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-cat",
    name: "Feline Groom",
    category: "Cat Grooming",
    description: "Complete feline grooming service tailored to coat and temperament.",
    appointmentType: "Grooming",
    durationMinutes: 120,
    bufferMinutes: 15,
    price: 150,
    taxable: false,
    bookOnline: false,
    species: "Cat",
    minimumWeight: null,
    maximumWeight: null,
    isActive: true,
    displayOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "service-nails",
    name: "Nail Trim & Grind",
    category: "Nail Services",
    description: "Nail trim with smoothing grind.",
    appointmentType: "Nails",
    durationMinutes: 20,
    bufferMinutes: 5,
    price: 20,
    taxable: false,
    bookOnline: true,
    species: "All",
    minimumWeight: null,
    maximumWeight: null,
    isActive: true,
    displayOrder: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemo(): GroomingService[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedServices));
    return seedServices;
  }
  return JSON.parse(raw) as GroomingService[];
}

function writeDemo(items: GroomingService[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): GroomingService {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? "Other") as GroomingService["category"],
    description: String(row.description ?? ""),
    appointmentType: String(row.appointment_type ?? "Grooming") as GroomingService["appointmentType"],
    durationMinutes: Number(row.duration_minutes ?? 60),
    bufferMinutes: Number(row.buffer_minutes ?? 0),
    price: Number(row.price ?? 0),
    taxable: Boolean(row.taxable),
    bookOnline: Boolean(row.book_online),
    species: String(row.species ?? "All") as GroomingService["species"],
    minimumWeight: row.minimum_weight == null ? null : Number(row.minimum_weight),
    maximumWeight: row.maximum_weight == null ? null : Number(row.maximum_weight),
    isActive: Boolean(row.is_active ?? true),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: GroomingServiceInput) {
  return {
    name: input.name,
    category: input.category,
    description: input.description || null,
    appointment_type: input.appointmentType,
    duration_minutes: input.durationMinutes,
    buffer_minutes: input.bufferMinutes,
    price: input.price,
    taxable: input.taxable,
    book_online: input.bookOnline,
    species: input.species,
    minimum_weight: input.minimumWeight,
    maximum_weight: input.maximumWeight,
    is_active: input.isActive,
    display_order: input.displayOrder,
  };
}

export async function listGroomingServices(): Promise<GroomingService[]> {
  if (!isSupabaseConfigured) {
    return readDemo().sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        a.displayOrder - b.displayOrder ||
        a.name.localeCompare(b.name),
    );
  }

  const { data, error } = await supabase
    .from("grooming_services")
    .select("*")
    .order("category")
    .order("display_order")
    .order("name");

  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createGroomingService(
  input: GroomingServiceInput,
): Promise<GroomingService> {
  if (!isSupabaseConfigured) {
    const timestamp = new Date().toISOString();
    const item: GroomingService = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    writeDemo([...readDemo(), item]);
    return item;
  }

  const { data, error } = await supabase
    .from("grooming_services")
    .insert(toRow(input))
    .select("*")
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function updateGroomingService(
  id: string,
  input: GroomingServiceInput,
): Promise<GroomingService> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Service not found.");

    const updated: GroomingService = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    writeDemo(items.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  const { data, error } = await supabase
    .from("grooming_services")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function deleteGroomingService(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeDemo(readDemo().filter((item) => item.id !== id));
    return;
  }

  const { error } = await supabase.from("grooming_services").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateGroomingService(
  service: GroomingService,
): Promise<GroomingService> {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...input
  } = service;

  return createGroomingService({
    ...input,
    name: `${service.name} Copy`,
    displayOrder: service.displayOrder + 1,
  });
}

export async function bulkUpdatePrices(
  ids: string[],
  mode: "percent" | "amount",
  value: number,
): Promise<GroomingService[]> {
  const services = await listGroomingServices();
  const selected = services.filter((item) => ids.includes(item.id));

  return Promise.all(
    selected.map((service) => {
      const change =
        mode === "percent" ? service.price * (value / 100) : value;
      const price = Math.max(0, Math.round((service.price + change) * 100) / 100);

      return updateGroomingService(service.id, {
        ...service,
        price,
      });
    }),
  );
}
