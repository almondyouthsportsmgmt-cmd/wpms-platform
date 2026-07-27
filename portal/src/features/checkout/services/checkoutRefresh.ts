import {
  appointmentToCheckoutCandidate,
  boardingToCheckoutCandidate,
  checkoutCandidateToLineItem,
} from "./checkoutDetection";

import {
  updateCheckoutLineItem,
} from "./checkoutService";

import type {
  AppointmentCheckoutRecord,
  BoardingCheckoutRecord,
  CheckoutCandidate,
} from "./checkoutDetection";

import type {
  CheckoutLineItem,
  CheckoutSession,
} from "../types/checkoutTypes";

export type CheckoutSourceRefreshStatus =
  | "Current"
  | "Changed"
  | "Missing";

export interface CheckoutSourceRefreshItem {
  lineItemId: string;
  sourceType: "Grooming" | "Boarding";
  sourceId: string;
  status: CheckoutSourceRefreshStatus;
  currentLine: CheckoutLineItem;
  refreshedLine?: Omit<CheckoutLineItem, "id">;
  changes: string[];
}

function money(value: number) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    },
  ).format(value);
}

function candidateForLine(
  line: CheckoutLineItem,
  appointments: AppointmentCheckoutRecord[],
  boardingStays: BoardingCheckoutRecord[],
): CheckoutCandidate | null {
  if (
    line.sourceType === "Grooming" &&
    line.sourceId
  ) {
    const appointment =
      appointments.find(
        (item) =>
          item.id === line.sourceId,
      );

    return appointment
      ? appointmentToCheckoutCandidate(
          appointment,
        )
      : null;
  }

  if (
    line.sourceType === "Boarding" &&
    line.sourceId
  ) {
    const stay =
      boardingStays.find(
        (item) =>
          item.id === line.sourceId,
      );

    return stay
      ? boardingToCheckoutCandidate(
          stay,
        )
      : null;
  }

  return null;
}

function compareLine(
  current: CheckoutLineItem,
  refreshed: Omit<
    CheckoutLineItem,
    "id"
  >,
) {
  const changes: string[] = [];

  if (
    current.description !==
    refreshed.description
  ) {
    changes.push(
      `Description changed to "${refreshed.description}".`,
    );
  }

  if (
    current.quantity !==
    refreshed.quantity
  ) {
    changes.push(
      `Quantity changed from ${current.quantity} to ${refreshed.quantity}.`,
    );
  }

  if (
    current.unitPrice !==
    refreshed.unitPrice
  ) {
    changes.push(
      `Unit price changed from ${money(
        current.unitPrice,
      )} to ${money(
        refreshed.unitPrice,
      )}.`,
    );
  }

  if (
    current.notes !==
    refreshed.notes
  ) {
    changes.push(
      "Source notes changed.",
    );
  }

  if (
    current.sourceUpdatedAt !==
    refreshed.sourceUpdatedAt
  ) {
    changes.push(
      "Source record has a newer update timestamp.",
    );
  }

  return changes;
}

export function detectCheckoutSourceChanges(
  session: CheckoutSession,
  appointments: AppointmentCheckoutRecord[],
  boardingStays: BoardingCheckoutRecord[],
): CheckoutSourceRefreshItem[] {
  return session.lineItems
    .filter(
      (line) =>
        (line.sourceType ===
          "Grooming" ||
          line.sourceType ===
            "Boarding") &&
        Boolean(line.sourceId),
    )
    .map((line) => {
      const candidate =
        candidateForLine(
          line,
          appointments,
          boardingStays,
        );

      if (!candidate) {
        return {
          lineItemId: line.id,
          sourceType:
            line.sourceType as
              | "Grooming"
              | "Boarding",
          sourceId:
            line.sourceId!,
          status:
            "Missing" as const,
          currentLine: line,
          changes: [
            "The source record could not be found.",
          ],
        };
      }

      const refreshed =
        checkoutCandidateToLineItem(
          candidate,
        );

      const changes =
        compareLine(
          line,
          refreshed,
        );

      return {
        lineItemId: line.id,
        sourceType:
          line.sourceType as
            | "Grooming"
            | "Boarding",
        sourceId:
          line.sourceId!,
        status:
          changes.length > 0
            ? ("Changed" as const)
            : ("Current" as const),
        currentLine: line,
        refreshedLine: refreshed,
        changes,
      };
    });
}

export function refreshCheckoutSourceLine(
  sessionId: string,
  item: CheckoutSourceRefreshItem,
) {
  if (
    item.status !== "Changed" ||
    !item.refreshedLine
  ) {
    return null;
  }

  return updateCheckoutLineItem(
    sessionId,
    item.lineItemId,
    {
      sourceType:
        item.refreshedLine
          .sourceType,
      sourceId:
        item.refreshedLine
          .sourceId,
      petId:
        item.refreshedLine.petId,
      description:
        item.refreshedLine
          .description,
      quantity:
        item.refreshedLine.quantity,
      unitPrice:
        item.refreshedLine.unitPrice,
      taxable:
        item.refreshedLine.taxable,
      notes:
        item.refreshedLine.notes,
      sourceUpdatedAt:
        item.refreshedLine
          .sourceUpdatedAt,
    },
  );
}

export function refreshAllCheckoutSources(
  sessionId: string,
  items: CheckoutSourceRefreshItem[],
) {
  let updated:
    | CheckoutSession
    | null = null;

  items
    .filter(
      (item) =>
        item.status === "Changed" &&
        item.refreshedLine,
    )
    .forEach((item) => {
      updated =
        refreshCheckoutSourceLine(
          sessionId,
          item,
        );
    });

  return updated;
}
