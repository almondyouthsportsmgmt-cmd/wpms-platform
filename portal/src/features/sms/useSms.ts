import { useCallback, useEffect, useState } from "react";
import { getSmsSettings, saveSmsSettings } from "./smsService";
import type { SmsSettings, SmsSettingsInput } from "./smsTypes";

export function useSms() {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSettings(await getSmsSettings());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load SMS settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function save(input: SmsSettingsInput) {
    const saved = await saveSmsSettings(input);
    setSettings(saved);
    return saved;
  }

  return { settings, loading, error, refresh, save };
}
