import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  liveEventBus,
  publishLiveEvent,
} from "./eventBus";

import type {
  LiveEvent,
  LiveEventInput,
  LiveEventType,
} from "./eventTypes";

export function useLiveEvent(
  type: LiveEventType | "*",
  listener: (
    event: LiveEvent,
  ) => void,
) {
  useEffect(
    () =>
      liveEventBus.subscribe(
        type,
        listener,
      ),
    [listener, type],
  );
}

export function useLiveEvents(
  types?: LiveEventType[],
) {
  const [events, setEvents] =
    useState<LiveEvent[]>([]);

  useEffect(() => {
    const listener = (
      event: LiveEvent,
    ) => {
      if (
        types?.length &&
        !types.includes(event.type)
      ) {
        return;
      }

      setEvents((current) => [
        event,
        ...current.slice(0, 99),
      ]);
    };

    return liveEventBus.subscribe(
      "*",
      listener,
    );
  }, [types]);

  const publish = useCallback(
    (input: LiveEventInput) =>
      publishLiveEvent(input),
    [],
  );

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    publish,
    clear,
  };
}
