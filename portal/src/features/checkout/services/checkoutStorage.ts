import type {
  CheckoutSession,
  CheckoutStorageData,
} from "../types/checkoutTypes";

const STORAGE_KEY = "wpms-checkout-sessions";
const STORAGE_VERSION = 1;

function emptyStorage(): CheckoutStorageData {
  return {
    version: STORAGE_VERSION,
    sessions: [],
  };
}

function canUseStorage() {
  return typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined";
}

function normalizeStorage(
  value: unknown,
): CheckoutStorageData {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return emptyStorage();
  }

  const candidate =
    value as Partial<CheckoutStorageData>;

  if (!Array.isArray(candidate.sessions)) {
    return emptyStorage();
  }

  return {
    version: STORAGE_VERSION,
    sessions: candidate.sessions,
  };
}

export function readCheckoutStorage(): CheckoutStorageData {
  if (!canUseStorage()) {
    return emptyStorage();
  }

  const raw =
    window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return emptyStorage();
  }

  try {
    return normalizeStorage(
      JSON.parse(raw),
    );
  } catch {
    return emptyStorage();
  }
}

export function writeCheckoutStorage(
  data: CheckoutStorageData,
) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      sessions: data.sessions,
    }),
  );

  window.dispatchEvent(
    new CustomEvent(
      "wpms:checkout-storage-updated",
    ),
  );
}

export function listStoredCheckoutSessions() {
  return readCheckoutStorage().sessions;
}

export function getStoredCheckoutSession(
  sessionId: string,
) {
  return (
    listStoredCheckoutSessions().find(
      (session) =>
        session.id === sessionId,
    ) ?? null
  );
}

export function saveStoredCheckoutSession(
  session: CheckoutSession,
) {
  const sessions =
    listStoredCheckoutSessions();

  const exists = sessions.some(
    (current) =>
      current.id === session.id,
  );

  writeCheckoutStorage({
    version: STORAGE_VERSION,
    sessions: exists
      ? sessions.map((current) =>
          current.id === session.id
            ? session
            : current,
        )
      : [session, ...sessions],
  });

  return session;
}

export function removeStoredCheckoutSession(
  sessionId: string,
) {
  const sessions =
    listStoredCheckoutSessions();

  writeCheckoutStorage({
    version: STORAGE_VERSION,
    sessions: sessions.filter(
      (session) =>
        session.id !== sessionId,
    ),
  });
}

export function clearCheckoutStorage() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(
    STORAGE_KEY,
  );

  window.dispatchEvent(
    new CustomEvent(
      "wpms:checkout-storage-updated",
    ),
  );
}
