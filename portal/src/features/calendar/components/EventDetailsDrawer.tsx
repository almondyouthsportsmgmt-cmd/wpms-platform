import {
  Calendar,
  Clock,
  ExternalLink,
  Home,
  Hourglass,
  PawPrint,
  UserRound,
  X,
} from "lucide-react";

import type { ScheduleEvent } from "../../scheduling/schedulingTypes";

type Props = {
  open: boolean;
  event: ScheduleEvent | null;
  onClose: () => void;
  onOpenRecord?: (event: ScheduleEvent) => void;
};

function isAppointmentRequest(event: ScheduleEvent) {
  return event.id.startsWith("appointment-request-");
}

function eventLabel(event: ScheduleEvent) {
  if (isAppointmentRequest(event)) {
    return event.status === "awaiting-customer"
      ? "Proposed appointment time"
      : "Pending appointment request";
  }

  if (event.type === "grooming") {
    return "Grooming appointment";
  }

  if (
    event.type === "boarding" ||
    event.type === "boarding-checkin" ||
    event.type === "boarding-checkout"
  ) {
    return "Boarding stay";
  }

  return event.type.replaceAll("-", " ");
}

function statusLabel(status: ScheduleEvent["status"]) {
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventDetailsDrawer({
  open,
  event,
  onClose,
  onOpenRecord,
}: Props) {
  if (!open || !event) {
    return null;
  }

  const request = isAppointmentRequest(event);

  const isBoarding =
    event.type === "boarding" ||
    event.type === "boarding-checkin" ||
    event.type === "boarding-checkout";

  const resourceName =
    event.resourceIds
      .map((resourceId) =>
        resourceId.replace(/^kennel:/, ""),
      )
      .find((name) => name && name !== "unassigned") ||
    (isBoarding ? "Boarding" : "Unassigned");

  return (
    <div className="calendar-tooltip-layer">
      <button
        type="button"
        className="calendar-tooltip-backdrop"
        onClick={onClose}
        aria-label="Close calendar event details"
      />

      <section
        className={[
          "calendar-tooltip-modal",
          request ? "is-appointment-request" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-tooltip-title"
      >
        <header className="calendar-tooltip-header">
          <div>
            <span className="eyebrow">
              {eventLabel(event)}
            </span>

            <h2 id="calendar-tooltip-title">
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close event details"
          >
            <X size={18} />
          </button>
        </header>

        {request && (
          <div className="calendar-request-banner">
            <Hourglass size={18} />

            <div>
              <strong>{statusLabel(event.status)}</strong>

              <span>
                {event.status === "awaiting-customer"
                  ? "The shop proposed a new time and is waiting for the customer to respond."
                  : "This request has not been approved as a confirmed appointment."}
              </span>
            </div>
          </div>
        )}

        <div className="calendar-tooltip-body">
          <div className="calendar-tooltip-detail">
            <Calendar size={17} />

            <div>
              <span>Starts</span>
              <strong>{formatDateTime(event.start)}</strong>
            </div>
          </div>

          <div className="calendar-tooltip-detail">
            <Clock size={17} />

            <div>
              <span>Ends</span>
              <strong>{formatDateTime(event.end)}</strong>
            </div>
          </div>

          <div className="calendar-tooltip-detail">
            {isBoarding ? (
              <Home size={17} />
            ) : (
              <UserRound size={17} />
            )}

            <div>
              <span>
                {isBoarding
                  ? "Boarding resource"
                  : request
                    ? "Preferred staff"
                    : "Assigned staff"}
              </span>

              <strong>{resourceName}</strong>
            </div>
          </div>

          <div className="calendar-tooltip-detail">
            <PawPrint size={17} />

            <div>
              <span>Pets</span>
              <strong>{event.petIds.length}</strong>
            </div>
          </div>

          <div className="calendar-tooltip-status">
            <span>Status</span>
            <strong>{statusLabel(event.status)}</strong>
          </div>

          {event.notes && (
            <div className="calendar-tooltip-notes">
              <span>Notes</span>
              <p>{event.notes}</p>
            </div>
          )}
        </div>

        <footer className="calendar-tooltip-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => onOpenRecord?.(event)}
          >
            <ExternalLink size={16} />

            {request ? "Review Request" : "Open Record"}
          </button>
        </footer>
      </section>
    </div>
  );
}