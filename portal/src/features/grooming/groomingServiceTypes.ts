export type GroomingServiceCategory =
  | "Full Groom"
  | "Bath & Brush"
  | "Cat Grooming"
  | "Nail Services"
  | "Spa Add-Ons"
  | "Other";

export type GroomingService = {
  id: string;
  name: string;
  category: GroomingServiceCategory;
  description: string;
  appointmentType: "Grooming" | "Bath" | "Nails" | "Other";
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  taxable: boolean;
  bookOnline: boolean;
  species: "Dog" | "Cat" | "All";
  minimumWeight: number | null;
  maximumWeight: number | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GroomingServiceInput = Omit<
  GroomingService,
  "id" | "createdAt" | "updatedAt"
>;
