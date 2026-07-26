import { useCallback, useEffect, useState } from "react";
import {
  bulkUpdatePrices,
  createGroomingService,
  deleteGroomingService,
  duplicateGroomingService,
  listGroomingServices,
  updateGroomingService,
} from "./groomingServiceCatalogService";
import type {
  GroomingService,
  GroomingServiceInput,
} from "./groomingServiceTypes";

export function useGroomingServices() {
  const [services, setServices] = useState<GroomingService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setServices(await listGroomingServices());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function save(input: GroomingServiceInput, id?: string) {
    const saved = id
      ? await updateGroomingService(id, input)
      : await createGroomingService(input);
    await refresh();
    return saved;
  }

  async function remove(id: string) {
    await deleteGroomingService(id);
    setServices((current) => current.filter((item) => item.id !== id));
  }

  async function duplicate(service: GroomingService) {
    const saved = await duplicateGroomingService(service);
    await refresh();
    return saved;
  }

  async function raisePrices(
    ids: string[],
    mode: "percent" | "amount",
    value: number,
  ) {
    await bulkUpdatePrices(ids, mode, value);
    await refresh();
  }

  return {
    services,
    loading,
    error,
    refresh,
    save,
    remove,
    duplicate,
    raisePrices,
  };
}
