import type {
  LiveEvent,
} from "./eventTypes";

export interface ActivityFeedItem {
  id: string;
  eventType: string;
  source: string;
  title: string;
  description: string;
  occurredAt: string;
  priority: string;
  customerId?: string;
  petId?: string;
  referenceId?: string;
}

const STORAGE_KEY =
  "wpms-live-activity-feed";

const MAX_ITEMS = 250;

function readItems(): ActivityFeedItem[] {
  const raw =
    localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(
      raw,
    ) as ActivityFeedItem[];
  } catch {
    return [];
  }
}

function writeItems(
  items: ActivityFeedItem[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      items.slice(0, MAX_ITEMS),
    ),
  );

  window.dispatchEvent(
    new CustomEvent(
      "wpms:activity-feed-updated",
    ),
  );
}

export function liveEventToActivity(
  event: LiveEvent,
): ActivityFeedItem {
  return {
    id: event.id,
    eventType: event.type,
    source: event.source,
    title: event.title,
    description:
      event.description ?? "",
    occurredAt: event.occurredAt,
    priority: event.priority,
    customerId: event.customerId,
    petId: event.petId,
    referenceId: event.referenceId,
  };
}

export function addActivity(
  event: LiveEvent,
) {
  const item =
    liveEventToActivity(event);

  const current = readItems().filter(
    (existing) =>
      existing.id !== item.id,
  );

  writeItems([item, ...current]);

  return item;
}

export function listActivity(
  limit = 50,
) {
  return readItems().slice(
    0,
    limit,
  );
}

export function clearActivity() {
  localStorage.removeItem(
    STORAGE_KEY,
  );

  window.dispatchEvent(
    new CustomEvent(
      "wpms:activity-feed-updated",
    ),
  );
}
