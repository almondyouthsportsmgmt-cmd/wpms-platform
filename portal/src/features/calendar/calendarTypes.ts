import type { ScheduleEvent } from "../scheduling/schedulingTypes";

export type CalendarView =
  | "month"
  | "week"
  | "day";

export interface CalendarFilter {
  showAppointments: boolean;
  showBoarding: boolean;
  showCompleted: boolean;
  showCancelled: boolean;
}

export interface CalendarState {
  view: CalendarView;

  selectedDate: Date;

  filters: CalendarFilter;

  events: ScheduleEvent[];
}

export interface CalendarDay {
  date: Date;

  events: ScheduleEvent[];
}

export interface CalendarWeek {
  start: Date;

  end: Date;

  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;

  month: number;

  weeks: CalendarWeek[];
}