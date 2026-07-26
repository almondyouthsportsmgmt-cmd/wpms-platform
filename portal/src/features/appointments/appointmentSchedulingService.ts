import { bookingService } from "../scheduling/bookingService";
import { recommendationService } from "../scheduling/recommendationService";

import type {
  AvailabilityRequest,
  BookingResult,
  ScheduleEvent,
} from "../scheduling/schedulingTypes";

import type {
  Appointment,
  AppointmentStatus,
} from "./appointmentTypes";

/**
 * Converts an Appointment into a ScheduleEvent.
 * This is the bridge between the Appointment module
 * and the Scheduling Engine.
 */
export function appointmentToScheduleEvent(
  appointment: Appointment,
): ScheduleEvent {
  return {
    id: appointment.id,

    type: "grooming",

    status: mapStatus(
      appointment.status,
    ),

    title:
      appointment.serviceName ??
      "Grooming Appointment",

    customerId:
      appointment.customerId,

    petIds: [
      appointment.petId,
    ],

    resourceIds: appointment.assignedStaff
    ? [appointment.assignedStaff]
    : [],

    referenceId:
      appointment.id,

    start: `${appointment.appointmentDate}T${appointment.startTime}:00`,

    end: `${appointment.appointmentDate}T${appointment.endTime}:00`,

    notes:
      appointment.notes,
  };
}

/**
 * Creates a scheduled appointment.
 */
export function createScheduledAppointment(
  appointment: Appointment,
): BookingResult {
  return bookingService.create({
    event:
      appointmentToScheduleEvent(
        appointment,
      ),
  });
}

/**
 * Updates an appointment.
 */
export function updateScheduledAppointment(
  appointment: Appointment,
): BookingResult {
  return bookingService.update(
    appointmentToScheduleEvent(
      appointment,
    ),
  );
}

/**
 * Moves appointment.
 */
export function moveAppointment(
  id: string,
  start: string,
  end: string,
): BookingResult {
  return bookingService.move(
    id,
    start,
    end,
  );
}

/**
 * Returns available slots.
 */
export function getAvailableAppointments(
  request: AvailabilityRequest,
) {
  return recommendationService.recommendAppointment(
    request,
    "Full Groom",
  );
}

/**
 * Future checkout booking.
 */
export function recommendCheckoutAppointment(
  request: AvailabilityRequest,
  serviceName: string,
) {
  return recommendationService.recommendCheckoutAppointment(
    serviceName,
    request,
  );
}

/**
 * Appointment status mapping.
 */
function mapStatus(
  status: AppointmentStatus,
) {
  switch (status) {
    case "Completed":
      return "completed";

    case "Cancelled":
      return "cancelled";

    case "Checked In":
      return "checked-in";

    case "Scheduled":
      return "pending";

    default:
      return "confirmed";
  }
}