import {
  listAppointments,
  updateAppointment,
} from "../appointments/appointmentService";
import {
  listBoardingStays,
  updateBoardingStay,
} from "../boarding/boardingService";
import type { CompletedCalendarMove } from "./calendarMoveTypes";

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

function sourceId(move: CompletedCalendarMove) {
  if (move.event.referenceId) return move.event.referenceId;

  return move.event.id
    .replace(/^appointment-/, "")
    .replace(/^boarding-checkin-/, "")
    .replace(/^boarding-checkout-/, "")
    .replace(/^boarding-/, "");
}

export async function revertCalendarMove(
  move: CompletedCalendarMove,
) {
  const id = sourceId(move);

  if (move.event.type === "grooming") {
    const appointments = await listAppointments();
    const current = appointments.find(
      (appointment) => appointment.id === id,
    );

    if (!current) {
      throw new Error(
        "The appointment could not be restored because its record was not found.",
      );
    }

    const previousStaff =
      move.event.resourceIds.find(
        (resourceId) =>
          resourceId !== "unassigned" &&
          !resourceId.startsWith("kennel:"),
      ) ?? "";

    await updateAppointment(current.id, {
      ...current,
      appointmentDate: localDate(move.oldStart),
      startTime: localTime(move.oldStart),
      endTime: localTime(move.oldEnd),
      assignedStaff: previousStaff,
    });

    return;
  }

  if (
    move.event.type === "boarding" ||
    move.event.type === "boarding-checkin" ||
    move.event.type === "boarding-checkout"
  ) {
    const stays = await listBoardingStays();
    const current = stays.find((stay) => stay.id === id);

    if (!current) {
      throw new Error(
        "The boarding stay could not be restored because its record was not found.",
      );
    }

    const previousKennelFromNotes =
      move.event.notes
        ?.split(" · ")
        .find((part) => part.startsWith("Kennel: "))
        ?.replace(/^Kennel: /, "") ?? "";

    const previousKennel =
      move.event.resourceIds
        .find((resourceId) =>
          resourceId.startsWith("kennel:"),
        )
        ?.replace(/^kennel:/, "") ??
      previousKennelFromNotes;

    await updateBoardingStay(current.id, {
      ...current,
      checkInDate: localDate(move.oldStart),
      checkInTime: localTime(move.oldStart),
      checkOutDate: localDate(move.oldEnd),
      checkOutTime: localTime(move.oldEnd),
      kennelName: previousKennel,
    });

    return;
  }

  throw new Error(
    "This calendar event type cannot be restored yet.",
  );
}
