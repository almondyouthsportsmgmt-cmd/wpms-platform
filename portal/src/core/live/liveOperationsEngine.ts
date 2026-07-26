import {
  addActivity,
} from "./activityFeedService";

import {
  liveEventBus,
} from "./eventBus";

let started = false;
let stopActivityListener:
  | (() => void)
  | null = null;

export function startLiveOperationsEngine() {
  if (started) {
    return;
  }

  stopActivityListener =
    liveEventBus.subscribe(
      "*",
      (event) => {
        addActivity(event);
      },
    );

  started = true;
}

export function stopLiveOperationsEngine() {
  stopActivityListener?.();
  stopActivityListener = null;
  started = false;
}

export function isLiveOperationsRunning() {
  return started;
}
