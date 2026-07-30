import { isSupabaseConfigured, supabase } from "../../../lib/supabaseClient";
import { appointmentScheduler } from "../appointmentScheduler";
import { requestToAppointmentInput } from "./appointmentRequestTypes";
import type { AppointmentRequest, AppointmentRequestInput } from "./appointmentRequestTypes";

const STORAGE_KEY = "wpms-appointment-requests";

function readLocal(): AppointmentRequest[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as AppointmentRequest[]; } catch { return []; }
}

function writeLocal(items: AppointmentRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("wpms:appointment-requests-updated"));
}

function fromRow(row: Record<string, unknown>): AppointmentRequest {
  return {
    id: String(row.id), source: String(row.source) as AppointmentRequest["source"],
    status: String(row.status) as AppointmentRequest["status"], customerId: String(row.customer_id ?? ""),
    petId: String(row.pet_id ?? ""), requesterName: String(row.requester_name ?? ""),
    requesterPhone: String(row.requester_phone ?? ""), requesterEmail: String(row.requester_email ?? ""),
    appointmentType: String(row.appointment_type ?? "Grooming") as AppointmentRequest["appointmentType"],
    serviceId: String(row.service_id ?? ""), serviceName: String(row.service_name ?? ""),
    requestedDate: String(row.requested_date ?? ""), requestedStartTime: String(row.requested_start_time ?? "").slice(0,5),
    requestedEndTime: String(row.requested_end_time ?? "").slice(0,5), preferredStaff: String(row.preferred_staff ?? ""),
    priceEstimate: row.price_estimate == null ? null : Number(row.price_estimate), notes: String(row.notes ?? ""),
    submittedAt: String(row.submitted_at ?? row.created_at), reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
    reviewedBy: String(row.reviewed_by ?? ""), appointmentId: row.appointment_id ? String(row.appointment_id) : null,
  };
}

function toRow(input: AppointmentRequestInput) {
  return {
    source: input.source, customer_id: input.customerId || null, pet_id: input.petId || null,
    requester_name: input.requesterName || null, requester_phone: input.requesterPhone || null,
    requester_email: input.requesterEmail || null, appointment_type: input.appointmentType,
    service_id: input.serviceId || null, service_name: input.serviceName,
    requested_date: input.requestedDate, requested_start_time: input.requestedStartTime,
    requested_end_time: input.requestedEndTime, preferred_staff: input.preferredStaff || null,
    price_estimate: input.priceEstimate, notes: input.notes || null,
  };
}

export async function listAppointmentRequests(): Promise<AppointmentRequest[]> {
  if (!isSupabaseConfigured) return readLocal().sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt));
  const { data, error } = await supabase.from("appointment_requests").select("*").order("submitted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => fromRow(row));
}

export async function submitAppointmentRequest(input: AppointmentRequestInput): Promise<AppointmentRequest> {
  const stamp = new Date().toISOString();
  let request: AppointmentRequest;
  if (!isSupabaseConfigured) {
    request = { ...input, id: crypto.randomUUID(), status: "Pending Review", submittedAt: stamp, reviewedAt: null, reviewedBy: "", appointmentId: null };
    writeLocal([request, ...readLocal()]);
  } else {
    const { data, error } = await supabase.from("appointment_requests").insert(toRow(input)).select("*").single();
    if (error) throw error;
    request = fromRow(data);
  }
  window.dispatchEvent(new CustomEvent("wpms:appointment-request-received", { detail: request }));
  return request;
}

export async function approveAppointmentRequest(id: string, reviewedBy = ""): Promise<AppointmentRequest> {
  const requests = await listAppointmentRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Appointment request not found.");
  if (request.status !== "Pending Review") return request;
  const appointment = await appointmentScheduler.create(requestToAppointmentInput(request));
  const stamp = new Date().toISOString();
  const updated = { ...request, status: "Approved" as const, reviewedAt: stamp, reviewedBy, appointmentId: appointment.id };
  if (!isSupabaseConfigured) {
    writeLocal(requests.map((item) => item.id === id ? updated : item));
  } else {
    const { error } = await supabase.from("appointment_requests").update({ status: "Approved", reviewed_at: stamp, reviewed_by: reviewedBy || null, appointment_id: appointment.id }).eq("id", id);
    if (error) throw error;
    window.dispatchEvent(new CustomEvent("wpms:appointment-requests-updated"));
  }
  window.dispatchEvent(new CustomEvent("wpms:appointment-request-approved", { detail: updated }));
  return updated;
}

export async function declineAppointmentRequest(id: string, reviewedBy = ""): Promise<AppointmentRequest> {
  const requests = await listAppointmentRequests();
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Appointment request not found.");
  const stamp = new Date().toISOString();
  const updated = { ...request, status: "Declined" as const, reviewedAt: stamp, reviewedBy };
  if (!isSupabaseConfigured) writeLocal(requests.map((item) => item.id === id ? updated : item));
  else {
    const { error } = await supabase.from("appointment_requests").update({ status: "Declined", reviewed_at: stamp, reviewed_by: reviewedBy || null }).eq("id", id);
    if (error) throw error;
    window.dispatchEvent(new CustomEvent("wpms:appointment-requests-updated"));
  }
  return updated;
}

export async function proposeNewAppointmentTime(
  id: string,
  requestedDate: string,
  requestedStartTime: string,
  requestedEndTime: string,
  reviewedBy = "",
): Promise<AppointmentRequest> {

  const requests = await listAppointmentRequests();

  const request = requests.find((item) => item.id === id);

  if (!request) {
    throw new Error("Appointment request not found.");
  }

  const stamp = new Date().toISOString();

  const updated: AppointmentRequest = {
    ...request,
    status: "Awaiting Customer",
    requestedDate,
    requestedStartTime,
    requestedEndTime,
    reviewedAt: stamp,
    reviewedBy,
  };

  if (!isSupabaseConfigured) {

    writeLocal(
      requests.map((item) =>
        item.id === id ? updated : item
      ),
    );

  } else {

    const { error } = await supabase
      .from("appointment_requests")
      .update({
        status: "Awaiting Customer",
        requested_date: requestedDate,
        requested_start_time: requestedStartTime,
        requested_end_time: requestedEndTime,
        reviewed_at: stamp,
        reviewed_by: reviewedBy || null,
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    window.dispatchEvent(
      new CustomEvent("wpms:appointment-requests-updated"),
    );
  }

  window.dispatchEvent(
    new CustomEvent(
      "wpms:appointment-request-rescheduled",
      {
        detail: updated,
      },
    ),
  );

  return updated;
}