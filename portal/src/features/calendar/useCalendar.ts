import { useCallback, useEffect, useMemo, useState } from "react";

import { calendarService } from "./calendarService";

import type {
  CalendarFilter,
  CalendarView,
} from "./calendarTypes";

import type {
  ScheduleEvent,
} from "../scheduling/schedulingTypes";

const DEFAULT_FILTERS: CalendarFilter = {
  showAppointments: true,
  showBoarding: true,
  showCompleted: true,
  showCancelled: false,
};

export function useCalendar() {
  const [view, setView] =
    useState<CalendarView>("month");

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [filters, setFilters] =
    useState<CalendarFilter>(
      DEFAULT_FILTERS,
    );

  const [events, setEvents] =
    useState<ScheduleEvent[]>([]);

  const load = useCallback(() => {
    let data =
      calendarService.getDay(
        selectedDate,
      );

    data = data.filter((event) => {
      if (
        !filters.showAppointments &&
        event.type === "grooming"
      ) {
        return false;
      }

      if (
        !filters.showBoarding &&
        (
          event.type === "boarding" ||
          event.type ===
            "boarding-checkin" ||
          event.type ===
            "boarding-checkout"
        )
      ) {
        return false;
      }

      if (
        !filters.showCompleted &&
        event.status ===
          "completed"
      ) {
        return false;
      }

      if (
        !filters.showCancelled &&
        event.status ===
          "cancelled"
      ) {
        return false;
      }

      return true;
    });

    setEvents(data);
  }, [selectedDate, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const previous = useCallback(() => {
    const next =
      new Date(selectedDate);

    switch (view) {
      case "month":
        next.setMonth(
          next.getMonth() - 1,
        );
        break;

      case "week":
        next.setDate(
          next.getDate() - 7,
        );
        break;

      default:
        next.setDate(
          next.getDate() - 1,
        );
    }

    setSelectedDate(next);
  }, [selectedDate, view]);

  const next = useCallback(() => {
    const date =
      new Date(selectedDate);

    switch (view) {
      case "month":
        date.setMonth(
          date.getMonth() + 1,
        );
        break;

      case "week":
        date.setDate(
          date.getDate() + 7,
        );
        break;

      default:
        date.setDate(
          date.getDate() + 1,
        );
    }

    setSelectedDate(date);
  }, [selectedDate, view]);

  const today = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const summary = useMemo(
    () =>
      calendarService.getSummary(
        selectedDate,
      ),
    [selectedDate, events],
  );

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

    reload: load,
  };
}