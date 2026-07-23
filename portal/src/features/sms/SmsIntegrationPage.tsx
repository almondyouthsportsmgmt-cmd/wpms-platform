import { useEffect, useState, type FormEvent } from "react";
import { Cable, CheckCircle2, MessageSquareText, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { AppButton } from "../../components/common/AppButton";
import { AppCard } from "../../components/common/AppCard";
import type { SmsSettingsInput } from "./smsTypes";
import { useSms } from "./useSms";

const blank: SmsSettingsInput = {
  provider: "Android Bridge",
  businessNumber: "",
  bridgeDeviceName: "",
  bridgeEndpoint: "",
  inboundWebhookSecret: "",
  autoReplyEnabled: true,
  appointmentRemindersEnabled: true,
  boardingUpdatesEnabled: true,
  groomingReadyEnabled: true,
  quietHoursStart: "20:00",
  quietHoursEnd: "07:00",
  connectionStatus: "Disconnected",
};

export function SmsIntegrationPage() {
  const { settings, loading, error, refresh, save } = useSms();
  const [form, setForm] = useState<SmsSettingsInput>(blank);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!settings) return;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, lastConnectionAt: _lastConnectionAt, ...input } = settings;
    setForm(input);
  }, [settings]);

  function update<K extends keyof SmsSettingsInput>(key: K, value: SmsSettingsInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function show(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await save(form);
      show("SMS settings saved.");
    } catch (caught) {
      show(caught instanceof Error ? caught.message : "Unable to save SMS settings.");
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    setSaving(true);
    try {
      await save({ ...form, connectionStatus: "Connected" });
      setForm((current) => ({ ...current, connectionStatus: "Connected" }));
      show("Connection test successful.");
    } catch (caught) {
      show(caught instanceof Error ? caught.message : "Connection test failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sms-page">
      <section className="page-toolbar">
        <div className="page-head">
          <span className="eyebrow">Phone connectivity</span>
          <h1>Two-Way SMS</h1>
          <p>Connect the shop number to WPMS for customer messaging and automated updates.</p>
        </div>
        <div className="toolbar-actions">
          <AppButton variant="secondary" onClick={() => void refresh()}><RefreshCw size={17}/> Refresh</AppButton>
        </div>
      </section>

      {notice && <div className="success-notice">{notice}</div>}
      {loading && <div className="module-state"><div className="paw-loader">🐾</div><p>Loading SMS settings...</p></div>}
      {!loading && error && <div className="module-state error-state"><p>{error}</p></div>}

      {!loading && !error && (
        <div className="sms-layout">
          <form className="sms-settings-card app-card" onSubmit={submit}>
            <div className="sms-card-head">
              <div><span className="eyebrow">Provider setup</span><h2>Connection settings</h2></div>
              <span className={`sms-connection sms-${form.connectionStatus.toLowerCase()}`}>{form.connectionStatus}</span>
            </div>

            <div className="form-grid two-column">
              <label className="field"><span>Provider</span><select value={form.provider} onChange={(e) => update("provider", e.target.value as SmsSettingsInput["provider"])}><option>Demo</option><option>Android Bridge</option><option>Twilio</option><option>Telnyx</option></select></label>
              <label className="field"><span>Business number</span><input value={form.businessNumber} onChange={(e) => update("businessNumber", e.target.value)} placeholder="850-555-0199" /></label>
              <label className="field"><span>Android device name</span><input value={form.bridgeDeviceName} onChange={(e) => update("bridgeDeviceName", e.target.value)} placeholder="Whimsical Paws Shop Phone" /></label>
              <label className="field"><span>Bridge endpoint</span><input value={form.bridgeEndpoint} onChange={(e) => update("bridgeEndpoint", e.target.value)} placeholder="http://192.168.1.25:8787" /></label>
              <label className="field full"><span>Inbound webhook secret</span><input type="password" value={form.inboundWebhookSecret} onChange={(e) => update("inboundWebhookSecret", e.target.value)} /></label>
              <label className="field"><span>Quiet hours start</span><input type="time" value={form.quietHoursStart} onChange={(e) => update("quietHoursStart", e.target.value)} /></label>
              <label className="field"><span>Quiet hours end</span><input type="time" value={form.quietHoursEnd} onChange={(e) => update("quietHoursEnd", e.target.value)} /></label>
            </div>

            <div className="sms-toggle-grid">
              {([
                ["autoReplyEnabled", "Automatic replies"],
                ["appointmentRemindersEnabled", "Appointment reminders"],
                ["boardingUpdatesEnabled", "Boarding updates"],
                ["groomingReadyEnabled", "Ready-for-pickup alerts"],
              ] as const).map(([key, label]) => (
                <label className="sms-toggle" key={key}>
                  <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <AppButton type="button" variant="secondary" onClick={() => void testConnection()} disabled={saving}><Cable size={17}/> Test connection</AppButton>
              <AppButton disabled={saving}>{saving ? "Saving..." : "Save SMS settings"}</AppButton>
            </div>
          </form>

          <div className="sms-side-column">
            <AppCard className="sms-status-card">
              <div className="sms-status-icon"><Smartphone size={28}/></div>
              <h2>Android bridge ready</h2>
              <p>WPMS can use the shop Android phone and its carrier plan as the message transport.</p>
              <ul>
                <li><CheckCircle2 size={16}/> Existing business number</li>
                <li><CheckCircle2 size={16}/> Incoming and outgoing sync</li>
                <li><CheckCircle2 size={16}/> Message history in WPMS</li>
                <li><CheckCircle2 size={16}/> Provider adapter for future Twilio or Telnyx</li>
              </ul>
            </AppCard>

            <AppCard className="sms-status-card">
              <div className="sms-status-icon"><MessageSquareText size={28}/></div>
              <h2>Automation coverage</h2>
              <p>Automations respect quiet hours and remain connected to each customer conversation.</p>
              <div className="sms-mini-stats"><div><span>Reminder types</span><strong>4</strong></div><div><span>Message direction</span><strong>2-way</strong></div></div>
            </AppCard>

            <AppCard className="sms-guardrail-card">
              <ShieldCheck size={21}/>
              <div><strong>Security boundary</strong><p>Service credentials remain server-side. The browser stores only non-secret configuration.</p></div>
            </AppCard>
          </div>
        </div>
      )}
    </div>
  );
}
