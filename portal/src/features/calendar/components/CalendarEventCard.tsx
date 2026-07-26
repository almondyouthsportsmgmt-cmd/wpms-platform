import type { DragEvent, CSSProperties } from "react";
import type { ScheduleEvent } from "../../scheduling/schedulingTypes";
import {
  getEventColor,
  getStatusOpacity,
} from "../calendarEventColors";

type Props = {
  event: ScheduleEvent;
  compact?: boolean;
  onClick?: (event: ScheduleEvent) => void;
  style?: CSSProperties;
  className?: string;
};

const DRAG_TYPE = "application/x-wpms-calendar-event";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function icon(type: ScheduleEvent["type"]) {
  return type === "grooming" ? "🐾" : "🏠";
}

export default function CalendarEventCard({
  event,
  compact = false,
  onClick,
  style,
  className = "",
}: Props) {
  const color = getEventColor(event.type);

  function dragStart(
    dragEvent: DragEvent<HTMLDivElement>,
  ) {
    dragEvent.dataTransfer.effectAllowed = "move";
    dragEvent.dataTransfer.setData(
      DRAG_TYPE,
      JSON.stringify(event),
    );
    dragEvent.dataTransfer.setData(
      "text/plain",
      JSON.stringify(event),
    );
  }

  return (
    <div
      draggable
      className={`calendar-time-event-wrap ${className}`}
      style={style}
      onDragStart={dragStart}
    >
      <button
        type="button"
        className={`calendar-time-event ${
          compact ? "is-compact" : ""
        }`}
        style={{
          background: color.background,
          borderLeftColor: color.border,
          color: color.text,
          opacity: getStatusOpacity(event.status),
        }}
        onClick={() => onClick?.(event)}
      >
        <span>{icon(event.type)}</span>
        <span className="calendar-time-event-copy">
          <strong>{event.title}</strong>
          {!compact && (
            <>
              <small>
                {formatTime(event.start)}–{formatTime(event.end)}
              </small>
              <small className="calendar-time-event-status">
                {event.status.replaceAll("-", " ")}
              </small>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
