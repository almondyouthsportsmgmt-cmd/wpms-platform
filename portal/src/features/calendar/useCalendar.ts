import { useCallback, useMemo, useState } from "react";
import { useAppointments } from "../appointments/useAppointments";
import { useBoarding } from "../boarding/useBoarding";
import type { ScheduleEvent } from "../scheduling/schedulingTypes";
import type {
  CalendarFilter,
  CalendarView,
} from "./calendarTypes";

const DEFAULT_FILTERS: CalendarFilter = {
  showAppointments: true,
  showBoarding: true,
  showCompleted: true,
  showCancelled: false,
};

function appointmentStatus(status: string): ScheduleEvent["status"] {
  switch (status) {
    case "Scheduled":
      return "pending";
    case "Checked In":
      return "checked-in";
    case "Completed":
      return "completed";
    case "Cancelled":
    case "No Show":
      return "cancelled";
    default:
      return "confirmed";
  }
}

function boardingStatus(status: string): ScheduleEvent["status"] {
  switch (status) {
    case "Reserved":
      return "pending";
    case "Checked Out":
      return "completed";
    case "Cancelled":
      return "cancelled";
    default:
      return "confirmed";
  }
}

function dateTime(date: string, time: string) {
  return `${date}T${time || "00:00"}:00`;
}

function overlaps(
  event: ScheduleEvent,
  start: Date,
  end: Date,
) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return eventStart < end && eventEnd > start;
}

function rangeFor(view: CalendarView, date: Date) {
  if (view === "day") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  if (view === "week") {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  const start = new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
  const end = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    1,
  );
  return { start, end };
}

export function useCalendar() {
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refresh: refreshAppointments,
  } = useAppointments();

  const {
    stays,
    loading: boardingLoading,
    error: boardingError,
    refresh: refreshBoarding,
  } = useBoarding();

  const [view, setView] = useState<CalendarView>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] =
    useState<CalendarFilter>(DEFAULT_FILTERS);

  const allEvents = useMemo<ScheduleEvent[]>(() => {
    const grooming = appointments.map(
      (appointment): ScheduleEvent => ({
        id: `appointment-${appointment.id}`,
        type: "grooming",
        status: appointmentStatus(appointment.status),
        title:
          appointment.serviceName ||
          "Grooming appointment",
        customerId: appointment.customerId,
        petIds: [appointment.petId],
        resourceIds: appointment.assignedStaff
          ? [appointment.assignedStaff]
          : ["unassigned"],
        referenceId: appointment.id,
        start: dateTime(
          appointment.appointmentDate,
          appointment.startTime,
        ),
        end: dateTime(
          appointment.appointmentDate,
          appointment.endTime,
        ),
        notes: appointment.notes,
      }),
    );

    const boarding = stays.map(
      (stay): ScheduleEvent => ({
        id: `boarding-${stay.id}`,
        type: "boarding",
        status: boardingStatus(stay.status),
        title: "Boarding stay",
        customerId: stay.customerId,
        petIds: stay.petId ? [stay.petId] : [],
        resourceIds: ["boarding"],
        referenceId: stay.id,
        start: dateTime(
          stay.checkInDate,
          stay.checkInTime,
        ),
        end: dateTime(
          stay.checkOutDate,
          stay.checkOutTime,
        ),
        notes: [
          stay.kennelName
            ? `Kennel: ${stay.kennelName}`
            : "",
          stay.foodInstructions,
          stay.medicationInstructions,
          stay.emergencyNotes,
        ]
          .filter(Boolean)
          .join(" · "),
      }),
    );

    return [...grooming, ...boarding];
  }, [appointments, stays]);

  const events = useMemo(() => {
    const range = rangeFor(view, selectedDate);

    return allEvents
      .filter((event) =>
        overlaps(event, range.start, range.end),
      )
      .filter((event) => {
        const isBoarding =
          event.type === "boarding" ||
          event.type === "boarding-checkin" ||
          event.type === "boarding-checkout";

        if (
          !filters.showAppointments &&
          event.type === "grooming"
        ) {
          return false;
        }

        if (!filters.showBoarding && isBoarding) {
          return false;
        }

        if (
          !filters.showCompleted &&
          event.status === "completed"
        ) {
          return false;
        }

        if (
          !filters.showCancelled &&
          event.status === "cancelled"
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (left, right) =>
          new Date(left.start).getTime() -
          new Date(right.start).getTime(),
      );
  }, [allEvents, filters, selectedDate, view]);

  const previous = useCallback(() => {
    setSelectedDate((current) => {
      const result = new Date(current);
      if (view === "month") {
        result.setMonth(result.getMonth() - 1);
      } else if (view === "week") {
        result.setDate(result.getDate() - 7);
      } else {
        result.setDate(result.getDate() - 1);
      }
      return result;
    });
  }, [view]);

  const next = useCallback(() => {
    setSelectedDate((current) => {
      const result = new Date(current);
      if (view === "month") {
        result.setMonth(result.getMonth() + 1);
      } else if (view === "week") {
        result.setDate(result.getDate() + 7);
      } else {
        result.setDate(result.getDate() + 1);
      }
      return result;
    });
  }, [view]);

  const today = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const reload = useCallback(async () => {
    await Promise.all([
      refreshAppointments(),
      refreshBoarding(),
    ]);
  }, [refreshAppointments, refreshBoarding]);

  const summary = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const selected = allEvents.filter((event) =>
      overlaps(event, start, end),
    );

    return {
      appointments: selected.filter(
        (event) => event.type === "grooming",
      ).length,
      boarding: selected.filter(
        (event) => event.type === "boarding",
      ).length,
      checkIns: allEvents.filter(
        (event) =>
          event.type === "boarding" &&
          new Date(event.start) >= start &&
          new Date(event.start) < end,
      ).length,
      checkOuts: allEvents.filter(
        (event) =>
          event.type === "boarding" &&
          new Date(event.end) >= start &&
          new Date(event.end) < end,
      ).length,
      completed: selected.filter(
        (event) => event.status === "completed",
      ).length,
    };
  }, [allEvents, selectedDate]);

  return {
    view,
    setView,
    selectedDate,
    setSelectedDate,
    filters,
    setFilters,
    events,
    summary,
    previous,
    next,
    today,
    reload,
    loading:
      appointmentsLoading || boardingLoading,
    error: appointmentsError || boardingError,
  };
}
