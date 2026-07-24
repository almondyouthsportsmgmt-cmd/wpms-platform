export type CustomerSegment = "VIP" | "Loyal" | "New" | "At Risk" | "Dormant" | "Prospect";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
export type CampaignChannel = "Email" | "SMS" | "Both";
export type CampaignStatus = "Draft" | "Scheduled" | "Active" | "Completed" | "Cancelled";

export type CrmProfile = {
  id: string;
  customerId: string;
  segment: CustomerSegment;
  lifetimeValue: number;
  totalVisits: number;
  groomingVisits: number;
  boardingVisits: number;
  lastVisitAt: string;
  nextRecommendedVisit: string;
  referralSource: string;
  tags: string[];
  internalNotes: string;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  audienceSegment: CustomerSegment | "All Customers";
  subject: string;
  message: string;
  scheduledAt: string;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  revenueAttributed: number;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  source: string;
  status: LeadStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CampaignInput = Omit<MarketingCampaign, "id" | "sentCount" | "openedCount" | "clickedCount" | "convertedCount" | "revenueAttributed" | "createdAt" | "updatedAt">;
export type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;
