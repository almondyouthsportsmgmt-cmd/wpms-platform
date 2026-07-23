import { useCallback, useEffect, useState } from "react";
import { createPet, listPets, updatePet } from "./petService";
import type { Pet, PetInput } from "./petTypes";

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPets(await listPets());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load pets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: PetInput, id?: string) {
    const saved = id ? await updatePet(id, input) : await createPet(input);
    setPets((current) => id
      ? current.map((item) => (item.id === id ? saved : item))
      : [saved, ...current]);
    return saved;
  }

  return { pets, loading, error, refresh, save };
}
