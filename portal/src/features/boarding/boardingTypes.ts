export type BoardingStatus =
  | "Reserved"
  | "Checked In"
  | "In Stay"
  | "Ready for Checkout"
  | "Checked Out"
  | "Cancelled";

export type FeedingFrequency = "Once Daily" | "Twice Daily" | "Three Times Daily" | "Custom";

export type BoardingStay = {
  id: string;
  customerId: string;
  petId: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  kennelName: string;
  status: BoardingStatus;
  feedingFrequency: FeedingFrequency;
  foodInstructions: string;
  medicationInstructions: string;
  walkInstructions: string;
  playtimeInstructions: string;
  emergencyNotes: string;
  belongings: string;
  dailyRate: number;
  depositAmount: number;
  photoUpdatesEnabled: boolean;
  veterinarianReleaseConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BoardingStayInput = Omit<BoardingStay, "id" | "createdAt" | "updatedAt">;
