import { useCallback } from "react";
import {
  listAppointments,
  updateAppointment,
} from "../appointments/appointmentService";
import {
  listBoardingStays,
  updateBoardingStay,
} from "../boarding/boardingService";
import type { ScheduleEvent } from "../scheduling/schedulingTypes";
import type {
  CalendarMoveResult,
  CompletedCalendarMove,
} from "./calendarMoveTypes";

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localTime(value: Date) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(
    value.getMinutes(),
  ).padStart(2, "0")}`;
}

function overlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB;
}

function sourceId(event: ScheduleEvent) {
  if (event.referenceId) return event.referenceId;

  return event.id
    .replace(/^appointment-/, "")
    .replace(/^boarding-checkin-/, "")
    .replace(/^boarding-checkout-/, "")
    .replace(/^boarding-/, "");
}

export function useCalendarDragDrop(
  reload: () => Promise<void>,
  onMoved: (move: CompletedCalendarMove) => void,
) {
  const moveEvent = useCallback(
    async (
      event: ScheduleEvent,
      newStart: Date,
      newEnd: Date,
      targetResourceId?: string,
    ): Promise<CalendarMoveResult> => {
      const oldStart = new Date(event.start);
      const oldEnd = new Date(event.end);
      const id = sourceId(event);

      if (event.type === "grooming") {
        const appointments = await listAppointments();
        const current = appointments.find(
          (appointment) => appointment.id === id,
        );

        if (!current) {
          return {
            success: false,
            conflicts: [{ reason: "Appointment record not found." }],
          };
        }

        const assignedStaff =
          targetResourceId &&
          !targetResourceId.startsWith("kennel:")
            ? targetResourceId === "unassigned"
              ? ""
              : targetResourceId
            : current.assignedStaff;

        const conflict = appointments.find((appointment) => {
          if (
            appointment.id === current.id ||
            ["Cancelled", "No Show"].includes(appointment.status)
          ) {
            return false;
          }

          if (
            !assignedStaff ||
            appointment.assignedStaff !== assignedStaff
          ) {
            return false;
          }

          const existingStart = new Date(
            `${appointment.appointmentDate}T${appointment.startTime}:00`,
          );
          const existingEnd = new Date(
            `${appointment.appointmentDate}T${appointment.endTime}:00`,
          );

          return overlap(
            newStart,
            newEnd,
            existingStart,
            existingEnd,
          );
        });

        if (conflict) {
          return {
            success: false,
            conflicts: [
              {
                reason: `${assignedStaff} is already booked from ${conflict.startTime} to ${conflict.endTime}.`,
              },
            ],
          };
        }

        await updateAppointment(current.id, {
          ...current,
          appointmentDate: localDate(newStart),
          startTime: localTime(newStart),
          endTime: localTime(newEnd),
          assignedStaff,
        });
      } else if (
        event.type === "boarding" ||
        event.type === "boarding-checkin" ||
        event.type === "boarding-checkout"
      ) {
        const stays = await listBoardingStays();
        const current = stays.find((stay) => stay.id === id);

        if (!current) {
          return {
            success: false,
            conflicts: [{ reason: "Boarding record not found." }],
          };
        }

        const kennelName =
          targetResourceId === "boarding"
            ? current.kennelName
            : targetResourceId?.startsWith("kennel:")
              ? targetResourceId.replace(/^kennel:/, "")
              : current.kennelName;

        const conflict = stays.find((stay) => {
          if (
            stay.id === current.id ||
            stay.status === "Cancelled" ||
            !kennelName ||
            stay.kennelName !== kennelName
          ) {
            return false;
          }

          const existingStart = new Date(
            `${stay.checkInDate}T${stay.checkInTime}:00`,
          );
          const existingEnd = new Date(
            `${stay.checkOutDate}T${stay.checkOutTime}:00`,
          );

          return overlap(
            newStart,
            newEnd,
            existingStart,
            existingEnd,
          );
        });

        if (conflict) {
          return {
            success: false,
            conflicts: [
              {
                reason: `${kennelName} is already reserved from ${conflict.checkInDate} ${conflict.checkInTime} through ${conflict.checkOutDate} ${conflict.checkOutTime}.`,
              },
            ],
          };
        }

        await updateBoardingStay(current.id, {
          ...current,
          checkInDate: localDate(newStart),
          checkInTime: localTime(newStart),
          checkOutDate: localDate(newEnd),
          checkOutTime: localTime(newEnd),
          kennelName,
        });
      } else {
        return {
          success: false,
          conflicts: [
            {
              reason: "This event type cannot be moved yet.",
            },
          ],
        };
      }

      await reload();

      onMoved({
        event,
        oldStart,
        oldEnd,
        newStart,
        newEnd,
      });

      return { success: true };
    },
    [onMoved, reload],
  );

  return { moveEvent };
}
