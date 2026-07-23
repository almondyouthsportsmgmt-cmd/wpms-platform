export type MobileTaskType = "Grooming" | "Boarding" | "Pickup" | "Medication" | "Cleaning";
export type MobileTaskStatus = "Pending" | "In Progress" | "Completed";

export type MobileTask = {
  id: string;
  employeeName: string;
  petName: string;
  customerName: string;
  type: MobileTaskType;
  title: string;
  scheduledTime: string;
  location: string;
  status: MobileTaskStatus;
  notes: string;
  updatedAt: string;
};

export type ShiftSession = {
  id: string;
  employeeName: string;
  clockInAt: string;
  clockOutAt: string | null;
  breakMinutes: number;
};
