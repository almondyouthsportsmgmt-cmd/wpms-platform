import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import type { SmsSettings, SmsSettingsInput } from "./smsTypes";

const STORAGE_KEY = "wpms-demo-sms-settings";

const seed: SmsSettings = {
  id: "demo-sms-settings",
  provider: "Android Bridge",
  businessNumber: "850-555-0199",
  bridgeDeviceName: "Whimsical Paws Shop Phone",
  bridgeEndpoint: "http://192.168.1.25:8787",
  inboundWebhookSecret: "demo-secret",
  autoReplyEnabled: true,
  appointmentRemindersEnabled: true,
  boardingUpdatesEnabled: true,
  groomingReadyEnabled: true,
  quietHoursStart: "20:00",
  quietHoursEnd: "07:00",
  connectionStatus: "Connected",
  lastConnectionAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function readDemo(): SmsSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw) as SmsSettings;
}

function fromRow(row: Record<string, unknown>): SmsSettings {
  return {
    id: String(row.id),
    provider: String(row.provider ?? "Demo") as SmsSettings["provider"],
    businessNumber: String(row.business_number ?? ""),
    bridgeDeviceName: String(row.bridge_device_name ?? ""),
    bridgeEndpoint: String(row.bridge_endpoint ?? ""),
    inboundWebhookSecret: String(row.inbound_webhook_secret ?? ""),
    autoReplyEnabled: Boolean(row.auto_reply_enabled),
    appointmentRemindersEnabled: Boolean(row.appointment_reminders_enabled),
    boardingUpdatesEnabled: Boolean(row.boarding_updates_enabled),
    groomingReadyEnabled: Boolean(row.grooming_ready_enabled),
    quietHoursStart: String(row.quiet_hours_start ?? "20:00").slice(0, 5),
    quietHoursEnd: String(row.quiet_hours_end ?? "07:00").slice(0, 5),
    connectionStatus: String(row.connection_status ?? "Disconnected") as SmsSettings["connectionStatus"],
    lastConnectionAt: String(row.last_connection_at ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toRow(input: SmsSettingsInput) {
  return {
    provider: input.provider,
    business_number: input.businessNumber.trim(),
    bridge_device_name: input.bridgeDeviceName.trim() || null,
    bridge_endpoint: input.bridgeEndpoint.trim() || null,
    inbound_webhook_secret: input.inboundWebhookSecret.trim() || null,
    auto_reply_enabled: input.autoReplyEnabled,
    appointment_reminders_enabled: input.appointmentRemindersEnabled,
    boarding_updates_enabled: input.boardingUpdatesEnabled,
    grooming_ready_enabled: input.groomingReadyEnabled,
    quiet_hours_start: input.quietHoursStart,
    quiet_hours_end: input.quietHoursEnd,
    connection_status: input.connectionStatus,
  };
}

export async function getSmsSettings(): Promise<SmsSettings> {
  if (!isSupabaseConfigured) return readDemo();
  const { data, error } = await supabase.from("sms_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("SMS settings have not been configured.");
  return fromRow(data);
}

export async function saveSmsSettings(input: SmsSettingsInput): Promise<SmsSettings> {
  if (!isSupabaseConfigured) {
    const current = readDemo();
    const next: SmsSettings = {
      ...current,
      ...input,
      lastConnectionAt: input.connectionStatus === "Connected" ? new Date().toISOString() : current.lastConnectionAt,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  const { data: existing, error: readError } = await supabase.from("sms_settings").select("id").limit(1).maybeSingle();
  if (readError) throw readError;

  const query = existing
    ? supabase.from("sms_settings").update({ ...toRow(input), last_connection_at: input.connectionStatus === "Connected" ? new Date().toISOString() : null }).eq("id", existing.id)
    : supabase.from("sms_settings").insert({ ...toRow(input), last_connection_at: input.connectionStatus === "Connected" ? new Date().toISOString() : null });

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return fromRow(data);
}
