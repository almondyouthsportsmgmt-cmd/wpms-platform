export type PetSex = "Male" | "Female" | "Unknown";
export type PetSize = "Small" | "Medium" | "Large" | "Giant";

export type Pet = {
  id: string;
  customerId: string;
  name: string;
  species: string;
  breed: string;
  color: string;
  sex: PetSex;
  birthday: string;
  weightPounds: number | null;
  size: PetSize;
  microchipNumber: string;
  veterinarianName: string;
  veterinarianPhone: string;
  allergies: string;
  medicalAlerts: string;
  behaviorNotes: string;
  groomingNotes: string;
  preferredGroomer: string;
  vaccinationRabiesExpiresOn: string;
  vaccinationBordetellaExpiresOn: string;
  vaccinationDhppExpiresOn: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PetInput = Omit<Pet, "id" | "createdAt" | "updatedAt">;
