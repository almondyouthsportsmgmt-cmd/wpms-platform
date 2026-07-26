import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import type { Customer } from "../customers/customerTypes";
import { useGroomingServices } from "../grooming/useGroomingServices";
import type { Pet } from "../pets/petTypes";
import type {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
  AppointmentType,
} from "./appointmentTypes";

const statuses: AppointmentStatus[] = [
  "Scheduled",
  "Confirmed",
  "Checked In",
  "In Service",
  "Ready for Pickup",
  "Completed",
  "Cancelled",
  "No Show",
];

function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
}

function initial(): AppointmentInput {
  return {
    customerId: "",
    petId: "",
    appointmentType: "Grooming",
    serviceId: "",
    serviceName: "",
    appointmentDate: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "10:30",
    assignedStaff: "",
    status: "Scheduled",
    priceEstimate: null,
    notes: "",
    reminderSent: false,
  };
}

export function AppointmentFormModal({
  appointment,
  customers,
  pets,
  open,
  onClose,
  onSave,
}: {
  appointment: Appointment | null;
  customers: Customer[];
  pets: Pet[];
  open: boolean;
  onClose: () => void;
  onSave: (input: AppointmentInput, id?: string) => Promise<void>;
}) {
  const { services } = useGroomingServices();
  const [form, setForm] = useState<AppointmentInput>(initial());
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const eligiblePets = useMemo(
    () => pets.filter((pet) => pet.customerId === form.customerId && pet.isActive),
    [form.customerId, pets],
  );

  const selectedPet = pets.find((pet) => pet.id === form.petId);

  const eligibleServices = useMemo(
    () =>
      services.filter((service) => {
        if (!service.isActive) return false;
        if (!selectedPet) return true;
        if (service.species !== "All" && service.species !== selectedPet.species) {
          return false;
        }
        const weight = selectedPet.weightPounds;
        if (
          weight != null &&
          service.minimumWeight != null &&
          weight < service.minimumWeight
        ) return false;
        if (
          weight != null &&
          service.maximumWeight != null &&
          weight > service.maximumWeight
        ) return false;
        return true;
      }),
    [selectedPet, services],
  );

  useEffect(() => {
    if (!open) return;

    setForm(
      appointment
        ? {
            customerId: appointment.customerId,
            petId: appointment.petId,
            appointmentType: appointment.appointmentType,
            serviceId: appointment.serviceId ?? "",
            serviceName: appointment.serviceName,
            appointmentDate: appointment.appointmentDate,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            assignedStaff: appointment.assignedStaff,
            status: appointment.status,
            priceEstimate: appointment.priceEstimate,
            notes: appointment.notes,
            reminderSent: appointment.reminderSent,
          }
        : initial(),
    );
    setError("");
  }, [appointment, open]);

  if (!open) return null;

  function patch<K extends keyof AppointmentInput>(
    key: K,
    value: AppointmentInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectService(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) {
      patch("serviceId", "");
      return;
    }

    setForm((current) => ({
      ...current,
      serviceId: service.id,
      serviceName: service.name,
      appointmentType: service.appointmentType as AppointmentType,
      priceEstimate: service.price,
      endTime: addMinutes(
        current.startTime,
        service.durationMinutes + service.bufferMinutes,
      ),
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (
      !form.customerId ||
      !form.petId ||
      !form.serviceId ||
      !form.appointmentDate ||
      !form.startTime ||
      !form.endTime
    ) {
      setError("Customer, pet, service, date, start time, and end time are required.");
      return;
    }

    setSaving(true);

    try {
      await onSave(
        {
          ...form,
          assignedStaff: form.assignedStaff.trim(),
          notes: form.notes.trim(),
        },
        appointment?.id,
      );
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save appointment.");
    } finally {
      setSaving(false);
    }
  }

  const selectedService = services.find((item) => item.id === form.serviceId);

  return (
    <div className="modal-layer">
      <button type="button" className="modal-backdrop" onClick={onClose} />
      <div
        className="modal-card appointment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">Schedule</span>
            <h2 id="appointment-modal-title">
              {appointment ? "Edit appointment" : "New appointment"}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-grid two-column">
            <label className="field">
              <span>Customer *</span>
              <select
                value={form.customerId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerId: event.target.value,
                    petId: "",
                    serviceId: "",
                    serviceName: "",
                    priceEstimate: null,
                  }))
                }
              >
                <option value="">Select customer</option>
                {customers.filter((item) => item.isActive).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.firstName} {item.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Pet *</span>
              <select
                value={form.petId}
                disabled={!form.customerId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    petId: event.target.value,
                    serviceId: "",
                    serviceName: "",
                    priceEstimate: null,
                  }))
                }
              >
                <option value="">Select pet</option>
                {eligiblePets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.breed || item.species}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>Grooming service *</span>
              <select
                value={form.serviceId}
                onChange={(event) => selectService(event.target.value)}
              >
                <option value="">Select service</option>
                {eligibleServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(service.price)}
                  </option>
                ))}
              </select>
            </label>

            {selectedService && (
              <div className="appointment-service-preview field-wide">
                <div>
                  <span>Service</span>
                  <strong>{selectedService.name}</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(selectedService.price)}
                  </strong>
                </div>
                <div>
                  <span>Reserved time</span>
                  <strong>
                    {selectedService.durationMinutes + selectedService.bufferMinutes} min
                  </strong>
                </div>
              </div>
            )}

            <label className="field">
              <span>Date *</span>
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(event) => patch("appointmentDate", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  patch("status", event.target.value as AppointmentStatus)
                }
              >
                {statuses.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Start time *</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => {
                  const startTime = event.target.value;
                  setForm((current) => ({
                    ...current,
                    startTime,
                    endTime: selectedService
                      ? addMinutes(
                          startTime,
                          selectedService.durationMinutes +
                            selectedService.bufferMinutes,
                        )
                      : current.endTime,
                  }));
                }}
              />
            </label>

            <label className="field">
              <span>End time *</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => patch("endTime", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Assigned staff</span>
              <input
                value={form.assignedStaff}
                onChange={(event) => patch("assignedStaff", event.target.value)}
                placeholder="Lisa"
              />
            </label>

            <label className="field">
              <span>Price estimate</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceEstimate ?? ""}
                onChange={(event) =>
                  patch(
                    "priceEstimate",
                    event.target.value === "" ? null : Number(event.target.value),
                  )
                }
              />
            </label>
          </div>

          <label className="field">
            <span>Appointment notes</span>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => patch("notes", event.target.value)}
            />
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.reminderSent}
              onChange={(event) => patch("reminderSent", event.target.checked)}
            />
            <span>Reminder sent</span>
          </label>

          <div className="modal-actions">
            <AppButton type="button" variant="secondary" onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={saving}>
              {saving ? "Saving..." : appointment ? "Save changes" : "Book appointment"}
            </AppButton>
          </div>
        </form>
      </div>
    </div>
  );
}
