import {
  findCheckoutBySource,
} from "./checkoutService";

import type {
  CheckoutLineItem,
  CheckoutSourceType,
} from "../types/checkoutTypes";

export type CheckoutCandidateStatus =
  | "Ready"
  | "Already Added"
  | "Not Ready";

export interface AppointmentCheckoutRecord {
  id: string;
  customerId: string;
  petId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName: string;
  assignedStaff?: string;
  priceEstimate?: number | null;
  updatedAt?: string;
}

export interface BoardingCheckoutRecord {
  id: string;
  customerId: string;
  petId: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  status: string;
  kennelName?: string;
  dailyRate: number;
  updatedAt?: string;
}

export interface CheckoutCandidate {
  id: string;
  sourceType: "Grooming" | "Boarding";
  sourceId: string;
  customerId: string;
  petId: string;
  description: string;
  start: string;
  end: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: CheckoutCandidateStatus;
  existingSessionId?: string;
  sourceUpdatedAt?: string;
  notes?: string;
}

const appointmentReadyStatuses = new Set([
  "Completed",
  "Ready for Pickup",
]);

const boardingReadyStatuses = new Set([
  "Ready for Checkout",
  "Checked Out",
]);

function dateTime(
  date: string,
  time: string,
) {
  return new Date(
    `${date}T${time || "00:00"}:00`,
  );
}

function roundCurrency(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100,
  ) / 100;
}

function boardingNights(
  start: Date,
  end: Date,
) {
  return Math.max(
    1,
    Math.ceil(
      (end.getTime() - start.getTime()) /
        86_400_000,
    ),
  );
}

function overlaps(
  leftStart: Date,
  leftEnd: Date,
  rightStart: Date,
  rightEnd: Date,
) {
  return (
    leftStart < rightEnd &&
    leftEnd > rightStart
  );
}

function existingCheckout(
  sourceType: CheckoutSourceType,
  sourceId: string,
) {
  return findCheckoutBySource(
    sourceType,
    sourceId,
  );
}

export function appointmentToCheckoutCandidate(
  appointment: AppointmentCheckoutRecord,
): CheckoutCandidate {
  const start = dateTime(
    appointment.appointmentDate,
    appointment.startTime,
  );

  const end = dateTime(
    appointment.appointmentDate,
    appointment.endTime,
  );

  const existing = existingCheckout(
    "Grooming",
    appointment.id,
  );

  const ready =
    appointmentReadyStatuses.has(
      appointment.status,
    );

  const price = roundCurrency(
    Math.max(
      0,
      appointment.priceEstimate ?? 0,
    ),
  );

  return {
    id: `grooming-${appointment.id}`,
    sourceType: "Grooming",
    sourceId: appointment.id,
    customerId: appointment.customerId,
    petId: appointment.petId,
    description:
      appointment.serviceName ||
      "Grooming service",
    start: start.toISOString(),
    end: end.toISOString(),
    quantity: 1,
    unitPrice: price,
    total: price,
    status: existing
      ? "Already Added"
      : ready
        ? "Ready"
        : "Not Ready",
    existingSessionId:
      existing?.id,
    sourceUpdatedAt:
      appointment.updatedAt,
    notes:
      appointment.assignedStaff
        ? `Groomer: ${appointment.assignedStaff}`
        : undefined,
  };
}

export function boardingToCheckoutCandidate(
  stay: BoardingCheckoutRecord,
): CheckoutCandidate {
  const start = dateTime(
    stay.checkInDate,
    stay.checkInTime,
  );

  const end = dateTime(
    stay.checkOutDate,
    stay.checkOutTime,
  );

  const nights = boardingNights(
    start,
    end,
  );

  const existing = existingCheckout(
    "Boarding",
    stay.id,
  );

  const ready =
    boardingReadyStatuses.has(
      stay.status,
    );

  const unitPrice = roundCurrency(
    Math.max(0, stay.dailyRate),
  );

  return {
    id: `boarding-${stay.id}`,
    sourceType: "Boarding",
    sourceId: stay.id,
    customerId: stay.customerId,
    petId: stay.petId,
    description: `Boarding stay · ${nights} night${
      nights === 1 ? "" : "s"
    }`,
    start: start.toISOString(),
    end: end.toISOString(),
    quantity: nights,
    unitPrice,
    total: roundCurrency(
      nights * unitPrice,
    ),
    status: existing
      ? "Already Added"
      : ready
        ? "Ready"
        : "Not Ready",
    existingSessionId:
      existing?.id,
    sourceUpdatedAt:
      stay.updatedAt,
    notes:
      stay.kennelName
        ? `Kennel: ${stay.kennelName}`
        : undefined,
  };
}

export function findRelatedCheckoutCandidates(
  source:
    | AppointmentCheckoutRecord
    | BoardingCheckoutRecord,
  appointments: AppointmentCheckoutRecord[],
  boardingStays: BoardingCheckoutRecord[],
) {
  const isAppointment =
    "appointmentDate" in source;

  const sourceCustomerId =
    source.customerId;

  const sourceStart = isAppointment
    ? dateTime(
        source.appointmentDate,
        source.startTime,
      )
    : dateTime(
        source.checkInDate,
        source.checkInTime,
      );

  const sourceEnd = isAppointment
    ? dateTime(
        source.appointmentDate,
        source.endTime,
      )
    : dateTime(
        source.checkOutDate,
        source.checkOutTime,
      );

  const groomingCandidates =
    appointments
      .filter(
        (appointment) =>
          appointment.customerId ===
            sourceCustomerId &&
          (!isAppointment ||
            appointment.id !==
              source.id),
      )
      .map(
        appointmentToCheckoutCandidate,
      )
      .filter(
        (candidate) =>
          candidate.status !==
            "Not Ready" &&
          overlaps(
            sourceStart,
            sourceEnd,
            new Date(candidate.start),
            new Date(candidate.end),
          ),
      );

  const boardingCandidates =
    boardingStays
      .filter(
        (stay) =>
          stay.customerId ===
            sourceCustomerId &&
          (isAppointment ||
            stay.id !== source.id),
      )
      .map(
        boardingToCheckoutCandidate,
      )
      .filter(
        (candidate) =>
          candidate.status !==
            "Not Ready" &&
          overlaps(
            sourceStart,
            sourceEnd,
            new Date(candidate.start),
            new Date(candidate.end),
          ),
      );

  return [
    ...groomingCandidates,
    ...boardingCandidates,
  ].sort(
    (left, right) =>
      new Date(left.start).getTime() -
      new Date(right.start).getTime(),
  );
}

export function checkoutCandidateToLineItem(
  candidate: CheckoutCandidate,
): Omit<CheckoutLineItem, "id"> {
  return {
    sourceType:
      candidate.sourceType,
    sourceId:
      candidate.sourceId,
    customerId:
      candidate.customerId,
    petId:
      candidate.petId,
    description:
      candidate.description,
    quantity:
      candidate.quantity,
    unitPrice:
      candidate.unitPrice,
    taxable: true,
    discountAmount: 0,
    notes:
      candidate.notes,
    sourceUpdatedAt:
      candidate.sourceUpdatedAt,
  };
}
