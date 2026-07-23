export type TimelineEventType = "Grooming" | "Boarding" | "Health" | "Photo" | "Note";

export type PetTimelineEvent = {
  id: string;
  petId: string;
  eventType: TimelineEventType;
  title: string;
  description: string;
  eventDate: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  reportCard: {
    coatCondition: string;
    behavior: string;
    servicesCompleted: string[];
    staffNotes: string;
  } | null;
  createdAt: string;
};

export type PetTimelineEventInput = Omit<PetTimelineEvent, "id" | "createdAt">;
