import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Customer, CustomerInput } from "./customerTypes";

const STORAGE_KEY = "wpms-demo-customers";

const seedCustomers: Customer[] = [
  {
    id: "demo-customer-1",
    firstName: "Sarah",
    lastName: "Miller",
    mobilePhone: "850-555-2211",
    homePhone: "",
    email: "sarah.miller@example.com",
    streetAddress: "214 Palm Avenue",
    city: "Panama City",
    state: "FL",
    zipCode: "32401",
    emergencyContactName: "Michael Miller",
    emergencyContactPhone: "850-555-2299",
    emergencyRelationship: "Spouse",
    preferredContactMethod: "Text",
    marketingOptIn: true,
    notes: "Bella prefers morning appointments.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-customer-2",
    firstName: "John",
    lastName: "Davis",
    mobilePhone: "850-555-9988",
    homePhone: "",
    email: "john.davis@example.com",
    streetAddress: "92 Bayview Drive",
    city: "Callaway",
    state: "FL",
    zipCode: "32404",
    emergencyContactName: "Angela Davis",
    emergencyContactPhone: "850-555-9912",
    emergencyRelationship: "Spouse",
    preferredContactMethod: "Call",
    marketingOptIn: false,
    notes: "Two pets: Max and Cooper.",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemoCustomers(): Customer[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCustomers));
    return seedCustomers;
  }
  return JSON.parse(raw) as Customer[];
}

function writeDemoCustomers(customers: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
}

function fromRow(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    mobilePhone: String(row.mobile_phone ?? ""),
    homePhone: String(row.home_phone ?? ""),
    email: String(row.email ?? ""),
    streetAddress: String(row.street_address ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    zipCode: String(row.zip_code ?? ""),
    emergencyContactName: String(row.emergency_contact_name ?? ""),
    emergencyContactPhone: String(row.emergency_contact_phone ?? ""),
    emergencyRelationship: String(row.emergency_relationship ?? ""),
    preferredContactMethod: (row.preferred_contact_method ?? "Text") as Customer["preferredContactMethod"],
    marketingOptIn: Boolean(row.marketing_opt_in),
    notes: String(row.notes ?? ""),
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: CustomerInput) {
  return {
    first_name: input.firstName,
    last_name: input.lastName,
    mobile_phone: input.mobilePhone,
    home_phone: input.homePhone || null,
    email: input.email || null,
    street_address: input.streetAddress || null,
    city: input.city || null,
    state: input.state || null,
    zip_code: input.zipCode || null,
    emergency_contact_name: input.emergencyContactName || null,
    emergency_contact_phone: input.emergencyContactPhone || null,
    emergency_relationship: input.emergencyRelationship || null,
    preferred_contact_method: input.preferredContactMethod,
    marketing_opt_in: input.marketingOptIn,
    notes: input.notes || null,
    is_active: input.isActive,
  };
}

export async function listCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return readDemoCustomers();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (!isSupabaseConfigured) return readDemoCustomers().find((item) => item.id === id) ?? null;

  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  if (!isSupabaseConfigured) {
    const now = new Date().toISOString();
    const customer: Customer = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    writeDemoCustomers([customer, ...readDemoCustomers()]);
    return customer;
  }

  const { data, error } = await supabase.from("customers").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
  if (!isSupabaseConfigured) {
    const customers = readDemoCustomers();
    const existing = customers.find((item) => item.id === id);
    if (!existing) throw new Error("Customer not found.");
    const updated: Customer = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemoCustomers(customers.map((item) => (item.id === id ? updated : item)));
    return updated;
  }

  const { data, error } = await supabase.from("customers").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}
