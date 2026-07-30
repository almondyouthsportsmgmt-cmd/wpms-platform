export type ScheduleEventType =
  | "grooming"
  | "boarding"
  | "boarding-checkin"
  | "boarding-checkout"
  | "maintenance"
  | "employee-pto"
  | "blocked"
  | "holiday";

export type ResourceType =
  | "groomer"
  | "grooming-table"
  | "kennel"
  | "employee"
  | "room"
  | "equipment";

export type ScheduleStatus =
  | "pending"
  | "awaiting-customer"
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled";

export interface ScheduleResource {
  id: string;
  type: ResourceType;
  name: string;
  active: boolean;
}

export interface ScheduleEvent {
  id: string;

  type: ScheduleEventType;

  status: ScheduleStatus;

  title: string;

  customerId?: string;

  petIds: string[];

  resourceIds: string[];

  referenceId?: string;

  start: string;

  end: string;

  notes?: string;
}

export interface AvailabilityRequest {
  date: string;

  durationMinutes: number;

  resourceIds: string[];

  eventType: ScheduleEventType;

  excludeEventId?: string;
}

export interface TimeSlot {
  start: string;

  end: string;

  available: boolean;

  reason?: string;
}

export interface AvailabilityResult {
  success: boolean;

  slots: TimeSlot[];
}

export interface Conflict {
  resourceId: string;

  resourceName: string;

  existingEventId: string;

  existingEventTitle: string;

  existingStart: string;

  existingEnd: string;

  reason: string;
}

export interface ConflictResult {
  hasConflict: boolean;

  conflicts: Conflict[];
}

export interface BookingRequest {
  event: ScheduleEvent;
}

export interface BookingResult {
  success: boolean;

  conflicts: Conflict[];

  event?: ScheduleEvent;
}

export interface ResourceLock {
  id: string;

  resourceId: string;

  eventId?: string;

  employeeId: string;

  start: string;

  end: string;

  expiresAt: string;
}