import type {
  CSSProperties,
  DragEvent,
} from "react";
import { Hourglass } from "lucide-react";

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

const DRAG_TYPE =
  "application/x-wpms-calendar-event";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function eventIcon(
  event: ScheduleEvent,
) {
  if (event.status === "awaiting-customer") {
    return (
      <Hourglass
        size={compactIconSize(event)}
        aria-hidden="true"
      />
    );
  }

  return event.type === "grooming" ? "🐾" : "🏠";
}

function compactIconSize(
  _event: ScheduleEvent,
) {
  return 15;
}

function statusLabel(
  status: ScheduleEvent["status"],
) {
  switch (status) {
    case "awaiting-customer":
      return "Awaiting Customer";
    case "checked-in":
      return "Checked In";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending Approval";
  }
}

export default function CalendarEventCard({
  event,
  compact = false,
  onClick,
  style,
  className = "",
}: Props) {
  const color = getEventColor(event.type);

  const isGhost =
    event.status === "pending" ||
    event.status === "awaiting-customer";

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

  const eventStyle: CSSProperties = {
    background: color.background,
    borderLeftColor: color.border,
    color: color.text,
    opacity: isGhost
      ? event.status === "awaiting-customer"
        ? 0.55
        : 0.42
      : getStatusOpacity(event.status),

    borderTop: isGhost
      ? `2px dashed ${color.border}`
      : undefined,

    borderRight: isGhost
      ? `2px dashed ${color.border}`
      : undefined,

    borderBottom: isGhost
      ? `2px dashed ${color.border}`
      : undefined,

    boxShadow: isGhost
      ? "none"
      : undefined,
  };

  return (
    <div
      draggable
      className={[
        "calendar-time-event-wrap",
        isGhost ? "is-ghost-appointment" : "",
        event.status === "awaiting-customer"
          ? "is-awaiting-customer"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      onDragStart={dragStart}
    >
      <button
        type="button"
        className={[
          "calendar-time-event",
          compact ? "is-compact" : "",
          isGhost ? "is-ghost-appointment" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={eventStyle}
        onClick={() => onClick?.(event)}
        aria-label={`${event.title}. ${statusLabel(
          event.status,
        )}.`}
      >
        <span
          className="calendar-time-event-icon"
          aria-hidden="true"
        >
          {eventIcon(event)}
        </span>

        <span className="calendar-time-event-copy">
          <strong>{event.title}</strong>

          {!compact && (
            <>
              <small>
                {formatTime(event.start)}–
                {formatTime(event.end)}
              </small>

              <small className="calendar-time-event-status">
                {isGhost && (
                  <Hourglass
                    size={12}
                    aria-hidden="true"
                  />
                )}

                {statusLabel(event.status)}
              </small>
            </>
          )}

          {compact && isGhost && (
            <small className="calendar-time-event-status">
              <Hourglass
                size={11}
                aria-hidden="true"
              />

              {event.status === "awaiting-customer"
                ? "Awaiting"
                : "Pending"}
            </small>
          )}
        </span>
      </button>
    </div>
  );
}