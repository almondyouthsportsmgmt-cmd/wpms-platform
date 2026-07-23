import { useCallback, useEffect, useState } from "react";
import { createTimelineEvent, listTimelineEvents } from "./petTimelineService";
import type { PetTimelineEvent, PetTimelineEventInput } from "./petTimelineTypes";

export function usePetTimeline() {
  const [events, setEvents] = useState<PetTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setEvents(await listTimelineEvents()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load timeline."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function add(input: PetTimelineEventInput) {
    const saved = await createTimelineEvent(input);
    setEvents((current) => [saved, ...current]);
    return saved;
  }

  return { events, loading, error, refresh, add };
}
