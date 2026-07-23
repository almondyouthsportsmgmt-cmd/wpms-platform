export type AppointmentStatus =
  | "Scheduled"
  | "Confirmed"
  | "Checked In"
  | "In Service"
  | "Ready for Pickup"
  | "Completed"
  | "Cancelled"
  | "No Show";

export type AppointmentType = "Grooming" | "Bath" | "Nails" | "Boarding" | "Other";

export type Appointment = {
  id: string;
  customerId: string;
  petId: string;
  appointmentType: AppointmentType;
  serviceName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  assignedStaff: string;
  status: AppointmentStatus;
  priceEstimate: number | null;
  notes: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentInput = Omit<Appointment, "id" | "createdAt" | "updatedAt">;
