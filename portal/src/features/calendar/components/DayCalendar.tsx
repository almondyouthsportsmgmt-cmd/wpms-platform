import { useMemo } from "react";
import type { ScheduleEvent } from "../../scheduling/schedulingTypes";
import type { CalendarMoveResult } from "../calendarMoveTypes";
import type { CalendarViewSettings } from "../calendarViewSettings";
import CalendarDropZone from "./CalendarDropZone";
import CalendarEventCard from "./CalendarEventCard";
import { positionOverlappingEvents } from "./calendarOverlap";

type Resource = { id: string; name: string };

type Props = {
  date: Date;
  events: ScheduleEvent[];
  resources: Resource[];
  settings: CalendarViewSettings;
  onEventClick?: (event: ScheduleEvent) => void;
  onMove: (
    event: ScheduleEvent,
    start: Date,
    end: Date,
    resourceId?: string,
  ) => Promise<CalendarMoveResult>;
  onMoveError?: (message: string) => void;
};

const SLOT_HEIGHT = 24;

function sameDay(left: Date, right: Date) {
  return left.toDateString() === right.toDateString();
}

export default function DayCalendar({
  date,
  events,
  resources,
  settings,
  onEventClick,
  onMove,
  onMoveError,
}: Props) {
  const startHour = settings.showClosedHours
    ? 0
    : settings.openingHour;
  const endHour = settings.showClosedHours
    ? 24
    : settings.closingHour;
  const slotMinutes = settings.slotMinutes;
  const slotCount =
    ((endHour - startHour) * 60) / slotMinutes;
  const slotMilliseconds = slotMinutes * 60_000;

  const displayedDayStart = useMemo(() => {
    const value = new Date(date);
    value.setHours(startHour, 0, 0, 0);
    return value;
  }, [date, startHour]);

  const displayedDayEnd = useMemo(() => {
    const value = new Date(date);

    if (endHour === 24) {
      value.setHours(24, 0, 0, 0);
    } else {
      value.setHours(endHour, 0, 0, 0);
    }

    return value;
  }, [date, endHour]);

  const dayEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          sameDay(new Date(event.start), date) ||
          (new Date(event.start) < displayedDayEnd &&
            new Date(event.end) > displayedDayStart),
      ),
    [date, displayedDayEnd, displayedDayStart, events],
  );

  const columns = `86px repeat(${Math.max(
    resources.length,
    1,
  )}, minmax(210px, 1fr))`;

  function clamp(value: number) {
    return Math.max(0, Math.min(slotCount, value));
  }

  function slotFromStart(value: Date, roundUp = false) {
    const elapsed =
      (value.getTime() - displayedDayStart.getTime()) /
      slotMilliseconds;

    return clamp(
      roundUp ? Math.ceil(elapsed) : Math.floor(elapsed),
    );
  }

  return (
    <div className="calendar-time-view">
      <div
        className="calendar-time-header"
        style={{ gridTemplateColumns: columns }}
      >
        <div />
        {resources.map((resource) => (
          <div key={resource.id}>{resource.name}</div>
        ))}
      </div>

      <div
        className="calendar-time-grid"
        style={{
          gridTemplateColumns: columns,
          gridTemplateRows: `repeat(${slotCount}, ${SLOT_HEIGHT}px)`,
          ["--calendar-slot-height" as string]: `${SLOT_HEIGHT}px`,
        }}
      >
        {Array.from(
          { length: endHour - startHour + 1 },
          (_, index) => startHour + index,
        ).map((hour) => (
          <div
            key={hour}
            className="calendar-time-label"
            style={{
              gridColumn: 1,
              gridRow:
                ((hour - startHour) * 60) /
                  slotMinutes +
                1,
            }}
          >
            {new Date(2000, 0, 1, hour % 24).toLocaleTimeString(
              [],
              { hour: "numeric" },
            )}
          </div>
        ))}

        {resources.flatMap((resource, resourceIndex) =>
          Array.from({ length: slotCount }, (_, slot) => {
            const start = new Date(
              displayedDayStart.getTime() +
                slot * slotMilliseconds,
            );

            return (
              <CalendarDropZone
                key={`${resource.id}-${slot}`}
                start={start}
                resourceId={resource.id}
                onMove={onMove}
                onMoveError={onMoveError}
                style={{
                  gridColumn: resourceIndex + 2,
                  gridRow: slot + 1,
                }}
              />
            );
          }),
        )}

        {resources.flatMap((resource, resourceIndex) => {
          const resourceEvents = dayEvents.filter((event) =>
            event.resourceIds.includes(resource.id),
          );

          return positionOverlappingEvents(resourceEvents).map(
            ({ event, column, columnCount }) => {
              const visibleStart = new Date(
                Math.max(
                  new Date(event.start).getTime(),
                  displayedDayStart.getTime(),
                ),
              );

              const visibleEnd = new Date(
                Math.min(
                  new Date(event.end).getTime(),
                  displayedDayEnd.getTime(),
                ),
              );

              const startSlot = slotFromStart(
                visibleStart,
                false,
              );

              const endSlot = Math.max(
                startSlot + 1,
                slotFromStart(visibleEnd, true),
              );

              const width = 100 / columnCount;
              const left = width * column;

              return (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  className="calendar-time-event-positioned"
                  style={{
                    gridColumn: resourceIndex + 2,
                    gridRow: `${startSlot + 1} / ${endSlot + 1}`,
                    width: `calc(${width}% - 6px)`,
                    marginLeft: `calc(${left}% + 3px)`,
                  }}
                />
              );
            },
          );
        })}
      </div>
    </div>
  );
}
