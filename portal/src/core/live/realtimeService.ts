import {
  publishLiveEvent,
} from "./eventBus";

import type {
  LiveEvent,
  LiveEventInput,
} from "./eventTypes";

const CHANNEL_NAME =
  "wpms-live-operations";

let channel:
  | BroadcastChannel
  | null = null;

let started = false;

function supportsBroadcastChannel() {
  return typeof BroadcastChannel !==
    "undefined";
}

export function startRealtimeService() {
  if (
    started ||
    !supportsBroadcastChannel()
  ) {
    return;
  }

  channel = new BroadcastChannel(
    CHANNEL_NAME,
  );

  channel.addEventListener(
    "message",
    (message) => {
      const event =
        message.data as LiveEvent;

      publishLiveEvent({
        ...event,
        id: event.id,
        occurredAt:
          event.occurredAt,
      });
    },
  );

  started = true;
}

export function stopRealtimeService() {
  channel?.close();
  channel = null;
  started = false;
}

export function broadcastLiveEvent(
  input: LiveEventInput,
) {
  if (!channel) {
    return;
  }

  const event: LiveEvent = {
    ...input,
    id:
      input.id ??
      crypto.randomUUID(),
    occurredAt:
      input.occurredAt ??
      new Date().toISOString(),
    payload: input.payload ?? {},
  };

  channel.postMessage(event);
}

export function isRealtimeServiceRunning() {
  return started;
}
