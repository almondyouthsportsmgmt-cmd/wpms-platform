import { listCustomers } from "../../customers/customerService";
import { receiveInboundMessage } from "../messageService";
import type { Customer } from "../../customers/customerTypes";
import type { IncomingContactMessage, LeadMessage, LeadStatus, MessageLead } from "./leadTypes";

const STORAGE_KEY = "wpms-message-leads";
const now = new Date().toISOString();
const seedLeads: MessageLead[] = [
  {
    id: "demo-lead-1",
    displayName: "Amanda",
    phone: "850-555-4412",
    email: "",
    channel: "SMS",
    status: "New",
    assignedTo: "",
    notes: "",
    unreadCount: 1,
    firstContactAt: now,
    lastContactAt: now,
    messages: [{
      id: "demo-lead-message-1",
      direction: "Inbound",
      body: "Hi, do you have an opening for a full groom for my Goldendoodle this week?",
      sentAt: now,
      status: "Received",
    }],
  },
];

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readLeads(): MessageLead[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLeads));
    return seedLeads;
  }
  try { return JSON.parse(raw) as MessageLead[]; } catch { return []; }
}

function writeLeads(items: MessageLead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("wpms:message-leads-updated"));
}

export function listLeads() {
  return readLeads()
    .filter((lead) => lead.status !== "Converted" && lead.status !== "Closed")
    .sort((a, b) => b.lastContactAt.localeCompare(a.lastContactAt));
}

export function getLead(id: string) {
  return readLeads().find((lead) => lead.id === id) ?? null;
}

export function saveLead(lead: MessageLead) {
  const leads = readLeads();
  writeLeads(leads.some((item) => item.id === lead.id)
    ? leads.map((item) => item.id === lead.id ? lead : item)
    : [lead, ...leads]);
  return lead;
}

function matchesCustomer(customer: Customer, input: IncomingContactMessage) {
  const phone = normalizePhone(input.senderPhone ?? "");
  const email = normalizeEmail(input.senderEmail ?? "");
  return Boolean(
    (phone && [customer.mobilePhone, customer.homePhone].some((value) => normalizePhone(value) === phone)) ||
    (email && normalizeEmail(customer.email) === email)
  );
}

function findMatchingLead(input: IncomingContactMessage) {
  const phone = normalizePhone(input.senderPhone ?? "");
  const email = normalizeEmail(input.senderEmail ?? "");
  return readLeads().find((lead) =>
    lead.status !== "Converted" && lead.status !== "Closed" &&
    ((phone && normalizePhone(lead.phone) === phone) ||
      (email && normalizeEmail(lead.email) === email))
  );
}

export async function routeIncomingContactMessage(input: IncomingContactMessage) {
  const cleanBody = input.body.trim();
  if (!cleanBody) throw new Error("Incoming message body is required.");
  if (!input.senderPhone?.trim() && !input.senderEmail?.trim()) {
    throw new Error("Incoming message requires a phone number or email address.");
  }

  const customers = await listCustomers();
  const customer = customers.find((item) => matchesCustomer(item, input));
  const stamp = input.receivedAt ?? new Date().toISOString();

  if (customer) {
    const result = await receiveInboundMessage(customer.id, cleanBody, input.channel);
    return { kind: "customer" as const, customer, ...result };
  }

  const existing = findMatchingLead(input);
  const message: LeadMessage = {
    id: crypto.randomUUID(),
    direction: "Inbound",
    body: cleanBody,
    sentAt: stamp,
    status: "Received",
  };

  const lead: MessageLead = existing ? {
    ...existing,
    displayName: existing.displayName || input.senderName?.trim() || "New lead",
    phone: existing.phone || input.senderPhone?.trim() || "",
    email: existing.email || input.senderEmail?.trim() || "",
    channel: input.channel,
    status: existing.status === "Closed" ? "New" : existing.status,
    unreadCount: existing.unreadCount + 1,
    lastContactAt: stamp,
    messages: [...existing.messages, message],
  } : {
    id: crypto.randomUUID(),
    displayName: input.senderName?.trim() || "New lead",
    phone: input.senderPhone?.trim() || "",
    email: input.senderEmail?.trim() || "",
    channel: input.channel,
    status: "New",
    assignedTo: "",
    notes: "",
    unreadCount: 1,
    firstContactAt: stamp,
    lastContactAt: stamp,
    messages: [message],
  };

  saveLead(lead);
  return { kind: "lead" as const, lead };
}

export function markLeadRead(id: string) {
  const lead = getLead(id);
  if (!lead) return null;
  return saveLead({ ...lead, unreadCount: 0 });
}

export function updateLead(id: string, update: Partial<Pick<MessageLead, "status" | "assignedTo" | "notes" | "displayName">>) {
  const lead = getLead(id);
  if (!lead) throw new Error("Lead not found.");
  return saveLead({ ...lead, ...update });
}

export function replyToLead(id: string, body: string) {
  const lead = getLead(id);
  if (!lead) throw new Error("Lead not found.");
  const clean = body.trim();
  if (!clean) throw new Error("Message cannot be empty.");
  const stamp = new Date().toISOString();
  return saveLead({
    ...lead,
    status: lead.status === "New" ? "Contacted" : lead.status,
    lastContactAt: stamp,
    messages: [...lead.messages, {
      id: crypto.randomUUID(), direction: "Outbound", body: clean,
      sentAt: stamp, status: "Delivered",
    }],
  });
}

export function convertLead(id: string, customerId: string) {
  const lead = getLead(id);
  if (!lead) throw new Error("Lead not found.");
  return saveLead({ ...lead, status: "Converted", convertedCustomerId: customerId, unreadCount: 0 });
}

export function closeLead(id: string) {
  return updateLead(id, { status: "Closed" as LeadStatus });
}
