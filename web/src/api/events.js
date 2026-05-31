import { functionsBaseUrl } from "../firebase";

export async function listEvents() {
  const res = await fetch(`${functionsBaseUrl}/listEvents`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load events (${res.status})`);
  }
  const data = await res.json();
  return data.events || [];
}

export async function getEventDetails(eventId) {
  const url = new URL(`${functionsBaseUrl}/getEventDetails`);
  url.searchParams.set("eventId", eventId);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Failed to load event (${res.status})`);
  }
  return res.json();
}
