import {
  useEffect,
  useState,
} from "react";

import {
  isRealtimeServiceRunning,
  startRealtimeService,
  stopRealtimeService,
} from "./realtimeService";

export function useRealtime() {
  const [connected, setConnected] =
    useState(
      isRealtimeServiceRunning(),
    );

  useEffect(() => {
    startRealtimeService();

    setConnected(
      isRealtimeServiceRunning(),
    );

    return () => {
      stopRealtimeService();
      setConnected(false);
    };
  }, []);

  return {
    connected,
  };
}
