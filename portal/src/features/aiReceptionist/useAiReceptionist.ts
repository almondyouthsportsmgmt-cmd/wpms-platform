import { useCallback, useEffect, useState } from "react";
import {
  listReceptionistConversations,
  updateConversationStatus,
} from "./aiReceptionistService";
import type {
  ReceptionistConversation,
  ReceptionistConversationStatus,
} from "./aiReceptionistTypes";

export function useAiReceptionist() {
  const [conversations, setConversations] = useState<ReceptionistConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setConversations(await listReceptionistConversations());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load receptionist conversations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function setStatus(id: string, status: ReceptionistConversationStatus, assignedTo: string) {
    const updated = await updateConversationStatus(id, status, assignedTo);
    setConversations((current) => current.map((item) => item.id === id ? updated : item));
    return updated;
  }

  return { conversations, loading, error, refresh, setStatus };
}
