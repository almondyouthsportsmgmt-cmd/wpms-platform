import { useCallback, useEffect, useState } from "react";
import { changeAppointmentStatus, createAppointment, listAppointments, updateAppointment } from "./appointmentService";
import type { Appointment, AppointmentInput } from "./appointmentTypes";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAppointments(await listAppointments());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: AppointmentInput, id?: string) {
    const saved = id ? await updateAppointment(id, input) : await createAppointment(input);
    setAppointments((current) => {
      const next = id ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      return next.sort((a, b) => `${a.appointmentDate}T${a.startTime}`.localeCompare(`${b.appointmentDate}T${b.startTime}`));
    });
    return saved;
  }

  async function setStatus(id: string, status: Appointment["status"]) {
    const saved = await changeAppointmentStatus(id, status);
    setAppointments((current) => current.map((item) => item.id === id ? saved : item));
    return saved;
  }

  return { appointments, loading, error, refresh, save, setStatus };
}
