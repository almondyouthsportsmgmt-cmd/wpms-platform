import {
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import type { ScheduleEvent } from "../../scheduling/schedulingTypes";
import type { CalendarMoveResult } from "../calendarMoveTypes";

type Props = {
  start: Date;
  resourceId?: string;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
  onMove: (
    event: ScheduleEvent,
    start: Date,
    end: Date,
    targetResourceId?: string,
  ) => Promise<CalendarMoveResult>;
  onMoveError?: (message: string) => void;
};

const DRAG_TYPE = "application/x-wpms-calendar-event";

function duration(event: ScheduleEvent) {
  return Math.max(
    15,
    Math.round(
      (new Date(event.end).getTime() -
        new Date(event.start).getTime()) /
        60000,
    ),
  );
}

function read(dataTransfer: DataTransfer) {
  const raw =
    dataTransfer.getData(DRAG_TYPE) ||
    dataTransfer.getData("text/plain");

  try {
    return raw ? (JSON.parse(raw) as ScheduleEvent) : null;
  } catch {
    return null;
  }
}

export default function CalendarDropZone({
  start,
  resourceId,
  className = "",
  children,
  style,
  onMove,
  onMoveError,
}: Props) {
  const [over, setOver] = useState(false);

  async function drop(
    dragEvent: DragEvent<HTMLDivElement>,
  ) {
    dragEvent.preventDefault();
    setOver(false);

    const event = read(dragEvent.dataTransfer);

    if (!event) {
      onMoveError?.("Unable to read the calendar event.");
      return;
    }

    const end = new Date(
      start.getTime() + duration(event) * 60000,
    );

    const result = await onMove(
      event,
      start,
      end,
      resourceId,
    );

    if (!result.success) {
      onMoveError?.(
        result.conflicts
          ?.map((conflict) => conflict.reason)
          .join("\n") ||
          "This destination is unavailable.",
      );
    }
  }

  return (
    <div
      className={`calendar-time-drop-zone ${
        over ? "is-over" : ""
      } ${className}`}
      style={style}
      onDragEnter={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDragLeave={(event) => {
        if (
          !event.currentTarget.contains(
            event.relatedTarget as Node | null,
          )
        ) {
          setOver(false);
        }
      }}
      onDrop={(event) => void drop(event)}
    >
      {children}
    </div>
  );
}
