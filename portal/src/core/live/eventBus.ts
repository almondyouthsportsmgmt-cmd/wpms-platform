import type {
  LiveEvent,
  LiveEventInput,
  LiveEventType,
} from "./eventTypes";

type LiveEventListener = (
  event: LiveEvent,
) => void;

type Unsubscribe = () => void;

const ALL_EVENTS = "*";

class LiveEventBus {
  private listeners = new Map<
    LiveEventType | typeof ALL_EVENTS,
    Set<LiveEventListener>
  >();

  publish(input: LiveEventInput): LiveEvent {
    const event: LiveEvent = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      occurredAt:
        input.occurredAt ??
        new Date().toISOString(),
      payload: input.payload ?? {},
    };

    this.emit(event.type, event);
    this.emit(ALL_EVENTS, event);

    window.dispatchEvent(
      new CustomEvent("wpms:live-event", {
        detail: event,
      }),
    );

    return event;
  }

  subscribe(
    type: LiveEventType | typeof ALL_EVENTS,
    listener: LiveEventListener,
  ): Unsubscribe {
    const current =
      this.listeners.get(type) ??
      new Set<LiveEventListener>();

    current.add(listener);
    this.listeners.set(type, current);

    return () => {
      const listeners =
        this.listeners.get(type);

      listeners?.delete(listener);

      if (listeners?.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  once(
    type: LiveEventType,
    listener: LiveEventListener,
  ): Unsubscribe {
    const unsubscribe = this.subscribe(
      type,
      (event) => {
        unsubscribe();
        listener(event);
      },
    );

    return unsubscribe;
  }

  clear() {
    this.listeners.clear();
  }

  private emit(
    type: LiveEventType | typeof ALL_EVENTS,
    event: LiveEvent,
  ) {
    const listeners =
      this.listeners.get(type);

    if (!listeners) {
      return;
    }

    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(
          "WPMS live event listener failed.",
          error,
        );
      }
    });
  }
}

export const liveEventBus =
  new LiveEventBus();

export function publishLiveEvent(
  input: LiveEventInput,
) {
  return liveEventBus.publish(input);
}
