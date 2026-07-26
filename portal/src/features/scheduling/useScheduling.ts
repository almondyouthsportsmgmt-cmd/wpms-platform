import { useCallback, useMemo, useState } from "react";

import { scheduleEngine } from "./scheduleEngine";

import type {
  AvailabilityRequest,
  AvailabilityResult,
  BookingRequest,
  BookingResult,
  ConflictResult,
  ScheduleEvent,
} from "./schedulingTypes";

export function useScheduling() {
  const [events, setEvents] = useState<ScheduleEvent[]>(
    scheduleEngine.getEvents(),
  );

  const refresh = useCallback(() => {
    setEvents(scheduleEngine.getEvents());
  }, []);

  const load = useCallback(
    (items: ScheduleEvent[]) => {
      scheduleEngine.load(items);
      refresh();
    },
    [refresh],
  );

  const clear = useCallback(() => {
    scheduleEngine.clear();
    refresh();
  }, [refresh]);

  const availability = useCallback(
    (
      request: AvailabilityRequest,
    ): AvailabilityResult => {
      return scheduleEngine.getAvailability(request);
    },
    [],
  );

  const validate = useCallback(
    (
      event: ScheduleEvent,
    ): ConflictResult => {
      return scheduleEngine.validate(event);
    },
    [],
  );

  const create = useCallback(
    (
      request: BookingRequest,
    ): BookingResult => {
      const result = scheduleEngine.book(request);

      if (result.success) {
        refresh();
      }

      return result;
    },
    [refresh],
  );

  const update = useCallback(
    (
      event: ScheduleEvent,
    ): BookingResult => {
      const result = scheduleEngine.update(event);

      if (result.success) {
        refresh();
      }

      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    (id: string) => {
      scheduleEngine.delete(id);
      refresh();
    },
    [refresh],
  );

  const move = useCallback(
    (
      id: string,
      start: string,
      end: string,
    ): BookingResult => {
      const result = scheduleEngine.move(
        id,
        start,
        end,
      );

      if (result.success) {
        refresh();
      }

      return result;
    },
    [refresh],
  );

  const findEvent = useCallback(
    (id: string) => {
      return scheduleEngine.getEvent(id);
    },
    [],
  );

  const getResourceSchedule = useCallback(
    (resourceId: string) => {
      return scheduleEngine.getResourceSchedule(
        resourceId,
      );
    },
    [],
  );

  const isResourceAvailable = useCallback(
    (
      resourceId: string,
      start: string,
      end: string,
    ) => {
      return scheduleEngine.isResourceAvailable(
        resourceId,
        start,
        end,
      );
    },
    [],
  );

  return useMemo(
    () => ({
      events,

      load,

      clear,

      refresh,

      availability,

      validate,

      create,

      update,

      remove,

      move,

      findEvent,

      getResourceSchedule,

      isResourceAvailable,
    }),
    [
      events,
      load,
      clear,
      refresh,
      availability,
      validate,
      create,
      update,
      remove,
      move,
      findEvent,
      getResourceSchedule,
      isResourceAvailable,
    ],
  );
}