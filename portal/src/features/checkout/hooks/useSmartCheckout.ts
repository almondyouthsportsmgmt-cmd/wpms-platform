import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  appointmentToCheckoutCandidate,
  boardingToCheckoutCandidate,
  checkoutCandidateToLineItem,
  findRelatedCheckoutCandidates,
} from "../services/checkoutDetection";

import {
  createCheckoutSession,
  addCheckoutLineItem,
} from "../services/checkoutService";

import type {
  AppointmentCheckoutRecord,
  BoardingCheckoutRecord,
  CheckoutCandidate,
} from "../services/checkoutDetection";

type SourceRecord =
  | AppointmentCheckoutRecord
  | BoardingCheckoutRecord;

type OpenOptions = {
  source: SourceRecord;
  appointments: AppointmentCheckoutRecord[];
  boardingStays: BoardingCheckoutRecord[];
  createdBy?: string;
  taxRate?: number;
};

export function useSmartCheckout() {
  const navigate = useNavigate();

  const [primary, setPrimary] =
    useState<CheckoutCandidate | null>(
      null,
    );

  const [related, setRelated] =
    useState<CheckoutCandidate[]>([]);

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [settings, setSettings] =
    useState<{
      createdBy?: string;
      taxRate?: number;
    }>({});

  const open = useMemo(
    () => primary !== null,
    [primary],
  );

  function close() {
    if (working) {
      return;
    }

    setPrimary(null);
    setRelated([]);
    setSelectedIds([]);
    setError("");
    setSettings({});
  }

  function start(options: OpenOptions) {
    setError("");

    const candidate =
      "appointmentDate" in
      options.source
        ? appointmentToCheckoutCandidate(
            options.source,
          )
        : boardingToCheckoutCandidate(
            options.source,
          );

    const relatedCandidates =
      findRelatedCheckoutCandidates(
        options.source,
        options.appointments,
        options.boardingStays,
      );

    setPrimary(candidate);
    setRelated(relatedCandidates);

    setSelectedIds(
      relatedCandidates
        .filter(
          (item) =>
            item.status === "Ready",
        )
        .map((item) => item.id),
    );

    setSettings({
      createdBy: options.createdBy,
      taxRate: options.taxRate,
    });
  }

  function toggle(
    candidateId: string,
  ) {
    setSelectedIds((current) =>
      current.includes(candidateId)
        ? current.filter(
            (id) => id !== candidateId,
          )
        : [...current, candidateId],
    );
  }

  function openExisting(
    sessionId: string,
  ) {
    close();

    navigate(
      `/checkout/${sessionId}`,
    );
  }

  async function createSession(
    includeRelated: boolean,
  ) {
    if (!primary) {
      return;
    }

    if (
      primary.status ===
        "Already Added" &&
      primary.existingSessionId
    ) {
      openExisting(
        primary.existingSessionId,
      );
      return;
    }

    if (
      primary.status !== "Ready"
    ) {
      setError(
        "This record is not ready for checkout.",
      );
      return;
    }

    setWorking(true);
    setError("");

    try {
      const session =
        createCheckoutSession({
          customerId:
            primary.customerId,
          createdBy:
            settings.createdBy,
          taxRate:
            settings.taxRate,
        });

      const candidates = [
        primary,
        ...(includeRelated
          ? related.filter(
              (candidate) =>
                selectedIds.includes(
                  candidate.id,
                ) &&
                candidate.status ===
                  "Ready",
            )
          : []),
      ];

      let updatedSession = session;

      for (const candidate of candidates) {
        const alreadyPresent =
          updatedSession.lineItems.some(
            (line) =>
              line.sourceType ===
                candidate.sourceType &&
              line.sourceId ===
                candidate.sourceId,
          );

        if (alreadyPresent) {
          continue;
        }

        updatedSession =
          addCheckoutLineItem(
            updatedSession.id,
            checkoutCandidateToLineItem(
              candidate,
            ),
          );
      }

      const sessionId =
        updatedSession.id;

      close();

      navigate(
        `/checkout/${sessionId}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to start checkout.",
      );
    } finally {
      setWorking(false);
    }
  }

  return {
    open,
    primary,
    related,
    selectedIds,
    working,
    error,
    start,
    close,
    toggle,
    openExisting,

    continueSelected() {
      return createSession(true);
    },

    checkoutPrimaryOnly() {
      return createSession(false);
    },
  };
}
