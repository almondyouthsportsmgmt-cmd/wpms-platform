import { createContext } from "react";

import type {
  LiveEvent,
  LiveEventInput,
  LiveEventType,
} from "./eventTypes";

export interface LiveContextValue {
  connected: boolean;
  lastEvent: LiveEvent | null;
  publish: (
    input: LiveEventInput,
  ) => LiveEvent;
  subscribe: (
    type: LiveEventType | "*",
    listener: (
      event: LiveEvent,
    ) => void,
  ) => () => void;
}

export const LiveContext =
  createContext<LiveContextValue | null>(
    null,
  );
