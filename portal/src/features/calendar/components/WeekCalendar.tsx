import { useMemo } from "react";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

import {
  getEventColor,
  getStatusOpacity,
} from "../calendarEventColors";

import "../calendar.css";

interface WeekCalendarProps {
  weekStart: Date;
  events: ScheduleEvent[];
  onEventClick?: (
    event: ScheduleEvent,
  ) => void;
}

const HOURS = Array.from(
  { length: 12 },
  (_, i) => i + 8,
);

function beginningOfWeek(
  date: Date,
) {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  d.setDate(
    d.getDate() - d.getDay(),
  );

  return d;
}

export default function WeekCalendar({
  weekStart,
  events,
  onEventClick,
}: WeekCalendarProps) {
  const week = useMemo(() => {
    const start =
      beginningOfWeek(
        weekStart,
      );

    return Array.from(
      { length: 7 },
      (_, i) => {
        const day =
          new Date(start);

        day.setDate(
          start.getDate() + i,
        );

        return day;
      },
    );
  }, [weekStart]);

  return (
    <div className="week-calendar">

      <div className="week-header">

        <div className="week-time-column" />

        {week.map((day) => (
          <div
            key={day.toISOString()}
            className="week-day-header"
          >
            <strong>
              {day.toLocaleDateString(
                [],
                {
                  weekday:
                    "short",
                },
              )}
            </strong>

            <div>
              {day.getMonth() + 1}/
              {day.getDate()}
            </div>

          </div>
        ))}

      </div>

      {HOURS.map((hour) => (
        <div
          className="week-row"
          key={hour}
        >
          <div className="week-hour">

            {hour > 12
              ? `${hour - 12}:00 PM`
              : `${hour}:00 AM`}

          </div>

          {week.map((day) => {
            const slotEvents =
              events.filter(
                (event) => {
                  const start =
                    new Date(
                      event.start,
                    );

                  return (
                    start.getFullYear() ===
                      day.getFullYear() &&
                    start.getMonth() ===
                      day.getMonth() &&
                    start.getDate() ===
                      day.getDate() &&
                    start.getHours() ===
                      hour
                  );
                },
              );

            return (
              <div
                key={`${day.toISOString()}-${hour}`}
                className="week-cell"
              >
                {slotEvents.map(
                  (event) => {
                    const color =
                      getEventColor(
                        event.type,
                      );

                    return (
                      <button
                        key={
                          event.id
                        }
                        type="button"
                        className="week-event"
                        style={{
                          background:
                            color.background,

                          color:
                            color.text,

                          borderLeft:
                            `4px solid ${color.border}`,

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
                          {event.title}
                        </strong>

                        <small>
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

                          {" - "}

                          {new Date(
                            event.end,
                          ).toLocaleTimeString(
                            [],
                            {
                              hour:
                                "2-digit",
                              minute:
                                "2-digit",
                            },
                          )}
                        </small>

                      </button>
                    );
                  },
                )}
              </div>
            );
          })}

        </div>
      ))}

    </div>
  );
}