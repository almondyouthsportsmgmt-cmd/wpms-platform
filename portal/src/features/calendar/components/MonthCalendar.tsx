import { useMemo } from "react";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

import {
  getEventColor,
  getStatusOpacity,
} from "../calendarEventColors";

import "../calendar.css";

interface MonthCalendarProps {
  month: Date;
  events: ScheduleEvent[];
  onEventClick?: (
    event: ScheduleEvent,
  ) => void;
}

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  events: ScheduleEvent[];
}

function sameDay(
  left: Date,
  right: Date,
) {
  return (
    left.getFullYear() ===
      right.getFullYear() &&
    left.getMonth() ===
      right.getMonth() &&
    left.getDate() ===
      right.getDate()
  );
}

export default function MonthCalendar({
  month,
  events,
  onEventClick,
}: MonthCalendarProps) {
  const days = useMemo<
    CalendarDay[]
  >(() => {
    const first = new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
    );

    const last = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    );

    const start = new Date(first);

    start.setDate(
      first.getDate() - first.getDay(),
    );

    const finish = new Date(last);

    finish.setDate(
      last.getDate() +
        (6 - last.getDay()),
    );

    const result: CalendarDay[] = [];

    const cursor =
      new Date(start);

    while (cursor <= finish) {
      result.push({
        date: new Date(cursor),

        inCurrentMonth:
          cursor.getMonth() ===
          month.getMonth(),

        events: events.filter(
          (event) =>
            sameDay(
              new Date(
                event.start,
              ),
              cursor,
            ),
        ),
      });

      cursor.setDate(
        cursor.getDate() + 1,
      );
    }

    return result;
  }, [month, events]);

  return (
    <div className="calendar-month">

      <div className="calendar-weekdays">

        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (
          <div
            key={day}
            className="calendar-weekday"
          >
            {day}
          </div>
        ))}

      </div>

      <div className="calendar-month-grid">

        {days.map((day) => (
          <div
            key={day.date.toISOString()}
            className={`calendar-day ${
              day.inCurrentMonth
                ? ""
                : "calendar-day-muted"
            }`}
          >
            <div className="calendar-day-number">
              {day.date.getDate()}
            </div>

            <div className="calendar-day-events">

              {day.events.map(
                (event) => {
                  const color =
                    getEventColor(
                      event.type,
                    );

                  return (
                    <button
                      key={event.id}
                      type="button"
                      className="calendar-event-chip"
                      style={{
                        background:
                          color.background,

                        borderLeft:
                          `5px solid ${color.border}`,

                        color:
                          color.text,

                        opacity:
                          getStatusOpacity(
                            event.status,
                          ),
                      }}
                      onClick={() =>
                        onEventClick?.(
                          event,
                        )
                      }
                    >
                      <strong>
                        {new Date(
                          event.start,
                        ).toLocaleTimeString(
                          [],
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit",
                          },
                        )}
                      </strong>

                      <span>
                        {event.title}
                      </span>
                    </button>
                  );
                },
              )}

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}