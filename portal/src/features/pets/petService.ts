import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Pet, PetInput } from "./petTypes";

const STORAGE_KEY = "wpms-demo-pets";

const today = new Date();
const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
  .toISOString()
  .slice(0, 10);

const seedPets: Pet[] = [
  {
    id: "demo-pet-1",
    customerId: "demo-customer-1",
    name: "Bella",
    species: "Dog",
    breed: "Golden Retriever",
    color: "Golden",
    sex: "Female",
    birthday: "2022-07-17",
    weightPounds: 64,
    size: "Large",
    microchipNumber: "985141000123456",
    veterinarianName: "Bay Animal Hospital",
    veterinarianPhone: "850-555-4100",
    allergies: "Chicken sensitivity",
    medicalAlerts: "None",
    behaviorNotes: "Very friendly. Nervous around dryers.",
    groomingNotes: "Oatmeal lavender shampoo. Rounded paws.",
    preferredGroomer: "Ashley",
    vaccinationRabiesExpiresOn: nextYear,
    vaccinationBordetellaExpiresOn: nextYear,
    vaccinationDhppExpiresOn: nextYear,
    photoUrl: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-pet-2",
    customerId: "demo-customer-2",
    name: "Max",
    species: "Dog",
    breed: "Labrador Retriever",
    color: "Black",
    sex: "Male",
    birthday: "2021-03-12",
    weightPounds: 76,
    size: "Large",
    microchipNumber: "",
    veterinarianName: "Callaway Animal Clinic",
    veterinarianPhone: "850-555-7710",
    allergies: "",
    medicalAlerts: "Hip stiffness",
    behaviorNotes: "Calm and food motivated.",
    groomingNotes: "Use de-shed package.",
    preferredGroomer: "Jordan",
    vaccinationRabiesExpiresOn: nextYear,
    vaccinationBordetellaExpiresOn: nextYear,
    vaccinationDhppExpiresOn: nextYear,
    photoUrl: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemoPets(): Pet[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPets));
    return seedPets;
  }
  return JSON.parse(raw) as Pet[];
}

function writeDemoPets(pets: Pet[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

function fromRow(row: Record<string, unknown>): Pet {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    name: String(row.name ?? ""),
    species: String(row.species ?? "Dog"),
    breed: String(row.breed ?? ""),
    color: String(row.color ?? ""),
    sex: (row.sex ?? "Unknown") as Pet["sex"],
    birthday: String(row.birthday ?? ""),
    weightPounds: row.weight_pounds === null || row.weight_pounds === undefined ? null : Number(row.weight_pounds),
    size: (row.size ?? "Medium") as Pet["size"],
    microchipNumber: String(row.microchip_number ?? ""),
    veterinarianName: String(row.veterinarian_name ?? ""),
    veterinarianPhone: String(row.veterinarian_phone ?? ""),
    allergies: String(row.allergies ?? ""),
    medicalAlerts: String(row.medical_alerts ?? ""),
    behaviorNotes: String(row.behavior_notes ?? ""),
    groomingNotes: String(row.grooming_notes ?? ""),
    preferredGroomer: String(row.preferred_groomer ?? ""),
    vaccinationRabiesExpiresOn: String(row.vaccination_rabies_expires_on ?? ""),
    vaccinationBordetellaExpiresOn: String(row.vaccination_bordetella_expires_on ?? ""),
    vaccinationDhppExpiresOn: String(row.vaccination_dhpp_expires_on ?? ""),
    photoUrl: String(row.photo_url ?? ""),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: PetInput) {
  return {
    customer_id: input.customerId,
    name: input.name,
    species: input.species,
    breed: input.breed || null,
    color: input.color || null,
    sex: input.sex,
    birthday: input.birthday || null,
    weight_pounds: input.weightPounds,
    size: input.size,
    microchip_number: input.microchipNumber || null,
    veterinarian_name: input.veterinarianName || null,
    veterinarian_phone: input.veterinarianPhone || null,
    allergies: input.allergies || null,
    medical_alerts: input.medicalAlerts || null,
    behavior_notes: input.behaviorNotes || null,
    grooming_notes: input.groomingNotes || null,
    preferred_groomer: input.preferredGroomer || null,
    vaccination_rabies_expires_on: input.vaccinationRabiesExpiresOn || null,
    vaccination_bordetella_expires_on: input.vaccinationBordetellaExpiresOn || null,
    vaccination_dhpp_expires_on: input.vaccinationDhppExpiresOn || null,
    photo_url: input.photoUrl || null,
    is_active: input.isActive,
  };
}

export async function listPets(): Promise<Pet[]> {
  if (!isSupabaseConfigured) return readDemoPets();
  const { data, error } = await supabase.from("pets").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row));
}

export async function getPet(id: string): Promise<Pet | null> {
  if (!isSupabaseConfigured) return readDemoPets().find((item) => item.id === id) ?? null;
  const { data, error } = await supabase.from("pets").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createPet(input: PetInput): Promise<Pet> {
  if (!isSupabaseConfigured) {
    const now = new Date().toISOString();
    const pet: Pet = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    writeDemoPets([pet, ...readDemoPets()]);
    return pet;
  }
  const { data, error } = await supabase.from("pets").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updatePet(id: string, input: PetInput): Promise<Pet> {
  if (!isSupabaseConfigured) {
    const pets = readDemoPets();
    const existing = pets.find((item) => item.id === id);
    if (!existing) throw new Error("Pet not found.");
    const updated: Pet = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemoPets(pets.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
  const { data, error } = await supabase.from("pets").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
