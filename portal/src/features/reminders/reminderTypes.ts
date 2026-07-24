export type ReminderType =
  | "Appointment Confirmation"
  | "Appointment Reminder"
  | "Boarding Check-In"
  | "Boarding Check-Out"
  | "Vaccination Expiration"
  | "Payment Follow-Up"
  | "Membership Renewal"
  | "We Miss You";

export type ReminderChannel = "SMS" | "Email" | "Both";
export type ReminderStatus = "Scheduled" | "Sent" | "Skipped" | "Failed" | "Cancelled";

export type AutomatedReminder = {
  id: string;
  customerId: string;
  petId: string | null;
  type: ReminderType;
  channel: ReminderChannel;
  subject: string;
  message: string;
  scheduledFor: string;
  status: ReminderStatus;
  sentAt: string | null;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type ReminderInput = Omit<AutomatedReminder, "id" | "sentAt" | "errorMessage" | "createdAt" | "updatedAt">;
