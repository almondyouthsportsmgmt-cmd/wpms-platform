export type LiveEventType =
  | "appointment.created"
  | "appointment.updated"
  | "appointment.rescheduled"
  | "appointment.cancelled"
  | "appointment.completed"
  | "boarding.created"
  | "boarding.updated"
  | "boarding.checkin"
  | "boarding.checkout"
  | "boarding.cancelled"
  | "customer.created"
  | "customer.updated"
  | "pet.created"
  | "pet.updated"
  | "message.sent"
  | "message.received"
  | "notification.queued"
  | "notification.sent"
  | "notification.failed"
  | "payment.received"
  | "invoice.created"
  | "kennel.updated"
  | "inventory.low"
  | "system.refresh";

export type LiveEventSource =
  | "appointments"
  | "boarding"
  | "customers"
  | "pets"
  | "messages"
  | "payments"
  | "kennels"
  | "inventory"
  | "calendar"
  | "dashboard"
  | "system";

export type LiveEventPriority =
  | "low"
  | "normal"
  | "high"
  | "critical";

export type LiveEventPayload = Record<
  string,
  unknown
>;

export interface LiveEvent<
  TPayload extends LiveEventPayload =
    LiveEventPayload,
> {
  id: string;
  type: LiveEventType;
  source: LiveEventSource;
  occurredAt: string;
  title: string;
  description?: string;
  priority: LiveEventPriority;
  organizationId?: string;
  customerId?: string;
  petId?: string;
  referenceId?: string;
  payload: TPayload;
}

export type LiveEventInput<
  TPayload extends LiveEventPayload =
    LiveEventPayload,
> = Omit<
  LiveEvent<TPayload>,
  "id" | "occurredAt"
> & {
  id?: string;
  occurredAt?: string;
};
