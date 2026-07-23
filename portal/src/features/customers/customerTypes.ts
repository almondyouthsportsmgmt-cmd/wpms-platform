export type ContactMethod = "Text" | "Call" | "Email";

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  mobilePhone: string;
  homePhone: string;
  email: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelationship: string;
  preferredContactMethod: ContactMethod;
  marketingOptIn: boolean;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;
