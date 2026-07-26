import { scheduleEngine } from "../scheduling/scheduleEngine";

import type {
  ScheduleEvent,
  ScheduleEventType,
} from "../scheduling/schedulingTypes";

export interface CalendarQuery {
  start: string;
  end: string;

  includeTypes?: ScheduleEventType[];
}

class CalendarService {
  /**
   * Returns all events.
   */
  getEvents(): ScheduleEvent[] {
    return scheduleEngine.getEvents();
  }

  /**
   * Returns events between two dates.
   */
  getEventsBetween(
    query: CalendarQuery,
  ): ScheduleEvent[] {
    return scheduleEngine
      .getEvents()
      .filter((event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        if (
          end < new Date(query.start)
        ) {
          return false;
        }

        if (
          start > new Date(query.end)
        ) {
          return false;
        }

        if (
          query.includeTypes &&
          !query.includeTypes.includes(
            event.type,
          )
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return (
          new Date(a.start).getTime() -
          new Date(b.start).getTime()
        );
      });
  }

  /**
   * Month view.
   */
  getMonth(
    year: number,
    month: number,
  ): ScheduleEvent[] {
    const start = new Date(
      year,
      month,
      1,
    );

    const end = new Date(
      year,
      month + 1,
      0,
      23,
      59,
      59,
    );

    return this.getEventsBetween({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }

  /**
   * Week view.
   */
  getWeek(
    weekStart: Date,
  ): ScheduleEvent[] {
    const start = new Date(
      weekStart,
    );

    const end = new Date(
      weekStart,
    );

    end.setDate(end.getDate() + 7);

    return this.getEventsBetween({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }

  /**
   * Day view.
   */
  getDay(
    date: Date,
  ): ScheduleEvent[] {
    const start = new Date(date);

    start.setHours(
      0,
      0,
      0,
      0,
    );

    const end = new Date(date);

    end.setHours(
      23,
      59,
      59,
      999,
    );

    return this.getEventsBetween({
      start: start.toISOString(),
      end: end.toISOString(),
    });
  }

  /**
   * Today's check-ins.
   */
  getBoardingCheckIns(
    date: Date,
  ): ScheduleEvent[] {
    return this.getDay(date).filter(
      (event) =>
        event.type ===
        "boarding-checkin",
    );
  }

  /**
   * Today's check-outs.
   */
  getBoardingCheckOuts(
    date: Date,
  ): ScheduleEvent[] {
    return this.getDay(date).filter(
      (event) =>
        event.type ===
        "boarding-checkout",
    );
  }

  /**
   * Grooming appointments.
   */
  getAppointments(
    date: Date,
  ): ScheduleEvent[] {
    return this.getDay(date).filter(
      (event) =>
        event.type === "grooming",
    );
  }

  /**
   * Boarding stays.
   */
  getBoarding(
    date: Date,
  ): ScheduleEvent[] {
    return this.getDay(date).filter(
      (event) =>
        event.type === "boarding",
    );
  }

  /**
   * Combined dashboard totals.
   */
  getSummary(
    date: Date,
  ) {
    const events =
      this.getDay(date);

    return {
      appointments:
        events.filter(
          (x) =>
            x.type ===
            "grooming",
        ).length,

      boarding:
        events.filter(
          (x) =>
            x.type ===
            "boarding",
        ).length,

      checkIns:
        events.filter(
          (x) =>
            x.type ===
            "boarding-checkin",
        ).length,

      checkOuts:
        events.filter(
          (x) =>
            x.type ===
            "boarding-checkout",
        ).length,

      completed:
        events.filter(
          (x) =>
            x.status ===
            "completed",
        ).length,
    };
  }
}

export const calendarService =
  new CalendarService();