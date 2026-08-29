const KEY = "orquestrador_device_id";

/** Gera/lê um identificador anônimo por navegador. Só usar no cliente. */
export function getDeviceId(): string {
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(KEY, id);
  return id;
}
