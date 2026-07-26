import type {
  AvailabilityRequest,
  AvailabilityResult,
  BookingRequest,
  BookingResult,
  Conflict,
  ConflictResult,
  ScheduleEvent,
} from "./schedulingTypes";

import { getAvailableSlots } from "./availabilityService";
import { detectConflicts } from "./conflictService";

class ScheduleEngine {
  private events: ScheduleEvent[] = [];

  /**
   * Replace in-memory events.
   * Later this will come from Supabase.
   */
  load(events: ScheduleEvent[]) {
    this.events = [...events];
  }

  /**
   * Return all scheduled events.
   */
  getEvents(): ScheduleEvent[] {
    return [...this.events];
  }

  /**
   * Find a single event.
   */
  getEvent(id: string): ScheduleEvent | undefined {
    return this.events.find((event) => event.id === id);
  }

  /**
   * Get available time slots.
   */
  getAvailability(
    request: AvailabilityRequest,
  ): AvailabilityResult {
    return getAvailableSlots(request, this.events);
  }

  /**
   * Validate resources before booking.
   */
  validate(
    event: ScheduleEvent,
  ): ConflictResult {
    return detectConflicts(
      event,
      this.events,
    );
  }

  /**
   * Book a new event.
   */
  book(
    request: BookingRequest,
  ): BookingResult {
    const conflicts = detectConflicts(
      request.event,
      this.events,
    );

    if (conflicts.hasConflict) {
      return {
        success: false,
        conflicts: conflicts.conflicts,
      };
    }

    this.events.push(request.event);

    return {
      success: true,
      conflicts: [],
      event: request.event,
    };
  }

  /**
   * Update an existing event.
   */
  update(
    event: ScheduleEvent,
  ): BookingResult {
    const remaining = this.events.filter(
      (item) => item.id !== event.id,
    );

    const conflicts = detectConflicts(
      event,
      remaining,
    );

    if (conflicts.hasConflict) {
      return {
        success: false,
        conflicts: conflicts.conflicts,
      };
    }

    this.events = [
      ...remaining,
      event,
    ];

    return {
      success: true,
      conflicts: [],
      event,
    };
  }

  /**
   * Remove an event.
   */
  delete(id: string): void {
    this.events = this.events.filter(
      (event) => event.id !== id,
    );
  }

  /**
   * Move an event.
   */
  move(
    id: string,
    start: string,
    end: string,
  ): BookingResult {
    const existing = this.getEvent(id);

    if (!existing) {
      return {
        success: false,
        conflicts: [],
      };
    }

    return this.update({
      ...existing,
      start,
      end,
    });
  }

  /**
   * Determine if a resource is free.
   */
  isResourceAvailable(
    resourceId: string,
    start: string,
    end: string,
  ): boolean {
    return !this.events.some((event) => {
      if (!event.resourceIds.includes(resourceId)) {
        return false;
      }

      return (
        new Date(start) < new Date(event.end) &&
        new Date(end) > new Date(event.start)
      );
    });
  }

  /**
   * Return every event assigned
   * to a specific resource.
   */
  getResourceSchedule(
    resourceId: string,
  ): ScheduleEvent[] {
    return this.events.filter((event) =>
      event.resourceIds.includes(resourceId),
    );
  }

  /**
   * Clear schedule.
   * Useful during testing.
   */
  clear() {
    this.events = [];
  }
}

export const scheduleEngine =
  new ScheduleEngine();