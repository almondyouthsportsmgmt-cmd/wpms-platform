import { useCallback, useEffect, useState } from "react";
import { createBoardingStay, listBoardingStays, updateBoardingStay } from "./boardingService";
import type { BoardingStay, BoardingStayInput } from "./boardingTypes";

export function useBoarding() {
  const [stays, setStays] = useState<BoardingStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStays(await listBoardingStays());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load boarding stays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: BoardingStayInput, id?: string) {
    const saved = id ? await updateBoardingStay(id, input) : await createBoardingStay(input);
    setStays((current) => {
      const next = id ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      return next.sort((a, b) => `${a.checkInDate}T${a.checkInTime}`.localeCompare(`${b.checkInDate}T${b.checkInTime}`));
    });
    return saved;
  }

  async function setStatus(id: string, status: BoardingStay["status"]) {
    const existing = stays.find((item) => item.id === id);
    if (!existing) throw new Error("Boarding stay not found.");
    return save({ ...existing, status }, id);
  }

  return { stays, loading, error, refresh, save, setStatus };
}
