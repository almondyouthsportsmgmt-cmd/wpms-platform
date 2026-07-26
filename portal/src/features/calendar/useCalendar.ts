import {
  useCallback,
  useMemo,
  useState,
} from "react";
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
    case "Confirmed":
    case "In Service":
    case "Ready for Pickup":
      return "confirmed";
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
    case "Checked In":
    case "In Stay":
    case "Ready for Checkout":
      return "confirmed";
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

function overlapsRange(
  event: ScheduleEvent,
  rangeStart: Date,
  rangeEnd: Date,
) {
  const start = new Date(event.start);
  const end = new Date(event.end);

  return start < rangeEnd && end > rangeStart;
}

function viewRange(view: CalendarView, selectedDate: Date) {
  if (view === "day") {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (view === "week") {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return { start, end };
  }

  const start = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  );

  const end = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
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

  const [view, setView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] =
    useState<CalendarFilter>(DEFAULT_FILTERS);

  const allEvents = useMemo<ScheduleEvent[]>(() => {
    const groomingEvents: ScheduleEvent[] =
      appointments.map((appointment) => ({
        id: `appointment-${appointment.id}`,
        type: "grooming",
        status: appointmentStatus(appointment.status),
        title:
          appointment.serviceName ||
          "Grooming Appointment",
        customerId: appointment.customerId,
        petIds: [appointment.petId],
        resourceIds: appointment.assignedStaff
          ? [appointment.assignedStaff]
          : [],
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
      }));

    const boardingEvents: ScheduleEvent[] =
      stays.flatMap((stay) => {
        const base = {
          status: boardingStatus(stay.status),
          customerId: stay.customerId,
          petIds: [stay.petId],
          resourceIds: stay.kennelName
            ? [`kennel:${stay.kennelName}`]
            : [],
          referenceId: stay.id,
          notes: [
            stay.foodInstructions,
            stay.medicationInstructions,
            stay.emergencyNotes,
          ]
            .filter(Boolean)
            .join(" · "),
        };

        return [
          {
            ...base,
            id: `boarding-${stay.id}`,
            type: "boarding" as const,
            title: `Boarding · ${stay.kennelName || "Unassigned kennel"}`,
            start: dateTime(
              stay.checkInDate,
              stay.checkInTime,
            ),
            end: dateTime(
              stay.checkOutDate,
              stay.checkOutTime,
            ),
          },
          {
            ...base,
            id: `boarding-checkin-${stay.id}`,
            type: "boarding-checkin" as const,
            title: `Check in · ${stay.kennelName || "Boarding"}`,
            start: dateTime(
              stay.checkInDate,
              stay.checkInTime,
            ),
            end: dateTime(
              stay.checkInDate,
              stay.checkInTime,
            ),
          },
          {
            ...base,
            id: `boarding-checkout-${stay.id}`,
            type: "boarding-checkout" as const,
            title: `Check out · ${stay.kennelName || "Boarding"}`,
            start: dateTime(
              stay.checkOutDate,
              stay.checkOutTime,
            ),
            end: dateTime(
              stay.checkOutDate,
              stay.checkOutTime,
            ),
          },
        ];
      });

    return [...groomingEvents, ...boardingEvents];
  }, [appointments, stays]);

  const events = useMemo(() => {
    const range = viewRange(view, selectedDate);

    return allEvents
      .filter((event) =>
        overlapsRange(event, range.start, range.end),
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
      const next = new Date(current);

      if (view === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (view === "week") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }

      return next;
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
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const nextDay = new Date(selected);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayEvents = allEvents.filter((event) =>
      overlapsRange(event, selected, nextDay),
    );

    return {
      appointments: dayEvents.filter(
        (event) => event.type === "grooming",
      ).length,
      boarding: dayEvents.filter(
        (event) => event.type === "boarding",
      ).length,
      checkIns: dayEvents.filter(
        (event) => event.type === "boarding-checkin",
      ).length,
      checkOuts: dayEvents.filter(
        (event) => event.type === "boarding-checkout",
      ).length,
      completed: dayEvents.filter(
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
    error:
      appointmentsError || boardingError,
  };
}
