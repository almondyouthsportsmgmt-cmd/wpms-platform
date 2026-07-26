import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  MessageSquareText,
  Send,
  XCircle,
} from "lucide-react";

import NotificationEditorModal from "./NotificationEditorModal";
import { useNotificationQueue } from "./useNotificationQueue";

import type {
  NotificationQueueItem,
  NotificationStatus,
} from "./notificationTypes";

import "./notifications.css";

type Filter = "all" | NotificationStatus;

type Props = {
  onDeliver: (
    item: NotificationQueueItem,
  ) => Promise<void>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusIcon(status: NotificationStatus) {
  switch (status) {
    case "sent":
      return <CheckCircle2 size={15} />;
    case "scheduled":
      return <CalendarClock size={15} />;
    case "cancelled":
    case "failed":
      return <XCircle size={15} />;
    default:
      return <Clock3 size={15} />;
  }
}

export default function NotificationQueuePanel({
  onDeliver,
}: Props) {
  const {
    items,
    error,
    workingId,
    update,
    send,
    schedule,
    cancel,
  } = useNotificationQueue(onDeliver);

  const [filter, setFilter] =
    useState<Filter>("pending");

  const [editing, setEditing] =
    useState<NotificationQueueItem | null>(
      null,
    );

  const visibleItems = useMemo(
    () =>
      filter === "all"
        ? items
        : items.filter(
            (item) =>
              item.status === filter,
          ),
    [filter, items],
  );

  const counts = useMemo(
    () => ({
      pending: items.filter(
        (item) =>
          item.status === "pending",
      ).length,

      scheduled: items.filter(
        (item) =>
          item.status === "scheduled",
      ).length,

      sent: items.filter(
        (item) => item.status === "sent",
      ).length,

      cancelled: items.filter(
        (item) =>
          item.status === "cancelled",
      ).length,
    }),
    [items],
  );

  return (
    <section className="notification-queue-panel">
      <header className="notification-queue-header">
        <div>
          <span className="eyebrow">
            Communications center
          </span>

          <h2>
            Notification Queue
          </h2>

          <p>
            Review calendar notices before
            they are delivered.
          </p>
        </div>

        <div className="notification-queue-summary">
          <span>
            <Clock3 size={15} />
            {counts.pending} pending
          </span>

          <span>
            <CalendarClock size={15} />
            {counts.scheduled} scheduled
          </span>

          <span>
            <CheckCircle2 size={15} />
            {counts.sent} sent
          </span>
        </div>
      </header>

      <div className="notification-filter-bar">
        {[
          "pending",
          "scheduled",
          "sent",
          "cancelled",
          "failed",
          "all",
        ].map((value) => (
          <button
            key={value}
            type="button"
            className={
              filter === value
                ? "is-active"
                : ""
            }
            onClick={() =>
              setFilter(value as Filter)
            }
          >
            {value}
          </button>
        ))}
      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="module-state">
          <MessageSquareText size={32} />
          <h3>
            No {filter === "all" ? "" : filter} notices
          </h3>
          <p>
            Calendar notices appear here after
            staff choose Send notice.
          </p>
        </div>
      ) : (
        <div className="notification-queue-list">
          {visibleItems.map((item) => (
            <article
              key={item.id}
              className="notification-queue-item"
            >
              <div className="notification-status-icon">
                {statusIcon(item.status)}
              </div>

              <div className="notification-queue-copy">
                <div className="notification-title-line">
                  <strong>
                    {item.title}
                  </strong>

                  <span
                    className={`notification-status ${item.status}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p>
                  {item.message}
                </p>

                <div className="notification-meta">
                  <span>
                    Channel: {item.channel}
                  </span>

                  <span>
                    Created:{" "}
                    {formatDate(
                      item.createdAt,
                    )}
                  </span>

                  {item.scheduledFor && (
                    <span>
                      Scheduled:{" "}
                      {formatDate(
                        item.scheduledFor,
                      )}
                    </span>
                  )}

                  {item.sentAt && (
                    <span>
                      Sent:{" "}
                      {formatDate(item.sentAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="notification-queue-actions">
                {item.status !== "cancelled" &&
                  item.status !== "sent" && (
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        setEditing(item)
                      }
                      aria-label="Edit notification"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}

                {(item.status === "pending" ||
                  item.status === "failed") && (
                  <>
                    <button
                      type="button"
                      className="icon-button"
                      disabled={
                        workingId === item.id
                      }
                      onClick={() =>
                        void send(item.id)
                      }
                      aria-label="Send notification"
                    >
                      <Send size={16} />
                    </button>

                    <button
                      type="button"
                      className="icon-button danger"
                      disabled={
                        workingId === item.id
                      }
                      onClick={() =>
                        void cancel(item.id)
                      }
                      aria-label="Cancel notification"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <NotificationEditorModal
        item={editing}
        working={
          editing
            ? workingId === editing.id
            : false
        }
        onClose={() =>
          setEditing(null)
        }
        onSave={async (item) => {
          await update(item);
          setEditing(item);
        }}
        onSend={async (id) => {
          await send(id);
          setEditing(null);
        }}
        onSchedule={async (
          id,
          scheduledFor,
        ) => {
          await schedule(
            id,
            scheduledFor,
          );
          setEditing(null);
        }}
      />
    </section>
  );
}
