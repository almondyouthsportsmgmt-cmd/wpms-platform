export type SmsProvider = "Demo" | "Android Bridge" | "Twilio" | "Telnyx";
export type SmsConnectionStatus = "Disconnected" | "Connecting" | "Connected" | "Error";

export type SmsSettings = {
  id: string;
  provider: SmsProvider;
  businessNumber: string;
  bridgeDeviceName: string;
  bridgeEndpoint: string;
  inboundWebhookSecret: string;
  autoReplyEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  boardingUpdatesEnabled: boolean;
  groomingReadyEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  connectionStatus: SmsConnectionStatus;
  lastConnectionAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SmsSettingsInput = Omit<SmsSettings, "id" | "createdAt" | "updatedAt" | "lastConnectionAt">;
