import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { Appointment, AppointmentInput } from "./appointmentTypes";

const STORAGE_KEY = "wpms-demo-appointments";
const now = new Date();
const today = now.toISOString().slice(0, 10);
const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().slice(0, 10);

const seedAppointments: Appointment[] = [
  {
    id: "demo-appointment-1",
    customerId: "demo-customer-1",
    petId: "demo-pet-1",
    appointmentType: "Grooming",
    serviceName: "Full Groom",
    appointmentDate: today,
    startTime: "08:00",
    endTime: "10:00",
    assignedStaff: "Ashley",
    status: "Checked In",
    priceEstimate: 95,
    notes: "Oatmeal lavender shampoo. Rounded paws.",
    reminderSent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-appointment-2",
    customerId: "demo-customer-2",
    petId: "demo-pet-2",
    appointmentType: "Bath",
    serviceName: "Bath & De-shed",
    appointmentDate: today,
    startTime: "08:30",
    endTime: "09:45",
    assignedStaff: "Jordan",
    status: "In Service",
    priceEstimate: 75,
    notes: "Use de-shed package.",
    reminderSent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-appointment-3",
    customerId: "demo-customer-1",
    petId: "demo-pet-1",
    appointmentType: "Nails",
    serviceName: "Nail Trim",
    appointmentDate: tomorrow,
    startTime: "13:00",
    endTime: "13:30",
    assignedStaff: "Lisa",
    status: "Confirmed",
    priceEstimate: 20,
    notes: "",
    reminderSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function readDemoAppointments(): Appointment[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAppointments));
    return seedAppointments;
  }
  return JSON.parse(raw) as Appointment[];
}

function writeDemoAppointments(items: Appointment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function fromRow(row: Record<string, unknown>): Appointment {
  return {
    id: String(row.id),
    customerId: String(row.customer_id),
    petId: String(row.pet_id),
    appointmentType: String(row.appointment_type ?? "Grooming") as Appointment["appointmentType"],
    serviceName: String(row.service_name ?? ""),
    appointmentDate: String(row.appointment_date ?? ""),
    startTime: String(row.start_time ?? "").slice(0, 5),
    endTime: String(row.end_time ?? "").slice(0, 5),
    assignedStaff: String(row.assigned_staff ?? ""),
    status: String(row.status ?? "Scheduled") as Appointment["status"],
    priceEstimate: row.price_estimate === null || row.price_estimate === undefined ? null : Number(row.price_estimate),
    notes: String(row.notes ?? ""),
    reminderSent: Boolean(row.reminder_sent),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: AppointmentInput) {
  return {
    customer_id: input.customerId,
    pet_id: input.petId,
    appointment_type: input.appointmentType,
    service_name: input.serviceName,
    appointment_date: input.appointmentDate,
    start_time: input.startTime,
    end_time: input.endTime,
    assigned_staff: input.assignedStaff || null,
    status: input.status,
    price_estimate: input.priceEstimate,
    notes: input.notes || null,
    reminder_sent: input.reminderSent,
  };
}

export async function listAppointments(): Promise<Appointment[]> {
  if (!isSupabaseConfigured) {
    return readDemoAppointments().sort((a, b) => `${a.appointmentDate}T${a.startTime}`.localeCompare(`${b.appointmentDate}T${b.startTime}`));
  }
  const { data, error } = await supabase.from("appointments").select("*").order("appointment_date").order("start_time");
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row));
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  if (!isSupabaseConfigured) {
    const timestamp = new Date().toISOString();
    const item: Appointment = { ...input, id: crypto.randomUUID(), createdAt: timestamp, updatedAt: timestamp };
    writeDemoAppointments([...readDemoAppointments(), item]);
    return item;
  }
  const { data, error } = await supabase.from("appointments").insert(toRow(input)).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateAppointment(id: string, input: AppointmentInput): Promise<Appointment> {
  if (!isSupabaseConfigured) {
    const items = readDemoAppointments();
    const existing = items.find((item) => item.id === id);
    if (!existing) throw new Error("Appointment not found.");
    const updated: Appointment = { ...existing, ...input, updatedAt: new Date().toISOString() };
    writeDemoAppointments(items.map((item) => item.id === id ? updated : item));
    return updated;
  }
  const { data, error } = await supabase.from("appointments").update(toRow(input)).eq("id", id).select("*").single();
  if (error) throw error;
  return fromRow(data);
}

export async function changeAppointmentStatus(id: string, status: Appointment["status"]): Promise<Appointment> {
  const items = await listAppointments();
  const existing = items.find((item) => item.id === id);
  if (!existing) throw new Error("Appointment not found.");
  return updateAppointment(id, { ...existing, status });
}
