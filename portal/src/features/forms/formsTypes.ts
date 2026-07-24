export type FormType = "Grooming Consent" | "Boarding Agreement" | "Medication Authorization" | "New Client Intake" | "Vaccination Waiver";
export type FormStatus = "Draft" | "Sent" | "Signed" | "Declined" | "Expired";

export type ClientForm = {
  id: string;
  customerId: string;
  petId: string;
  formType: FormType;
  title: string;
  status: FormStatus;
  sentAt: string;
  signedAt: string;
  expiresAt: string;
  signerName: string;
  signerEmail: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormInput = Omit<ClientForm, "id" | "createdAt" | "updatedAt" | "signedAt"> & { signedAt?: string };
