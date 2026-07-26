import type { ScheduleEvent } from "../../scheduling/schedulingTypes";

export type PositionedCalendarEvent = {
  event: ScheduleEvent;
  column: number;
  columnCount: number;
};

function overlaps(left: ScheduleEvent, right: ScheduleEvent) {
  return (
    new Date(left.start) < new Date(right.end) &&
    new Date(left.end) > new Date(right.start)
  );
}

export function positionOverlappingEvents(
  events: ScheduleEvent[],
): PositionedCalendarEvent[] {
  const sorted = [...events].sort(
    (left, right) =>
      new Date(left.start).getTime() -
      new Date(right.start).getTime() ||
      new Date(left.end).getTime() -
        new Date(right.end).getTime(),
  );

  const groups: ScheduleEvent[][] = [];
  let current: ScheduleEvent[] = [];
  let currentEnd = Number.NEGATIVE_INFINITY;

  for (const event of sorted) {
    const start = new Date(event.start).getTime();
    const end = new Date(event.end).getTime();

    if (current.length === 0 || start < currentEnd) {
      current.push(event);
      currentEnd = Math.max(currentEnd, end);
    } else {
      groups.push(current);
      current = [event];
      currentEnd = end;
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  const result: PositionedCalendarEvent[] = [];

  for (const group of groups) {
    const columns: ScheduleEvent[][] = [];
    const positions = new Map<string, number>();

    for (const event of group) {
      let column = columns.findIndex((items) =>
        items.every((item) => !overlaps(item, event)),
      );

      if (column === -1) {
        column = columns.length;
        columns.push([]);
      }

      columns[column].push(event);
      positions.set(event.id, column);
    }

    const columnCount = Math.max(columns.length, 1);

    group.forEach((event) => {
      result.push({
        event,
        column: positions.get(event.id) ?? 0,
        columnCount,
      });
    });
  }

  return result;
}
