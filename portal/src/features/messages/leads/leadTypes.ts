export type LeadChannel = "SMS" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Closed";

export type LeadMessage = {
  id: string;
  direction: "Inbound" | "Outbound";
  body: string;
  sentAt: string;
  status: "Received" | "Delivered" | "Failed";
};

export type MessageLead = {
  id: string;
  displayName: string;
  phone: string;
  email: string;
  channel: LeadChannel;
  status: LeadStatus;
  assignedTo: string;
  notes: string;
  unreadCount: number;
  firstContactAt: string;
  lastContactAt: string;
  convertedCustomerId?: string;
  messages: LeadMessage[];
};

export type IncomingContactMessage = {
  channel: LeadChannel;
  body: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  receivedAt?: string;
};
