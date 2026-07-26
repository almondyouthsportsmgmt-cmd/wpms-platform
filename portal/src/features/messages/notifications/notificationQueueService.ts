import type {
  NotificationQueueItem,
  NotificationStatus,
} from "./notificationTypes";

const STORAGE_KEY = "wpms-reschedule-notice-outbox";

type RawCalendarNotice = {
  id: string;
  eventId: string;
  eventType: string;
  customerId: string;
  title: string;
  previousStart: string;
  previousEnd: string;
  newStart: string;
  newEnd: string;
  status: string;
  createdAt: string;
  message?: string;
  channel?: "sms" | "email" | "both";
  scheduledFor?: string | null;
  sentAt?: string | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function defaultMessage(item: RawCalendarNotice) {
  return [
    "Hello,",
    "",
    `${item.title} has been rescheduled.`,
    "",
    `Previous time: ${formatDate(item.previousStart)}`,
    `New time: ${formatDate(item.newStart)}`,
    "",
    "Please reply if this new time does not work for you.",
    "",
    "— Whimsical Paws Pet Escape",
  ].join("\n");
}

function normalizeStatus(
  status: string,
): NotificationStatus {
  switch (status) {
    case "scheduled":
    case "sent":
    case "cancelled":
    case "failed":
      return status;
    default:
      return "pending";
  }
}

function normalize(
  item: RawCalendarNotice,
): NotificationQueueItem {
  return {
    id: item.id,
    eventId: item.eventId,
    eventType: item.eventType,
    customerId: item.customerId,
    title: item.title,
    previousStart: item.previousStart,
    previousEnd: item.previousEnd,
    newStart: item.newStart,
    newEnd: item.newEnd,
    message:
      item.message?.trim() ||
      defaultMessage(item),
    channel: item.channel || "sms",
    status: normalizeStatus(item.status),
    scheduledFor:
      item.scheduledFor || null,
    createdAt: item.createdAt,
    sentAt: item.sentAt || null,
  };
}

function readRaw(): RawCalendarNotice[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as RawCalendarNotice[];
  } catch {
    return [];
  }
}

function writeAll(
  items: NotificationQueueItem[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items),
  );

  window.dispatchEvent(
    new CustomEvent(
      "wpms:notification-queue-updated",
    ),
  );
}

export function listNotificationQueue() {
  return readRaw()
    .map(normalize)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
}

export function getNotification(
  id: string,
) {
  return listNotificationQueue().find(
    (item) => item.id === id,
  ) ?? null;
}

export function saveNotification(
  item: NotificationQueueItem,
) {
  const items = listNotificationQueue();
  const exists = items.some(
    (current) => current.id === item.id,
  );

  writeAll(
    exists
      ? items.map((current) =>
          current.id === item.id
            ? item
            : current,
        )
      : [item, ...items],
  );

  return item;
}

export function markNotificationSent(
  id: string,
) {
  const item = getNotification(id);

  if (!item) {
    throw new Error(
      "Notification could not be found.",
    );
  }

  const sent: NotificationQueueItem = {
    ...item,
    status: "sent",
    sentAt: new Date().toISOString(),
    scheduledFor: null,
  };

  saveNotification(sent);

  window.dispatchEvent(
    new CustomEvent("wpms:notification-sent", {
      detail: sent,
    }),
  );

  return sent;
}

export function markNotificationFailed(
  id: string,
) {
  const item = getNotification(id);

  if (!item) {
    throw new Error(
      "Notification could not be found.",
    );
  }

  return saveNotification({
    ...item,
    status: "failed",
  });
}

export function cancelNotification(
  id: string,
) {
  const item = getNotification(id);

  if (!item) {
    throw new Error(
      "Notification could not be found.",
    );
  }

  return saveNotification({
    ...item,
    status: "cancelled",
  });
}

export function scheduleNotification(
  id: string,
  scheduledFor: string,
) {
  const item = getNotification(id);

  if (!item) {
    throw new Error(
      "Notification could not be found.",
    );
  }

  return saveNotification({
    ...item,
    status: "scheduled",
    scheduledFor,
  });
}
