export type PortalAccessStatus = "Invited" | "Active" | "Suspended";

export type PortalAccess = {
  id: string;
  customerId: string;
  email: string;
  status: PortalAccessStatus;
  lastLoginAt: string;
  invitedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalAccessInput = {
  customerId: string;
  email: string;
  status: PortalAccessStatus;
};
