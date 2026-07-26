import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import CalendarHoursModal from "./components/CalendarHoursModal";
import DayCalendar from "./components/DayCalendar";
import EventDetailsDrawer from "./components/EventDetailsDrawer";
import MonthCalendar from "./components/MonthCalendar";
import RescheduleNoticeModal from "./components/RescheduleNoticeModal";
import WeekCalendar from "./components/WeekCalendar";
import { useCalendar } from "./useCalendar";
import { useCalendarDragDrop } from "./useCalendarDragDrop";
import { queueRescheduleNotice } from "./rescheduleNoticeService";
import { revertCalendarMove } from "./revertCalendarMove";
import {
  loadCalendarViewSettings,
  saveCalendarViewSettings,
  type CalendarViewSettings,
} from "./calendarViewSettings";
import type { CalendarView } from "./calendarTypes";
import type { CompletedCalendarMove } from "./calendarMoveTypes";
import type { ScheduleEvent } from "../scheduling/schedulingTypes";

import "./calendar.css";

function heading(date: Date, view: CalendarView) {
  if (view === "month") {
    return date.toLocaleDateString([], {
      month: "long",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
  }

  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const navigate = useNavigate();
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

  const [selectedEvent, setSelectedEvent] =
    useState<ScheduleEvent | null>(null);
  const [moveError, setMoveError] = useState("");
  const [noticeMove, setNoticeMove] =
    useState<CompletedCalendarMove | null>(null);
  const [sendingNotice, setSendingNotice] = useState(false);
  const [revertingMove, setRevertingMove] = useState(false);
  const [notice, setNotice] = useState("");
  const [hoursOpen, setHoursOpen] = useState(false);
  const [settings, setSettings] =
    useState<CalendarViewSettings>(
      loadCalendarViewSettings,
    );
  const [draftSettings, setDraftSettings] =
    useState<CalendarViewSettings>(settings);

  const { moveEvent } = useCalendarDragDrop(
    reload,
    (move) => {
      setMoveError("");
      setNoticeMove(move);
    },
  );

  const resources = useMemo(() => {
    const map = new Map<string, string>();

    events.forEach((event) => {
      event.resourceIds.forEach((id) => {
        if (
          event.type === "boarding" ||
          id === "boarding" ||
          id.startsWith("kennel:")
        ) {
          map.set("boarding", "Boarding");
          return;
        }

        map.set(
          id,
          id === "unassigned" ? "Unassigned" : id,
        );
      });
    });

    if (map.size === 0) {
      map.set("unassigned", "Unassigned");
    }

    return Array.from(map).map(([id, name]) => ({
      id,
      name,
    }));
  }, [events]);

  function openRecord(event: ScheduleEvent) {
    const id =
      event.referenceId ||
      event.id
        .replace(/^appointment-/, "")
        .replace(/^boarding-checkin-/, "")
        .replace(/^boarding-checkout-/, "")
        .replace(/^boarding-/, "");

    navigate(
      event.type === "grooming"
        ? `/appointments?open=${id}`
        : `/boarding?open=${id}`,
    );
  }

  async function sendNotice() {
    if (!noticeMove) return;

    setSendingNotice(true);

    try {
      await queueRescheduleNotice(noticeMove);
      setNoticeMove(null);
      setNotice("Reschedule notice queued.");
      window.setTimeout(() => setNotice(""), 2600);
    } finally {
      setSendingNotice(false);
    }
  }


  async function cancelReschedule() {
    if (!noticeMove) return;

    setRevertingMove(true);
    setMoveError("");

    try {
      await revertCalendarMove(noticeMove);
      await reload();
      setNoticeMove(null);
      setNotice("Reschedule cancelled. Original time restored.");
      window.setTimeout(() => setNotice(""), 2800);
    } catch (caught) {
      setMoveError(
        caught instanceof Error
          ? caught.message
          : "Unable to restore the original schedule.",
      );
    } finally {
      setRevertingMove(false);
    }
  }

  function saveHours() {
    if (
      !draftSettings.showClosedHours &&
      draftSettings.closingHour <= draftSettings.openingHour
    ) {
      setMoveError(
        "Closing time must be later than opening time.",
      );
      return;
    }

    saveCalendarViewSettings(draftSettings);
    setSettings(draftSettings);
    setHoursOpen(false);
  }

  return (
    <div className="calendar-page calendar-v4">
      <section className="calendar-header">
        <div className="calendar-title">
          <CalendarDays size={28} />
          <div>
            <span className="eyebrow">Operations</span>
            <h1>Calendar</h1>
            <p>
              Grooming and boarding use the same scheduling
              experience.
            </p>
          </div>
        </div>

        <div className="calendar-toolbar">
          <button type="button" onClick={previous}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={today}>
            Today
          </button>
          <button type="button" onClick={next}>
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              setDraftSettings(settings);
              setHoursOpen(true);
            }}
          >
            <Clock3 size={17} />
            Hours
          </button>
          <button
            type="button"
            onClick={() => void reload()}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
          <select
            value={view}
            onChange={(event) =>
              setView(event.target.value as CalendarView)
            }
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}

      {moveError && (
        <div className="form-error calendar-move-message">
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
        {heading(selectedDate, view)}
      </section>

      <section className="calendar-summary">
        <div className="calendar-card">
          <strong>{summary.appointments}</strong>
          <span>Grooming</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.boarding}</strong>
          <span>Boarding</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.checkIns}</strong>
          <span>Check-ins</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.checkOuts}</strong>
          <span>Check-outs</span>
        </div>
        <div className="calendar-card">
          <strong>{summary.completed}</strong>
          <span>Completed</span>
        </div>
      </section>

      <section className="calendar-filter-panel">
        <div className="calendar-filter-title">
          <Filter size={17} />
          <strong>Filters</strong>
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
          Grooming
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
          Boarding
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
          Completed
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
          Cancelled
        </label>
      </section>

      {error && (
        <div className="module-state error-state">
          <p>{error}</p>
        </div>
      )}

      {!error && loading && (
        <div className="module-state">
          <div className="paw-loader">🐾</div>
          <p>Loading calendar...</p>
        </div>
      )}

      {!error && !loading && (
        <section
          className={`calendar-v4-surface ${
            view === "month" ? "is-month" : ""
          }`}
        >
          {view === "day" && (
            <DayCalendar
              date={selectedDate}
              events={events}
              resources={resources}
              settings={settings}
              onEventClick={setSelectedEvent}
              onMove={moveEvent}
              onMoveError={setMoveError}
            />
          )}

          {view === "week" && (
            <WeekCalendar
              weekStart={selectedDate}
              events={events}
              settings={settings}
              onEventClick={setSelectedEvent}
              onMove={moveEvent}
              onMoveError={setMoveError}
            />
          )}

          {view === "month" && (
            <MonthCalendar
              month={selectedDate}
              events={events}
              onEventClick={setSelectedEvent}
              onMove={moveEvent}
              onMoveError={setMoveError}
            />
          )}
        </section>
      )}

      <EventDetailsDrawer
        open={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onOpenRecord={openRecord}
      />

      <RescheduleNoticeModal
        move={noticeMove}
        sending={sendingNotice}
        reverting={revertingMove}
        onSend={() => void sendNotice()}
        onDisregard={() => setNoticeMove(null)}
        onCancelReschedule={() =>
          void cancelReschedule()
        }
      />

      <CalendarHoursModal
        open={hoursOpen}
        value={draftSettings}
        onChange={setDraftSettings}
        onClose={() => setHoursOpen(false)}
        onSave={saveHours}
      />
    </div>
  );
}
