import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";

import MonthCalendar from "./components/MonthCalendar";
import WeekCalendar from "./components/WeekCalendar";
import DayCalendar from "./components/DayCalendar";
import EventDetailsDrawer from "./components/EventDetailsDrawer";

import { useCalendar } from "./useCalendar";
import { useCalendarDragDrop } from "./useCalendarDragDrop";

import type { CalendarView } from "./calendarTypes";
import type { ScheduleEvent } from "../scheduling/schedulingTypes";

import "./calendar.css";

function formatHeader(
  date: Date,
  view: CalendarView,
): string {
  if (view === "month") {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const {
    view,
    setView,
    selectedDate,
    filters,
    setFilters,
    events,
    summary,
    previous,
    next,
    today,
    reload,
    loading,
    error,
  } = useCalendar();

  const { moveEvent } = useCalendarDragDrop(reload);

  const [selectedEvent, setSelectedEvent] =
    useState<ScheduleEvent | null>(null);

  const [notice, setNotice] = useState("");
  const [moveError, setMoveError] = useState("");

  const groomers = useMemo(() => {
    const resourceIds = new Set<string>();

    events.forEach((event) => {
      if (event.type !== "grooming") return;

      event.resourceIds.forEach((resourceId) => {
        resourceIds.add(resourceId);
      });
    });

    const items = Array.from(resourceIds).map((id) => ({
      id,
      name: id,
    }));

    return items.length > 0
      ? items
      : [{ id: "unassigned", name: "Unassigned" }];
  }, [events]);

  const calendarEvents = useMemo(() => {
    if (view !== "day") return events;

    return events.map((event) => {
      if (
        event.type === "grooming" &&
        event.resourceIds.length === 0
      ) {
        return {
          ...event,
          resourceIds: ["unassigned"],
        };
      }

      return event;
    });
  }, [events, view]);

  function showNotice(message: string) {
    setMoveError("");
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function showMoveError(message: string) {
    setNotice("");
    setMoveError(message);
  }

  return (
    <div className="calendar-page">
      <section className="calendar-header">
        <div className="calendar-title">
          <CalendarDays size={28} />

          <div>
            <span className="eyebrow">Shop operations</span>
            <h1>Operations Calendar</h1>
            <p>
              Grooming appointments and boarding stays share
              one calendar while keeping separate scheduling
              resources.
            </p>
          </div>
        </div>

        <div className="calendar-toolbar">
          <button
            type="button"
            onClick={previous}
            aria-label="Previous calendar period"
          >
            <ChevronLeft size={18} />
          </button>

          <button type="button" onClick={today}>
            Today
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next calendar period"
          >
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
          >
            <RefreshCw size={17} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <select
            value={view}
            onChange={(event) =>
              setView(event.target.value as CalendarView)
            }
            aria-label="Calendar view"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
        </div>
      </section>

      {notice && (
        <div className="success-notice">{notice}</div>
      )}

      {moveError && (
        <div className="form-error calendar-move-error">
          <span>{moveError}</span>
          <button
            type="button"
            onClick={() => setMoveError("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="calendar-current-date">
        {formatHeader(selectedDate, view)}
      </section>

      <section className="calendar-summary">
        <div className="calendar-card">
          <strong>{summary.appointments}</strong>
          <span>Grooming appointments</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.boarding}</strong>
          <span>Boarding stays</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.checkIns}</strong>
          <span>Boarding check-ins</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.checkOuts}</strong>
          <span>Boarding check-outs</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.completed}</strong>
          <span>Completed</span>
        </div>
      </section>

      <section className="calendar-filter-panel">
        <div className="calendar-filter-title">
          <Filter size={17} />
          <strong>Display filters</strong>
        </div>

        <label>
          <input
            type="checkbox"
            checked={filters.showAppointments}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                showAppointments: event.target.checked,
              }))
            }
          />
          <span>Grooming</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.showBoarding}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                showBoarding: event.target.checked,
              }))
            }
          />
          <span>Boarding</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.showCompleted}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                showCompleted: event.target.checked,
              }))
            }
          />
          <span>Completed</span>
        </label>

        <label>
          <input
            type="checkbox"
            checked={filters.showCancelled}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                showCancelled: event.target.checked,
              }))
            }
          />
          <span>Cancelled</span>
        </label>
      </section>

      {error && (
        <div className="module-state error-state">
          <p>{error}</p>
          <button type="button" onClick={() => void reload()}>
            Try again
          </button>
        </div>
      )}

      {!error && loading && events.length === 0 && (
        <div className="module-state">
          <div className="paw-loader">🐾</div>
          <p>Loading calendar...</p>
        </div>
      )}

      {!error && (!loading || events.length > 0) && (
        <section className="calendar-view-container">
          {view === "month" && (
            <MonthCalendar
              month={selectedDate}
              events={calendarEvents}
              onEventClick={setSelectedEvent}
            />
          )}

          {view === "week" && (
            <WeekCalendar
              weekStart={selectedDate}
              events={calendarEvents}
              onEventClick={setSelectedEvent}
              onMove={moveEvent}
              onMoveComplete={showNotice}
              onMoveError={showMoveError}
            />
          )}

          {view === "day" && (
            <DayCalendar
              date={selectedDate}
              events={calendarEvents}
              groomers={groomers}
              onEventClick={setSelectedEvent}
              onMove={moveEvent}
              onMoveComplete={showNotice}
              onMoveError={showMoveError}
            />
          )}
        </section>
      )}

      <EventDetailsDrawer
        open={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
