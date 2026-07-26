import { useMemo } from "react";
import type { ScheduleEvent } from "../../scheduling/schedulingTypes";
import type { CalendarMoveResult } from "../calendarMoveTypes";
import type { CalendarViewSettings } from "../calendarViewSettings";
import CalendarDropZone from "./CalendarDropZone";
import CalendarEventCard from "./CalendarEventCard";
import { positionOverlappingEvents } from "./calendarOverlap";

type Props = {
  weekStart: Date;
  events: ScheduleEvent[];
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

const SLOT_HEIGHT = 22;

function weekDays(value: Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function touchesDay(event: ScheduleEvent, day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return new Date(event.start) < end &&
    new Date(event.end) > start;
}

export default function WeekCalendar({
  weekStart,
  events,
  settings,
  onEventClick,
  onMove,
  onMoveError,
}: Props) {
  const days = useMemo(
    () => weekDays(weekStart),
    [weekStart],
  );

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

  function clamp(value: number) {
    return Math.max(0, Math.min(slotCount, value));
  }

  return (
    <div className="calendar-time-view">
      <div
        className="calendar-time-header"
        style={{
          gridTemplateColumns:
            "72px repeat(7, minmax(175px, 1fr))",
        }}
      >
        <div />
        {days.map((day) => (
          <div key={day.toISOString()}>
            {day.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        ))}
      </div>

      <div
        className="calendar-time-grid"
        style={{
          gridTemplateColumns:
            "72px repeat(7, minmax(175px, 1fr))",
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

        {days.flatMap((day, dayIndex) => {
          const displayedDayStart = new Date(day);
          displayedDayStart.setHours(startHour, 0, 0, 0);

          return Array.from(
            { length: slotCount },
            (_, slot) => {
              const start = new Date(
                displayedDayStart.getTime() +
                  slot * slotMilliseconds,
              );

              return (
                <CalendarDropZone
                  key={`${day.toISOString()}-${slot}`}
                  start={start}
                  onMove={onMove}
                  onMoveError={onMoveError}
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: slot + 1,
                  }}
                />
              );
            },
          );
        })}

        {days.flatMap((day, dayIndex) => {
          const displayedDayStart = new Date(day);
          displayedDayStart.setHours(startHour, 0, 0, 0);

          const displayedDayEnd = new Date(day);
          if (endHour === 24) {
            displayedDayEnd.setHours(24, 0, 0, 0);
          } else {
            displayedDayEnd.setHours(endHour, 0, 0, 0);
          }

          const dayEvents = events.filter((event) =>
            touchesDay(event, day),
          );

          return positionOverlappingEvents(dayEvents).map(
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

              const startSlot = clamp(
                Math.floor(
                  (visibleStart.getTime() -
                    displayedDayStart.getTime()) /
                    slotMilliseconds,
                ),
              );

              const endSlot = Math.max(
                startSlot + 1,
                clamp(
                  Math.ceil(
                    (visibleEnd.getTime() -
                      displayedDayStart.getTime()) /
                      slotMilliseconds,
                  ),
                ),
              );

              const width = 100 / columnCount;
              const left = width * column;

              return (
                <CalendarEventCard
                  key={`${event.id}-${day.toISOString()}`}
                  event={event}
                  onClick={onEventClick}
                  className="calendar-time-event-positioned"
                  style={{
                    gridColumn: dayIndex + 2,
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
