export type PetDocumentCategory =
  | "Vaccination"
  | "Medical"
  | "Grooming"
  | "Boarding"
  | "Medication"
  | "Behavioral"
  | "Insurance"
  | "Registration"
  | "Consent Form"
  | "Owner Document"
  | "Photo"
  | "Other";

export interface PetDocument {
  id: string;
  petId: string;
  documentName: string;
  originalFileName: string;
  storedFileName: string;
  category: PetDocumentCategory;
  description: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
  expirationDate: string | null;
}

export interface PetDocumentUploadInput {
  petId: string;
  file: File;
  category: PetDocumentCategory;
  description: string;
  expirationDate: string | null;
  uploadedBy?: string;
}

export interface PetDocumentSearch {
  query: string;
  category?: PetDocumentCategory;
  includeExpired?: boolean;
}

export const PET_DOCUMENT_CATEGORIES: readonly PetDocumentCategory[] = [
  "Vaccination",
  "Medical",
  "Grooming",
  "Boarding",
  "Medication",
  "Behavioral",
  "Insurance",
  "Registration",
  "Consent Form",
  "Owner Document",
  "Photo",
  "Other",
] as const;
