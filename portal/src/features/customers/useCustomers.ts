import { useCallback, useEffect, useState } from "react";
import { createCustomer, listCustomers, updateCustomer } from "./customerService";
import type { Customer, CustomerInput } from "./customerTypes";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCustomers(await listCustomers());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: CustomerInput, id?: string) {
    const saved = id ? await updateCustomer(id, input) : await createCustomer(input);
    setCustomers((current) => id
      ? current.map((item) => (item.id === id ? saved : item))
      : [saved, ...current]);
    return saved;
  }

  return { customers, loading, error, refresh, save };
}
