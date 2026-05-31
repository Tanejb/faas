import { functionsBaseUrl } from "../firebase";

export async function fetchHealth() {
  const res = await fetch(`${functionsBaseUrl}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json();
}
