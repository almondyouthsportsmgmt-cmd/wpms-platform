export type CalendarViewSettings = {
  openingHour: number;
  closingHour: number;
  showClosedHours: boolean;
  slotMinutes: 15 | 30 | 60;
};

const STORAGE_KEY = "wpms-calendar-view-settings";

export const DEFAULT_CALENDAR_VIEW_SETTINGS: CalendarViewSettings = {
  openingHour: 7,
  closingHour: 19,
  showClosedHours: false,
  slotMinutes: 15,
};

export function loadCalendarViewSettings(): CalendarViewSettings {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return DEFAULT_CALENDAR_VIEW_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CalendarViewSettings>;

    return {
      openingHour:
        typeof parsed.openingHour === "number"
          ? parsed.openingHour
          : DEFAULT_CALENDAR_VIEW_SETTINGS.openingHour,
      closingHour:
        typeof parsed.closingHour === "number"
          ? parsed.closingHour
          : DEFAULT_CALENDAR_VIEW_SETTINGS.closingHour,
      showClosedHours:
        typeof parsed.showClosedHours === "boolean"
          ? parsed.showClosedHours
          : DEFAULT_CALENDAR_VIEW_SETTINGS.showClosedHours,
      slotMinutes:
        parsed.slotMinutes === 15 ||
        parsed.slotMinutes === 30 ||
        parsed.slotMinutes === 60
          ? parsed.slotMinutes
          : DEFAULT_CALENDAR_VIEW_SETTINGS.slotMinutes,
    };
  } catch {
    return DEFAULT_CALENDAR_VIEW_SETTINGS;
  }
}

export function saveCalendarViewSettings(
  settings: CalendarViewSettings,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(settings),
  );
}
