export type GroomingStage =
  | "Checked In"
  | "Bath"
  | "Drying"
  | "Haircut"
  | "Nails"
  | "Finishing"
  | "Ready for Pickup"
  | "Picked Up";

export type GroomingSession = {
  id: string;
  appointmentId: string;
  petId: string;
  customerId: string;
  groomer: string;
  stage: GroomingStage;
  checkInAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  bathComplete: boolean;
  dryingComplete: boolean;
  haircutComplete: boolean;
  nailsComplete: boolean;
  earsComplete: boolean;
  teethComplete: boolean;
  finalNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type GroomingSessionInput = Omit<GroomingSession, "id" | "createdAt" | "updatedAt">;
