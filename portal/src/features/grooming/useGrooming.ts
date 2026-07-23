import { useCallback, useEffect, useState } from "react";
import { createGroomingSession, listGroomingSessions, updateGroomingSession } from "./groomingService";
import type { GroomingSession, GroomingSessionInput } from "./groomingTypes";

export function useGrooming() {
  const [sessions, setSessions] = useState<GroomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => { setLoading(true); setError(""); try { setSessions(await listGroomingSessions()); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load grooming workflow."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function save(input: GroomingSessionInput, id?: string) {
    const saved = id ? await updateGroomingSession(id, input) : await createGroomingSession(input);
    setSessions((current) => id ? current.map((item) => item.id === id ? saved : item) : [...current, saved]);
    return saved;
  }
  return { sessions, loading, error, refresh, save };
}
