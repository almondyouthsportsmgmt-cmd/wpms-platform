import type { ReactNode, DragEvent } from "react";

import {
  setDraggedCalendarEvent,
} from "../CalendarDropZone";

import type {
  ScheduleEvent,
} from "../../scheduling/schedulingTypes";

interface Props {
  event: ScheduleEvent;

  children: ReactNode;
}

export default function DraggableCalendarEvent({
  event,
  children,
}: Props) {
  function handleDragStart(
    e: DragEvent<HTMLDivElement>,
  ) {
    setDraggedCalendarEvent(
      e.dataTransfer,
      event,
    );
  }

  return (
    <div
      draggable
      className="calendar-draggable-event"
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
}