import type { CompletedCalendarMove } from "./calendarMoveTypes";

export type RescheduleNotice = {
  id: string;
  eventId: string;
  eventType: string;
  customerId: string;
  title: string;
  previousStart: string;
  previousEnd: string;
  newStart: string;
  newEnd: string;
  status: "queued";
  createdAt: string;
};

const STORAGE_KEY = "wpms-reschedule-notice-outbox";

function readOutbox(): RescheduleNotice[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as RescheduleNotice[]) : [];
}

export async function queueRescheduleNotice(
  move: CompletedCalendarMove,
): Promise<RescheduleNotice> {
  const notice: RescheduleNotice = {
    id: crypto.randomUUID(),
    eventId:
      move.event.referenceId ||
      move.event.id,
    eventType: move.event.type,
    customerId: move.event.customerId || "",
    title: move.event.title,
    previousStart: move.oldStart.toISOString(),
    previousEnd: move.oldEnd.toISOString(),
    newStart: move.newStart.toISOString(),
    newEnd: move.newEnd.toISOString(),
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...readOutbox(), notice]),
  );

  window.dispatchEvent(
    new CustomEvent("wpms:reschedule-notice-queued", {
      detail: notice,
    }),
  );

  return notice;
}
