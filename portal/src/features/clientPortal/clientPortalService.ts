import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { PortalAccess, PortalAccessInput } from "./clientPortalTypes";

const STORAGE_KEY = "wpms-demo-client-portal-access";

const seed: PortalAccess[] = [
  {
    id: "demo-portal-1",
    customerId: "demo-customer-1",
    email: "sarah@example.com",
    status: "Active",
    lastLoginAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    invitedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function readDemo(): PortalAccess[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as PortalAccess[];
}

function writeDemo(items: PortalAccess[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): PortalAccess {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    email: String(row.email ?? ""),
    status: String(row.status ?? "Invited") as PortalAccess["status"],
    lastLoginAt: String(row.last_login_at ?? ""),
    invitedAt: String(row.invited_at ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listPortalAccess(): Promise<PortalAccess[]> {
  if (!isSupabaseConfigured) return readDemo();
  const { data, error } = await supabase.from("customer_portal_access").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function savePortalAccess(input: PortalAccessInput, id?: string): Promise<PortalAccess> {
  if (!isSupabaseConfigured) {
    const items = readDemo();
    const now = new Date().toISOString();
    if (id) {
      const existing = items.find((item) => item.id === id);
      if (!existing) throw new Error("Portal access record not found.");
      const updated: PortalAccess = { ...existing, ...input, updatedAt: now };
      writeDemo(items.map((item) => item.id === id ? updated : item));
      return updated;
    }
    const created: PortalAccess = {
      id: crypto.randomUUID(),
      ...input,
      invitedAt: now,
      lastLoginAt: "",
      createdAt: now,
      updatedAt: now,
    };
    writeDemo([created, ...items]);
    return created;
  }

  const row = {
    customer_id: input.customerId,
    email: input.email.trim().toLowerCase(),
    status: input.status,
    invited_at: new Date().toISOString(),
  };
  const query = id
    ? supabase.from("customer_portal_access").update(row).eq("id", id)
    : supabase.from("customer_portal_access").insert(row);
  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromRow(data);
}
