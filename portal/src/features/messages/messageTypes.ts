export type MessageDirection = "Inbound" | "Outbound";
export type MessageStatus = "Sent" | "Delivered" | "Failed" | "Received";

export type MessageThread = {
  id: string;
  customerId: string;
  subject: string;
  lastMessageAt: string;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  customerId: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  sentAt: string;
  createdAt: string;
};
