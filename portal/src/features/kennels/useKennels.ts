import { useCallback, useEffect, useState } from "react";
import { createKennel, listKennels, updateKennel } from "./kennelService";
import type { Kennel, KennelInput } from "./kennelTypes";

export function useKennels() {
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setKennels(await listKennels()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load kennel map."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: KennelInput, id?: string) {
    const saved = id ? await updateKennel(id, input) : await createKennel(input);
    setKennels((current) => {
      const next = id ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
    return saved;
  }

  return { kennels, loading, error, refresh, save };
}
