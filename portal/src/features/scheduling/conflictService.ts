import type {
  Conflict,
  ConflictResult,
  ScheduleEvent,
} from "./schedulingTypes";

/**
 * Returns true if two time ranges overlap.
 */
function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

/**
 * Returns the shared resource ids between two events.
 */
function sharedResources(
  left: string[],
  right: string[],
): string[] {
  return left.filter((id) => right.includes(id));
}

/**
 * Detect scheduling conflicts for an event.
 */
export function detectConflicts(
  candidate: ScheduleEvent,
  existingEvents: ScheduleEvent[],
): ConflictResult {
  const conflicts: Conflict[] = [];

  const candidateStart = new Date(candidate.start);
  const candidateEnd = new Date(candidate.end);

  for (const existing of existingEvents) {
    // Ignore the same event during edits.
    if (existing.id === candidate.id) {
      continue;
    }

    const commonResources = sharedResources(
      candidate.resourceIds,
      existing.resourceIds,
    );

    // No shared resources means no conflict.
    if (commonResources.length === 0) {
      continue;
    }

    const existingStart = new Date(existing.start);
    const existingEnd = new Date(existing.end);

    if (
      !overlaps(
        candidateStart,
        candidateEnd,
        existingStart,
        existingEnd,
      )
    ) {
      continue;
    }

    // Create one conflict per shared resource.
    for (const resourceId of commonResources) {
      conflicts.push({
        resourceId,
        resourceName: resourceId, // resourceService will replace this later
        existingEventId: existing.id,
        existingEventTitle: existing.title,
        existingStart: existing.start,
        existingEnd: existing.end,
        reason: `${existing.title} already reserves this resource.`,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Returns true if the resource is available.
 */
export function isResourceAvailable(
  resourceId: string,
  start: string,
  end: string,
  events: ScheduleEvent[],
  ignoreEventId?: string,
): boolean {
  const startTime = new Date(start);
  const endTime = new Date(end);

  return !events.some((event) => {
    if (ignoreEventId && event.id === ignoreEventId) {
      return false;
    }

    if (!event.resourceIds.includes(resourceId)) {
      return false;
    }

    return overlaps(
      startTime,
      endTime,
      new Date(event.start),
      new Date(event.end),
    );
  });
}

/**
 * Returns every event using a specific resource.
 */
export function getResourceConflicts(
  resourceId: string,
  events: ScheduleEvent[],
): ScheduleEvent[] {
  return events.filter((event) =>
    event.resourceIds.includes(resourceId),
  );
}

/**
 * Validates an event against business rules.
 * Additional rules (shop hours, lunch, PTO, maintenance,
 * kennel capacity, cleanup buffers, etc.) will be added
 * here without changing the rest of the scheduling engine.
 */
export function validateEvent(
  candidate: ScheduleEvent,
  events: ScheduleEvent[],
): ConflictResult {
  return detectConflicts(candidate, events);
}