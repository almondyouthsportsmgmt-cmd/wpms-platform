import type {
  AvailabilityRequest,
  ScheduleEvent,
  TimeSlot,
} from "./schedulingTypes";

import { scheduleEngine } from "./scheduleEngine";

export interface RecommendationResult {
  recommendedDate: string;
  recommendedSlots: TimeSlot[];
  message: string;
}

export interface ServiceRecommendation {
  serviceId?: string;
  serviceName: string;
  weeksUntilReturn: number;
}

/**
 * Default grooming intervals.
 * These will eventually come from the Grooming Service module.
 */
const DEFAULT_INTERVALS: Record<string, number> = {
  "Full Groom": 6,
  "Bath": 4,
  "Nail Trim": 4,
  "De-Shed": 8,
  "Puppy Groom": 4,
};

class RecommendationService {
  /**
   * Determine recommended return date.
   */
  getReturnDate(
    serviceName: string,
    fromDate: Date = new Date(),
  ): Date {
    const weeks =
      DEFAULT_INTERVALS[serviceName] ?? 6;

    const result = new Date(fromDate);

    result.setDate(
      result.getDate() + weeks * 7,
    );

    return result;
  }

  /**
   * Suggest available appointments.
   */
  recommendAppointment(
    request: AvailabilityRequest,
    serviceName: string,
  ): RecommendationResult {
    const recommendedDate =
      this.getReturnDate(serviceName);

    const date =
      recommendedDate
        .toISOString()
        .substring(0, 10);

    const availability =
      scheduleEngine.getAvailability({
        ...request,
        date,
      });

    return {
      recommendedDate: date,
      recommendedSlots:
        availability.slots.filter(
          (slot) => slot.available,
        ),
      message:
        availability.slots.some(
          (slot) => slot.available,
        )
          ? "Recommended appointment found."
          : "No openings available on the recommended date.",
    };
  }

  /**
   * Find next available day.
   */
  findNextAvailableDay(
    request: AvailabilityRequest,
    maxSearchDays = 30,
  ): RecommendationResult {
    const searchDate = new Date(
      request.date,
    );

    for (
      let i = 0;
      i < maxSearchDays;
      i++
    ) {
      const date =
        searchDate
          .toISOString()
          .substring(0, 10);

      const availability =
        scheduleEngine.getAvailability({
          ...request,
          date,
        });

      const available =
        availability.slots.filter(
          (slot) => slot.available,
        );

      if (available.length > 0) {
        return {
          recommendedDate: date,
          recommendedSlots: available,
          message:
            "Next available opening found.",
        };
      }

      searchDate.setDate(
        searchDate.getDate() + 1,
      );
    }

    return {
      recommendedDate: "",
      recommendedSlots: [],
      message:
        "No availability found within the search period.",
    };
  }

  /**
   * Fill schedule gaps.
   */
  recommendGapFill(
    events: ScheduleEvent[],
  ): ScheduleEvent[] {
    return [...events].sort((a, b) => {
      return (
        new Date(a.start).getTime() -
        new Date(b.start).getTime()
      );
    });
  }

  /**
   * Recommend recurring services.
   */
  getRecurringRecommendation(
    serviceName: string,
  ): ServiceRecommendation {
    return {
      serviceName,
      weeksUntilReturn:
        DEFAULT_INTERVALS[serviceName] ?? 6,
    };
  }

  /**
   * Recommend future appointment at checkout.
   */
  recommendCheckoutAppointment(
    serviceName: string,
    request: AvailabilityRequest,
  ) {
    return this.recommendAppointment(
      request,
      serviceName,
    );
  }
}

export const recommendationService =
  new RecommendationService();