import type {
  AvailabilityRequest,
  AvailabilityResult,
  ScheduleEvent,
  TimeSlot,
} from "./schedulingTypes";

const SHOP_OPEN_HOUR = 8;
const SHOP_CLOSE_HOUR = 17;
const SLOT_INTERVAL_MINUTES = 30;

function toDate(value: string): Date {
  return new Date(value);
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function sameDay(date: Date, target: string): boolean {
  return date.toISOString().slice(0, 10) === target;
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

function resourcesOverlap(
  left: string[],
  right: string[],
): boolean {
  return left.some((resource) => right.includes(resource));
}

export function getAvailableSlots(
  request: AvailabilityRequest,
  events: ScheduleEvent[],
): AvailabilityResult {
  const slots: TimeSlot[] = [];

  const base = new Date(`${request.date}T00:00:00`);

  const dayEvents = events.filter((event) => {
    if (
      request.excludeEventId &&
      event.id === request.excludeEventId
    ) {
      return false;
    }

    return sameDay(toDate(event.start), request.date);
  });

  for (
    let hour = SHOP_OPEN_HOUR;
    hour < SHOP_CLOSE_HOUR;
    hour++
  ) {
    for (
      let minute = 0;
      minute < 60;
      minute += SLOT_INTERVAL_MINUTES
    ) {
      const slotStart = new Date(base);

      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = addMinutes(
        slotStart,
        request.durationMinutes,
      );

      // Don't allow appointments past closing time
      if (
        slotEnd.getHours() > SHOP_CLOSE_HOUR ||
        (slotEnd.getHours() === SHOP_CLOSE_HOUR &&
          slotEnd.getMinutes() > 0)
      ) {
        continue;
      }

      let available = true;
      let reason: string | undefined;

      for (const event of dayEvents) {
        if (
          !resourcesOverlap(
            request.resourceIds,
            event.resourceIds,
          )
        ) {
          continue;
        }

        if (
          overlaps(
            slotStart,
            slotEnd,
            toDate(event.start),
            toDate(event.end),
          )
        ) {
          available = false;
          reason = `${event.title} (${event.start} - ${event.end})`;
          break;
        }
      }

      slots.push({
        start: formatDate(slotStart),
        end: formatDate(slotEnd),
        available,
        reason,
      });
    }
  }

  return {
    success: true,
    slots,
  };
}