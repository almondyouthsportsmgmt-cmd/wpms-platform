export type KennelType = "Standard" | "Luxury" | "Cat Condo" | "Isolation" | "Daycare";
export type KennelStatus = "Available" | "Reserved" | "Occupied" | "Cleaning" | "Maintenance";

export type Kennel = {
  id: string;
  name: string;
  zone: string;
  type: KennelType;
  capacity: number;
  status: KennelStatus;
  petId: string;
  customerId: string;
  checkInDate: string;
  checkOutDate: string;
  notes: string;
  updatedAt: string;
};

export type KennelInput = Omit<Kennel, "id" | "updatedAt">;
