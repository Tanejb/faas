import { useState } from "react";
import { fetchHealth } from "./api/health";
import { projectId, useEmulators } from "./firebase";
import "./App.css";

function App() {
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
    <div className="app">
      <header className="app-header">
        <h1>CampusHub</h1>
        <p className="subtitle">Serverless campus events — frontend (F0)</p>
      </header>

      <section className="card">
        <h2>Environment</h2>
        <ul className="meta">
          <li>
            <strong>Project:</strong> {projectId}
          </li>
          <li>
            <strong>Emulators:</strong> {useEmulators ? "on" : "off"}
          </li>
        </ul>
        <p className="hint">
          Start backend first: <code>npm run emulators</code> (repo root).
        </p>
      </section>

      <section className="card">
        <h2>Backend health</h2>
        <button type="button" onClick={onCheckHealth} disabled={loading}>
          {loading ? "Checking…" : "Check /health"}
        </button>
        {error && <p className="error">{error}</p>}
        {health && (
          <pre className="json">{JSON.stringify(health, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}

export default App;
