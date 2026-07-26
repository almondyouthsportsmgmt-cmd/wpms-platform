import { useEffect, useState } from "react";
import { CalendarClock, Send, X } from "lucide-react";

import type {
  NotificationChannel,
  NotificationQueueItem,
} from "./notificationTypes";

type Props = {
  item: NotificationQueueItem | null;
  working: boolean;
  onClose: () => void;
  onSave: (
    item: NotificationQueueItem,
  ) => Promise<void> | void;
  onSend: (id: string) => Promise<void> | void;
  onSchedule: (
    id: string,
    scheduledFor: string,
  ) => Promise<void> | void;
};

export default function NotificationEditorModal({
  item,
  working,
  onClose,
  onSave,
  onSend,
  onSchedule,
}: Props) {
  const [draft, setDraft] =
    useState<NotificationQueueItem | null>(
      item,
    );

  const [scheduleOpen, setScheduleOpen] =
    useState(false);

  const [scheduledFor, setScheduledFor] =
    useState("");

  useEffect(() => {
    setDraft(item);
    setScheduleOpen(false);
    setScheduledFor(
      item?.scheduledFor?.slice(0, 16) || "",
    );
  }, [item]);

  if (!draft) {
    return null;
  }

  async function saveThen(
    action: () => Promise<void> | void,
  ) {
    if (!draft) {
      return;
    }

    await onSave(draft);
    await action();
  }

  return (
    <div className="modal-layer">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
      />

      <section className="modal-card notification-editor-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              Customer notification
            </span>

            <h2>
              {draft.title}
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="notification-editor-content">
          <label className="field">
            <span>Delivery method</span>

            <select
              value={draft.channel}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  channel:
                    event.target
                      .value as NotificationChannel,
                })
              }
            >
              <option value="sms">SMS</option>
              <option value="email">
                Email
              </option>
              <option value="both">
                SMS + Email
              </option>
            </select>
          </label>

          <label className="field">
            <span>Message</span>

            <textarea
              rows={12}
              value={draft.message}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  message:
                    event.target.value,
                })
              }
            />
          </label>

          {scheduleOpen && (
            <label className="field">
              <span>Send date and time</span>

              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) =>
                  setScheduledFor(
                    event.target.value,
                  )
                }
              />
            </label>
          )}
        </div>

        <div className="modal-actions notification-editor-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              setScheduleOpen(
                (current) => !current,
              )
            }
          >
            <CalendarClock size={16} />
            Schedule
          </button>

          {scheduleOpen && (
            <button
              type="button"
              className="primary-button"
              disabled={
                working || !scheduledFor
              }
              onClick={() =>
                void saveThen(() =>
                  onSchedule(
                    draft.id,
                    new Date(
                      scheduledFor,
                    ).toISOString(),
                  ),
                )
              }
            >
              Save schedule
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={working}
            onClick={() =>
              void saveThen(() =>
                onSend(draft.id),
              )
            }
          >
            <Send size={16} />
            {working
              ? "Sending..."
              : "Send now"}
          </button>
        </div>
      </section>
    </div>
  );
}
