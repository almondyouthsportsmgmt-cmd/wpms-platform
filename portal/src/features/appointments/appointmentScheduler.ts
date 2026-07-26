import type {
  Appointment,
  AppointmentInput,
} from "../appointments/appointmentTypes";

import {
  createAppointment,
  updateAppointment,
} from "../appointments/appointmentService";

import { scheduleEngine } from "./../scheduling/scheduleEngine";

import type {
  BookingResult,
  ScheduleEvent,
} from "./../scheduling/schedulingTypes";

function toScheduleEvent(
  appointment: Appointment,
): ScheduleEvent {
  return {
    id: appointment.id,

    type: "grooming",

    status: mapStatus(
      appointment.status,
    ),

    title:
      appointment.serviceName,

    customerId:
      appointment.customerId,

    petIds: [
      appointment.petId,
    ],

    resourceIds:
      appointment.assignedStaff
        ? [
            appointment.assignedStaff,
          ]
        : [],

    referenceId:
      appointment.id,

    start:
      `${appointment.appointmentDate}T${appointment.startTime}:00`,

    end:
      `${appointment.appointmentDate}T${appointment.endTime}:00`,

    notes:
      appointment.notes,
  };
}

function mapStatus(
  status: Appointment["status"],
) {
  switch (status) {
    case "Scheduled":
      return "pending";

    case "Confirmed":
      return "confirmed";

    case "Checked In":
      return "checked-in";

    case "Completed":
      return "completed";

    case "Cancelled":
    case "No Show":
      return "cancelled";

    default:
      return "confirmed";
  }
}

class AppointmentScheduler {
  async create(
    input: AppointmentInput,
  ) {
    /**
     * Save appointment first.
     */

    const appointment =
      await createAppointment(
        input,
      );

    /**
     * Register with scheduling engine.
     */

    const result: BookingResult =
      scheduleEngine.book({
        event:
          toScheduleEvent(
            appointment,
          ),
      });

    if (!result.success) {
      throw new Error(
        result.conflicts
          .map(
            (x) => x.reason,
          )
          .join("\n"),
      );
    }

    return appointment;
  }

  async update(
    id: string,
    input: AppointmentInput,
  ) {
    const appointment =
      await updateAppointment(
        id,
        input,
      );

    const result =
      scheduleEngine.update(
        toScheduleEvent(
          appointment,
        ),
      );

    if (!result.success) {
      throw new Error(
        result.conflicts
          .map(
            (x) => x.reason,
          )
          .join("\n"),
      );
    }

    return appointment;
  }

  validate(
    appointment: Appointment,
  ) {
    return scheduleEngine.validate(
      toScheduleEvent(
        appointment,
      ),
    );
  }

  availability(
    appointment: Appointment,
    duration: number,
  ) {
    return scheduleEngine.getAvailability(
      {
        date:
          appointment.appointmentDate,

        durationMinutes:
          duration,

        resourceIds:
          appointment.assignedStaff
            ? [
                appointment.assignedStaff,
              ]
            : [],

        eventType:
          "grooming",

        excludeEventId:
          appointment.id,
      },
    );
  }

  move(
    id: string,
    start: string,
    end: string,
  ) {
    return scheduleEngine.move(
      id,
      start,
      end,
    );
  }
}

export const appointmentScheduler =
  new AppointmentScheduler();