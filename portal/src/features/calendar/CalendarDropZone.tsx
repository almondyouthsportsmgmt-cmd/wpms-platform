import {
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import type { ScheduleEvent } from "../scheduling/schedulingTypes";

type Props = {
  date: Date;
  hour: number;
  minute?: number;
  durationMinutes?: number;
  children?: ReactNode;
  className?: string;
  onMove: (
    event: ScheduleEvent,
    start: Date,
    end: Date,
  ) => Promise<{
    success: boolean;
    conflicts?: Array<{
      reason: string;
    }>;
  }>;
  onMoveComplete?: (message: string) => void;
  onMoveError?: (message: string) => void;
};

const DRAG_EVENT_TYPE =
  "application/x-wpms-calendar-event";

export function setDraggedCalendarEvent(
  dataTransfer: DataTransfer,
  event: ScheduleEvent,
) {
  dataTransfer.effectAllowed = "move";
  dataTransfer.setData(
    DRAG_EVENT_TYPE,
    JSON.stringify(event),
  );
}

function readDraggedCalendarEvent(
  dataTransfer: DataTransfer,
): ScheduleEvent | null {
  const raw =
    dataTransfer.getData(DRAG_EVENT_TYPE) ||
    dataTransfer.getData("text/plain");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ScheduleEvent;
  } catch {
    return null;
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function eventDurationMinutes(event: ScheduleEvent) {
  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  const duration = Math.round((end - start) / 60_000);

  return Math.max(duration, 15);
}

export default function CalendarDropZone({
  date,
  hour,
  minute = 0,
  durationMinutes,
  children,
  className = "",
  onMove,
  onMoveComplete,
  onMoveError,
}: Props) {
  const [draggingOver, setDraggingOver] =
    useState(false);
  const [moving, setMoving] = useState(false);

  function buildStart() {
    const start = new Date(date);
    start.setHours(hour, minute, 0, 0);
    return start;
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDraggingOver(true);
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>,
  ) {
    if (
      event.currentTarget.contains(
        event.relatedTarget as Node | null,
      )
    ) {
      return;
    }

    setDraggingOver(false);
  }

  async function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDraggingOver(false);

    const draggedEvent = readDraggedCalendarEvent(
      event.dataTransfer,
    );

    if (!draggedEvent) {
      onMoveError?.(
        "The calendar event could not be read.",
      );
      return;
    }

    const start = buildStart();
    const duration =
      durationMinutes ??
      eventDurationMinutes(draggedEvent);
    const end = addMinutes(start, duration);

    setMoving(true);

    try {
      const result = await onMove(
        draggedEvent,
        start,
        end,
      );

      if (!result.success) {
        const message =
          result.conflicts
            ?.map((conflict) => conflict.reason)
            .filter(Boolean)
            .join("\n") ||
          "This time is not available.";

        onMoveError?.(message);
        return;
      }

      onMoveComplete?.(
        `${draggedEvent.title} moved successfully.`,
      );
    } catch (caught) {
      onMoveError?.(
        caught instanceof Error
          ? caught.message
          : "Unable to move the calendar event.",
      );
    } finally {
      setMoving(false);
    }
  }

  return (
    <div
      className={[
        "calendar-drop-zone",
        draggingOver ? "is-dragging-over" : "",
        moving ? "is-moving" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        setDraggingOver(true);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(event) => void handleDrop(event)}
      data-hour={hour}
      data-minute={minute}
    >
      {children}
    </div>
  );
}
