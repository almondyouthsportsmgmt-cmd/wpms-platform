import { useMemo } from "react";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

import {
  getEventColor,
  getStatusOpacity,
} from "../calendarEventColors";

import "../calendar.css";

interface GroomerResource {
  id: string;
  name: string;
}

interface DayCalendarProps {
  date: Date;
  events: ScheduleEvent[];
  groomers: GroomerResource[];
  onEventClick?: (
    event: ScheduleEvent,
  ) => void;
}

const HOURS = Array.from(
  { length: 12 },
  (_, i) => i + 8,
);

function isSameDay(
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

export default function DayCalendar({
  date,
  events,
  groomers,
  onEventClick,
}: DayCalendarProps) {
  const dayEvents = useMemo(
    () =>
      events.filter((event) =>
        isSameDay(
          new Date(event.start),
          date,
        ),
      ),
    [events, date],
  );

  return (
    <div className="day-calendar">

      <div className="day-header">

        <div className="day-time-header">
          Time
        </div>

        {groomers.map((groomer) => (
          <div
            key={groomer.id}
            className="day-groomer-header"
          >
            {groomer.name}
          </div>
        ))}

      </div>

      {HOURS.map((hour) => (
        <div
          key={hour}
          className="day-row"
        >
          <div className="day-hour">

            {hour > 12
              ? `${hour - 12}:00 PM`
              : `${hour}:00 AM`}

          </div>

          {groomers.map((groomer) => {
            const appointments =
              dayEvents.filter(
                (event) => {
                  const start =
                    new Date(
                      event.start,
                    );

                  return (
                    event.resourceIds.includes(
                      groomer.id,
                    ) &&
                    start.getHours() ===
                      hour
                  );
                },
              );

            return (
              <div
                key={`${groomer.id}-${hour}`}
                className="day-slot"
              >
                {appointments.map(
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
                        className="day-event"
                        style={{
                          background:
                            color.background,

                          color:
                            color.text,

                          borderLeft:
                            `5px solid ${color.border}`,

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
                        <div className="day-event-title">
                          {event.title}
                        </div>

                        <div className="day-event-time">
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
                        </div>

                        <div className="day-event-pets">
                          {event.petIds.length}
                          {" "}
                          Pet
                          {event.petIds.length !==
                          1
                            ? "s"
                            : ""}
                        </div>

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