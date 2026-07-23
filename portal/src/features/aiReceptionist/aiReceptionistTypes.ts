export type ReceptionistIntent =
  | "Book Appointment"
  | "Reschedule Appointment"
  | "Cancel Appointment"
  | "Boarding Availability"
  | "Pricing Question"
  | "Vaccination Question"
  | "Hours & Location"
  | "Speak to Staff"
  | "General Question";

export type ReceptionistConversationStatus = "Open" | "Resolved" | "Escalated";

export type ReceptionistConversation = {
  id: string;
  customerName: string;
  customerPhone: string;
  channel: "Web Chat" | "SMS" | "Phone Note";
  intent: ReceptionistIntent;
  summary: string;
  lastMessage: string;
  lastMessageAt: string;
  status: ReceptionistConversationStatus;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type ReceptionistReply = {
  intent: ReceptionistIntent;
  reply: string;
  suggestedAction: string;
  confidence: number;
  shouldEscalate: boolean;
};
