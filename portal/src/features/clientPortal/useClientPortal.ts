import { useCallback, useEffect, useState } from "react";
import { listPortalAccess, savePortalAccess } from "./clientPortalService";
import type { PortalAccess, PortalAccessInput } from "./clientPortalTypes";

export function useClientPortal() {
  const [access, setAccess] = useState<PortalAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAccess(await listPortalAccess());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load portal access.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: PortalAccessInput, id?: string) {
    const saved = await savePortalAccess(input, id);
    setAccess((current) => id
      ? current.map((item) => item.id === id ? saved : item)
      : [saved, ...current]);
    return saved;
  }

  return { access, loading, error, refresh, save };
}
