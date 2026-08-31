const KEY = "device_id";
const LEGACY_KEY = "orquestrador_device_id";

/** Gera/lê um identificador anônimo por navegador. Só usar no cliente. */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
  if (existing) {
    window.localStorage.setItem(KEY, existing);
    return existing;
  }
  const id = crypto.randomUUID();
  window.localStorage.setItem(KEY, id);
  return id;
}
