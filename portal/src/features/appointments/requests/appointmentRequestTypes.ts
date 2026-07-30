import type { AppointmentInput, AppointmentType } from "../appointmentTypes";

export type AppointmentRequestSource = "Client Portal" | "Website";
export type AppointmentRequestStatus = "Awaiting Customer" | "Approved" | "Declined" | "Pending Review";

export type AppointmentRequest = {
  id: string;
  source: AppointmentRequestSource;
  status: AppointmentRequestStatus;
  customerId: string;
  petId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string;
  appointmentType: AppointmentType;
  serviceId: string;
  serviceName: string;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  preferredStaff: string;
  priceEstimate: number | null;
  notes: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string;
  appointmentId: string | null;
};

export type AppointmentRequestInput = Omit<
  AppointmentRequest,
  "id" | "status" | "submittedAt" | "reviewedAt" | "reviewedBy" | "appointmentId" | "Pending Review"
>;

export function requestToAppointmentInput(request: AppointmentRequest): AppointmentInput {
  return {
    customerId: request.customerId,
    petId: request.petId,
    appointmentType: request.appointmentType,
    serviceId: request.serviceId,
    serviceName: request.serviceName,
    appointmentDate: request.requestedDate,
    startTime: request.requestedStartTime,
    endTime: request.requestedEndTime,
    assignedStaff: request.preferredStaff,
    status: "Scheduled",
    priceEstimate: request.priceEstimate,
    notes: request.notes,
    reminderSent: false,
  };
}
