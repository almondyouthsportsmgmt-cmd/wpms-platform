import { BellRing, X } from "lucide-react";
import type { CompletedCalendarMove } from "../calendarMoveTypes";

type Props = {
  move: CompletedCalendarMove | null;
  sending: boolean;
  reverting: boolean;
  onSend: () => void;
  onDisregard: () => void;
  onCancelReschedule: () => void;
};

function when(value: Date) {
  return value.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function RescheduleNoticeModal({
  move,
  sending,
  reverting,
  onSend,
  onDisregard,
  onCancelReschedule,
}: Props) {
  if (!move) return null;

  const busy = sending || reverting;

  return (
    <div className="modal-layer">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onCancelReschedule}
        disabled={busy}
        aria-label="Cancel reschedule and restore original time"
      />

      <section className="modal-card reschedule-notice-modal">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Schedule updated</span>
            <h2>Send a reschedule notice?</h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onCancelReschedule}
            disabled={busy}
            aria-label="Cancel reschedule and restore original time"
            title="Cancel reschedule and restore original time"
          >
            <X size={18} />
          </button>
        </div>

        <div className="reschedule-notice-content">
          <BellRing size={28} />

          <div>
            <strong>{move.event.title}</strong>

            <p>
              Previous: {when(move.oldStart)}–{when(move.oldEnd)}
            </p>

            <p>
              New: {when(move.newStart)}–{when(move.newEnd)}
            </p>

            <span>
              Send a customer notice about the new schedule,
              keep the change without a notice, or use the X to
              cancel the reschedule and restore the original time.
            </span>
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onDisregard}
            disabled={busy}
          >
            Disregard notice
          </button>

          <button
            type="button"
            className="primary-button"
            disabled={busy}
            onClick={onSend}
          >
            {sending ? "Queuing..." : "Send notice"}
          </button>
        </div>

        {reverting && (
          <div className="reschedule-reverting">
            Restoring the original schedule...
          </div>
        )}
      </section>
    </div>
  );
}
