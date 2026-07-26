import { useMemo } from "react";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

import {
  getEventColor,
  getStatusOpacity,
} from "../calendarEventColors";

import CalendarDropZone from "../CalendarDropZone";
import DraggableCalendarEvent from "./DraggableCalendarEvent";

import "../calendar.css";

interface WeekCalendarProps {
  weekStart: Date;
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  onMove: (
    event: ScheduleEvent,
    start: Date,
    end: Date,
  ) => Promise<{
    success: boolean;
    conflicts?: Array<{ reason: string }>;
  }>;
  onMoveComplete?: (message: string) => void;
  onMoveError?: (message: string) => void;
}

const HOURS = Array.from(
  { length: 12 },
  (_, index) => index + 8,
);

function beginningOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatHour(hour: number) {
  if (hour === 12) return "12:00 PM";
  if (hour > 12) return `${hour - 12}:00 PM`;
  return `${hour}:00 AM`;
}

export default function WeekCalendar({
  weekStart,
  events,
  onEventClick,
  onMove,
  onMoveComplete,
  onMoveError,
}: WeekCalendarProps) {
  const week = useMemo(() => {
    const start = beginningOfWeek(weekStart);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
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
              {day.toLocaleDateString([], {
                weekday: "short",
              })}
            </strong>
            <div>
              {day.getMonth() + 1}/{day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {HOURS.map((hour) => (
        <div className="week-row" key={hour}>
          <div className="week-hour">
            {formatHour(hour)}
          </div>

          {week.map((day) => {
            const slotEvents = events.filter((event) => {
              const start = new Date(event.start);

              return (
                isSameDay(start, day) &&
                start.getHours() === hour
              );
            });

            return (
              <CalendarDropZone
                key={`${day.toISOString()}-${hour}`}
                date={day}
                hour={hour}
                className="week-cell"
                onMove={onMove}
                onMoveComplete={onMoveComplete}
                onMoveError={onMoveError}
              >
                {slotEvents.map((event) => {
                  const color = getEventColor(event.type);

                  return (
                    <DraggableCalendarEvent
                      key={event.id}
                      event={event}
                    >
                      <button
                        type="button"
                        className="week-event"
                        style={{
                          background: color.background,
                          color: color.text,
                          borderLeft: `4px solid ${color.border}`,
                          opacity: getStatusOpacity(
                            event.status,
                          ),
                        }}
                        onClick={() =>
                          onEventClick?.(event)
                        }
                      >
                        <strong>{event.title}</strong>
                        <small>
                          {new Date(
                            event.start,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" - "}
                          {new Date(
                            event.end,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </button>
                    </DraggableCalendarEvent>
                  );
                })}
              </CalendarDropZone>
            );
          })}
        </div>
      ))}
    </div>
  );
}
