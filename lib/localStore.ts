export function saveForm<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
export function loadForm<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
}
