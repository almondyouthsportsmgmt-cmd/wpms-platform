import { useCallback, useEffect, useState } from "react";
import { listReminders, saveReminder, updateReminderStatus } from "./reminderService";
import type { AutomatedReminder, ReminderInput, ReminderStatus } from "./reminderTypes";

export function useReminders() {
  const [reminders, setReminders] = useState<AutomatedReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReminders(await listReminders());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: ReminderInput, id?: string) {
    const saved = await saveReminder(input, id);
    setReminders((current) => {
      const next = id ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      return next.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    });
    return saved;
  }

  async function setStatus(id: string, status: ReminderStatus) {
    const saved = await updateReminderStatus(id, status);
    setReminders((current) => current.map((item) => item.id === id ? saved : item));
    return saved;
  }

  return { reminders, loading, error, refresh, save, setStatus };
}
