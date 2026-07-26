import type { ScheduleEvent } from "../scheduling/schedulingTypes";

export type CalendarView = "day" | "week" | "month";

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
