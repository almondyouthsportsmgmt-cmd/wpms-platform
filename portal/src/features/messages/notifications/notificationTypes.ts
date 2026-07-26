export type NotificationStatus =
  | "pending"
  | "scheduled"
  | "sent"
  | "cancelled"
  | "failed";

export type NotificationChannel =
  | "sms"
  | "email"
  | "both";

export type NotificationQueueItem = {
  id: string;
  eventId: string;
  eventType: string;
  customerId: string;
  title: string;
  previousStart: string;
  previousEnd: string;
  newStart: string;
  newEnd: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledFor: string | null;
  createdAt: string;
  sentAt: string | null;
};
