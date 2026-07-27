import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  detectCheckoutSourceChanges,
  refreshAllCheckoutSources,
  refreshCheckoutSourceLine,
} from "../services/checkoutRefresh";

import type {
  AppointmentCheckoutRecord,
  BoardingCheckoutRecord,
} from "../services/checkoutDetection";

import type {
  CheckoutSession,
} from "../types/checkoutTypes";

export function useCheckoutRefresh(
  session: CheckoutSession | null,
  appointments: AppointmentCheckoutRecord[],
  boardingStays: BoardingCheckoutRecord[],
  onRefreshed?: () => void,
) {
  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const items = useMemo(
    () =>
      session
        ? detectCheckoutSourceChanges(
            session,
            appointments,
            boardingStays,
          )
        : [],
    [
      appointments,
      boardingStays,
      session,
    ],
  );

  const changedCount =
    items.filter(
      (item) =>
        item.status === "Changed",
    ).length;

  const missingCount =
    items.filter(
      (item) =>
        item.status === "Missing",
    ).length;

  const refreshOne = useCallback(
    async (
      item: (typeof items)[number],
    ) => {
      if (!session) {
        return;
      }

      setWorking(true);
      setError("");

      try {
        refreshCheckoutSourceLine(
          session.id,
          item,
        );

        onRefreshed?.();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to refresh invoice line.",
        );
      } finally {
        setWorking(false);
      }
    },
    [
      onRefreshed,
      session,
    ],
  );

  const refreshAll = useCallback(
    async () => {
      if (!session) {
        return;
      }

      setWorking(true);
      setError("");

      try {
        refreshAllCheckoutSources(
          session.id,
          items,
        );

        onRefreshed?.();
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to refresh invoice.",
        );
      } finally {
        setWorking(false);
      }
    },
    [
      items,
      onRefreshed,
      session,
    ],
  );

  return {
    items,
    changedCount,
    missingCount,
    working,
    error,
    refreshOne,
    refreshAll,
    clearError() {
      setError("");
    },
  };
}
