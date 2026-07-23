export type SchedulingService = "Full Groom" | "Bath & Brush" | "Nail Trim" | "Boarding Check-In" | "Other";

export type SchedulingRequest = {
  customerId: string;
  petId: string;
  service: SchedulingService;
  preferredDate: string;
  preferredStaff: string;
  earliestTime: string;
  latestTime: string;
  durationMinutes: number;
};

export type SchedulingSuggestion = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  staffName: string;
  score: number;
  reasons: string[];
  conflicts: string[];
};

export type SavedSchedulingPlan = {
  id: string;
  request: SchedulingRequest;
  selectedSuggestion: SchedulingSuggestion;
  createdAt: string;
};
