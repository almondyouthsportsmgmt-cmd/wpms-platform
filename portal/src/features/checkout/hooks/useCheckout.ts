import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCheckoutLineItem,
  addCheckoutPayment,
  cancelCheckoutSession,
  createCheckoutSession,
  deleteCheckoutSession,
  getCheckoutSession,
  listCheckoutSessions,
  markCheckoutReady,
  removeCheckoutLineItem,
  updateCheckoutLineItem,
  updateCheckoutSession,
} from "../services/checkoutService";

import {
  checkoutTotals,
} from "../services/checkoutCalculations";

import type {
  CheckoutLineItem,
  CheckoutPayment,
  CheckoutSession,
  CheckoutSessionUpdate,
  CreateCheckoutSessionInput,
} from "../types/checkoutTypes";

export function useCheckout() {
  const [sessions, setSessions] =
    useState<CheckoutSession[]>([]);

  const [activeSessionId, setActiveSessionId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const refresh = useCallback(() => {
    setSessions(
      listCheckoutSessions(),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();

    function handleStorageUpdate() {
      refresh();
    }

    window.addEventListener(
      "wpms:checkout-storage-updated",
      handleStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        "wpms:checkout-storage-updated",
        handleStorageUpdate,
      );
    };
  }, [refresh]);

  const activeSession = useMemo(
    () =>
      activeSessionId
        ? getCheckoutSession(
            activeSessionId,
          )
        : null,
    [
      activeSessionId,
      sessions,
    ],
  );

  const activeTotals = useMemo(
    () =>
      activeSession
        ? checkoutTotals(
            activeSession,
          )
        : null,
    [activeSession],
  );

  async function run<T>(
    action: () => T | Promise<T>,
  ) {
    setWorking(true);
    setError("");

    try {
      const result = await action();
      refresh();
      return result;
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to update checkout.";

      setError(message);
      throw caught;
    } finally {
      setWorking(false);
    }
  }

  return {
    sessions,
    activeSession,
    activeSessionId,
    activeTotals,
    loading,
    working,
    error,
    refresh,

    setActiveSessionId,

    clearError() {
      setError("");
    },

    async create(
      input: CreateCheckoutSessionInput,
    ) {
      const session = await run(() =>
        createCheckoutSession(input),
      );

      setActiveSessionId(
        session.id,
      );

      return session;
    },

    update(
      sessionId: string,
      update: CheckoutSessionUpdate,
    ) {
      return run(() =>
        updateCheckoutSession(
          sessionId,
          update,
        ),
      );
    },

    addLine(
      sessionId: string,
      item: Omit<
        CheckoutLineItem,
        "id"
      > & {
        id?: string;
      },
    ) {
      return run(() =>
        addCheckoutLineItem(
          sessionId,
          item,
        ),
      );
    },

    updateLine(
      sessionId: string,
      lineItemId: string,
      update: Partial<
        Omit<
          CheckoutLineItem,
          "id" | "customerId"
        >
      >,
    ) {
      return run(() =>
        updateCheckoutLineItem(
          sessionId,
          lineItemId,
          update,
        ),
      );
    },

    removeLine(
      sessionId: string,
      lineItemId: string,
    ) {
      return run(() =>
        removeCheckoutLineItem(
          sessionId,
          lineItemId,
        ),
      );
    },

    addPayment(
      sessionId: string,
      payment: Omit<
        CheckoutPayment,
        "id" | "receivedAt"
      > & {
        id?: string;
        receivedAt?: string;
      },
    ) {
      return run(() =>
        addCheckoutPayment(
          sessionId,
          payment,
        ),
      );
    },

    markReady(
      sessionId: string,
    ) {
      return run(() =>
        markCheckoutReady(
          sessionId,
        ),
      );
    },

    cancel(
      sessionId: string,
    ) {
      return run(() =>
        cancelCheckoutSession(
          sessionId,
        ),
      );
    },

    deleteOne(
      sessionId: string,
    ) {
      return run(() => {
        deleteCheckoutSession(
          sessionId,
        );

        if (
          activeSessionId ===
          sessionId
        ) {
          setActiveSessionId("");
        }
      });
    },
  };
}
