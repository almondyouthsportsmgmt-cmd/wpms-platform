import { useCallback } from "react";

import { appointmentScheduler } from "../appointments/appointmentScheduler";

import type {
  Conflict,
  ScheduleEvent,
} from "../scheduling/schedulingTypes";

export type CalendarMoveResult = {
  success: boolean;
  conflicts?: Conflict[];
};

export function useCalendarDragDrop(
  reload: () => Promise<void>,
) {
  const moveEvent = useCallback(
    async (
      event: ScheduleEvent,
      start: Date,
      end: Date,
    ): Promise<CalendarMoveResult> => {
      if (event.type !== "grooming") {
        return {
          success: false,
          conflicts: [
            {
              resourceId: "",
              resourceName: "",
              existingEventId: event.id,
              existingEventTitle: event.title,
              existingStart: event.start,
              existingEnd: event.end,
              reason:
                "Boarding drag-and-drop will be connected in the boarding integration step.",
            },
          ],
        };
      }

      const appointmentId =
        event.referenceId ||
        event.id.replace(/^appointment-/, "");

      const result = appointmentScheduler.move(
        appointmentId,
        start.toISOString(),
        end.toISOString(),
      );

      if (!result.success) {
        return {
          success: false,
          conflicts: result.conflicts,
        };
      }

      await reload();

      return {
        success: true,
      };
    },
    [reload],
  );

  return {
    moveEvent,
  };
}
