import type {
  ScheduleEventType,
  ScheduleStatus,
} from "../scheduling/schedulingTypes";

export interface CalendarColor {
  background: string;
  border: string;
  text: string;
}

const COLORS: Record<ScheduleEventType, CalendarColor> = {
  grooming: {
    background: "#DCFCE7",
    border: "#22C55E",
    text: "#166534",
  },

  boarding: {
    background: "#DBEAFE",
    border: "#3B82F6",
    text: "#1D4ED8",
  },

  "boarding-checkin": {
    background: "#FEF3C7",
    border: "#F59E0B",
    text: "#92400E",
  },

  "boarding-checkout": {
    background: "#FED7AA",
    border: "#FB923C",
    text: "#9A3412",
  },

  maintenance: {
    background: "#FEE2E2",
    border: "#EF4444",
    text: "#991B1B",
  },

  "employee-pto": {
    background: "#EDE9FE",
    border: "#8B5CF6",
    text: "#5B21B6",
  },

  blocked: {
    background: "#E5E7EB",
    border: "#6B7280",
    text: "#374151",
  },

  holiday: {
    background: "#FCE7F3",
    border: "#EC4899",
    text: "#9D174D",
  },
};

export function getEventColor(
  type: ScheduleEventType,
): CalendarColor {
  return COLORS[type];
}

export function getStatusOpacity(
  status: ScheduleStatus,
): number {
  switch (status) {
    case "completed":
      return 0.45;

    case "cancelled":
      return 0.25;

    default:
      return 1;
  }
}