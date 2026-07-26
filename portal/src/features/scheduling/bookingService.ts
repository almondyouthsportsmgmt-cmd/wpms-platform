import { scheduleEngine } from "./scheduleEngine";

import type {
  BookingRequest,
  BookingResult,
  ScheduleEvent,
} from "./schedulingTypes";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `schedule-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

export class BookingService {
  /**
   * Creates a new schedule event.
   */
  create(
    request: BookingRequest,
  ): BookingResult {
    const event: ScheduleEvent = {
      ...request.event,
      id: request.event.id || generateId(),
    };

    return scheduleEngine.book({
      event,
    });
  }

  /**
   * Updates an existing event.
   */
  update(
    event: ScheduleEvent,
  ): BookingResult {
    return scheduleEngine.update(event);
  }

  /**
   * Deletes an event.
   */
  delete(id: string): void {
    scheduleEngine.delete(id);
  }

  /**
   * Moves an appointment.
   */
  move(
    id: string,
    start: string,
    end: string,
  ): BookingResult {
    return scheduleEngine.move(
      id,
      start,
      end,
    );
  }

  /**
   * Returns an event.
   */
  get(
    id: string,
  ): ScheduleEvent | undefined {
    return scheduleEngine.getEvent(id);
  }

  /**
   * Returns all scheduled events.
   */
  getAll(): ScheduleEvent[] {
    return scheduleEngine.getEvents();
  }

  /**
   * Duplicate an event.
   * Useful for recurring appointments later.
   */
  duplicate(
    id: string,
    newStart: string,
    newEnd: string,
  ): BookingResult {
    const existing =
      scheduleEngine.getEvent(id);

    if (!existing) {
      return {
        success: false,
        conflicts: [],
      };
    }

    return this.create({
      event: {
        ...existing,
        id: "",
        start: newStart,
        end: newEnd,
      },
    });
  }

  /**
   * Cancel appointment.
   */
  cancel(
    id: string,
  ): BookingResult {
    const existing =
      scheduleEngine.getEvent(id);

    if (!existing) {
      return {
        success: false,
        conflicts: [],
      };
    }

    return this.update({
      ...existing,
      status: "cancelled",
    });
  }

  /**
   * Complete appointment.
   */
  complete(
    id: string,
  ): BookingResult {
    const existing =
      scheduleEngine.getEvent(id);

    if (!existing) {
      return {
        success: false,
        conflicts: [],
      };
    }

    return this.update({
      ...existing,
      status: "completed",
    });
  }

  /**
   * Check in appointment.
   */
  checkIn(
    id: string,
  ): BookingResult {
    const existing =
      scheduleEngine.getEvent(id);

    if (!existing) {
      return {
        success: false,
        conflicts: [],
      };
    }

    return this.update({
      ...existing,
      status: "checked-in",
    });
  }

  /**
   * Reschedule.
   */
  reschedule(
    id: string,
    start: string,
    end: string,
  ): BookingResult {
    return this.move(
      id,
      start,
      end,
    );
  }
}

export const bookingService =
  new BookingService();