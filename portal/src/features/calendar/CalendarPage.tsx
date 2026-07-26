import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { useCalendar } from "./useCalendar";

import "./calendar.css";

function formatHeader(date: Date, view: "month" | "week" | "day") {
  switch (view) {
    case "month":
      return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });

    case "week":
      return `Week of ${date.toLocaleDateString()}`;

    default:
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
  }
}

function eventColor(type: string) {
  switch (type) {
    case "grooming":
      return "#22c55e";

    case "boarding":
      return "#3b82f6";

    case "boarding-checkin":
      return "#f59e0b";

    case "boarding-checkout":
      return "#fb923c";

    case "maintenance":
      return "#ef4444";

    default:
      return "#8b5cf6";
  }
}

export default function CalendarPage() {
  const {
    view,
    setView,

    selectedDate,

    previous,
    next,
    today,

    events,
    summary,
  } = useCalendar();

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          new Date(a.start).getTime() -
          new Date(b.start).getTime(),
      ),
    [events],
  );

  return (
    <div className="calendar-page">

      <div className="calendar-header">

        <div className="calendar-title">

          <CalendarDays size={28} />

          <div>

            <h1>Operations Calendar</h1>

            <span>
              Grooming & Boarding
            </span>

          </div>

        </div>

        <div className="calendar-toolbar">

          <button onClick={previous}>
            <ChevronLeft size={18} />
          </button>

          <button onClick={today}>
            Today
          </button>

          <button onClick={next}>
            <ChevronRight size={18} />
          </button>

          <select
            value={view}
            onChange={(e) =>
              setView(
                e.target.value as
                  | "month"
                  | "week"
                  | "day",
              )
            }
          >
            <option value="month">
              Month
            </option>

            <option value="week">
              Week
            </option>

            <option value="day">
              Day
            </option>

          </select>

        </div>

      </div>

      <div className="calendar-current-date">
        {formatHeader(selectedDate, view)}
      </div>

      <div className="calendar-summary">

        <div className="calendar-card">
          <strong>
            {summary.appointments}
          </strong>

          <span>Appointments</span>
        </div>

        <div className="calendar-card">
          <strong>
            {summary.boarding}
          </strong>

          <span>Boarding</span>
        </div>

        <div className="calendar-card">
          <strong>
            {summary.checkIns}
          </strong>

          <span>Check-Ins</span>
        </div>

        <div className="calendar-card">
          <strong>
            {summary.checkOuts}
          </strong>

          <span>Check-Outs</span>
        </div>

        <div className="calendar-card">
          <strong>
            {summary.completed}
          </strong>

          <span>Completed</span>
        </div>

      </div>

      <div className="calendar-events">

        {sortedEvents.length === 0 && (
          <div className="calendar-empty">
            No scheduled events.
          </div>
        )}

        {sortedEvents.map((event) => (
          <div
            key={event.id}
            className="calendar-event"
            style={{
              borderLeft: `6px solid ${eventColor(
                event.type,
              )}`,
            }}
          >
            <div className="calendar-event-header">

              <strong>
                {event.title}
              </strong>

              <span>
                {event.type}
              </span>

            </div>

            <div className="calendar-event-time">

              <div>
                <strong>Start</strong>

                <div>
                  {new Date(
                    event.start,
                  ).toLocaleString()}
                </div>

              </div>

              <div>
                <strong>End</strong>

                <div>
                  {new Date(
                    event.end,
                  ).toLocaleString()}
                </div>

              </div>

            </div>

            <div className="calendar-event-footer">

              <span>
                Status: {event.status}
              </span>

              <span>
                Pets:
                {" "}
                {event.petIds.length}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}