type SoundKind = "message" | "appointment";

const SOUND_SETTING_KEY = "wpms-notification-sounds-enabled";
let audioContext: AudioContext | null = null;
let unlocked = false;
let installed = false;

function enabled() {
  return localStorage.getItem(SOUND_SETTING_KEY) !== "false";
}

function context() {
  audioContext ??= new AudioContext();
  return audioContext;
}

async function unlock() {
  if (unlocked) return;
  try {
    const value = context();
    if (value.state === "suspended") await value.resume();
    unlocked = value.state === "running";
  } catch {
    unlocked = false;
  }
}

function tone(frequency: number, startsAt: number, duration: number, gain = 0.08) {
  const value = context();
  const oscillator = value.createOscillator();
  const volume = value.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  volume.gain.setValueAtTime(0.0001, startsAt);
  volume.gain.exponentialRampToValueAtTime(gain, startsAt + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(volume);
  volume.connect(value.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.02);
}

export async function playNotificationSound(kind: SoundKind) {
  if (!enabled()) return;
  await unlock();
  if (!unlocked) return;
  const now = context().currentTime + 0.01;
  if (kind === "message") {
    tone(740, now, 0.11);
    tone(980, now + 0.13, 0.14);
  } else {
    tone(523, now, 0.12);
    tone(659, now + 0.13, 0.12);
    tone(784, now + 0.26, 0.18);
  }
}

export function setNotificationSoundsEnabled(value: boolean) {
  localStorage.setItem(SOUND_SETTING_KEY, String(value));
}

export function notificationSoundsEnabled() {
  return enabled();
}

export function installNotificationSounds() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const unlockOnce = () => { void unlock(); };
  window.addEventListener("pointerdown", unlockOnce, { passive: true });
  window.addEventListener("keydown", unlockOnce);
  window.addEventListener("wpms:message-received", () => void playNotificationSound("message"));
  window.addEventListener("wpms:appointment-request-received", () => void playNotificationSound("appointment"));
}
