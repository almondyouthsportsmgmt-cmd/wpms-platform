import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  liveEventBus,
  publishLiveEvent,
} from "./eventBus";

import {
  startLiveOperationsEngine,
  stopLiveOperationsEngine,
} from "./liveOperationsEngine";

import { LiveContext } from "./LiveContext";

import type {
  LiveEvent,
  LiveEventInput,
  LiveEventType,
} from "./eventTypes";

type Props = {
  children: ReactNode;
};

export function LiveProvider({
  children,
}: Props) {
  const [connected, setConnected] =
    useState(false);

  const [lastEvent, setLastEvent] =
    useState<LiveEvent | null>(null);

  useEffect(() => {
    startLiveOperationsEngine();
    setConnected(true);

    const unsubscribe =
      liveEventBus.subscribe(
        "*",
        (event) => {
          setLastEvent(event);
        },
      );

    return () => {
      unsubscribe();
      stopLiveOperationsEngine();
      setConnected(false);
    };
  }, []);

  const publish = useCallback(
    (input: LiveEventInput) =>
      publishLiveEvent(input),
    [],
  );

  const subscribe = useCallback(
    (
      type: LiveEventType | "*",
      listener: (
        event: LiveEvent,
      ) => void,
    ) =>
      liveEventBus.subscribe(
        type,
        listener,
      ),
    [],
  );

  const value = useMemo(
    () => ({
      connected,
      lastEvent,
      publish,
      subscribe,
    }),
    [
      connected,
      lastEvent,
      publish,
      subscribe,
    ],
  );

  return (
    <LiveContext.Provider
      value={value}
    >
      {children}
    </LiveContext.Provider>
  );
}
