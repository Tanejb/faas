import { useState } from "react";
import { fetchHealth } from "../api/health";
import ProfileCard from "../components/ProfileCard";
import { useEmulators } from "../firebase";

export default function AccountPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCheckHealth() {
    setLoading(true);
    setError("");
    setHealth(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ProfileCard />
      <section className="card">
        <h2>Backend health</h2>
        <p className="hint">Emulators: {useEmulators ? "on" : "off"}</p>
        <button type="button" onClick={onCheckHealth} disabled={loading}>
          {loading ? "Checking…" : "Check /health"}
        </button>
        {error && <p className="error">{error}</p>}
        {health && (
          <pre className="json">{JSON.stringify(health, null, 2)}</pre>
        )}
      </section>
    </>
  );
}
