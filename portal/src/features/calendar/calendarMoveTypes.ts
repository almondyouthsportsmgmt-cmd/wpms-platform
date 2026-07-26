import type { ScheduleEvent } from "../scheduling/schedulingTypes";

export type CalendarMoveConflict = {
  reason: string;
};

export type CalendarMoveResult = {
  success: boolean;
  conflicts?: CalendarMoveConflict[];
};

export type CompletedCalendarMove = {
  event: ScheduleEvent;
  oldStart: Date;
  oldEnd: Date;
  newStart: Date;
  newEnd: Date;
};
