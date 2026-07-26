import {
  useContext,
  useEffect,
} from "react";

import { LiveContext } from "./LiveContext";

import type {
  LiveEvent,
  LiveEventType,
} from "./eventTypes";

export function useLive() {
  const context =
    useContext(LiveContext);

  if (!context) {
    throw new Error(
      "useLive must be used inside LiveProvider.",
    );
  }

  return context;
}

export function useLiveSubscription(
  type: LiveEventType | "*",
  listener: (
    event: LiveEvent,
  ) => void,
) {
  const { subscribe } = useLive();

  useEffect(
    () =>
      subscribe(type, listener),
    [
      listener,
      subscribe,
      type,
    ],
  );
}
