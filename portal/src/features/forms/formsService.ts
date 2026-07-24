import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { ClientForm, ClientFormInput } from "./formsTypes";

const STORAGE_KEY = "wpms-demo-client-forms";
const now = new Date().toISOString();
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

const seed: ClientForm[] = [
  {
    id: "demo-form-1",
    customerId: "demo-customer-1",
    petId: "demo-pet-1",
    formType: "Grooming Consent",
    title: "Bella Grooming Consent",
    status: "Signed",
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    signedAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: nextWeek,
    signerName: "Sarah Miller",
    signerEmail: "sarah@example.com",
    notes: "Standard grooming authorization.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "demo-form-2",
    customerId: "demo-customer-2",
    petId: "demo-pet-2",
    formType: "Boarding Agreement",
    title: "Cooper Boarding Agreement",
    status: "Sent",
    sentAt: now,
    signedAt: "",
    expiresAt: nextWeek,
    signerName: "John Davis",
    signerEmail: "john@example.com",
    notes: "Awaiting signature before check-in.",
    createdAt: now,
    updatedAt: now,
  },
];

function readDemo(): ClientForm[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as ClientForm[];
}

function writeDemo(items: ClientForm[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): ClientForm {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    petId: String(row.pet_id),
    formType: String(row.form_type) as ClientForm["formType"],
    title: String(row.title ?? "Client form"),
    status: String(row.status ?? "Draft") as ClientForm["status"],
    sentAt: String(row.sent_at ?? ""),
    signedAt: String(row.signed_at ?? ""),
    expiresAt: String(row.expires_at ?? ""),
    signerName: String(row.signer_name ?? ""),
    signerEmail: String(row.signer_email ?? ""),
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: ClientFormInput) {
  return {
    customer_id: input.customerId,
    pet_id: input.petId,
    form_type: input.formType,
    title: input.title.trim(),
    status: input.status,
    sent_at: input.sentAt || null,
    signed_at: input.signedAt || null,
    expires_at: input.expiresAt || null,
    signer_name: input.signerName.trim() || null,
    signer_email: input.signerEmail.trim().toLowerCase() || null,
    notes: input.notes.trim() || null,
  };
}

export async function listClientForms(): Promise<ClientForm[]> {
  if (!isSupabaseConfigured) return readDemo().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  const { data, error } = await supabase.from("client_forms").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function saveClientForm(input: ClientFormInput, id?: string): Promise<ClientForm> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const stamp = new Date().toISOString();
    const existing = id ? items.find((item)=>item.id===id) : undefined;
    const saved: ClientForm = existing
      ? { ...existing, ...input, signedAt: input.signedAt ?? existing.signedAt, updatedAt: stamp }
      : { ...input, id: crypto.randomUUID(), signedAt: input.signedAt ?? "", createdAt: stamp, updatedAt: stamp };
    writeDemo(existing ? items.map((item)=>item.id===id?saved:item) : [saved, ...items]);
    return saved;
  }
  const query = id
    ? supabase.from("client_forms").update(toRow(input)).eq("id", id)
    : supabase.from("client_forms").insert(toRow(input));
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateClientFormStatus(id: string, status: ClientForm["status"]): Promise<ClientForm> {
  const items = await listClientForms();
  const current = items.find((item)=>item.id===id);
  if (!current) throw new Error("Form not found.");
  const stamp = new Date().toISOString();
  return saveClientForm({ ...current, status, sentAt: status === "Sent" && !current.sentAt ? stamp : current.sentAt, signedAt: status === "Signed" ? stamp : current.signedAt }, id);
}
