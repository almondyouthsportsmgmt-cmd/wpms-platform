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
    background: "#dcfce7",
    border: "#22c55e",
    text: "#166534",
  },
  boarding: {
    background: "#dbeafe",
    border: "#3b82f6",
    text: "#1d4ed8",
  },
  "boarding-checkin": {
    background: "#fef3c7",
    border: "#f59e0b",
    text: "#92400e",
  },
  "boarding-checkout": {
    background: "#ffedd5",
    border: "#fb923c",
    text: "#9a3412",
  },
  maintenance: {
    background: "#fee2e2",
    border: "#ef4444",
    text: "#991b1b",
  },
  "employee-pto": {
    background: "#ede9fe",
    border: "#8b5cf6",
    text: "#5b21b6",
  },
  blocked: {
    background: "#e5e7eb",
    border: "#6b7280",
    text: "#374151",
  },
  holiday: {
    background: "#fce7f3",
    border: "#ec4899",
    text: "#9d174d",
  },
};

export function getEventColor(type: ScheduleEventType) {
  return COLORS[type];
}

export function getStatusOpacity(status: ScheduleStatus) {
  if (status === "completed") return 0.55;
  if (status === "cancelled") return 0.35;
  return 1;
}
