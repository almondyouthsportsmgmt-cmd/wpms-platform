import { useMemo } from "react";
import type { ScheduleEvent } from "../../scheduling/schedulingTypes";
import type { CalendarMoveResult } from "../calendarMoveTypes";
import CalendarDropZone from "./CalendarDropZone";
import CalendarEventCard from "./CalendarEventCard";

type Props = {
  month: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onMove: (
    event: ScheduleEvent,
    start: Date,
    end: Date,
    resourceId?: string,
  ) => Promise<CalendarMoveResult>;
  onMoveError?: (message: string) => void;
};

function touchesDay(event: ScheduleEvent, day: Date) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return new Date(event.start) < end &&
    new Date(event.end) > start;
}

export default function MonthCalendar({
  month,
  events,
  onEventClick,
  onMove,
  onMoveError,
}: Props) {
  const days = useMemo(() => {
    const first = new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  return (
    <div className="calendar-month-v3">
      <div className="calendar-month-weekdays">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
          (day) => <div key={day}>{day}</div>,
        )}
      </div>

      <div className="calendar-month-grid-v3">
        {days.map((day) => {
          const start = new Date(day);
          start.setHours(9, 0, 0, 0);
          const dayEvents = events.filter((event) =>
            touchesDay(event, day),
          );

          return (
            <CalendarDropZone
              key={day.toISOString()}
              start={start}
              onMove={onMove}
              onMoveError={onMoveError}
              className={`calendar-month-day-v3 ${
                day.getMonth() === month.getMonth()
                  ? ""
                  : "is-outside"
              }`}
            >
              <header>{day.getDate()}</header>

              <div className="calendar-month-events-v3">
                {dayEvents.slice(0, 5).map((event) => (
                  <CalendarEventCard
                    key={`${event.id}-${day.toISOString()}`}
                    event={event}
                    compact
                    onClick={onEventClick}
                  />
                ))}

                {dayEvents.length > 5 && (
                  <span>+{dayEvents.length - 5} more</span>
                )}
              </div>
            </CalendarDropZone>
          );
        })}
      </div>
    </div>
  );
}
