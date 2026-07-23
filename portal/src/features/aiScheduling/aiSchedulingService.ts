import { listAppointments } from "../appointments/appointmentService";
import { listEmployees } from "../employees/employeeService";
import { listPets } from "../pets/petService";
import type { Appointment } from "../appointments/appointmentTypes";
import type { Employee } from "../employees/employeeTypes";
import type { Pet } from "../pets/petTypes";
import type { SavedSchedulingPlan, SchedulingRequest, SchedulingSuggestion } from "./aiSchedulingTypes";

const STORAGE_KEY = "wpms-demo-ai-scheduling-plans";

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function overlaps(start: number, end: number, appointment: Appointment) {
  const appointmentStart = timeToMinutes(appointment.startTime);
  const appointmentEnd = timeToMinutes(appointment.endTime);
  return start < appointmentEnd && end > appointmentStart;
}

function eligibleStaff(employees: Employee[], service: SchedulingRequest["service"]) {
  const active = employees.filter((employee) => employee.status === "Active");
  if (service === "Boarding Check-In") {
    return active.filter((employee) => ["Owner", "Manager", "Boarding Attendant", "Receptionist"].includes(employee.role));
  }
  if (service === "Nail Trim") {
    return active.filter((employee) => ["Owner", "Manager", "Groomer", "Bather"].includes(employee.role));
  }
  return active.filter((employee) => ["Owner", "Manager", "Groomer"].includes(employee.role));
}

function scoreSuggestion(
  request: SchedulingRequest,
  suggestion: Omit<SchedulingSuggestion, "id" | "score" | "reasons" | "conflicts">,
  pet: Pet | undefined,
) {
  let score = 70;
  const reasons: string[] = [];
  const conflicts: string[] = [];

  if (request.preferredStaff && suggestion.staffName === request.preferredStaff) {
    score += 18;
    reasons.push("Matches the preferred staff member");
  }

  if (pet?.preferredGroomer && suggestion.staffName.toLowerCase().includes(pet.preferredGroomer.toLowerCase())) {
    score += 12;
    reasons.push("Matches the pet's preferred groomer");
  }

  const start = timeToMinutes(suggestion.startTime);
  if (start < 10 * 60) {
    score += 5;
    reasons.push("Uses an early-day opening");
  } else if (start > 15 * 60) {
    score -= 4;
    conflicts.push("Late-day appointment may reduce recovery time");
  }

  if (request.service === "Full Groom" && request.durationMinutes < 90) {
    score -= 8;
    conflicts.push("Full grooming is usually safer with a 90-minute block");
  }

  if (pet?.medicalAlerts || pet?.behaviorNotes) {
    score -= 3;
    reasons.push("Allows staff to review pet alerts before service");
  }

  return {
    score: Math.max(1, Math.min(99, score)),
    reasons,
    conflicts,
  };
}

export async function generateSchedulingSuggestions(request: SchedulingRequest): Promise<SchedulingSuggestion[]> {
  const [appointments, employees, pets] = await Promise.all([
    listAppointments(),
    listEmployees(),
    listPets(),
  ]);

  const pet = pets.find((item) => item.id === request.petId);
  const staff = eligibleStaff(employees, request.service)
    .filter((employee) => !request.preferredStaff || `${employee.firstName} ${employee.lastName}` === request.preferredStaff || true);

  const dayAppointments = appointments.filter(
    (appointment) => appointment.appointmentDate === request.preferredDate && !["Cancelled", "No Show"].includes(appointment.status),
  );

  const earliest = timeToMinutes(request.earliestTime);
  const latest = timeToMinutes(request.latestTime);
  const increment = 30;
  const results: SchedulingSuggestion[] = [];

  for (const employee of staff) {
    const staffName = `${employee.firstName} ${employee.lastName}`;
    for (let start = earliest; start + request.durationMinutes <= latest; start += increment) {
      const end = start + request.durationMinutes;
      const conflicts = dayAppointments.filter(
        (appointment) => appointment.assignedStaff === staffName && overlaps(start, end, appointment),
      );
      if (conflicts.length > 0) continue;

      const base = {
        date: request.preferredDate,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        staffName,
      };
      const scored = scoreSuggestion(request, base, pet);
      results.push({
        id: crypto.randomUUID(),
        ...base,
        ...scored,
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score || a.startTime.localeCompare(b.startTime))
    .slice(0, 6);
}

export function saveSchedulingPlan(request: SchedulingRequest, suggestion: SchedulingSuggestion): SavedSchedulingPlan {
  const raw = localStorage.getItem(STORAGE_KEY);
  const current = raw ? JSON.parse(raw) as SavedSchedulingPlan[] : [];
  const plan: SavedSchedulingPlan = {
    id: crypto.randomUUID(),
    request,
    selectedSuggestion: suggestion,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([plan, ...current].slice(0, 25)));
  return plan;
}

export function listSavedSchedulingPlans(): SavedSchedulingPlan[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) as SavedSchedulingPlan[] : [];
}
