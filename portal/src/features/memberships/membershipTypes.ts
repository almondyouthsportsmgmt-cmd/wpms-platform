export type MembershipStatus = "Active" | "Paused" | "Cancelled" | "Expired";
export type BillingFrequency = "Monthly" | "Quarterly" | "Annual";

export type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  billingFrequency: BillingFrequency;
  price: number;
  groomingDiscountPercent: number;
  boardingDiscountPercent: number;
  includedNailTrims: number;
  includedBaths: number;
  loyaltyPointsMultiplier: number;
  isActive: boolean;
};

export type CustomerMembership = {
  id: string;
  customerId: string;
  planId: string;
  status: MembershipStatus;
  startDate: string;
  renewalDate: string;
  loyaltyPoints: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMembershipInput = Omit<CustomerMembership, "id" | "createdAt" | "updatedAt">;
